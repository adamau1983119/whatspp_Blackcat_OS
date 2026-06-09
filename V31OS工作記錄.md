# 工作記錄（Version 3.1 — 黑貓輕量 OS · 群組聯動特區）

> **規則：** 只追加新段落，**禁止**刪改或覆寫既有紀錄。  
> 專案路徑：`D:\Users\Ophelia Chan\Desktop\MY Project\whatspp_Blackcat_OS`  
> V3.0 歷史紀錄見 **[V3OS工作記錄.md](./V3OS工作記錄.md)**（Phase 0～9）

---

## V31OS 文件索引

| 文件 | 用途 |
|------|------|
| [V31OS需求文件.md](./V31OS需求文件.md) | V3.1 需求、群組生存合約、F10～F14 |
| [V31OS專案架構.md](./V31OS專案架構.md) | Transport 閘門、lastContext、目錄增量 |
| [docs/PHASES_v31.md](./docs/PHASES_v31.md) | Phase 10～14 原子 Checklist |
| [V31OS工作記錄.md](./V31OS工作記錄.md) | 本文件 |
| [V3OS需求文件.md](./V3OS需求文件.md) | V3.0 基線（保留） |

---

## 2026-06-09（V3.1 規格定案 — 群組生存合約）

### 一、版本宣告

| 項目 | 內容 |
|------|------|
| 版本 | **Version 3.1**（增量於 V3.0 Phase 0～9 已驗收基線） |
| 代號 | 群組聯動特區 / Group Survival Contract |
| 北極星場景 | 小型聚餐群：`=查` → `=地圖` → `=行程` |
| 對外規模 | 技術可辨識發送者；**產品授權 ≤6 人**小型群 |

### 二、討論結論摘要

| 主題 | 定案 |
|------|------|
| 認組員 | `whatsapp-web.js` 可取得 `msg.author`；難點在風控非 API |
| `lastContext` | **按群（`principalId`）共用**，不按人分片 |
| 群組觸發 | `ALLOWED_GROUPS` 白名單；未設則維持 V3.0「僅 fromMe」 |
| 媒體 | **禁止**自動 OCR；僅 `=識` 主動觸發 |
| 事件 | 沿用 **`message_create`**，不雙訂閱 `message` |
| `principalId` | 本人發群 `msg.to`；他人發群 `msg.from` |
| Redis | V3.1 **不引入**；in-memory 足夠 |
| AI 成本 | BYOK + 小群 + `=` 閘門 → 月費可忽略級 |

### 三、群組生存合約（G1～G8）

已寫入 `V31OS需求文件.md` §群組生存合約。對外一句話：

> V3.1 僅在 `ALLOWED_GROUPS` 授權、建議 ≤6 人的群組運行，且只處理 `=` 指令、不自動掃描所有 share。

### 四、Phase 路線（V3.1）

| Phase | 主題 | 優先 |
|-------|------|------|
| 10 | OCR 斷路器 + 媒體指令閘門 | **P0.5** 實機穩定 |
| 11 | `lastContext` + 北極星鏈 | **P0** |
| 12 | Tools Hub 第 8 項 AI | P1 |
| 13 | `ALLOWED_GROUPS` + `senderId` | **P2** |
| 14 | `llm-provider.js` | P3 |

**建議實作順序：** 10 → 11 → 13 → 12 → 14

### 五、已建立文件

| 檔案 | 說明 |
|------|------|
| `V31OS需求文件.md` | V3.1 需求規格 |
| `V31OS專案架構.md` | 架構增量與模組落點 |
| `docs/PHASES_v31.md` | Phase 10～14 Checklist |
| `V31OS工作記錄.md` | 本文件 |

V3OS 三件套**保留不刪**，作為 V3.0 里程碑歷史。

### 六、程式現況（定案時快照）

| 項目 | 現況 | V3.1 目標 |
|------|------|-----------|
| `index.js` | `if (!msg.fromMe) return` | `group-gate` |
| `whatsapp-adapter.js` | 無條件 `downloadMedia` | `=識` 閘門 |
| `session.js` | 無 `lastContext` | `appData.lastContext` |
| `maps.js` | 必須帶地點 | 盲操讀 context |
| `tools-menu.json` | 7 項 | 8 項含 AI |
| `ocr-run.js` | 未捕獲錯誤可殺 process | 斷路器 |

### 七、待辦（Phase 10 前）

| 優先 | 項目 | 狀態 |
|------|------|------|
| 1 | 實作 Phase 10 OCR 斷路器 | 待辦 |
| 2 | `test/phase_v31_10_check.py` + `verify_v31.py` 骨架 | 待辦 |
| 3 | Phase 11 `lastContext` + northstar E2E | 待辦 |
| 4 | Phase 13 群組 gate（實機需 `ALLOWED_GROUPS`） | 待辦 |
| 5 | 實機：≤6 人測試群煙測 | 待辦 |

### 八、V3.0 基線驗收（繼承）

| 驗證 | 結果（2026-06-08 里程碑） |
|------|---------------------------|
| `python test/verify_v3.py` | Phase 0～9 **OVERALL [PASS]** |
| `python test/verify.py` | v1 計算機 **OVERALL [PASS]** |
| `python test/audit_hardcode.py` | **[PASS]** |

V3.1 每階須維持上述三項不 regression。

---

## 2026-06-09（V3.0 里程碑備份 — V3.1 開工前）

### 備份

| 項目 | 路徑 |
|------|------|
| V3.0 里程碑 ZIP | `D:\Users\Ophelia Chan\Desktop\MY Project\backups\whatspp_Blackcat_OS_v3.0-milestone_2026-06-09.zip` |

本備份含 V3.1 規格文件（本四件套）與郵件／回音防護等 WIP 程式；**V3.1 Phase 10 程式尚未實作**。

### Checklist 狀態

| 文件 | Phase 0～9 | Phase 10～14 |
|------|------------|--------------|
| `PHASES_v3.md` | 標題 **`[√]`** 已凍結 | — |
| `PHASES_v31.md` | — | **`[ ]`** 待實作（規格已完成） |

### 下一步

依 `PHASES_v31.md` 建議順序：**Phase 10**（OCR 斷路器 + `=識` 媒體閘門）。

---

## 2026-06-09（Git 現況澄清 — 尚未提交 V3.1）

| 項目 | 狀態 |
|------|------|
| GitHub 遠端 | 已有 repo；**僅 3 commits**（最新 `6ca8f13` docs: record Phase 1-9…） |
| 遠端可見 | V3OS 三件套 + Phase 1～9 程式骨架；**無** V31OS 文件、`PHASES_v31.md` |
| 本機工作樹 | V3.1 規格、郵件改版、`bot-reply-guard` 等 → **全部未 commit** |
| 安全網 | 以 **`backups/whatspp_Blackcat_OS_v3.0-milestone_2026-06-09.zip`** 為準（不依賴 Git） |

**結論：** V3.1 里程碑**尚未上 Git**；開工 Phase 10 前可先 commit 規格，或維持僅 ZIP 備份。  
**勿提交：** `chi_tra.traineddata`、`eng.traineddata`、`.wwebjs_auth*`（應在 `.gitignore`）。

---

*（以下請只追加新日期段落，勿刪改上方內容）*
