# 客戶需求規格書（Version 3.1 — 黑貓輕量 OS · 群組聯動特區）

> 架構總覽見 **[V31OS專案架構.md](./V31OS專案架構.md)**  
> 分階 Checklist 見 **[docs/PHASES_v31.md](./docs/PHASES_v31.md)**  
> 工作日誌見 **[V31OS工作記錄.md](./V31OS工作記錄.md)**  
> **V3.0 基線**（Phase 0～9 已驗收）見 [V3OS需求文件.md](./V3OS需求文件.md)  
> 微核心源自 [whatsapp_calculator](../whatsapp_calculator) **Version 1**（`v1.0.0` 凍結）

---

## 專案名稱

**WhatsApp 黑貓輕量 OS**（`whatspp_Blackcat_OS`）

英文工作名：Blackcat OS / ChatOps Kernel

**版本線：** V3.0（個人／本人發令 OS）→ **V3.1（小型授權工作群 + 北極星聯動鏈）**

---

## V3.1 定位（相對 V3.0）

| 項目 | V3.0（已交付） | V3.1（本規格） |
|------|----------------|----------------|
| 觸發對象 | 僅 **`fromMe`**（連 bot 帳號本人） | 本人 **或** `ALLOWED_GROUPS` 白名單群內組員 |
| 主場景 | Work From WhatsApp（個人） | **北極星聚餐場景**：群內查美食 → 地圖 → 行事曆 |
| Session 上下文 | 無跨指令記憶 | **`lastContext` 按群（`principalId`）共用** |
| 多媒體 | 群圖可能觸發 OCR | **`=識` 主動觸發**；OCR **斷路器**防 process 崩潰 |
| 群組規模 | 未限制 | **產品授權 ≤6 人**（軟檢查）；技術可擴，V1 不推大群 |
| AI 入口 | 僅 `=查`／`=問` Fast-track | Tools Hub **第 8 項 AI** + `[Link Mode]`／`[AI Mode]` |
| LLM 抽象 | `search-llm.js` 直連 | **`lib/llm-provider.js`** 可換供應商 |

V3.0 程式與測試**不得刪改歷史**；V3.1 以 **Phase 10～14** 增量交付（見 `docs/PHASES_v31.md`）。

---

## 北極星場景（產品靈魂）

**情境：** ≤6 人聚餐 WhatsApp 群，大家輪流用黑貓完成決策，全程不離對話。

```
組員 A：=查 銅鑼灣 日式
黑貓  ：（列表／摘要，寫入 lastContext.placeQuery）
組員 B：=地圖          （盲操，讀 lastContext）
黑貓  ：Apple／Google Maps 連結
組員 C：=行程 週五 7pm 聚餐 @利園
黑貓  ：行事曆 Template 連結（L0 移交 iOS）
```

**心智模型：** 群組當前只有一個「討論焦點」；`lastContext` **按群共用**，B 覆蓋 A 的焦點屬可接受產品行為。

---

## 群組生存合約（Group Survival Contract）

V3.1 **必須**在產品、架構、驗收三層同時滿足下列合約；未滿足不得宣稱 V3.1 完成。

| # | 條款 | 說明 |
|---|------|------|
| G1 | **白名單群** | 環境變數 `ALLOWED_GROUPS`（逗號分隔 `@g.us` ID）；**未設定**時行為與 V3.0 相同（僅 `fromMe`） |
| G2 | **指令閘門** | 群內他人訊息**僅處理** `=` 開頭指令（經 `parse.js` 辨識）；閒聊、純 share **忽略** |
| G3 | **禁自動 OCR** | **禁止**對每張群圖自動 `downloadMedia`／OCR；僅 `=識`、Caption 含 `=識`、或 Tools Hub 相片流程 |
| G4 | **規模建議** | 對外宣告：技術可辨識發送者，**V1 產品線僅推薦並授權 ≤6 人**小型協作群；可選 `MAX_GROUP_SIZE` 軟拒絕 |
| G5 | **上下文歸屬** | `session.lastContext`（或 `appData.lastContext`）key = **`principalId`（群 ID）**，不按 `senderId` 分片 |
| G6 | **審計預留** | `ctx.senderId` 由 Adapter 填入，供日誌／未來個人權限；P0 插件可不消費 |
| G7 | **成本** | AI 採 **BYOK**；合約 G1～G3 下，小型群月費可忽略級 |
| G8 | **無 Redis** | 白名單 + 小群 + in-memory `Map` 足夠；V3.1 不引入 Redis |

