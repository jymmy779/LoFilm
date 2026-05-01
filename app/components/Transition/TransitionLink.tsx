"use client";

import Link from "next/link";
import { usePageTransition } from "./PageTransitionContext";
import { useCallback, type ComponentProps, type MouseEvent } from "react";

type NextLinkProps = ComponentProps<typeof Link>;

interface TransitionLinkProps extends NextLinkProps {
  /** Set false to disable the transition for this specific link */
  transition?: boolean;
}

/**
 * TransitionLink – Drop-in replacement for next/link.
 *
 * Wraps `<Link>` and intercepts the click to trigger the page transition
 * overlay before letting Next.js perform the actual navigation.
 *
 * Usage: Simply swap `import Link from "next/link"` with
 *        `import TransitionLink from "@/app/components/Transition/TransitionLink"`
 *        and rename `<Link>` → `<TransitionLink>`.
 *
 * Pass `transition={false}` to disable animation for specific links (e.g. anchors).
 */
export default function TransitionLink({
  href,
  onClick,
  children,
  transition = true, // Mặc định là true
  ...rest
}: TransitionLinkProps) {
  const { navigateWithTransition } = usePageTransition();

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      // Nếu có onClick prop từ bên ngoài (ví dụ AdTrigger), gọi nó trước
      if (onClick) onClick(e);

      // Nếu transition bị tắt hoặc phím tắt (Ctrl, Meta...) được nhấn, để trình duyệt xử lý tự nhiên
      if (
        transition === false ||
        e.defaultPrevented ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // Ngăn chặn Link mặc định của Next.js và chạy qua logic Transition của mình
      e.preventDefault();
      navigateWithTransition(href.toString());
    },
    [href, onClick, transition, navigateWithTransition]
  );

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
