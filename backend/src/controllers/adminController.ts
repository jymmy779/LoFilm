import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { upsertMovieDetail, syncIncremental } from "../services/syncService.js";

/**
 * POST /api/v1/admin/movies/import
 * Nh?p phim t? ngu?n ngoài / th? công vào Database n?i b?
 */
export async function importMovie(req: Request, res: Response) {
  try {
    const payload = req.body;
    if (!payload || !payload.movie || !payload.movie.slug) {
      return res.status(400).json({
        status: false,
        msg: "D? li?u không h?p l?. Yêu c?u object { movie, episodes }",
      });
    }

    const success = await upsertMovieDetail(payload);
    if (!success) {
      return res.status(500).json({ status: false, msg: "L?i luu phim vào Database" });
    }

    return res.json({
      status: true,
      msg: `Ðã import phim "${payload.movie.name}" (${payload.movie.slug}) thành công!`,
    });
  } catch (error: any) {
    console.error("[Admin Import] L?i:", error.message);
    return res.status(500).json({ status: false, msg: error.message });
  }
}

/**
 * POST /api/v1/admin/sync/trigger
 * Kích ho?t d?ng b? th? công t? KKPhim
 */
export async function triggerManualSync(req: Request, res: Response) {
  try {
    const pages = Number(req.body.pages) || 2;
    // Ch?y d?ng b? ng?m
    syncIncremental(pages).catch((err) =>
      console.error("[Admin Trigger Sync] L?i ng?m:", err.message)
    );

    return res.json({
      status: true,
      msg: `Ðã kích ho?t quét ${pages} trang m?i nh?t t? KKPhim. D? li?u dang du?c d?ng b? ng?m.`,
    });
  } catch (error: any) {
    return res.status(500).json({ status: false, msg: error.message });
  }
}

/**
 * GET /api/v1/admin/sync/logs
 * L?y danh sách l?ch s? d?ng b?
 */
export async function getSyncLogs(req: Request, res: Response) {
  try {
    const logs = await prisma.syncLog.findMany({
      take: 20,
      orderBy: { started_at: "desc" },
    });

    return res.json({
      status: true,
      data: logs,
    });
  } catch (error: any) {
    return res.status(500).json({ status: false, msg: error.message });
  }
}
