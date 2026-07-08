export interface Movie {
    _id: string;
    name: string;
    slug: string;
    origin_name: string;
    thumb_url: string;
    poster_url: string;
    year: number;
    content?: string;
    time?: string;
    episode_current?: string;
    episode_total?: string | number; // API kkphim có thể trả về string hoặc number
    quality?: string;
    lang?: string;
    status?: string;
    category?: { id?: string; name: string; slug: string }[];
    country?: { id?: string; name: string; slug: string }[];
    type?: string;
    modified?: {
        time: string;
    };
    tmdb?: {
        type?: string;
        id?: string;
        season?: number;
        vote_average: number;
        vote_count: number;
    };
    imdb?: {
        id?: string | null;
    };
    actor?: string[];
    director?: string[];
    trailer_url?: string;
    chieurap?: boolean;
    sub_docquyen?: boolean;
    is_copyright?: boolean;
    notify?: string;
    showtimes?: string;
    view?: number;
}

// Subtitle track for bilingual support
export interface SubtitleTrack {
    lang: string;    // "vi", "en", "ko", "zh"
    label: string;   // "Tiếng Việt", "English", "한국어", "中文"
    url: string;     // https://r2.../file.vtt
}

// Episode data from API
export interface EpisodeItem {
    name: string;
    slug: string;
    filename: string;
    link_embed: string;
    link_m3u8: string;
    link_vtt?: string;           // backward compat — single VTT
    subtitles?: SubtitleTrack[]; // multi-track for bilingual
}

export interface EpisodeServer {
    server_name: string;
    server_data: EpisodeItem[];
}

// Full movie detail response from API
export interface MovieDetailResponse {
    status: boolean;
    msg: string;
    movie: Movie;
    episodes: EpisodeServer[];
}
