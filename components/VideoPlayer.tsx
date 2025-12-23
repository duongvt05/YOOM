"use client";
import React, { useEffect, useRef } from "react";
import Peer from "simple-peer";

interface VideoPlayerProps {
  peer: Peer.Instance; // Đối tượng Peer kết nối
  className?: string;  // Class tùy chỉnh nếu cần
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ peer, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Lắng nghe sự kiện 'stream' từ người kia gửi tới
    peer.on("stream", (stream: MediaStream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });

    // Cleanup (tùy chọn, thường VideoRoom sẽ lo việc destroy peer)
  }, [peer]);

  return (
    <div className={`relative w-full h-full rounded-lg overflow-hidden bg-gray-900 border border-gray-700 ${className}`}>
      {/* playsInline và autoPlay là BẮT BUỘC để video tự chạy */}
      <video 
        playsInline 
        autoPlay 
        ref={videoRef} 
        className="w-full h-full object-cover" 
      />
    </div>
  );
};

export default VideoPlayer;