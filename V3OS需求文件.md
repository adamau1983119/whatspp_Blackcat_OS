# 客戶需求規格書（Version 3 — 黑貓輕量 OS）

> 架構總覽見 **[V3OS專案架構.md](./V3OS專案架構.md)**  
> 工作日誌見 **[V3OS工作記錄.md](./V3OS工作記錄.md)**  
> 基礎核心源自 [whatsapp_calculator](../whatsapp_calculator) **Version 1**（`v1.0.0` 凍結）  
> 娛樂插件（泡泡龍）見獨立專案 [whatapp_cat_game](../whatapp_cat_game)

---

## 專案名稱

**WhatsApp 黑貓輕量 OS**（`whatspp_Blackcat_OS`）

英文工作名：Blackcat OS / ChatOps Kernel

---

## 專案定位

| 項目 | 說明 |
|------|------|
| 版本 | **Version 3**（在 v1 微核心上**插入可插拔插件**，組成新 OS） |
| 與 v1 關係 | **繼承** `parse` / `handler` / `session` / `config` 驅動模式；**內建**帳本計算機（`calc`）為第一個核心驅動 |
| 與 v2 關係 | v2 為計算機專案之開源分享；v3 為**新 repo**，可引用 v2 部署教學 |
| 與泡泡龍 | **預設獨立** `game-index.js`；未來可選以娛樂插件合流，非 v3 首發範圍 |
| 本質 | 首發殼為 WhatsApp（螢幕與鍵盤）；Node.js 是**中立內核**；`lib/plugins/*` 是**驅動程式**；未來可插拔其他 Transport Adapter |
| 架構壽命 | **Executor 焊死、Selector 可換** — 內核不認 WhatsApp，只認標準 `ctx` |

---

## 設計哲學

0. **硬編碼零容忍（Phase 0 閘門）**：見 [V3OS專案架構.md §〇](./V3OS專案架構.md)；`python test\audit_hardcode.py` 未 **PASS** 則**絕不容許**進入插件實作。  
1. **微核心 + 動態插件**：核心只負責解析、路由、Session；功能一律插件化。  
2. **Protocol-Neutral（通訊協議中立）**：`handler`／`plugins` **禁止**引用 WhatsApp API；僅 **Transport Adapter**（`index.js`、未來 `adapters/*`）負責 I/O。  
3. **設定驅動**：指令別名、文案、Prompt、收件人映射皆在 `config/`，`lib/` **禁止**硬編碼使用者可見字串。  
4. **原子化**：每檔 ≤ 150 行；一插件一檔。  
5. **Quick Gateway**：除計算機、遊戲外，插件 One-shot → `IDLE`；能 L0 深連結移交 iOS 就移交。  
6. **開源各自部署**：API 費用採 **BYOK**；作者不代付 Token。  
7. **一階一驗**：`test/phase_v3_*_check.py` + `run_node_eval` 真跑 `handler`；禁止 Python 假 mock 狀態機。

---

## 開發環境

| 項目 | 說明 |
|------|------|
| 作業系統 | Windows（開發）；可選 Railway / 本機 NAS |
| 執行環境 | Node.js 18+ |
| 主要套件 | `whatsapp-web.js`（與 v1 同源）、`qrcode-terminal`；插件按需新增 |
| 驗證 | `python test/verify.py`（v1 回歸）+ `python test/verify_v3.py`（v3 插件） |

---

## 目標使用者與場景

### 主場景：Work From WhatsApp（個人 + 工作群）

使用者在 WhatsApp（含 Apple Watch 窄螢幕）完成：

- 帳本計算 → 郵件交辦 → 語意搜尋／搵食 → 筆記／待辦 → 提醒  
- **全程不開 Safari、不複製貼上**

### 訊息過濾（v3 預設）

| 項目 | 決策 |
|------|------|
| 預設 | 與 v1 相同：僅處理 **`fromMe`**（本人從手機／Web 發出的指令） |
| 群組 | 本人於群組發指令可觸發（`chatId` 取自 `msg.to`／`msg.from` 群組 ID） |
| 未知指令 | **不回覆** |
| 插件與計算機 | `SYS_*` 插件**不需**先 `=開始`；計算機 `OPERATION` **仍需** active session |

---

## 插件藍圖（對齊 iOS 十大高頻 App）

> v3 **分階實作**；下表為全期需求，非一次交付。

