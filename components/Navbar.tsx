'use client';
import Image from 'next/image';
import Link from 'next/link';
import MobileNav from './MobileNav';
import { useEffect, useState } from 'react';
import { getCurrentUser, logoutUser } from '@/actions/auth.actions';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react'; // Icon

const Navbar = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Lấy thông tin user thật
  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getCurrentUser();
      setUser(userData);
    }
    fetchUser();
  }, []);

  // Hàm đăng xuất
  const handleLogout = async () => {
    await logoutUser();
    router.push('/sign-in');
    router.refresh(); // F5 lại trang để xóa state cũ
  };

  return (
    <nav className="flex-between fixed z-50 w-full bg-dark-1 px-6 py-4 lg:px-10 border-b border-dark-2/20">
      <Link href="/" className="flex items-center gap-1">
        <Image
          src="/icons/logo.svg"
          width={32}
          height={32}
          alt="Yoom logo"
          className="max-sm:size-10"
        />
        <p className="text-[26px] font-extrabold text-white max-sm:hidden">
          YOOM
        </p>
      </Link>

      <div className="flex-between gap-5">
        
        {/* --- AVATAR USER & DROPDOWN --- */}
        {user ? (
            <div className="relative">
                {/* Nút Avatar */}
                <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 cursor-pointer focus:outline-none"
                >
                    <span className="text-white font-semibold max-md:hidden">
                        {user.username}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold overflow-hidden border-2 border-transparent hover:border-blue-400 transition-all">
    {/* Nếu user có avatar (bất kể link online hay offline) thì hiện ảnh */}
    {user.avatar ? (
        <img 
            src={user.avatar} 
            alt="avatar" 
            className="w-full h-full object-cover" 
        />
    ) : (
        // Nếu không có avatar thì hiện chữ cái đầu tên user
        user.username.charAt(0).toUpperCase()
    )}
</div>
                </button>

                {/* Menu Dropdown */}
                {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-dark-2 rounded-xl shadow-xl border border-dark-3 py-2 animate-in fade-in zoom-in duration-200 z-50">
                        <div className="px-4 py-2 border-b border-dark-3 mb-2">
                            <p className="text-sm text-white font-bold">{user.username}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                        
                        {/* --- SỬA DÒNG NÀY --- */}
                        {/* Cũ: Link href="/personal-room" ... Phòng cá nhân */}
                        <Link 
                            href="/profile" 
                            className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-dark-3 hover:text-white transition-colors"
                            onClick={() => setIsDropdownOpen(false)} // Đóng menu khi bấm
                        >
                            <User size={18} /> Thông tin tài khoản
                        </Link>
                        {/* ------------------- */}
                        
                        <button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-dark-3 hover:text-red-400 transition-colors text-left border-t border-dark-3 mt-1"
                        >
                            <LogOut size={18} /> Đăng xuất
                        </button>
                    </div>
                )}
                
                {/* Lớp phủ để click ra ngoài thì đóng menu */}
                {isDropdownOpen && (
                    <div className="fixed inset-0 z-[-1]" onClick={() => setIsDropdownOpen(false)}></div>
                )}
            </div>
        ) : (
            // Nếu chưa đăng nhập thì hiện nút Login
            <Link href="/sign-in" className="bg-blue-1 px-4 py-2 rounded-lg text-white font-semibold hover:bg-blue-700 transition-all">
                Đăng nhập
            </Link>
        )}

        {/* Mobile Nav */}
        <MobileNav /> 
      </div>
    </nav>
  );
};

export default Navbar;