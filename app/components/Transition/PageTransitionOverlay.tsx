"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePageTransition } from "./PageTransitionContext";

/**
 * PageTransitionOverlay – Cinematic wipe/reveal overlay.
 *
 * The overlay uses two layers:
 *   1. A dark "curtain" that slides‑in during _exit_ then slides‑out during _enter_.
 *   2. A subtle golden accent line that sweeps across the screen.
 *
 * All animations are driven by CSS transitions on a single wrapper element
 * whose classes change based on the `phase` coming from the context.
 */
export default function PageTransitionOverlay() {
  const { phase } = usePageTransition();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Syncing scroll logic moved to Context (in 'exiting' phase hidden by curtain)
  // for better stability on weak networks.

  // Lock body & html scroll during transition
  useEffect(() => {
    if (phase !== "idle") {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [phase]);

  // className mapping per phase
  const getPhaseClass = useCallback(() => {
    switch (phase) {
      case "exiting":
        return "ptr-exiting";
      case "entering":
        return "ptr-entering";
      default:
        return "ptr-idle";
    }
  }, [phase]);

  if (phase === "idle") return null;

  return (
    <>
      <style>{`
        /* ── Page Transition Overlay ── */
        .ptr-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          pointer-events: all; /* Block interactions during transition */
          overflow: hidden;
        }

        /* Curtain – the dark slide */
        .ptr-curtain {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #0a1628 0%, #121d33 40%, #0d1b2e 100%);
          will-change: transform, opacity;
        }

        /* Accent line */
        .ptr-accent {
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, #f5a623 40%, #fbbf24 60%, transparent 100%);
          will-change: transform, opacity;
          transform: translateY(-50%);
        }

        /* Logo flash */
        .ptr-logo {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-family: 'Montserrat', sans-serif;
          font-weight: 800;
          font-size: 2rem;
          letter-spacing: 0.3em;
          color: white;
          will-change: opacity, transform;
        }

        @media (min-width: 768px) {
          .ptr-logo { font-size: 3.5rem; }
        }

        /* ── EXIT Phase: curtain slides in from left ── */
        .ptr-exiting .ptr-curtain {
          animation: ptrCurtainIn 0.5s cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }
        .ptr-exiting .ptr-accent {
          animation: ptrAccentSweep 0.5s cubic-bezier(0.65, 0, 0.35, 1) forwards,
                     ptrAccentPulse 2s ease-in-out 0.5s infinite;
        }
        .ptr-exiting .ptr-logo {
          animation: ptrLogoIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards,
                     ptrPulse 1.5s ease-in-out 0.6s infinite;
          opacity: 0;
        }

        /* ── ENTER Phase: curtain reveals (slides out right) ── */
        .ptr-entering .ptr-curtain {
          animation: ptrCurtainOut 0.6s cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }
        .ptr-entering .ptr-accent {
          animation: ptrAccentOut 0.6s cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }
        .ptr-entering .ptr-logo {
          animation: ptrLogoOut 0.4s cubic-bezier(0.55, 0, 1, 0.45) forwards;
        }

        /* ── Keyframes ── */
        @keyframes ptrCurtainIn {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        @keyframes ptrCurtainOut {
          from { transform: translateX(0); }
          to   { transform: translateX(100%); }
        }

        @keyframes ptrAccentSweep {
          from { transform: translateY(-50%) scaleX(0); opacity: 0; }
          40%  { opacity: 1; }
          to   { transform: translateY(-50%) scaleX(1); opacity: 1; }
        }
        @keyframes ptrAccentOut {
          from { transform: translateY(-50%) scaleX(1); opacity: 1; }
          to   { transform: translateY(-50%) scaleX(0); opacity: 0; }
        }

        @keyframes ptrLogoIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes ptrLogoOut {
          from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          to   { opacity: 0; transform: translate(-50%, -50%) scale(1.1); }
        }

        @keyframes ptrPulse {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 0px rgba(255,255,255,0)); }
          50% { opacity: 0.5; filter: drop-shadow(0 0 8px rgba(255,255,255,0.3)); }
        }

        @keyframes ptrAccentPulse {
          0%, 100% { opacity: 1; filter: brightness(1); }
          50% { opacity: 0.4; filter: brightness(1.5); }
        }
      `}</style>

      <div ref={overlayRef} className={`ptr-overlay ${getPhaseClass()}`}>
        <div className="ptr-curtain" />
        <div className="ptr-accent" />
        <div className="ptr-logo">LOFILM</div>
      </div>
    </>
  );
}
