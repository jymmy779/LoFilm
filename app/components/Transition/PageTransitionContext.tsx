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
  navigateWithTransition: () => { },
  phase: "idle",
});

export function usePageTransition() {
  return useContext(PageTransitionContext);
}

// Duration in ms for each phase
const EXIT_DURATION = 500; // Tăng nhẹ để mượt hơn
const ENTER_DURATION = 600;
const MIN_HOLD_DURATION = 200; // Thời gian tối thiểu màn hình bị che hoàn toàn

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
            setTimeout(() => {
              setPhase("entering");
              setTimeout(() => setPhase("idle"), ENTER_DURATION);
            }, MIN_HOLD_DURATION);
            return "exiting";
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
          // Thêm một chút delay (MIN_HOLD_DURATION) để đảm bảo Next.js đã hoán đổi DOM xong
          // Khắc phục triệt để lỗi "lộ trang cũ" khi mạng yếu/DOM nặng
          setTimeout(() => {
            setPhase("entering");
            setTimeout(() => setPhase("idle"), ENTER_DURATION);
          }, MIN_HOLD_DURATION);
          return "exiting"; // Giữ nguyên phase exiting cho đến khi timeout trên chạy
        }
        return prev;
      });
    }
  }, [pathname]);

  const navigateWithTransition = useCallback(
    (href: string) => {
      // Don't trigger if already transitioning
      if (phase !== "idle") return;

      // Same pathname + query = same document
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
          /* invalid href */
        }
      } else if (href === pathname) {
        return;
      }

      pendingHref.current = href;
      setPhase("exiting");

      // 1. Scroll lên đầu ngay khi curtain đang đóng để che đi sự thay đổi (jump)
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
      }, 300);

      // 2. Chờ curtain đóng hẳn rồi mới gọi router.push
      setTimeout(() => {
        // Sử dụng router.push bình thường, phase change sẽ được detect bởi useEffect(pathname)
        router.push(href);
        
        // Dự phòng cho trường hợp URL không đổi hoặc lag cực nặng
        const safetyTimeout = setTimeout(() => {
          setPhase((prev) => {
            if (prev === "exiting") {
              setTimeout(() => setPhase("idle"), ENTER_DURATION);
              return "entering";
            }
            return prev;
          });
        }, 8000);

        return () => clearTimeout(safetyTimeout);
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
