'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { io } from "socket.io-client";
import { Users, LayoutList, PhoneOff, Mic, Camera } from 'lucide-react'; // Cài lucide-react nếu chưa có
import Loader from './Loader';
import EndCallButton from './EndCallButton'; // Nút EndCall socket bạn đã sửa
import { cn } from '@/lib/utils';

// Khởi tạo socket (đảm bảo server socket port 5000 đang chạy)
const socket = io('http://localhost:5000');

const MeetingRoom = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get('personal');
  
  // State giả lập để hiển thị UI
  const [layout, setLayout] = useState('speaker-left');
  const [showParticipants, setShowParticipants] = useState(false);

  // Đây là nơi bạn sẽ code logic WebRTC (Simple-Peer) như mình hướng dẫn ở câu trước
  // Tạm thời mình để khung giao diện (UI) giống hệt mẫu để bạn không bị lỗi

  return (
    <section className="relative h-screen w-full overflow-hidden pt-4 text-white bg-dark-1">
      <div className="relative flex size-full items-center justify-center">
        <div className="flex size-full max-w-[1000px] items-center justify-center">
            {/* KHUNG VIDEO (Thay thế cho CallLayout của Stream) */}
            <div className="grid grid-cols-2 gap-4 w-full h-[600px] p-4">
                {/* Video của mình */}
                <div className="bg-gray-800 rounded-lg flex items-center justify-center border-2 border-blue-500 relative">
                     <span className="text-white">My Video Stream (WebRTC)</span>
                     {/* <video ... /> sẽ đặt ở đây */}
                </div>
                {/* Video đối phương */}
                <div className="bg-gray-800 rounded-lg flex items-center justify-center relative">
                     <span className="text-gray-400">Partner Video Stream</span>
                     {/* <video ... /> sẽ đặt ở đây */}
                </div>
            </div>
        </div>
      </div>

      {/* THANH ĐIỀU KHIỂN (Tự code thay cho CallControls) */}
      <div className="fixed bottom-0 flex w-full items-center justify-center gap-5 pb-5 bg-dark-1">
        
        {/* Nút bật tắt Mic */}
        <button className="rounded-full bg-dark-2 p-3 hover:bg-dark-3">
            <Mic size={24} className="text-white"/>
        </button>

        {/* Nút bật tắt Cam */}
        <button className="rounded-full bg-dark-2 p-3 hover:bg-dark-3">
            <Camera size={24} className="text-white"/>
        </button>

        {/* Nút kết thúc cuộc gọi (Truyền đúng props cho Socket) */}
        <EndCallButton 
            roomId={params.id} 
            socket={socket} 
        />
        
        {/* Nút danh sách người dùng */}
        <button onClick={() => setShowParticipants((prev) => !prev)}>
          <div className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
            <Users size={20} className="text-white" />
          </div>
        </button>
      </div>
    </section>
  );
};

export default MeetingRoom;