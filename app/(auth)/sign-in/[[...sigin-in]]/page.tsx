"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser } from "@/actions/auth.actions";
import { useToast } from "@/components/ui/use-toast";

export default function SignInPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await loginUser(form);
    
    if (res.error) {
      toast({ title: "Lỗi", description: res.error, variant: "destructive" });
    } else {
      toast({ title: "Thành công", description: "Đăng nhập thành công!" });
      router.push("/"); // Chuyển về trang chủ
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-dark-1">
      <form onSubmit={handleSubmit} className="flex w-full max-w-[400px] flex-col gap-6 rounded-xl bg-dark-2 p-10 text-white shadow-lg border border-dark-3">
        <h1 className="text-3xl font-bold text-center">Đăng Nhập</h1>
        
        <input type="email" placeholder="Email" className="bg-dark-3 p-3 rounded text-white"
          onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        
        <input type="password" placeholder="Mật khẩu" className="bg-dark-3 p-3 rounded text-white"
          onChange={(e) => setForm({ ...form, password: e.target.value })} required />

        <button type="submit" className="bg-blue-1 hover:bg-blue-600 p-3 rounded font-bold transition-all">
          Đăng Nhập
        </button>
        <p className="text-center text-sm text-gray-400">
           Chưa có tài khoản? <Link href="/sign-up" className="text-blue-1">Đăng ký</Link>
        </p>
      </form>
    </div>
  );
}