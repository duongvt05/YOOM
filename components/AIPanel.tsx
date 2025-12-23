// components/AIPanel.tsx
"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, Languages, Bot, X, Mic, MicOff } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { cn } from "@/lib/utils";
import { getSocket } from "@/lib/socket"; // Đảm bảo anh đã tạo file này

interface AIPanelProps {
  transcript: string;
  onClose: () => void;
  isListening: boolean;
  latestText: string;
  latestSummary: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onSummarize: () => void;
  roomId: string; // BẮT BUỘC TRUYỀN ROOMID
}

export default function AIPanel({
  transcript,
  onClose,
  isListening,
  latestText,
  latestSummary,
  onStartListening,
  onStopListening,
  onSummarize,
  roomId,
}: AIPanelProps) {
  const { toast } = useToast();
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [targetLang, setTargetLang] = useState<"vi" | "en">("en");

  // Tự động hiện tóm tắt mới nhất
  useEffect(() => {
    if (latestSummary) {
      setResult(latestSummary);
    }
  }, [latestSummary]);

  // NHẬN TÓM TẮT REAL-TIME TỪ CẢ PHÒNG
  useEffect(() => {
    if (!roomId) return;

    const socket = getSocket();

    const handleNewSummary = (data: { summary: string }) => {
      setResult(data.summary);
      toast({
        title: "Tóm tắt mới từ cả phòng!",
        description: data.summary,
        duration: 12000,
      });
    };

    socket.on("ai-summary-update", handleNewSummary);

    return () => {
      socket.off("ai-summary-update", handleNewSummary);
    };
  }, [roomId, toast]);

  const callAI = async (action: "summary" | "translate") => {
    if (!transcript.trim()) {
      toast({ title: "Chưa có nội dung để xử lý!", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          action,
          targetLang: targetLang === "vi" ? "en" : "vi",
          roomId, // Gửi roomId để server phát cho cả phòng
        }),
      });

      const data = await res.json();
      if (data.result) {
        setResult(data.result);
      } else {
        setResult("Không có kết quả từ AI");
      }
    } catch (err) {
      setResult("Lỗi kết nối AI");
      toast({ title: "Lỗi AI", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1C1F2E] text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-start">
        <div>
          <h3 className="font-bold text-xl flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            AI Trợ lý (cả phòng đều thấy)
          </h3>
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={isListening ? onStopListening : onStartListening}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition",
                isListening
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              )}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              {isListening ? "Tắt nghe" : "Bật nghe giọng nói"}
            </button>
            {isListening && (
              <span className="flex items-center gap-2 text-green-400">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                Đang nghe...
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nội dung */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Câu vừa nói */}
        {latestText && (
          <div className="bg-blue-900/40 border border-blue-500/40 rounded-2xl p-5">
            <p className="text-blue-300 text-sm mb-2">Bạn vừa nói:</p>
            <p className="text-lg font-medium">"{latestText}"</p>
          </div>
        )}

        {/* Kết quả AI */}
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl p-6 border border-purple-500/50">
          <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Bot className="w-6 h-6" />
            Kết quả AI (cả phòng đều thấy)
          </h4>
          {isLoading ? (
            <div className="flex items-center gap-3 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p>AI đang xử lý...</p>
            </div>
          ) : result ? (
            <div className="bg-black/40 rounded-xl p-5 border border-purple-500/30">
              <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{result}</p>
            </div>
          ) : (
            <p className="text-gray-500 italic">
              Bấm nút bên dưới để AI tóm tắt cho cả phòng
            </p>
          )}
        </div>

        {/* Nút hành động */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => callAI("summary")}
            disabled={isLoading || !transcript.trim()}
            className={cn(
              "py-4 rounded-xl font-bold transition shadow-lg",
              isLoading || !transcript.trim()
                ? "bg-gray-700 text-gray-500"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
            )}
          >
            Tóm tắt cuộc họp
          </button>

          <button
            onClick={() => callAI("translate")}
            disabled={isLoading || !transcript.trim()}
            className={cn(
              "py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg",
              isLoading || !transcript.trim()
                ? "bg-gray-700 text-gray-500"
                : "bg-gradient-to-r from-green-600 to-teal-600 hover:opacity-90"
            )}
          >
            <Languages className="w-5 h-5" />
            Dịch → {targetLang === "vi" ? "Anh" : "Việt"}
          </button>
        </div>

        <button
          onClick={() => setTargetLang(t => (t === "vi" ? "en" : "vi"))}
          className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm transition"
        >
          Chuyển ngôn ngữ: {targetLang === "vi" ? "Tiếng Anh" : "Tiếng Việt"}
        </button>
      </div>
    </div>
  );
}