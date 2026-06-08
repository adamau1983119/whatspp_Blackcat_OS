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

*（以下請只追加新日期段落，勿刪改上方內容）*
