'use client';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';
import { MicOff, User, Monitor } from 'lucide-react';

// Thêm prop isMainScreen để xử lý CSS riêng cho màn hình chia sẻ
const VideoItem = ({ stream, username, isLocal, isSharing, isMainScreen = false }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={cn(
      "relative w-full h-full bg-dark-2 rounded-xl overflow-hidden border border-white/5 group transition-all duration-300",
      // Nếu là màn hình chính thì bỏ shadow để liền mạch, ngược lại thì có hiệu ứng hover
      isMainScreen ? "shadow-none bg-[#15171f]" : "shadow-lg hover:border-white/20"
    )}>
      {/* Video Element */}
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Luôn mute local để tránh vọng
          className={cn(
            "w-full h-full",
            // Quan trọng: Màn hình share thì dùng 'contain' để thấy hết chữ, Camera thì dùng 'cover' cho đẹp
            isMainScreen ? "object-contain" : "object-cover",
            // Lật gương nếu là camera selfie (không lật màn hình share)
            isLocal && !isSharing && !isMainScreen && "scale-x-[-1]" 
          )}
        />
      ) : (
        // Avatar Placeholder khi tắt cam
        <div className="w-full h-full flex flex-col items-center justify-center bg-dark-3/50 backdrop-blur-sm">
           <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xl sm:text-4xl font-bold text-white shadow-lg">
              {username?.charAt(0)?.toUpperCase() || <User />}
           </div>
           {!isMainScreen && <p className="mt-2 text-gray-400 text-xs font-medium">Camera tắt</p>}
        </div>
      )}

      {/* --- CÁC THÀNH PHẦN GIAO DIỆN PHỦ LÊN TRÊN (OVERLAY) --- */}

      {/* 1. Label "Đang trình bày" (Chỉ hiện ở màn hình to) */}
      {isMainScreen && (
        <div className="absolute top-4 left-4 bg-brand-600/90 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg border border-white/10 animate-in fade-in slide-in-from-top-2">
            <Monitor className="w-4 h-4" />
            {username} đang trình bày
        </div>
      )}

      {/* 2. Thẻ tên & Trạng thái (Cho các ô video nhỏ) */}
      {!isMainScreen && (
        <>
            {/* Gradient mờ để dễ đọc chữ */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent opacity-80" />
            
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <div className="bg-white/10 backdrop-blur-md px-2 py-1 rounded-md border border-white/5">
                    <span className="text-white text-xs font-semibold truncate block max-w-[100px]">
                        {isLocal ? "Bạn" : username}
                    </span>
                </div>
                
                {/* Icon trạng thái mic (Demo: hiển thị mic tắt nếu không có stream) */}
                {!stream && (
                    <div className="bg-red-500/20 p-1 rounded-full border border-red-500/50">
                        <MicOff className="w-3 h-3 text-red-400" />
                    </div>
                )}
            </div>
        </>
      )}
    </div>
  );
};

interface VideoGridProps {
  streams: { stream: MediaStream; name: string; isLocal: boolean }[];
  isSharing: boolean;
  isSidebarOpen: boolean;
}

const VideoGrid = ({ streams, isSharing, isSidebarOpen }: VideoGridProps) => {
  const localStream = streams.find(s => s.isLocal);
  const remoteStreams = streams.filter(s => !s.isLocal);

  // --- LAYOUT 1: CHẾ ĐỘ THUYẾT TRÌNH (PRESENTATION MODE) ---
  // Màn hình share to ở trên, danh sách camera nằm ngang ở dưới
  if (isSharing && localStream) {
    return (
      <div className={cn(
        "flex flex-col h-full w-full bg-dark-1 transition-all duration-300",
        isSidebarOpen && "pr-[380px]" // Chừa chỗ cho sidebar
      )}>
        
        {/* A. MÀN HÌNH CHÍNH (Chiếm phần lớn diện tích) */}
        <div className="flex-1 p-4 overflow-hidden relative flex items-center justify-center">
            <div className="w-full h-full max-w-[1600px] mx-auto">
                <VideoItem 
                    stream={localStream.stream} 
                    username={localStream.name} 
                    isLocal={true} 
                    isSharing={true} 
                    isMainScreen={true} // Bật cờ này để css riêng
                />
            </div>
        </div>

        {/* B. DẢI VIDEO THÀNH VIÊN Ở DƯỚI (FILMSTRIP) */}
        <div className="h-40 w-full px-4 pb-6 flex items-center justify-center bg-dark-1/50 backdrop-blur-sm border-t border-white/5 pt-2">
            <div className="flex gap-4 overflow-x-auto w-full max-w-[1600px] mx-auto pb-2 px-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                
                {/* Danh sách người khác */}
                {remoteStreams.length > 0 ? (
                    remoteStreams.map((s, i) => (
                        <div key={i} className="min-w-[200px] w-[200px] h-[120px] flex-shrink-0">
                            <VideoItem stream={s.stream} username={s.name} isLocal={false} isSharing={false} />
                        </div>
                    ))
                ) : (
                    // Placeholder nếu chưa có ai khác
                    <div className="w-full flex items-center justify-center text-gray-500 text-sm italic">
                        Đang chờ người khác tham gia...
                    </div>
                )}
            </div>
        </div>
      </div>
    );
  }

  // --- LAYOUT 2: LƯỚI GRID THÔNG MINH (KHI KHÔNG SHARE) ---
  return (
    <div className={cn(
      "grid gap-4 p-4 sm:p-6 h-full content-center transition-all duration-500 ease-in-out",
      isSidebarOpen ? "pr-[380px]" : "pr-4 sm:pr-6",
      // Responsive Grid Logic: Tự chia cột dựa trên số lượng người
      streams.length <= 1 && "grid-cols-1 max-w-5xl mx-auto h-[80vh]",
      streams.length === 2 && "grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto h-[60vh] md:h-[70vh]",
      streams.length >= 3 && streams.length <= 4 && "grid-cols-2 max-w-7xl mx-auto h-[80vh]",
      streams.length > 4 && "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 h-full content-start"
    )}>
      {streams.map((item, i) => (
        <div key={i} className={cn(
            "w-full h-full min-h-[200px] transition-all duration-300",
            streams.length <= 2 ? "aspect-video" : "aspect-[4/3]"
        )}>
          <VideoItem stream={item.stream} username={item.name} isLocal={item.isLocal} isSharing={false} />
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;