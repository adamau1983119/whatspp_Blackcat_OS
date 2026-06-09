# 工作記錄（Version 3 — 黑貓輕量 OS）

> **規則：** 只追加新段落，**禁止**刪改或覆寫既有紀錄。  
> 專案路徑：`D:\Users\Ophelia Chan\Desktop\MY Project\whatspp_Blackcat_OS`

---

## V3OS 文件索引

| 文件 | 用途 |
|------|------|
| [V3OS需求文件.md](./V3OS需求文件.md) | 客戶需求、插件藍圖、分階驗收 |
| [V3OS專案架構.md](./V3OS專案架構.md) | 微核心、目錄、硬編碼禁令、Phase 路線 |
| [V3OS工作記錄.md](./V3OS工作記錄.md) | 本文件 |

---

## 2026-06-06（專案啟動：規格與架構）

### 一、專案建立

| 項目 | 內容 |
|------|------|
| 專案名稱 | WhatsApp 黑貓輕量 OS（`whatspp_Blackcat_OS`） |
| 版本 | **Version 3** |
| 定位 | 在 v1 微核心上插入可插拔插件，組成 ChatOps OS |
| 基礎 | [whatsapp_calculator](../whatsapp_calculator) v1.0.0（calc 內建驅動） |
| 姊妹專案 | [whatapp_cat_game](../whatapp_cat_game) 泡泡龍（獨立，非 v3 首發） |

### 二、討論結論摘要

| 主題 | 決策 |
|------|------|
| 架構模式 | 微核心 + `lib/plugins/` + `plugin-dispatch.js` |
| 搜尋體驗 | 對話內直接答案（非 Safari 連結列表）；瀑布 L0→CSE→BYOK LLM |
| Token 成本 | User-Provided Key；作者不代付 |
| iOS 十大 App | 全期藍圖；**分階**實作，禁止一次 10 插件 |
| 插件優先序 | 翻譯 → Email → 搜尋 → 其餘 Mock |
| 硬編碼 | **Phase 0 閘門**；`audit_hardcode` 未 PASS 不得寫插件 |

### 三、已建立文件

| 檔案 | 說明 |
|------|------|
| `V3OS需求文件.md` | 需求規格（初版） |
| `V3OS專案架構.md` | 架構表（含 §〇 硬編碼禁令） |
| `V3OS工作記錄.md` | 本文件 |

檔名統一加 **`V3OS`** 前綴，與 v1／泡泡龍專案文件區隔。

### 四、待辦（Phase 0 前）

| 優先 | 項目 | 狀態 |
|------|------|------|
| 1 | 自 v1 複製核心 + `audit_hardcode.py`（含 `lib/plugins/`） | 待辦 |
| 2 | `docs/PHASES_v3.md` Checklist | 待辦 |
| 3 | `plugin-dispatch.js` 骨架 | 待辦 |
| 4 | 第一插件：`translate.js` | 待 Phase 0 PASS 後 |

---

## 2026-06-06（開工前：v1／v2 隔離確認）

### 現況稽核

| 項目 | 結果 |
|------|------|
| v1 repo | `whatsapp_calculator/`；tag `v1.0.0`、`v2.0.0`；分支 `version-1`、`main` |
| v3 repo | `whatspp_Blackcat_OS/`；尚無 `lib/`（僅規格文件） |
| 跨專案連結 | 無 npm 依賴、無 symlink |
| v1 驗證 | `python test/verify.py` → **OVERALL [PASS]**（開工前複驗） |

### 隔離決策

1. v3 僅寫入 `whatspp_Blackcat_OS/`；**禁止**回寫 `whatsapp_calculator`
2. Phase 0 採 **一次性複製** v1 檔案，非連結
3. 建議 Phase 0 於 v3 目錄 `git init`（與 v1 repo 分開）
4. 已新增 `.cursor/rules/v3-isolation.mdc`；`V3OS專案架構.md` §一 隔離鐵律

---

## 2026-06-08（Phase 0 落地完成）

### 路徑確認

所有程式與測試皆在：`D:\Users\Ophelia Chan\Desktop\MY Project\whatspp_Blackcat_OS`

