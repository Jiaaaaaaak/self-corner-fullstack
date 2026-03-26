# SELf-Corner

> AI 虛擬教師培訓平台 — 讓教師在零風險環境中，透過語音對話練習 SEL 輔導技巧

---

## 專案簡介

SELf-Corner 是一個以「社會情緒學習（SEL）」為核心的 AI 互動訓練平台。教師可在平台上選擇真實情境（如學生考試失利、同儕衝突、情緒崩潰），與 AI 虛擬學生進行即時語音對話練習，對話結束後由 AI 教練根據薩提爾溝通模式與 KIST 12 張對話卡，提供個人化的 SEL 評分與改進建議。

### 核心特點

- **雙模式輸入**：支援語音（LiveKit WebRTC + OpenAI Realtime API）與文字輸入，兩者皆可觸發 AI 學生語音回應，可自由切換
- **情境與個性配對**：16 個 SEL 情境 × 10 種學生個性，可自選個性與年級或隨機抽取；10 個真實學生角色立繪隨情緒即時切換
- **逐輪情緒分析**：每輪師生對話即時分析教師話語對學生的情緒影響（9 維度分數），採漸進模式（每輪變化限制 ±0.20），從各情境的情緒初始值開始累積，確保情緒變化自然流暢
- **教練式回饋**：對話結束後一次性生成 SEL 五維雷達圖評分、KIST 對話卡分析、條列式改進建議
- **回顧討論**：Feedback 頁面的 AI 教練擁有完整對話逐字稿、情境說明、逐輪情緒變化歷程與報告 Context，可深度問答
- **完整認證系統**：支援帳號密碼註冊（含 Email 驗證）、Google OAuth 登入、忘記密碼重設

---

## 開始使用

### 📖 完整安裝與啟動指南

> 請先閱讀 **[`usage_guide.md`](usage_guide.md)**
>
> 涵蓋：環境需求、venv 建置位置、SMTP 寄信設定、資料庫初始化、三個終端機的啟動順序、常見問題排解。

### 🤖 使用 Claude Code 協助開發

> 如果你使用 Claude Code（claude.ai/code）或其他 AI 輔助開發工具，請將 **[`CLAUDE.md`](CLAUDE.md)** 提供給 AI 作為上下文。
>
> 涵蓋：完整架構說明、關鍵資料流、已知開發陷阱（Realtime API 格式、bcrypt 版本、ScrollArea 限制等）、各版本 API 變更紀錄。

---

## 技術架構

