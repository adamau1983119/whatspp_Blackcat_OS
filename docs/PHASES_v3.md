# 分階實作計畫 — 黑貓輕量 OS（Version 3）

> 客戶需求見 **[V3OS需求文件.md](../V3OS需求文件.md)**  
> 架構見 **[V3OS專案架構.md](../V3OS專案架構.md)**  
> **V3.1 增量 Phase** 見 **[PHASES_v31.md](./PHASES_v31.md)**（Phase 10～14）  
> 微核心源自 [whatsapp_calculator](../whatsapp_calculator) Version 1（`v1.0.0` 凍結）  
> 計算機（`calc.js`）視為 **v1 已完成**；每 Phase 須跑 `python test/verify.py` 回歸。

---

## V3.0 里程碑驗收狀態

| 項目 | 說明 |
|------|------|
| **官方里程碑** | 2026-06-08：`python test/verify_v3.py` → **V3 OVERALL [PASS]**（Phase 0～9） |
| **備份** | `backups/whatspp_Blackcat_OS_v3.0-milestone_2026-06-09.zip`（含 V3.1 規格文件；排除 `node_modules`／`.wwebjs_auth`／`.git`） |
| **凍結** | V3.0 Checklist 以下 Phase 0～9 標記 **`[√]`**；後續開發走 **V3.1** `PHASES_v31.md` |
| **備註** | 工作樹若有郵件 HTTP 改版等 WIP，`verify_v3` 可能暫時 FAIL，以備份時點或 V3.1 Phase 收斂後再全綠 |

| Phase | 腳本 | 里程碑 |
|-------|------|--------|
| 0 | `phase_v3_0_check.py` | `[√]` |
| 1 | `phase_v3_1_check.py` | `[√]` |
| 2 | `phase_v3_2_check.py` | `[√]` |
| 3 | `phase_v3_3_check.py` | `[√]` |
| 4 | `phase_v3_4_check.py` | `[√]` |
| 5 | `phase_v3_5_check.py` | `[√]` |
| 6 | `phase_v3_6_check.py` | `[√]` |
| 7 | `phase_v3_7_check.py` | `[√]` |
| 8 | `phase_v3_8_check.py` | `[√]` |
| 9 | `phase_v3_9_check.py` | `[√]` |

---

## 原則

| 規則 | 說明 |
|------|------|
| **每階 ≤ 150 行** | 僅限手寫原始碼（`index.js`、`lib/*.js`、`lib/plugins/*.js`） |
| **一階一驗** | 通過 `python test/phase_v3_N_check.py` 才進下一階 |
| **單一職責** | 一插件一檔；微核心只路由、不寫業務文案 |
| **硬編碼零容忍** | 每 Phase 必跑 `python test/audit_hardcode.py` → `RESULT: [PASS]` |
| **禁止手動勾選** | Checklist 的 `[ ]` 僅為驗收標準；以 Python `RESULT: [PASS]` 為準 |
| **Quick Gateway** | 除計算機、遊戲外，插件一律 **One-shot → `IDLE`** |
| **證據化** | 行為測試須 `run_node_script`／`run_node_eval` 真呼叫 `handler.js`，禁止 Python 假裝狀態機 |

---

## 驗證協議（監察用）

1. **實作者**（Cursor）只寫程式，**不得**自行把 Checklist 改為 `[√]`
2. **每 Phase 執行：** `python test/phase_v3_N_check.py`
3. **累加驗證：** `python test/verify_v3.py`
4. **v1 回歸：** `python test/verify.py`（計算機）
5. **結果紀錄：** `test/verification_status.json`（Python 自動寫入）

### 每階交付流程

```
實作 Phase N 程式
    → 新增 test/phase_v3_N_check.py（對照該 Phase Checklist）
    → 更新 test/verify_v3.py 的 PHASE_SCRIPTS
    → python test/audit_hardcode.py
    → python test/phase_v3_N_check.py
    → python test/verify_v3.py
    → python test/verify.py
    → 通過後寫入 verification_status.json
```

### 第三方檢查腳本狀態

| Phase | 腳本 | 狀態 |
|-------|------|------|
| 0 | `test/phase_v3_0_check.py` | `[√]` 已驗收（2026-06-08） |
| 1 | `test/phase_v3_1_check.py` | `[√]` 已驗收 |
| 2 | `test/phase_v3_2_check.py` | `[√]` 已驗收 |
| 3 | `test/phase_v3_3_check.py` | `[√]` 已驗收 |
| 4 | `test/phase_v3_4_check.py` | `[√]` 已驗收 |
| 5 | `test/phase_v3_5_check.py` | `[√]` 已驗收 |
| 6 | `test/phase_v3_6_check.py` | `[√]` 已驗收 |
| 7 | `test/phase_v3_7_check.py` | `[√]` 已驗收 |
| 8 | `test/phase_v3_8_check.py` | `[√]` 已驗收 |
| 9 | `test/phase_v3_9_check.py` | `[√]` 已驗收 |

