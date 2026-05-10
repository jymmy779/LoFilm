"use client";

import React from "react";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import { ChevronLeft } from "lucide-react";

import Container from "@/app/components/Container";

interface MovieHeaderProps {
  slug: string;
  movieName: string;
  episodeName: string;
}

const MovieHeader = ({ slug, movieName, episodeName }: MovieHeaderProps) => {
  return (
    <div
      className="overflow-hidden mb-6 animate-fade-in"
    >
      <Container>
        <div className="flex items-center gap-3">
          <TransitionLink
            href={`/phim/${slug}`}
            className="w-9 h-9 flex-shrink-0 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all duration-300"
          >
            <ChevronLeft size={16} />
          </TransitionLink>
          <h2 className="text-base md:text-lg font-semibold text-white/90 font-montserrat tracking-wide">
            Xem phim {movieName} - {episodeName}
          </h2>
        </div>
      </Container>
    </div>
  );
};

export default MovieHeader;
