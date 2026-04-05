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
  transition = true,
  children,
  ...rest
}: TransitionLinkProps) {
  const { navigateWithTransition } = usePageTransition();

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      // Call the original onClick if provided
      onClick?.(e);

      // If default was prevented by onClick, respect it
      if (e.defaultPrevented) return;

      // Skip transition for external links, hash links, or when disabled
      const hrefStr = typeof href === "string" ? href : href?.pathname || "";
      if (
        !transition ||
        hrefStr.startsWith("http") ||
        hrefStr.startsWith("#") ||
        hrefStr.startsWith("mailto:") ||
        hrefStr.startsWith("tel:")
      ) {
        return; // Let native Link handle it
      }

      // Skip if modifier keys are pressed (open in new tab, etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      e.preventDefault();
      navigateWithTransition(hrefStr);
    },
    [href, onClick, transition, navigateWithTransition]
  );

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
