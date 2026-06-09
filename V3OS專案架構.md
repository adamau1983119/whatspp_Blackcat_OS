# 專案整體架構表（Version 3 — 黑貓輕量 OS）

> 客戶需求見 **[V3OS需求文件.md](./V3OS需求文件.md)**  
> 工作日誌見 **[V3OS工作記錄.md](./V3OS工作記錄.md)**  
> 微核心源自 [whatsapp_calculator](../whatsapp_calculator) Version 1（`v1.0.0`）

---

## 〇、首要解決項：硬編碼禁令（Phase 0 閘門，絕不容許）

> **任何插件、任何 Phase 開工前，必先通過硬編碼稽核。**  
> 未通過 → **不得**宣稱 Phase 完成、**不得**進入下一 Phase、**不得**合併程式。  
> 規範來源：[whatsapp_calculator/README.md](../whatsapp_calculator/README.md)、[專案整體架構表.md §8.2](../whatsapp_calculator/專案整體架構表.md)

### 禁令（人類與 AI 均須遵守）

1. **禁止**在 `lib/`、`lib/plugins/` 以引號字串硬編碼 `config/` 內已定義的**指令別名**或**使用者可見回覆文案**  
2. **禁止**在插件 Mock 階段把示範回覆寫死在 `.js`；Mock 文案須在 `config/messages.json`（或 `config/fixtures/`）  
3. **禁止**在 `lib/` 硬編碼應由設定檔驅動的內容：`email-routes`、`search-prompts`、插件別名等  
4. **禁止**因趕進度跳過 `audit_hardcode.py`；**禁止**僅口頭宣稱「沒硬編碼」  
5. WhatsApp **回覆給使用者**的文字 → 一律 `t(locale, key)` 或同級設定驅動 API；`lib/` 只組裝邏輯與變數  

### 允許例外（不視為違規）

| 類型 | 範例 | 說明 |
|------|------|------|
| 終端機／開發 log | `[game]`、`機器人已就緒` | 非 WhatsApp 使用者可見回覆 |
| 程式常數 | `'UNKNOWN'`、`@g.us` | 內部型別／協議，非文案 |
| 註解 | 中文說明 | 不進入引號稽核 |

### 設定檔職責（V3 擴充版）

| 檔案 | 不得寫入 `lib/` 的內容 |
|------|------------------------|
| `config/commands.json` | 所有指令別名（`=查`、`=email`、`=開始`…） |
| `config/messages.json` | 所有語系回覆、錯誤、Mock 成功訊息 |
| `config/email-routes.json` | 收件人暱稱映射 |
| `config/search-prompts.json` | LLM Prompt 模板 |

### 稽核機制（Phase 0 必備）

自 [whatsapp_calculator/test/audit_hardcode.py](../whatsapp_calculator/test/audit_hardcode.py) 移植並加強：

| 項目 | 要求 |
|------|------|
| 掃描範圍 | `lib/*.js` + **`lib/plugins/*.js`** |
| 白名單來源 | `commands.json`、`messages.json`；Phase 0 後加入 routes／prompts |
| 通過標準 | 終端機 `RESULT: [PASS]` |
| 整合 | 納入 `test/verify_v3.py`；**與 v1 回歸 `verify.py` 並列必跑** |

```powershell
python test\audit_hardcode.py   # 必須 PASS
python test\verify_v3.py          # Phase 0 起
python test\verify.py             # v1 計算機回歸（若已移植核心）
```

### 正確模式（強制）

```mermaid
flowchart LR
    cmd[config/commands.json] --> parse[parse.js]
    msg[config/messages.json] --> t[messages.js t]
    plugin[lib/plugins/xxx.js] --> logic[純邏輯]
    logic --> fmt[format-plugins.js]
    t --> fmt
    fmt --> out[WhatsApp 回覆]
```

### 已知反面教材（開工前須避免重犯）

| 專案 | 問題 |
|------|------|
| [whatapp_cat_game](../whatapp_cat_game) `game-format.js` | `Score:`、`準備：`、`瞄準盤：` 等寫死在 lib，未全數進 `game-messages.json` |
| 未建 audit | 泡泡龍專案尚無 `audit_hardcode.py`，易在 V3 十插件時大規模復發 |

