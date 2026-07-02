import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, item, brand } = await req.json();

    const authError = requireAuth(licenseKey);
    if (authError) return NextResponse.json({ error: authError }, { status: 401 });
    if (!item.name) return NextResponse.json({ error: "請填寫品項名稱" }, { status: 400 });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `A professional, appetizing food photography of "${item.name}"${item.keywords ? `, featuring ${item.keywords}` : ""}. ${brand.type ? `Restaurant style: ${brand.type}.` : ""} Shot on a clean background, warm lighting, top-down or 45-degree angle, high resolution, magazine quality, no text, no watermark.`;

    const response = await client.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const url = response.data?.[0]?.url;
    if (!url) throw new Error("圖片生成失敗");
    return NextResponse.json({ url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知錯誤";
    if (message.includes("billing") || message.includes("quota")) {
      return NextResponse.json({ error: "圖片生成額度不足，請聯絡客服" }, { status: 402 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
