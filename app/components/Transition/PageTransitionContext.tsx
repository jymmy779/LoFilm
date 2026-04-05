"use client";

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  useEffect,
  Suspense,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface PageTransitionContextType {
  /** Trigger a transition then navigate to the given href */
  navigateWithTransition: (href: string) => void;
  /** Current transition phase: idle → exiting → entering → idle */
  phase: "idle" | "exiting" | "entering";
}

const PageTransitionContext = createContext<PageTransitionContextType>({
  navigateWithTransition: () => {},
  phase: "idle",
});

export function usePageTransition() {
  return useContext(PageTransitionContext);
}

// Duration in ms for each phase
const EXIT_DURATION = 400;
const ENTER_DURATION = 500;

function SearchParamsListener({
  onSearchChange,
}: {
  onSearchChange: (search: string) => void;
}) {
  const searchParams = useSearchParams();
  useEffect(() => {
    onSearchChange(searchParams.toString());
  }, [searchParams, onSearchChange]);
  return null;
}

export function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<"idle" | "exiting" | "entering">("idle");
  const pendingHref = useRef<string | null>(null);
  const prevPathname = useRef(pathname);
  const prevSearch = useRef("");

  const handleSearchChange = useCallback(
    (search: string) => {
      // Only trigger if we are in "exiting" phase. We don't want to trigger on initial load.
      if (search !== prevSearch.current) {
        prevSearch.current = search;
        setPhase((prev) => {
          if (prev === "exiting") {
            setTimeout(() => setPhase("idle"), ENTER_DURATION);
            return "entering";
          }
          return prev;
        });
      }
    },
    []
  );

  // Detect when pathname actually changes (navigation completed)
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      // If we were exiting, switch to entering
      setPhase((prev) => {
        if (prev === "exiting") {
          setTimeout(() => setPhase("idle"), ENTER_DURATION);
          return "entering";
        }
        return prev;
      });
    }
  }, [pathname]);

  const navigateWithTransition = useCallback(
    (href: string) => {
      // Don't trigger if already transitioning
      if (phase !== "idle") return;

      // Same pathname + query = same document (e.g. /?search=x vs / are different)
      if (typeof window !== "undefined") {
        try {
          const target = new URL(href, window.location.origin);
          const current = new URL(window.location.href);
          if (
            target.pathname === current.pathname &&
            target.search === current.search
          ) {
            return;
          }
        } catch {
          /* invalid href — continue and let router.push handle it */
        }
      } else if (href === pathname) {
        return;
      }

      pendingHref.current = href;
      setPhase("exiting");

      // After exit animation, navigate
      setTimeout(() => {
        router.push(href);
        // Fallback: forcefully enter after 10 seconds if Next.js routing hasn't updated URL
        // Ensures the screen doesn't get stuck blank on weird edge cases or extremely slow API
        setTimeout(() => {
          setPhase((prev) => {
            if (prev === "exiting") {
              setTimeout(() => setPhase("idle"), ENTER_DURATION);
              return "entering";
            }
            return prev;
          });
        }, 10000);
      }, EXIT_DURATION);
    },
    [pathname, phase, router]
  );

  return (
    <PageTransitionContext.Provider value={{ navigateWithTransition, phase }}>
      <Suspense fallback={null}>
        <SearchParamsListener onSearchChange={handleSearchChange} />
      </Suspense>
      {children}
    </PageTransitionContext.Provider>
  );
}
