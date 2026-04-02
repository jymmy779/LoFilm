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
    episode_total?: string;
    quality?: string;
    lang?: string;
    category?: { name: string; slug: string }[];
    country?: { name: string; slug: string }[];
    type?: string;
    modified?: {
        time: string;
    };
    tmdb?: {
        vote_average: number;
        vote_count: number;
    };
}