```powershell
python test\audit_hardcode.py
python test\phase_v3_0_check.py
python test\verify_v3.py
python test\verify.py
```

---

## 全期能力對位（非 8 Phase 各做一 App）

| 類別 | 說明 |
|------|------|
| **計算機** | v1 已完成；V3 改 OS 語意（`=開始`→選單），`calc.js` 邏輯不變 |
| **iOS 九大工具** | 地圖、搜尋、郵件、筆記、待辦、時鐘、行事曆、相片；**簡訊剔除** |
| **遊戲大廳** | 商業核心；Phase 2 Mock 路由，Phase 7 泡泡龍合流 |
| **主選單** | ≤7 行；Phase 2 用 **4 項 MVP**；Phase 6 擴為 Tools Hub + 滿編 |

**狀態標記：** `[ ]` 待完成 · `[√]` 通過 · `[×]` 未通過

---

## 三大特區（不套用「移交 iOS」模板）

| 特區 | 行為 | 原因 |
|------|------|------|
| **計算機 `SYS_CALC`** | 多輪互動留在 WhatsApp；`appData.calc` | v1 記帳剛需，已完成 |
| **遊戲 `GAME_HUB`** | `GAME_PLAYING` 長駐；`L`/`R`/`F` 透傳 | 商業核心 |
| **Google AI／搜尋摘要／翻譯** | **答案以 WhatsApp 訊息回覆** | AI 的本質是對話內容交付，不是開原生 App |

---

## 全插件 Quick Gateway 與責任邊界（其餘 iOS 能力）

> **總原則：** 能 **L0 深連結移交 iOS** 就移交；能在對話 **一句完成** 就 One-shot→`IDLE`；**禁止**黑貓冒充「已替你做好原生 App 裡的事」。  
> **簡訊 `SYS_SMS`：** 剔除（人已在 WhatsApp）。

| iOS | 插件 | 指令 | 模式 | 黑貓做什麼 | 移交 iOS／誠實邊界 | 狀態 |
|-----|------|------|------|------------|-------------------|------|
| Maps | `maps.js` | `=地圖` | **L0 連結** | 解析地點 → Apple／Google Maps URL | 使用者點連結導航；**不**在對話裡畫地圖 | Phase 2 |
| Safari／搜尋 | `search.js` | `=查` `=問` | **混合** | L0：Google 搜尋 URL（移交 Safari） | L1：CSE ≤3 行留 WhatsApp；**L2：BYOK LLM 摘要留 WhatsApp**（Google AI 應用方式） | Phase 4 |
| 翻譯 | `translate.js` | `=翻` | **對話回覆** | 譯文**直接回覆**在同一對話 | 不開翻譯 App；One-shot→`IDLE` | Phase 2 Mock→4 |
| Mail | `mail.js` | `=email` | **L0 優先** | 組 **`mailto:`** 連結（主旨／內文／收件人預填） | 使用者點連結 → **原生 Mail** 寄出；L1 可選 nodemailer BYOK（須 `mailSendDisclaimer`，不保證送達） | Phase 5 |
| Notes | `notes.js` | `=記` `=筆記` | **L2 速記** | 引用 → `attachment.payload` 或一行字 → **黑貓備忘錄** | **不**稱「已進 iOS 備忘錄」；`=看筆記` ≤3 筆預覽；L3 可選 Shortcuts 推送 | Phase 3 |
| Reminders | `todo.js` | `=待辦` | **L2 速記** | Append 待辦清單；`=看待辦` 唯讀 ≤3 筆 | **不**伺服器準時 ping；若含「今晚8點」→ **附加行事曆 Template 連結**移交 iOS | Phase 5 |
| Clock | `clock.js` | `=提醒我` | **L0 連結** | 解析時間＋事件 → **行事曆／Shortcuts URL** | **禁止** `setTimeout` 代響；文案：`clockHandoffDisclaimer` | Phase 5 |
| Calendar | `calendar.js` | `=行程` | **L0＋唯讀** | 無 API：回 `calendarOpenNative` 連結；有 BYOK：今明 ≤3 筆快照 | 詳細排程**必須**點連結去 **iOS 行事曆** | Phase 6 |
| Photos | `photos.js` | 傳圖／`=識` | **對話回覆** | OCR 抓 `TOTAL` → 自動 `+金額` 入 calc | 回一句「已計入帳本」；**不**取代相簿 App | Phase 6 |

### 各插件標準回覆節奏（訊息提示）

| 類型 | 來回 | 提示 key（`messages.json`） |
|------|------|------------------------------|
| L0 連結類 | 1～2 次 | `*Prompt` 一句 → `*Result` 含 URL + `*HandoffDisclaimer` |
| L2 速記類 | 1 次 | `*Saved` 一句 → `IDLE` |
| AI／翻譯類 | 1 次 | 內容即回覆；可加 `*Hint` 教熟手直呼 |
| 計算機 | 多輪 | v1 既有文案 |
| 遊戲 | 多輪 | `game-messages` 驅動 |

### 禁止文案（全系統 `messages.json` 稽核）

