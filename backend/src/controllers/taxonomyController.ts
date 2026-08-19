import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

/**
 * GET /api/v1/the-loai
 * L?y toàn b? danh sách th? lo?i
 */
export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return res.json({
      status: "success",
      message: "Thành công",
      data: {
        items: categories,
      },
      items: categories,
    });
  } catch (error: any) {
    console.error("[API Categories] L?i:", error.message);
    return res.status(500).json({ status: "error", message: error.message });
  }
}

/**
 * GET /api/v1/quoc-gia
 * L?y toàn b? danh sách qu?c gia
 */
export async function getCountries(req: Request, res: Response) {
  try {
    const countries = await prisma.country.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return res.json({
      status: "success",
      message: "Thành công",
      data: {
        items: countries,
      },
      items: countries,
    });
  } catch (error: any) {
    console.error("[API Countries] L?i:", error.message);
    return res.status(500).json({ status: "error", message: error.message });
  }
}
