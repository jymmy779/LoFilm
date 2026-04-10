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
  transition, // Bóc tách ra để không truyền xuống DOM
  ...rest
}: TransitionLinkProps) {
  return (
    <Link href={href} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}