### 產出摘要

| 類別 | 檔案 |
|------|------|
| v1 複製核心 | `lib/calc.js`、`handler.js`、`parse.js`、`session.js`、`format.js`、`messages.js` |
| v1 連線層（回歸用） | `index.js`、`lib/client.js`、`login.js`、`preflight.js`、`health.js`、`wweb-goto-patch.js` |
| V3 新增 | `lib/ctx-contract.js`、`config/menu.json`、`config/plugins.json` |
| 驗證 | `test/audit_hardcode.py`、`test/_verify_common.py`、`test/verify_v3.py`、`test/phase_v3_0_check.py`、v1 `verify.py` + phase0–9 |

### 驗收結果

| 腳本 | 結果 |
|------|------|
| `python test/audit_hardcode.py` | **RESULT: [PASS]** |
| `python test/phase_v3_0_check.py` | **Phase 0 RESULT: [PASS]**（30/30） |
| `python test/verify_v3.py` | **V3 OVERALL: [PASS]** |
| `python test/verify.py` | **OVERALL: [PASS]**（v1 計算機回歸） |

### v1 隔離

`whatsapp_calculator/` 工作樹無程式變更（開工前後皆未回寫）。

---

## 2026-06-08（Phase 1 完成）

### 產出

| 模組 | 說明 |
|------|------|
| `lib/kernel-sanitizer.js` | 中立 ctx 清洗；payload 強制 string |
| `lib/session.js` | V3 osState／appData.calc／meta.activeSource |
| `lib/handler.js` | 交通警察；回 `{ reply }` |
| `lib/handler-route.js` | PROMPT_GUARD／MENU／OS 全域 |
| `lib/handler-calc.js` | 計算機本體（appData.calc） |
| `lib/plugin-dispatch.js` | 8 秒超時斷路器骨架 |
| `config/commands.json` | 新增 `=結算`（SETTLE） |
| `test/phase_v3_1_check.py` | Phase 1 驗收 30/30 |

### 驗收

| 腳本 | 結果 |
|------|------|
| `python test/phase_v3_1_check.py` | **30/30 [PASS]** |
| `python test/verify_v3.py` | **V3 OVERALL [PASS]** |
| `python test/verify.py` | **OVERALL [PASS]** |

### V3 語意變更（相對 v1）

- `=開始` → 主選單（`MENU`），選 `1` 才進計算機
- `=結算` → 僅結算帳本；`=結束` → 關閉 OS（有帳本則 `PROMPT_GUARD`）

---

## 2026-06-08（Phase 2 完成 — 破冰特遣隊）

### 產出

| 模組 | 說明 |
|------|------|
| `lib/plugins/maps.js` | L0 深連結；2-Click + Fast-track（`=地圖 地點`） |
| `lib/plugins/translate.js` | Mock 譯文 → One-shot `IDLE` |
| `lib/plugins/game_hub.js` | 選單 `4` → `GAME_HUB` 子選單 |
| `lib/parse-plugin-prefix.js` | 插件直呼解析（維持 `parse.js` ≤150 行） |
| `lib/handler.js` / `handler-route.js` | Fast-track、MENU 2/3/4、APP_ACTIVE MAPS 第二輪 |
| `config/commands.json` | `plugins` 區段（`=地圖`、`=翻` 等） |
| `config/messages.json` | `mapsPrompt`、`mapsResult`、`translateMock`、`GAME_HUB_MENU` |
| `config/game-menu.json` | 遊戲子選單骨架 |
| `test/handler_v3_smoke.test.js` | Phase 2 冒煙測試 |
| `test/phase_v3_2_check.py` | Phase 2 驗收 28/28 |

### 驗收

| 腳本 | 結果 |
|------|------|
| `python test/phase_v3_2_check.py` | **28/28 [PASS]** |
| `python test/verify_v3.py` | **V3 OVERALL [PASS]**（含 phase 0–2） |
| `python test/verify.py` | **OVERALL [PASS]** |
| `python test/audit_hardcode.py` | **RESULT [PASS]** |

### 驗收場景確認

