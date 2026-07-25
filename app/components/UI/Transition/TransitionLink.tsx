"use client";

import Link from "next/link";
import { type ComponentProps } from "react";

type NextLinkProps = ComponentProps<typeof Link>;

interface TransitionLinkProps extends NextLinkProps {
  transition?: boolean;
}

export default function TransitionLink({
  transition = true,
  prefetch = true, // Đổi sang false theo best practice cho trang web nhiều nội dung để tránh nghẽn mạng/server
  ...rest
}: TransitionLinkProps) {
  // Trả về thẻ Link nguyên thủy nhất của Next.js với cờ prefetch=true
  return <Link prefetch={prefetch} {...rest} />;
}
