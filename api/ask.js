// /api/ask.js (Vercel Function)
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // === CORS Headers (處理跨來源請求，讓您的前端可以呼叫) ===
  res.setHeader('Access-Control-Allow-Origin', '*'); // 在開發中設為 *，未來可以鎖定您的前端網域
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  // === 只允許 POST 請求 ===
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // === 檢查 API Key 是否已在 Vercel 環境變數中設定 ===
    if (!process.env.GEMINI_API_KEY) {
      console.error("Missing GEMINI_API_KEY in environment variables");
      return res.status(500).json({ error: "Server configuration error: Missing API Key" });
    }
    
    // === 直接從請求中讀取 prompt 字串 ===
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing 'prompt' in request body" });
    }

    // === 初始化並呼叫 Google AI ===
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // === 將 Google AI 的回覆傳回給前端 ===
    return res.status(200).json({ response: text });

  } catch (error) {
    console.error("Error calling Google Generative AI:", error);
    // 回傳一個更詳細的錯誤訊息給前端，方便除錯
    return res.status(500).json({ error: "An error occurred while communicating with the AI service.", details: error.message });
  }
}