**V3 策略：** Phase 0 **只做**稽核骨架 + config 契約 + 移植 v1 核心；**確認 audit PASS 後**才允許新增第一個插件檔案。

---

## 專案名稱

**WhatsApp 黑貓輕量 OS** — 微核心 + 可插拔插件（ChatOps Kernel）

---

## 一、版本演進與隔離保證

```mermaid
flowchart LR
    v1[v1.0.0 帳本計算機 凍結]
    v2[v2 開源分享 文件層]
    v3[v3 黑貓 OS 本 repo]
    game[whatapp_cat_game 娛樂 獨立]

    v1 -->|一次性複製| v3
    v2 -.->|僅引用文件| v3
    game -.->|可選未來插件| v3
```

| 版本 | Repo 路徑 | Git | v3 與其關係 |
|------|-----------|-----|-------------|
| **v1** | `whatsapp_calculator/` | `v1.0.0` tag、`version-1` 分支 | **只讀複製源**；Phase 0 **禁止**回寫 |
| **v2** | 同上（`v2.0.0` tag、`main`） | 文件／腳本層 | **只讀引用** `SHARING.md` 等；**禁止**改 v2 核心 |
| **v3** | `whatspp_Blackcat_OS/` | **獨立** repo（與 v1 分開） | **唯一**可改程式之目錄 |

### 隔離鐵律（Phase 0 起強制）

| # | 規則 | 原因 |
|---|------|------|
| 1 | **所有 v3 程式只寫在** `whatspp_Blackcat_OS/` | 與 v1/v2 實體分目錄 |
| 2 | **禁止**修改 `whatsapp_calculator/lib/`、`index.js` | v1 核心凍結；v2 亦同 |
| 3 | **禁止** symlink、`npm link`、`file:../whatsapp_calculator` 共用執行檔 | 避免 v3 改動連動 v1 |
| 4 | Phase 0 採 **一次性複製**（copy）v1 檔案進 v3；之後兩邊**各自演進** | 複製 ≠ 連結 |
| 5 | v3 回歸用 **v3 目錄內** 的 `test/verify.py`（自 v1 複製的一份） | 在 v3 cwd 跑，**不**在 v1 目錄跑 v3 測試 |
| 6 | 可選：每次 Phase 結束在 **v1 目錄** 跑 `python test/verify.py` 確認 v1 **未被意外改動** | 雙向保險 |

**還原對照：**

```powershell
# 確認 v1 仍為凍結基準（應在 whatsapp_calculator 目錄執行）
cd "D:\Users\Ophelia Chan\Desktop\MY Project\whatsapp_calculator"
git checkout v1.0.0
python test\verify.py

# v3 開發（應在 whatspp_Blackcat_OS 目錄執行）
cd "D:\Users\Ophelia Chan\Desktop\MY Project\whatspp_Blackcat_OS"
python test\phase_v3_0_check.py
```

| 版本 | 產出 | 本 repo |
|------|------|---------|
| v1 | `calc` / `parse` / `handler` / `session` | 凍結；僅供 v3 **複製** |
| v2 | 分享文件、`setup-windows.ps1` | 可引用，**不重複實作、不修改** |
| v3 | `lib/plugins/*`、`plugin-dispatch` | **本專案主體** |

---

## 二、微核心概述

| 項目 | 說明 |
|------|------|
| 目的 | 以**插件**完成計算、搜尋、郵件、筆記等工作流；首發殼為 WhatsApp，架構**不綁定** WhatsApp |
| I/O（首發） | WhatsApp Web（`whatsapp-web.js`）— 僅為 **Transport Adapter** 之一 |
| 核心職責 | 解析指令、隔離 Session、路由插件、回傳**純文字** `{ reply }` |
| 原則 | **設定驅動**；**Executor 焊死、Selector 可換**；內核與傳輸協議 **解耦** |
| 程式結構 | 原子化；核心 + 每插件單檔 ≤ 150 行 |

**鋼鐵公理：** 不論原料來自 WhatsApp 引用、iPhone 捷徑或未來 AR 眼鏡 BLE，[`handler.js`](./lib/handler.js) 只認標準化後的 **`ctx`**；插件只讀 `ctx.attachment.payload`（string），**不知道**什麼叫 WhatsApp。

