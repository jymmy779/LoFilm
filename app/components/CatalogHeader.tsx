"use client";

import React from "react";
import TransitionLink from "@/app/components/Transition/TransitionLink";

interface CatalogHeaderProps {
    title: string;
    breadcrumbText?: string;
    showTitle?: boolean;
}

export default function CatalogHeader({ title, breadcrumbText, showTitle = true }: CatalogHeaderProps) {
    const displayBreadcrumb = breadcrumbText || title;

    return (
        <div className="catalog-header-wrapper">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 mb-6 text-[13px] text-white/50">
                <TransitionLink href="/" className="hover:text-white transition-colors flex items-center" aria-label="Trang chủ">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
                        <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                </TransitionLink>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-50"
                >
                    <path d="m9 18 6-6-6-6" />
                </svg>
                <span className="text-white font-medium">{displayBreadcrumb}</span>
            </nav>

            {/* Catalog Title */}
            {showTitle && (
                <div className="mb-8 md:mb-10">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-blue-100 to-white mb-2 leading-tight">
                        {title}
                    </h1>
                    <div className="h-1 w-20 bg-gradient-to-r from-[#f5a623] to-transparent rounded-full opacity-80" />
                </div>
            )}
        </div>
    );
}
