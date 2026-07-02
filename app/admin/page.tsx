"use client";

import { useState } from "react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [keys, setKeys] = useState<string[]>([]);
  const [newKey, setNewKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/admin/keys?password=${encodeURIComponent(password)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setKeys(data.keys);
      setAuthed(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "登入失敗");
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, keys }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setKeys(data.keys);
      setSuccess("✓ 已儲存並觸發重新部署，約 30 秒後生效");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "儲存失敗");
    } finally { setSaving(false); }
  };

  const addKey = () => {
    const k = newKey.trim();
    if (!k) return;
    if (keys.includes(k)) { setError("授權碼已存在"); return; }
    setKeys([...keys, k]);
    setNewKey("");
    setError("");
  };

  const removeKey = (k: string) => setKeys(keys.filter(x => x !== k));

  const inputCls = "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 placeholder:text-stone-500";

  if (!authed) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-stone-200 p-8 w-full max-w-sm space-y-5">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-semibold text-stone-800">後台管理</h1>
            <p className="text-sm text-stone-400">輸入管理員密碼</p>
          </div>
          <input
            type="password"
            placeholder="管理員密碼"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            className={inputCls}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button onClick={handleLogin} disabled={loading}
            className="w-full bg-stone-800 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-50">
            {loading ? "驗證中…" : "登入"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-stone-800">授權碼管理後台</h1>
            <p className="text-xs text-stone-400 mt-0.5">新增或刪除客戶授權碼</p>
          </div>
          <a href="/" className="text-sm text-stone-400 hover:text-stone-700 border border-stone-200 rounded-md px-3 py-1.5">
            回首頁
          </a>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-8 space-y-6">
        {/* 新增授權碼 */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
          <h2 className="font-medium text-stone-700">新增授權碼</h2>
          <div className="flex gap-2">
            <input
              placeholder="例：MENU-2025-DDDD-0004"
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addKey()}
              className={`${inputCls} flex-1`}
            />
            <button onClick={addKey}
              className="bg-stone-800 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-700 transition-colors shrink-0">
              新增
            </button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </section>

        {/* 目前授權碼清單 */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-stone-700">目前授權碼（{keys.length} 組）</h2>
          </div>
          {keys.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-4">尚無授權碼</p>
          ) : (
            <ul className="space-y-2">
              {keys.map((k, i) => (
                <li key={i} className="flex items-center justify-between bg-stone-50 rounded-lg px-4 py-2.5 border border-stone-200">
                  <code className="text-sm text-stone-700 font-mono">{k}</code>
                  <button onClick={() => removeKey(k)}
                    className="text-xs text-red-400 hover:text-red-600 border border-red-200 rounded-md px-2.5 py-1 transition-colors ml-3 shrink-0">
                    刪除
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 儲存 */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm">
            {success}
          </div>
        )}
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-amber-500 text-white rounded-lg py-3 text-sm font-medium hover:bg-amber-400 transition-colors disabled:opacity-50">
          {saving ? "儲存並重新部署中…" : "✦ 儲存並重新部署"}
        </button>
        <p className="text-xs text-stone-400 text-center">儲存後約 30 秒重新部署完成，新授權碼立即生效</p>
      </main>
    </div>
  );
}
