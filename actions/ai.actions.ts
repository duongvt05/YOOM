// actions/ai.actions.ts

"use server";

import OpenAI from 'openai';
// KHAI BÁO USER: Tạm thời dùng biến môi trường để tránh lỗi
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Hàm này xử lý tóm tắt và dịch thuật
export const askAI = async (text: string, mode: 'summary' | 'translate', language: string) => {
  try {
    if (!text) return "Chưa có nội dung để xử lý.";

    let systemPrompt = "";

    if (mode === 'summary') {
      systemPrompt = `Bạn là thư ký chuyên nghiệp. Hãy tóm tắt các ý chính của văn bản sau bằng ngôn ngữ ${language}. Trình bày gạch đầu dòng rõ ràng.`;
    } else if (mode === 'translate') {
      systemPrompt = `Bạn là phiên dịch viên cao cấp. Hãy dịch toàn bộ văn bản sau sang ngôn ngữ ${language}.`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("AI Error:", error);
    return "Lỗi kết nối AI.";
  }
};

// Hàm chat đơn giản (dùng cho tab chat)
export const chatWithAI = async (prompt: string, history: any) => {
    // Logic chat sẽ gọi GPT-3.5 tương tự hàm askAI
    return "Tôi là YOOM AI, tôi sẵn sàng hỗ trợ bạn.";
}