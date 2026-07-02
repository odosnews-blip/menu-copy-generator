"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface BrandSettings {
  apiKey: string;
  openaiKey: string;
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

interface SocialPosts {
  ig: string;
  fb: string;
}

const defaultBrand: BrandSettings = {
  apiKey: "",
  openaiKey: "",
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
  const [imageUrl, setImageUrl] = useState("");
  const [social, setSocial] = useState<SocialPosts | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");
  const [socialError, setSocialError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [showBrand, setShowBrand] = useState(true);
  const [activeTab, setActiveTab] = useState<"ig" | "fb">("ig");

  useEffect(() => {
    const saved = localStorage.getItem("menu-brand-settings-v2");
    if (saved) {
      setBrand(JSON.parse(saved));
      setShowBrand(false);
    }
  }, []);

  const saveBrand = () => {
    localStorage.setItem("menu-brand-settings-v2", JSON.stringify(brand));
    setShowBrand(false);
  };

  const handleGenerate = async () => {
    if (!brand.apiKey) { setError("請先填寫 Anthropic API Key"); setShowBrand(true); return; }
    if (!item.name.trim()) { setError("請填寫品項名稱"); return; }
    setLoading(true);
    setError("");
    setCopies([]);
    setImageUrl("");
    setSocial(null);
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

  const handleGenerateImage = async () => {
    if (!brand.openaiKey) { setImageError("請先填寫 OpenAI API Key"); setShowBrand(true); return; }
    setImageLoading(true);
    setImageError("");
    setImageUrl("");
    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openaiKey: brand.openaiKey, brand, item }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "圖片生成失敗");
      setImageUrl(data.url);
    } catch (e: unknown) {
      setImageError(e instanceof Error ? e.message : "圖片生成失敗");
    } finally {
      setImageLoading(false);
    }
  };

  const handleGenerateSocial = async () => {
    if (!brand.apiKey) { setSocialError("請先填寫 Anthropic API Key"); setShowBrand(true); return; }
    setSocialLoading(true);
    setSocialError("");
    setSocial(null);
    try {
      const res = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: brand.apiKey, brand, item, copies }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成失敗");
      setSocial(data);
    } catch (e: unknown) {
      setSocialError(e instanceof Error ? e.message : "貼文生成失敗");
    } finally {
      setSocialLoading(false);
    }
  };

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-stone-800">菜單文案生成器</h1>
            <p className="text-sm text-stone-500 mt-0.5">文案・食物圖片・社群貼文，一站生成</p>
          </div>
          <button onClick={() => setShowBrand(v => !v)} className="text-sm text-stone-500 hover:text-stone-800 underline underline-offset-2">
            {showBrand ? "收起設定" : "品牌設定"}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Brand Settings */}
        {showBrand && (
          <section className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
            <h2 className="font-medium text-stone-700">品牌設定</h2>
            <p className="text-xs text-stone-400">儲存後自動套用於所有生成功能</p>

            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-600">Anthropic API Key <span className="text-red-400">*</span></label>
              <input type="password" placeholder="sk-ant-..." value={brand.apiKey}
                onChange={e => setBrand({ ...brand, apiKey: e.target.value })}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
              <p className="text-xs text-stone-400">用於文案與社群貼文生成（<a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="underline">console.anthropic.com</a>）</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-600">OpenAI API Key <span className="text-stone-400 font-normal">（食物圖片生成用）</span></label>
              <input type="password" placeholder="sk-..." value={brand.openaiKey}
                onChange={e => setBrand({ ...brand, openaiKey: e.target.value })}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
              <p className="text-xs text-stone-400">用於 DALL-E 3 食物圖片生成，不需要圖片功能可留空（<a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com</a>）</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-600">店名</label>
                <input placeholder="例：小島珈琲" value={brand.storeName}
                  onChange={e => setBrand({ ...brand, storeName: e.target.value })}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-600">餐飲類型</label>
                <input placeholder="例：文青咖啡廳" value={brand.type}
                  onChange={e => setBrand({ ...brand, type: e.target.value })}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-600">語氣調性</label>
                <input placeholder="例：溫暖親切、質感高雅" value={brand.tone}
                  onChange={e => setBrand({ ...brand, tone: e.target.value })}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-600">目標客群</label>
                <input placeholder="例：25–40 歲上班族" value={brand.audience}
                  onChange={e => setBrand({ ...brand, audience: e.target.value })}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-600">禁止出現的字眼或風格</label>
              <input placeholder="例：不要網路流行語、不要誇張形容詞" value={brand.forbidden}
                onChange={e => setBrand({ ...brand, forbidden: e.target.value })}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-600">過去文案範例（可留空）</label>
              <textarea rows={3} value={brand.examples}
                placeholder={"例：\n1. 手沖衣索比亞，帶著花果香氣的每一口都是旅行。\n2. 慢燉三小時的牛肉湯，像媽媽的廚房。"}
                onChange={e => setBrand({ ...brand, examples: e.target.value })}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none" />
            </div>

            <button onClick={saveBrand} className="w-full bg-stone-800 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-stone-700 transition-colors">
              儲存品牌設定
            </button>
          </section>
        )}

        {/* Item Form */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
          <h2 className="font-medium text-stone-700">品項資訊</h2>

          <div className="space-y-1">
            <label className="text-sm font-medium text-stone-600">品項名稱 <span className="text-red-400">*</span></label>
            <input placeholder="例：招牌紅燒牛肉麵" value={item.name}
              onChange={e => setItem({ ...item, name: e.target.value })}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-stone-600">主要食材／作法描述</label>
            <input placeholder="例：慢燉 4 小時、澳洲牛腱、辣豆瓣醬" value={item.keywords}
              onChange={e => setItem({ ...item, keywords: e.target.value })}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-stone-600">價格（選填）</label>
            <input type="number" placeholder="例：280" value={item.price}
              onChange={e => setItem({ ...item, price: e.target.value })}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">{error}</div>}

          <button onClick={handleGenerate} disabled={loading}
            className="w-full bg-amber-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "生成中…" : "✦ 生成菜單文案"}
          </button>
        </section>

        {/* Menu Copy Results */}
        {copies.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-medium text-stone-700 px-1">菜單文案</h2>
            {copies.map((copy, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-stone-200 p-5 flex items-start gap-4">
                <span className="text-xs font-medium text-stone-400 mt-0.5 shrink-0">版本 {idx + 1}</span>
                <p className="text-stone-700 text-sm leading-relaxed flex-1">{copy}</p>
                <button onClick={() => handleCopy(copy, `copy-${idx}`)}
                  className="shrink-0 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 rounded-md px-2.5 py-1.5 transition-colors">
                  {copied === `copy-${idx}` ? "已複製 ✓" : "複製"}
                </button>
              </div>
            ))}
            <button onClick={handleGenerate} disabled={loading}
              className="w-full border border-stone-300 text-stone-600 rounded-lg py-2.5 text-sm font-medium hover:bg-stone-100 transition-colors disabled:opacity-50">
              {loading ? "重新生成中…" : "↺ 重新生成文案"}
            </button>
          </section>
        )}

        {/* Image Generation */}
        {copies.length > 0 && (
          <section className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-medium text-stone-700">食物圖片生成</h2>
                <p className="text-xs text-stone-400 mt-0.5">使用 DALL-E 3 生成專業食物攝影風格圖片</p>
              </div>
              <button onClick={handleGenerateImage} disabled={imageLoading}
                className="bg-violet-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
                {imageLoading ? "生成中…" : "✦ 生成圖片"}
              </button>
            </div>

            {imageError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">{imageError}</div>}

            {imageLoading && (
              <div className="aspect-square w-full bg-stone-100 rounded-xl flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-stone-400">AI 正在繪製食物圖片（約 15–30 秒）</p>
                </div>
              </div>
            )}

            {imageUrl && !imageLoading && (
              <div className="space-y-3">
                <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-stone-200">
                  <Image src={imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                </div>
                <div className="flex gap-2">
                  <a href={imageUrl} download={`${item.name}.png`} target="_blank" rel="noopener noreferrer"
                    className="flex-1 border border-stone-300 text-stone-600 rounded-lg py-2 text-sm font-medium hover:bg-stone-100 transition-colors text-center">
                    下載圖片
                  </a>
                  <button onClick={handleGenerateImage} disabled={imageLoading}
                    className="flex-1 border border-stone-300 text-stone-600 rounded-lg py-2 text-sm font-medium hover:bg-stone-100 transition-colors disabled:opacity-50">
                    ↺ 重新生成
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Social Posts */}
        {copies.length > 0 && (
          <section className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-medium text-stone-700">社群貼文生成</h2>
                <p className="text-xs text-stone-400 mt-0.5">自動生成 Instagram 與 Facebook 貼文</p>
              </div>
              <button onClick={handleGenerateSocial} disabled={socialLoading}
                className="bg-pink-500 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-pink-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
                {socialLoading ? "生成中…" : "✦ 生成貼文"}
              </button>
            </div>

            {socialError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">{socialError}</div>}

            {social && (
              <div className="space-y-3">
                <div className="flex border border-stone-200 rounded-lg overflow-hidden text-sm">
                  <button onClick={() => setActiveTab("ig")}
                    className={`flex-1 py-2 font-medium transition-colors ${activeTab === "ig" ? "bg-stone-800 text-white" : "text-stone-500 hover:bg-stone-50"}`}>
                    Instagram
                  </button>
                  <button onClick={() => setActiveTab("fb")}
                    className={`flex-1 py-2 font-medium transition-colors ${activeTab === "fb" ? "bg-stone-800 text-white" : "text-stone-500 hover:bg-stone-50"}`}>
                    Facebook
                  </button>
                </div>

                <div className="relative bg-stone-50 rounded-xl p-4 border border-stone-200">
                  <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap pr-16">
                    {activeTab === "ig" ? social.ig : social.fb}
                  </p>
                  <button onClick={() => handleCopy(activeTab === "ig" ? social.ig : social.fb, `social-${activeTab}`)}
                    className="absolute top-3 right-3 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 rounded-md px-2.5 py-1.5 bg-white transition-colors">
                    {copied === `social-${activeTab}` ? "已複製 ✓" : "複製"}
                  </button>
                </div>

                <p className="text-xs text-stone-400 text-right">
                  {activeTab === "ig" ? social.ig.length : social.fb.length} 字
                </p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
