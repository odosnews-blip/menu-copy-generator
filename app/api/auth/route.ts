import { NextRequest, NextResponse } from "next/server";
import { validateLicenseKey } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { licenseKey } = await req.json();
  if (!licenseKey) return NextResponse.json({ error: "請輸入授權碼" }, { status: 400 });
  if (!validateLicenseKey(licenseKey)) return NextResponse.json({ error: "授權碼無效或已過期" }, { status: 401 });
  return NextResponse.json({ ok: true });
}
