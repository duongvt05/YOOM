const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Cấu hình CORS để cho phép kết nối từ Frontend
const io = new Server(server, {
  cors: {
    origin: "*", // Trong thực tế nên đổi thành domain cụ thể của bạn
    methods: ["GET", "POST"]
  }
});

// --- LƯU TRỮ DỮ LIỆU TẠM THỜI (IN-MEMORY) ---
const users = {};           // Mapping: RoomID -> [SocketID, SocketID...]
const socketToRoom = {};    // Mapping: SocketID -> RoomID
const roomToUsernames = {}; // Mapping: RoomID -> { SocketID: Username }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // 1. NGƯỜI DÙNG THAM GIA PHÒNG
  socket.on("join room", ({ roomID, username = "Guest" }) => {
    // Join socket room
    socket.join(roomID);
    socketToRoom[socket.id] = roomID;

    // Khởi tạo data nếu phòng chưa tồn tại
    if (!users[roomID]) users[roomID] = [];
    if (!roomToUsernames[roomID]) roomToUsernames[roomID] = {};

    // Lưu thông tin người dùng
    users[roomID].push(socket.id);
    roomToUsernames[roomID][socket.id] = username;

    // Gửi danh sách người ĐANG Ở TRONG PHÒNG cho người mới vào
    const others = users[roomID].filter(id => id !== socket.id);
    socket.emit("all users", others.map(id => ({
      id,
      username: roomToUsernames[roomID][id] || "Guest"
    })));

    // Thông báo cho người cũ biết có người mới vào (để hiển thị toast hoặc log)
    socket.to(roomID).emit("user joined", { callerID: socket.id, username });

    console.log(`${username} (${socket.id}) joined room ${roomID} | Total users: ${users[roomID].length}`);
  });

  // 2. WEBRTC SIGNALING (Gửi tín hiệu kết nối Video/Audio)
  socket.on("sending signal", (payload) => {
    // Lấy tên người gửi để hiển thị bên frontend
    const senderName = roomToUsernames[socketToRoom[socket.id]]?.[socket.id] || "Guest";
    
    io.to(payload.userToSignal).emit("receiving-offer", {
      signal: payload.signal,
      callerID: payload.callerID,
      username: senderName 
    });
  });

  socket.on("returning signal", (payload) => {
    io.to(payload.callerID).emit("receiving returned signal", {
      signal: payload.signal,
      id: socket.id
    });
  });

  // =========================================================
  // 3. XỬ LÝ CHIA SẺ MÀN HÌNH (MỚI & QUAN TRỌNG)
  // =========================================================
  socket.on("share-status-change", ({ roomId, isSharing }) => {
    // Khi một client báo "Tôi đang share" hoặc "Tôi dừng share"
    // Server sẽ báo tin này cho TẤT CẢ những người khác trong phòng
    socket.to(roomId).emit("update-share-status", {
        peerId: socket.id, // ID của người đang share
        isSharing: isSharing
    });
    
    const name = roomToUsernames[roomId]?.[socket.id] || "User";
    console.log(`[SHARE] ${name} (${socket.id}) changed share status to: ${isSharing}`);
  });

  // 4. AI SPEECH (Chuyển tiếp văn bản AI)
  socket.on("ai-speech", (data) => {
    const roomID = socketToRoom[socket.id];
    if (!roomID) return;

    // Gửi text cho cả phòng (bao gồm cả người nói để đồng bộ transcript)
    io.to(roomID).emit("ai-speech", { text: data.text });
  });

  // 5. CHAT (Tin nhắn văn bản)
  socket.on("send-chat", (data) => {
    const roomID = socketToRoom[socket.id];
    if (!roomID) return;

    const senderName = roomToUsernames[roomID]?.[socket.id] || "Guest";

    const message = {
      sender: senderName,
      msg: data.msg,
      timestamp: new Date().toISOString(),
    };

    // Gửi tin nhắn cho cả phòng
    io.to(roomID).emit("receive-chat", message);
  });

  // 6. REACTION (Thả tim)
  socket.on("send-reaction", (data) => {
    const roomID = socketToRoom[socket.id];
    if (roomID) {
      socket.to(roomID).emit("receive-reaction", { type: data.type });
    }
  });

  // 7. NGẮT KẾT NỐI (Dọn dẹp)
  socket.on("disconnect", () => {
    const roomID = socketToRoom[socket.id];
    if (!roomID) return;

    // Xóa user khỏi danh sách phòng
    if (users[roomID]) {
      users[roomID] = users[roomID].filter(id => id !== socket.id);
      if (roomToUsernames[roomID]) {
          delete roomToUsernames[roomID][socket.id];
      }
      
      // Nếu phòng trống thì xóa phòng luôn để tiết kiệm bộ nhớ
      if (users[roomID].length === 0) {
        delete users[roomID];
        delete roomToUsernames[roomID];
      }
    }

    // Báo cho client khác biết để xóa Peer connection (tránh màn hình đen)
    socket.to(roomID).emit("user left", socket.id);
    
    // Xóa mapping socket
    delete socketToRoom[socket.id];

    console.log(`User ${socket.id} left room ${roomID}`);
  });
});

// KHỞI ĐỘNG SERVER
// Lưu ý: Port này phải khớp với cấu hình NEXT_PUBLIC_BASE_URL ở Frontend
const PORT = 5000; 

server.listen(PORT, "0.0.0.0", () => {
  console.log("========================================");
  console.log("✅ SOCKET.IO SERVER ĐÃ CHẠY THÀNH CÔNG!");
  console.log(`📡 Listening on port: ${PORT}`);
  console.log("========================================");
});