- [ ] 禁止：「已同步至 iOS 備忘錄／行事曆／鬧鐘」
- [ ] 禁止：「保證送達」「一定會提醒」「零失敗」
- [ ] 禁止：「可取代原生 App」
- [ ] 允許：「已準備連結，請點擊在 iPhone 確認」「已存入黑貓備忘錄」

### 安全與責任（全插件適用）

黑貓 OS 為**開源自架、相對不穩定**的實驗性工具。凡涉及**人身安全、用火用氣、醫療、幼兒**之定時事項，**一律**以 **L0 連結移交 iOS 原生** 為預設；黑貓**不得**承諾在 WhatsApp 代為準時通知。

---

## 防禦性架構（第三方五項建議 — 採納）

| # | 建議 | 採納 | 落地 Phase |
|---|------|------|------------|
| 1 | `verification_status.json` 防偽：綁定 git commit（若有）+ UTC 時間戳 + 僅允許 check 腳本寫入 | **採納**（無 git 時記錄 `commit: null` 並標 WARN） | Phase 0 `_verify_common.py` |
| 2 | `plugin-dispatch` 8 秒超時斷路器 → 強制 `releaseToIdle()` | **採納** | Phase 1 |
| 3 | 多模態原料預留：`ctx.attachment.type`（TEXT／IMAGE／AUDIO） | **採納** | Phase 3 Adapter；Phase 6 擴充 IMAGE |
| 4 | URL 組裝必須 `encodeURIComponent` 靜態稽核 | **採納** | Phase 0 擴充 `audit_hardcode.py` |
| 5 | `GAME_PLAYING` 鋼鐵特權：僅 `=開始` 可退出，其餘 100% 盲傳遊戲 | **採納**（`PROMPT_GUARD` 優先於遊戲；遊戲優先於 parse） | Phase 1 註解；Phase 7 驗收 |

**路由優先序（最終版）：** `PROMPT_GUARD` → **`GAME_PLAYING` 盲傳（僅 `=開始` 例外）** → Fast-track → OS 全域 → 子選單 → MENU → CALC／插件。

### 防偽寫入契約（`verification_status.json`）

```json
{
  "phase0": {
    "pass": true,
    "writtenAt": "ISO-8601 UTC",
    "gitCommit": "abc1234 or null",
    "writer": "phase_v3_0_check.py"
  }
}
```

- [ ] 僅 `test/phase_v3_*_check.py` 透過 `_verify_common.write_status()` 寫入
- [ ] 手動編輯 JSON 後，下一輪 check 若 `writtenAt`／`writer` 異常則 **FAIL**（可選：比對 commit 變更）

### URL 編碼稽核（`audit_hardcode.py` 擴充）

- [ ] 掃描 `lib/plugins/`：若字串拼接 `http` URL 且含變數，同檔須出現 `encodeURIComponent`
- [ ] `phase_v3_2_check.py`：餵「銅鑼灣時代廣場」斷言 URL 含 `%` 編碼

### 防禦性架構（擴展基礎五項 — 採納）

> **原則：** Executor 焊死、Selector 可換。首發不實作 Glass／捷徑，只焊接口契約。

| # | 建議 | 採納 | 落地 Phase |
|---|------|------|------------|
| 1 | **Kernel Sanitizer**：多模態原料標準化 → `attachment.payload` 必為 string | **採納** | Phase 1 `kernel-sanitizer.js` |
| 2 | **Payload 安全防線**：長度上限、控制字元剝離；禁止 `eval`／動態 `require` | **採納** | Phase 1 `parse.js` + Phase 0 `audit` |
| 3 | **Source Mutex**：`session.meta.activeSource`；多軌併發優雅拒絕 | **採納**（骨架） | Phase 1 `session.js`；Phase 7+ 驗收 |
| 4 | **Acoustic Token Guard**：僅 `GLASS_AUDIO` 須 `[CMD]` 前綴 | **採納**（stub） | Phase 1 `parse.js` 註解 + 測試 |
| 5 | **`plugins.json` `supported_sources`**：每插件宣告可接受輸入軌道 | **採納** | Phase 0 config 契約 |

### 中立 `ctx` 鋼鐵合約（Phase 1 定案；Phase 3 Adapter 落地）

```javascript
// lib/ctx-contract.js — handler / plugins 唯一輸入
const ctx = {
  source: 'WHATSAPP',           // WHATSAPP | SHORTCUTS | GLASS_BLE | PWA_APP | GLASS_AUDIO
  principalId: 'user_123_hk',   // session 隔離鍵；WhatsApp 期 = chatId
  text: '=地圖 銅鑼灣',
  attachment: {
    hasAttachment: true,
    type: 'TEXT',               // TEXT | IMAGE | AUDIO
    payload: '純文字原料'        // Sanitizer 洗淨；插件只吃 string
  }
};

// handler 回傳 — 僅 Transport Adapter 負責 sendMessage
{ reply: string | null }
```

