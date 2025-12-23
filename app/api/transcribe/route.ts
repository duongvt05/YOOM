import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: "Không tìm thấy file audio/video" }, { status: 400 });
    }

    // 1. Cấu hình gửi sang Groq Audio API (Whisper)
    // Model whisper-large-v3 hỗ trợ tiếng Việt rất tốt
    const groqFormData = new FormData();
    groqFormData.append("file", file, "recording.webm");
    groqFormData.append("model", "whisper-large-v3"); 
    groqFormData.append("temperature", "0"); // 0 để lấy kết quả chính xác nhất
    groqFormData.append("response_format", "json");

    // 2. Gọi API Groq
    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: groqFormData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq Whisper Error:", errText);
      return NextResponse.json({ error: "Lỗi xử lý âm thanh từ Groq" }, { status: 500 });
    }

    const data = await response.json();
    // Trả về văn bản đã bóc tách
    return NextResponse.json({ text: data.text });

  } catch (error) {
    console.error("Transcribe API Error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống server" }, { status: 500 });
  }
}