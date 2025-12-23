"use client";
import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';
import { User, Monitor } from 'lucide-react';

const VideoItem = ({ stream, username, isLocal, isScreenShare, isMainScreen = false, forceAvatar = false }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => { 
      if (videoRef.current && stream) videoRef.current.srcObject = stream; 
  }, [stream]);

  // Logic hiển thị:
  // 1. Nếu forceAvatar = true (đang share mà nằm ở strip) -> Hiện Avatar
  // 2. Nếu không có stream -> Hiện Avatar
  // 3. Nếu có stream -> Hiện Video
  const shouldShowVideo = stream && !forceAvatar;

  return (
    <div className={cn(
        "relative w-full h-full bg-[#252a41] rounded-xl overflow-hidden border border-white/5", 
        isMainScreen ? "shadow-none bg-black" : "shadow-lg"
    )}>
      {shouldShowVideo ? (
        <video
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted={isLocal || isMainScreen} // Mute nếu là mình hoặc là màn hình chính (tránh echo)
          className={cn(
              "w-full h-full", 
              (isScreenShare || isMainScreen) ? "object-contain" : "object-cover", 
              isLocal && !isScreenShare && !isMainScreen && "scale-x-[-1]"
          )}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#1a1d2d]">
           <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-xl font-bold text-white mb-2 shadow-inner">
              {username?.charAt(0)?.toUpperCase() || <User />}
           </div>
           {/* Chỉ hiện text trạng thái ở ô nhỏ */}
           {!isMainScreen && (
               <p className="text-gray-400 text-[10px] flex items-center gap-1">
                   {isScreenShare ? <Monitor className="w-3 h-3" /> : null}
                   {isScreenShare ? "Đang trình bày" : "Camera tắt"}
               </p>
           )}
        </div>
      )}

      {/* Tên hiển thị (Overlay) */}
      {!isMainScreen && (
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
             <p className="text-white text-xs font-medium truncate pl-1">
                 {isLocal ? "Bạn" : username}
             </p>
          </div>
      )}
    </div>
  );
};

interface VideoGridProps {
  localCameraStream: MediaStream | null;
  localScreenStream: MediaStream | null;
  peers: any[];
  isSidebarOpen: boolean;
}

const VideoGrid = ({ localCameraStream, localScreenStream, peers, isSidebarOpen }: VideoGridProps) => {
  
  // 1. Tìm người đang share (Remote)
  const remoteSharingPeer = peers.find(p => p.isScreenShare === true);

  // 2. Xác định luồng trình chiếu (Ưu tiên local nếu mình đang share, không thì lấy remote)
  const presentationStream = localScreenStream || remoteSharingPeer?.stream;
  const isPresenting = !!presentationStream;

  // 3. Danh sách hiển thị ở dưới (Strip)
  const allCameraStreams = [
    // Camera của mình
    ...(localCameraStream ? [{ stream: localCameraStream, username: "Bạn", isLocal: true, isScreenShare: false }] : []),
    // Camera của người khác
    ...peers.map(p => ({ 
        stream: p.stream, 
        username: p.username, 
        isLocal: false,
        isScreenShare: p.isScreenShare // Cờ quan trọng
    }))
  ];

  // --- MODE 1: CÓ NGƯỜI TRÌNH CHIẾU ---
  if (isPresenting) {
    return (
      <div className={cn("flex flex-col h-full w-full bg-[#1C1F2E] transition-all duration-300", isSidebarOpen ? "pr-[380px]" : "")}>
        {/* A. MÀN HÌNH CHÍNH (TO) */}
        <div className="flex-1 p-4 overflow-hidden flex items-center justify-center bg-black/20">
           <div className="w-full h-full max-w-[1400px]">
              <VideoItem 
                 stream={presentationStream} 
                 // Tên người đang share
                 username={localScreenStream ? "Bạn đang trình bày" : (remoteSharingPeer?.username || "Màn hình chia sẻ")}
                 isLocal={!!localScreenStream} 
                 isScreenShare={true}
                 isMainScreen={true}
              />
           </div>
        </div>

        {/* B. DẢI CAMERA DƯỚI (STRIP) */}
        <div className="h-[160px] w-full bg-[#151725] border-t border-white/10 flex items-center px-4 py-2 gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700">
            {allCameraStreams.map((item, idx) => (
                <div key={idx} className="min-w-[200px] w-[200px] h-[120px] flex-shrink-0">
                    <VideoItem 
                        stream={item.stream} 
                        username={item.username} 
                        isLocal={item.isLocal} 
                        isScreenShare={item.isScreenShare}
                        // QUAN TRỌNG: Nếu người này đang share, và đây không phải là mình -> Force hiện Avatar
                        // Vì luồng video của họ bây giờ là màn hình, hiện ở ô nhỏ sẽ bị trùng lặp.
                        forceAvatar={!item.isLocal && item.isScreenShare}
                    />
                </div>
            ))}
        </div>
      </div>
    );
  }

  // --- MODE 2: GRID BÌNH THƯỜNG ---
  return (
    <div className={cn("grid gap-4 p-4 h-full content-center transition-all duration-300", isSidebarOpen ? "pr-[380px]" : "", allCameraStreams.length <= 1 && "grid-cols-1 max-w-4xl mx-auto h-[80%]", allCameraStreams.length === 2 && "grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto h-[60%]", allCameraStreams.length >= 3 && "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 h-full content-start")}>
      {allCameraStreams.map((item, idx) => (
        <div key={idx} className="w-full h-full min-h-[200px] aspect-video">
           <VideoItem 
             stream={item.stream} 
             username={item.username} 
             isLocal={item.isLocal} 
             isScreenShare={item.isScreenShare}
           />
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;