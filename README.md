# 2. Cài dependencies
npm install

# 3. Tạo file .env.local (QUAN TRỌNG NHẤT!!!)
echo "GROQ_API_KEY=gsk_YourKeyHere1234567890" > .env.local
echo "NEXT_PUBLIC_BASE_URL=http://localhost:5000" >> .env.local

# 4. Chạy server Socket.IO (mở terminal thứ 2)
npm run server

# 5. Chạy frontend (terminal đầu tiên)
npm run dev

