import LoadingSpinner from "@/app/components/UI/Common/LoadingSpinner";

export default function ProfileSkeleton() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center w-full xl:w-[calc(100%+100px)] xl:-ml-[100px]">
            <div className="flex flex-col items-center gap-4">
                <LoadingSpinner size="lg" color="orange" />
            </div>
        </div>
    );
}
