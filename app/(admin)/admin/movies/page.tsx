import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import MoviesTable from "./MoviesTable";

export const dynamic = "force-dynamic";

export default async function AdminMoviesPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string, search?: string }>
}) {
    const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const resolvedSearchParams = await searchParams;
    const currentPage = Number(resolvedSearchParams?.page) || 1;
    const itemsPerPage = 20;
    const search = resolvedSearchParams?.search || '';

    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    let query = supabase.from('exclusive_movies').select('id, name, slug, type, year, status, created_at, poster_url', { count: 'exact' });

    if (search) {
        query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data: movies, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

    const totalPages = count ? Math.ceil(count / itemsPerPage) : 1;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                <h1 className="text-2xl font-bold text-white">Quản lý Phim</h1>
                <Link href="/admin/movies/new" className="bg-[#D497FF] text-black px-4 py-2 rounded-lg font-bold hover:opacity-90 transition flex items-center justify-center gap-2 shrink-0">
                    <i className="fa-solid fa-plus"></i> Đăng phim thủ công
                </Link>
            </div>

            {error ? (
                <div className="bg-red-500/10 border border-red-500/50 p-4 rounded text-red-500 mb-6">
                    <strong>Lỗi:</strong> {error.message}
                </div>
            ) : (
                <MoviesTable
                    movies={movies || []}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={count || 0}
                    search={search}
                />
            )}
        </div>
    );
}
