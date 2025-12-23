"use client";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";

const socket = io(); // Tự động kết nối tới server localhost:5000

const P2PMeetingRoom = ({ roomId }: { roomId: string }) => {
  const [stream, setStream] = useState<MediaStream>();
  const [peers, setPeers] = useState<any[]>([]);
  const userVideo = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<any[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);

 useEffect(() => {
    // 1. Lấy Camera
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((currentStream) => {
      setStream(currentStream);
      if (userVideo.current) userVideo.current.srcObject = currentStream;

      // Gửi tín hiệu vào phòng
      socket.emit("join-room", roomId, "user-id-random");

      socket.on("user-connected", (userId) => {
         // --- THÊM DÒNG NÀY ĐỂ FIX LỖI ---
         if (!socket.id) return; 
         // --------------------------------

         // Lúc này TypeScript biết chắc chắn socket.id là string
         const peer = createPeer(userId, socket.id, currentStream);
         // ... lưu peer vào state
      });
    });
}, []);

  // --- LOGIC AI RECORDING ---
  const startRecording = () => {
    if (!stream) return;
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    const chunks: BlobPart[] = [];

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", blob, "meeting.webm");
        formData.append("roomId", roomId);

        alert("Đang gửi lên Server để AI tóm tắt...");
        
        const res = await fetch("/api/upload-recording", {
            method: "POST",
            body: formData
        });
        const data = await res.json();
        alert("Tóm tắt AI: " + data.summary);
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
  };

  return (
    <div className="flex flex-col h-screen bg-dark-1 text-white p-4">
      <div className="flex gap-4 justify-center mb-4">
         <button onClick={isRecording ? stopRecording : startRecording} className="bg-red-500 px-4 py-2 rounded">
            {isRecording ? "Stop & Summarize" : "Record Meeting"}
         </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
         <video ref={userVideo} muted autoPlay playsInline className="w-full rounded-lg border border-gray-700" />
         {/* Render các video của người khác ở đây */}
      </div>
    </div>
  );
};

// Hàm hỗ trợ tạo Peer (Cần cài simple-peer)
function createPeer(userToSignal: string, callerID: string, stream: MediaStream) {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    // ... logic signal socket ...
    return peer;
}

export default P2PMeetingRoom;