# SELf-Corner

> AI 虛擬教師培訓平台 — 讓教師在零風險環境中，透過語音對話練習 SEL 輔導技巧

---

## 專案簡介

SELf-Corner 是一個以「社會情緒學習（SEL）」為核心的 AI 互動訓練平台。教師可在平台上選擇真實情境（如學生考試失利、同儕衝突、情緒崩潰），與 AI 虛擬學生進行即時語音對話練習，對話結束後由 AI 教練根據薩提爾溝通模式與 KIST 12 張對話卡，提供個人化的 SEL 評分與改進建議。

### 核心特點

- **雙模式輸入**：支援語音（LiveKit WebRTC + OpenAI Realtime API）與文字輸入，兩者皆可觸發 AI 學生語音回應，可自由切換
- **情境與個性配對**：10 個 SEL 情境 × 5 種學生個性隨機組合，每次體驗皆不同
- **逐輪情緒分析**：每輪師生對話即時分析教師話語對學生的情緒影響（9 維度分數）
- **教練式回饋**：對話結束後一次性生成 SEL 五維雷達圖評分、KIST 對話卡分析、條列式改進建議
- **回顧討論**：Feedback 頁面的 AI 教練擁有完整對話逐字稿與報告 Context，可深度問答

---

## 技術架構

```
┌─────────────────────────────────────────────────┐
│              Frontend (React + Vite)             │
│  Login │ Home │ Chatroom │ Feedback │ History    │
└──────────────────┬──────────────────────────────┘
                   │ REST API (Axios + Cookie Auth)
┌──────────────────▼──────────────────────────────┐
│              Backend (FastAPI)                   │
│  /auth  /session  /livekit  /report  /history   │
└──────┬──────────────────────────┬───────────────┘
       │ SQLAlchemy (async)        │ LangChain
┌──────▼──────┐          ┌────────▼────────────────┐
│ PostgreSQL  │          │ OpenAI GPT-4o (Coach)    │
│  7 資料表   │          │ GPT-3.5 (情緒分析)       │
└─────────────┘          └─────────────────────────┘
                                   ▲
┌──────────────────────────────────┴───────────────┐
│         LiveKit Agent Worker (Python)            │
│  StudentVoicePipeline                            │
│  OpenAI Realtime API (gpt-4o-realtime-preview)   │
└──────────────────────────────────────────────────┘
```

| 層級 | 技術 |
|------|------|
| 前端框架 | React 18 + TypeScript + Vite |
| UI 元件 | shadcn/ui + Tailwind CSS |
| 狀態管理 | TanStack Query + Zustand |
| 後端 API | FastAPI (Python 3.11+) |
| 資料庫 | PostgreSQL + SQLAlchemy 2.0 (async) |
| 即時通訊 | LiveKit (WebRTC) |
| 語音 AI | OpenAI Realtime API (`gpt-4o-realtime-preview-2024-12-17`) |
| 教練 AI | OpenAI `gpt-4o` |
| 情緒分析 | OpenAI `gpt-3.5-turbo` |
| 認證 | JWT (HttpOnly Cookie) + Refresh Token Rotation |

---

## 目錄結構

```
SELf-Corner/
├── main.py                    # FastAPI 主程式入口
├── database.py                # 資料庫連線配置
├── models.py                  # SQLAlchemy ORM 資料表定義
├── seed_data.py               # 初始資料（情境 + 學生個性）
├── requirements.txt           # Python 依賴套件
├── .env                       # 環境變數（不納入版控）
├── .env.example               # 環境變數範本
│
├── api/                       # API 路由層
│   ├── auth.py                # 認證（登入/註冊/刷新/登出）
│   ├── session.py             # Session 建立與結束（含教練分析觸發）
│   ├── livekit_token.py       # LiveKit Token 生成
│   ├── report.py              # 回饋報告取得 + 教練對話
│   ├── history.py             # 歷史紀錄查詢
│   └── scenario.py            # 情境列表
│
├── agents/                    # AI Agent 層
│   ├── prompts.py             # 動態 Prompt 組裝（情境 + 個性注入）
│   └── voice_pipeline.py      # StudentVoicePipeline（LiveKit ↔ Realtime API）
│
├── core/                      # 核心邏輯
│   ├── auth_module.py         # JWT / bcrypt / LiveKit Token 工具
│   └── session_manager.py     # Session 生命週期管理
│
├── services/
│   └── db_manager.py          # 資料庫 CRUD 封裝
│
├── utils/
│   └── logger.py              # 逐字稿匯出工具
│
└── web_client/                # 前端（React + TypeScript）
    └── src/
        ├── lib/
        │   ├── api.ts         # Axios 實例 + 401 自動刷新攔截器
        │   └── auth.ts        # Zustand 登入狀態 Store
        ├── pages/             # 7 個路由頁面
        └── components/        # UI 元件（含 ChatPanel LiveKit 整合）
```

---

## 資料庫結構

```
scenarios              # 情境資料庫（預填 10 筆）
student_personalities  # 學生個性資料庫（預填 5 種）
users                  # 使用者帳號
refresh_tokens         # Refresh Token（Token Rotation）
sessions               # 對話 Session（含 scenario_id, personality_id）
transcripts            # 師生對話逐字稿
emotion_logs           # 逐輪情緒分析記錄（9 維度）
feedback_reports       # 教練回饋報告（SEL 分數 + 分析 + 建議）
```

---

## SEL 五大核心能力

本平台依據 CASEL 框架設計情境與評分：

| 能力 | 說明 |
|------|------|
| **自我覺察** | 辨識自身情緒、想法及其對行為的影響 |
| **自我管理** | 情緒調節、目標設定、自律 |
| **社會覺察** | 理解他人觀點、展現同理心 |
| **關係技巧** | 積極傾聽、清晰溝通、建設性衝突解決 |
| **負責任的決策** | 基於道德與社會規範做出建設性行為選擇 |

---

## 版本資訊

- PRD 版本：v4.0（2026-02-28）
- 後端版本：1.0.0
