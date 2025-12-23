// lib/socket-client.ts – ĐÃ FIX 100%!!!
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket || !socket.connected) {
    socket = io(process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:5000", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
    });
  }
  return socket;
};

// GỬI TÓM TẮT CHO CẢ PHÒNG
export const emitSummaryToRoom = (roomId: string, summary: string) => {
  const socket = getSocket();
  socket.emit("ai-summary-update", {
    roomId,
    summary,
    time: new Date().toLocaleTimeString("vi-VN"),
  });
};