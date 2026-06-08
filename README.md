# Blackcat Light OS (V3)

Protocol-agnostic microkernel ChatOps OS for high-frequency short interactions (Apple Watch & Smart Glasses friendly).

---

## 絕對原則（產品鐵律 — 不可違反）

> **最後修訂：2026-06-08 · 專案負責人聲明**

1. **所有對使用者可見的功能必須為真實行為**，不得用假資料、假結果、占位文案或「模板輸出」冒充已完成能力。
2. **禁止**向使用者回覆 `[Mock]`、`即將開放`、`占位`、`stub`、固定範例譯文、假 URL 結果等——除非該功能**尚未上線且選單中明確標示為未提供**（且不得讓使用者以為已成功執行）。
3. **地圖、翻譯、搜尋、備忘、郵件、待辦等**：交付給使用者的內容必須來自**真實解析、真實 API 或真實深連結**，不是 `messages.json` 裡的示範句。
4. **單元／整合測試**可用 mock **模擬 WhatsApp 訊息通道**（例如 `phase9_mock_e2e.test.js`），但**不得**把測試用 mock 當成產品功能對外上線。
5. 若某 Phase 規格書仍寫「Mock 階段」，以**本 README 為準**；實作必須改為真實能力，或**暫時從選單移除該項**，不可假裝可用。

**違反處理：** 發現任何使用者面向的模板輸出，視為缺陷，優先修復或下架該入口，再通過驗收。

---

## Absolute policy (English summary)

All **user-facing** features must perform **real work** (real APIs, real parsing, real deep links). No mock replies, placeholder text, or template output masquerading as completed functionality. Test-only mocks for the WhatsApp transport layer are allowed; product-facing mocks are **not**.

---

## Core philosophy: Quick Gateway

Except for the Calculator and Game Hub, tools use **One-shot → IDLE**: sanitize input, deliver a real result in-chat, then release the session.

---

## What is real today (Phase 0–2)

| Feature | Status | Notes |
|---------|--------|--------|
| Main menu (`=開始`) | **Real** | Routes to apps by number |
| Ledger calculator (`1`) | **Real** | v1 calc on `appData.calc` |
| Maps (`2`, `=地圖`) | **Real** | Apple / Google Maps URLs via `encodeURIComponent` |
| Translate (`3`, `=翻`) | **Real** | `@vitalets/google-translate-api`；引用或 `=翻 en 文字` |
| Search (`=查`, `=問`) | **Real** | L0 Google URL → L1 CSE（需 Key）→ L2 LLM（需 `AI_API_KEY`） |
| Mail (`=email`) | **Real** | L0 `mailto:`；L1 Gmail（`GMAIL_USER` + `GMAIL_APP_PASSWORD`） |
| Todo (`=待辦`, `=看待辦`) | **Real** | 黑貓待辦；含時間語意→行事曆連結 |
| Clock (`=提醒我`) | **Real** | Google Calendar 深連結；**不**在 WhatsApp 代響 |
| Game hub (`4`) | **⚠ Not compliant** | Menu only; no playable game until Phase 7 — must not imply a working game |
| `=結算` / `=結束` / PROMPT_GUARD | **Real** | V3 OS semantics |

---

## Optional env keys (search tiers)

| Variable | Enables |
|----------|---------|
| `GOOGLE_CSE_KEY` + `GOOGLE_CSE_CX` | L1 in-chat results (max 3 lines) |
| `AI_API_KEY` or `OPENAI_API_KEY` | L2 LLM summary for `=問` |

---

## Run verification

```powershell
cd "D:\Users\Ophelia Chan\Desktop\MY Project\whatspp_Blackcat_OS"
python test/verify_v3.py
python test/phase_v3_2_check.py
node test/handler_v3_smoke.test.js
```

## Run on WhatsApp

```powershell
npm install
node index.js
```

Requires Node.js and Chromium (via `whatsapp-web.js`). Scan QR or pair by phone.

---

## Project docs

| Doc | Purpose |
|-----|---------|
| [docs/PHASES_v3.md](docs/PHASES_v3.md) | Phase checklist (subject to README no-mock policy) |
| [V3OS需求文件.md](V3OS需求文件.md) | Requirements |
| [V3OS專案架構.md](V3OS專案架構.md) | Architecture |
| [V3OS工作記錄.md](V3OS工作記錄.md) | Work log |

---

## Isolation

Development **only** in `whatspp_Blackcat_OS/`. Do **not** modify frozen v1 `whatsapp_calculator/`.
