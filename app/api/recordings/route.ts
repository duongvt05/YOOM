import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Định nghĩa thư mục lưu trữ: public/recordings
const recordingsDir = path.join(process.cwd(), 'public', 'recordings');

// 1. GET: LẤY DANH SÁCH FILE (Lọc theo User)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    // Nếu chưa có thư mục thì tạo mới và trả về rỗng
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true });
      return NextResponse.json({ files: [] });
    }

    // Quét file và lọc
    const files = fs.readdirSync(recordingsDir)
      .filter(f => f.endsWith('.webm')) // Chỉ lấy file video .webm
      .filter(f => {
         // [QUAN TRỌNG] Chỉ lấy file của đúng User đang đăng nhập
         if (username && f.startsWith(`${username}_`)) return true;
         
         // [MỞ RỘNG] Hỗ trợ hiển thị các file cũ (tên là meeting-...) để bạn dễ test
         if (f.startsWith('meeting-')) return true;

         return false; // Các file của user khác sẽ bị ẩn
      })
      .map(file => ({
        name: file,
        url: `/recordings/${file}`, // Đường dẫn để hiển thị trên frontend
        time: fs.statSync(path.join(recordingsDir, file)).mtimeMs // Lấy thời gian tạo để sắp xếp
      }))
      .sort((a, b) => b.time - a.time); // Sắp xếp mới nhất lên đầu

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Lỗi đọc danh sách:", error);
    return NextResponse.json({ error: 'Lỗi đọc danh sách' }, { status: 500 });
  }
}

// 2. POST: LƯU FILE RECORDING MỚI
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File; 
    
    if (!file) {
        return NextResponse.json({ error: 'Không tìm thấy file' }, { status: 400 });
    }

    // Đảm bảo thư mục tồn tại
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Lấy tên file từ Frontend gửi lên (đã bao gồm username + time)
    const filename = file.name; 
    const filepath = path.join(recordingsDir, filename);
    
    // Ghi file vào ổ cứng
    fs.writeFileSync(filepath, buffer);
    console.log("Đã lưu file thành công:", filename);

    return NextResponse.json({ 
        success: true, 
        url: `/recordings/${filename}` 
    });
  } catch (error) {
    console.error("Lỗi lưu file:", error);
    return NextResponse.json({ error: 'Lưu thất bại' }, { status: 500 });
  }
}

// 3. DELETE: XÓA FILE RECORDING
export async function DELETE(req: Request) {
  try {
    const { filename } = await req.json();

    if (!filename) {
      return NextResponse.json({ error: 'Thiếu tên file' }, { status: 400 });
    }

    const filepath = path.join(recordingsDir, filename);

    // Kiểm tra file có tồn tại không trước khi xóa
    if (fs.existsSync(filepath)) {
      // Xóa file vật lý khỏi thư mục
      fs.unlinkSync(filepath);
      console.log("Đã xóa vĩnh viễn file:", filename);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'File không tồn tại' }, { status: 404 });
    }
  } catch (error) {
    console.error("Lỗi xóa file:", error);
    return NextResponse.json({ error: 'Lỗi xóa file' }, { status: 500 });
  }
}