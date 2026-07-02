import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "th", name: "ภาษาไทย" },
];

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, item, copies } = await req.json();

    const authError = requireAuth(licenseKey);
    if (authError) return NextResponse.json({ error: authError }, { status: 401 });
    if (!copies?.length) return NextResponse.json({ error: "請先生成菜單文案" }, { status: 400 });

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const userPrompt = `請將以下餐廳菜單資訊翻譯成多種語言，回傳 JSON 格式，只回傳 JSON 不要多餘說明。

原始資訊（繁體中文）：
品項名稱：${item.name}
${item.keywords ? `食材／作法：${item.keywords}` : ""}
${item.price ? `價格：${item.price} 元` : ""}
菜單描述文案（取第一則）：${copies[0]}

請回傳：
{
  "en": { "name": "英文品項名稱", "description": "英文描述（30-60字）", "price": "價格（如 NT$280）" },
  "ja": { "name": "日文品項名稱", "description": "日文描述（30-60字）", "price": "價格" },
  "ko": { "name": "韓文品項名稱", "description": "韓文描述（30-60字）", "price": "價格" },
  "th": { "name": "泰文品項名稱", "description": "泰文描述（30-60字）", "price": "價格" }
}

翻譯要自然流暢，符合各語言的餐飲文案慣例，不要直譯。`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("無法解析翻譯結果");
    return NextResponse.json({ translations: JSON.parse(jsonMatch[0]), languages: LANGUAGES });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知錯誤";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
