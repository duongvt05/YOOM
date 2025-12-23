'use client';

import { 
  Camera, CameraOff, Mic, MicOff, PhoneOff, Users, 
  MonitorUp, MessageSquare, Sparkles, Smile, Disc, Circle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// TYPE CHUẨN – ĐÃ FIX HOÀN HẢO!!!
export type ActiveSidebarType = 'participants' | 'chat' | 'ai' | null;
export type CallLayoutType = "grid" | "speaker" | "presentation";

interface CallControlsProps {
  onLayoutChange: (layout: CallLayoutType) => void;
  onLeave: () => void;

  // Media
  isMuted: boolean;
  toggleMute: () => void;
  isCamOff: boolean;
  toggleCam: () => void;

  // Features
  isSharing: boolean;
  toggleShare: () => void;
  isRecording: boolean;
  toggleRecord: () => void;

  // Sidebar & AI
  activeSidebar: ActiveSidebarType;
  setActiveSidebar: (val: ActiveSidebarType) => void;

  // Reaction – ĐÃ FIX: không bắt buộc tham số
  onReaction?: () => void;
}

const CallControls = ({ 
  onLeave, 
  isMuted, toggleMute, 
  isCamOff, toggleCam,
  isSharing, toggleShare, 
  isRecording, toggleRecord,
  activeSidebar, setActiveSidebar, 
  onReaction
}: CallControlsProps) => {

  const ControlButton = ({ 
    icon: Icon, 
    label, 
    onClick, 
    isActive = false, 
    isDanger = false,
    isRecording = false 
  }: any) => (
    <div className="flex flex-col items-center gap-1 group relative">
      <button
        onClick={onClick}
        className={cn(
          "relative p-4 rounded-2xl transition-all duration-300 shadow-lg",
          "border border-transparent",
          isActive || isRecording
            ? isRecording
              ? "bg-red-600 border-red-500 shadow-red-500/50 animate-pulse ring-4 ring-red-500/30"
              : "bg-blue-600 border-blue-500 shadow-blue-500/50"
            : "bg-gray-800 hover:bg-gray-700 hover:border-gray-600",
          isDanger && "bg-red-600 hover:bg-red-700"
        )}
      >
        {isRecording ? (
          <div className="flex items-center gap-2">
            <Circle className="w-5 h-5 fill-white" />
            <span className="text-xs font-bold">REC</span>
          </div>
        ) : (
          <Icon className="w-6 h-6" />
        )}
      </button>

      {/* Tooltip */}
      <span className={cn(
        "absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap",
        "bg-black/90 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none",
        "before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-black/90"
      )}>
        {label}
      </span>

      <span className={cn(
        "text-xs text-gray-400 group-hover:text-white transition-colors",
        isRecording && "text-red-500 font-bold animate-pulse"
      )}>
        {isRecording ? "Recording" : label}
      </span>
    </div>
  );

  return (
    <div className="w-full flex items-center justify-between px-6 py-4 text-white h-full bg-[#1C1F2E] border-t border-gray-800">
      
      {/* Left: Recording Indicator */}
      <div className="hidden lg:flex items-center gap-4">
        {isRecording && (
          <div className="flex items-center gap-3 bg-red-900/40 border border-red-500/50 px-4 py-2 rounded-full animate-pulse">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            <div className="w-3 h-3 bg-red-500 rounded-full absolute"></div>
            <span className="text-red-400 font-bold text-sm tracking-wider">● REC</span>
            <span className="text-gray-300 text-xs">Đang ghi hình...</span>
          </div>
        )}
      </div>

      {/* Center: Main Controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Mic */}
        <ControlButton 
          icon={isMuted ? MicOff : Mic} 
          label={isMuted ? "Bật mic" : "Tắt mic"} 
          onClick={toggleMute} 
          isActive={isMuted}
          isDanger={isMuted}
        />

        {/* Camera */}
        <ControlButton 
          icon={isCamOff ? CameraOff : Camera} 
          label={isCamOff ? "Bật camera" : "Tắt camera"} 
          onClick={toggleCam} 
          isActive={isCamOff}
          isDanger={isCamOff}
        />

        {/* Share Screen */}
        <ControlButton 
          icon={MonitorUp} 
          label={isSharing ? "Dừng chia sẻ" : "Chia sẻ màn hình"} 
          onClick={toggleShare} 
          isActive={isSharing}
        />

        {/* RECORD */}
        <ControlButton 
          icon={Disc} 
          label={isRecording ? "Dừng ghi" : "Ghi hình"} 
          onClick={toggleRecord} 
          isActive={isRecording}
          isRecording={isRecording}
        />

        {/* Reaction */}
        <ControlButton 
          icon={Smile} 
          label="Phản ứng" 
          onClick={onReaction || (() => {})}
        />

        <div className="w-px h-12 bg-gray-700 mx-2"></div>

        {/* AI Bot */}
        <ControlButton 
          icon={Sparkles} 
          label="AI Bot" 
          onClick={() => setActiveSidebar(activeSidebar === 'ai' ? null : 'ai')} 
          isActive={activeSidebar === 'ai'}
        />

        {/* Chat */}
        <ControlButton 
          icon={MessageSquare} 
          label="Chat" 
          onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')} 
          isActive={activeSidebar === 'chat'}
        />

        {/* Participants */}
        <ControlButton 
          icon={Users} 
          label="Thành viên" 
          onClick={() => setActiveSidebar(activeSidebar === 'participants' ? null : 'participants')} 
          isActive={activeSidebar === 'participants'}
        />
      </div>

      {/* Right: End Call */}
      <div className="flex justify-end">
        <button 
          onClick={onLeave} 
          className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-red-600/50 flex items-center gap-3"
        >
          <PhoneOff className="w-5 h-5" />
          Rời phòng
        </button>
      </div>
    </div>
  );
};

export default CallControls;