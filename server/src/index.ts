// server/src/index.ts
import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true, service: "cluckingham-guard-server" });
});

app.listen(PORT, () => {
  console.log(`🐔 Server running at http://localhost:${PORT}`);
});
