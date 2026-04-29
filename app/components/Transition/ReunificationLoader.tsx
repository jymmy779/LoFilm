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
    );
}
