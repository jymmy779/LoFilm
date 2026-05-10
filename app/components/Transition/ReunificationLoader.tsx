"use client";

import { useEffect, useState } from "react";

/**
 * Special Initial Loader for the 30/4 - 1/5 Event.
 * Features a festive theme with a moving tank and national flag.
 */
export default function ReunificationLoader() {
    const [show, setShow] = useState(true);
    const [fadingOut, setFadingOut] = useState(false);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        const startTime = Date.now();
        const minimumDisplayTime = 2500; // 2.5 giây hiển thị tối thiểu cho sự kiện

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

        // Dự phòng: tối đa 6s nếu có tài nguyên nào đó bị kẹt (cho sự kiện cần lâu hơn tí)
        const safety = window.setTimeout(startFadeOut, 6000);

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
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes tankMove {
                    0% { transform: translateX(-150px) translateY(5px) rotate(3deg); }
                    15% { transform: translateX(10vw) translateY(-8px) rotate(-5deg); }
                    30% { transform: translateX(30vw) translateY(12px) rotate(8deg); }
                    45% { transform: translateX(50vw) translateY(-15px) rotate(-10deg); }
                    60% { transform: translateX(70vw) translateY(5px) rotate(4deg); }
                    80% { transform: translateX(90vw) translateY(-2px) rotate(-2deg); }
                    100% { transform: translateX(110vw) translateY(0px) rotate(0deg); }
                }
                @keyframes flagWave {
                    0%, 100% { transform: scale(1) translateY(0); }
                    50% { transform: scale(1.05) translateY(-5px); }
                }
                @keyframes pulseGold {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.6; }
                }
                .reunification-loader {
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
                    overflow: hidden;
                    touch-action: none;
                    overscroll-behavior: none;
                }
                .reunification-loader.fade-out {
                    opacity: 0;
                    visibility: hidden;
                }
                .loader-bg-glow {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at center, #1e3a8a 0%, transparent 70%);
                    opacity: 0.15;
                }
                .loader-center {
                    position: relative;
                    z-index: 10;
                    text-align: center;
                    margin-top: -50px;
                }
                .flag-badge {
                    width: 120px;
                    margin: 0 auto -45px; /* Tăng độ đè lên */
                    animation: cssFadeInUp 0.8s ease-out forwards, flagWave 3s ease-in-out 0.8s infinite;
                    opacity: 0;
                    position: relative;
                    z-index: 5;
                }
                .flag-badge::after {
                    content: "";
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 50%;
                    background: linear-gradient(to top, #050a14 0%, transparent 100%);
                    z-index: 6;
                }
                @media (min-width: 768px) {
                    .flag-badge { width: 180px; margin-bottom: -65px; }
                }
                .flag-badge img {
                    filter: brightness(0.75);
                }
                .event-logo {
                    width: 180px;
                    max-width: 80vw;
                    height: auto;
                    display: block;
                    margin: 0 auto;
                    animation: cssFadeInUp 0.8s ease-out 0.2s forwards;
                    opacity: 0;
                    filter: brightness(0.75) drop-shadow(0 10px 20px rgba(0,0,0,0.7)) drop-shadow(0 0 30px rgba(255,255,255,0.1));
                    position: relative;
                    z-index: 10; /* Đảm bảo nằm trên lá cờ */
                }
                @media (min-width: 768px) {
                    .event-logo { width: 260px; }
                }
                .event-celebration {
                    color: #fbbf24;
                    font-weight: 800;
                    font-size: 0.6rem;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    margin-top: 10px;
                    opacity: 0;
                    animation: cssFadeInUp 0.8s ease-out 0.4s forwards;
                    text-align: center;
                    margin-right: -0.2em; /* Bù trừ letter-spacing để căn giữa hoàn hảo */
                    filter: brightness(0.75);
                }
                @media (min-width: 768px) {
                    .event-celebration { 
                        font-size: 0.75rem; 
                        letter-spacing: 0.4em; 
                        margin-top: 15px;
                        margin-right: -0.4em; /* Bù trừ cho bản desktop */
                    }
                }
                .tank-lane {
                    position: absolute;
                    bottom: 15%;
                    left: 0;
                    width: 100%;
                    height: 80px;
                    pointer-events: none;
                }
                @media (min-width: 768px) {
                    .tank-lane { bottom: 12%; height: 100px; }
                }
                .bumpy-road {
                    position: absolute;
                    bottom: 20px;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background: linear-gradient(to right, transparent, rgba(251, 191, 36, 0.2), transparent);
                }
                .tank {
                    position: absolute;
                    width: 80px;
                    height: 40px;
                    bottom: 20px;
                    animation: tankMove 8s linear infinite;
                }
                @media (min-width: 768px) {
                    .tank { width: 120px; height: 60px; }
                }
                .tank-body {
                    position: absolute;
                    bottom: 10px;
                    left: 0;
                    width: 60px;
                    height: 20px;
                    background: #233123;
                    border-radius: 4px;
                    border: 2px solid #0d120d;
                }
                @media (min-width: 768px) {
                    .tank-body { width: 90px; height: 28px; border-radius: 6px; border-width: 3px; }
                }
                .tank-turret {
                    position: absolute;
                    bottom: 28px;
                    left: 20px;
                    width: 30px;
                    height: 12px;
                    background: #233123;
                    border-radius: 6px 6px 0 0;
                    border: 2px solid #0d120d;
                }
                @media (min-width: 768px) {
                    .tank-turret { bottom: 35px; left: 30px; width: 45px; height: 18px; border-radius: 8px 8px 0 0; border-width: 3px; }
                }
                .tank-barrel {
                    position: absolute;
                    bottom: 33px;
                    left: 48px;
                    width: 35px;
                    height: 4px;
                    background: #233123;
                    border-radius: 0 4px 4px 0;
                    border: 2px solid #0d120d;
                }
                @media (min-width: 768px) {
                    .tank-barrel { bottom: 42px; left: 72px; width: 50px; height: 6px; border-width: 3px; }
                }
                .tank-star {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: #fbbf24;
                    font-size: 8px;
                }
                @media (min-width: 768px) {
                    .tank-star { font-size: 10px; }
                }
                .vn-copyright {
                    position: absolute;
                    bottom: 30px;
                    font-size: 0.6rem;
                    color: rgba(255,255,255,0.2);
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    text-align: center;
                    width: 100%;
                }
                @media (min-width: 768px) {
                    .vn-copyright { bottom: 40px; font-size: 0.7rem; letter-spacing: 0.1em; }
                }
            `}</style>

            <div className={`reunification-loader ${fadingOut ? 'fade-out' : ''}`}>
                <div className="loader-bg-glow" />

                <div className="loader-center">
                    <div className="flag-badge">
                        <img src="/vn-flag-full.gif" alt="Vietnam Flag" className="w-full h-auto" />
                    </div>
                    <img
                        src="/lofilm_logo.webp"
                        alt="LoFilm Logo"
                        className="event-logo mb-2"
                    />
                    <div className="event-celebration">
                        Chúc mừng Đại lễ 30/04 - 01/05
                    </div>
                </div>

                <div className="tank-lane">
                    <div className="bumpy-road" />
                    <div className="tank">
                        <div className="tank-barrel" />
                        <div className="tank-turret">
                            <span className="tank-star">★</span>
                        </div>
                        <div className="tank-body" />
                    </div>
                </div>

                <div className="vn-copyright">
                    Hoàng Sa & Trường Sa là của Việt Nam
                </div>
            </div>
        </>
    );
}