---

## 三、系統資料流（Transport Adapter + 中立內核）

```mermaid
flowchart TD
    subgraph adapters [Transport_Adapters_可插拔]
        wa[index.js_WHATSAPP]
        sc[future_shortcuts_server]
        gl[future_glass_ble]
    end
    subgraph kernel [Protocol_Neutral_Kernel]
        build[buildCtx]
        san[kernel_sanitizer.js]
        hnd[handler.js]
        parse[parse.js]
        ses[session.js]
        dsp[plugin-dispatch.js]
        plg[lib/plugins]
    end
    wa --> build
    sc --> build
    gl --> build
    build --> san --> hnd
    hnd --> parse --> ses
    hnd --> dsp --> plg
    hnd -->|"{ reply }"| wa
    hnd -->|"{ reply }"| sc
    hnd -->|"{ reply }"| gl
    wa --> send[sendMessage_僅Adapter]
```

| 層級 | 職責 | 禁止事項 |
|------|------|----------|
| **Adapter**（`index.js`、未來 `adapters/*`） | `fromMe` 過濾、`getQuotedMessage`、組裝 `ctx`、呼叫 `handleMessage`、**唯一**負責 `sendMessage` | 不得在 adapter 內寫業務路由 |
| **Sanitizer**（`kernel-sanitizer.js`） | 多模態原料 → `attachment.payload` **純字串**；長度／控制字元防線 | 插件不得自行解析 JSON 原料 |
| **Kernel**（`handler`／`session`／`plugins`） | 狀態機、路由、插件執行；回 `{ reply: string \| null }` | **禁止** `msg.`、`client.`、`eval`、動態 `require` |

---

## 四、目錄結構（V3.0 里程碑 + V3.1 規格）

```
whatspp_Blackcat_OS/
├── README.md
├── V3OS需求文件.md           # V3.0 基線需求（凍結）
├── V3OS專案架構.md          # 本文件
├── V3OS工作記錄.md
├── V31OS需求文件.md          # V3.1 群組聯動特區
├── V31OS專案架構.md
├── V31OS工作記錄.md
├── index.js                  # WhatsApp Transport（Phase 8：deliverReply + send-queue）
├── package.json
├── config/
│   ├── commands.json         # 指令別名（含 HELP、插件 prefix）
│   ├── messages.json         # 多語回覆
│   ├── menu.json             # 主選單 4 項（計算機／Tools Hub／翻譯／遊戲大廳）
│   ├── tools-menu.json       # Tools Hub 子選單 7 項
│   ├── game-menu.json        # 遊戲大廳子選單（泡泡龍）
│   ├── plugins.json          # supported_sources 契約
│   ├── email-routes.json
│   ├── clock-urls.json
│   ├── search-prompts.json
│   ├── bookmarks.json        # 地圖書籤骨架
│   └── bubble/               # 泡泡龍 game.json／game-commands／game-messages
├── lib/
│   ├── ctx-contract.js
│   ├── kernel-sanitizer.js
│   ├── whatsapp-adapter.js   # buildCtxFromWhatsApp；getQuotedMessage／downloadMedia 僅在此
│   ├── send-queue.js         # 每 principalId 序列化 sendMessage；consumeEcho 回音防護
│   ├── bot-reply-guard.js    # 過濾 bot 自身回覆觸發迴圈（menuBlocked 修復）
│   ├── handler.js            # 交通警察；回 { reply }
│   ├── handler-route.js      # OS 全域、選單、GAME_HUB／GAME_PLAYING
│   ├── handler-tools.js      # Tools Hub、Fast-track、圖片 OCR 路由
│   ├── handler-calc.js
│   ├── plugin-dispatch.js    # 8 秒超時；sync／async execute
│   ├── help-list.js          # =說明／選單 0
│   ├── session.js / parse.js / calc.js（v1 凍結邏輯）
│   ├── client.js / login.js / health.js / preflight.js
│   ├── search-*.js / translate-resolve.js / mail*.js / calendar-*.js / ocr-*.js
│   ├── games/
│   │   ├── bubble-bridge.js  # OS ↔ 泡泡龍核心
│   │   └── bubble/           # 自 whatapp_cat_game 合流
│   └── plugins/
│       ├── maps.js / translate.js / search.js / notes.js
│       ├── mail.js / todo.js / clock.js / calendar.js / photos.js
│       ├── game_hub.js / bubble_shooter.js
│       └── …
├── docs/
│   ├── PHASES_v3.md          # V3.0 Phase 0～9（里程碑 [√]）
│   ├── PHASES_v31.md         # V3.1 Phase 10～14（待實作）
│   └── AI第三方專家簡報.md
└── test/
    ├── audit_hardcode.py
    ├── verify.py             # v1 計算機回歸
    ├── verify_v3.py          # Phase 0～9 累加
    ├── phase_v3_0_check.py … phase_v3_9_check.py
    ├── phase9_mock_e2e.test.js   # Transport mock；核心邏輯為真
    └── verification_status.json
```