**鐵律：**
- `lib/handler.js`、`lib/plugins/` **禁止** `msg.`、`client.`、`sendMessage`、`getQuotedMessage`
- WhatsApp 引用／未來捷徑剪貼簿 → 一律塞入 `attachment.payload`（非扁平 `quotedBody`）

### Transport Adapter 分層

| 檔案 | 角色 | Phase |
|------|------|-------|
| `index.js` | WhatsApp Adapter：`buildCtxFromWhatsApp(msg)` → `handleMessage` → `sendMessage(reply)` | 3 骨架 → 7 完整 |
| `adapters/shortcuts-server.js` | 捷徑 Webhook → 同一 `ctx` | 7+ 規格伏筆 |
| `adapters/glass-ble.js` | 眼鏡 BLE → 同一 `ctx` | 7+ 規格伏筆 |

---

## 分階一覽（共 8 Phase：0～7）

| Phase | 主交付 | 預估新增行數 | 驗證方式 | 狀態 |
|-------|--------|-------------|---------|------|
| **0** | 骨架 + v1 複製 + `audit` + `ctx-contract.js` + `plugins.json`（`supported_sources`） | ~80 | `python test/phase_v3_0_check.py` | [ ] |
| **1** | 狀態機 + `kernel-sanitizer` + handler `{ reply }` + source mutex 骨架 | ~200 | `python test/phase_v3_1_check.py` | [ ] |
| **2** | `plugin-dispatch` + `maps` L0 + `translate` Mock + 4 項 menu + `game_hub` Mock | ~250 | `python test/phase_v3_2_check.py` | [ ] |
| **3** | WhatsApp Adapter + `notes.js`（`attachment.payload` + `=記`） | ~120 | `python test/phase_v3_3_check.py` | [ ] |
| **4** | `translate` API（對話回覆）+ `search` L0 URL／L1 三行／L2 AI 訊息回覆 | ~200 | `python test/phase_v3_4_check.py` | [ ] |
| **5** | `mail` mailto L0 + `todo` 速記 + `clock` 行事曆連結 L0 | ~200 | `python test/phase_v3_5_check.py` | [ ] |
| **6** | `calendar` 唯讀 + `photos` OCR 入帳 + Tools Hub + 7 項 menu + `=說明` | ~300 | `python test/phase_v3_6_check.py` | [ ] |
| **7** | `bubble_shooter` 合流 + `client`/`login`/`index.js` WhatsApp 實機 | ~250 | `python test/phase_v3_7_check.py` | [ ] |

---

## 各 Phase 詳細說明

### Phase 0 — 專案骨架與硬編碼閘門 `[√]`

**產出：**
- 自 v1 複製：`package.json`、`lib/calc.js`、`lib/format.js`、`lib/messages.js`、`lib/parse.js`、`lib/session.js`、`lib/handler.js`、`config/commands.json`、`config/messages.json`
- 新增：`lib/ctx-contract.js`（`SOURCE`／`ATTACHMENT_TYPE` 常量，≤30 行）
- 新增：`test/audit_hardcode.py`（含 `lib/plugins/` 掃描 + 禁止 WhatsApp API 滲透 plugins）、`test/_verify_common.py`、`test/verify_v3.py` 骨架
- 新增 config 契約：`config/menu.json`、`config/plugins.json`（含 **`supported_sources`**）
- 新增：`lib/plugins/` 空目錄、`docs/PHASES_v3.md`（本文件）

**驗證：** `python test/phase_v3_0_check.py`

**Checklist：**
- [ ] `whatspp_Blackcat_OS/` 目錄存在且含 `package.json`
- [ ] `npm install` 無報錯
- [ ] v1 核心檔已複製（`calc.js`、`handler.js`、`parse.js`、`session.js`）
- [ ] `test/audit_hardcode.py` 存在且掃描 `lib/` + `lib/plugins/`
- [ ] `python test/audit_hardcode.py` → `RESULT: [PASS]`
- [ ] `config/menu.json` 存在；`items.length` ≤ 7
- [ ] `config/plugins.json` 存在；含 `tier`、`enabled`、**`supported_sources`**（預設 `["WHATSAPP"]`）
- [ ] `lib/ctx-contract.js` 存在；定義 `SOURCE`／`ATTACHMENT_TYPE`
- [ ] `audit_hardcode.py` 禁止 `lib/plugins/`、`lib/handler.js` 出現 `msg.`、`client.`、`eval(`
- [ ] `test/verify_v3.py` 存在且可執行（允許暫無 phase 腳本）
- [ ] `python test/verify.py`（v1 回歸）→ `OVERALL: [PASS]`
- [ ] 手寫 `.js` 單檔 ≤ 150 行
- [ ] `_verify_common.write_status` 寫入 `writtenAt`、`gitCommit`、`writer` 防偽欄位
- [ ] `audit_hardcode.py` 含 URL／`encodeURIComponent` 規則（見「防禦性架構」）

---

### Phase 1 — V3 狀態機與交通警察骨架 `[√]`

