import { Router } from "express";
import taxonomyRoutes from "./taxonomyRoutes.js";
import movieRoutes from "./movieRoutes.js";
import adminRoutes from "./adminRoutes.js";

const router = Router();

router.use("/", taxonomyRoutes);
router.use("/", movieRoutes);
router.use("/admin", adminRoutes);

export default router;
