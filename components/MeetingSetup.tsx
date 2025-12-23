'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from './ui/button'; // Giữ lại nút bấm giao diện của bạn
import { Camera, Mic, MicOff, Video, VideoOff } from 'lucide-react'; // Icon cho đẹp

const MeetingSetup = ({
  setIsSetupComplete,
}: {
  setIsSetupComplete: (value: boolean) => void;
}) => {
  // State quản lý việc bật/tắt Mic và Cam
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  
  // Ref để gắn luồng video vào thẻ HTML video
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Hàm xin quyền truy cập Camera/Mic của trình duyệt
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing media devices.", err);
        alert("Không thể truy cập Camera/Mic. Vui lòng cấp quyền.");
      }
    };

    getMedia();

    // Cleanup: Tắt camera khi component bị hủy
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Hàm bật tắt Camera
  const toggleCam = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCamOn;
        setIsCamOn(!isCamOn);
      }
    }
  };

  // Hàm bật tắt Mic
  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
      }
    }
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 text-white bg-dark-1">
      <h1 className="text-center text-2xl font-bold mb-4">Setup Audio & Video</h1>
      
      {/* Khung xem trước Video (Thay thế VideoPreview của Stream) */}
      <div className="relative w-[600px] h-[400px] bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
        <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="w-full h-full object-cover transform scale-x-[-1]" // Lật ngược video như gương
        />
        {!isCamOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                <p>Camera is Off</p>
            </div>
        )}
      </div>

      {/* Các nút điều khiển */}
      <div className="flex h-16 items-center justify-center gap-5 mt-4">
        <div className="flex gap-4">
            <Button 
                onClick={toggleMic} 
                className={`rounded-full p-4 ${!isMicOn ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
                {isMicOn ? <Mic /> : <MicOff />}
            </Button>
            
            <Button 
                onClick={toggleCam} 
                className={`rounded-full p-4 ${!isCamOn ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
                {isCamOn ? <Video /> : <VideoOff />}
            </Button>
        </div>
        
        {/* Nút vào phòng (Settings microphone nâng cao trong WebRTC tự code rất phức tạp, tạm bỏ qua DeviceSettings) */}
      </div>

      <Button
        className="rounded-md bg-green-500 px-8 py-3 mt-4 text-lg font-semibold hover:bg-green-600"
        onClick={() => {
          // Logic vào phòng của bạn
          setIsSetupComplete(true);
        }}
      >
        Join Meeting
      </Button>
    </div>
  );
};

export default MeetingSetup;