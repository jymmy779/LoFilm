import AuthContent from "./AuthContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng nhập | LoFilm - Không gian điện ảnh chill nhất",
  description: "Trở thành thành viên của LoFilm để tận hưởng kho phim khổng lồ và không giới hạn.",
};

export default function DangNhapPage() {
  return <AuthContent />;
}
