"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Wifi, WifiOff } from "lucide-react";

export default function NetworkMonitor() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initial check
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Đã khôi phục kết nối internet!", {
        id: "network-status",
        icon: <Wifi size={18} className="text-green-500" />,
        duration: 3000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Mất kết nối internet. Một số tính năng sẽ bị hạn chế.", {
        id: "network-status",
        icon: <WifiOff size={18} className="text-rose-500" />,
        duration: 5000,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // No physical UI needed, just global toasts
  return null;
}
