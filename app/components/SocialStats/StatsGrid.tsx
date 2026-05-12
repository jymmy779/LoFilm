import TrendingList from "./TrendingList";
import FavoriteList from "./FavoriteList";
import GenreList from "./GenreList";
import NewCommentsTicker from "./NewCommentsTicker";

export default function StatsGrid() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            <TrendingList />
            <FavoriteList />
            <GenreList />
            <NewCommentsTicker />
        </div>
    );
}