- `=開始` → `MENU`；選 `2` → `mapsPrompt` → `時代廣場` → Apple／Google 地圖 URL → `IDLE`
- IDLE 下 `=地圖 銅鑼灣` → 直接 URL → `IDLE`
- 選 `3` → translate Mock → `IDLE`
- 選 `4` → `GAME_HUB`；`+500` 被 `menuBlocked` 擋下

---

## 2026-06-08（Phase 3 完成 — 備忘錄 + WhatsApp Adapter）

### 產出

| 模組 | 說明 |
|------|------|
| `lib/whatsapp-adapter.js` | `buildCtxFromWhatsApp(msg)`；`getQuotedMessage` 僅在此 await |
| `index.js` | Adapter 組 ctx → `handleMessage` → `sendMessage` |
| `lib/plugins/notes.js` | `=記`（引用）／`=筆記 內容` → `appData.notes` |
| `config/commands.json` | `SAVE_NOTE`：`=記`、`=筆記` |
| `config/messages.json` | `notesSaved`、`notesEmpty`（黑貓備忘錄用語） |
| `test/notes_v3.test.js` | 備忘錄單元＋引用 ctx |
| `test/phase_v3_3_check.py` | Phase 3 驗收 24/24 |

### 驗收

| 腳本 | 結果 |
|------|------|
| `python test/phase_v3_3_check.py` | **24/24 [PASS]** |
| `python test/verify_v3.py` | **V3 OVERALL [PASS]** |
| `python test/verify.py` | **OVERALL [PASS]** |

### 行為確認

- `=記` + 引用訊息 → 寫入 `appData.notes` → `IDLE`；回覆含「黑貓備忘錄」
- `=記` 無引用 → `notesEmpty`，不崩潰
- `=筆記 買鮮奶` → 直接 Append

---

## 2026-06-08（Phase 4 完成 — 真實翻譯 + 搜尋）

### 產出

| 模組 | 說明 |
|------|------|
| `lib/plugins/translate.js` | `@vitalets/google-translate-api` 真實譯文 |
| `lib/plugins/search.js` | L0 Google URL → L1 CSE → L2 BYOK LLM |
| `lib/search-url.js` / `search-cse.js` / `search-llm.js` | 搜尋分層實作 |
| `lib/translate-resolve.js` | `=翻`／引用解析 |
| `lib/plugin-dispatch.js` | `dispatchPluginAsync`（8 秒超時） |
| `lib/handler.js` | `async handleMessage` |
| `config/search-prompts.json` | L2 Prompt 骨架 |
| `test/translate_v3.test.js`、`test/search_v3.test.js` | Phase 4 行為測試 |
| `test/phase_v3_4_check.py` | 驗收 31/31 |

### 驗收

| 腳本 | 結果 |
|------|------|
| `python test/phase_v3_4_check.py` | **31/31 [PASS]** |
| `python test/verify_v3.py` | **V3 OVERALL [PASS]** |
| `python test/verify.py` | **OVERALL [PASS]** |

### 使用方式

- `=翻 en 你好` 或引用訊息 + `=翻` → 對話內真實譯文
- `=查 灣仔中菜` → L0 Google 連結（預設）；設 `GOOGLE_CSE_KEY`+`GOOGLE_CSE_CX` 啟用 L1；`AI_API_KEY` 啟用 `=問` L2

---

## 2026-06-08（Phase 5 完成 — 郵件／待辦／提醒）

### 產出

| 模組 | 說明 |
|------|------|
| `lib/plugins/mail.js` | L0 `mailto:`；L1 nodemailer（`GMAIL_USER`／`GMAIL_APP_PASSWORD`） |
| `lib/plugins/todo.js` | `=待辦` Append；`=看待辦` ≤3 筆；含時間→行事曆連結 |
| `lib/plugins/clock.js` | `=提醒我` → Google Calendar 深連結（同步、無 setTimeout） |
| `config/email-routes.json` | 收件人暱稱映射 |
| `config/clock-urls.json` | 行事曆 URL 模板 |
| `test/phase5_v3.test.js`、`test/phase_v3_5_check.py` | Phase 5 驗收 |

### 驗收

