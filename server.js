const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// LƯU THÔNG TIN NGƯỜI DÙNG
const users = {};
const socketToRoom = {};
const roomToUsernames = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // 1. JOIN ROOM (SỬA LẠI TÊN SỰ KIỆN: "join room" thay vì "join-room")
  socket.on("join room", ({ roomID, username = "Guest" }) => {
    socket.join(roomID);
    socketToRoom[socket.id] = roomID;

    if (!users[roomID]) users[roomID] = [];
    if (!roomToUsernames[roomID]) roomToUsernames[roomID] = {};

    users[roomID].push(socket.id);
    roomToUsernames[roomID][socket.id] = username;

    // Gửi danh sách người cũ cho người mới
    const others = users[roomID].filter(id => id !== socket.id);
    socket.emit("all users", others.map(id => ({
      id,
      username: roomToUsernames[roomID][id] || "Guest"
    })));

    // Thông báo người mới (Optional)
    socket.to(roomID).emit("user joined", { callerID: socket.id, username });

    console.log(`${username} (${socket.id}) joined room ${roomID} | Total: ${users[roomID].length}`);
  });

  // 2. WEBRTC SIGNALING (QUAN TRỌNG)
  socket.on("sending signal", (payload) => {
    // SỬA: Gửi kèm username để người nhận biết ai đang gọi
    const senderName = roomToUsernames[socketToRoom[socket.id]]?.[socket.id] || "Guest";
    
    io.to(payload.userToSignal).emit("receiving-offer", {
      signal: payload.signal,
      callerID: payload.callerID,
      username: senderName // <-- QUAN TRỌNG: Frontend cần cái này để hiện tên
    });
  });

  socket.on("returning signal", (payload) => {
    io.to(payload.callerID).emit("receiving returned signal", {
      signal: payload.signal,
      id: socket.id
    });
  });

  // 3. AI SPEECH (SỬA TÊN SỰ KIỆN EMIT ĐỂ KHỚP FRONTEND)
  socket.on("ai-speech", (data) => {
    const roomID = socketToRoom[socket.id];
    if (!roomID) return;

    // Frontend đang nghe "ai-speech", nên server phải emit "ai-speech"
    io.to(roomID).emit("ai-speech", { text: data.text });
  });

  // 4. CHAT
  socket.on("send-chat", (data) => {
    const roomID = socketToRoom[socket.id];
    if (!roomID) return;

    const senderName = roomToUsernames[roomID]?.[socket.id] || "Guest";

    const message = {
      sender: senderName,
      msg: data.msg,
      timestamp: new Date().toISOString(),
    };

    io.to(roomID).emit("receive-chat", message);
  });

  // 5. REACTION
  socket.on("send-reaction", (data) => {
    const roomID = socketToRoom[socket.id];
    if (roomID) {
      socket.to(roomID).emit("receive-reaction", { type: data.type });
    }
  });

  // 6. DISCONNECT
  socket.on("disconnect", () => {
    const roomID = socketToRoom[socket.id];
    if (!roomID) return;

    if (users[roomID]) {
      users[roomID] = users[roomID].filter(id => id !== socket.id);
      if (roomToUsernames[roomID]) {
          delete roomToUsernames[roomID][socket.id];
      }
      
      // Clean up empty room
      if (users[roomID].length === 0) {
        delete users[roomID];
        delete roomToUsernames[roomID];
      }
    }

    // Báo cho client xóa Peer của người vừa out
    socket.to(roomID).emit("user left", socket.id);
    delete socketToRoom[socket.id];

    console.log(`User ${socket.id} left room ${roomID}`);
  });
});

// KHỞI ĐỘNG SERVER
server.listen(5000, "0.0.0.0", () => {
  console.log("========================================");
  console.log("SOCKET.IO SERVER ĐÃ CHẠY THÀNH CÔNG!");
  console.log("Cổng: 5000");
  console.log("Local: http://localhost:3000");
  console.log("Mạng LAN: http://172.16.0.154:3000");
  console.log("========================================");
});