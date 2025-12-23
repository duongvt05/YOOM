"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/actions/auth.actions";
import { useToast } from "@/components/ui/use-toast";

export default function SignUpPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await registerUser(form);
    
    if (res.error) {
      toast({ title: "Lỗi", description: res.error, variant: "destructive" });
    } else {
      toast({ title: "Thành công", description: "Tạo tài khoản thành công! Hãy đăng nhập." });
      router.push("/sign-in");
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-dark-1">
      <form onSubmit={handleSubmit} className="flex w-full max-w-[400px] flex-col gap-6 rounded-xl bg-dark-2 p-10 text-white shadow-lg border border-dark-3">
        <h1 className="text-3xl font-bold text-center">Đăng Ký</h1>
        
        <input type="text" placeholder="Tên đăng nhập" className="bg-dark-3 p-3 rounded text-white"
          onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        
        <input type="email" placeholder="Email" className="bg-dark-3 p-3 rounded text-white"
          onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        
        <input type="password" placeholder="Mật khẩu" className="bg-dark-3 p-3 rounded text-white"
          onChange={(e) => setForm({ ...form, password: e.target.value })} required />

        <button type="submit" className="bg-blue-1 hover:bg-blue-600 p-3 rounded font-bold transition-all">
          Đăng Ký Ngay
        </button>
        <p className="text-center text-sm text-gray-400">
           Đã có tài khoản? <Link href="/sign-in" className="text-blue-1">Đăng nhập</Link>
        </p>
      </form>
    </div>
  );
}