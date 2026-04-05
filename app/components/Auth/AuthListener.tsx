"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/utils/supabase/client";
import { toast } from "react-hot-toast";

export default function AuthListener() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Catch password recovery event
      if (event === "PASSWORD_RECOVERY") {
        toast.success("Hệ thống đã sẵn sàng để bạn đặt lại mật khẩu!");
        router.push("/dat-lai-mat-khau");
      }
      
      // Handle signed in event if we are on the login page but arrived via a special link
      if (event === "SIGNED_IN") {
        // If we have a recovery token in the URL fragment
        if (window.location.hash.includes("type=recovery") || window.location.hash.includes("access_token=")) {
          router.push("/dat-lai-mat-khau");
        }
      }
    });

    // Also check on mount if we're on home with a recovery hash
    if (window.location.hash.includes("type=recovery")) {
      router.push("/dat-lai-mat-khau");
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  return null;
}
