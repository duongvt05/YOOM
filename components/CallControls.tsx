"use client";

import { 
  Camera, CameraOff, Mic, MicOff, PhoneOff, Users, 
  MonitorUp, MessageSquare, Sparkles, Smile, Disc, StopCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ActiveSidebarType = 'participants' | 'chat' | 'ai' | null;
export type CallLayoutType = "grid" | "speaker" | "presentation";

interface CallControlsProps {
  onLayoutChange: (layout: CallLayoutType) => void;
  onLeave: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  isCamOff: boolean;
  toggleCam: () => void;
  isSharing: boolean;
  toggleShare: () => void;
  isRecording: boolean;
  toggleRecord: () => void;
  activeSidebar: ActiveSidebarType;
  setActiveSidebar: (val: ActiveSidebarType) => void;
  onReaction?: () => void;
}

const CallControls = ({ 
  onLeave, isMuted, toggleMute, isCamOff, toggleCam,
  isSharing, toggleShare, isRecording, toggleRecord,
  activeSidebar, setActiveSidebar, onReaction
}: CallControlsProps) => {

  // Component nút bấm tùy chỉnh
  const ControlButton = ({ icon: Icon, label, onClick, isActive, isDanger, className }: any) => (
    <div className="group relative flex items-center justify-center">
      <button
        onClick={onClick}
        className={cn(
          "p-3.5 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg border border-white/5",
          "bg-gray-800/60 hover:bg-gray-700/80 backdrop-blur-md text-white", // Glass effect
          isActive && !isDanger && "bg-brand-500 hover:bg-brand-600 shadow-brand-500/50",
          isDanger && "bg-destruct hover:bg-red-600 shadow-red-500/50",
          className
        )}
      >
        <Icon className="w-5 h-5" />
      </button>

      {/* Custom Tooltip */}
      <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-dark-2/90 border border-white/10 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none backdrop-blur-sm">
        {label}
      </span>
    </div>
  );

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4 w-full px-4 pointer-events-none">
      
      {/* Recording Status (Nổi lên trên) */}
      {isRecording && (
        <div className="flex items-center gap-2 bg-red-950/80 border border-red-500/30 px-4 py-1.5 rounded-full animate-pulse backdrop-blur-md shadow-lg pointer-events-auto">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
          <span className="text-red-200 text-xs font-bold tracking-widest uppercase">Recording</span>
        </div>
      )}

      {/* Main Dock Container */}
      <div className="flex items-center gap-2 sm:gap-4 p-3 rounded-2xl bg-dark-1/80 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto hover:border-white/20 transition-colors">
        
        {/* MEDIA GROUP */}
        <div className="flex items-center gap-2">
          <ControlButton 
            icon={isMuted ? MicOff : Mic} 
            label={isMuted ? "Bật Mic" : "Tắt Mic"} 
            onClick={toggleMute} 
            isDanger={isMuted} 
          />
          <ControlButton 
            icon={isCamOff ? CameraOff : Camera} 
            label={isCamOff ? "Bật Camera" : "Tắt Camera"} 
            onClick={toggleCam} 
            isDanger={isCamOff} 
          />
        </div>

        {/* SEPARATOR */}
        <div className="w-px h-8 bg-white/10 mx-1" />

        {/* FEATURES GROUP */}
        <div className="flex items-center gap-2">
          <ControlButton 
            icon={MonitorUp} 
            label={isSharing ? "Dừng chia sẻ" : "Chia sẻ"} 
            onClick={toggleShare} 
            isActive={isSharing}
            className={isSharing ? "bg-green-600 hover:bg-green-700" : ""}
          />
          <ControlButton 
            icon={isRecording ? StopCircle : Disc} 
            label={isRecording ? "Dừng ghi" : "Ghi hình"} 
            onClick={toggleRecord} 
            isActive={isRecording}
            className={isRecording ? "bg-red-600 hover:bg-red-700 animate-pulse" : ""}
          />
          <ControlButton 
            icon={Smile} 
            label="Thả tim" 
            onClick={onReaction}
            className="text-pink-400 hover:text-pink-300"
          />
          <ControlButton 
            icon={Sparkles} 
            label="Trợ lý AI" 
            onClick={() => setActiveSidebar(activeSidebar === 'ai' ? null : 'ai')} 
            isActive={activeSidebar === 'ai'}
            className={activeSidebar === 'ai' ? "bg-purple-600 hover:bg-purple-700 ring-2 ring-purple-400/30" : "text-yellow-400"}
          />
        </div>

        {/* SEPARATOR */}
        <div className="w-px h-8 bg-white/10 mx-1" />

        {/* SIDEBAR GROUP */}
        <div className="flex items-center gap-2">
          <ControlButton 
            icon={MessageSquare} 
            label="Chat" 
            onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')} 
            isActive={activeSidebar === 'chat'}
          />
          <ControlButton 
            icon={Users} 
            label="Thành viên" 
            onClick={() => setActiveSidebar(activeSidebar === 'participants' ? null : 'participants')} 
            isActive={activeSidebar === 'participants'}
          />
        </div>

        {/* LEAVE BUTTON (Tách biệt) */}
        <button 
          onClick={onLeave} 
          className="ml-2 px-6 py-3.5 bg-red-600/90 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-red-600/40 flex items-center gap-2 backdrop-blur-sm"
        >
          <PhoneOff className="w-4 h-4" />
          <span className="hidden md:inline">Kết thúc</span>
        </button>
      </div>
    </div>
  );
};

export default CallControls;