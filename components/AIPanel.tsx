"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, Languages, Bot, X, Mic, MicOff, BrainCircuit, FileText } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { cn } from "@/lib/utils";
import { getSocket } from "@/lib/socket";

interface AIPanelProps {
  transcript: string;
  onClose: () => void;
  isListening: boolean;
  latestText: string;
  latestSummary: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onSummarize: () => void;
  roomId: string;
}

export default function AIPanel({
  transcript, onClose, isListening, latestText, latestSummary,
  onStartListening, onStopListening, onSummarize, roomId,
}: AIPanelProps) {
  const { toast } = useToast();
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [targetLang, setTargetLang] = useState<"vi" | "en">("en");

  useEffect(() => {
    if (latestSummary) setResult(latestSummary);
  }, [latestSummary]);

  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();
    const handleNewSummary = (data: { summary: string }) => {
      setResult(data.summary);
      toast({ title: "✨ Tóm tắt mới từ AI!", description: "Đã cập nhật thông tin cuộc họp." });
    };
    socket.on("ai-summary-update", handleNewSummary);
    return () => { socket.off("ai-summary-update", handleNewSummary); };
  }, [roomId, toast]);

  const callAI = async (action: "summary" | "translate") => {
    if (!transcript.trim()) {
      toast({ title: "Chưa có nội dung!", description: "Hãy nói gì đó trước khi nhờ AI.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript, action, targetLang: targetLang === "vi" ? "en" : "vi", roomId,
        }),
      });
      const data = await res.json();
      setResult(data.result || "Không có kết quả");
    } catch (err) {
      setResult("Lỗi kết nối AI");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-2/95 backdrop-blur-xl border-l border-white/5 shadow-2xl text-white">
      
      {/* Header */}
      <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <div>
                <h3 className="font-bold text-lg leading-tight">AI Assistant</h3>
                <p className="text-xs text-gray-400">Trợ lý họp thông minh</p>
            </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        
        {/* Status Bar */}
        <div className="flex items-center justify-between bg-dark-1/50 p-3 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2">
                {isListening ? (
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                ) : (
                    <div className="h-3 w-3 rounded-full bg-gray-500"></div>
                )}
                <span className={cn("text-xs font-medium", isListening ? "text-green-400" : "text-gray-400")}>
                    {isListening ? "Đang nghe hội thoại..." : "Đang chờ lệnh"}
                </span>
            </div>
            
            <button
                onClick={isListening ? onStopListening : onStartListening}
                className={cn(
                    "p-2 rounded-xl transition-all shadow-lg",
                    isListening ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                )}
            >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
        </div>

        {/* Live Transcript Bubble */}
        {latestText && (
          <div className="flex flex-col items-end gap-1 animate-in slide-in-from-right-5 fade-in">
            <div className="bg-brand-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm max-w-[90%] shadow-md">
              <p className="text-sm font-medium leading-relaxed">"{latestText}"</p>
            </div>
            <span className="text-[10px] text-gray-500 font-medium mr-1">Vừa xong</span>
          </div>
        )}

        {/* AI Result Card */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-purple-500/20 overflow-hidden shadow-xl">
           <div className="bg-purple-900/20 px-4 py-3 border-b border-purple-500/10 flex items-center gap-2">
               <Bot className="w-4 h-4 text-purple-400" />
               <h4 className="text-sm font-bold text-purple-200">AI Insight</h4>
           </div>
           
           <div className="p-4 min-h-[150px] max-h-[300px] overflow-y-auto">
              {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 py-4 text-purple-300/50">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <p className="text-xs">Đang phân tích dữ liệu...</p>
                  </div>
              ) : result ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                      <p className="text-gray-300 leading-relaxed whitespace-pre-line">{result}</p>
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 py-4 text-gray-600">
                      <Sparkles className="w-8 h-8 opacity-20" />
                      <p className="text-xs text-center">Chọn chức năng bên dưới <br/> để bắt đầu</p>
                  </div>
              )}
           </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-dark-1/80 border-t border-white/5 space-y-3">
        <button
          onClick={() => callAI("summary")}
          disabled={isLoading || !transcript.trim()}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-3 rounded-xl font-semibold shadow-lg shadow-purple-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <FileText className="w-4 h-4" />
            Tóm tắt cuộc họp
        </button>

        <div className="flex gap-2">
            <button
                onClick={() => callAI("translate")}
                disabled={isLoading || !transcript.trim()}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 py-3 rounded-xl font-medium text-sm transition-all border border-white/5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
                <Languages className="w-4 h-4 text-green-400" />
                Dịch sang {targetLang === "vi" ? "Anh" : "Việt"}
            </button>
            <button
                onClick={() => setTargetLang(t => (t === "vi" ? "en" : "vi"))}
                className="px-4 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 hover:text-white transition-all border border-white/5 font-bold"
            >
                {targetLang === "vi" ? "EN" : "VN"}
            </button>
        </div>
      </div>
    </div>
  );
}