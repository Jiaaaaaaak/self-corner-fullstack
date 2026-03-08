# 🚀 SELf-corner 專案啟動 SOP v5.0

本文件引導您啟動 **SELf-corner (AI 虛擬教師培訓平台)** 完整系統。

---

## 1. 系統組成
完整的 v5.0 系統需要啟動以下三個 Process：
1. **FastAPI 後端**: 處理認證、Session、報告生成。
2. **LiveKit Agent Worker**: 處理語音串流與 OpenAI Realtime API 介接。
3. **React 前端**: 用戶介面與 LiveKit 用戶端。

---

## 2. 環境預備
### 2.1 外部服務帳號
- **OpenAI API Key**: 需具備 Realtime API 權限。
- **LiveKit Server**: 可使用 LiveKit Cloud 或自行架設。

### 2.2 本地環境
- **Node.js**: v18+ (用於前端)
- **Python**: 3.11+ (用於後端與 Agent)
- **PostgreSQL**: 15+

---

## 3. 前端啟動步驟 (本目錄)
1. **安裝依賴**:
   ```bash
   npm install
   ```
2. **設定環境變數**:
   建立 `.env` 檔案並設定後端 API 地址與 LiveKit Server URL。
3. **啟動**:
   ```bash
   npm run dev
   ```

---

## 4. 後端與 Agent 啟動
*(請切換至對應目錄或確認後端服務已啟動)*
1. **後端啟動**:
   ```bash
   python main.py
   ```
2. **Agent 啟動**:
   ```bash
   python -m agents.voice_pipeline dev
   ```

---

## 5. 相關文件索引
若需深入了解系統細節，請參閱 `/docs` 目錄：
- **PRD**: `01_Product_Requirements_Document.md`
- **系統架構**: `02_System_Architecture.md`
- **API 規格**: `04_API_Specification.md`

---
**💡 提示**: 若您僅需預覽前端介面，可使用 Mock Data 模式運行（請確認代碼中已開啟 Mock 開關）。