**產出：**
- `lib/kernel-sanitizer.js`：`normalizeCtx(ctx)` → `attachment.payload` 必為 string
- `lib/session.js` 擴充：`principalId` 隔離；`osState`（`IDLE`|`MENU`|`APP_ACTIVE`|`TOOLS_HUB`|`GAME_HUB`|`GAME_PLAYING`|`PROMPT_GUARD`）、`currentApp`、`appData.calc`、`guard`、`meta.activeSource`／`lockReason`、`enterMenu()`、`releaseToIdle()`、`activateApp()`
- `lib/handler.js` 擴充：入口呼叫 sanitizer；路由優先序；回 **`{ reply }`**；**`GAME_PLAYING` 鋼鐵特權**
- `lib/plugin-dispatch.js` 骨架：**8 秒** `Promise.race` 超時 → `releaseToIdle()` + 錯誤文案
- `lib/parse.js` 擴充：`SETTLE`（`=結算`）、`parsePluginPrefix()`；Payload 長度防線；`GLASS_AUDIO` Token Guard stub
- `config/commands.json` 新增 `SETTLE` 多語別名
- `config/messages.json` 新增：`OS_MENU`、`calcResume`、`promptGuardEnd` 等 key（文案占位）
- `test/session_v3.test.js` 或 `test/handler_v3_menu.test.js`

**職責：** 計算機資料改讀 `session.appData.calc`；`enterMenu()` **不得**清空帳本。

**驗證：** `python test/phase_v3_1_check.py`

**Checklist：**
- [ ] `session.js` 含 `osState`、`appData.calc`、`releaseToIdle()`
- [ ] `getSession()` 預設 `osState === 'IDLE'`
- [ ] `=開始` 使 `osState === 'MENU'`（**不再**等同 v1 直接開計算機）
- [ ] `=結算` 僅清空 `appData.calc` 並回總計，OS 可仍運行
- [ ] `enterMenu()` 保留 `appData.calc.entries`
- [ ] 有未結算帳本時 `=結束` 進入 `PROMPT_GUARD`（骨架可 Mock 回覆）
- [ ] `parse.js` 可解析 `=結算` → `SETTLE`
- [ ] `MENU` 狀態下 `+500` 不生效（回 null 或提示，不修改 calc）
- [ ] `plugin-dispatch` 超時 8 秒強制退回 `IDLE`（單元或 mock 驗證）
- [ ] `handler` 註解載明路由：`PROMPT_GUARD` → `GAME_PLAYING` 盲傳 → …
- [ ] `lib/kernel-sanitizer.js` 存在；餵髒 JSON `attachment` → 插件收到純字串
- [ ] `handleMessage` 回 `{ reply }`；`lib/plugins/` 無 `msg.`／`client.`／`sendMessage`
- [ ] `session.meta.activeSource` 欄位存在
- [ ] `getSession(principalId)` 語意成立（WhatsApp 測試仍傳 chatId 作 principalId）
- [ ] `node test/session_v3.test.js`（或同等）全部通過
- [ ] `python test/audit_hardcode.py` → `[PASS]`
- [ ] `python test/verify.py` → `OVERALL: [PASS]`
- [ ] 單檔 ≤ 150 行、有中文註釋

---

### Phase 2 — 破冰特遣隊：地圖 + 翻譯 Mock + 選單 + 遊戲大廳 Mock `[√]`

**產出：**
- `lib/plugin-dispatch.js`：`execute(cmd, session, ctx)` 契約 + try/catch 隔離
- `lib/plugins/maps.js`：L0 深連結（同步、無 API）；2-Click 與 Fast-track
- `lib/plugins/translate.js`：Mock 一則譯文回覆
- `lib/plugins/game_hub.js`：選單 `#4` 進入 `GAME_HUB`，吐出子選單文案
- `config/menu.json` **4 項 MVP**（見下）
- `config/messages.json`：`mapsPrompt`、`mapsResult`、`GAME_HUB_MENU`
- `test/handler_v3_smoke.test.js`

**Phase 0 的 `config/menu.json` 規格：**

```json
{
  "version": "3.0.0-phase0",
  "items": [
    { "index": "1", "type": "SYS_CALC", "name": "帳本計算機", "emoji": "🧮" },
    { "index": "2", "type": "SYS_MAPS", "name": "快捷地圖導航", "emoji": "🗺️" },
    { "index": "3", "type": "SYS_TRANSLATE", "name": "即時翻譯機", "emoji": "🌐" },
    { "index": "4", "type": "GAME_HUB", "name": "街機遊戲大廳", "emoji": "🎮" }
  ]
}
```

**驗證：** `python test/phase_v3_2_check.py`（須 `run_node_eval` 真呼叫 `handleMessage`）

