"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAdmin(formData: FormData) {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (
        username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD
    ) {
        const cookieStore = await cookies();
        cookieStore.set("lofilm_admin_token", password, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });
        return { success: true };
    }
    return { error: "Sai tên đăng nhập hoặc mật khẩu" };
}

export async function logoutAdmin() {
    const cookieStore = await cookies();
    cookieStore.delete("lofilm_admin_token");
    redirect("/admin/login");
}
