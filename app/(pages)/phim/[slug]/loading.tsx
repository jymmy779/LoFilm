import LoadingSpinner from "@/app/components/UI/Common/LoadingSpinner";

export default function MovieDetailLoading() {
    return (
        <main className="min-h-[80vh] flex items-center justify-center">
            <LoadingSpinner size="lg" color="default" />
        </main>
    );
}
