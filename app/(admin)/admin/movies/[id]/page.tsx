import { createClient } from "@/app/utils/supabase/server";
import { redirect } from "next/navigation";
import MovieWorkspaceClient from "./MovieWorkspaceClient";

export default async function MovieWorkspacePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient();

    let movie = null;
    let lastError = null;
    
    const { data, error } = await supabase
        .from('exclusive_movies')
        .select(`
            *,
            cms_movie_sources (*),
            exclusive_episodes (*)
        `)
        .eq('id', params.id)
        .single();

    if (data) { movie = data; }
    lastError = error;

    if (!movie) {
        console.error("[Admin] Lỗi load phim:", lastError?.message);
        redirect("/admin/movies");
    }

    return <MovieWorkspaceClient movie={movie} />;
}
