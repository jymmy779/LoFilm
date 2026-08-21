import AdminDashboard from "./AdminDashboard";
import Link from "next/link";
import { logoutAdmin } from "@/app/actions/adminAuth";

import { getSiteSettings } from "@/app/actions/adminSettings";
import { getStarredMovies } from "@/app/actions/adminStarred";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
    const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    let stats = { moviesCount: 0, episodesCount: 0, sourcesCount: 0 };
    let error: any = null;

    try {
        const { count: mCount } = await supabase.from('exclusive_movies').select('*', { count: 'exact', head: true });
        const { count: eCount } = await supabase.from('exclusive_episodes').select('*', { count: 'exact', head: true });
        stats = {
            moviesCount: mCount || 0,
            episodesCount: eCount || 0,
            sourcesCount: 0
        };
    } catch (e: any) {
        error = e;
        console.error("[Dashboard] Lỗi lấy thống kê:", e);
    }

    const settings = await getSiteSettings();
    const starredRes = await getStarredMovies();
    const starredMovies = starredRes.data || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                <h1 className="text-2xl font-bold text-white">Tổng quan Dashboard</h1>
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition">Về trang chủ</Link>
                    <form action={logoutAdmin}>
                        <button type="submit" className="text-sm bg-red-600/10 text-red-500 font-medium hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg transition">
                            Đăng xuất
                        </button>
                    </form>
                </div>
            </div>

            {error ? (
                <div className="bg-red-500/10 border border-red-500/50 p-4 rounded text-red-500 mb-6">
                    <strong>Lỗi kết nối CSDL: </strong> {error.message}. <br />
                    <em>Vui lòng chắc chắn rằng bạn đã chạy đoạn mã SQL tạo bảng trong Supabase Dashboard.</em>
                </div>
            ) : null}
            <AdminDashboard initialStats={stats} initialSettings={settings} initialStarredMovies={starredMovies} />
        </div>
    );
}
