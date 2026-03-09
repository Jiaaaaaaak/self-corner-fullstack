# 🏫 SELf-corner: AI 虛擬教師培訓平台

一個透過 AI 模擬學生對話，幫助教師練習溝通技巧的專業培訓平台。

## 🚀 專案簡介
本平台結合了 **OpenAI Realtime API** 與 **LiveKit** 技術，提供低延遲、高擬真的語音與文字互動體驗。教師能在零風險的環境中演練處理學生情緒、衝突管理等情境，並在結束後獲得基於 **SEL (社會情緒學習)** 與 **KIST 對話卡** 框架的深度回饋。

## 🛠️ 技術棧
- **Frontend**: React 18 (TypeScript) + Vite + shadcn/ui + Tailwind CSS
- **State Management**: Zustand + TanStack Query
- **Real-time**: LiveKit (WebRTC)
- **AI**: OpenAI Realtime API (gpt-4o) + Coach LLM (gpt-4o)
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL + SQLAlchemy

## 📂 文件導覽
詳細的規格與技術細節請參閱 `/docs` 目錄：
- [產品需求文件 (PRD)](docs/01_Product_Requirements_Document.md)
- [系統架構設計](docs/02_System_Architecture.md)
- [系統詳細設計](docs/03_System_Design.md)
- [API 規格說明](docs/04_API_Specification.md)
- [資料模型設計](docs/05_Data_Models.md)

## 🏃 快速啟動 (前端)
1. **安裝依賴**:
   ```bash
   npm install
   ```
2. **啟動開發伺服器**:
   ```bash
   npm run dev
   ```
3. **瀏覽**: 開啟 `http://localhost:5173`

> **注意**: 本前端專案需搭配後端 API 與 LiveKit Server 運行。詳細啟動 SOP 請參閱 [STARTUP_SOP.md](STARTUP_SOP.md)。

---
*本專案目前處於 v5.0 開發階段，詳細進度請參考 PRD。*
