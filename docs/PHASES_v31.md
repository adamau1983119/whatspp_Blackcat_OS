# 分階實作計畫 — 黑貓輕量 OS（Version 3.1 · 群組聯動特區）

> 客戶需求見 **[V31OS需求文件.md](../V31OS需求文件.md)**  
> 架構見 **[V31OS專案架構.md](../V31OS專案架構.md)**  
> V3.0 基線 Phase 0～9 見 **[PHASES_v3.md](./PHASES_v3.md)**（**`[√]` 已凍結**）  
> V3.0 備份：`backups/whatspp_Blackcat_OS_v3.0-milestone_2026-06-09.zip`  
> 工作日誌見 **[V31OS工作記錄.md](../V31OS工作記錄.md)**

---

## V3.1 實作狀態（規格已完成，程式待開工）

| Phase | 主題 | Checklist | 驗收腳本 |
|-------|------|-----------|----------|
| 10 | OCR 斷路器 + 媒體閘門 | `[ ]` | `phase_v31_10_check.py` 待建立 |
| 11 | lastContext 北極星鏈 | `[ ]` | 待建立 |
| 12 | Tools Hub AI 第 8 項 | `[ ]` | 待建立 |
| 13 | 群組生存合約 | `[ ]` | 待建立 |
| 14 | llm-provider | `[ ]` | 待建立 |

---

## 原則（繼承 V3）

| 規則 | 說明 |
|------|------|
| **每階 ≤ 150 行** | 手寫 `index.js`、`lib/*.js`、`lib/plugins/*.js` |
| **一階一驗** | `python test/phase_v31_N_check.py` → **PASS** 才進下一階 |
| **硬編碼零容忍** | 每 Phase `python test/audit_hardcode.py` → **PASS** |
| **禁止手動勾選** | `[ ]` 為驗收標準；以 Python `RESULT: [PASS]` 為準 |
| **V3.0 不 regression** | 每階跑 `python test/verify_v3.py` + `python test/verify.py` |
| **群組生存合約** | Phase 10～14 均不得違反 [V31OS需求文件 §群組生存合約](../V31OS需求文件.md) |

---

## 驗證協議

### 每階交付流程

```
實作 Phase N（N=10..14）
    → 新增 test/phase_v31_N_check.py
    → 更新 test/verify_v31.py（或擴充 verify_v3.py 的 PHASE_SCRIPTS）
    → python test/audit_hardcode.py
    → python test/phase_v31_N_check.py
    → python test/verify_v31.py
    → python test/verify_v3.py
    → python test/verify.py
    → 寫入 test/verification_status.json
```

### 第三方檢查腳本狀態

| Phase | 腳本 | 狀態 |
|-------|------|------|
| 10 | `test/phase_v31_10_check.py` | 待建立 |
| 11 | `test/phase_v31_11_check.py` | 待建立 |
| 12 | `test/phase_v31_12_check.py` | 待建立 |
| 13 | `test/phase_v31_13_check.py` | 待建立 |
| 14 | `test/phase_v31_14_check.py` | 待建立 |

```powershell
python test\audit_hardcode.py
python test\phase_v31_10_check.py
python test\verify_v31.py
python test\verify_v3.py
python test\verify.py
```

---

## 建議執行順序

```
V3.0 Phase 9 [√] 已驗收
    → Phase 10（多媒體斷路器）— 實機穩定前置
    → Phase 11（lastContext 北極星鏈）
    → Phase 13（群組生存合約）— 可與 12 對調，但建議先開群前完成 10
    → Phase 12（Tools Hub AI 第 8 項）
    → Phase 14（llm-provider）
```

**嚴禁跳 Phase。** Phase 13 依賴 Phase 10 的媒體閘門。

---

## Phase 10 — 多媒體斷路器與 OCR 指令閘門 `[ ]`

**目標：** 損壞 JPEG／高頻群圖不得終止 process；僅 `=識` 觸發下載。

**產出：**
- `lib/ocr-run.js`（或 `extractTotalFromCtx`）：`try/catch`；錯誤記 log + 回 `null`
- `lib/whatsapp-adapter.js`：`downloadMedia` 前檢查 `text` 含 `=識`（或 `commands.json` 驅動之 photos 別名）
- `lib/handler-tools.js`：`routeImageReceipt` 要求 `cmd.type === 'SYS_PHOTOS'` 或 text 含 `=識`
- `config/messages.json`：`photosOcrFailed`、`photosOcrBusy`（若需要）
- `test/ocr_circuit.test.js`：mock 損壞 base64 → handler 不拋未捕獲例外
- `test/phase_v31_10_check.py`

