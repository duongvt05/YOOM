"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, updateUser } from "@/actions/auth.actions";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Loader from "@/components/Loader";

const ProfilePage = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const { toast } = useToast();
  const router = useRouter();

  // Lấy thông tin user khi vào trang
  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
          router.push('/sign-in');
          return;
      }
      setUser(currentUser);
      setUsername(currentUser.username); // Điền sẵn tên cũ
      setIsLoading(false);
    };
    loadUser();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const res = await updateUser(user._id, { 
        username, 
        newPassword: newPassword || undefined // Nếu ko nhập pass thì gửi undefined
    });

    if (res.success) {
        toast({ title: "Thành công", description: "Cập nhật thông tin thành công!" });
        setNewPassword(""); // Reset ô mật khẩu
        router.refresh(); // Làm mới để Navbar cập nhật tên mới
    } else {
        toast({ title: "Lỗi", description: res.error, variant: "destructive" });
    }
    setIsSaving(false);
  };

  if (isLoading) return <Loader />;

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <h1 className="text-3xl font-bold">Thông tin tài khoản</h1>

      <div className="w-full max-w-[600px] bg-dark-2 p-8 rounded-xl border border-dark-3">
        <form onSubmit={handleUpdate} className="flex flex-col gap-6">
            
            {/* Email (Chỉ đọc - không cho sửa) */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Email</label>
                <Input disabled value={user.email} className="bg-dark-3 border-none text-gray-500 cursor-not-allowed" />
            </div>

            {/* Tên hiển thị */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-sky-1">Tên hiển thị</label>
                <Input 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    className="bg-dark-3 border-none text-white focus:ring-2 focus:ring-blue-1" 
                />
            </div>

            {/* Mật khẩu mới */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-sky-1">Mật khẩu mới (Bỏ trống nếu không đổi)</label>
                <Input 
                    type="password"
                    placeholder="Nhập mật khẩu mới..."
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    className="bg-dark-3 border-none text-white focus:ring-2 focus:ring-blue-1" 
                />
            </div>

            <Button type="submit" disabled={isSaving} className="bg-blue-1 hover:bg-blue-600 mt-4">
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
        </form>
      </div>
    </section>
  );
};

export default ProfilePage;