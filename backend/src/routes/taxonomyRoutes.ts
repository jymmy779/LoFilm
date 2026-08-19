import { Router } from "express";
import { getCategories, getCountries } from "../controllers/taxonomyController.js";

const router = Router();

router.get("/the-loai", getCategories);
router.get("/quoc-gia", getCountries);

export default router;
