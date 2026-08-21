import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      <p className="text-gray-400 font-medium">Đang tải dữ liệu...</p>
    </div>
  );
}