| # | iOS App | 內部 Type | 指令（zh-TW 範例） | 插件檔 | 實作層級 |
|---|---------|-----------|-------------------|--------|----------|
| 1 | Messages | `SYS_SMS` | `=簡訊 [號碼] [內容]` | `lib/plugins/sms.js` | 雲端 SMS 閘道（如 Twilio）；**非** iMessage |
| 2 | Safari | `SYS_SEARCH` | `=查 [關鍵字]`、`=問 [問題]` | `lib/plugins/search.js` | 瀑布：連結 → CSE → BYOK LLM + 接地 |
| 3 | Photos | `SYS_PHOTOS` | `=識`／收圖片訊息 | `lib/plugins/photos.js` | 圖片下載 + OCR → 可接 `calc` |
| 4 | Maps | `SYS_MAPS` | `=地圖 [地點]`、`=周邊 [關鍵字]` | `lib/plugins/maps.js` | Places API；回文字列表 + 地圖連結 |
| 5 | Mail | `SYS_MAIL` | `=email [內容]`、`=郵件` | `lib/plugins/mail.js` | nodemailer + Gmail App Password |
| 6 | Notes | `SYS_NOTES` | `=筆記 [內容]`、`=看筆記` | `lib/plugins/notes.js` | 雲端 notes 陣列（非 Apple 本機備忘錄） |
| 7 | Clock | `SYS_CLOCK` | `=提醒我 [時間] [事件]` | `lib/plugins/clock.js` | 排程後 WhatsApp 回覆提醒（非原生鬧鐘） |
| 8 | Calculator | `SYS_CALC` | `=開始`、`+`、`-`、`=`結束` 等 | **內建** `lib/calc.js`（v1 凍結邏輯） | 已完成；不搬目錄 |
| 9 | Calendar | `SYS_CALENDAR` | `=行程 [時間] [事件]` | `lib/plugins/calendar.js` | Google Calendar API（BYOK） |
| 10 | Reminders | `SYS_TODO` | `=待辦 [事件]`、`=看待辦` | `lib/plugins/todo.js` | 雲端待辦 + 定時 WhatsApp 提醒 |

### 第二通道（非 v3 首發）：Transport Adapter 訓練輪

| 訓練輪 | 說明 | 內核改動 |
|--------|------|----------|
| iPhone 捷徑 | Action Button／Webhook → 組同一 `ctx` → `handler` | **零** |
| PWA | 獨立殼，脫離 WhatsApp 封號風險 | **零** |
| AR 眼鏡 BLE | 眼追／語音 → `attachment.payload` | **零** |

首發不實作上述 Adapter；Phase 0/1 只焊死 `ctx` 契約與 `plugins.json` 的 `supported_sources`。

---

## 功能需求（分階）

### F0 — 微核心與插件契約（V3 Phase 0）

| ID | 需求 | 驗收 |
|----|------|------|
| F0.0 | **硬編碼稽核（首要）** | `audit_hardcode.py` → **RESULT: [PASS]**；含禁止 plugins 引用 WhatsApp API |
| F0.1 | `lib/ctx-contract.js`：`SOURCE`／`ATTACHMENT_TYPE` 枚舉 | 文件化中立 `ctx` 形狀 |
| F0.2 | `config/plugins.json`：每插件含 `tier`、`enabled`、**`supported_sources`** | Phase 0 預設 `["WHATSAPP"]` |
| F0.3 | `config/menu.json` 4 項 MVP；`items.length` ≤ 7 | `phase_v3_0_check.py` |
| F0.4 | v1 核心複製；`calc.js` 運算邏輯不變 | `python test/verify.py` OVERALL PASS |
| F0.5 | `audit` 擴充：URL 須 `encodeURIComponent`；禁止 `eval(` | 靜態 PASS |

### F0.6 — 中立上下文與 Adapter 分層（V3 Phase 1）

| ID | 需求 | 驗收 |
|----|------|------|
| F0.6.1 | `lib/kernel-sanitizer.js`：`normalizeCtx` → `attachment.payload` 必為 string | 餵髒 JSON → 插件收到純字串 |
| F0.6.2 | `handler.handleMessage(ctx)` 回 `{ reply }`；plugins 不接 `sendMessage` | grep：plugins 無 `msg.`／`client.` |
| F0.6.3 | `session` 以 `principalId` 隔離；`meta.activeSource` 骨架 | 欄位存在於 `session.js` |
| F0.6.4 | Payload 長度上限（如 8KB）與控制字元剝離 | `parse.js` 或 sanitizer 內 |
| F0.6.5 | `GLASS_AUDIO` Token Guard 預留：`[CMD] L` 前綴（註解 + stub 測試） | 不影響 WhatsApp `GAME_PLAYING` 盲傳 |
| F0.6.6 | V3 狀態機：`osState`、`PROMPT_GUARD`、路由優先序 | 見 [docs/PHASES_v3.md](./docs/PHASES_v3.md) Phase 1 |

### F0.7 — WhatsApp Transport Adapter（V3 Phase 3）

| ID | 需求 | 驗收 |
|----|------|------|
| F0.7.1 | `index.js`：`buildCtxFromWhatsApp(msg)`；`getQuotedMessage` **僅在此** | 引用 → `attachment.payload` |
| F0.7.2 | `notes.js` 讀 `ctx.attachment.payload`（非扁平 `quotedBody`） | `=記` + 引用 → notes+1 → IDLE |
| F0.7.3 | Adapter 呼叫 `handleMessage` 後以 `result.reply` 執行 `sendMessage` | 插件零修改即可通過捷徑路徑（未來） |

### F1 — 翻譯插件（優先）

| ID | 需求 | 驗收 |
|----|------|------|
| F1.1 | `=翻 [語言代碼]` + **回覆（Reply）** 目標訊息 | 譯文回覆同一對話 |
| F1.2 | 套件 `@vitalets/google-translate-api` 或同級 | 無 Key 時回覆設定教學 |

### F2 — 郵件插件

| ID | 需求 | 驗收 |
|----|------|------|
| F2.1 | `=email 寄給[暱稱]：[內文]` | `config/email-routes.json` 映射收件人 |
| F2.2 | 環境變數 `GMAIL_USER`、`GMAIL_APP_PASSWORD` | 成功／失敗 Emoji 回覆 |

### F3 — 語意搜尋插件（Safari 殺手級）

| ID | 需求 | 驗收 |
|----|------|------|
| F3.1 | `=查` 回傳**精煉列表**（店名、特色、地址），非僅連結 | Mock → CSE → BYOK LLM |
| F3.2 | 無 `AI_API_KEY` 時自動降級（連結或 Snippet） | 作者 Token 帳單為 0 |
| F3.3 | Prompt 放 `config/search-prompts.json` | 支援繁中／粵語口語 |
| F3.4 | 可選：回覆數字展開詳情（多輪 session） | `session.searchLastResults` |

### F4～F10 — 其餘插件

先以 **Mock 回覆** 驗證路由與排版（Apple Watch 友好：短行、Emoji 列表）；再逐個接 API。

---

## 搜尋／AI 成本策略（強制）

| 層級 | 條件 | 行為 |
|------|------|------|
| L0 | 無任何 Key | 回傳搜尋連結 + 啟用教學 |
| L1 | `GOOGLE_CSE_KEY` | CSE Snippet + 規則排版 |
| L2 | `AI_API_KEY`（Gemini／OpenAI BYOK） | LLM 摘要；**須**優先接地（Places／CSE）再生成 |
| L3 | 本機 Ollama（可選） | 文件記載；非 Railway 預設 |

**禁止**由專案作者代付全體使用者 Token。

---

## 非功能需求

| 項目 | 要求 |
|------|------|
| 效能 | 單則插件指令回覆 &lt; 5 秒（本機／Railway）；`plugin-dispatch` 8 秒超時斷路器 |
| 安全 | `.wwebjs_auth`、API Key 不進 git；禁止 `eval`／動態 `require(payload)` |
| IPC 防線 | 外來源 `attachment.payload` 經 Sanitizer；長度上限；插件不執行傳入字串 |
| 多軌互斥 | CALC 多輪中，外來源 One-shot → `sourceBusy` 優雅拒絕（Phase 7+ 驗收） |
| 幻覺 | 搜尋／地圖回覆附「請以現場／店家為準」；優先結構化資料 |
| 維護 | 新插件 = 新檔 + `commands.json` + `plugins.json`（含 `supported_sources`）+ phase check |
| 相容 | 同一 principal 同時只跑一個 bot process |
| 文件 | 規格文件**禁止整份覆寫**；僅 StrReplace 追加 |
| 擴充 | 新增 Transport Adapter **不得**修改 `handler`／既有 `plugins` |

---

## 明確不做（v3 首發）

- 取代 iOS 原生 UI（內嵌 Safari 網頁）
- 作者代付 LLM Token
- **修改** [whatsapp_calculator](../whatsapp_calculator) 內任何 `lib/*.js`、`index.js`（v1/v2 核心凍結）
- **在 v1 repo 內**開發 v3 功能、merge v3 回 `version-1` 或改動 `v1.0.0` tag
- npm／路徑 **連結** v1 原始碼（必須在 v3 repo **複製** 後獨立演進）
- 單次 Prompt 一次實作 10 插件真 API（必須分階）
- 泡泡龍物理引擎合併進 v3 首發（可列 Phase 10+ 選項）

---

## 驗收標準（Version 3）

1. `python test/verify_v3.py` 全 Phase PASS  
2. `python test/verify.py`（v1 計算機回歸）仍 PASS  
3. 示範工作流（可 Mock）：`=開始` → `+500` → `=email …` → `=查 灣仔中菜` → `=結束`  
4. 未設定 AI Key 時，搜尋仍可降級運作  

---

## 相關文件（V3OS 三件套）

| 文件 | 連結 |
|------|------|
| 專案架構 | [V3OS專案架構.md](./V3OS專案架構.md) |
| 工作記錄 | [V3OS工作記錄.md](./V3OS工作記錄.md) |
| v1 計算機需求 | [../whatsapp_calculator/REQUIREMENTS.md](../whatsapp_calculator/REQUIREMENTS.md) |
| v1 凍結說明 | [../whatsapp_calculator/VERSION.md](../whatsapp_calculator/VERSION.md) |
| 泡泡龍（獨立） | [../whatapp_cat_game/REQUIREMENTS.md](../whatapp_cat_game/REQUIREMENTS.md) |

---

*V3OS需求文件 — Version 3 — 2026-06-06（Protocol-Neutral ctx 合約追加）*
