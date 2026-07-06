"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface PageTransitionContextType {
  /** Trigger navigation to the given href immediately */
  navigateWithTransition: (href: string, isHard?: boolean) => void;
}

const PageTransitionContext = createContext<PageTransitionContextType>({
  navigateWithTransition: () => { },
});

export function usePageTransition() {
  return useContext(PageTransitionContext);
}

export function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const navigateWithTransition = useCallback(
    (href: string, isHard: boolean = false) => {
      if (typeof window !== "undefined" && !navigator.onLine) {
        toast.error("Không có kết nối mạng. Vui lòng kiểm tra lại đường truyền!", {
          id: "offline-error",
          duration: 3000,
        });
        return;
      }

      if (isHard && typeof window !== "undefined") {
        window.location.href = href;
        return;
      }
      
      router.push(href);
    },
    [router]
  );

  const contextValue = useMemo(() => ({ navigateWithTransition }), [navigateWithTransition]);

  return (
    <PageTransitionContext.Provider value={contextValue}>
      {children}
    </PageTransitionContext.Provider>
  );
}
