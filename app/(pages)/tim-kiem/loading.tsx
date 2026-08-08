import LoadingSpinner from "@/app/components/UI/Common/LoadingSpinner";

export default function SearchLoading() {
    return (
        <main className="min-h-screen bg-[#0F1115] flex items-center justify-center">
            <LoadingSpinner size="lg" />
        </main>
    );
}
