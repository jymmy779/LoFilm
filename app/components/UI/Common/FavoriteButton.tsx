"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/app/utils/supabase/client";
import { useFavorites } from "@/app/(pages)/phim/[slug]/[episodeSlug]/hooks/useFavorites";
import { Movie } from "@/app/types/movie";

interface FavoriteButtonProps {
    movie: Movie;
    className?: string;
    iconSize?: number;
}

export default function FavoriteButton({ movie, className = "", iconSize = 18 }: FavoriteButtonProps) {
    const { isFavorited, toggleFavorite } = useFavorites(
        movie.slug,
        movie.name,
        movie.poster_url || "",
        movie.thumb_url
    );

    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite();
            }}
            className={`cursor-pointer transition-all duration-300 flex items-center justify-center ${className}`}
            aria-label={isFavorited ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                width={iconSize}
                height={iconSize}
                fill={isFavorited ? "#ff4d4f" : "currentColor"}
                className={`${isFavorited ? "drop-shadow-[0_0_8px_rgba(255,77,79,0.5)]" : ""} transition-all duration-300 transform active:scale-95`}
            >
                <path d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z" />
            </svg>
        </button>
    );
}