**Checklist：**
- [ ] 餵無效圖片 payload → `extractTotalFromCtx` 回 `null`，**不** `process.exit`
- [ ] 群圖訊息 **無** `=識` → `buildCtxFromWhatsApp` 的 `attachment.hasAttachment === false`
- [ ] 訊息 `=識` + 圖片 → `attachment.type === 'IMAGE'` 且 payload 非空
- [ ] `routeImageReceipt`：純圖 + `UNKNOWN` → **不** dispatch photos
- [ ] `=識` + 圖 → OCR 路徑可達（mock media）
- [ ] `python test/audit_hardcode.py` → `[PASS]`
- [ ] Node 行為測試通過
- [ ] `python test/verify_v3.py` → `OVERALL: [PASS]`
- [ ] `python test/verify.py` → `OVERALL: [PASS]`

---

## Phase 11 — 北極星上下文鏈（lastContext）`[ ]`

**目標：** `=查` 後 `=地圖` 盲操；context 按 **群**（`principalId`）共用。

**產出：**
- `lib/session.js`：`appData.lastContext` 預設 `null`；輔助函式 `setLastContext`／`getLastContext`（可內聯於 session 若 ≤150 行）
- `lib/plugins/search.js`：成功查詢後 `setLastContext(principalId, { kind:'SEARCH', query, triggeredBy: ctx.senderId })`
- `lib/plugins/maps.js`：payload 空時讀 `getLastContext(principalId).query`
- `lib/plugins/calendar.js`（可選）：簡易時間詞 + `lastContext.query` 組 L0 連結
- `config/messages.json`：`mapsNoContext`、`lastContextHint`（可選）
- `test/phase11_northstar.test.js`：`=查 銅鑼灣` → `=地圖` → 回覆含 `銅鑼灣`
- `test/phase_v31_11_check.py`

**Checklist：**
- [ ] `=查 foo` 後 `session.appData.lastContext.query` 含 `foo`
- [ ] `=地圖`（無 payload）→ 使用 lastContext 組 maps URL
- [ ] 無 lastContext 時 `=地圖` → `mapsPrompt` 或 `mapsNoContext`
- [ ] A 群與 B 群 `lastContext` **隔離**（不同 principalId）
- [ ] 同一群內 B 覆蓋 A 的 query → maps 讀到 B 的焦點（**預期行為**）
- [ ] `senderId` 未實作時 `triggeredBy` 可為空字串（Phase 13 再補）
- [ ] `python test/audit_hardcode.py` → `[PASS]`
- [ ] `phase11_northstar.test.js` PASS
- [ ] `python test/verify_v3.py` → `OVERALL: [PASS]`
- [ ] `python test/verify.py` → `OVERALL: [PASS]`

---

## Phase 12 — Tools Hub 第 8 項 AI `[ ]`

**目標：** 主選單 `=開始`→`2`→`8` 進入搜尋／AI；回覆標示模式。

**產出：**
- `config/tools-menu.json`：新增 `{ "index": "8", "type": "SYS_SEARCH_ASK", … }`（或 `SYS_SEARCH` + 子流程，文件化）
- `lib/handler-tools.js`：`/^[1-8]$/`；第 8 項進入搜尋提示或 `PROMPT_GUARD`
- `config/messages.json`：`searchModeLink`、`searchModeAi` 前綴標記
- `lib/plugins/search.js`：L0 回覆加 `[Link Mode]`；L2 加 `[AI Mode]`（經 `t()` key）
- `test/phase_v31_12_check.py`

**Checklist：**
- [ ] `tools-menu.json` 含 index `8` 且 `items.length === 8`
- [ ] `=開始`→`2`→`8` → 搜尋提示或接受關鍵字
- [ ] L0 回覆含 Link Mode 標記（`messages.json` key，非硬編碼）
- [ ] L2（有 `AI_API_KEY` mock）回覆含 AI Mode 標記
- [ ] 無 Key 時降級 L0，不崩潰
- [ ] `python test/audit_hardcode.py` → `[PASS]`
- [ ] Node 行為測試通過
- [ ] `python test/verify_v3.py` → `OVERALL: [PASS]`

---

## Phase 13 — 群組生存合約（ALLOWED_GROUPS + senderId）`[ ]`

**目標：** 白名單群內組員可發 `=` 指令；未白名單與 V3.0 行為一致。

