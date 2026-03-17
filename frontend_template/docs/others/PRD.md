# PRD: AI 虛擬教師培訓平台 v5.0

> 本文件反映 SELf-Corner 的**實際已實作狀態**（v5.0），以 v4.0 規劃文件為基礎改寫，移除未實作項目，補充實際設計決策與已確認行為。

- **Modified Date**: 2026-03-02
- **Version**: 5.0
- **主要更新**:
    - 對齊實際實作，移除 LangGraph、Alembic、Google OAuth 等未實作項目。
    - 補充雙輸入模式（語音 + 文字皆觸發 AI）。
    - 更新架構圖與用戶流程圖以反映真實架構。
    - 補充已確認的技術限制與關鍵實作注意事項。

---

## 1. 專案概覽

### a. 產品定位

一個「將教育理論轉化為教學實務」的橋樑。本平台讓教育工作者（特別是新進教師）在進入真實課堂前，能於一個高擬真、零風險的模擬環境中，透過語音或文字對話模式演練與 AI 學生的溝通技巧。

### b. 核心價值主張

- **零風險演練**: 在不傷害真實師生關係的前提下，教師可自由試錯、探索不同的溝通策略。
- **學理化回饋**: 系統不僅提供對話紀錄，更基於「社會情緒學習 (SEL)」與「KIST 12 張對話卡」框架，提供具體、可操作的專業改進建議。
- **建立專業信心**: 透過 AI 教練的引導式反思（而非批判），將傳統公開觀課的壓力，轉化為自我提升的專業成就感。

### c. 目標對象

- **主要用戶**: 新進教師、實習教師。
- **次要用戶**: 需要精進特定溝通技巧（如處理學生情緒、衝突管理）的在職教師。

---

## 2. 系統架構與技術棧

本專案採用前後端分離架構，需同時運行三個獨立 Process。

| 層級 | 技術 | 說明 |
| :--- | :--- | :--- |
| **後端 API** | FastAPI (Python 3.11+) | REST API，處理認證、Session、報告生成 |
| **前端框架** | React 18 + TypeScript (Vite) | SPA，port 8080 |
| **UI 元件庫** | shadcn/ui + Tailwind CSS | 現代化 UI |
| **狀態管理** | TanStack Query + Zustand (persist) | 伺服器狀態 + 跨頁面登入狀態 |
| **資料庫** | PostgreSQL + SQLAlchemy 2.0 (async) | ORM，使用 `create_all` 建立資料表（無 migration） |
| **即時通訊** | LiveKit (WebRTC) | 管理語音串流與 data channel |
| **語音 AI** | OpenAI Realtime API (`gpt-4o-realtime-preview-2024-12-17`) | 學生語音互動，含 STT/LLM/TTS |
| **教練 AI** | OpenAI `gpt-4o`（可由 `COACH_MODEL` 環境變數替換） | Session 結束後一次性生成回饋報告 |
| **情緒分析** | OpenAI `gpt-3.5-turbo` | 每輪對話的語意情緒分析 |
| **認證** | JWT (HttpOnly Cookie) + Refresh Token Rotation | access_token 15 分鐘，refresh_token 7 天 |

### 三個必要 Process

| Process | 啟動指令 | 說明 |
| :--- | :--- | :--- |
| FastAPI 後端 | `python main.py` | port 8000 |
| LiveKit Agent Worker | `python -m agents.voice_pipeline dev` | 等待 LiveKit 房間有參與者時自動 dispatch |
| React 前端 | `npm run dev`（在 `web_client/`） | port 8080 |

### 系統架構圖

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

---

## 3. 核心功能規格

### a. 用戶認證系統 (Auth)

- **功能點**:
    1. **電子郵件/密碼註冊**：後端使用 `passlib` + `bcrypt`（版本釘死 4.0.1，與 passlib 1.7.4 相容）雜湊密碼。
    2. **電子郵件/密碼登入**：成功後透過 `HttpOnly` Cookie 回傳 `access_token`（15 分鐘）與 `refresh_token`（7 天）。
    3. **Google OAuth 2.0 登入**：前端有預留按鈕，**尚未串接**（待實作）。
    4. **自動 Token 刷新**：前端 Axios Interceptor 攔截 `401`，自動呼叫 `/auth/refresh` 後重試原請求。
    5. **安全登出**：後端撤銷 DB 中的 `refresh_token`，前端清除 Zustand 狀態。
    6. **受保護路由**：未登入用戶由 `ProtectedRoute` 導向登入頁。

