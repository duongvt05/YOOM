'use client';
import { useState, useEffect } from 'react';
import { X, Send, Bot, Sparkles, MessageSquare, Users, ArrowRightLeft } from "lucide-react"; 
import ParticipantsList from './ParticipantsList';
import { askAI } from '@/actions/ai.actions';

interface MeetingSidebarProps {
    activeSidebar: 'participants' | 'chat' | 'ai' | null;
    onClose: () => void;
    socket: any;
    roomId: string;
    currentUser: any;
    peers: any[];
}

const MeetingSidebar = ({ activeSidebar, onClose, socket, roomId, currentUser, peers }: MeetingSidebarProps) => {
    const [chatHistory, setChatHistory] = useState<{sender: string, msg: string}[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [transcript, setTranscript] = useState("");
    const [aiResult, setAiResult] = useState("");
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [targetLang, setTargetLang] = useState("Tiếng Việt");

    // Nhận chat & Voice
    useEffect(() => {
        if(socket) {
             socket.on("receive-chat", (data: any) => setChatHistory(prev => [...prev, data]));
        }

        if ('webkitSpeechRecognition' in window) {
            const recognition = new (window as any).webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.lang = 'vi-VN';
            recognition.onresult = (event: any) => {
                const text = Array.from(event.results).map((res: any) => res[0].transcript).join('');
                setTranscript(text);
            };
            recognition.start();
        }
    }, [socket]);

    const sendChat = () => {
        if(!chatInput.trim()) return;
        const msgData = { sender: currentUser?.username || "Me", msg: chatInput };
        setChatHistory(prev => [...prev, msgData]);
        socket?.emit("send-chat", { roomId, ...msgData });
        setChatInput("");
    };

    const handleAI = async (mode: 'summary' | 'translate') => {
        setIsAiLoading(true);
        const res = await askAI(transcript, mode, targetLang);
        setAiResult(res || "Không có kết quả.");
        setIsAiLoading(false);
    };

    if (!activeSidebar) return null;

    return (
        <div className={`fixed right-0 top-0 h-full w-[350px] bg-[#1C1F2E] border-l border-gray-700 shadow-2xl transition-transform duration-300 z-20 flex flex-col`}>
            
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center text-white">
                <h2 className="font-bold text-lg capitalize flex items-center gap-2">
                    {activeSidebar === 'ai' && <><Bot /> AI Assistant</>}
                    {activeSidebar === 'chat' && <><MessageSquare /> Chat</>}
                    {activeSidebar === 'participants' && <><Users /> Participants</>}
                </h2>
                <button onClick={onClose} className="hover:bg-gray-700 p-1 rounded"><X /></button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 text-white flex flex-col">
                
                {/* 1. Participants */}
                {activeSidebar === 'participants' && (
                    <ParticipantsList participants={[{name: 'Bạn (Me)', isMe: true}, ...peers.map((p, i) => ({name: `User ${i+1}`}))]} onClose={()=>{}} />
                )}

                {/* 2. Chat */}
                {activeSidebar === 'chat' && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 space-y-3 overflow-y-auto mb-4 pr-2">
                            {chatHistory.map((c, i) => (
                                <div key={i} className={`p-3 rounded-lg text-sm max-w-[85%] ${c.sender === (currentUser?.username || "Me") ? 'bg-blue-600 self-end ml-auto' : 'bg-gray-700 self-start'}`}>
                                    <span className="font-bold text-[10px] block opacity-70 mb-1">{c.sender}</span>
                                    {c.msg}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 border-t border-gray-700 pt-2">
                            <input className="flex-1 bg-gray-800 rounded p-2 text-sm outline-none" value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()} placeholder="Type..." />
                            <button onClick={sendChat} className="p-2 bg-blue-600 rounded"><Send size={16}/></button>
                        </div>
                    </div>
                )}

                {/* 3. AI */}
                {activeSidebar === 'ai' && (
                    <div className="flex flex-col gap-4 h-full">
                        <select className="w-full bg-gray-800 rounded p-2 text-sm" value={targetLang} onChange={e=>setTargetLang(e.target.value)}>
                            <option value="Tiếng Việt">🇻🇳 Tiếng Việt</option>
                            <option value="Tiếng Anh">🇺🇸 English</option>
                        </select>
                        <div className="bg-gray-800 p-2 rounded h-32 overflow-y-auto text-xs text-gray-300">
                            <p className="font-bold text-blue-400 mb-1">Transcript:</p> {transcript || "..."}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={()=>handleAI('summary')} disabled={isAiLoading} className="bg-purple-600 py-2 rounded text-xs font-bold flex justify-center gap-1">{isAiLoading?"...":<><Sparkles size={14}/> Tóm tắt</>}</button>
                            <button onClick={()=>handleAI('translate')} disabled={isAiLoading} className="bg-blue-600 py-2 rounded text-xs font-bold flex justify-center gap-1">{isAiLoading?"...":<><ArrowRightLeft size={14}/> Dịch</>}</button>
                        </div>
                        <div className="flex-1 bg-gray-800 p-3 rounded text-sm overflow-y-auto">
                            <p className="font-bold text-purple-400 mb-1">Kết quả:</p> {aiResult}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MeetingSidebar;