```
┌─────────────────────────────────────────────────┐
│              Frontend (React + Vite)             │
│  Login │ Home │ Chatroom │ Feedback │ History    │
│  VerifyEmail │ ResetPassword                     │
└──────────────────┬──────────────────────────────┘
                   │ REST API (Axios + Cookie Auth)
┌──────────────────▼──────────────────────────────┐
│              Backend (FastAPI)                   │
│  /auth  /session  /livekit  /report  /history   │
│  /scenarios  /personalities  /grade-levels       │
└──────┬──────────────────────────┬───────────────┘
       │ SQLAlchemy (async)        │ LangChain
┌──────▼──────┐          ┌────────▼────────────────┐
│ PostgreSQL  │          │ OpenAI GPT-4o (Coach)    │
│  11 資料表  │          │ GPT-3.5 (情緒分析)       │
└─────────────┘          └─────────────────────────┘
                                   ▲
┌──────────────────────────────────┴───────────────┐
│         LiveKit Agent Worker (Python)            │
│  StudentVoicePipeline                            │
│  OpenAI Realtime API (gpt-4o-realtime-preview)   │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│           Gmail SMTP (aiosmtplib)                │
│  驗證信 │ 密碼重設信                              │
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
| 認證 | JWT (HttpOnly Cookie) + Refresh Token Rotation + Google OAuth |
| Email 寄送 | Gmail SMTP + aiosmtplib（驗證信、密碼重設信） |

---

## 目錄結構

```
ai-classroom/
├── README.md                      # 本文件
├── CLAUDE.md                      # Claude Code 開發指南
├── usage_guide.md                 # 安裝與使用指南
├── .gitignore
├── .github/
│   └── CODEOWNERS.txt
│
├── docs/                          # 文件
│   ├── PRD.md                     # 產品需求文件
│   ├── WBS.md                     # 工作分解結構
│   ├── 0_GIT_GUIDE.md             # Git 工作流程指南
│   └── 1_TEAM_RULES.md            # 團隊協作規範
│
├── backend/                       # Python 後端（FastAPI + LiveKit Agent）
│   ├── docs/                      # 後端技術文件
│   │   ├── custom_types.md        # TypeScript 型別定義說明
│   │   └── seed_update_2026-03-10.md  # Seed 資料更新紀錄
│   ├── main.py                    # FastAPI 主程式入口（port 8000）
│   ├── database.py                # 資料庫連線配置（SQLAlchemy async）
│   ├── models.py                  # ORM 資料表定義（11 張表）
│   ├── seed_data.py               # 初始資料（10 個情境 + 5 種學生個性）
│   ├── requirements.txt           # Python 依賴套件
│   ├── .env.example               # 環境變數範本
│   │
│   ├── api/                       # REST API 路由層
│   │   ├── auth.py                # 認證（登入 / 註冊 / 登出 / Email 驗證 / 密碼重設 / Google OAuth）
│   │   ├── session.py             # Session 建立與結束（含教練分析觸發）
│   │   ├── livekit_token.py       # LiveKit Token 生成
│   │   ├── report.py              # 回饋報告取得 + 教練對話
│   │   ├── history.py             # 歷史紀錄查詢
│   │   ├── scenario.py            # 情境列表
│   │   ├── personality.py         # 學生個性列表（GET /personalities）
│   │   └── grade.py               # 年級資訊列表（GET /grade-levels）
│   │
│   ├── agents/                    # AI Agent 層
│   │   ├── prompts.py             # 動態 Prompt 組裝（情境 + 個性注入）
│   │   ├── voice_pipeline.py      # StudentVoicePipeline（LiveKit ↔ Realtime API）
│   │   └── expert_agent_template.py  # 獨立 Gemini 分析 Agent 模板（實驗用）
│   │
│   ├── core/                      # 核心邏輯
│   │   ├── auth_module.py         # JWT / bcrypt / LiveKit Token 工具
│   │   └── session_manager.py     # Session 生命週期管理
│   │
│   ├── services/
│   │   ├── db_manager.py          # 資料庫 CRUD 封裝
│   │   ├── email_service.py       # SMTP 寄信服務（驗證信、密碼重設信）
│   │   └── oauth.py               # Google OAuth 工具（授權 URL、Token 交換、驗證）
│   │
│   └── utils/
│       └── logger.py              # 逐字稿匯出工具
│
└── frontend/                      # React + TypeScript 前端（port 8080）
    ├── index.html
    ├── package.json               # 依賴（React 18、shadcn/ui、livekit-client 等）
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── .env.example               # 前端環境變數範本
    ├── public/
    │   ├── avatars/               # 10 個學生角色頭像（品妍、宇傑、宇翔...）
    │   ├── img/
    │   │   ├── students/          # 10 角色 × 9 情緒 = 90 張全身立繪
    │   │   └── logo/              # 平台 Logo
    │   └── favicon.png
    │
    └── src/
        ├── App.tsx                # 路由設定 + ProtectedRoute + AuthInitializer
        ├── lib/
        │   ├── api.ts             # Axios 實例 + 401 自動刷新攔截器
        │   ├── auth.ts            # Zustand 登入狀態 Store
        │   ├── collectionData.ts  # SEL 能力群組定義（CompetencyGroup、buildCompetencyGroups）
        │   ├── studentCharacter.ts # 虛擬學生角色圖片路徑管理（情緒立繪 + 頭像）
        │   ├── soulCardSfx.ts     # KIST 對話卡 SFX（Web Audio API 合成）
        │   └── utils.ts           # shadcn/ui 工具函式（cn）
        ├── hooks/                 # React 自訂 Hooks
        │   ├── use-mobile.tsx     # 響應式行動裝置偵測
        │   └── use-toast.ts       # Toast 通知 Hook
        ├── assets/
        │   └── classroom-background.png  # 對話空間背景圖
        ├── pages/                 # 9 個路由頁面
        │   ├── Login.tsx          # 登入 + 註冊（含等待驗證畫面）+ 忘記密碼
        │   ├── VerifyEmail.tsx    # Email 驗證結果頁（驗證成功後自動關閉）
        │   ├── ResetPassword.tsx  # 密碼重設頁（token 預檢 + 設定新密碼）
        │   ├── Home.tsx
        │   ├── Chatroom.tsx
        │   ├── Feedback.tsx
        │   ├── History.tsx
        │   ├── Info.tsx
        │   └── NotFound.tsx
        └── components/            # UI 元件
            ├── AppLayout.tsx
            ├── Sidebar.tsx
            ├── chatroom/          # 對話空間組件群
            │   ├── ChatPanel.tsx             # LiveKit 整合主面板
            │   ├── ScenarioCard.tsx          # 情境卡片（能力群組展示）
            │   ├── ScenarioDetail.tsx        # 情境詳情展開面板
            │   ├── StudentProfileSelect.tsx  # 學生個性 + 年級選擇整合組件
            │   ├── PersonalitySelection.tsx  # 個性選擇子組件
            │   ├── AgeGroupSelection.tsx     # 年級選擇子組件
            │   ├── RandomConfirm.tsx         # 隨機情境確認 Dialog
            │   ├── SkillTreeMap.tsx          # SEL 五大能力樹（左側面板）
            │   └── SoulCards.tsx             # KIST 12 張對話卡抽卡體驗
            ├── feedback/          # 回饋頁組件
            │   └── FeedbackTabs.tsx          # 右側 Tabs（教練建議 + 逐字稿）
            └── ui/                # shadcn/ui 元件（60+）
