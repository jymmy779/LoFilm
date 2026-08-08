// Color list — 16 distinct colors with no repeats
const CATEGORY_COLORS_TEXT = [
    "text-rose-400 hover:text-rose-300",
    "text-emerald-400 hover:text-emerald-300",
    "text-sky-400 hover:text-sky-300",
    "text-amber-400 hover:text-amber-300",
    "text-violet-400 hover:text-violet-300",
    "text-teal-400 hover:text-teal-300",
    "text-orange-400 hover:text-orange-300",
    "text-cyan-400 hover:text-cyan-300",
    "text-fuchsia-400 hover:text-fuchsia-300",
    "text-lime-400 hover:text-lime-300",
    "text-pink-400 hover:text-pink-300",
    "text-indigo-400 hover:text-indigo-300",
    "text-yellow-400 hover:text-yellow-300",
    "text-green-400 hover:text-green-300",
    "text-red-400 hover:text-red-300",
    "text-blue-400 hover:text-blue-300",
];

const CATEGORY_STYLES = [
    { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
    { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" },
    { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
    { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
    { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20" },
    { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
    { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
    { bg: "bg-fuchsia-500/10", text: "text-fuchsia-400", border: "border-fuchsia-500/20" },
    { bg: "bg-lime-500/10", text: "text-lime-400", border: "border-lime-500/20" },
    { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
    { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
    { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
    { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
    { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
    { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
];

const hashString = (str: string): number => {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
};

export const getCategoryColor = (index: number, name?: string) => {
    if (name) {
        return CATEGORY_COLORS_TEXT[hashString(name) % CATEGORY_COLORS_TEXT.length];
    }
    return CATEGORY_COLORS_TEXT[index % CATEGORY_COLORS_TEXT.length];
}

export const getCategoryStyle = (input: string) => {
    return CATEGORY_STYLES[hashString(input) % CATEGORY_STYLES.length];
}

// Group variants — guarantee NO TWO slugs in the same group get the same color.
// Every genre keeps its hash-based color as the starting candidate (consistent across pages),
// but if a neighbor already took that color we shift to the next available one.
export const getCategoryColors = (slugs: string[]): string[] => {
    const usedIndices: number[] = [];
    return slugs.map((slug) => {
        const hashIndex = hashString(slug) % CATEGORY_COLORS_TEXT.length;
        let candidate = hashIndex;
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
    return slugs.map((slug) => {
        const hashIndex = hashString(slug) % CATEGORY_STYLES.length;
        let candidate = hashIndex;
        let attempts = 0;
        while (usedIndices.includes(candidate) && attempts < CATEGORY_STYLES.length) {
            candidate = (candidate + 1) % CATEGORY_STYLES.length;
            attempts++;
        }
        usedIndices.push(candidate);
        return CATEGORY_STYLES[candidate];
    });
}

// Popup genre colors — same 16-color palette as categories (no hover, static color only).
// Colors are assigned so that:
//   1. Every genre in the SAME popup gets a DIFFERENT color from each other.
//   2. Each genre gets a DIFFERENT color than the sidebar/dropdown genres row (guaranteed).
const POPUP_GENRE_COLORS_TEXT = [
    "text-rose-400",
    "text-emerald-400",
    "text-sky-400",
    "text-amber-400",
    "text-violet-400",
    "text-teal-400",
    "text-orange-400",
    "text-cyan-400",
    "text-fuchsia-400",
    "text-lime-400",
    "text-pink-400",
    "text-indigo-400",
    "text-yellow-400",
    "text-green-400",
    "text-red-400",
    "text-blue-400",
];

export const getPopupGenreColors = (slugs: string[]): string[] => {
    const indices: number[] = [];
    for (let i = 0; i < slugs.length; i++) {
        const dropdownIndex = hashString(slugs[i]) % POPUP_GENRE_COLORS_TEXT.length;
        let candidate = (dropdownIndex + 8 + i * 4) % POPUP_GENRE_COLORS_TEXT.length;
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
