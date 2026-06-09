# 黑貓 OS v3 — AI／搜尋功能第三方專家諮詢簡報

**專案**：whatspp_Blackcat_OS（WhatsApp 輕量 OS，Node.js + whatsapp-web.js）  
**日期**：2026-06-09  
**字數**：約 500 字（供外部專家審閱）

---

## 一、背景與設計原則

黑貓 OS 以「微核心 + 可插拔插件」架構，透過已連結的 WhatsApp Web 裝置收發訊息。搜尋與 AI 採 **BYOK（Bring Your Own Key）**：API 金鑰與 Token 費用由部署者自行負擔，專案作者不代付，以避免開源專案承擔無上限帳單風險。

## 二、現況摘要

**（1）使用者入口不足**  
主選單僅四項（計算機、工具箱、翻譯、遊戲）；工具箱七項（地圖、郵件、備忘等）均**未含 AI／搜尋**。AI 僅能透過快捷指令 `=問`（語意問答）、`=查`（關鍵字搜尋）觸發，一般使用者易誤以為「沒有 AI 功能」。

**（2）技術分層（瀑布降級）**  
- **L0**：回傳 Google 搜尋 URL，無 API Key，零成本。  
- **L1**：Google Custom Search JSON API（需 `GOOGLE_CSE_KEY` + `GOOGLE_CSE_CX`），在 WhatsApp 內回最多三行摘要。  
- **L2**：`AI_API_KEY` 呼叫 **OpenAI Chat Completions**（非 Google Gemini），按 **Token** 計費；無 Key 時自動降級為 L0。

**（3）與「Google API」的關係**  
地圖插件僅產生 Apple／Google Maps **深連結**，未接 Places API；翻譯使用第三方非官方套件，非 Google Cloud Translation 正式 API。需求文件曾規劃 Gemini／Places，**程式尚未實作**。

## 三、已觀察到的產品問題

實機測試中，使用者期望在選單內「選擇 AI」，並釐清 Google 與 Token 費用；郵件功能曾回傳純文字 `mailto:`，WhatsApp 無法點擊（已改為 http(s) 中轉頁，裝置選擇流程仍在驗證）。

## 四、請教專家之意見

1. **資訊架構**：是否應於主選單或工具箱新增「AI／搜尋」入口？是否需讓使用者明示選擇 L0（連結）／L1（CSE）／L2（LLM）？  
2. **供應商策略**：L2 維持 OpenAI，或改接 **Google Gemini API**？在繁中／粵語場景下之成本、延遲與幻覺控制何者較佳？  
3. **成本與配額**：CSE 每日 100 次免費額度是否適合小團隊？Token 預算建議（例如單次 `max_tokens`）？  
4. **部署合規**：Railway 上以環境變數存放 BYOK 之安全實務；WhatsApp 非官方 API 與 AI 內容生成之風險邊界。  
5. **路線建議**：在「零 Key 可用」與「對話內 AI 答案」之間，專家建議的 MVP 優先序為何？

---

*本簡報依據 `lib/plugins/search.js`、`lib/search-llm.js`、`config/menu.json` 及 `V3OS需求文件.md` 整理，不代表最終產品決策。*