**Checklist：**
- [ ] `lib/plugin-dispatch.js` 存在且 ≤ 150 行
- [ ] `lib/plugins/maps.js` 存在；無 `await` 第三方 API
- [ ] `=開始` → 回覆含 `OS_MENU` 文案；`osState === 'MENU'`
- [ ] MENU 選 `2` → `mapsPrompt`（一句）；再回 `時代廣場` → 含 `maps.apple.com` 與 `google.com/maps`
- [ ] 地圖完成後 `osState === 'IDLE'`（One-shot）
- [ ] IDLE 下 `=地圖 銅鑼灣` → 含地圖 URL 且 `osState === 'IDLE'`（Fast-track）
- [ ] MENU 選 `3` → translate Mock 回覆 → `IDLE`
- [ ] MENU 選 `4` → `osState === 'GAME_HUB'`；`+500` 不生效
- [ ] `python test/audit_hardcode.py` → `[PASS]`
- [ ] `node test/handler_v3_smoke.test.js` 全部通過
- [ ] `python test/verify.py` → `OVERALL: [PASS]`
- [ ] 插件單檔 ≤ 150 行

---

### Phase 3 — 備忘錄：WhatsApp Adapter + `=記` `[√]`

**產出：**
- `index.js` **WhatsApp Transport Adapter**：`buildCtxFromWhatsApp(msg)`；`getQuotedMessage()` **僅在此** await → `attachment.payload`／`attachment.type`
- `index.js`：`handleMessage(ctx)` → `sendMessage(result.reply)`（Adapter 專責發送）
- `lib/plugins/notes.js`：讀 `ctx.attachment.payload` + `=記` → Append `appData.notes` → `releaseToIdle()`
- `config/commands.json`：`SAVE_NOTE` 別名 `=記`、`=筆記`
- `config/messages.json`：`notesSaved`、`notesEmpty`
- `test/notes_v3.test.js`

**驗證：** `python test/phase_v3_3_check.py`

**Checklist：**
- [ ] `index.js` 含 `buildCtxFromWhatsApp`；引用 → `ctx.attachment.payload`（type `TEXT`）
- [ ] `handleMessage(ctx)` 或等價簽名；handler 回 `{ reply }`；Adapter 執行 `sendMessage`
- [ ] `=記` + `ctx.attachment.payload='AI歌詞'` → `appData.notes.length === 1`
- [ ] 備忘錄完成後 `osState === 'IDLE'`
- [ ] `=記` 無引用且無參數 → `notesEmpty` 提示，不崩潰
- [ ] `=筆記 買鮮奶` 備用路徑可 Append
- [ ] 回覆寫「**黑貓備忘錄**」，**不**寫「已同步 iOS Notes」
- [ ] `python test/audit_hardcode.py` → `[PASS]`
- [ ] `node test/notes_v3.test.js` 全部通過
- [ ] `python test/verify.py` → `OVERALL: [PASS]`

---

### Phase 4 — 翻譯 API + 搜尋（Safari 殺手級 L0/L1）`[√]`

**產出：**
- `lib/plugins/translate.js`：接 `@vitalets/google-translate-api` 或同級；無 Key 時教學文案
- `lib/plugins/search.js`：L0 `google.com/search` 深連結；L1 最多 **3 行** `[店名]-[特色]-[地址]`
- `config/search-prompts.json` 骨架（L1 用）
- `test/translate_v3.test.js`、`test/search_v3.test.js`

**意圖隔離：** `=地圖`→導航連結；`=查` L0→Safari URL；`=查` L2 **AI 摘要留 WhatsApp**（Google AI 應用方式）；`translate`→譯文留 WhatsApp。

**驗證：** `python test/phase_v3_4_check.py`

**Checklist：**
- [ ] `translate.js` 譯文**在對話內回覆**；One-shot → `IDLE`
- [ ] 無 API Key 時回覆設定教學（文案在 `messages.json`）
- [ ] `=查 灣仔中菜` L0 回覆含 `google.com/search` 或等同（移交 Safari）
- [ ] L1 回覆不超過 3 行結果（有 Key 時），仍留 WhatsApp
- [ ] L2 BYOK LLM 回覆為**訊息文字**，非開啟外部 App
- [ ] 搜尋完成後 `osState === 'IDLE'`
- [ ] `python test/audit_hardcode.py` → `[PASS]`
- [ ] Node 行為測試通過
- [ ] `python test/verify.py` → `OVERALL: [PASS]`

---

### Phase 5 — 郵件 + 待辦 + 提醒（Clock）`[√]`

**產出：**
- `lib/plugins/mail.js`：**L0 `mailto:`** 預填收件人／內文（`email-routes.json`）；L1 可選 nodemailer BYOK
- `lib/plugins/todo.js`：`=待辦 晚上8點洗衣服` → 解析 + 確認一句
- `lib/plugins/clock.js`：**L0 深連結**（與地圖同哲學）— **禁止**伺服器 `setTimeout` 代為「時間到提醒」
- `config/email-routes.json` 範本
- `config/clock-urls.json`（可選）：行事曆／Shortcuts 連結模板

**Clock 產品定案（責任邊界）：** 黑貓**不承諾**送達提醒；只解析「時間＋事件」→ 產生連結 → 使用者在 **iOS 原生**（行事曆帶提醒／捷徑鬧鐘）自行確認設定。

**驗證：** `python test/phase_v3_5_check.py`

