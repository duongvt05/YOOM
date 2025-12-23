import { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { useToast } from '@/components/ui/use-toast';
import { getSocket } from '@/lib/socket'; // <-- IMPORT SINGLETON

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ]
};

export interface PeerData {
    peerID: string;
    peer: Peer.Instance;
    stream?: MediaStream;
    username?: string;
}

export const useWebRTC = (roomId: string, currentUser: any) => {
    const { toast } = useToast();
    const [peers, setPeers] = useState<PeerData[]>([]);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    
    // Refs
    const socket = getSocket(); // <-- LẤY SOCKET TỪ SINGLETON
    const peersRef = useRef<PeerData[]>([]); 
    const originalStreamRef = useRef<MediaStream | null>(null);

    // Media States
    const [isMuted, setIsMuted] = useState(false);
    const [isCamOff, setIsCamOff] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const [incomingChat, setIncomingChat] = useState<any>(null);
    const [incomingReaction, setIncomingReaction] = useState<any>(null);

    useEffect(() => {
        if (!currentUser) return;

        const init = async () => {
            try {
                // 1. Kết nối Socket nếu chưa
                if (!socket.connected) socket.connect();

                // 2. Lấy Camera
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                originalStreamRef.current = stream;

                // 3. Join Phòng
                socket.emit("join room", { roomID: roomId, username: currentUser.username });

                // --- SOCKET EVENTS ---
                
                // A. Nhận danh sách người cũ -> Gọi họ (INITIATOR)
                socket.on("all users", (users: any[]) => {
                    const peersList: PeerData[] = [];
                    users.forEach((user) => {
                        const peer = createPeer(user.id, socket.id!, stream, currentUser.username);
                        peersRef.current.push({ peerID: user.id, peer, username: user.username });
                        peersList.push({ peerID: user.id, peer, username: user.username });
                    });
                    setPeers(peersList);
                });

                // B. Người mới vào -> Nhận cuộc gọi (LISTENER)
                socket.on("user joined", (payload: any) => {
                    const peer = addPeer(payload.signal, payload.callerID, stream);
                    const newPeer = { peerID: payload.callerID, peer, username: payload.username };
                    peersRef.current.push(newPeer);
                    setPeers(prev => [...prev, newPeer]);
                    toast({ title: `${payload.username} đã tham gia!` });
                });

                // C. Nhận tín hiệu trả lời
                socket.on("receiving returned signal", (payload: any) => {
                    const item = peersRef.current.find((p) => p.peerID === payload.id);
                    if (item) item.peer.signal(payload.signal);
                });

                // D. Người thoát
                socket.on("user left", (id: string) => {
                    const peerObj = peersRef.current.find(p => p.peerID === id);
                    if (peerObj) peerObj.peer.destroy();
                    const newPeers = peersRef.current.filter(p => p.peerID !== id);
                    peersRef.current = newPeers;
                    setPeers(newPeers);
                });

                // Chat & Reaction
                socket.on("receive-chat", (data: any) => setIncomingChat(data));
                socket.on("receive-reaction", (data: any) => setIncomingReaction(data));

            } catch (err) {
                console.error("Lỗi Media:", err);
            }
        };

        init();

        // Cleanup
        return () => {
            // Không disconnect socket ở đây để tránh mất kết nối khi re-render nhẹ
            // Chỉ tắt stream camera
            socket.off("all users");
            socket.off("user joined");
            socket.off("receiving returned signal");
            socket.off("user left");
            // localStream?.getTracks().forEach(track => track.stop());
        };
    }, [roomId, currentUser]);

    function createPeer(userToSignal: string, callerID: string, stream: MediaStream, username: string) {
        const peer = new Peer({ initiator: true, trickle: false, config: ICE_SERVERS, stream });

        peer.on("signal", signal => {
            // Dùng userToSignal chuẩn theo Server
            socket.emit("sending signal", { userToSignal, callerID, signal, username });
        });

        peer.on("stream", remoteStream => {
            // Cập nhật stream theo ID (Fix lỗi tham chiếu object)
            setPeers(prev => prev.map(p => {
                if (p.peerID === userToSignal) return { ...p, stream: remoteStream };
                return p;
            }));
        });

        return peer;
    }

    function addPeer(incomingSignal: any, callerID: string, stream: MediaStream) {
        const peer = new Peer({ initiator: false, trickle: false, config: ICE_SERVERS, stream });

        peer.on("signal", signal => {
            socket.emit("returning signal", { signal, callerID });
        });

        peer.on("stream", remoteStream => {
            // Cập nhật stream theo ID (Fix lỗi tham chiếu object)
            setPeers(prev => prev.map(p => {
                if (p.peerID === callerID) return { ...p, stream: remoteStream };
                return p;
            }));
        });

        peer.signal(incomingSignal);
        return peer;
    }

    // --- MEDIA CONTROLS (GIỮ NGUYÊN LOGIC CŨ) ---
    const toggleMic = () => { if(localStream) { const t = localStream.getAudioTracks()[0]; if(t) { t.enabled = !t.enabled; setIsMuted(!t.enabled); }}};
    const toggleCam = () => { if(localStream) { const t = localStream.getVideoTracks()[0]; if(t) { t.enabled = !t.enabled; setIsCamOff(!t.enabled); }}};
    
    const toggleShare = async () => {
        if(!isSharing) {
            try {
                const screen = await navigator.mediaDevices.getDisplayMedia({ cursor: true } as any);
                setLocalStream(screen); setIsSharing(true);
                
                // Replace track cho peers (Fix nâng cao: cần replaceTrack)
                // Hiện tại chỉ thay đổi local view
                
                screen.getVideoTracks()[0].onended = () => stopShare();
            } catch(e) { console.log(e); }
        } else stopShare();
    };

    const stopShare = () => {
        if(originalStreamRef.current) { setLocalStream(originalStreamRef.current); setIsSharing(false); }
    };

    const toggleRecord = (onSave: any) => { /* Logic cũ giữ nguyên */ };
    const sendSocketMessage = (type: string, payload: any) => { socket.emit(`send-${type}`, { roomId, ...payload }); };

    return {
        socket, localStream, peers, isMuted, isCamOff, isSharing, isRecording,
        toggleMic, toggleCam, toggleShare, toggleRecord, sendSocketMessage,
        incomingChat, incomingReaction
    };
};