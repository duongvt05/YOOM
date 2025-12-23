'use client';

import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
// Import socket instance của bạn (giả sử bạn đã khởi tạo ở client)
// Nếu chưa có file này, bạn có thể truyền socket qua props
import { io } from "socket.io-client";

const EndCallButton = ({ roomId, socket }: { roomId: string, socket: any }) => {
  const router = useRouter();

  const endCall = () => {
    if (socket) {
      // Gửi sự kiện ngắt kết nối lên server socket của bạn
      socket.emit("leave-room", { roomId });
      
      // Hoặc đơn giản là đóng kết nối client
      socket.disconnect();
    }
    
    // Quay về trang chủ
    router.push('/');
    
    // Reload lại trang để đảm bảo clean state (tùy chọn)
    // window.location.href = '/'; 
  };

  return (
    <Button onClick={endCall} className="bg-red-500">
      End Call
    </Button>
  );
};

export default EndCallButton;