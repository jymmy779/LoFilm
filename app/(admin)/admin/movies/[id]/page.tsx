import { createClient } from "@/app/utils/supabase/server";
import { redirect } from "next/navigation";
import MovieWorkspaceClient from "./MovieWorkspaceClient";

export default async function MovieWorkspacePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient();

    // Retry tối đa 3 lần để xử lý Supabase cold start (DB ngủ đông)
    let movie = null;
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await supabase
            .from('exclusive_movies')
            .select(`*, exclusive_episodes (*)`)
            .eq('id', params.id)
            .single();

        if (data) { movie = data; break; }
        lastError = error;
        if (attempt < 2) await new Promise(r => setTimeout(r, 2000)); // Chờ 2s rồi thử lại
    }

    if (!movie) {
        console.error("[Admin] Không thể load phim sau 3 lần thử:", lastError?.message);
        redirect("/admin/dashboard");
    }

    return <MovieWorkspaceClient movie={movie} />;
}
