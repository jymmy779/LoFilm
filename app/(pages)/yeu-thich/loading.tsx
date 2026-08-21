import LoadingSpinner from "@/app/components/UI/Common/LoadingSpinner";

export default function FavoritesLoading() {
    return (
        <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
            <LoadingSpinner size="md" color="red" />
        </main>
    );
}