- **資料庫模型**:
    - `users`：帳號基本資訊 + `hashed_password`。
    - `refresh_tokens`：儲存 `user_id`、`token`、`expires_at`、`is_revoked`，實現 Token Rotation。

### b. 對話空間 (Chatroom)

此頁面整合情境選擇與實際對話，為產品核心互動區域。

#### 情境選擇（對話前）

- 預設從 10 個 SEL 情境中隨機顯示 6 張情境卡（`ScenarioCard`），可點擊「換一批」重新抽取。
- 點擊情境卡後展開詳情（`ScenarioDetail`），確認後按「開始」。
- 亦可點擊「隨機情境」由系統自動抽選（`RandomConfirm`）。
- 每次對話系統從 5 種學生個性（`student_personalities`）中隨機指派一種，動態組裝 AI 學生的 system prompt。

#### 對話中

- **UI**：教室背景圖 + 中央虛擬學生 Emoji Avatar + 底部 `ChatPanel`（對話框 + 輸入區）。
- **輸入模式（雙模式等效）**：
    - **語音模式**：麥克風自動啟動，老師說話 → 音訊透過 LiveKit 傳至 Agent → OpenAI Realtime API 轉錄並生成學生語音回應，同步在前端對話框顯示老師的逐字稿（`user_transcription`）與學生回應文字（`agent_response`）。
    - **文字模式**：老師在輸入框輸入後按傳送，前端透過 LiveKit data channel 送出 `{ type: "teacher_text_input", text }`，Agent 收到後注入 OpenAI Realtime API 觸發學生語音回應，等效於語音輸入。
    - 兩種模式可自由切換；所有發言內容皆即時顯示在對話框中，並存入 `transcripts` 表。
- **麥克風開關**：可隨時靜音（不中斷 LiveKit 連線）。
- **暫停/繼續**：暫停時麥克風停止傳送音訊，畫面顯示遮罩。
- **結束**：觸發後端 `POST /session/{uuid}/end`，同步等待教練分析完成後導向回饋頁。

#### Agent 架構

1. 老師加入 LiveKit 房間 → LiveKit 自動 dispatch job 給 Agent Worker。
2. Agent 透過 room name 查詢 DB，取得 `scenario` + `personality`，動態組裝 student system prompt。
3. Agent 透過 WebSocket 連線至 OpenAI Realtime API（`gpt-4o-realtime-preview-2024-12-17`）。
4. 每輪老師說話前，學生 Agent **必須**先呼叫 `semantic_analysis` tool（使用 `gpt-3.5-turbo` 分析教師話語的情緒影響），將 9 維情緒分數存入 `emotion_logs`，再根據分析結果調整回應語氣。
5. 學生語音（TTS）透過 LiveKit audio track 播放；學生文字逐字稿與老師轉錄透過 data channel 傳至前端對話框。

> **重要技術注意**：OpenAI Realtime API 的 tool schema 格式與 Chat Completions API 不同（平鋪結構，無 `"function": {...}` 嵌套）。格式錯誤會導致 `session.update` 整體失敗，所有設定（tools、input_audio_transcription、instructions）均不生效。

### c. 回饋與反思系統 (Feedback)

演練結束後，用戶會被導向此頁面。

- **SEL 五維雷達圖**：使用 `recharts` 的 `RadarChart`，視覺化自我覺察、自我管理、社會覺察、關係技巧、負責任的決策五項 SEL 分數。
- **KIST 對話卡**：顯示本次對話中 AI 教練判斷最相關的 KIST 12 張對話卡精神。
- **教練文字回饋**：依「觀察亮點 → 教練式啟發提問」結構呈現，不直接給指導棋。
- **教練對話框**：可針對此次報告與 AI 教練進行深度文字問答；教練系統帶入完整逐字稿 + 報告作為 context。
- **完整對話紀錄**：提供「合併檢視」與「分開檢視」兩種模式。
- **操作按鈕**：「重試一次」（重練相同情境）、「返回首頁」。

- **後端邏輯**：
    - `POST /session/{uuid}/end` 同步執行：取全部逐字稿 → 呼叫 coach LLM（gpt-4o）→ 解析 JSON（含去除 Markdown code fence 處理）→ 存入 `feedback_reports`。
    - 若無逐字稿（對話未產生任何紀錄），回傳 `report_ready: false`，跳過報告生成。