**Checklist：**
- [ ] `mail.js` L0 回覆含 `mailto:` 連結；使用者點擊開 **原生 Mail**
- [ ] `mail.js` 不讓使用者在 WhatsApp 內做郵件編輯器 UI
- [ ] 若有 nodemailer L1，回覆含 `mailSendDisclaimer`（不保證送達）
- [ ] `todo.js` Append 待辦；含時間語意時**附加**行事曆 Template 連結（非伺服器 ping）
- [ ] `todo.js` One-shot → `IDLE`
- [ ] `clock.js` **同步**組裝連結（無 await）；**不得** `setTimeout` 承諾 WhatsApp 回 ping
- [ ] `=提醒我 15分鐘後開會` → 回覆含可點擊連結（行事曆 Template URL 或文件化 Shortcuts L3）
- [ ] 回覆含 `clockHandoffDisclaimer`：「請點連結在 iPhone 確認鬧鐘／行事曆提醒」
- [ ] `messages.json` **禁止**「已為你設定提醒」「保證送達」「取代鬧鐘」
- [ ] 完成後 `osState === 'IDLE'`（One-shot）
- [ ] `python test/audit_hardcode.py` → `[PASS]`
- [ ] Node 行為測試通過
- [ ] `python test/verify.py` → `OVERALL: [PASS]`

---

### Phase 6 — 行事曆 + 相片 OCR + Tools Hub + 滿編選單 `[√]`

**產出：**
- `lib/plugins/calendar.js`：無 API → **L0** `calendarOpenNative` 連結；有 BYOK → 今／明 ≤3 筆唯讀快照＋連結移交 iOS
- `lib/plugins/photos.js`：收圖 → OCR 抓 TOTAL → 自動 `+金額` 進 `appData.calc`
- `config/tools-menu.json`：地圖、郵件、筆記、待辦、相片、時鐘、行事曆（**無簡訊**）
- `config/menu.json` 擴至 ≤7 項（含 **Tools Hub**、**Game Hub**、`=說明`／`0`）
- `config/bookmarks.json` 骨架（地圖書籤，選填）
- `index.js` Adapter 傳 `ctx.attachment`（type `IMAGE`）給 photos 插件

**驗證：** `python test/phase_v3_6_check.py`

**Checklist：**
- [ ] `calendar.js` 無 API 時回覆含可點擊之原生行事曆／新增行程連結
- [ ] `calendar.js` 禁止在對話內編輯行程；詳排程文案引導開 iOS Calendar
- [ ] `photos.js` OCR 結果**在對話回覆**；自動 `+金額` 入 calc；One-shot → `IDLE`
- [ ] Tools Hub 子選單可發現地圖／郵件等（不需記 `=地圖`）
- [ ] 主選單 `items.length` ≤ 7 且含 `GAME_HUB`
- [ ] 主選單 `0` 或 `=說明` 可列出指令表（由 `commands.json` 驅動）
- [ ] `python test/audit_hardcode.py` → `[PASS]`
- [ ] Node 行為測試通過
- [ ] `python test/verify.py` → `OVERALL: [PASS]`

---

### Phase 7 — 遊戲合流 + WhatsApp 連線層 `[√]`

**產出：**
- `lib/plugins/bubble_shooter.js`：薄 wrapper `require` 泡泡龍核心（或 Phase 7 Mock 透傳 `L`/`R`/`F`）
- `lib/plugins/game_hub.js` 升級：選遊戲 → `GAME_PLAYING`
- `lib/client.js`、`lib/login.js`（自 v1 移植）
- `index.js` 完整：`fromMe` 過濾 + Quoted Pipeline + `sendMessage`／佇列預留
- 實機：掃碼登入後 `=開始` 可操作

**驗證：** `python test/phase_v3_7_check.py` + 實機煙測

**Checklist：**
- [ ] `GAME_PLAYING` 下 `L`/`R`/`F`／`=123` 等**一律盲傳**遊戲，不進 `parse.js`
- [ ] `GAME_PLAYING` 下**僅** `=開始` 可跳出（鋼鐵特權驗收）
- [ ] `=開始` 從 `GAME_PLAYING` 回 `GAME_HUB` 或 `MENU`（依規格）
- [ ] `index.js` 第一行 `if (!msg.fromMe) return`
- [ ] `client.js` LocalAuth 可 instantiate
- [ ] `login.js` QR／配對碼可選
- [ ] 實機：`=開始` → 選單 → 計算機 `+500` 正確
- [ ] 實機：地圖 2-Click 或 Fast-track 可點開地圖連結
- [ ] `python test/audit_hardcode.py` → `[PASS]`
- [ ] `python test/verify_v3.py` → `OVERALL: [PASS]`
- [ ] `python test/verify.py` → `OVERALL: [PASS]`

---

### Phase 8 — WhatsApp Transport 正式驗收 `[√]`

**產出：**
- `lib/send-queue.js`：每 `principalId` 序列化 `sendMessage`（佇列預留）
- `index.js`：`deliverReply` + `enqueueSend`；`message_create` + `fromMe` + Quoted Pipeline
- `test/transport_v3.test.js`

