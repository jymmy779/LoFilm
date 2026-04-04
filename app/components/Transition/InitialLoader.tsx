"use client";

import { useEffect, useState } from "react";

export default function InitialLoader() {
  const [show, setShow] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const fadeTimeout = setTimeout(() => {
      setFadingOut(true);
    }, 1800);

    const removeTimeout = setTimeout(() => {
      setShow(false);
      document.body.style.overflow = "unset";
    }, 2400); // 1800ms + 600ms transition

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(removeTimeout);
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
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .lofilm-loader-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(to bottom right, #121d33, #0a1628, #050a14);
          transition: opacity 0.6s ease-in-out, visibility 0.6s;
          will-change: opacity;
        }
        .lofilm-loader-overlay.fade-out {
          opacity: 0;
          visibility: hidden;
        }
        .lofilm-loader-text {
          font-size: 3rem;
          font-weight: 800;
          letter-spacing: 0.4em;
          color: white;
          margin-bottom: 24px;
          animation: cssFadeInUp 0.8s ease-out forwards;
          will-change: transform, opacity;
        }
        @media (min-width: 768px) {
          .lofilm-loader-text { font-size: 5rem; }
        }
        .lofilm-loader-bar-container {
          width: 100px;
          height: 2px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          overflow: hidden;
          position: relative;
        }
        @media (min-width: 768px) {
          .lofilm-loader-bar-container { width: 160px; }
        }
        .lofilm-loader-bar-fill {
          position: absolute;
          inset: 0;
          width: 100%;
          background-color: #fbbf24;
          animation: cssProgressLoop 1.2s linear infinite;
          will-change: transform;
        }
      `}</style>
      
      <div className={`lofilm-loader-overlay ${fadingOut ? 'fade-out' : ''}`}>
        <h1 className="lofilm-loader-text font-heading text-white">
          LOFILM
        </h1>
        <div className="lofilm-loader-bar-container">
          <div className="lofilm-loader-bar-fill"></div>
        </div>
      </div>
    </>
  );
}
