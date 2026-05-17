"use client";

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "react-hot-toast";

interface PageTransitionContextType {
  /** Trigger a transition then navigate to the given href */
  navigateWithTransition: (href: string, isHard?: boolean) => void;
  /** Current transition phase: idle → exiting → entering → idle */
  phase: "idle" | "exiting" | "entering";
}

const PageTransitionContext = createContext<PageTransitionContextType>({
  navigateWithTransition: () => { },
  phase: "idle",
});

export function usePageTransition() {
  return useContext(PageTransitionContext);
}

// Duration in ms for entering phase
const ENTER_DURATION = 400;

export function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<"idle" | "exiting" | "entering">("idle");
  const prevPathname = useRef(pathname);
  const targetHrefRef = useRef<string | null>(null);

  // 1. Detect standard pathname changes (for normal link clicks or page changes)
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      targetHrefRef.current = null; // Clear target ref
      
      // Navigation finished, show entering animation briefly
      requestAnimationFrame(() => {
        setPhase("entering");
      });
      
      const timer = setTimeout(() => {
        requestAnimationFrame(() => {
          setPhase("idle");
        });
      }, ENTER_DURATION);
      
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // 2. Detect query-only or same-page transitions (e.g. search pages or filter page changes)
  // This runs on every render to check if the browser's URL now matches our target transition URL.
  useEffect(() => {
    if (phase === "exiting" && targetHrefRef.current) {
      try {
        const currentUrl = new URL(window.location.href);
        const targetUrl = new URL(targetHrefRef.current, window.location.origin);
        
        if (
          currentUrl.pathname === targetUrl.pathname &&
          currentUrl.search === targetUrl.search
        ) {
          targetHrefRef.current = null;
          requestAnimationFrame(() => {
            setPhase("entering");
          });
          
          const timer = setTimeout(() => {
            requestAnimationFrame(() => {
              setPhase("idle");
            });
          }, ENTER_DURATION);
          
          return () => clearTimeout(timer);
        }
      } catch {
        // Fallback if URL is invalid
        targetHrefRef.current = null;
        requestAnimationFrame(() => {
          setPhase("idle");
        });
      }
    }
  }); // Runs on every render, client-side only

  const navigateWithTransition = useCallback(
    (href: string, isHard: boolean = false) => {
      // NEW: Check for internet connection
      if (typeof window !== "undefined" && !navigator.onLine) {
        toast.error("Không có kết nối mạng. Vui lòng kiểm tra lại đường truyền!", {
          id: "offline-error",
          duration: 3000,
        });
        return;
      }

      // Check if same page
      if (typeof window !== "undefined" && !isHard) {
        try {
          const target = new URL(href, window.location.origin);
          const current = new URL(window.location.href);
          if (target.pathname === current.pathname && target.search === current.search) {
            return;
          }
        } catch { /* invalid href */ }
      }

      // Store target URL to track same-page query changes (e.g. search page search term changes)
      targetHrefRef.current = href;

      // PHASE 1: TRIGGER EXITING IMMEDIATELY (INSTANT FEEDBACK)
      setPhase("exiting");

      // PHASE 2: PERFORM NAVIGATION after a tiny delay to ensure the spinner is rendered
      // Next.js router.push can sometimes be blocking on the main thread
      setTimeout(() => {
        if (isHard && typeof window !== "undefined") {
          window.location.href = href;
          return;
        }
        router.push(href);
      }, 0);
    },
    [router]
  );

  return (
    <PageTransitionContext.Provider value={{ navigateWithTransition, phase }}>
      {children}
      
      {/* INSTANT SPINNER OVERLAY - TRULY INSTANT */}
      {phase === "exiting" && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-gradient-to-br from-[#121d33] via-[#0a1628] to-[#050a14]">
          <div className="relative flex items-center justify-center">
            {/* Outer Glowing Ring */}
            <div className="absolute h-16 w-16 animate-pulse-fast rounded-full border-2 border-[#f5a623]/20 shadow-[0_0_20px_rgba(245,166,35,0.15)]"></div>
            
            {/* Main Spinner Ring */}
            <div className="h-12 w-12 animate-spin-fast rounded-full border-[3px] border-transparent border-t-[#f5a623] border-r-[#f5a623]/30 shadow-[0_0_15px_rgba(245,166,35,0.4)]"></div>
            
            {/* Center Point */}
            <div className="absolute h-1.5 w-1.5 rounded-full bg-[#f5a623] shadow-[0_0_10px_#f5a623]"></div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin-fast {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-fast {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }
        .animate-spin-fast {
          animation: spin-fast 0.7s linear infinite;
        }
        .animate-pulse-fast {
          animation: pulse-fast 1.2s ease-in-out infinite;
        }
      `}</style>
    </PageTransitionContext.Provider>
  );
}
