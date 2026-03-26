import express, { Request, Response } from "express";
import cors from "cors";
const path = require("path");
import dotenv from "dotenv";
import { spawn } from "child_process";
import { MongoClient, Collection } from "mongodb";

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

dotenv.config({ path: path.join(__dirname, "../../client/.env") });

const PORT = Number(process.env.PORT) || 5000;
const CAMERA_URL = process.env.CAMERA_URL || "";
const MONGO_URI = process.env.MONGO_URI || "";

// ── MongoDB ────────────────────────────────────────────────────────────
let events: Collection | null = null;

if (MONGO_URI) {
     const client = new MongoClient(MONGO_URI);
     client.connect()
          .then(() => {
               events = client.db("cluckingham").collection("events");
               console.log("🥚 MongoDB connected");
          })
          .catch(err => console.warn("⚠️  MongoDB connection failed:", err.message));
} else {
     console.warn("⚠️  MONGO_URI is not set — events will not be persisted");
}

if (!CAMERA_URL) {
     console.warn("⚠️  CAMERA_URL is not set in .env");
}

// ── Events endpoints ───────────────────────────────────────────────────
app.post("/events", async (req: Request, res: Response) => {
     const { type, confidence, timestamp } = req.body;
     if (!type || !timestamp) {
          res.status(400).json({ error: "type and timestamp are required" });
          return;
     }
     const doc = { type, confidence: confidence ?? null, timestamp: new Date(timestamp) };
     if (events) {
          await events.insertOne(doc);
     }
     console.log(`🐔 event: ${type} (conf=${confidence})`);
     res.status(201).json({ ok: true });
});

app.get("/events", async (_req: Request, res: Response) => {
     if (!events) {
          res.json([]);
          return;
     }
     const recent = await events
          .find()
          .sort({ timestamp: -1 })
          .limit(50)
          .toArray();
     res.json(recent);
});

// ── Health ──────────────────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
     res.json({
          ok: true,
          service: "cluckingham-guard-server",
          cameraConfigured: Boolean(CAMERA_URL),
     });
});

/**
 * Live stream endpoint
 * - Pulls RTSP (now via MediaMTX restream) over TCP
 * - Transmuxes/encodes H.264 into fragmented MP4 for the browser
 */
app.get("/stream", (req: Request, res: Response) => {
     try {
          // headers (dev-safe)
          res.setHeader("Access-Control-Allow-Origin", "*"); // TODO: restrict in prod
          res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
          res.setHeader("Content-Type", "video/mp4");
          res.setHeader("Cache-Control", "no-store");
          (res as any).flushHeaders?.(); // send immediately

          const ffmpegProcess = spawn("ffmpeg", [
               "-hide_banner", "-nostats", "-loglevel", "error",
               "-rtsp_transport", "tcp",
               "-fflags", "+genpts+discardcorrupt",
               "-use_wallclock_as_timestamps", "1",
               "-i", CAMERA_URL,
               "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
               "-c:v", "libx264", "-preset", "ultrafast", "-tune", "zerolatency",
               "-g", "48", "-keyint_min", "48", "-sc_threshold", "0",
               "-pix_fmt", "yuv420p",
               "-c:a", "aac", "-b:a", "128k",
               "-movflags", "frag_keyframe+empty_moov+default_base_moof",
               "-frag_duration", "1000000", "-flush_packets", "1",
               "-muxdelay", "0", "-max_interleave_delta", "0",
               "-f", "mp4", "pipe:1",
          ]);


          ffmpegProcess.stdout.pipe(res);
          req.on("close", () => ffmpegProcess.kill("SIGINT"));
          ffmpegProcess.stderr.on("data", d => process.stderr.write(d));
          ffmpegProcess.on("exit", () => { if (!res.headersSent) res.statusCode = 500; res.end(); });
     } catch (err) {
          console.error("/stream handler error:", err);
          if (!res.headersSent) {
               res.status(500).send("Stream error");
          } else {
               res.end();
          }
     }
});

app.listen(PORT, () => {
     console.log(`🐔 API listening on http://localhost:${PORT}`);
     console.log(`   Health: http://localhost:${PORT}/health`);
});