```

---

## 資料庫結構

```
scenarios                     # 情境資料庫（預填 16 筆）
                              #   short_desc       — 前端卡片顯示的短說明
                              #   tags             — 適合的個性標籤清單（JSONB）
                              #   description      — 使用者介面顯示的情境說明
                              #   student_prompt   — AI 學生專用的第一人稱情境描述
                              #   initial_emotions — 各情境的情緒初始值（9 種，JSONB）
student_personalities         # 學生個性資料庫（預填 10 種）
                              #   personality_tags — 個性標籤（如 "防衛刺蝟型"）
                              #   short_desc       — 前端顯示的短描述
                              #   voice            — OpenAI Realtime API 語音名稱
grade_levels                  # 年級資料庫（4 個年級）
                              #   label / desc / behavior_desc / sort_order
users                         # 使用者帳號（含 is_email_verified、google_id、auth_provider、school、experience_years）
refresh_tokens                # Refresh Token（Token Rotation）
email_verification_tokens     # Email 驗證 Token（有效期 24 小時）
password_reset_tokens         # 密碼重設 Token（有效期 1 小時）
sessions                      # 對話 Session（含 scenario_id, personality_id）
transcripts                   # 師生對話逐字稿
emotion_logs                  # 逐輪情緒分析記錄（9 維度，漸進累積）
feedback_reports              # 教練回饋報告（SEL 分數 + 分析 + 建議）
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

- PRD 版本：v5.0（2026-03-02）
- 後端版本：1.6.0（新增學生個性選擇與年級選擇；新增 `api/personality.py`、`api/grade.py`；`SessionCreateRequest` 新增 `personality_key`、`grade_id` 選填欄位；新增 `POST /session/{uuid}/abandon`、`GET /session/{uuid}/emotion/latest`、`PUT /auth/me`；教練分析升級為 Coach→Critic→Coach Revision 三段式；新增 `grade_levels` 資料表；情境擴增至 16 個；`student_personalities` 擴增至 10 種；新增 TEST_USER 測試帳號）
- 前端版本：2.4（新增對話空間 8 個子組件；新增 `components/feedback/FeedbackTabs.tsx`；新增 `lib/collectionData.ts`、`lib/studentCharacter.ts`、`lib/soulCardSfx.ts`；新增 `hooks/` 目錄；新增學生立繪情緒切換（10 角色 × 9 情緒）；`Info.tsx` 新增 school/experience_years 可編輯欄位；對話空間使用者可自選個性與年級）
