"use client";

import { useEffect, useState } from "react";

export default function InitialLoader() {
  const [show, setShow] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const startTime = Date.now();
    const minimumDisplayTime = 2000; // 2 giây hiển thị tối thiểu

    const startFadeOut = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minimumDisplayTime - elapsed);

      window.setTimeout(() => {
        setFadingOut(true);
        window.setTimeout(() => {
          setShow(false);
          document.body.style.overflow = "unset";
        }, 700);
      }, remaining);
    };

    const handleLoad = () => {
      startFadeOut();
    };

    if (document.readyState === "complete") {
      startFadeOut();
    } else {
      window.addEventListener("load", handleLoad);
    }

    // Dự phòng: tối đa 5s nếu có tài nguyên nào đó bị kẹt (tăng lên vì đã có min time)
    const safety = window.setTimeout(startFadeOut, 5000);

    return () => {
      window.removeEventListener("load", handleLoad);
      window.clearTimeout(safety);
      document.body.style.overflow = "unset";
    };
  }, []);

  if (!show) return null;

  return (
    <>
      <div className={`lofilm-loader-overlay ${fadingOut ? 'fade-out' : ''}`}>
        <div className="lofilm-loader-content">
          <div className="lofilm-loader-text">
            LoFilm
          </div>

          <div className="lofilm-loader-bar-container">
            <div className="lofilm-loader-bar-fill"></div>
          </div>
          <div className="vn-copyright">
            Hoàng Sa & Trường Sa là của Việt Nam
          </div>
        </div>
      </div>
    </>
  );
}
