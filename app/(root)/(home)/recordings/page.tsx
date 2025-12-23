"use client";
import React, { useEffect, useState } from "react";
// [THÊM] Import icon thùng rác (Trash2)
import { Loader2, Download, Video, Trash2 } from "lucide-react";
import { getCurrentUser } from "@/actions/auth.actions";
import { useToast } from "@/components/ui/use-toast"; // Nếu bạn có component toast

const RecordingsPage = () => {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(""); // Để hiện loading khi đang xóa
  const { toast } = useToast(); 

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        setIsLoading(true);
        const user = await getCurrentUser();
        const username = user?.username || "Guest"; 
        
        const res = await fetch(`/api/recordings?username=${username}`);
        const data = await res.json();
        
        if (data.files) {
           setRecordings(data.files);
        }
      } catch (error) {
        console.error("Lỗi tải danh sách:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecordings();
  }, []);

  // --- HÀM XỬ LÝ XÓA ---
  const handleDelete = async (filename: string) => {
    // 1. Xác nhận trước khi xóa
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa video này vĩnh viễn không?");
    if (!confirmed) return;

    setIsDeleting(filename); // Bật trạng thái đang xóa cho video này

    try {
      // 2. Gọi API xóa file
      const res = await fetch("/api/recordings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });

      if (res.ok) {
        // 3. [QUAN TRỌNG] Cập nhật giao diện ngay lập tức (Xóa khỏi mảng state)
        setRecordings((prev) => prev.filter((rec) => rec.name !== filename));
        toast({ title: "Đã xóa video thành công!" });
      } else {
        toast({ title: "Xóa thất bại", variant: "destructive" });
      }
    } catch (error) {
      console.error("Lỗi xóa:", error);
      toast({ title: "Lỗi kết nối", variant: "destructive" });
    } finally {
      setIsDeleting("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <section className="flex size-full flex-col gap-10 text-white p-10">
      <h1 className="text-3xl font-bold">Danh sách ghi hình của bạn</h1>

      {recordings.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Video className="w-16 h-16 text-gray-500" />
            <p className="text-gray-400 text-lg">Chưa có bản ghi hình nào của bạn.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recordings.map((rec, index) => (
            <div key={index} className="bg-[#1c1f2e] border border-gray-700 rounded-xl overflow-hidden shadow-lg flex flex-col hover:border-blue-500 transition-colors">
              
              {/* VIDEO PLAYER */}
              <div className="relative bg-black h-48 w-full group">
                <video src={rec.url} controls preload="metadata" className="w-full h-full object-contain" />
              </div>

              {/* THÔNG TIN & NÚT BẤM */}
              <div className="p-4 flex flex-col gap-3">
                <div>
                    <p className="font-semibold truncate text-sm text-gray-200" title={rec.name}>{rec.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(rec.time).toLocaleString("vi-VN")}</p>
                </div>

                <div className="flex gap-2 mt-2">
                    {/* NÚT TẢI XUỐNG */}
                    <a href={rec.url} download={rec.name} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-bold text-xs transition text-white">
                        <Download className="w-4 h-4" /> Tải về
                    </a>

                    {/* NÚT XÓA [MỚI] */}
                    <button 
                        onClick={() => handleDelete(rec.name)}
                        disabled={isDeleting === rec.name}
                        className="flex items-center justify-center px-3 bg-red-600/20 hover:bg-red-600/40 text-red-500 border border-red-600/50 rounded-lg transition disabled:opacity-50"
                        title="Xóa video"
                    >
                        {isDeleting === rec.name ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default RecordingsPage;