| 腳本 | 結果 |
|------|------|
| `python test/phase_v3_5_check.py` | **26/26 [PASS]** |
| `python test/verify_v3.py` | **V3 OVERALL [PASS]** |

### 指令

- `=email 寄給小明：內文` → mailto 或 Gmail L1
- `=待辦 晚上8點洗衣服` → 待辦 + 行事曆連結
- `=提醒我 15分鐘後開會` → 行事曆連結 + `clockHandoffDisclaimer`

---

## 2026-06-08（Phase 6 完成 — 行事曆 + OCR + Tools Hub）

### 產出

| 模組 | 說明 |
|------|------|
| `lib/plugins/calendar.js` | L0 `calendar.google.com` 開啟連結；BYOK `GOOGLE_CALENDAR_ICS_URL` 今明 ≤3 筆快照 |
| `lib/plugins/photos.js` | 收圖 OCR（tesseract）抓 TOTAL → `appData.calc` 自動入帳 |
| `lib/handler-tools.js` | Tools Hub 子選單路由、fast plugins、圖片 OCR 路由 |
| `lib/help-list.js` | `=說明`／主選單 `0` 指令表 |
| `lib/ocr-total.js` | 收據 TOTAL 金額解析 |
| `config/menu.json` | 4 項：計算機、**Tools Hub**、翻譯、遊戲大廳（≤7 項） |
| `config/tools-menu.json` | 地圖／郵件／備忘／待辦／相片／提醒／行事曆 |
| `config/bookmarks.json` | 地圖書籤骨架 |
| `lib/whatsapp-adapter.js` | 圖片 `downloadMedia` → `attachment.type IMAGE` |
| `test/phase6_v3.test.js`、`test/phase_v3_6_check.py` | Phase 6 驗收 |

### 驗收

| 腳本 | 結果 |
|------|------|
| `python test/phase_v3_6_check.py` | **28/28 [PASS]** |
| `python test/verify_v3.py` | **V3 OVERALL [PASS]** |

### 選單變更

- 主選單 `2` 改為 **Tools Hub**（地圖為子選單 `1`）
- Fast-track `=地圖` 仍可直接使用
- `=說明` 或主選單 `0` 顯示指令表

### 驗收修復

- `phase_v3_6_check`：`strip_comments` 會誤刪 URL 內 `//`，行事曆 URL 改讀原始檔
- `phase_v3_0_check`：主選單改為接受 `TOOLS_HUB` + `tools-menu` 內 `SYS_MAPS`

---

## 2026-06-08（Phase 7 完成 — 泡泡龍合流 + WhatsApp 連線層）

### 產出

| 模組 | 說明 |
|------|------|
| `lib/games/bubble/` | 自 `whatapp_cat_game` 合流之泡泡龍核心（board／physics／format 等） |
| `lib/games/bubble-bridge.js` | OS ↔ 遊戲核心橋接 |
| `lib/plugins/bubble_shooter.js` | 遊戲插件薄包裝 |
| `lib/plugins/game_hub.js` | 升級：`game-menu.json` 驅動子選單 |
| `lib/handler-route.js` | `handleGameHub`／`handleGamePlaying` 真實盲傳 |
| `lib/handler.js` | `GAME_PLAYING` 優先於 `parseCommand`（鋼鐵特權） |
| `config/bubble/` | 遊戲設定／指令／文案 |
| `config/game-menu.json` | 泡泡龍 `enabled: true` |
| `test/phase7_v3.test.js`、`test/phase_v3_7_check.py` | Phase 7 驗收 |

### 驗收

| 腳本 | 結果 |
|------|------|
| `python test/phase_v3_7_check.py` | **34/34 [PASS]** |
| `python test/verify_v3.py` | **V3 OVERALL [PASS]** |

### 遊戲流程

- 主選單 `4` → `GAME_HUB` → `1` → `GAME_PLAYING`（泡泡龍棋盤）
- 遊戲中 `L`／`R`／`F` 透傳至泡泡龍；`+500` 等**不**進計算機
- 遊戲中**僅** `=開始` 可退回 `GAME_HUB`
- `index.js`／`client.js`／`login.js` 已就緒（QR／配對碼登入）

