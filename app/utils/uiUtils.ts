// Color list — exactly 20 distinct vibrant, high-contrast colors on dark backgrounds
const CATEGORY_COLORS_TEXT = [
    "text-rose-400 hover:text-rose-300",       // 0: Rose Pink
    "text-emerald-400 hover:text-emerald-300", // 1: Emerald Green
    "text-sky-400 hover:text-sky-300",         // 2: Sky Blue
    "text-amber-400 hover:text-amber-300",     // 3: Warm Amber
    "text-violet-300 hover:text-violet-200",   // 4: Vivid Electric Violet (Brightened)
    "text-teal-400 hover:text-teal-300",       // 5: Teal
    "text-orange-400 hover:text-orange-300",   // 6: Bright Orange
    "text-cyan-400 hover:text-cyan-300",       // 7: Vivid Cyan
    "text-fuchsia-400 hover:text-fuchsia-300", // 8: Fuchsia Pink
    "text-lime-400 hover:text-lime-300",       // 9: Bright Lime
    "text-pink-400 hover:text-pink-300",       // 10: Neon Pink
    "text-indigo-300 hover:text-indigo-200",   // 11: Electric Ice Indigo (Brightened)
    "text-yellow-400 hover:text-yellow-300",   // 12: Sun Yellow
    "text-green-400 hover:text-green-300",     // 13: Pure Green
    "text-red-400 hover:text-red-300",         // 14: Crimson Red
    "text-blue-400 hover:text-blue-300",       // 15: Royal Blue
    "text-purple-300 hover:text-purple-200",   // 16: Bright Orchid Purple (Brightened)
    "text-[#06D6A0] hover:text-[#38EBB9]",     // 17: Mint Turquoise
    "text-[#FF6B6B] hover:text-[#FFA8A8]",     // 18: Coral Red
    "text-[#C77DFF] hover:text-[#E0AAFF]",     // 19: Bright Electric Lavender
];

const CATEGORY_STYLES = [
    { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
    { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" },
    { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
    { bg: "bg-violet-500/10", text: "text-violet-300", border: "border-violet-500/20" },
    { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20" },
    { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
    { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
    { bg: "bg-fuchsia-500/10", text: "text-fuchsia-400", border: "border-fuchsia-500/20" },
    { bg: "bg-lime-500/10", text: "text-lime-400", border: "border-lime-500/20" },
    { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
    { bg: "bg-indigo-500/10", text: "text-indigo-300", border: "border-indigo-500/20" },
    { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
    { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
    { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
    { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
    { bg: "bg-purple-500/10", text: "text-purple-300", border: "border-purple-500/20" },
    { bg: "bg-[#06D6A0]/10", text: "text-[#06D6A0]", border: "border-[#06D6A0]/20" },
    { bg: "bg-[#FF6B6B]/10", text: "text-[#FF6B6B]", border: "border-[#FF6B6B]/20" },
    { bg: "bg-[#C77DFF]/10", text: "text-[#C77DFF]", border: "border-[#C77DFF]/20" },
];

const hashString = (str: string): number => {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
};

export const getCategoryColor = (index?: number, name?: string) => {
    if (typeof index === "number" && index >= 0) {
        return CATEGORY_COLORS_TEXT[index % CATEGORY_COLORS_TEXT.length];
    }
    if (name) {
        return CATEGORY_COLORS_TEXT[hashString(name) % CATEGORY_COLORS_TEXT.length];
    }
    return CATEGORY_COLORS_TEXT[0];
};

export const getCategoryStyle = (input: string) => {
    return CATEGORY_STYLES[hashString(input) % CATEGORY_STYLES.length];
}

// Group variants — guarantee NO TWO slugs in the same group get the same color
// and spread adjacent items across contrasting color hues (+ i * 6 step).
export const getCategoryColors = (slugs: string[]): string[] => {
    const usedIndices: number[] = [];
    return slugs.map((slug, i) => {
        const hashIndex = hashString(slug) % CATEGORY_COLORS_TEXT.length;
        let candidate = (hashIndex + i * 6) % CATEGORY_COLORS_TEXT.length;
        let attempts = 0;
        while (usedIndices.includes(candidate) && attempts < CATEGORY_COLORS_TEXT.length) {
            candidate = (candidate + 1) % CATEGORY_COLORS_TEXT.length;
            attempts++;
        }
        usedIndices.push(candidate);
        return CATEGORY_COLORS_TEXT[candidate];
    });
}

export const getCategoryStyles = (slugs: string[]): { bg: string; text: string; border: string }[] => {
    const usedIndices: number[] = [];
    return slugs.map((slug, i) => {
        const hashIndex = hashString(slug) % CATEGORY_STYLES.length;
        let candidate = (hashIndex + i * 6) % CATEGORY_STYLES.length;
        let attempts = 0;
        while (usedIndices.includes(candidate) && attempts < CATEGORY_STYLES.length) {
            candidate = (candidate + 1) % CATEGORY_STYLES.length;
            attempts++;
        }
        usedIndices.push(candidate);
        return CATEGORY_STYLES[candidate];
    });
}

// Popup genre colors — same 20-color palette as categories (no hover, static color only).
const POPUP_GENRE_COLORS_TEXT = [
    "text-rose-400",
    "text-emerald-400",
    "text-sky-400",
    "text-amber-400",
    "text-violet-300",
    "text-teal-400",
    "text-orange-400",
    "text-cyan-400",
    "text-fuchsia-400",
    "text-lime-400",
    "text-pink-400",
    "text-indigo-300",
    "text-yellow-400",
    "text-green-400",
    "text-red-400",
    "text-blue-400",
    "text-purple-300",
    "text-[#06D6A0]",
    "text-[#FF6B6B]",
    "text-[#C77DFF]",
];

export const getPopupGenreColors = (slugs: string[]): string[] => {
    const indices: number[] = [];
    for (let i = 0; i < slugs.length; i++) {
        const dropdownIndex = hashString(slugs[i]) % POPUP_GENRE_COLORS_TEXT.length;
        let candidate = (dropdownIndex + 8 + i * 6) % POPUP_GENRE_COLORS_TEXT.length;
        let attempts = 0;
        // Shift until the candidate differs from all already-assigned popup colors AND from its own dropdown color.
        while (
            (indices.includes(candidate) || candidate === dropdownIndex) &&
            attempts < POPUP_GENRE_COLORS_TEXT.length
        ) {
            candidate = (candidate + 1) % POPUP_GENRE_COLORS_TEXT.length;
            attempts++;
        }
        indices.push(candidate);
    }
    return indices.map((i) => POPUP_GENRE_COLORS_TEXT[i]);
}
