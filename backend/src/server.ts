import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes/index.js";
import { startCronJobs } from "./services/cronService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
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

app.listen(PORT, () => {
  console.log(`[LoFilm Backend] Server running on http://localhost:${PORT}`);
  console.log(`[LoFilm Backend] API ready at http://localhost:${PORT}/api/v1`);
  startCronJobs();
});