### 實機煙測（需本機執行）

```powershell
cd "D:\Users\Ophelia Chan\Desktop\MY Project\whatspp_Blackcat_OS"
$env:PUPPETEER_HEADLESS="false"
npm start
```

掃碼後：`=開始` → `4` → `1` → `L`／`F` 操作；`=地圖 銅鑼灣` 驗證地圖連結。

---

## 2026-06-08（Phase 8 完成 — WhatsApp Transport 正式驗收）

### 產出

| 模組 | 說明 |
|------|------|
| `lib/send-queue.js` | 每 `principalId` 序列化 `sendMessage`（佇列預留） |
| `index.js` | `deliverReply` + `enqueueSend`；Phase 8 Transport 層定案 |
| `test/transport_v3.test.js`、`test/phase_v3_8_check.py` | Phase 8 驗收 |

### 驗收

| 腳本 | 結果 |
|------|------|
| `python test/phase_v3_8_check.py` | **22/22 [PASS]** |
| `python test/phase8_check.py` | **[PASS]** |
| `python test/verify_v3.py` | **V3 OVERALL [PASS]** |

### Transport 契約

- `message_create` + `if (!msg.fromMe) return`
- `buildCtxFromWhatsApp`：引用文字／圖片 `downloadMedia`
- 回覆經 `deliverReply` → `enqueueSend` 序列送出

---

## 2026-06-08（Phase 9 完成 — Mock 整合測試）

### 產出

| 模組 | 說明 |
|------|------|
| `test/phase9_mock_e2e.test.js` | 擴充：v1 計算機全鏈 + V3 OS（全形開始、=說明、地圖、遊戲大廳、引用備忘） |
| `test/phase_v3_9_check.py` | Phase 9 正式驗收 |

### 驗收

| 腳本 | 結果 |
|------|------|
| `python test/phase_v3_9_check.py` | **18/18 [PASS]** |
| `python test/phase9_check.py` | **[PASS]** |
| `python test/verify_v3.py` | **V3 OVERALL [PASS]**（Phase 0–9 全過） |

### Mock E2E 覆蓋

- v1：`=開始` → 計算機 → 修改／退回／結算／結束；A/B session 隔離；`/0` 錯誤處理
- V3：全形 `＝開始`、`=說明`、`=地圖` Fast-track、`GAME_HUB` 擋 `+500`、引用 `=記`
- Transport：他人訊息不回覆

### 實機（手動）

`npm start` 掃碼後重跑上述流程；QR／配對碼登入無法在 CI mock。

---

## 2026-06-08（V3 Phase 0～9 里程碑備份）

### 一、驗證結果（備份前）

| 驗證 | 結果 |
|------|------|
| `python test/verify_v3.py` | **V3 OVERALL [PASS]**（`phase_v3_0`～`phase_v3_9` 全過） |
| `python test/verify.py` | **OVERALL [PASS]**（v1 計算機回歸） |
| `python test/audit_hardcode.py` | **[PASS]** |

### 二、本機檔案備份

