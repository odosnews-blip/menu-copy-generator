import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;

async function getEnvVarId(): Promise<string | null> {
  const res = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_ID}/env`, {
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const envVar = (data.envs ?? []).find((e: { key: string }) => e.key === "LICENSE_KEYS");
  return envVar?.id ?? null;
}

export async function GET(req: NextRequest) {
  const password = new URL(req.url).searchParams.get("password");
  if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD)
    return NextResponse.json({ error: "密碼錯誤" }, { status: 401 });

  const keys = (process.env.LICENSE_KEYS ?? "")
    .split(",").map(k => k.trim()).filter(Boolean);
  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  const { password, keys }: { password: string; keys: string[] } = await req.json();
  if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD)
    return NextResponse.json({ error: "密碼錯誤" }, { status: 401 });
  if (!VERCEL_TOKEN || !PROJECT_ID)
    return NextResponse.json({ error: "缺少 VERCEL_TOKEN 或 VERCEL_PROJECT_ID 環境變數" }, { status: 500 });

  const envId = await getEnvVarId();
  if (!envId)
    return NextResponse.json({ error: "找不到 LICENSE_KEYS，請確認 Vercel 環境變數已建立" }, { status: 500 });

  const newValue = keys.filter(Boolean).join(",");

  const updateRes = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_ID}/env/${envId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ value: newValue }),
  });

  if (!updateRes.ok) {
    const err = await updateRes.json();
    return NextResponse.json({ error: err.error?.message ?? "更新失敗" }, { status: 500 });
  }

  // 觸發重新部署
  const deploymentsRes = await fetch(
    `https://api.vercel.com/v6/deployments?projectId=${PROJECT_ID}&target=production&limit=1`,
    { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
  );
  if (deploymentsRes.ok) {
    const { deployments } = await deploymentsRes.json();
    const latest = deployments?.[0];
    if (latest?.uid) {
      await fetch("https://api.vercel.com/v13/deployments", {
        method: "POST",
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          deploymentId: latest.uid,
          name: "menu-copy-generator",
          target: "production",
        }),
      });
    }
  }

  return NextResponse.json({ ok: true, keys: keys.filter(Boolean) });
}