> **未建目錄（規格伏筆）：** `adapters/shortcuts-server.js`、`adapters/glass-ble.js` — 首發僅 `index.js` 作 WhatsApp Adapter。

---

## 五、核心模組職責

| 模組 | 職責 | 行數上限 |
|------|------|----------|
| `index.js` | **WhatsApp Adapter**：`message_create`、fromMe 過濾、`buildCtxFromWhatsApp`、`deliverReply` → `enqueueSend` → `sendMessage` | ≤150 |
| `whatsapp-adapter.js` | `msg` → 中立 `ctx`；**唯一** await `getQuotedMessage`／`downloadMedia` | ≤150 |
| `send-queue.js` | 每 `principalId` 序列化 outbound，防併發亂序 | ≤150 |
| `ctx-contract.js` | `SOURCE`／`ATTACHMENT_TYPE` 常量；`ctx` 形狀文件化 | ≤30 |
| `kernel-sanitizer.js` | `normalizeCtx(ctx)` → `attachment.payload` 必為 string | ≤40 |
| `handler.js` | sanitizer + 路由優先序；回 `{ reply }`；**不接** WhatsApp API | ≤150 |
| `handler-route.js` | `PROMPT_GUARD`、OS 全域、主選單、`GAME_HUB`／`GAME_PLAYING` 盲傳 | ≤150 |
| `handler-tools.js` | Tools Hub 子選單、Fast-track 插件、收據圖 OCR 入口 | ≤150 |
| `plugin-dispatch.js` | 依 `cmd.type` 載入 `plugins/*.execute`；8 秒超時斷路器 | ≤150 |
| `parse.js` | exact / prefix / OPERATION；Payload 長度防線 | ≤150 |
| `session.js` | `principalId` 隔離；`osState`／`appData`；`currentGame`；`meta.activeSource` | ≤150 |
| `calc.js` | 帳本計算（**v1 運算邏輯不變**） | 凍結 |
| `games/bubble-bridge.js` | 泡泡龍核心橋接（合流自 `whatapp_cat_game`） | ≤150 |
| `lib/plugins/*.js` | 單一插件；只讀 `ctx.attachment.payload`（string） | ≤150 |

### Handler 路由優先序（Phase 7 定案）

```
PROMPT_GUARD
  → GAME_PLAYING（僅 =開始 可退出；其餘盲傳遊戲，不進 parse 主路徑）
  → Fast-track 插件（=地圖、=翻…）
  → 圖片 OCR（收據）
  → Tools Hub 子選單
  → GAME_HUB 選遊戲
  → APP_ACTIVE（如地圖 2-Click）
  → IDLE 插件
  → OS 全域（=開始／=結束）
  → MENU 數字
  → CALC 多輪
```

### 主選單（Phase 6 後）

| 數字 | 類型 | 說明 |
|------|------|------|
| `1` | `SYS_CALC` | 帳本計算機 |
| `2` | `TOOLS_HUB` | 工具箱子選單（地圖／郵件／備忘／待辦／OCR／提醒／行事曆） |
| `3` | `SYS_TRANSLATE` | 即時翻譯 |
| `4` | `GAME_HUB` | 遊戲大廳 → `1` 泡泡龍 → `GAME_PLAYING` |
| `0` | HELP | 指令表（同 `=說明`） |

