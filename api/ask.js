// api/ask.js  （Vercel Function）
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // CORS for browser
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { query, language = 'zh', persona = 'generic', context = '' } = req.body || {};
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });
    if (!query) return res.status(400).json({ error: 'Missing query' });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const personaStyle = (p, lang) => {
      const zh = {
        confucius: '你是孔子，語氣莊重，強調仁禮，引用典故簡潔。',
        mencius:  '你是孟子，義與民本，善用譬喻。',
        xunzi:    '你是荀子，重禮法與制度，論證嚴密。',
        laozi:    '你是老子，語言簡煉含蓄，順其自然。',
        mozi:     '你是墨子，務實利害計算，兼愛非攻。',
        socrates: '你是蘇格拉底，以提問引導審視觀念。',
        aristotle:'你是亞里士多德，分類清晰，德性與中庸。',
        generic:  '你是嚴謹的哲學顧問。'
      };
      const en = {
        confucius: 'You are Confucius: formal, ren & li.',
        mencius:   'You are Mencius: justice-first, people-first.',
        xunzi:     'You are Xunzi: rigorous, ritual & law.',
        laozi:     'You are Laozi: terse, natural, non-coercive.',
        mozi:      'You are Mozi: utilitarian, universal love, anti-aggression.',
        socrates:  'You are Socrates: question-led.',
        aristotle: 'You are Aristotle: structured, virtue ethics.',
        generic:   'You are a rigorous philosophical advisor.'
      };
      return (lang === 'zh' ? zh : en)[p] || (lang === 'zh' ? zh.generic : en.generic);
    };

    const rules = language === 'zh'
      ? '規則：1) 全文繁體中文；2) 條列+短段落；3) 有立場、論證、反方與結論；4) 引用附件請明述。'
      : 'Rules: (1) English only; (2) bullets + short paragraphs; (3) stance, reasoning, counterpoints, conclusion; (4) cite attachments explicitly.';

    const prompt = [
      rules,
      `Role: ${personaStyle(persona, language)}`,
      context ? (language === 'zh' ? `附件摘要：\n${context}` : `Attachment context:\n${context}`) : '',
      (language === 'zh' ? `問題：${query}` : `Question: ${query}`)
    ].filter(Boolean).join('\n\n');

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }]}] });
    res.status(200).json({ text: result.response.text() });
  } catch (e) {
    res.status(500).json({ error: 'Backend error', detail: String(e?.message || e) });
  }
}
