import LoadingSpinner from "@/app/components/UI/Common/LoadingSpinner";

export default function TermsLoading() {
    return (
        <main className="min-h-[80vh] flex items-center justify-center pt-24 pb-12">
            <LoadingSpinner size="lg" color="default" />
        </main>
    );
}
