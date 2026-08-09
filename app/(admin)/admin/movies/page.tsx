import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import MoviesTable from "./MoviesTable";

export const dynamic = "force-dynamic";

export default async function AdminMoviesPage({
    searchParams,
}: {
    searchParams: { page?: string, search?: string }
}) {
    const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const currentPage = Number(searchParams?.page) || 1;
    const itemsPerPage = 20;
    const search = searchParams?.search || '';

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
        <div className="bg-[#0F1115] min-h-screen text-white">
            <header className="bg-[#0F1115] border-b border-white/10 top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <img src="/images/lofilm_logo.webp" alt="LoFilm Logo" className="h-8" />
                        </Link>
                        <Link href="/admin/dashboard" className="text-gray-400 font-medium border-l border-white/20 pl-4 hover:text-white transition">Admin Dashboard</Link>
                        <i className="fa-solid fa-chevron-right text-gray-600 text-sm mx-1"></i>
                        <span className="font-medium text-white">Quản lý Phim</span>
                    </div>
                    <Link href="/admin/movies/new" className="bg-[#D497FF] text-black px-4 py-2 rounded-lg font-medium hover:opacity-90 transition flex items-center gap-2">
                        <i className="fa-solid fa-plus"></i> Đăng phim thủ công
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
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
            </main>
        </div>
    );
}