**驗證：** `python test/phase_v3_8_check.py`

**Checklist：**
- [ ] `index.js` 使用 `message_create`（非 `message`）
- [ ] `if (!msg.fromMe) return` 過濾他人訊息
- [ ] `buildCtxFromWhatsApp` 處理引用／圖片
- [ ] `send-queue` 序列化送訊
- [ ] `python test/phase8_check.py` → `[PASS]`
- [ ] `python test/audit_hardcode.py` → `[PASS]`
- [ ] `python test/verify.py` → `OVERALL: [PASS]`

---

### Phase 9 — Mock 整合測試 `[√]`

**產出：**
- `test/phase9_mock_e2e.test.js`：v1 計算機全鏈 + V3 OS（選單／地圖／遊戲大廳／引用備忘）
- 覆蓋：session 隔離、未知指令不回覆、`/0` 不崩潰、全形 `＝開始`

**驗證：** `python test/phase_v3_9_check.py`

**Checklist：**
- [ ] mock e2e：`=開始` → 計算機 `+500` `+1200` 軌跡正確
- [ ] `修改`／`退回`／`=結束` 正確
- [ ] A／B 兩 chat session 獨立
- [ ] 他人訊息（`fromMe: false`）不回覆
- [ ] V3：`=地圖` Fast-track、`=說明`、`GAME_HUB` 擋 `+500`
- [ ] 引用 + `=記` 經 Transport 寫入備忘錄
- [ ] `python test/phase9_check.py` → `[PASS]`
- [ ] `python test/verify_v3.py` → `OVERALL: [PASS]`

**實機（手動）：** QR／配對碼登入後重跑上述流程。

---

## 檔案結構（V3 目標）

```
whatspp_Blackcat_OS/
├── V3OS需求文件.md
├── V3OS專案架構.md
├── V3OS工作記錄.md
├── index.js                      # WhatsApp Transport Adapter（Phase 3 → 7）
├── adapters/                     # Phase 7+ 規格伏筆（首發可不建目錄）
├── package.json
├── config/
│   ├── commands.json
│   ├── messages.json
│   ├── menu.json                 # Phase 0 骨架 → Phase 2 四項 → Phase 6 滿編
│   ├── plugins.json
│   ├── tools-menu.json           # Phase 6
│   ├── game-menu.json            # Phase 2／7
│   ├── email-routes.json         # Phase 5
│   ├── search-prompts.json       # Phase 4
│   └── bookmarks.json            # Phase 6 骨架
├── lib/
│   ├── ctx-contract.js           # Phase 0
│   ├── kernel-sanitizer.js       # Phase 1
│   ├── plugin-dispatch.js        # Phase 2
│   ├── plugins/
│   │   ├── maps.js               # Phase 2
│   │   ├── translate.js          # Phase 2 Mock → Phase 4 API
│   │   ├── game_hub.js           # Phase 2 → Phase 7
│   │   ├── notes.js              # Phase 3
│   │   ├── search.js             # Phase 4
│   │   ├── mail.js               # Phase 5
│   │   ├── todo.js               # Phase 5
│   │   ├── clock.js              # Phase 5
│   │   ├── calendar.js           # Phase 6
│   │   ├── photos.js             # Phase 6
│   │   └── bubble_shooter.js     # Phase 7
│   ├── session.js                # Phase 1
│   ├── handler.js                # Phase 1 → 各 Phase 擴充
│   ├── parse.js                  # Phase 0 複製 → Phase 1 擴充
│   ├── calc.js                   # v1 凍結
│   ├── format.js                 # v1
│   ├── messages.js               # v1
│   ├── client.js                 # Phase 7
│   └── login.js                  # Phase 7
├── docs/
│   └── PHASES_v3.md              # 本文件
└── test/
    ├── audit_hardcode.py
    ├── _verify_common.py
    ├── verify_v3.py
    ├── verify.py                 # v1 回歸（複製）
    ├── phase_v3_0_check.py … phase_v3_7_check.py
    ├── handler_v3_smoke.test.js
    └── verification_status.json
```

---

## 執行順序（嚴禁跳 Phase）

```
Phase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7
```

每 Phase 必須：**audit PASS + phase_v3_N PASS + verify.py PASS**。

---

## 如何在 Cursor 執行（一階一驗）

### Phase 0 啟動

```
請根據 docs/PHASES_v3.md，執行 Phase 0。
自 whatsapp_calculator 複製 v1 核心，建立 audit 與 config 契約。
單檔 ≤ 150 行。完成後執行 python test/phase_v3_0_check.py。
```

### Phase N 推進（N ≥ 1）

```
Phase {N-1} 驗證 PASS。
請實作 Phase {N} — 見 docs/PHASES_v3.md Checklist。
禁止手動勾選 [√]；以 python test/phase_v3_{N}_check.py 為準。
```

---

*配套文件：[V3OS需求文件.md](../V3OS需求文件.md) · [V3OS專案架構.md](../V3OS專案架構.md) · [whatsapp_calculator/PHASES.md](../whatsapp_calculator/PHASES.md)*
