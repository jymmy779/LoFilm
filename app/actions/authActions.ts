"use server";

import { createClient } from "@supabase/supabase-js";

export async function checkEmailExists(email: string) {
    if (!email) return false;

    // We must use the service role key to bypass RLS and access the admin API
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        // Attempt to generate a recovery link
        // If the user does not exist, this will return an error 'User not found'
        const { error } = await supabaseAdmin.auth.admin.generateLink({
            type: "recovery",
            email: email,
        });

        if (error) {
            console.error("checkEmailExists error:", error.message);
            // Error means user likely doesn't exist
            return false;
        }

        // Successfully generated the link, meaning the user exists.
        return true;
    } catch (err) {
        console.error("checkEmailExists unexpected error:", err);
        return false;
    }
}
