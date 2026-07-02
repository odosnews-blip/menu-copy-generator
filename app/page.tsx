"use client";

import { useState, useEffect } from "react";

interface BrandSettings {
  apiKey: string;
  storeName: string;
  type: string;
  tone: string;
  audience: string;
  forbidden: string;
  examples: string;
}

interface ItemForm {
  name: string;
  keywords: string;
  price: string;
}

const defaultBrand: BrandSettings = {
  apiKey: "",
  storeName: "",
  type: "",
  tone: "",
  audience: "",
  forbidden: "",
  examples: "",
};

const defaultItem: ItemForm = { name: "", keywords: "", price: "" };

export default function Home() {
  const [brand, setBrand] = useState<BrandSettings>(defaultBrand);
  const [item, setItem] = useState<ItemForm>(defaultItem);
  const [copies, setCopies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const [showBrand, setShowBrand] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("menu-brand-settings");
    if (saved) {
      setBrand(JSON.parse(saved));
      setShowBrand(false);
    }
  }, []);

  const saveBrand = () => {
    localStorage.setItem("menu-brand-settings", JSON.stringify(brand));
    setShowBrand(false);
  };

  const handleGenerate = async () => {
    if (!brand.apiKey) {
      setError("請先填寫 Anthropic API Key");
      setShowBrand(true);
      return;
    }
    if (!item.name.trim()) {
      setError("請填寫品項名稱");
      return;
    }
    setLoading(true);
    setError("");
    setCopies([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: brand.apiKey, brand, item }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成失敗");
      setCopies(data.copies);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "生成失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-stone-800">菜單文案生成器</h1>
            <p className="text-sm text-stone-500 mt-0.5">輸入品項資訊，AI 自動生成有質感的菜單描述</p>
          </div>
          <button
            onClick={() => setShowBrand((v) => !v)}
            className="text-sm text-stone-500 hover:text-stone-800 underline underline-offset-2"
          >
            {showBrand ? "收起設定" : "品牌設定"}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {showBrand && (
          <section className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
            <h2 className="font-medium text-stone-700">品牌設定</h2>
            <p className="text-xs text-stone-400">設定完成後儲存，之後生成文案時會自動套用這些品牌調性</p>

            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-600">
                Anthropic API Key <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                placeholder="sk-ant-..."
                value={brand.apiKey}
                onChange={(e) => setBrand({ ...brand, apiKey: e.target.value })}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
              <p className="text-xs text-stone-400">
                請至{" "}
                <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="underline">
                  console.anthropic.com
                </a>{" "}
                取得 API Key，費用由你自己的帳戶承擔
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-600">店名</label>
                <input
                  placeholder="例：小島珈琲"
                  value={brand.storeName}
                  onChange={(e) => setBrand({ ...brand, storeName: e.target.value })}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-600">餐飲類型</label>
                <input
                  placeholder="例：文青咖啡廳"
                  value={brand.type}
                  onChange={(e) => setBrand({ ...brand, type: e.target.value })}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-600">語氣調性</label>
                <input
                  placeholder="例：溫暖親切、質感高雅"
                  value={brand.tone}
                  onChange={(e) => setBrand({ ...brand, tone: e.target.value })}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-600">目標客群</label>
                <input
                  placeholder="例：25–40 歲上班族"
                  value={brand.audience}
                  onChange={(e) => setBrand({ ...brand, audience: e.target.value })}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-600">禁止出現的字眼或風格</label>
              <input
                placeholder="例：不要網路流行語、不要誇張形容詞"
                value={brand.forbidden}
                onChange={(e) => setBrand({ ...brand, forbidden: e.target.value })}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-600">過去文案範例（可留空）</label>
              <textarea
                rows={3}
                placeholder={"例：\n1. 手沖衣索比亞，帶著花果香氣的每一口都是旅行。\n2. 慢燉三小時的牛肉湯，像媽媽的廚房。"}
                value={brand.examples}
                onChange={(e) => setBrand({ ...brand, examples: e.target.value })}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
              />
            </div>

            <button
              onClick={saveBrand}
              className="w-full bg-stone-800 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-stone-700 transition-colors"
            >
              儲存品牌設定
            </button>
          </section>
        )}

        <section className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
          <h2 className="font-medium text-stone-700">品項資訊</h2>

          <div className="space-y-1">
            <label className="text-sm font-medium text-stone-600">
              品項名稱 <span className="text-red-400">*</span>
            </label>
            <input
              placeholder="例：招牌紅燒牛肉麵"
              value={item.name}
              onChange={(e) => setItem({ ...item, name: e.target.value })}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-stone-600">主要食材／作法描述</label>
            <input
              placeholder="例：慢燉 4 小時、澳洲牛腱、辣豆瓣醬"
              value={item.keywords}
              onChange={(e) => setItem({ ...item, keywords: e.target.value })}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-stone-600">價格（選填）</label>
            <input
              type="number"
              placeholder="例：280"
              value={item.price}
              onChange={(e) => setItem({ ...item, price: e.target.value })}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-amber-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "生成中…" : "✦ 生成文案"}
          </button>
        </section>

        {copies.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-medium text-stone-700 px-1">生成結果</h2>
            {copies.map((copy, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-stone-200 p-5 flex items-start gap-4">
                <span className="text-xs font-medium text-stone-400 mt-0.5 shrink-0">版本 {idx + 1}</span>
                <p className="text-stone-700 text-sm leading-relaxed flex-1">{copy}</p>
                <button
                  onClick={() => handleCopy(copy, idx)}
                  className="shrink-0 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 rounded-md px-2.5 py-1.5 transition-colors"
                >
                  {copied === idx ? "已複製 ✓" : "複製"}
                </button>
              </div>
            ))}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full border border-stone-300 text-stone-600 rounded-lg py-2.5 text-sm font-medium hover:bg-stone-100 transition-colors disabled:opacity-50"
            >
              {loading ? "重新生成中…" : "↺ 重新生成"}
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
