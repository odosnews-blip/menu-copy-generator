# 菜單文案生成器

讓餐廳老闆輸入品項資訊，AI 自動生成有質感的菜單描述文字。

## 使用方式

1. 在「品牌設定」填入你的 Anthropic API Key 及店家資訊，按「儲存」
2. 在「品項資訊」填入品項名稱、食材作法、價格
3. 按「生成文案」，取得 3 個版本的描述文字
4. 點「複製」直接貼到菜單或 POS 系統

## 本機執行

```bash
npm install
npm run dev
```

開啟瀏覽器前往 http://localhost:3000

## 取得 Anthropic API Key

1. 前往 https://console.anthropic.com
2. 註冊／登入後，點選 API Keys → Create Key
3. 複製 Key（格式為 `sk-ant-...`），貼入網頁的「品牌設定」欄位
4. 費用由你自己的 Anthropic 帳戶承擔（使用 Haiku 模型，費用極低）

## 部署到 Vercel（免費，讓外部用戶使用）

1. 安裝 Git：https://git-scm.com/download/win
2. 在專案資料夾執行：
   ```bash
   git init
   git add .
   git commit -m "init"
   ```
3. 前往 https://github.com，建立新 repository，把程式碼推上去
4. 前往 https://vercel.com，用 GitHub 帳號登入
5. 點「Add New → Project」，選剛才的 repository，按 Deploy
6. 部署完成後取得公開網址，分享給任何餐廳老闆使用

> 安全說明：此工具不儲存任何資料，API Key 只存在用戶自己的瀏覽器 localStorage，伺服器端不會留存任何金鑰或文案記錄。