---

## 六、中立 `ctx` 鋼鐵合約（Phase 1 定案）

```javascript
// lib/ctx-contract.js — handler / plugins 唯一輸入契約
const ctx = {
  source: 'WHATSAPP',           // WHATSAPP | SHORTCUTS | GLASS_BLE | PWA_APP | GLASS_AUDIO
  principalId: 'user_123_hk',   // session 隔離鍵；WhatsApp 期 principalId = chatId
  text: '=地圖 銅鑼灣',
  attachment: {
    hasAttachment: true,
    type: 'TEXT',               // TEXT | IMAGE | AUDIO
    payload: '純文字原料'        // Sanitizer 洗淨後；插件只吃 string
  }
};
```

**內核回傳：**

```javascript
// handler.handleMessage(ctx) → Adapter 負責發送
{ reply: string | null }
```

**插件契約：**

```javascript
function execute(cmd, session, ctx) {
  // 讀 ctx.text、ctx.attachment.payload（string only）
  return '回覆字串' | null;
}
```

**稽核鐵律：** `lib/handler.js`、`lib/plugins/` 不得出現 `msg.`、`client.`、`sendMessage`、`getQuotedMessage`、`eval(`。

---

## 七、Session 結構（擴充）

`SYS_*` 指令**不得**要求 `session.active === true`（計算機專用）。

```javascript
{
  principalId: string,
  locale: string,
  osState: 'IDLE' | 'MENU' | 'APP_ACTIVE' | 'TOOLS_HUB' | 'GAME_HUB' | 'GAME_PLAYING' | 'PROMPT_GUARD',
  currentApp: string | null,
  currentGame: string | null,   // 例：'BUBBLE'
  guard: object | null,
  appData: { calc: { entries, total }, notes: [], todos: [], … },
  meta: {
    activeSource: 'WHATSAPP',   // 多軌互斥鎖（Phase 1 骨架）
    lockReason: null            // 'CALC' | 'GAME_PLAYING' | null
  }
}
```

**多軌策略（規格伏筆）：** CALC 多輪中，外來源（`SHORTCUTS`／`GLASS_BLE`）One-shot → 回 `messages.sourceBusy` 優雅拒絕；首發僅 `WHATSAPP` 進線，mutex  dormant。

---

## 八、指令對照（zh-TW 摘要）

見 [V3OS需求文件.md](./V3OS需求文件.md) 插件藍圖表。

---

## 九、三層驅動模型

| 層級 | 名稱 | 技術 |
|------|------|------|
| **L1** | 雲端 API | HTTPS + BYOK |
| **L2** | 黑貓資料層 | session + 檔案／DB |
| **L3** | 本機橋接 | Shortcuts／PWA／眼鏡 → **新 Adapter** 組同一 `ctx` |

### 訓練輪（規格伏筆，首發不實作）

| 訓練輪 | 新增檔案 | 內核改動 |
|--------|----------|----------|
| iPhone 捷徑 | `adapters/shortcuts-server.js` | **零** |
| 手機相機 OCR | 捷徑或 PWA adapter | **零** |
| Apple Watch 數字 | 等同 MENU 選項 | **零** |
| 開源 AR 眼鏡 | `adapters/glass-ble.js` | **零** |

驗收：新增 adapter 後，既有 `verify_v3.py` 與 plugin 測試 **無 diff 通過**。

---

## 十、分階實作（V3 Phase 0～9）✅ 已凍結

完整 Checklist 見 **[docs/PHASES_v3.md](./docs/PHASES_v3.md)**（Phase 0～9 標題 **`[√]`**）。  
**2026-06-08 驗收：** `python test/verify_v3.py` → **V3 OVERALL [PASS]**（Phase 0～9）。  
**2026-06-09 備份：** `backups/whatspp_Blackcat_OS_v3.0-milestone_2026-06-09.zip`（含 V3.1 規格與郵件 WIP）。

