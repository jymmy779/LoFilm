import { Router } from "express";
import {
  getMovieDetail,
  getCatalog,
  searchMovies,
  getHomeBundle,
} from "../controllers/movieController.js";

const router = Router();

// Trang ch? tr?n gói
router.get("/home", getHomeBundle);

// Tìm ki?m phim
router.get("/tim-kiem", searchMovies);
router.get("/search", searchMovies);

// Chi ti?t phim (h? tr? c? /phim/:slug và /movies/:slug)
router.get("/phim/:slug", getMovieDetail);
router.get("/movies/:slug", getMovieDetail);

// Danh sách catalog (h? tr? /danh-sach/:type, /the-loai/:slug, /quoc-gia/:slug, /movies)
router.get("/danh-sach/:type", getCatalog);
router.get("/the-loai/:slug", (req, res) => {
  (req.params as any).type = "the-loai";
  return getCatalog(req, res);
});
router.get("/quoc-gia/:slug", (req, res) => {
  (req.params as any).type = "quoc-gia";
  return getCatalog(req, res);
});
router.get("/movies", getCatalog);

export default router;
