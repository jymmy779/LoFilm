import { useState, useEffect, useRef } from "react";

interface VttCue {
    start: number; // seconds
    end: number;
    text: string;
}

function parseVtt(raw: string): VttCue[] {
    const cues: VttCue[] = [];
    // Split into blocks by double newline
    const blocks = raw.replace(/\r\n/g, "\n").split(/\n\n+/);

    for (const block of blocks) {
        const lines = block.trim().split("\n");
        if (lines.length < 2) continue;

        // Find the timestamp line (contains "-->")
        let tsLine = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes("-->")) { tsLine = i; break; }
        }
        if (tsLine === -1) continue;

        const [startStr, endStr] = lines[tsLine].split("-->").map(s => s.trim().split(" ")[0]);
        const start = parseTimestamp(startStr);
        const end = parseTimestamp(endStr);
        if (isNaN(start) || isNaN(end)) continue;

        // Text is everything after the timestamp line
        const text = lines
            .slice(tsLine + 1)
            .join("\n")
            .replace(/<[^>]+>/g, "") // strip VTT tags like <b>, <i>, <c.color>
            .trim();

        if (text) cues.push({ start, end, text });
    }
    return cues;
}

function parseTimestamp(ts: string): number {
    // Format: HH:MM:SS.mmm or MM:SS.mmm
    const parts = ts.split(":");
    if (parts.length === 3) {
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
    } else if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return NaN;
}

export function useVttOverlay(url: string | null, videoRef: React.RefObject<HTMLVideoElement | null>) {
    const [currentText, setCurrentText] = useState<string | null>(null);
    const cuesRef = useRef<VttCue[]>([]);
    const urlRef = useRef<string | null>(null);

    // Fetch & parse VTT when URL changes
    useEffect(() => {
        if (!url) {
            cuesRef.current = [];
            setCurrentText(null);
            urlRef.current = null;
            return;
        }
        if (url === urlRef.current) return; // same URL, no refetch
        urlRef.current = url;
        setCurrentText(null);
        cuesRef.current = [];

        let cancelled = false;
        fetch(url)
            .then(r => r.text())
            .then(raw => {
                if (cancelled) return;
                cuesRef.current = parseVtt(raw);
            })
            .catch(() => {
                // Silent fail — just no subtitle
                cuesRef.current = [];
            });

        return () => { cancelled = true; };
    }, [url]);

    // Sync cue text with video currentTime
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            const t = video.currentTime;
            const cue = cuesRef.current.find(c => t >= c.start && t <= c.end);
            setCurrentText(cue?.text ?? null);
        };

        video.addEventListener("timeupdate", handleTimeUpdate);
        return () => video.removeEventListener("timeupdate", handleTimeUpdate);
    }, [videoRef]);

    // Reset text when URL changes
    useEffect(() => {
        setCurrentText(null);
    }, [url]);

    return currentText;
}
