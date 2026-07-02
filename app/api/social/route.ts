import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, brand, item, copies } = await req.json();

    const authError = requireAuth(licenseKey);
    if (authError) return NextResponse.json({ error: authError }, { status: 401 });

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const brandContext = [
      brand.storeName && `店名：${brand.storeName}`,
      brand.type && `餐飲類型：${brand.type}`,
      brand.tone && `語氣調性：${brand.tone}`,
      brand.audience && `目標客群：${brand.audience}`,
      brand.forbidden && `禁止字眼：${brand.forbidden}`,
    ].filter(Boolean).join("\n");

    const menuCopyContext = copies?.length
      ? `\n\n已生成的菜單文案供參考：\n${copies.map((c: string, i: number) => `${i + 1}. ${c}`).join("\n")}`
      : "";

    const userPrompt = `請為以下品項生成社群媒體貼文，格式為 JSON，只回傳 JSON：

店家資訊：\n${brandContext}
品項名稱：${item.name}
食材／作法：${item.keywords || "無"}
${item.price ? `價格：${item.price} 元` : ""}${menuCopyContext}

請回傳：
{
  "ig": "IG 貼文（150字以內，3–5 個 hashtag，可適度使用 emoji，吸睛開頭）",
  "fb": "FB 貼文（250字以內，故事感敘述，2–3 個 hashtag，結尾加行動呼召）"
}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("無法解析回應格式");
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知錯誤";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
