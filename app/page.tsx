import { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "LoFilm - Xem Phim Online Chất Lượng Cao, Tốc Độ Mượt Mà",
  description: "Trải nghiệm xem phim online đỉnh cao tại LoFilm. Kho phim HD khổng lồ, vietsub chuẩn, tốc độ load cực nhanh và hoàn toàn miễn phí. Truy cập ngay!",
};

export default function Home() {
  return (
    <>
      <HomeClient />
    </>
  );
}
