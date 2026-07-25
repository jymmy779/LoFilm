"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "shimmer" | "pulse" | "static";
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  style?: React.CSSProperties;
}

export default function Skeleton({
  className,
  variant = "pulse",
  rounded = "md",
  style,
}: SkeletonProps) {
  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
    full: "rounded-full",
  };

  const baseClasses = "bg-white/5";
  const variantClasses = variant === "shimmer" ? "skeleton-shimmer" : variant === "pulse" ? "animate-pulse" : "";
  const combinedClasses = `${baseClasses} ${variantClasses} ${roundedClasses[rounded]} ${className || ""}`.trim();

  return (
    <div className={combinedClasses} style={style} />
  );
}
