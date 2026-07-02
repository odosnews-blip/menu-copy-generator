import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { apiKey, brand, item, copies } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: "請填寫 Anthropic API Key" }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });

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

    const systemPrompt = `你是一位專業的餐飲社群媒體行銷專家，擅長為餐廳撰寫吸引人的 IG 和 FB 貼文。
${brandContext}
請根據以上品牌設定，生成符合調性的社群貼文。`;

    const userPrompt = `請為以下品項生成社群媒體貼文，格式為 JSON，只回傳 JSON，不要多餘說明：

品項名稱：${item.name}
食材／作法：${item.keywords || "無"}
${item.price ? `價格：${item.price} 元` : ""}${menuCopyContext}

請回傳：
{
  "ig": "IG 貼文內容（150字以內，包含 3–5 個相關 hashtag，可適度使用 emoji，吸睛開頭）",
  "fb": "FB 貼文內容（250字以內，較完整的故事感敘述，包含 2–3 個 hashtag，結尾可加行動呼召）"
}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("無法解析回應格式");

    const posts = JSON.parse(jsonMatch[0]);
    return NextResponse.json(posts);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知錯誤";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
