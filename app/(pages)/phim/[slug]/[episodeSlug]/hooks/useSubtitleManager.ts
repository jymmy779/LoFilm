import { useState, useCallback, useEffect } from "react";
import { SubtitleTrack } from "@/app/types/movie";

const PREFS_KEY = "lofilm-subtitle-prefs";

interface SubtitlePrefs {
    slot1: string | null; // lang code or null = off
    slot2: string | null;
}

function loadPrefs(): SubtitlePrefs {
    try {
        const raw = localStorage.getItem(PREFS_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return { slot1: null, slot2: null };
}

function savePrefs(prefs: SubtitlePrefs) {
    try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {}
}

export function useSubtitleManager(subtitles: SubtitleTrack[]) {
    const hasMultiple = subtitles.length >= 2;

    const [slot1, setSlot1Raw] = useState<string | null>(() => {
        if (!hasMultiple) return subtitles[0]?.lang ?? null;
        const prefs = loadPrefs();
        // Validate saved lang still exists in current subtitles
        const exists = subtitles.some(s => s.lang === prefs.slot1);
        return exists ? prefs.slot1 : (subtitles[0]?.lang ?? null);
    });

    const [slot2, setSlot2Raw] = useState<string | null>(() => {
        if (!hasMultiple) return null;
        const prefs = loadPrefs();
        const exists = subtitles.some(s => s.lang === prefs.slot2);
        return exists && prefs.slot2 !== slot1 ? prefs.slot2 : null;
    });

    // Re-validate when subtitles array changes (episode switch)
    useEffect(() => {
        if (subtitles.length === 0) {
            setSlot1Raw(null);
            setSlot2Raw(null);
            return;
        }
        if (!hasMultiple) {
            setSlot1Raw(subtitles[0]?.lang ?? null);
            setSlot2Raw(null);
            return;
        }
        setSlot1Raw(prev => {
            const exists = subtitles.some(s => s.lang === prev);
            return exists ? prev : (subtitles[0]?.lang ?? null);
        });
        setSlot2Raw(prev => {
            const exists = prev && subtitles.some(s => s.lang === prev);
            return exists ? prev : null;
        });
    }, [subtitles, hasMultiple]);

    const setSlot1 = useCallback((lang: string | null) => {
        setSlot1Raw(lang);
        setSlot2Raw(prev => (prev === lang ? null : prev));
        savePrefs({ slot1: lang, slot2: slot2 === lang ? null : slot2 });
    }, [slot2]);

    const setSlot2 = useCallback((lang: string | null) => {
        setSlot2Raw(lang);
        savePrefs({ slot1: slot1, slot2: lang });
    }, [slot1]);

    // Options available for each slot (mutual exclusion)
    const optionsForSlot1 = subtitles; // all options, slot2 lang will be disabled in UI
    const optionsForSlot2 = subtitles; // all options, slot1 lang will be disabled in UI

    // Get track URL for a given lang
    const getUrl = useCallback((lang: string | null) => {
        if (!lang) return null;
        return subtitles.find(s => s.lang === lang)?.url ?? null;
    }, [subtitles]);

    const slot1Url = getUrl(slot1);
    const slot2Url = getUrl(slot2);

    const slot1Label = subtitles.find(s => s.lang === slot1)?.label ?? null;
    const slot2Label = subtitles.find(s => s.lang === slot2)?.label ?? null;

    return {
        slot1, slot2,
        slot1Url, slot2Url,
        slot1Label, slot2Label,
        setSlot1, setSlot2,
        optionsForSlot1, optionsForSlot2,
        hasMultiple,
    };
}
