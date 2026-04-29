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
                    0%, 100% { transform: rotate(12deg) scale(1) translateY(0); }
                    50% { transform: rotate(15deg) scale(1.05) translateY(-5px); }
                }
                @keyframes pulseGold {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.6; }
                }
                .reunification-loader {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: #1a0505; /* Extra Dark Red */
                    transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.8s;
                    overflow: hidden;
                }
                .reunification-loader.fade-out {
                    opacity: 0;
                    visibility: hidden;
                }
                .loader-bg-glow {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at center, #7f1d1d 0%, transparent 70%);
                    opacity: 0.2;
                }
                .loader-center {
                    position: relative;
                    z-index: 10;
                    text-align: center;
                    margin-top: -50px;
                }
                .flag-badge {
                    width: 120px;
                    margin: 0 auto 30px;
                    animation: cssFadeInUp 0.8s ease-out forwards, flagWave 3s ease-in-out 0.8s infinite;
                    opacity: 0;
                }
                @media (min-width: 768px) {
                    .flag-badge { width: 180px; }
                }
                .event-brand {
                    font-size: 3.5rem;
                    font-weight: 950;
                    color: #fff;
                    letter-spacing: 0.3em;
                    text-shadow: 0 0 30px rgba(255,255,255,0.2);
                    animation: cssFadeInUp 0.8s ease-out 0.2s forwards;
                    opacity: 0;
                }
                @media (min-width: 768px) {
                    .event-brand { font-size: 6rem; }
                }
                .event-celebration {
                    color: #fbbf24;
                    font-weight: 800;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.4em;
                    margin-top: 15px;
                    opacity: 0;
                    animation: cssFadeInUp 0.8s ease-out 0.4s forwards;
                }
                .tank-lane {
                    position: absolute;
                    bottom: 12%;
                    left: 0;
                    width: 100%;
                    height: 100px;
                    pointer-events: none;
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
                    width: 120px;
                    height: 60px;
                    bottom: 20px;
                    animation: tankMove 8s linear infinite;
                }
                .tank-body {
                    position: absolute;
                    bottom: 10px;
                    left: 0;
                    width: 90px;
                    height: 28px;
                    background: #233123;
                    border-radius: 6px;
                    border: 3px solid #0d120d;
                }
                .tank-turret {
                    position: absolute;
                    bottom: 35px;
                    left: 30px;
                    width: 45px;
                    height: 18px;
                    background: #233123;
                    border-radius: 8px 8px 0 0;
                    border: 3px solid #0d120d;
                }
                .tank-barrel {
                    position: absolute;
                    bottom: 42px;
                    left: 72px;
                    width: 50px;
                    height: 6px;
                    background: #233123;
                    border-radius: 0 4px 4px 0;
                    border: 3px solid #0d120d;
                }
                .tank-star {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: #fbbf24;
                    font-size: 10px;
                }
                .vn-copyright {
                    position: absolute;
                    bottom: 40px;
                    font-size: 0.7rem;
                    color: rgba(255,255,255,0.2);
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                }
            `}</style>

            <div className={`reunification-loader ${fadingOut ? 'fade-out' : ''}`}>
                <div className="loader-bg-glow" />

                <div className="loader-center">
                    <div className="flag-badge">
                        <img src="/vn-flag-full.gif" alt="Vietnam Flag" className="w-full h-auto drop-shadow-[0_20px_50px_rgba(185,28,28,0.5)]" />
                    </div>
                    <div className="event-brand font-heading">
                        LOFILM
                    </div>
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
