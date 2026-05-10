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
      <style>{`
        @keyframes cssFadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cssProgressLoop {
          0% { transform: translateX(-110%); }
          100% { transform: translateX(260%); }
        }
        .lofilm-loader-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100dvh;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #050a14;
          transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.8s;
          will-change: opacity;
          overflow: hidden;
          touch-action: none;
          overscroll-behavior: none;
        }
        .lofilm-loader-overlay.fade-out {
          opacity: 0;
          visibility: hidden;
        }
        .lofilm-loader-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .lofilm-loader-logo {
          width: 180px;
          max-width: 80vw;
          height: auto;
          display: block;
          margin: 0 auto;
          animation: cssFadeInUp 0.8s ease-out 0.2s forwards;
          opacity: 0;
          filter: brightness(0.75) drop-shadow(0 10px 30px rgba(0,0,0,0.8));
        }
        @media (min-width: 768px) {
          .lofilm-loader-logo { width: 260px; }
        }
        .lofilm-loader-bar-container {
          width: 140px;
          height: 3px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 999px;
          overflow: hidden;
          position: relative;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.5);
        }
        .lofilm-loader-bar-fill {
          position: absolute;
          inset: 0;
          width: 40%;
          background: linear-gradient(to right, transparent, #fbbf24, transparent);
          animation: cssProgressLoop 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
        .vn-copyright {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-top: 10px;
        }
      `}</style>

      <div className={`lofilm-loader-overlay ${fadingOut ? 'fade-out' : ''}`}>
        <div className="lofilm-loader-content">
          <img
            src="/lofilm_logo.webp"
            alt="LoFilm Logo"
            className="lofilm-loader-logo"
          />

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
