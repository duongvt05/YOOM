// app/api/ai/route.ts
import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // transcript: Nội dung gốc (hoặc nội dung tóm tắt cần dịch)
    // action: "summary" hoặc "translate"
    // targetLang: "en" (Anh) hoặc "vi" (Việt)
    const { transcript, action = "summary", targetLang = "vi" } = body;

    if (!transcript || transcript.trim() === "") {
      return NextResponse.json({ error: "Không có nội dung" }, { status: 400 });
    }

    let prompt = "";
    
    // --- CASE 1: TÓM TẮT ---
    if (action === "summary") {
      prompt = `
      Bạn là thư ký cuộc họp. Hãy tóm tắt văn bản sau bằng Tiếng Việt.
      Yêu cầu: Ngắn gọn, gạch đầu dòng các ý chính, bỏ qua từ thừa.
      Văn bản: "${transcript}"
      `;
    } 
    // --- CASE 2: DỊCH THUẬT ---
    else if (action === "translate") {
      const langName = targetLang === 'vi' ? "Tiếng Việt" : "English";
      prompt = `
      Hãy dịch đoạn văn bản sau sang ${langName} một cách tự nhiên, chuyên nghiệp.
      Chỉ trả về kết quả dịch, không thêm lời dẫn.
      
      Văn bản cần dịch:
      "${transcript}"
      `;
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
        return NextResponse.json({ error: "Lỗi kết nối AI" }, { status: 500 });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim() || "Không có kết quả";

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Lỗi AI:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}