### d. 歷史紀錄 (History)

- 列出所有已結束的 Session，顯示情境名稱、日期、是否有報告。
- 支援依情境名稱或日期搜尋。
- 點擊有報告的紀錄，寫入 `sessionUuid` 至 Zustand store 後導向回饋頁。

---

## 4. 資料庫模型

```
scenarios              # 情境資料庫（預填 10 筆 SEL 情境）
student_personalities  # 學生個性資料庫（預填 5 種）
users                  # 使用者帳號
refresh_tokens         # Refresh Token Rotation
sessions               # 對話 Session（含 scenario_id, personality_id, livekit_room_name）
transcripts            # 師生對話逐字稿（speaker: teacher/student, source: realtime/text）
emotion_logs           # 逐輪情緒分析記錄（9 維度分數，0.0–1.0）
feedback_reports       # 教練回饋報告（sel_scores JSON + analysis + feedback + kist_cards）
```

---

## 5. 用戶流程

```
登入/註冊（Email + 密碼）
    ↓
首頁（了解平台與 SEL 框架）
    ↓
對話空間
  ├─ 選擇情境（6 張隨機卡 + 隨機情境選項）
  │    ↓
  ├─ 系統隨機分配學生個性 → 開始對話
  │    ↓
  ├─ 即時對話（語音 or 文字輸入，皆觸發 AI 學生語音回應）
  │    ↓
  └─ 點擊「結束」→ 後端同步生成教練回饋報告
         ↓
回饋報告頁
  ├─ SEL 五維雷達圖
  ├─ KIST 對話卡 + 教練文字回饋
  ├─ 與 AI 教練深度文字討論
  ├─ 完整師生對話逐字稿
  └─ 重試一次 / 返回首頁
         ↓
歷史紀錄頁（可回顧所有過往報告）
```

---

## 6. 關鍵指標 (KPIs)

### a. 技術指標

- **語音互動延遲**：端到端延遲（用戶說話 → AI 回應）< 1.5 秒。
- **報告生成成功率**：Session 結束後教練 LLM 成功解析並存入 DB 的比例。
- **系統可用性**：三個 Process 正常運行時間 > 99.5%。

### b. 業務/用戶指標

- **用戶留存率**：首次使用後，一週內再次使用的用戶比例。
- **情境完成率**：用戶開始一個情境後，完整練習到結束（含報告生成）的比例。
- **SEL 指標提升率**：用戶在第二次嘗試相同情境時，SEL 五維評分的平均提升幅度。

---

## 7. 風險評估

| 風險 | 說明 | 緩解措施 |
| :--- | :--- | :--- |
| **Realtime API 格式風險** | OpenAI Realtime API tool schema 格式與 Chat Completions API 不同；格式錯誤導致所有 session 設定失效 | 使用平鋪格式，定期驗證 API 規格變更 |
| **bcrypt 版本相容性** | passlib 1.7.4 與 bcrypt >= 5.0 不相容，密碼驗證失敗 | `requirements.txt` 釘死 `bcrypt==4.0.1` |
| **理論偏離風險** | AI 教練回饋可能不完全符合 SEL/KIST 精神 | 強化 prompt engineering；未來可引入 RAG 建立理論知識庫 |
| **技術延遲風險** | Realtime API 端到端延遲可能超過 1.5 秒 | 使用 `gpt-4o-realtime-preview` 低延遲模型；確保伺服器與 OpenAI API 端點的網路品質 |
| **Google OAuth 未實作** | 前端有預留 Google 登入按鈕，後端尚未實作 OAuth 流程 | 待實作；目前僅支援 Email/密碼登入 |
| **無資料庫 Migration 工具** | 目前使用 `SQLAlchemy create_all` 建立資料表，無 Alembic 管理 schema 演進 | 未來如有 schema 異動，需手動處理或引入 Alembic |

---

## 8. 未來規劃

- **Google OAuth 2.0 登入**：前端預留按鈕，待後端 OAuth callback 完成串接。
- **資料庫 Migration**：引入 Alembic 管理 schema 版本。
- **RAG 理論知識庫**：讓教練 LLM 生成回饋前先檢索 SEL/KIST 文獻，提升建議的學理依據。
- **情緒趨勢視覺化**：在回饋頁加入基於 `emotion_logs` 的逐輪情緒曲線圖。
- **多語系支援**：目前僅支援繁體中文介面。
