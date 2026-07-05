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
  transition = true,
  ...rest
}: TransitionLinkProps) {
  const { navigateWithTransition } = usePageTransition();

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (onClick) onClick(e);

      // Cho phép Next.js xử lý mặc định nếu user muốn mở tab mới (Ctrl+Click)
      if (
        !transition ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey ||
        (rest.target && rest.target !== "_self")
      ) {
        return;
      }

      // Ngăn Next.js nhảy trang ngay lập tức
      e.preventDefault();
      // Kích hoạt thanh Progress Bar rồi mới điều hướng
      navigateWithTransition(href.toString());
    },
    [href, onClick, transition, navigateWithTransition, rest.target]
  );

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
