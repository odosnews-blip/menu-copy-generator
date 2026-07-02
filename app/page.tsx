"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface BrandSettings {
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

interface SocialPosts { ig: string; fb: string; }
interface LangEntry { name: string; description: string; price: string; }
interface Translations { en?: LangEntry; ja?: LangEntry; ko?: LangEntry; th?: LangEntry; }

const defaultBrand: BrandSettings = { storeName: "", type: "", tone: "", audience: "", forbidden: "", examples: "" };
const defaultItem: ItemForm = { name: "", keywords: "", price: "" };
const LANG_LABELS: Record<string, string> = { en: "English", ja: "日本語", ko: "한국어", th: "ภาษาไทย" };

export default function Home() {
  const [licenseKey, setLicenseKey] = useState("");
  const [licenseInput, setLicenseInput] = useState("");
  const [licenseError, setLicenseError] = useState("");
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [showLicense, setShowLicense] = useState(false);

  const [brand, setBrand] = useState<BrandSettings>(defaultBrand);
  const [item, setItem] = useState<ItemForm>(defaultItem);
  const [copies, setCopies] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [social, setSocial] = useState<SocialPosts | null>(null);
  const [translations, setTranslations] = useState<Translations | null>(null);

  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [translateLoading, setTranslateLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");
  const [socialError, setSocialError] = useState("");
  const [translateError, setTranslateError] = useState("");

  const [copied, setCopied] = useState<string | null>(null);
  const [showBrand, setShowBrand] = useState(true);
  const [activeTab, setActiveTab] = useState<"ig" | "fb">("ig");
  const [activeLang, setActiveLang] = useState<"en" | "ja" | "ko" | "th">("en");
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("menu-license-key");
    if (saved) setLicenseKey(saved);
    const savedBrand = localStorage.getItem("menu-brand-settings-v3");
    if (savedBrand) { setBrand(JSON.parse(savedBrand)); setShowBrand(false); }
  }, []);

  const handleLicenseSubmit = async () => {
    if (!licenseInput.trim()) { setLicenseError("請輸入授權碼"); return; }
    setLicenseLoading(true); setLicenseError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: licenseInput.trim() }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setLicenseKey(licenseInput.trim());
      localStorage.setItem("menu-license-key", licenseInput.trim());
    } catch (e: unknown) {
      setLicenseError(e instanceof Error ? e.message : "驗證失敗");
    } finally { setLicenseLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("menu-license-key");
    setLicenseKey(""); setLicenseInput("");
    setCopies([]); setImageUrl(""); setSocial(null); setTranslations(null);
  };

  const saveBrand = () => {
    localStorage.setItem("menu-brand-settings-v3", JSON.stringify(brand));
    setShowBrand(false);
  };

  const callApi = async (path: string, body: object) => {
    const res = await fetch(path, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey, ...body }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "發生錯誤");
    return data;
  };

  const handleGenerate = async () => {
    if (!item.name.trim()) { setError("請填寫品項名稱"); return; }
    setLoading(true); setError("");
    setCopies([]); setImageUrl(""); setSocial(null); setTranslations(null);
    try { const d = await callApi("/api/generate", { brand, item }); setCopies(d.copies); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "生成失敗"); }
    finally { setLoading(false); }
  };

  const handleGenerateImage = async () => {
    setImageLoading(true); setImageError(""); setImageUrl("");
    try { const d = await callApi("/api/image", { brand, item }); setImageUrl(d.url); }
    catch (e: unknown) { setImageError(e instanceof Error ? e.message : "圖片生成失敗"); }
    finally { setImageLoading(false); }
  };

  const handleGenerateSocial = async () => {
    setSocialLoading(true); setSocialError(""); setSocial(null);
    try { const d = await callApi("/api/social", { brand, item, copies }); setSocial(d); }
    catch (e: unknown) { setSocialError(e instanceof Error ? e.message : "貼文生成失敗"); }
    finally { setSocialLoading(false); }
  };

  const handleTranslate = async () => {
    setTranslateLoading(true); setTranslateError(""); setTranslations(null);
    try { const d = await callApi("/api/translate", { item, copies }); setTranslations(d.translations); }
    catch (e: unknown) { setTranslateError(e instanceof Error ? e.message : "翻譯失敗"); }
    finally { setTranslateLoading(false); }
  };

  const handleDownloadPdf = async () => {
    if (!pdfRef.current) return;
    setPdfLoading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const imgW = pageW - 20;
      const imgH = (canvas.height * imgW) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 10, imgW, Math.min(imgH, pdf.internal.pageSize.getHeight() - 20));
      pdf.save(`${item.name || "菜單"}-menu.pdf`);
    } catch (e) { console.error(e); }
    finally { setPdfLoading(false); }
  };

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const inputCls = "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300";

  // ── 授權碼畫面 ──
  if (!licenseKey) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-stone-200 p-8 w-full max-w-sm space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-semibold text-stone-800">菜單文案生成器</h1>
            <p className="text-sm text-stone-400">請輸入專屬授權碼以開始使用</p>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <input
                type={showLicense ? "text" : "password"}
                placeholder="輸入授權碼，例如 MENU-XXXX-XXXX"
                value={licenseInput}
                onChange={e => setLicenseInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLicenseSubmit()}
                className={`${inputCls} pr-10 placeholder:text-stone-500`}
              />
              <button
                type="button"
                onClick={() => setShowLicense(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                tabIndex={-1}
              >
                {showLicense ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {licenseError && <p className="text-sm text-red-500">{licenseError}</p>}
            <button onClick={handleLicenseSubmit} disabled={licenseLoading}
              className="w-full bg-stone-800 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-50">
              {licenseLoading ? "驗證中…" : "進入系統"}
            </button>
          </div>
          <p className="text-xs text-stone-400 text-center">沒有授權碼？請聯絡服務提供商取得</p>
        </div>
      </div>
    );
  }

  // ── 主畫面 ──
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-stone-800">菜單文案生成器</h1>
            <p className="text-sm text-stone-500 mt-0.5">文案・圖片・社群貼文・多語言・PDF，一站生成</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowBrand(v => !v)} className="text-sm text-stone-500 hover:text-stone-800 underline underline-offset-2">
              {showBrand ? "收起設定" : "品牌設定"}
            </button>
            <button onClick={handleLogout} className="text-xs text-stone-400 hover:text-stone-600 border border-stone-200 rounded-md px-2.5 py-1.5">
              登出
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* 品牌設定 */}
        {showBrand && (
          <section className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
            <h2 className="font-medium text-stone-700">品牌設定</h2>
            <p className="text-xs text-stone-400">設定完成後儲存，之後生成文案時會自動套用</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-sm font-medium text-stone-600">店名</label><input placeholder="例：小島珈琲" value={brand.storeName} onChange={e => setBrand({ ...brand, storeName: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1"><label className="text-sm font-medium text-stone-600">餐飲類型</label><input placeholder="例：文青咖啡廳" value={brand.type} onChange={e => setBrand({ ...brand, type: e.target.value })} className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-sm font-medium text-stone-600">語氣調性</label><input placeholder="例：溫暖親切、質感高雅" value={brand.tone} onChange={e => setBrand({ ...brand, tone: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1"><label className="text-sm font-medium text-stone-600">目標客群</label><input placeholder="例：25–40 歲上班族" value={brand.audience} onChange={e => setBrand({ ...brand, audience: e.target.value })} className={inputCls} /></div>
            </div>
            <div className="space-y-1"><label className="text-sm font-medium text-stone-600">禁止出現的字眼或風格</label><input placeholder="例：不要網路流行語、不要誇張形容詞" value={brand.forbidden} onChange={e => setBrand({ ...brand, forbidden: e.target.value })} className={inputCls} /></div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-600">過去文案範例（可留空）</label>
              <textarea rows={3} placeholder={"例：\n1. 手沖衣索比亞，帶著花果香氣的每一口都是旅行。"} value={brand.examples} onChange={e => setBrand({ ...brand, examples: e.target.value })} className={`${inputCls} resize-none`} />
            </div>
            <button onClick={saveBrand} className="w-full bg-stone-800 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-stone-700 transition-colors">儲存品牌設定</button>
          </section>
        )}

        {/* 品項資訊 */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
          <h2 className="font-medium text-stone-700">品項資訊</h2>
          <div className="space-y-1"><label className="text-sm font-medium text-stone-600">品項名稱 <span className="text-red-400">*</span></label><input placeholder="例：招牌紅燒牛肉麵" value={item.name} onChange={e => setItem({ ...item, name: e.target.value })} className={inputCls} /></div>
          <div className="space-y-1"><label className="text-sm font-medium text-stone-600">主要食材／作法描述</label><input placeholder="例：慢燉 4 小時、澳洲牛腱、辣豆瓣醬" value={item.keywords} onChange={e => setItem({ ...item, keywords: e.target.value })} className={inputCls} /></div>
          <div className="space-y-1"><label className="text-sm font-medium text-stone-600">價格（選填）</label><input type="number" placeholder="例：280" value={item.price} onChange={e => setItem({ ...item, price: e.target.value })} className={inputCls} /></div>
          {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">{error}</div>}
          <button onClick={handleGenerate} disabled={loading} className="w-full bg-amber-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "生成中…" : "✦ 生成菜單文案"}
          </button>
        </section>

        {copies.length > 0 && (
          <>
            {/* 文案結果 */}
            <section className="space-y-3">
              <h2 className="font-medium text-stone-700 px-1">菜單文案</h2>
              {copies.map((copy, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-stone-200 p-5 flex items-start gap-4">
                  <span className="text-xs font-medium text-stone-400 mt-0.5 shrink-0">版本 {idx + 1}</span>
                  <p className="text-stone-700 text-sm leading-relaxed flex-1">{copy}</p>
                  <button onClick={() => handleCopy(copy, `copy-${idx}`)} className="shrink-0 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 rounded-md px-2.5 py-1.5 transition-colors">
                    {copied === `copy-${idx}` ? "已複製 ✓" : "複製"}
                  </button>
                </div>
              ))}
              <button onClick={handleGenerate} disabled={loading} className="w-full border border-stone-300 text-stone-600 rounded-lg py-2.5 text-sm font-medium hover:bg-stone-100 transition-colors disabled:opacity-50">
                {loading ? "重新生成中…" : "↺ 重新生成文案"}
              </button>
            </section>

            {/* 食物圖片 */}
            <section className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div><h2 className="font-medium text-stone-700">食物圖片生成</h2><p className="text-xs text-stone-400 mt-0.5">DALL-E 3 專業食物攝影風格</p></div>
                <button onClick={handleGenerateImage} disabled={imageLoading} className="bg-violet-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-violet-500 transition-colors disabled:opacity-50 shrink-0">
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
                    <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="flex-1 border border-stone-300 text-stone-600 rounded-lg py-2 text-sm font-medium hover:bg-stone-100 transition-colors text-center">下載圖片</a>
                    <button onClick={handleGenerateImage} disabled={imageLoading} className="flex-1 border border-stone-300 text-stone-600 rounded-lg py-2 text-sm font-medium hover:bg-stone-100 transition-colors disabled:opacity-50">↺ 重新生成</button>
                  </div>
                </div>
              )}
            </section>

            {/* 社群貼文 */}
            <section className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div><h2 className="font-medium text-stone-700">社群貼文生成</h2><p className="text-xs text-stone-400 mt-0.5">Instagram 與 Facebook 貼文</p></div>
                <button onClick={handleGenerateSocial} disabled={socialLoading} className="bg-pink-500 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-pink-400 transition-colors disabled:opacity-50 shrink-0">
                  {socialLoading ? "生成中…" : "✦ 生成貼文"}
                </button>
              </div>
              {socialError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">{socialError}</div>}
              {social && (
                <div className="space-y-3">
                  <div className="flex border border-stone-200 rounded-lg overflow-hidden text-sm">
                    <button onClick={() => setActiveTab("ig")} className={`flex-1 py-2 font-medium transition-colors ${activeTab === "ig" ? "bg-stone-800 text-white" : "text-stone-500 hover:bg-stone-50"}`}>Instagram</button>
                    <button onClick={() => setActiveTab("fb")} className={`flex-1 py-2 font-medium transition-colors ${activeTab === "fb" ? "bg-stone-800 text-white" : "text-stone-500 hover:bg-stone-50"}`}>Facebook</button>
                  </div>
                  <div className="relative bg-stone-50 rounded-xl p-4 border border-stone-200">
                    <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap pr-16">{activeTab === "ig" ? social.ig : social.fb}</p>
                    <button onClick={() => handleCopy(activeTab === "ig" ? social.ig : social.fb, `social-${activeTab}`)} className="absolute top-3 right-3 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 rounded-md px-2.5 py-1.5 bg-white transition-colors">
                      {copied === `social-${activeTab}` ? "已複製 ✓" : "複製"}
                    </button>
                  </div>
                  <p className="text-xs text-stone-400 text-right">{(activeTab === "ig" ? social.ig : social.fb).length} 字</p>
                </div>
              )}
            </section>

            {/* 多語言 */}
            <section className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div><h2 className="font-medium text-stone-700">多語言菜單</h2><p className="text-xs text-stone-400 mt-0.5">英文・日文・韓文・泰文</p></div>
                <button onClick={handleTranslate} disabled={translateLoading} className="bg-teal-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-teal-500 transition-colors disabled:opacity-50 shrink-0">
                  {translateLoading ? "翻譯中…" : "✦ 生成多語言"}
                </button>
              </div>
              {translateError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">{translateError}</div>}
              {translations && (
                <div className="space-y-3">
                  <div className="flex border border-stone-200 rounded-lg overflow-hidden text-sm">
                    {(["en", "ja", "ko", "th"] as const).map(lang => (
                      <button key={lang} onClick={() => setActiveLang(lang)} className={`flex-1 py-2 font-medium transition-colors text-xs ${activeLang === lang ? "bg-teal-600 text-white" : "text-stone-500 hover:bg-stone-50"}`}>
                        {LANG_LABELS[lang]}
                      </button>
                    ))}
                  </div>
                  {translations[activeLang] && (
                    <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-stone-800 text-sm">{translations[activeLang]!.name}</p>
                        {translations[activeLang]!.price && <span className="text-xs text-stone-500 bg-stone-200 px-2 py-0.5 rounded-full">{translations[activeLang]!.price}</span>}
                      </div>
                      <p className="text-sm text-stone-600 leading-relaxed">{translations[activeLang]!.description}</p>
                      <button onClick={() => handleCopy(`${translations[activeLang]!.name}\n${translations[activeLang]!.description}${translations[activeLang]!.price ? `\n${translations[activeLang]!.price}` : ""}`, `lang-${activeLang}`)} className="text-xs text-stone-400 hover:text-stone-700 border border-stone-200 rounded-md px-2.5 py-1.5 bg-white transition-colors">
                        {copied === `lang-${activeLang}` ? "已複製 ✓" : "複製此語言"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* PDF */}
            <section className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div><h2 className="font-medium text-stone-700">匯出菜單 PDF</h2><p className="text-xs text-stone-400 mt-0.5">整合所有內容，直接列印或傳給客人</p></div>
                <button onClick={handleDownloadPdf} disabled={pdfLoading} className="bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50 shrink-0">
                  {pdfLoading ? "產生中…" : "↓ 下載 PDF"}
                </button>
              </div>
              <div ref={pdfRef} style={{ fontFamily: "sans-serif", background: "#fff", padding: "32px", borderRadius: "8px", border: "1px solid #e7e5e4" }}>
                {brand.storeName && <p style={{ fontSize: "11px", color: "#78716c", marginBottom: "4px", letterSpacing: "0.1em", textTransform: "uppercase" }}>{brand.storeName}</p>}
                <h3 style={{ fontSize: "22px", fontWeight: 700, color: "#1c1917", margin: "0 0 4px" }}>{item.name}</h3>
                {item.keywords && <p style={{ fontSize: "12px", color: "#a8a29e", margin: "0 0 12px" }}>{item.keywords}</p>}
                <div style={{ height: "1px", background: "#e7e5e4", margin: "12px 0" }} />
                {copies[0] && <p style={{ fontSize: "14px", color: "#44403c", lineHeight: 1.8, margin: "0 0 16px" }}>{copies[0]}</p>}
                {imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt={item.name} style={{ width: "100%", maxHeight: "300px", objectFit: "cover", borderRadius: "8px", margin: "16px 0" }} crossOrigin="anonymous" />
                )}
                {translations?.en && (
                  <div style={{ marginTop: "16px", padding: "12px", background: "#fafaf9", borderRadius: "6px" }}>
                    <p style={{ fontSize: "11px", color: "#a8a29e", margin: "0 0 4px" }}>English</p>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#1c1917", margin: "0 0 4px" }}>{translations.en.name}</p>
                    <p style={{ fontSize: "12px", color: "#78716c", lineHeight: 1.7, margin: 0 }}>{translations.en.description}</p>
                  </div>
                )}
                {item.price && (
                  <div style={{ marginTop: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12px", color: "#a8a29e" }}>售價</span>
                    <span style={{ fontSize: "20px", fontWeight: 700, color: "#1c1917" }}>NT$ {item.price}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-stone-400">預覽包含已生成的圖片和英文翻譯（如果有的話）</p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
