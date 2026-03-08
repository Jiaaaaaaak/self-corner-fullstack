# 系統架構文件 (System Architecture) v5.0

- **最近更新日期**: 2026-02-28
- **版本**: 5.0

## 1. 架構概覽

本專案採用前後端分離架構，需同時運行三個獨立 Process。系統核心透過 LiveKit 實現 WebRTC 語音串流與 Data Channel 文字互動，並串接 OpenAI Realtime API 以達成低延遲的 AI 互動體驗。

### 三個必要 Process

| Process | 啟動指令 | 說明 |
| :--- | :--- | :--- |
| FastAPI 後端 | `python main.py` | port 8000 |
| LiveKit Agent Worker | `python -m agents.voice_pipeline dev` | 等待 LiveKit 房間有參與者時自動 dispatch |
| React 前端 | `npm run dev`（在 `web_client/`） | port 8080 |

## 2. 系統架構圖

```
┌─────────────────────────────────────────────────┐
│              Frontend (React + Vite)             │
│  Login │ Home │ Chatroom │ Feedback │ History    │
└──────────────────┬──────────────────────────────┘
                   │ REST API (Axios + HttpOnly Cookie)
┌──────────────────▼──────────────────────────────┐
│              Backend (FastAPI, port 8000)         │
│  /auth  /session  /livekit  /report  /history   │
└──────┬──────────────────────────┬───────────────┘
       │ SQLAlchemy (async)        │ LangChain → OpenAI gpt-4o
┌──────▼──────┐          ┌────────▼────────────────┐
│ PostgreSQL  │          │ Coach LLM（Session 結束） │
│  8 資料表   │          └─────────────────────────┘
└─────────────┘
       ▲
┌──────┴───────────────────────────────────────────┐
│         LiveKit Agent Worker (Python)             │
│  StudentVoicePipeline                             │
│  WebSocket → OpenAI Realtime API                  │
│  (STT + LLM推理 + TTS + semantic_analysis tool)   │
└──────────────────────────────────────────────────┘
       ▲ WebRTC (語音) + data channel (文字/逐字稿)
┌──────┴──────────────────────────────────────────┐
│       Browser (LiveKit SDK, livekit-client 2.x)  │
│  麥克風音訊 / 遠端學生語音播放 / 對話框          │
└─────────────────────────────────────────────────┘
```

## 3. 核心元件說明

### 3.1 Frontend (React + Vite)
- 負責 UI/UX，使用 `shadcn/ui` 與 `Tailwind CSS`。
- 整合 `livekit-client` SDK 處理 WebRTC 連線。
- 使用 `Zustand` 管理全局狀態（如登入資訊、Session UUID）。
- `TanStack Query` 處理伺服器狀態與快取。

### 3.2 Backend (FastAPI)
- 處理用戶認證（JWT + HttpOnly Cookie）。
- 提供 LiveKit 連線所需之 Token（由 `livekit-server` 核發）。
- 管理 Session 生命週期與資料庫存取。
- Session 結束時，負責呼叫 Coach LLM 生成回饋報告。

### 3.3 LiveKit Agent Worker
- 基於 LiveKit Python SDK 的 Agent。
- 負責維持與 OpenAI Realtime API 的 WebSocket 連線。
- 實現 `StudentVoicePipeline`，處理老師語音/文字輸入，並回傳學生回應。
- 呼叫 `semantic_analysis` 工具進行即時情緒分析。

### 3.4 Data Storage (PostgreSQL)
- 使用 SQLAlchemy 2.0 非同步模式。
- 儲存用戶、情境、對話紀錄、情緒分析與回饋報告。

## 4. 關鍵技術決策

- **LiveKit 代替純 WebSocket**: 為了更優雅地處理 WebRTC 語音串流、自動重連與 Agent 調度。
- **OpenAI Realtime API**: 降低 STT -> LLM -> TTS 的端到端延遲，提供擬真的語音對話體驗。
- **HttpOnly Cookie**: 強化 JWT 的安全性，防止 XSS 攻擊竊取 Token。
- **無 Redis/VectorDB (目前)**: 簡化初期部署，對話歷史直接儲存於 PostgreSQL，理論知識庫目前寫入於 Prompt 中（未來計畫引入 RAG）。
