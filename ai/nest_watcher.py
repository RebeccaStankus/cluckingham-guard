"""
nest_watcher.py — monitors the nest box for hen occupancy using YOLOv8.

Usage:
  python nest_watcher.py              # run watcher, posts events to API
  python nest_watcher.py --calibrate  # save one frame to calibrate.jpg so you can measure ROI coords
"""

import os
import cv2
import time
import datetime
import requests
import argparse
from pathlib import Path
from ultralytics import YOLO

# Load .env from the project root (one level up from ai/)
env_path = Path(__file__).parent.parent / "client" / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if line.strip() and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

# ── Config ─────────────────────────────────────────────────────────────
RTSP_URL       = os.environ.get("CAMERA_URL", "")
API_URL        = os.environ.get("API_URL", "http://localhost:5000/events")

if not RTSP_URL:
    raise RuntimeError("CAMERA_URL is not set — add it to client/.env")

# Nest box region of interest (x1, y1, x2, y2) in pixels.
# Run --calibrate to get a reference frame with a grid, then update these.
NEST_ROI       = (1200, 850, 1500, 1080)  # nest box

FRAME_INTERVAL = 2.0   # seconds between inference runs (keep CPU low on Pi)
CONFIDENCE     = 0.35  # minimum YOLO detection confidence
DEBOUNCE_SECS  = 15    # state must hold this long before an event fires
# ───────────────────────────────────────────────────────────────────────

BIRD_CLASS_ID  = 14    # COCO class 14 = "bird"


def overlaps(box, roi):
    """Return True if the detection bounding box overlaps the ROI rectangle."""
    bx1, by1, bx2, by2 = box
    rx1, ry1, rx2, ry2 = roi
    return bx1 < rx2 and bx2 > rx1 and by1 < ry2 and by2 > ry1


def post_event(event_type: str, confidence: float):
    payload = {
        "type": event_type,
        "confidence": round(confidence, 3),
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
    }
    try:
        requests.post(API_URL, json=payload, timeout=3)
        print(f"\n  → posted {event_type} (conf={payload['confidence']})")
    except Exception as e:
        print(f"\n  ⚠ API post failed: {e}")


def open_stream(url: str):
    cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open stream: {url}")
    return cap


def calibrate(cap):
    """Capture one frame and save it to calibrate.jpg with a pixel grid overlay."""
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame — is the stream running?")
        return

    h, w = frame.shape[:2]

    # Draw grid every 100px
    for x in range(0, w, 100):
        cv2.line(frame, (x, 0), (x, h), (0, 200, 0), 1)
        cv2.putText(frame, str(x), (x + 2, 15), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 200, 0), 1)
    for y in range(0, h, 100):
        cv2.line(frame, (0, y), (w, y), (0, 200, 0), 1)
        cv2.putText(frame, str(y), (2, y + 12), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 200, 0), 1)

    # Draw the current NEST_ROI so you can see where it sits
    rx1, ry1, rx2, ry2 = NEST_ROI
    cv2.rectangle(frame, (rx1, ry1), (rx2, ry2), (0, 0, 255), 2)
    cv2.putText(frame, "current NEST_ROI", (rx1, ry1 - 6),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)

    cv2.imwrite("calibrate.jpg", frame)
    print(f"Saved calibrate.jpg ({w}x{h})")
    print("Open it, find your nest box corners, then update NEST_ROI in this script.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--calibrate", action="store_true",
                        help="Save a reference frame to calibrate.jpg and exit")
    args = parser.parse_args()

    cap = open_stream(RTSP_URL)

    if args.calibrate:
        calibrate(cap)
        cap.release()
        return

    model = YOLO("yolov8n.pt")  # downloads ~6 MB on first run
    print(f"Watching nest box at {RTSP_URL}")
    print(f"ROI: {NEST_ROI}  |  interval: {FRAME_INTERVAL}s  |  debounce: {DEBOUNCE_SECS}s")
    print("Press Ctrl+C to stop.\n")

    occupied      = False
    pending_state = None
    pending_since = None

    while True:
        # Flush the buffer so we always get the freshest frame
        for _ in range(4):
            cap.grab()

        ret, frame = cap.read()
        if not ret:
            print("Stream read failed — reconnecting...")
            time.sleep(5)
            cap.release()
            cap = open_stream(RTSP_URL)
            continue

        results   = model(frame, verbose=False, conf=CONFIDENCE, classes=[BIRD_CLASS_ID])
        boxes     = results[0].boxes
        bird_in_nest = False
        best_conf    = 0.0

        for box in boxes:
            x1, y1, x2, y2 = (int(v) for v in box.xyxy[0])
            conf = float(box.conf[0])
            if overlaps((x1, y1, x2, y2), NEST_ROI):
                bird_in_nest = True
                best_conf    = max(best_conf, conf)

        now = time.time()

        if bird_in_nest != occupied:
            if pending_state != bird_in_nest:
                # New candidate state — start debounce timer
                pending_state = bird_in_nest
                pending_since = now
            elif now - pending_since >= DEBOUNCE_SECS:
                # Debounce passed — commit state change and fire event
                occupied = bird_in_nest
                post_event("nest_occupied" if occupied else "nest_empty", best_conf)
                pending_state = None
                pending_since = None
        else:
            # Matches current state — cancel any pending change
            pending_state = None
            pending_since = None

        status = "OCCUPIED" if occupied else "empty  "
        pending_info = f"  (pending {pending_state} for {int(now - pending_since)}s)" if pending_since else ""
        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {status}  bird_in_nest={bird_in_nest}  conf={best_conf:.2f}{pending_info}   ", end="\r")

        time.sleep(FRAME_INTERVAL)

    cap.release()


if __name__ == "__main__":
    main()
