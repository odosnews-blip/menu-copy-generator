import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { apiKey, brand, item } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: "請填寫 Anthropic API Key" }, { status: 400 });
    }
    if (!item.name) {
      return NextResponse.json({ error: "請填寫品項名稱" }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });

    const systemPrompt = `你是一位專業的餐飲文案撰寫師，擅長寫出吸引人又有質感的菜單描述文字。
${brand.storeName ? `店名：${brand.storeName}` : ""}
${brand.type ? `餐飲類型：${brand.type}` : ""}
${brand.tone ? `語氣調性：${brand.tone}` : ""}
${brand.audience ? `目標客群：${brand.audience}` : ""}
${brand.forbidden ? `禁止使用的字眼或風格：${brand.forbidden}` : ""}
${brand.examples ? `品牌文案範例參考：\n${brand.examples}` : ""}

請根據以上品牌設定，生成符合調性的菜單描述文字。每則文案約 30–60 個字，語句自然流暢，不要過度堆砌形容詞。`;

    const userPrompt = `請為以下品項生成 3 個版本的菜單描述文字（每則約 30–60 字），格式為 JSON 陣列，例如：["文案一", "文案二", "文案三"]，只回傳 JSON，不要多餘說明。

品項名稱：${item.name}
關鍵字／作法描述：${item.keywords || "無"}
${item.price ? `價格：${item.price} 元` : ""}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("無法解析回應格式");
    }

    const copies: string[] = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ copies });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知錯誤";
    if (message.includes("401") || message.includes("authentication")) {
      return NextResponse.json({ error: "API Key 無效，請確認後重試" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
