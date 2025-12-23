import React from 'react';
import { User, Mic, MicOff, Video, VideoOff, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Giao diện danh sách thành viên hiện đại
const ParticipantsList = ({ participants, onClose }: { participants: any[], onClose: () => void }) => {
  return (
    <div className="flex flex-col h-full bg-dark-2/95 backdrop-blur-xl border-l border-white/5 shadow-2xl">
      {/* Header */}
      <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
           <User className="w-5 h-5 text-brand-500" />
           Thành viên ({participants.length})
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {participants.map((p, index) => {
           // Giả lập màu avatar ngẫu nhiên dựa trên tên
           const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500'];
           const colorClass = colors[index % colors.length];
           
           return (
            <div key={index} className="flex items-center justify-between p-3 rounded-2xl bg-dark-1/50 border border-white/5 hover:border-white/10 transition-all hover:bg-dark-1 group">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md", colorClass)}>
                        {p.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    
                    {/* Name */}
                    <div>
                        <p className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">
                            {p.name} {p.isLocal && <span className="text-xs text-gray-500 font-normal">(Bạn)</span>}
                        </p>
                        <p className="text-[10px] text-gray-500">Đang trực tuyến</p>
                    </div>
                </div>

                {/* Status Icons (Demo: Local luôn bật, remote có thể tắt) */}
                <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-full", p.stream ? "bg-green-500/10" : "bg-red-500/10")}>
                        {p.stream ? <Mic className="w-3.5 h-3.5 text-green-500" /> : <MicOff className="w-3.5 h-3.5 text-red-500" />}
                    </div>
                    <div className={cn("p-1.5 rounded-full", p.stream ? "bg-blue-500/10" : "bg-red-500/10")}>
                        {p.stream ? <Video className="w-3.5 h-3.5 text-blue-500" /> : <VideoOff className="w-3.5 h-3.5 text-red-500" />}
                    </div>
                </div>
            </div>
           );
        })}
      </div>

      {/* Footer (Invite Button) */}
      <div className="p-4 border-t border-white/10 bg-dark-1/80">
        <button 
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition shadow-lg shadow-brand-600/20"
            onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                // Bạn có thể thêm Toast thông báo "Đã copy link" tại đây
            }}
        >
            Sao chép link mời
        </button>
      </div>
    </div>
  );
};

export default ParticipantsList;