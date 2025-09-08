# Cluckingham Guard 🐔

TypeScript full‑stack app for keeping tabs on your flock.  
**Client:** SvelteKit UI (TypeScript) with card grid + overlay editor  
**API:** SvelteKit server routes (MongoDB CRUD)  
**Camera:** Tapo C210 → RTSP → MediaMTX restream

---

## ✨ Features

- 🐓 Chicken list with name, age, image, breed, description, and time last seen (WIP)
- 📝 Click **+** or a card to open an **overlay form** (create or update)
- 🗃️ MongoDB Atlas/local for persistence
- 🎥 Optional **MediaMTX** to republish RTSP (HLS/WebRTC)
- 🔧 Clean TS types and tiny server API

---

## ✅ Prerequisites

- Node 18+
- MongoDB URI (Atlas or local)
- MediaMTX if you want to restream RTSP

---

## ⚙️ Setup

Create `client/.env`:

```env
# Mongo connection for SvelteKit server routes
MONGO_URI="mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority"

# or local Mongo
# MONGO_URI="mongodb://127.0.0.1:27017/cluckingham"
```

Install deps:

```bash
cd client
npm install
```

---

## 🚀 Development

Open **two terminals**.

**Terminal A — SvelteKit (UI + API)**

```bash
cd client
npm run dev
# http://localhost:5173
```

**Terminal B — (Optional) MediaMTX restream**

1) Minimal `mediamtx.yml`:

```yaml
paths:
  tapo:
    # Main stream often /stream1, sub-stream /stream2 (lower bitrate)
    source: rtsp://<user>:<pass>@192.168.x.x:554/stream2
```

2) Run:

```bash
mediamtx mediamtx.yml
```

> Quick camera sanity check:
> ```bash
> ffprobe -v info -rtsp_transport tcp -timeout 5000000 >   -i "rtsp://<user>:<pass>@192.168.x.x:554/stream1" -show_streams
> ```

---

## 🔌 API

Base: `http://localhost:5173/api`

### List chickens
```
GET /chickens
```
**200**:
```json
[
  {
    "_id": "66e0a2f0c6c0b5f34bdb1234",
    "name": "Pepper",
    "breed": "Barred Plymouth Rock",
    "dateOfHatch": "2025-05-07",
    "imageUrl": "https://…",
    "status": "active",
    "lastSeenAt": 1725660000000
  }
]
```

### Create chicken
```
POST /chickens
Content-Type: application/json
```
Body:
```json
{
  "name": "Pepper",
  "breed": "Barred Plymouth Rock",
  "dateOfHatch": "2025-05-07",
  "imageUrl": "https://…"
}
```
**200**:
```json
{ "ok": true }
```

### Update chicken
```
PUT /chickens/:id
Content-Type: application/json
```
Body (any subset of fields):
```json
{ "name": "Pepper II", "status": "active" }
```
**200**:
```json
{
  "_id": "66e0a2f0c6c0b5f34bdb1234",
  "name": "Pepper II",
  "breed": "Barred Plymouth Rock",
  "...": "..."
}
```

---

## 🧩 Data Model

```ts
// client/src/lib/types/chicken.ts
export type Chicken = {
  name: string;
  dateOfHatch?: string; // 'YYYY-MM-DD'
  breed?: "Rhode Island Red" | "Light Brahma" | "Black Australorp" | "Barred Plymouth Rock";
  description?: string;
  eggSongUrl?: string;
  imageUrl?: string;
  status?: "active" | "missing" | "rehomed";
  lastSeenAt?: number;
  _id?: string; // stringified ObjectId from API
};
```

---

## 🧪 Scripts (inside `client/`)

- `npm run dev` — Dev server (UI + API routes)
- `npm run build` — Production build
- `npm run preview` — Preview prod build

---

## 🛠️ Troubleshooting

- **Missing IDs in UI:** ensure GET maps `_id` to string:
  ```ts
  list.map(({ _id, ...rest }) => ({ ...rest, _id: _id!.toString() }))
  ```
- **Type errors about `_id` (server):** server collection uses a doc type where `_id` is an `ObjectId`; client type uses `_id?: string`. Keep them separate.
- **RTSP timeouts:** same subnet as camera, `-rtsp_transport tcp`, correct `/stream1` or `/stream2`.

---

## 📦 Deploy

- Deploy SvelteKit (Node adapter or your platform’s adapter).
- Use Atlas/local Mongo; set `MONGO_URI` in your host env.
- If streaming to browsers, run MediaMTX on your LAN or near the camera.

---

## 📝 License

MIT — take care of your chickens 🐣
