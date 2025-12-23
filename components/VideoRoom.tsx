"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import { useRouter } from "next/navigation";
import {
  X,
  Send,
  Mic,
  Video,
  Users,
  MessageSquare,
  Circle,
} from "lucide-react";

import CallControls, { ActiveSidebarType, CallLayoutType } from "./CallControls";
import ParticipantsList from "./ParticipantsList";
import VideoGrid from "./VideoGrid";
import { useToast } from "./ui/use-toast";
import { getCurrentUser } from "@/actions/auth.actions";
import { cn } from "@/lib/utils";
import AIPanel from "./AIPanel";

// Mở rộng Window interface để hỗ trợ Audio Mixing toàn cục
declare global {
  interface Window {
    audioContext?: AudioContext;
    mixedOutput?: MediaStreamAudioDestinationNode;
    mixedAudioTrack?: MediaStreamTrack;
    webkitAudioContext?: typeof AudioContext;
  }
}

interface PeerData {
  peerID: string;
  peer: Peer.Instance;
  username: string;
  stream?: MediaStream;
}

const VideoRoom = ({ roomId }: { roomId: string }) => {
  const router = useRouter();
  const { toast } = useToast();

  // --- STATE ---
  const [isCallStarted, setIsCallStarted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<PeerData[]>([]);
  
  // --- REFS ---
  const socketRef = useRef<any>(null);
  const peersRef = useRef<PeerData[]>([]);
  const streamRef = useRef<MediaStream | null>(null); 
  const userRef = useRef<any>(null);

  // --- UI STATE ---
  const [layout, setLayout] = useState<CallLayoutType>("grid");
  const [activeSidebar, setActiveSidebar] = useState<ActiveSidebarType>(null);
  const [reaction, setReaction] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // --- CHAT STATE ---
  const [chatHistory, setChatHistory] = useState<{ sender: string; msg: string; timestamp?: string }[]>([]);
  const [chatInput, setChatInput] = useState("");

  // --- AI / VOICE STATE ---
  const [transcript, setTranscript] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [latestText, setLatestText] = useState("");
  const [latestSummary, setLatestSummary] = useState("");
  const [isListening, setIsListening] = useState(false);

  // Refs cho AI/Recording
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // 1. LẤY USER INFO
  useEffect(() => {
    getCurrentUser().then((u) => {
      const user = u || { username: "Guest" };
      setCurrentUser(user);
      userRef.current = user;
    });
  }, []);

  // ----------------------------------------------------------------
  // WEBRTC HELPERS (Định nghĩa trước để dùng trong useEffect)
  // ----------------------------------------------------------------

  // Xử lý stream nhận được từ người khác (Thêm vào mixer âm thanh)
  const handleRemoteStream = useCallback((remoteStream: MediaStream, peerID: string) => {
    // 1. Cập nhật UI Video
    setPeers((prev) =>
      prev.map((p) => (p.peerID === peerID ? { ...p, stream: remoteStream } : p))
    );

    // 2. KẾT NỐI ÂM THANH NGƯỜI KHÁC VÀO BỘ TRỘN CHUNG
    if (window.audioContext && window.mixedOutput && remoteStream.getAudioTracks().length > 0) {
      try {
          const source = window.audioContext.createMediaStreamSource(remoteStream);
          source.connect(window.mixedOutput);
      } catch (err) {
          // Bỏ qua lỗi nếu đã connect rồi
      }
    }
  }, []);

  const createPeer = useCallback((userToSignal: string, callerID: string, stream: MediaStream, username: string) => {
    const peer = new Peer({ 
        initiator: true, 
        trickle: false, 
        stream, 
        config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] } 
    });

    peer.on("signal", (signal) => socketRef.current?.emit("sending signal", { userToSignal, callerID, signal }));
    
    peer.on("stream", (remoteStream: MediaStream) => {
      handleRemoteStream(remoteStream, userToSignal);
    });

    peer.on("error", (err) => {
        console.warn(`Peer connection error with ${username}:`, err);
    });
    
    return peer;
  }, [handleRemoteStream]);

  const addPeer = useCallback((incomingSignal: any, callerID: string, stream: MediaStream, username: string) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
      config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] } 
    });

    peer.on("signal", (signal) => {
      socketRef.current?.emit("returning signal", { signal, callerID });
    });

    peer.on("stream", (remoteStream: MediaStream) => {
      handleRemoteStream(remoteStream, callerID);
    });

    peer.on("error", (err) => {
        console.warn(`Peer connection error with ${username}:`, err);
    });

    peer.signal(incomingSignal);
    return peer;
  }, [handleRemoteStream]);


  // ----------------------------------------------------------------
  // 2. MAIN SOCKET EFFECT (LOGIC CHÍNH ĐÃ FIX)
  // ----------------------------------------------------------------
  useEffect(() => {
    // QUAN TRỌNG: Chỉ chạy socket khi đã có User VÀ đã có Stream (localStream)
    // Nếu chưa bấm "Bắt đầu gọi", socket sẽ chưa kết nối.
    if (!currentUser || !localStream) return;

    const SOCKET_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"; 

    // Khởi tạo socket
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
    });

    // Sau khi connect, emit join room ngay lập tức
    socketRef.current.emit("join room", {
        roomID: roomId,
        username: currentUser.username,
    });

    // --- SOCKET LISTENERS ---

    // Nhận danh sách user hiện có
    socketRef.current.on("all users", (users: Array<{ id: string; username: string }>) => {
      // Lúc này chắc chắn streamRef.current đã có do điều kiện check ở đầu useEffect
      const myStream = streamRef.current; 
      if (!myStream) return;

      const newPeers: PeerData[] = [];
      
      users.forEach((user) => {
         // Bỏ qua chính mình
         if (user.id === currentUser.id) return;
         
         // Check duplicate
         const exists = peersRef.current.some(p => p.peerID === user.id);
         if (exists) return;

         const peer = createPeer(user.id, socketRef.current.id, myStream, user.username);
         const peerData = { peerID: user.id, peer, username: user.username };
         peersRef.current.push(peerData);
         newPeers.push(peerData);
      });

      if(newPeers.length > 0) {
        setPeers(prev => [...prev, ...newPeers]);
      }
    });

    // Nhận cuộc gọi từ người mới vào
    socketRef.current.on("receiving-offer", (payload: any) => {
      const myStream = streamRef.current;
      if (!myStream) return;

      // Check duplicate
      const exists = peersRef.current.some(p => p.peerID === payload.callerID);
      if (exists) return;

      const peer = addPeer(payload.signal, payload.callerID, myStream, payload.username || "Guest");
      const peerData = { peerID: payload.callerID, peer, username: payload.username || "Guest" };
      peersRef.current.push(peerData);
      setPeers((prev) => [...prev, peerData]);
    });

    // Nhận tín hiệu trả về (Handshake hoàn tất)
    socketRef.current.on("receiving returned signal", (payload: any) => {
      const item = peersRef.current.find((p) => p.peerID === payload.id);
      if (item) item.peer.signal(payload.signal);
    });

    // Người khác rời phòng
    socketRef.current.on("user left", (id: string) => {
      const peerObj = peersRef.current.find((p) => p.peerID === id);
      peerObj?.peer.destroy();
      peersRef.current = peersRef.current.filter((p) => p.peerID !== id);
      setPeers((prev) => prev.filter((p) => p.peerID !== id));
    });

    // --- SỰ KIỆN CHAT & AI ---
    socketRef.current.on("receive-chat", (data: { sender: string; msg: string; timestamp?: string }) => {
      setChatHistory((prev) => [...prev, data]);
      // setTranscript((prev) => prev + `${data.sender}: ${data.msg}\n`); // Optional: add chat to transcript
    });

    socketRef.current.on("receive-reaction", (data: any) => {
      if (data?.type) showReactionAnimation(data.type);
    });

    socketRef.current.on("ai-speech", (data: { text: string }) => {
      setTranscript(prev => prev + `Người khác: ${data.text}\n`);
      setLatestText(data.text);
    });

    socketRef.current.on("ai-summary-update", (data: { summary: string }) => {
      setLatestSummary(data.summary);
      toast({
        title: "Tóm tắt mới từ cả phòng!",
        description: data.summary,
        duration: 5000,
      });
    });

    // Cleanup khi unmount hoặc dependencies thay đổi
    return () => {
      stopVoiceListening();
      
      // Destroy peers
      peersRef.current.forEach((p) => p.peer.destroy());
      peersRef.current = [];
      setPeers([]);

      // Disconnect Socket
      if (socketRef.current) {
         socketRef.current.disconnect();
         socketRef.current.off();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, currentUser, localStream]); // Dependencies quan trọng: localStream


  // 3. HÀM START CALL (KHỞI TẠO STREAM & AUDIO CONTEXT)
  const startCall = async () => {
    if (isCallStarted) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      // Cập nhật State và Ref
      setLocalStream(stream);
      streamRef.current = stream; 
      
      setIsCallStarted(true);
      toast({ title: "Đã bật mic/camera thành công!" });

      // Khởi tạo AudioContext cho AI Mix (Singleton)
      if (!window.audioContext) {
         const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
         window.audioContext = new AudioContext();
         window.mixedOutput = window.audioContext.createMediaStreamDestination();
         window.mixedAudioTrack = window.mixedOutput.stream.getAudioTracks()[0];
         
         // Thêm luồng âm thanh của chính mình vào mix
         const source = window.audioContext.createMediaStreamSource(stream);
         source.connect(window.mixedOutput);
      } else if (window.audioContext.state === 'suspended') {
         await window.audioContext.resume();
      }

      // Lưu ý: Không cần emit "join room" ở đây nữa, useEffect sẽ tự làm việc đó khi thấy localStream thay đổi.

    } catch (err) {
      console.error("Lỗi camera/mic:", err);
      toast({ title: "Không thể truy cập camera/mic! Vui lòng cho phép", variant: "destructive" });
    }
  };

  // --- CÁC CHỨC NĂNG KHÁC (UI, CHAT, REC) ---

  const showReactionAnimation = useCallback((emoji: string) => {
    setReaction(emoji);
    setTimeout(() => setReaction(null), 3000);
  }, []);

  const handleReaction = () => {
    const emoji = "❤️";
    showReactionAnimation(emoji);
    socketRef.current?.emit("send-reaction", { roomId, type: emoji });
  };

  const toggleMic = () => {
    if (localStream) localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsMuted((prev) => !prev);
  };
  
  const toggleCam = () => {
    if (localStream) localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsCamOff((prev) => !prev);
  };

  const replaceTrackInPeers = useCallback((newStream: MediaStream) => {
    setLocalStream(newStream);
    streamRef.current = newStream; // Cập nhật ref
    peersRef.current.forEach(({ peer }) => {
      const sender = (peer as any)._pc?.getSenders().find((s: any) => s.track?.kind === "video");
      if (sender && newStream.getVideoTracks()[0]) sender.replaceTrack(newStream.getVideoTracks()[0]);
    });
  }, []);

  const toggleShare = async () => {
    if (isSharing) {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        replaceTrackInPeers(camStream);
        setIsSharing(false);
      } catch (err) {
        console.error("Không thể bật camera:", err);
      }
    } else {
      try {
        const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
        replaceTrackInPeers(screenStream);
        setIsSharing(true);
        const track = screenStream.getVideoTracks()[0];
        if (track) track.onended = () => toggleShare();
      } catch (err) {
        console.log("Hủy chia sẻ");
      }
    }
  };

  // --- CHAT LOGIC ---
  const sendChat = () => {
    if (!chatInput.trim()) return;
    socketRef.current?.emit("send-chat", {
      roomId,
      msg: chatInput.trim(),
    });
    setChatInput("");
  };

  // --- VOICE / AI RECOGNITION (LOCAL - Browser API) ---
  const startVoiceListening = () => {
    if (isListening) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Trình duyệt không hỗ trợ nghe giọng nói", variant: "destructive" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        }
      }
      if (final) {
        setTranscript((prev) => prev + `Bạn: ${final}\n`);
        setLatestText(final);
      }
    };

    recognition.onerror = () => stopVoiceListening();
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
    toast({ title: "Đang nghe bạn nói..." });
  };

  const stopVoiceListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // --- AI FULL ROOM LISTENING (SERVER) ---
  const startFullRoomListening = async () => {
    if (!window.mixedAudioTrack) {
        // Fallback: Nếu chưa có mixed track, thử lấy từ mic local
        if(localStream) {
             toast({ title: "Đang sử dụng mic cá nhân cho AI", description: "Âm thanh người khác có thể không được ghi nhận rõ." });
        } else {
             toast({ title: "Chưa có âm thanh để nghe!", variant: "destructive" });
             return;
        }
    }

    try {
        if (window.audioContext?.state === 'suspended') {
            await window.audioContext.resume();
        }

        // Lấy luồng âm thanh ĐÃ TRỘN (Cả mình + Bạn) hoặc Local nếu chưa có mix
        const trackToUse = window.mixedAudioTrack || localStream?.getAudioTracks()[0];
        if(!trackToUse) return;

        const mixedStream = new MediaStream([trackToUse]);
        
        const recorder = new MediaRecorder(mixedStream, { mimeType: "audio/webm" });
        audioChunks.current = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunks.current.push(e.data);
        };

        recorder.onstop = async () => {
            if (audioChunks.current.length === 0) return;
            const blob = new Blob(audioChunks.current, { type: "audio/webm" });
            const reader = new FileReader();
            
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(",")[1];
                try {
                    const res = await fetch("/api/speech", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ 
                            action: "speech", 
                            audio: base64 
                        }),
                    });
                    const data = await res.json();
                    if (data.text) {
                        setLatestText(data.text);
                        setTranscript(prev => prev + `Hội thoại: ${data.text}\n`);
                    }
                } catch (err) {
                    console.log("Lỗi AI:", err);
                }
            };
            reader.readAsDataURL(blob);
        };

        recorder.start(5000); // Gửi AI xử lý mỗi 5s
        audioRecorderRef.current = recorder;
        setIsListening(true);
        toast({ title: "AI đang nghe cả phòng..." });

    } catch (err) {
        console.error("Lỗi Full Room Listening:", err);
    }
  };

  const stopFullRoomListening = () => {
    if (audioRecorderRef.current) {
        try { audioRecorderRef.current.stop(); } catch (e) {}
        audioRecorderRef.current = null;
    }
    setIsListening(false);
  };

  // Tự động bật tắt mic khi mở tab AI
  useEffect(() => {
    if (activeSidebar === "ai") {
        startFullRoomListening(); 
    } else {
        stopFullRoomListening();
        stopVoiceListening();
    }
    return () => {
        stopFullRoomListening();
        stopVoiceListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSidebar]);

  // --- RECORDING VIDEO MEETING ---
  const startRecording = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as any,
        audio: false 
      });
      
      screenStreamRef.current = screenStream; 

      const mixedStream = new MediaStream();
      screenStream.getVideoTracks().forEach((t) => mixedStream.addTrack(t));

      // Lấy âm thanh: Ưu tiên bộ trộn
      if (window.mixedAudioTrack) {
        mixedStream.addTrack(window.mixedAudioTrack);
      } else if (localStream) {
        localStream.getAudioTracks().forEach((t) => mixedStream.addTrack(t));
      }

      const recorder = new MediaRecorder(mixedStream, { mimeType: "video/webm;codecs=vp9,opus" });
      recordedChunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.current.push(e.data);
      };

      const handleStop = async () => {
        if (screenStreamRef.current) {
             screenStreamRef.current.getTracks().forEach(track => track.stop());
        }

        const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
        const username = currentUser?.username || "Guest";
        const filename = `${username}_${roomId}_${Date.now()}.webm`;

        const formData = new FormData();
        formData.append("file", blob, filename);
        formData.append("roomId", roomId);

        try {
          toast({ title: "Đang lưu video...", description: "Vui lòng chờ giây lát." });
          const response = await fetch("/api/recordings", { 
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            toast({ title: "Thành công!", description: "Video đã được lưu." });
          } else {
            toast({ title: "Lưu thất bại", variant: "destructive" });
          }
        } catch (error) {
          console.error("Upload error:", error);
          toast({ title: "Lỗi kết nối server", variant: "destructive" });
        }
        
        setIsRecording(false);
      };

      recorder.onstop = handleStop;
      screenStream.getVideoTracks()[0].onended = () => {
          if (recorder.state === 'recording') recorder.stop();
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      toast({ title: "Đang ghi hình...", description: "Đang quay toàn bộ màn hình." });

    } catch (err) {
      console.error("Ghi hình lỗi:", err);
      toast({ title: "Đã hủy ghi hình", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const toggleRecord = () => {
    isRecording ? stopRecording() : startRecording();
  };

  // --- SUMMARIZE ---
  const summarizeMeeting = async () => {
    const trackToUse = window.mixedAudioTrack || localStream?.getAudioTracks()[0];
    if (!trackToUse) {
        toast({ title: "Chưa có dữ liệu âm thanh!", variant: "destructive" });
        return;
    }

    setIsAiLoading(true);
    const mixedStream = new MediaStream([trackToUse]);
    const recorder = new MediaRecorder(mixedStream);
    const chunks: Blob[] = [];

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.start();

    // Ghi 10s để test summarize
    setTimeout(() => {
        if(recorder.state === 'recording') recorder.stop();
    }, 10000);

    recorder.onstop = async () => {
        const fullAudioBlob = new Blob(chunks, { type: 'audio/webm' });
        const form = new FormData();
        form.append('audio', fullAudioBlob, 'full-meeting-audio.webm');
        form.append('roomId', roomId);

        try {
            const res = await fetch('/api/speech', { method: 'POST', body: form });
            const data = await res.json();
            if (data.summary) {
                setLatestSummary(data.summary);
                toast({ title: "Đã tóm tắt!" });
            }
        } catch (err) {
            toast({ title: "Lỗi AI", variant: "destructive" });
        } finally {
            setIsAiLoading(false);
        }
    };
  };

  const combinedStreams = [
    ...(localStream ? [{ stream: localStream, name: currentUser?.username || "Bạn", isLocal: true }] : []),
    ...peers.filter((p) => p.stream).map((p) => ({ stream: p.stream!, name: p.username, isLocal: false })),
  ];

  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#1C1F2E] flex flex-col">
      {/* Reaction animation */}
      {reaction && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50 text-9xl animate-bounce opacity-80 pointer-events-none">
          {reaction}
        </div>
      )}
      
      {/* NÚT START CALL */}
      {!isCallStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
          <button
            onClick={startCall}
            className="px-12 py-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-3xl font-bold rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-6"
          >
            <Mic className="w-12 h-12" />
            Bắt đầu gọi
          </button>
        </div>
      )}

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center h-16">
        <h1 className="text-white font-bold text-lg">Room: {roomId?.slice(0, 8)}...</h1>
        {isRecording && (
          <div className="flex items-center gap-2 bg-red-600/90 px-4 py-2 rounded-lg text-white animate-pulse font-bold">
            <Circle className="w-3 h-3 fill-current" />
            REC
          </div>
        )}
      </div>

      {/* Video Grid */}
      <div className="flex-1 relative overflow-hidden">
        <VideoGrid
          streams={combinedStreams}
          isSharing={isSharing}
          isSidebarOpen={!!activeSidebar}
        />
      </div>

      {/* SIDEBAR – CHAT & AI */}
      <div
        className={`fixed right-0 top-0 h-full w-[380px] bg-[#1C1F2E] border-l border-gray-700 shadow-2xl transition-transform duration-300 z-50 flex flex-col ${
          activeSidebar ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {activeSidebar !== "ai" && (
          <div className="p-5 border-b border-gray-700 flex justify-between items-center text-white">
            <h2 className="font-bold text-xl flex items-center gap-3">
              {activeSidebar === "chat" && (
                <>
                  <MessageSquare className="w-7 h-7" />
                  Chat
                </>
              )}
              {activeSidebar === "participants" && (
                <>
                  <Users className="w-7 h-7" />
                  Thành viên
                </>
              )}
            </h2>
            <button onClick={() => setActiveSidebar(null)} className="p-2 hover:bg-gray-700 rounded-lg transition">
              <X className="w-6 h-6" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col">
          {activeSidebar === "participants" && (
            <ParticipantsList participants={combinedStreams} onClose={() => setActiveSidebar(null)} />
          )}

          {activeSidebar === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-gray-500 mt-20">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Chưa có tin nhắn nào</p>
                    <p className="text-sm">Hãy là người đầu tiên!</p>
                  </div>
                ) : (
                  chatHistory.map((chat, i) => {
                    const isMe = chat.sender === (currentUser?.username || "Bạn");
                    return (
                      <div key={i} className={`flex gap-3 max-w-[80%] ${isMe ? "ml-auto flex-row-reverse" : ""}`}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {chat.sender[0]?.toUpperCase()}
                        </div>
                        <div className={`px-4 py-3 rounded-2xl ${isMe ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-100"}`}>
                          {!isMe && <p className="text-xs font-bold text-blue-300 mb-1">{chat.sender}</p>}
                          <p className="text-sm">{chat.msg}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-4 border-t border-gray-700 bg-[#1C1F2E]">
                <div className="flex gap-3 bg-gray-800 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition">
                  <input
                    type="text"
                    placeholder="Aa"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendChat())}
                    className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                  />
                  <button
                    onClick={sendChat}
                    disabled={!chatInput.trim()}
                    className={cn(
                      "p-3 rounded-xl transition",
                      chatInput.trim() ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-700 text-gray-500 cursor-not-allowed"
                    )}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}

          {activeSidebar === "ai" && (
            <AIPanel
              onSummarize={summarizeMeeting}
              onClose={() => setActiveSidebar(null)}
              isListening={isListening}
              latestText={latestText}
              latestSummary={latestSummary}
              onStartListening={startVoiceListening}
              onStopListening={stopVoiceListening}
              transcript={transcript}
              roomId={roomId}
            />
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-[#1C1F2E] border-t border-gray-800 flex items-center justify-center px-4 z-40 shadow-2xl">
        <CallControls
          onLeave={() => router.push("/")}
          onLayoutChange={setLayout}
          isMuted={isMuted}
          toggleMute={toggleMic}
          isCamOff={isCamOff}
          toggleCam={toggleCam}
          isSharing={isSharing}
          toggleShare={toggleShare}
          isRecording={isRecording}
          toggleRecord={toggleRecord}
          activeSidebar={activeSidebar}
          setActiveSidebar={setActiveSidebar}
          onReaction={handleReaction}
        />
      </div>
    </section>
  );
};

export default VideoRoom;