| Phase | 主交付 | 驗證腳本 | 狀態 |
|-------|--------|----------|------|
| **0** | 骨架 + v1 複製 + `audit` + `ctx-contract` + `plugins.json` | `phase_v3_0_check.py` | ✅ |
| **1** | 狀態機 + `kernel-sanitizer` + handler `{ reply }` | `phase_v3_1_check.py` | ✅ |
| **2** | maps L0 + 選單 + game_hub 入口 + plugin-dispatch | `phase_v3_2_check.py` | ✅ |
| **3** | WhatsApp Adapter + `notes.js` 引用備忘 | `phase_v3_3_check.py` | ✅ |
| **4** | 真實翻譯 API + 搜尋 L0→L1→L2 | `phase_v3_4_check.py` | ✅ |
| **5** | mail／todo／clock（L0 連結 + BYOK 郵件） | `phase_v3_5_check.py` | ✅ |
| **6** | calendar／photos OCR／Tools Hub／滿編選單 | `phase_v3_6_check.py` | ✅ |
| **7** | 泡泡龍合流 + `client`／`login` + `GAME_PLAYING` 鋼鐵特權 | `phase_v3_7_check.py` | ✅ |
| **8** | Transport 定案：`send-queue` + `deliverReply` | `phase_v3_8_check.py` | ✅ |
| **9** | Mock Transport 整合測試（核心邏輯為真） | `phase_v3_9_check.py` | ✅ |

**測試分層說明：** `phase9_mock_e2e` 僅 mock **WhatsApp 連線層**（`EventEmitter` 假訊息）；`handleMessage`、插件、計算機、地圖、備忘、遊戲均跑**真實程式**。見 README「絕對原則」第 4 點。

**並列回歸：** 每 Phase 仍須 `audit_hardcode.py` **[PASS]** + `verify.py`（v1 計算機）**[PASS]**。

---

## 十一、部署與環境變數

見 [V3OS需求文件.md](./V3OS需求文件.md)。

---

## 十二、風險與緩解

| 風險 | 緩解 |
|------|------|
| **硬編碼復發（最高優先）** | Phase 0 閘門；見 **§〇** |
| **WhatsApp 滲透內核** | `audit` 禁止 plugins 引用 `msg.`／`client.`；Adapter 外置 |
| **多軌併發幽靈狀態** | `session.meta.activeSource` + `sourceBusy` 拒絕策略 |
| **IPC 代碼注入** | Sanitizer 長度上限；禁止 `eval`／動態 `require` |
| Token 費用 | BYOK + 瀑布降級 |
| v1 回歸失敗 | 每 Phase 跑 `verify.py` |

---

## 十三、與姊妹專案關係

| 專案 | 角色 |
|------|------|
| [whatsapp_calculator](../whatsapp_calculator) | v1 源頭 |
| [whatapp_cat_game](../whatapp_cat_game) | 泡泡龍獨立 bot |

---

## 十四、Version 3.1 分支（增量，不取代 V3.0）

| 項目 | 說明 |
|------|------|
| 定位 | 群組生存合約 + 北極星 `lastContext` 鏈 + OCR 斷路器 |
| Phase | **10～14** 見 [docs/PHASES_v31.md](./docs/PHASES_v31.md) |
| 規格 | [V31OS需求文件.md](./V31OS需求文件.md)、[V31OS專案架構.md](./V31OS專案架構.md) |
| 預計新增 | `lib/group-gate.js`、`lib/llm-provider.js`、`session.appData.lastContext` |
| V3.0 關係 | Phase 0～9 **凍結**；未設 `ALLOWED_GROUPS` 時行為與 V3.0 一致 |

---

## 相關文件

| 文件 | 連結 |
|------|------|
| V3.0 需求 | [V3OS需求文件.md](./V3OS需求文件.md) |
| V3.0 工作記錄 | [V3OS工作記錄.md](./V3OS工作記錄.md) |
| V3.1 需求／架構／Phase | [V31OS需求文件.md](./V31OS需求文件.md) · [V31OS專案架構.md](./V31OS專案架構.md) · [PHASES_v31.md](./docs/PHASES_v31.md) |
| v1 架構 | [../whatsapp_calculator/專案整體架構表.md](../whatsapp_calculator/專案整體架構表.md) |

---

*V3OS專案架構 — Version 3（凍結）+ V3.1 索引 — 2026-06-09*