**產出：**
- `lib/group-gate.js`：`parseAllowedGroups()`、`shouldProcessMessage(msg)`、`resolvePrincipalId(msg)`、`resolveSenderId(msg)`
- `lib/kernel-sanitizer.js`：保留 `senderId` 欄位
- `lib/whatsapp-adapter.js`：使用 gate 的 principalId／senderId；與 Phase 10 媒體閘門一致
- `index.js`：`if (!shouldProcessMessage(msg)) return`
- `config/messages.json`：`groupNotAllowed`、`groupSizeExceeded`
- 更新 `test/transport_v3.test.js`：白名單群 `fromMe:false` + `=查` 有 reply
- `test/group_gate.test.js`
- `test/phase_v31_13_check.py`

**Checklist：**
- [ ] **未設** `ALLOWED_GROUPS`：`fromMe:false` → 不處理（與 Phase 9 一致）
- [ ] **設** `ALLOWED_GROUPS=群ID`：他人 `=查 test` → handler 被呼叫且有 reply
- [ ] 他人閒聊「你好」→ 不處理
- [ ] 本人 `fromMe:true` 任意群 → 仍處理（不受白名單限制）
- [ ] `ctx.principalId`：本人發群用 `msg.to`；他人發群用 `msg.from`
- [ ] `ctx.senderId` 在群訊息非空（mock `author`）
- [ ] `MAX_GROUP_SIZE=6` 且 mock 7 人 → 非 fromMe 指令拒絕 + 文案
- [ ] 仍使用 `message_create`（**非** `message`）
- [ ] `python test/audit_hardcode.py` → `[PASS]`
- [ ] `transport_v3.test.js` 更新案例 PASS
- [ ] `python test/verify_v3.py` → `OVERALL: [PASS]`（含 Phase 9 無 env regression）
- [ ] `python test/verify.py` → `OVERALL: [PASS]`

**實機（手動）：**
- [ ] `.env` 設 `ALLOWED_GROUPS=實測群@g.us`
- [ ] 另一位組員發 `=查 灣仔` 有回覆
- [ ] 組員發純圖無 `=識` → bot 無動作

---

## Phase 14 — LLM 供應商抽象 `[ ]`

**目標：** `search-llm.js` 不直連供應商；可換 OpenAI／未來 Gemini。

**產出：**
- `lib/llm-provider.js`：`async function complete({ system, user, maxTokens })` → string | null
- `lib/search-llm.js`：改為 `require('./llm-provider')`
- `test/llm_provider.test.js`：mock provider；無 key 回 null
- `test/phase_v31_14_check.py`

**Checklist：**
- [ ] `search-llm.js` 無直接 `openai`／`fetch` 至特定 URL（除 provider 內）
- [ ] 無 `AI_API_KEY` → `complete` 回 null；搜尋降級 L0/L1
- [ ] 有 Key mock → L2 路徑仍通
- [ ] `llm-provider.js` ≤ 150 行
- [ ] `python test/audit_hardcode.py` → `[PASS]`
- [ ] `python test/verify_v31.py` → **V3.1 OVERALL [PASS]**
- [ ] `python test/verify_v3.py` → `OVERALL: [PASS]`
- [ ] `python test/verify.py` → `OVERALL: [PASS]`

---

## V3.1 全期驗收（Phase 14 完成後）

| # | 項目 |
|---|------|
| 1 | 群組生存合約 G1～G8 逐條人工對照 |
| 2 | 北極星 E2E：實機或 mock `=查`→`=地圖` |
| 3 | 損壞圖片不殺 process |
| 4 | 未設 `ALLOWED_GROUPS` 與 V3.0 行為一致 |
| 5 | 建議打 git tag `v3.1.0` |

---

## 如何在 Cursor 執行

### Phase 10 啟動

```
V3.0 Phase 9 已 PASS。
請根據 docs/PHASES_v31.md 實作 Phase 10（OCR 斷路器 + 媒體指令閘門）。
單檔 ≤ 150 行。完成後 python test/phase_v31_10_check.py。
```

### Phase N 推進（11～14）

```
Phase {N-1} 驗證 PASS。
請實作 Phase {N} — 見 docs/PHASES_v31.md Checklist。
禁止手動勾選 [√]；以 python test/phase_v31_{N}_check.py 為準。
須滿足群組生存合約。
```

---

*配套文件：[V31OS需求文件.md](../V31OS需求文件.md) · [V31OS專案架構.md](../V31OS專案架構.md) · [PHASES_v3.md](./PHASES_v3.md)*
