import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes/index.js";
import { prisma } from "./lib/prisma.js";
import { startCronJobs } from "./services/cronService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "*",
  credentials: true,
}));
app.use(express.json());

// Mount API Routes
app.use("/api/v1", apiRoutes);
app.use("/v1/api", apiRoutes);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "lofilm-backend",
    timestamp: new Date().toISOString()
  });
});

async function initSqlitePragma() {
  try {
    await prisma.$executeRawUnsafe(`PRAGMA journal_mode = WAL;`);
    await prisma.$executeRawUnsafe(`PRAGMA synchronous = NORMAL;`);
    await prisma.$executeRawUnsafe(`PRAGMA cache_size = -64000;`);
    await prisma.$executeRawUnsafe(`PRAGMA temp_store = MEMORY;`);
    await prisma.$executeRawUnsafe(`PRAGMA mmap_size = 268435456;`);
    console.log("[Database] SQLite WAL & memory-mapped I/O initialized.");
  } catch (err: any) {
    console.error("[Database] Pragma error:", err.message);
  }
}

app.listen(PORT, async () => {
  console.log(`[LoFilm Backend] Server running on http://localhost:${PORT}`);
  console.log(`[LoFilm Backend] API ready at http://localhost:${PORT}/api/v1`);
  await initSqlitePragma();
  startCronJobs();
});
