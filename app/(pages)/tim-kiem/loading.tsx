import LoadingSpinner from "@/app/components/UI/Common/LoadingSpinner";

export default function SearchLoading() {
    return (
        <main className="pt-24 md:pt-28 pb-12 min-h-[80vh] flex items-center justify-center">
            <LoadingSpinner size="lg" color="default" />
        </main>
    );
}