**對外一句話：**  
「V3.1 僅在 `ALLOWED_GROUPS` 授權、建議 ≤6 人的群組運行，且只處理 `=` 指令、不自動掃描所有 share。」

---

## 設計哲學（繼承 V3 + V3.1 追加）

0. **硬編碼零容忍**：每 Phase 必跑 `python test/audit_hardcode.py` → **PASS**  
1. **微核心 + 動態插件**：業務在 `lib/plugins/*`  
2. **Protocol-Neutral**：插件禁止引用 WhatsApp API  
3. **設定驅動**：文案、指令在 `config/`  
4. **原子化**：手寫原始碼單檔 ≤ 150 行  
5. **防禦性優先**：OCR／LLM／群訊息量均視為 **DoS 向量**  
6. **一階一驗**：`test/phase_v31_N_check.py` + `verify_v3.py` 累加  

---

## 訊息過濾（V3.1 定案）

| 項目 | 決策 |
|------|------|
| 事件 | 沿用 **`message_create`**（不另開 `message` 雙訂閱） |
| 本人 | `msg.fromMe === true` → **一律處理**（與 V3.0 相同） |
| 他人 | 僅當 `msg.isGroup` 且 `msg.from` ∈ `ALLOWED_GROUPS` → 處理 |
| 群 ID（`principalId`） | 本人發群：`msg.to`；他人發群：`msg.from` |
| 發送者（`senderId`） | 群：`msg.author` 或 `msg.id.participant`；私聊：同 `principalId` |
| 未知指令 | **不回覆** |
| 非 `=` 群訊息 | **不回覆、不下載媒體** |

---

## 中立 `ctx`（V3.1 擴充）

在 V3 `principalId` 契約上**追加**（不破壞既有欄位）：

```javascript
const ctx = {
  source: 'WHATSAPP',
  principalId: '85291599957-1633481333@g.us',  // session 隔離鍵
  senderId: '85291234567@c.us',                 // V3.1 新增；審計用
  text: '=查 銅鑼灣 日式',
  attachment: { hasAttachment: false, type: 'TEXT', payload: '' },
};
```

`kernel-sanitizer.js` 須保留 `senderId`（可選字串，缺省 `''`）。

---

## 功能需求（V3.1 分階）

### F10 — 多媒體斷路器與指令閘門（Phase 10）

| ID | 需求 | 驗收 |
|----|------|------|
| F10.1 | `ocr-run.js`／`extractTotalFromCtx`：`try/catch` + 失敗回使用者文案，**不得** `process.exit` | 餵損壞 JPEG mock → handler 仍存活 |
| F10.2 | `whatsapp-adapter.js`：僅當 `text` 含 `=識` 或明確 photos 流程才 `downloadMedia` | 純群圖訊息 → `attachment.hasAttachment === false` |
| F10.3 | `handler-tools.js`：`routeImageReceipt` 須要求 `=識` 或 `SYS_PHOTOS` 指令 | 無指令群圖不進 OCR |
| F10.4 | `messages.json`：`photosOcrFailed` 等錯誤文案 | audit PASS |

### F11 — 北極星上下文鏈（Phase 11）

| ID | 需求 | 驗收 |
|----|------|------|
| F11.1 | `session.appData.lastContext`：`{ kind, query, updatedAt, triggeredBy? }` | 按 `principalId` 讀寫 |
| F11.2 | `search.js`：成功搜尋後寫入 `lastContext`（place／food 類 query） | `=查` 後 session 有 context |
| F11.3 | `maps.js`：無 payload 且 `=地圖` 時讀 `lastContext.query` | 盲操 `=地圖` 出連結 |
| F11.4 | `calendar.js`（可選本 Phase）：簡易「週五 7pm」解析 → L0 連結 | 文檔化限制；不冒充已寫入 Google Calendar |
| F11.5 | E2E：`phase11_northstar.test.js` 模擬 `=查` → `=地圖` 鏈 | Node 測試 PASS |

### F12 — Tools Hub AI 入口（Phase 12）

| ID | 需求 | 驗收 |
|----|------|------|
| F12.1 | `tools-menu.json` 第 **8** 項：`SYS_SEARCH` 或 `SYS_SEARCH_ASK` | `=開始`→`2`→`8` 可進 AI |
| F12.2 | 搜尋回覆標記 `[Link Mode]`／`[AI Mode]`（`messages.json` key） | 使用者可辨識模式 |
| F12.3 | 無 `AI_API_KEY` 時降級 L0 連結 + 教學 | 與 V3.0 一致 |

### F13 — 群組生存合約落地（Phase 13）