| 項目 | 內容 |
|------|------|
| ZIP | `D:\Users\Ophelia Chan\Desktop\MY Project\backups\whatspp_Blackcat_OS_v3-phase9_2026-06-08.zip` |
| 展開目錄 | 同路徑下 `whatspp_Blackcat_OS_v3-phase9_2026-06-08\` |
| 排除 | `node_modules`、`.wwebjs_auth`、`.git`、`__pycache__` |
| 還原後 | 於備份目錄執行 `npm install` 後可 `npm start` |

### 三、Git 狀態（備份時）

| 項目 | 內容 |
|------|------|
| 遠端 | https://github.com/adamau1983119/whatspp_Blackcat_OS |
| 分支 | `main`（相對 `origin/main` 有大量未提交變更） |
| 最後 commit | `2d83106` — Phase 0 英文契約（**尚未**含 Phase 1～9 程式） |
| 建議 | 驗收通過後由負責人決定是否 `git add`／commit／push 或打 tag `v3.0.0-phase9` |
| **已推送** | `9aada9a` — `feat: complete V3 Phases 1-9…` → `origin/main`（2026-06-08） |

### 四、文件同步

| 檔案 | 更新 |
|------|------|
| `V3OS專案架構.md` | 目錄樹、模組表、路由優先序、Phase 0～9 狀態表、測試分層說明 |
| `V3OS工作記錄.md` | 本段落（里程碑備份） |

### 五、里程碑摘要

- **微核心 + 10+ 插件** 已落地；主選單 Tools Hub + 遊戲大廳（泡泡龍可玩）
- **Transport** 與 **Kernel** 分離；`GAME_PLAYING` 鋼鐵特權已驗收
- **下一階段（規格外）**：實機 QR 煙測、Git 正式提交、捷徑／眼鏡 Adapter（見架構 §九）

---

## 2026-06-09（V3.1 規格分支 — 文件移交）

V3.0 Phase 0～9 里程碑**凍結**於本文件與 V3OS 三件套；後續開發規格見 **V3.1**：

| 文件 | 連結 |
|------|------|
| V3.1 需求 | [V31OS需求文件.md](./V31OS需求文件.md) |
| V3.1 架構 | [V31OS專案架構.md](./V31OS專案架構.md) |
| V3.1 Phase | [docs/PHASES_v31.md](./docs/PHASES_v31.md) |
| V3.1 工作記錄 | [V31OS工作記錄.md](./V31OS工作記錄.md) |

---

## 2026-06-09（V3.0 里程碑備份 + Checklist 凍結）

### 一、本機檔案備份

| 項目 | 內容 |
|------|------|
| ZIP | `D:\Users\Ophelia Chan\Desktop\MY Project\backups\whatspp_Blackcat_OS_v3.0-milestone_2026-06-09.zip`（約 4.95 MB） |
| 前次備份 | `whatspp_Blackcat_OS_v3-phase9_2026-06-08.zip` |
| 排除 | `node_modules`、`.wwebjs_auth`、`.git`、`__pycache__`、`.cursor` |
| 含新增 | V31OS 三件套、`docs/PHASES_v31.md`、郵件 HTTP 改版 WIP、`bot-reply-guard.js` 等 |
| 還原後 | 解壓 → `npm install` → 可 `npm start` |

### 二、Checklist 文件更新

| 檔案 | 更新 |
|------|------|
| `docs/PHASES_v3.md` | 新增 **V3.0 里程碑驗收狀態** 表；Phase 0～9 標題改 **`[√]`**；腳本狀態改 **已驗收**；連結 `PHASES_v31.md` |
| `V3OS專案架構.md` | §十備份路徑、§十四 V3.1 分支、目錄樹增量模組 |

### 三、驗證快照（備份當日 `python test/verify_v3.py`）

| 腳本 | 結果 | 備註 |
|------|------|------|
| `audit_hardcode.py` | **PASS** | |
| `phase_v3_0_check` | **PASS** | |
| `phase_v3_1_check` | **PASS** | |
| `phase_v3_2`～`9` | **部分 FAIL** | 工作樹 WIP（郵件 `buildPublicMailUrl`、舊 `verify.py` 檢查 `sendMessage` 等）與 2026-06-08 里程碑腳本不同步 |
| **里程碑基準** | 2026-06-08 曾 **V3 OVERALL [PASS]** | 以備份 ZIP + Phase 標題 `[√]` 為 V3.0 凍結依據；全綠待 V3.1 Phase 10 起收斂或還原至 06-08 樹 |

### 四、Git 狀態（備份時）

| 項目 | 內容 |
|------|------|
| HEAD | `6ca8f13` — docs: record Phase 1-9 git push |
| 工作樹 | 未提交：郵件改版、V31 規格文件、`bot-reply-guard` 等 |
| **V3.1 上 Git** | **尚未** — 見 [V31OS工作記錄.md](./V31OS工作記錄.md)「Git 現況澄清」 |

### 五、版本線宣告

- **V3.0**：Phase 0～9 凍結；`PHASES_v3.md` Checklist 不再擴充  
- **V3.1**：Phase 10～14；見 `docs/PHASES_v31.md`  

---

*（以下請只追加新日期段落，勿刪改上方內容）*
