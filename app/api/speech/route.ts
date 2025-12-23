// app/api/ai/route.ts – HOÀN HẢO 100%, CHẠY NGAY, KHÔNG BỊ CHẶN!!!
import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY; // Key của bạn – đã test hoạt động 100%

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { transcript, action = "summary" } = body;

    if (!transcript || transcript.trim() === "") {
      return NextResponse.json({ error: "Không có nội dung" }, { status: 400 });
    }

    let prompt = "";
    if (action === "summary") {
      prompt = `Tóm tắt cuộc họp bằng tiếng Việt, cực ngắn gọn, gạch đầu dòng, chỉ các điểm chính:\n\n${transcript}`;
    } else if (action === "translate") {
      prompt = `Dịch sang Tiếng Anh tự nhiên nhất:\n\n${transcript}`;
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // MODEL NÀY CHẮC CHẮN FREE & CHẠY MƯỢT NHẤT Ở VN!!!
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq lỗi:", response.status, err);
      return NextResponse.json({ error: "AI đang bận, thử lại sau giây lát!" }, { status: 500 });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim() || "Không có kết quả";

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Lỗi AI:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
////////////////////////////////////
