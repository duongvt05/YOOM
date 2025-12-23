// components/VideoGrid.tsx – ĐÃ FIX ĐÚNG NHƯ HÌNH BẠN GỬI!!!
'use client';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';

const VideoItem = ({ stream, username, isLocal, isSharing }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={cn(
          "w-full h-full object-contain bg-black",
          isLocal && !isSharing && "scale-x-[-1]"
        )}
      />
      <div className="absolute bottom-4 left-4 bg-black/70 px-4 py-2 rounded-full backdrop-blur-sm">
        <p className="text-white font-medium text-sm">
          {username} {isLocal && "(Bạn)"}
        </p>
      </div>
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

  // KHI ĐANG CHIA SẺ MÀN HÌNH – ĐÚNG NHƯ HÌNH BẠN GỬI!!!
  if (isSharing && localStream) {
    return (
      <div className={cn(
        "relative h-full w-full bg-black flex items-center justify-center transition-all duration-300",
        isSidebarOpen && "pr-96"
      )}>
        {/* MÀN HÌNH CHIA SẺ – TO RA GIỮA */}
        <div className="w-full h-full">
          <VideoItem stream={localStream.stream} username={localStream.name} isLocal={true} isSharing={true} />
        </div>

        {/* KHUNG NHỎ CỦA BẠN – GÓC DƯỚI PHẢI (NHƯ ZOOM THẬT!!!) */}
        <div className="absolute bottom-8 right-8 w-80 h-52 rounded-2xl overflow-hidden shadow-2xl border-4 border-cyan-500 z-20">
          <VideoItem stream={localStream.stream} username={localStream.name} isLocal={true} isSharing={false} />
        </div>

        {/* KHUNG NGƯỜI KHÁC – GÓC DƯỚI TRÁI (NẾU CÓ) */}
        {remoteStreams.length > 0 && (
          <div className="absolute bottom-8 left-8 flex gap-4 z-20">
            {remoteStreams.slice(0, 3).map((s, i) => (
              <div key={i} className="w-64 h-40 rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-700">
                <VideoItem stream={s.stream} username={s.name} isLocal={false} isSharing={false} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // LAYOUT BÌNH THƯỜNG
  return (
    <div className={cn(
      "grid gap-6 p-8 h-full transition-all duration-300",
      isSidebarOpen ? "pr-96" : "pr-8",
      streams.length === 1 && "grid-cols-1",
      streams.length === 2 && "grid-cols-1 md:grid-cols-2",
      streams.length >= 3 && "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    )}>
      {streams.map((item, i) => (
        <div key={i} className="aspect-video rounded-2xl overflow-hidden bg-black/30 shadow-2xl">
          <VideoItem stream={item.stream} username={item.name} isLocal={item.isLocal} isSharing={false} />
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;