| ID | 需求 | 驗收 |
|----|------|------|
| F13.1 | `lib/group-gate.js`：解析 `ALLOWED_GROUPS`、`MAX_GROUP_SIZE`（預設 6） | 單元測試 |
| F13.2 | `index.js`：`fromMe \|\| isAllowedGroup`；否則 return | transport 測試更新 |
| F13.3 | `whatsapp-adapter.js`：`principalId` 雙向解析 + `senderId` | 群內他人 mock ctx 正確 |
| F13.4 | 群內他人非 `=` 訊息：不回覆 | mock `fromMe:false` + 閒聊 → 無 reply |
| F13.5 | 超過 `MAX_GROUP_SIZE`：回 `groupSizeExceeded` 並拒絕非 fromMe 指令 | 可 mock participants |
| F13.6 | **破壞性變更**：Phase 8/9「他人一律不回」改為「白名單群可回」 | `phase_v31_13_check.py` 明確覆蓋 |

### F14 — LLM 供應商抽象（Phase 14）

| ID | 需求 | 驗收 |
|----|------|------|
| F14.1 | `lib/llm-provider.js`：`complete(prompt, opts)` 介面 | `search-llm.js` 改為呼叫 provider |
| F14.2 | 預設實作：OpenAI（沿用 `AI_API_KEY`） | 無 Key 行為不變 |
| F14.3 | 文件化擴充點（Gemini、Ollama） | 架構 § 註記即可 |

---

## V3.0 已交付能力（V3.1 不 regression）

下列在 V3.0 Phase 0～9 已驗收，V3.1 每階須跑 `python test/verify_v3.py` + `python test/verify.py`：

- 帳本計算機、Tools Hub 1～7、翻譯、搜尋 Fast-track、郵件（HTTP `/mail` 中轉 + 本機／手機裝置選擇）、備忘、待辦、提醒、行事曆 L0、收據 OCR（**在 F10 後改為指令觸發**）、泡泡龍、`send-queue`、`bot-reply-guard`

---

## 搜尋／AI 成本策略（不變）

| 層級 | 條件 | 行為 |
|------|------|------|
| L0 | 無 Key | Google 搜尋連結 + 教學 |
| L1 | `GOOGLE_CSE_KEY` | CSE Snippet |
| L2 | `AI_API_KEY` BYOK | LLM 摘要；須接地優先 |
| L3 | Ollama（可選） | 文件記載 |

**禁止**作者代付 Token。

---

## 非功能需求（V3.1 追加）

| 項目 | 要求 |
|------|------|
| 穩定性 | 損壞圖片／OCR 例外**不得**終止 Node process |
| 群訊息 | 非白名單群：與 V3.0 相同，零額外 CPU |
| 記憶體 | `lastContext` 每群一字串級；無 Redis |
| 相容 | 未設 `ALLOWED_GROUPS` 時，**行為與 V3.0 位元級一致**（regression） |
| 文件 | V3OS 三件套**保留**；V3.1 以 V31OS 三件套 + `PHASES_v31.md` 為準 |

---

## 明確不做（V3.1）

- 300 人大群正式支援與 SLA  
- 對所有 share／連結自動爬取或 OCR  
- 按人分片的 `lastContext`（與北極星場景衝突）  
- 修改 `whatsapp_calculator` v1 核心  
- Redis／外部 session store（V3.1 範圍）  
- 取代 iOS 原生 App UI  

---

## 驗收標準（Version 3.1）

1. `python test/verify_v3.py` 全 Phase（含 v31_10～14）**PASS**  
2. `python test/verify.py` v1 計算機回歸 **PASS**  
3. `python test/audit_hardcode.py` **PASS**  
4. **北極星 E2E**（可 mock）：`=查` → `=地圖` 盲操成功  
5. **群組合約**：白名單群內 `=查` 可回；非白名單他人訊息不回；純群圖不 OCR  
6. 實機（手動）：≤6 人測試群 + `ALLOWED_GROUPS` 煙測  

---

## 相關文件

| 文件 | 連結 |
|------|------|
| V3.1 架構 | [V31OS專案架構.md](./V31OS專案架構.md) |
| V3.1 Phase | [docs/PHASES_v31.md](./docs/PHASES_v31.md) |
| V3.1 工作記錄 | [V31OS工作記錄.md](./V31OS工作記錄.md) |
| V3.0 基線需求 | [V3OS需求文件.md](./V3OS需求文件.md) |
| V3.0 基線架構 | [V3OS專案架構.md](./V3OS專案架構.md) |

---

*V31OS需求文件 — Version 3.1 — 2026-06-09（群組生存合約定案）*
