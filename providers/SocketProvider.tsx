"use client";
import React, { createContext, useMemo, useContext } from "react";
import { io, Socket } from "socket.io-client";

// 1. Khởi tạo Context để chia sẻ socket instance
const SocketContext = createContext<Socket | null>(null);

// 2. Hook tùy chỉnh để truy cập socket trong các component con
export const useSocket = () => {
  return useContext(SocketContext);
};

// 3. Provider Component
export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  // Ghi nhớ và chỉ tạo kết nối một lần (useMemo)
  // Kết nối tới server đang chạy trên cổng 3000 (hoặc cổng bạn đã thiết lập cho server.js)
  const socket = useMemo(() => io("http://localhost:3000"), []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};