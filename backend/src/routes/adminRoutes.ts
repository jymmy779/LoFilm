import { Router } from "express";
import {
  importMovie,
  triggerManualSync,
  getSyncLogs,
} from "../controllers/adminController.js";

const router = Router();

router.post("/movies/import", importMovie);
router.post("/sync/trigger", triggerManualSync);
router.get("/sync/logs", getSyncLogs);

export default router;
