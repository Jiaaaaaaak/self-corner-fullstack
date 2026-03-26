# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

### Backend（`backend/`）

```bash
cd backend

# 安裝依賴
pip install -r requirements.txt

# 初始化資料庫並匯入初始資料（首次執行）
python seed_data.py

# 啟動 FastAPI 伺服器（port 8000，開發模式自動 reload）
python main.py

# 啟動 LiveKit Agent Worker（獨立 process，需與 FastAPI 並行執行）
python -m agents.voice_pipeline dev
```

### Frontend（`frontend/`）

```bash
cd frontend
npm install       # 首次安裝依賴

npm run dev        # 開發伺服器 (port 8080)
npm run build      # 生產建置
npm run lint       # ESLint 檢查
npm run test       # Vitest 單次執行
npm run test:watch # Vitest 監聽模式
```

---

## 架構概覽

### 需同時執行的三個 Process

1. **FastAPI Server** (`backend/main.py`) — REST API，處理認證、Session、報告
2. **LiveKit Agent Worker** (`backend/agents/voice_pipeline.py`) — 獨立 Python process，由 LiveKit 在有人加入房間時自動 dispatch job；負責 OpenAI Realtime API 連線與逐字稿寫入
3. **React Dev Server** (`frontend/`) — 前端

### 關鍵資料流：一次完整練習

```
[前端] POST /session/create (scenario_id, personality_key?, grade_id?)
    → 若有 personality_key 則按 personality_tags 欄位查找對應個性，找不到則 fallback 隨機
    → 若有 grade_id 則存入 session_metadata JSONB（非獨立欄位）
    → 建 Session 存 DB，回傳 session_uuid + student_name + initial_emotion
[前端] POST /livekit/token (session_uuid)
    → 後端生成 LiveKit Token，前端連入房間
[LiveKit] 觸發 Agent Worker job
    → voice_pipeline.py 透過 room_name 查 DB，取得 scenario + personality
    → 動態組裝 student prompt（使用 scenario.student_prompt），連線 OpenAI Realtime API
    → 初始情緒從 scenario.initial_emotions 載入，存入 self.last_emotion_scores
    → 每輪老師說話：Realtime API 觸發 semantic_analysis tool
        → build_semantic_analysis_prompt(teacher_input, last_emotion_scores, scenario_title)
        → gpt-3.5-turbo 分析 → 漸進更新情緒（±0.20/輪）→ 存 EmotionLog → 更新 last_emotion_scores
    → 逐字稿（teacher/student）即時寫入 transcripts 表
    → 回應音訊透過 LiveKit 播放給老師
    → 每輪回應後前端輪詢 GET /session/{uuid}/emotion/latest → 取 dominant 情緒 → 切換立繪
[前端] POST /session/{uuid}/end
    → 後端取全部逐字稿 → 呼叫 gpt-4o coach LLM → 儲存 FeedbackReport
[前端] GET /report/{uuid}/feedback → 顯示 SEL 雷達圖、回饋、逐字稿
[前端] POST /report/{uuid}/chat (message + history)
    → 後端帶入情境資訊 + 完整逐字稿 + 逐輪情緒摘要 + FeedbackReport 作為 system context → 呼叫 gpt-4o
```

### 認證機制

- **HttpOnly Cookie**：`access_token`（15 分鐘）+ `refresh_token`（7 天）
- **Token Rotation**：每次刷新撤銷舊 refresh_token，發行新的，記錄在 `refresh_tokens` 表
- **前端攔截器**：`frontend/src/lib/api.ts` 攔截 401，自動呼叫 `/auth/refresh` 後重試原請求；注意 `/auth/me` 已排除在攔截器之外（避免在 VerifyEmail 等未登入頁面觸發強制跳轉）
- **後端保護**：各 API 路由透過 `get_current_user_id` dependency 從 Cookie 解析 JWT

### Email 驗證機制（v1.5.0）

註冊流程要求使用者完成 Email 驗證才能登入：

```
[前端] 使用者填寫註冊表單 → POST /auth/register
    → 後端建立 User（is_email_verified=False）
    → 建立 EmailVerificationToken（24 小時有效）
    → 透過 aiosmtplib 寄送驗證信（含 {FRONTEND_URL}/verify-email?token=xxx 連結）
    → 回傳 201，前端 Dialog 切換為「等待驗證」畫面
[使用者] 點擊信中連結 → 新分頁開啟 /verify-email?token=xxx
    → VerifyEmail.tsx 呼叫 GET /auth/verify-email?token=xxx
    → 後端驗證 token → 更新 User.is_email_verified=True → 刪除 token
    → 前端顯示成功 → 2.5 秒後 window.close() 自動關閉分頁
[原分頁] Login.tsx 監聽 window focus 事件
    → 使用者切回原分頁時自動嘗試用註冊時的帳密登入
    → 若驗證已完成 → 登入成功 → 直接導向 /home
    → 若尚未驗證 → 靜默失敗，使用者繼續等待
```

相關檔案：
- `backend/services/email_service.py` — SMTP 寄信（aiosmtplib），讀取 `SMTP_*` 環境變數
- `backend/models.py` — `EmailVerificationToken`（24hr）、`PasswordResetToken`（1hr）
- `backend/services/db_manager.py` — Token CRUD（create/verify/consume），驗證時同步更新 `User.is_email_verified`
- `backend/api/auth.py` — `GET /auth/verify-email`、`POST /auth/resend-verification`
- `frontend/src/pages/VerifyEmail.tsx` — 驗證結果頁（成功後自動關閉分頁）
- `frontend/src/pages/Login.tsx` — 註冊後等待驗證畫面、15 秒後重寄按鈕、focus 自動登入

### 忘記密碼機制（v1.5.0）

```
[前端] 忘記密碼 Dialog → POST /auth/forgot-password (email)
    → 後端查 User（僅 local/both 使用者，純 Google 使用者跳過）
    → 建立 PasswordResetToken（1 小時有效）→ 寄送重設信
    → 統一回傳成功訊息（防列舉攻擊）
[使用者] 點擊信中連結 → /reset-password?token=xxx
    → ResetPassword.tsx 載入時先 GET /auth/validate-reset-token 確認 token 有效
    → 使用者輸入新密碼 → POST /auth/reset-password (token, new_password)
    → 後端驗證 token → 更新密碼 → 刪除 token
    → 前端顯示成功 → 3 秒後跳轉 /login
```

相關檔案：
- `backend/api/auth.py` — `POST /auth/forgot-password`、`POST /auth/reset-password`、`GET /auth/validate-reset-token`
- `frontend/src/pages/ResetPassword.tsx` — token 預檢 + 設定新密碼表單

### Google OAuth 機制（v1.4.0）

```
[前端] 點擊「使用 Google 登入」→ window.location.href = "/auth/google/login"
    → Vite proxy 轉發至後端
    → 後端產生 state token（CSRF 防護）→ 302 重導向至 Google 授權頁
[Google] 使用者授權 → 302 回到 /auth/google/callback?code=xxx&state=xxx
    → 後端驗證 state → 用 code 換 token → 驗證 id_token
    → find_or_create_google_user()：google_id 查 → email 查合併 → 建新使用者
    → 自動標記 is_email_verified=True（Google 已驗證過 email）
    → 簽發 JWT + Refresh Token → 302 重導向至 {FRONTEND_URL}/home
[前端] AuthInitializer 呼叫 /auth/me 恢復登入狀態
```

相關檔案：
- `backend/services/oauth.py` — `StateManager`（in-memory CSRF）、`get_google_oauth_url()`、`exchange_code_for_token()`、`verify_google_token()`
- `backend/api/auth.py` — `GET /auth/google/login`、`GET /auth/google/callback`
- `backend/services/db_manager.py` — `get_user_by_google_id()`、`find_or_create_google_user()`（帳號合併邏輯）
- `backend/models.py` — User 的 `google_id`、`auth_provider`（"local" | "google" | "both"）

帳號合併規則：
1. 用 `google_id` 查 → 找到直接登入
2. 用 `email` 查 → 找到則綁定 `google_id`，`auth_provider` 改為 "both"
3. 都沒有 → 建立新使用者，`auth_provider` = "google"，`hashed_password` = null

### 文字輸入模式的資料流

文字輸入與語音輸入等效，流程如下：

```
[前端 handleSend()] 透過 LiveKit data channel 發布 { type: "teacher_text_input", text }
    → voice_pipeline.py on_data_received 接收
    → handle_teacher_text_input():
        - 存入 transcripts 表（source="text"）
        - conversation.item.create（role=user, input_text）
        - response.create → 觸發 OpenAI 學生語音回應
    → 學生語音透過 LiveKit track 播放給老師
    → 學生文字逐字稿透過 DataReceived 顯示在前端對話框
```

### Agent Prompt 動態組裝

`agents/prompts.py` 的 `build_student_prompt(scenario, personality)` 在每次 Session 啟動時被 `voice_pipeline.py` 呼叫，將情境描述與學生個性合併成 Realtime API 的 system instructions。Agent Worker 透過 `room_name` 查 DB（`Session` → `scenario_id` / `personality_id`）取得這兩份資料。

情境描述有兩欄：
- `scenario.description`：給使用者介面顯示的說明（第三人稱，教師視角）
- `scenario.student_prompt`：專供 AI 學生使用的第一人稱情境描述（不對外顯示）

`build_student_prompt()` 優先使用 `student_prompt`，若為 null 則 fallback 到 `description`。

### 情緒連續性設計

情緒分析採漸進模式，避免每輪情緒跳動過大：

- `voice_pipeline.py` 啟動時從 `scenario.initial_emotions`（JSONB）讀取各情境的情緒基準值，存入 `self.last_emotion_scores`
- 每輪 `exec_semantic_analysis()` 呼叫 `build_semantic_analysis_prompt(teacher_input, previous_emotions, scenario_title)`，LLM 在上一輪基礎上做漸進調整（一般 ±0.20，極端情況 ±0.35）
- 分析完成後更新 `self.last_emotion_scores` 供下輪使用

### 前端狀態管理

- **`useAuthStore`**（`frontend/src/lib/auth.ts`，Zustand）：跨頁面共享 `user`、`isLoggedIn`、`sessionUuid`
  - 方法：`setUser(user)`、`logout()`（注意：Sidebar.tsx 須使用 `logout` 而非 `clearUser`）
- `sessionUuid` 在 Chatroom 建立 Session 時寫入，Feedback 頁面讀取用來呼叫 `/report/{uuid}/feedback`
- History 頁面點擊紀錄時會覆寫 `sessionUuid`，再導向 Feedback 頁
- **Chatroom.tsx 本地 State**：`studentProfile`（所選個性+年級）、`studentName`（角色名）、`studentEmotion` / `displayedEmotion`（含 cross-fade 過渡動畫）、`currentSessionUuid`（同時同步至 Ref 供 unmount cleanup 使用）
- `Chatroom.tsx` 頁面 mount 時並行呼叫 `GET /scenarios`、`GET /personalities`、`GET /grade-levels`；unmount 時若 session 仍 active 且非正常結束，自動呼叫 `POST /session/{uuid}/abandon`

### 前端路由保護

`frontend/src/App.tsx` 中的 `ProtectedRoute` 元件：`useAuthStore.isLoggedIn` 為 false 時會導向 `/login`。

`/verify-email` 與 `/reset-password` 不受 `ProtectedRoute` 保護（使用者未登入即可存取）。

---

## 資料庫模型重點

`models.py` 定義 11 張表（新增 `GradeLevel`、`Conversation`），關鍵關聯：
- `Session` → FK 到 `scenarios`（情境）和 `student_personalities`（個性）
- `Session.session_metadata`（JSONB）：存放 `grade_id` 等附加屬性（非固定欄位）
- `FeedbackReport` 與 `Session` 是 1:1 關係（`uselist=False`），在 `POST /session/{uuid}/end` 同步生成
- `EmotionLog` 每輪逐字稿一筆，記錄 9 種情緒分數（0.0–1.0）
- `EmailVerificationToken` / `PasswordResetToken` → FK 到 `users`（`ondelete="CASCADE"`），各自有 `expires_at` 控制有效期

`User` 表的認證相關欄位：
- `hashed_password`（nullable）：Google 使用者為 null
- `google_id`（unique, nullable）：Google OAuth 綁定用
- `auth_provider`："local" | "google" | "both"
- `is_email_verified`（Boolean, default False）：未驗證的使用者登入時會被 403 擋住；Google OAuth 使用者在 callback 時自動設為 True
- `is_active`（Boolean, default True）：停用帳號用

`User` 表的個人資料欄位（v1.6.0 新增）：
- `school`（VARCHAR 200, nullable）：任職學校
- `experience_years`（VARCHAR 50, nullable）：教學年資（存為字串，如 "3-5年"）

`StudentPersonality` 表的新欄位（v1.6.0 擴充）：
- `personality_tags`（VARCHAR 100, nullable）：個性標籤，如 "防衛刺蝟型"；`GET /personalities` API 和 `SessionCreateRequest.personality_key` 皆以此值對應
- `short_desc`（TEXT, nullable）：前端選擇畫面顯示的短描述
- `voice`（VARCHAR 20, default "alloy"）：OpenAI Realtime API 語音名稱

`Scenario` 表的新欄位（v1.6.0 擴充）：
- `short_desc`（VARCHAR 200, nullable）：前端情境卡片顯示的短說明
- `tags`（JSONB, nullable）：適合本情境的個性標籤清單（如 `["防衛刺蝟型", "高壓衝動型"]`）

`GradeLevel` 表（v1.6.0 新增）：
- `id`（VARCHAR 30, PK）：如 "lower-elementary"
- `label`：中文標籤（低年級/中年級/高年級/國中生）
- `desc`：年級範圍（小一～小二 等）
- `behavior_desc`：行為特徵說明（供 voice_pipeline.py 注入 Prompt）
- `sort_order`：排序用

`Scenario` 表的重要欄位：
- `description`：給使用者看的情境說明（UI 顯示）
- `student_prompt`（nullable）：AI 學生專用的第一人稱情境描述
- `initial_emotions`（nullable, JSONB）：情境開始時的基準情緒（9 種，0.0–1.0）

初始資料透過 `seed_data.py` 匯入。`seed_data.py` 會先呼叫 `migrate_db()` 確保新欄位存在，再以 UPSERT 策略更新情境資料（既有情境只更新 `student_prompt` / `initial_emotions`，不覆蓋其他欄位）。對既有資料庫只需重新執行一次：

```bash
python seed_data.py
```

---

## 環境變數

必填：`LIVEKIT_URL`、`LIVEKIT_API_KEY`、`LIVEKIT_API_SECRET`、`OPENAI_API_KEY`、`DATABASE_URL`、`JWT_SECRET_KEY`、`FRONTEND_URL`

Google OAuth（選填，不設則 Google 登入按鈕無作用）：`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`GOOGLE_REDIRECT_URI`（預設 `http://localhost:8000/auth/google/callback`）

Email SMTP（選填，不設則註冊時不寄驗證信但會印 warning）：`SMTP_HOST`（預設 `smtp.gmail.com`）、`SMTP_PORT`（預設 `587`）、`SMTP_USER`、`SMTP_PASSWORD`、`SMTP_FROM_NAME`（預設 `SELf-Corner`）

其他選填（有預設值）：`COACH_MODEL`（預設 `gpt-4o`）、`ENV`、`API_HOST`、`API_PORT`

詳見 `.env.example`。

---

## 已知陷阱（開發時必讀）

### 1. OpenAI Realtime API Tool Schema 格式與 Chat Completions API 不同

Realtime API 的 tools 格式是**平鋪**的，**不**使用 `"function": {...}` 嵌套：

```python
# ✅ Realtime API 正確格式
{"type": "function", "name": "...", "description": "...", "parameters": {...}}

# ❌ Chat Completions API 格式（會導致 session.update 報 error，所有設定失效）
{"type": "function", "function": {"name": "...", "description": "...", "parameters": {...}}}
```

若 session.update 發生 error，**所有設定都不生效**（tools、input_audio_transcription、instructions 全部失效）。

### 2. livekit-agents `ctx.add_shutdown_callback` 需要 async 函數

```python
# ✅ 正確
async def _on_shutdown(reason: str):
    if not shutdown_future.done():
        shutdown_future.set_result(reason)
ctx.add_shutdown_callback(_on_shutdown)

# ❌ 錯誤：lambda 回傳 None，框架呼叫 asyncio.create_task(None) 會報 TypeError
ctx.add_shutdown_callback(lambda reason: shutdown_future.set_result(reason))
```

### 3. livekit-client 前端需手動 attach 遠端音訊 Track

`room.startAudio()` 只解除瀏覽器 autoplay 限制，但 **不會自動播放** 遠端音訊。必須監聽 `RoomEvent.TrackSubscribed`，呼叫 `track.attach()` 並 append 到 DOM：

```typescript
room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
  if (track.kind === Track.Kind.Audio) {
    const el = track.attach() as HTMLAudioElement;
    el.autoplay = true;
    document.body.appendChild(el);
  }
});
```

### 4. bcrypt 版本須釘死在 4.0.1

`passlib 1.7.4` 與 `bcrypt >= 5.0` **不相容**，會導致密碼驗證失敗。`requirements.txt` 已釘死 `bcrypt==4.0.1`，venv 也須確認版本一致：

```bash
pip show bcrypt  # 確認 Version: 4.0.1
```

### 5. CORS 須包含 Vite dev server 實際 port（8080）

Vite 開發伺服器設定在 port **8080**（非預設 5173），`main.py` 的 `allow_origins` 必須包含兩者。

### 6. Axios interceptor 須排除 `/auth/me`

`api.ts` 的 401 interceptor 會自動嘗試 refresh 並在失敗時強制跳轉 `/login`。`/auth/me` 必須被排除，否則在未登入頁面（如 `/verify-email`、`/reset-password`）上，`AuthInitializer` 呼叫 `/auth/me` 失敗會觸發強制跳轉，導致使用者看不到頁面內容：

```typescript
// api.ts interceptor 條件須包含：
!req.url?.includes("/auth/me")
```

### 7. Sidebar.tsx 的登出方法名稱必須與 auth store 一致

`auth.ts` 的 Zustand store 定義的方法是 `logout()`，Sidebar.tsx 解構時必須使用 `logout`（而非 `clearUser` 等其他名稱），否則呼叫時會 TypeError：

```typescript
// ✅ 正確
const { user, logout } = useAuthStore();

// ❌ 錯誤：clearUser 不存在於 store，執行時 TypeError
const { user, clearUser } = useAuthStore();
```

### 8. Google OAuth 的 `FRONTEND_URL` 必須與前端實際 port 一致

`backend/services/oauth.py` 的 `FRONTEND_URL` 預設為 `http://localhost:5173`（Vite 舊預設），但本專案前端跑在 `8080`。**必須在 `.env` 中明確設定** `FRONTEND_URL=http://localhost:8080`，否則 Google OAuth callback 後的重導向會指向錯誤的 port。`email_service.py` 同樣依賴此變數產生驗證信連結。

---

### History API 變更（v1.1.0）

`GET /history` 回傳的 `HistoryItem` 已移除 `sel_scores` 和 `has_report`，改為：
- `rounds: int` — 本次 Session 的逐字稿總筆數（代表對話回合數）
- `duration: int | null` — 秒數（由 `ended_at - started_at` 計算），`null` 表示尚未結束

### Report API 變更（v1.1.0）

`GET /report/{uuid}/feedback` 回傳新增：
- `emotion_logs: EmotionLogEntry[]` — 每輪（turn_number 排序）的 9 種情緒分數（0.0–1.0）

前端 Feedback 頁的情緒流動圖使用 `recharts LineChart`，9 種情緒各一條折線，Y 軸為百分比（0–100%）。

### 前端環境變數（`frontend/.env`）

```
VITE_API_URL=http://localhost:8000
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
```

範本見 `frontend/.env.example`。

### Scenario 雙欄位設計（v1.2.0）

`scenarios` 表新增兩欄位，需對既有資料庫在 `backend/` 下執行 `python seed_data.py` 補齊：
- `student_prompt`（TEXT）：AI 學生第一人稱情境描述，比 `description` 更精確；`build_student_prompt()` 優先使用此欄
- `initial_emotions`（JSONB）：各情境的情緒初始值，鍵為大寫情緒名（`HAPPY`、`SAD`...），值為 0.0–1.0

### 情緒連續性設計（v1.2.0）

舊版 `SEMANTIC_ANALYSIS_PROMPT`（靜態常數）已替換為 `build_semantic_analysis_prompt(teacher_input, previous_emotions, scenario_title)`。新版 prompt 要求 LLM 在上一輪基礎上做漸進更新（一般 ±0.20，極端 ±0.35），`voice_pipeline.py` 以 `self.last_emotion_scores` 跨輪維護狀態。

### Coach Chat 增強（v1.2.0）

`POST /report/{uuid}/chat` 的 system prompt（`COACH_CHAT_SYSTEM_PROMPT`）新增兩個佔位符：
- `{scenario_info}`：情境名稱、類別、描述
- `{emotion_summary}`：每輪前三名情緒（格式：`第 N 輪：悲傷(70%)、焦慮(50%)、挫折(45%)`）

### UI 重構 + Bug 修正（v1.3.0）

**新端點：`GET /session/count`**
- 回傳 `{"count": int}`，統計該使用者的全部 Session 次數（含進行中）
- Info 頁面「Total Sessions」使用此端點，不再從 `/history` 陣列長度推算

**`SessionResponse` 新增欄位：`student_name: Optional[str]`**
- `POST /session/create` 回傳 `student_name=personality.name if personality else None`
- Chatroom.tsx 讀取後存入 state，並傳給 `ChatPanel` 的 `studentName` prop，讓對話框顯示正確學生名

**UTC 時區修正**（全端點統一附加 `+00:00`）
- `backend/api/session.py`：`started_at`
- `backend/api/history.py`：`started_at`、`ended_at`（list 與 single 端點）
- `backend/api/report.py`：`transcript[].timestamp`、`generated_at`
- 修正前：`datetime.utcnow().isoformat()` 產生無時區字串，瀏覽器當本地時間解析，差 8 小時

**前端 UI 改動**
- `Sidebar.tsx`：移除「專家回饋」主選單項、移除「即時分析」session 選單項；結束按鈕改為 `ClipboardCheck` icon + 文字
- `ChatPanel.tsx`：麥克風未錄音狀態改用 `MicOff` 深色圖示；錄音中改用 `Mic` + ping/pulse 動畫；結束按鈕改為 pill 形帶文字
- `Chatroom.tsx`：對話進行時 header 顯示完整情境描述（`title——「description」`）；結束前顯示「分析對話中...」全覆蓋 overlay
- `FeedbackTabs.tsx`（新元件）：右側 panel 改為 Tabs，Tab 1「專家建議」含 feedback/analysis 文字 + AI 督導聊天框，Tab 2「對話逐字稿」
  - 逐字稿使用 `div max-h overflow-y-auto`，**不使用 ScrollArea**（Radix ScrollArea Viewport 用 `h-full`，`max-height` 無法觸發可捲動區域）
- `Feedback.tsx`：左欄保留雷達圖 + 情緒折線圖；右欄改為 `<FeedbackTabs>`，移除原本的獨立 expert card
- `Info.tsx`：移除登出卡片（登出統一由 Sidebar 處理）；安全設定卡片改為可點擊樣式

### Google OAuth 登入（v1.4.0）

**後端新增**
- `backend/services/oauth.py`：Google OAuth 全流程（StateManager、授權 URL、Token 交換、ID Token 驗證）
- `backend/api/auth.py`：`GET /auth/google/login`、`GET /auth/google/callback`
- `backend/services/db_manager.py`：`get_user_by_google_id()`、`find_or_create_google_user()`
- `backend/models.py`：User 新增 `google_id`、`auth_provider`、`is_active`；`hashed_password` 改為 nullable

**前端新增**
- `Login.tsx`：Google 登入按鈕（`window.location.href = "/auth/google/login"`）
- `App.tsx`：`AuthInitializer` 元件，頁面載入時呼叫 `/auth/me` 恢復登入狀態（解決 Google OAuth 302 redirect 後的狀態遺失問題）
- `vite.config.ts`：`server.proxy["/auth"]` → `http://localhost:8000`

### Email 驗證 + 忘記密碼（v1.5.0）

**後端新增**
- `backend/services/email_service.py`：SMTP 寄信服務（`send_verification_email`、`send_password_reset_email`）
- `backend/models.py`：`EmailVerificationToken`、`PasswordResetToken` 兩張新表；User 新增 `is_email_verified`
- `backend/services/db_manager.py`：Token CRUD（`create_email_verification_token`、`verify_email_token`、`create_password_reset_token`、`verify_password_reset_token`、`consume_password_reset_token`）
- `backend/api/auth.py`：`GET /auth/verify-email`、`POST /auth/resend-verification`、`POST /auth/reset-password`、`GET /auth/validate-reset-token`；`POST /auth/register` 新增寄驗證信；`POST /auth/login` 新增 `is_email_verified` 檢查（403）；`POST /auth/forgot-password` 改為真正寄信；Google callback 自動標記 `is_email_verified=True`
- `backend/requirements.txt`：新增 `aiosmtplib>=2.0.0`

**前端新增**
- `frontend/src/pages/VerifyEmail.tsx`：驗證結果頁，成功後 `window.close()` 自動關閉分頁
- `frontend/src/pages/ResetPassword.tsx`：密碼重設頁，載入時 token 預檢，密碼規則與註冊一致（≥10 字元 + 含英文）
- `frontend/src/pages/Login.tsx`：註冊成功後 Dialog 切換為等待驗證畫面（信封圖示 + 15 秒後重寄按鈕）；監聽 window focus 事件自動嘗試登入；「沒收到驗證信？」連結
- `frontend/src/App.tsx`：新增 `/verify-email`、`/reset-password` 路由（不受 ProtectedRoute 保護）
- `frontend/src/lib/api.ts`：interceptor 排除 `/auth/me`

### 個性/年級選擇 + 立繪情緒系統（v1.6.0）

**後端新增**
- `backend/api/personality.py`：`GET /personalities`，回傳 id、name、personality_tags、personality_type、short_desc
- `backend/api/grade.py`：`GET /grade-levels`，回傳 id、label、desc、behavior_desc、sort_order
- `backend/api/auth.py`：`PUT /auth/me`，可更新 first_name、last_name、school、experience_years
- `backend/api/session.py`：
  - `POST /session/create` 新增選填欄位：`personality_key`（按 personality_tags 查找，找不到 fallback 隨機）、`grade_id`（存入 session_metadata）
  - `SessionResponse` 新增 `initial_emotion`（最高分情緒名稱）
  - 新增 `POST /session/{uuid}/abandon`（快速結束，不觸發教練分析）
  - 新增 `GET /session/{uuid}/emotion/latest`，回傳 `{"emotion": str, "turn_number": int, "scores": dict}`
- `backend/models.py`：新增 `GradeLevel` 表；`StudentPersonality` 新增 `personality_tags`、`short_desc`、`voice`；`Scenario` 新增 `short_desc`、`tags`；`User` 新增 `school`、`experience_years`；`FeedbackReport` 新增 Critic Agent 欄位群
- `backend/seed_data.py`：情境擴增至 16 個；學生個性擴充至 10 種；新增 `GRADE_LEVELS`（4 個年級）；新增 `TEST_USER`（可直接用 email `test@selfcorner.dev` 登入，`is_email_verified=True`）

**教練分析流程升級（v1.6.0）**

`POST /session/{uuid}/end` 的報告生成升級為三段式：
```
Coach LLM（初稿）→ Critic Agent（審核）→ 若未通過 → Coach LLM（修正稿）
```
- `CRITIC_PROMPT` / `COACH_REVISION_PROMPT` 新增至 `agents/prompts.py`
- 初稿與最終版、Critic 輸出皆存入 `FeedbackReport` 各對應欄位（`draft_*`、`critic_passed`、`critic_critique`、`critic_revision_instructions`）
- Critic Agent 失敗時 fallback 使用初稿（不中斷流程）

**前端新增**
- `frontend/src/components/chatroom/ScenarioCard.tsx`：情境卡片，含 SEL 能力群組分類、emoji、short_desc
- `frontend/src/components/chatroom/ScenarioDetail.tsx`：情境詳情展開面板（含推薦個性標籤 tags）
- `frontend/src/components/chatroom/StudentProfileSelect.tsx`：整合個性+年級選擇，props 含 `allowedPersonalityTags`（依 scenario.tags 過濾）
- `frontend/src/components/chatroom/PersonalitySelection.tsx`、`AgeGroupSelection.tsx`、`RandomConfirm.tsx`
- `frontend/src/components/chatroom/SkillTreeMap.tsx`：左側 SEL 五大能力樹，展示全部情境分組
- `frontend/src/components/chatroom/SoulCards.tsx`：KIST 12 張對話卡抽卡體驗，Portal 全螢蓋板，含洗牌/翻牌/揭示動畫 + Web Audio SFX
- `frontend/src/lib/collectionData.ts`：`CompetencyGroup`、`COMPETENCY_META`、`buildCompetencyGroups()`
- `frontend/src/lib/studentCharacter.ts`：`getStudentImagePath(name, emotion)`、`getAvatarPath(name)`、`preloadCharacterImages(name)`
- `frontend/src/lib/soulCardSfx.ts`：Web Audio API 合成 SFX，無外部音效檔（sfxDeal/sfxShuffle/sfxFlip/sfxReveal/sfxClick）
- `frontend/src/hooks/use-mobile.tsx`、`use-toast.ts`
- `frontend/src/assets/classroom-background.png`
- `frontend/public/avatars/`：10 個角色頭像（品妍、宇傑、宇翔、家瑜、建宇、思妤、柏宇、柏翰、睿明、芷婷）
- `frontend/public/img/students/`：10 角色 × 9 情緒 = 90 張全身立繪（`{角色名}_{情緒中文}.png`）
- `frontend/public/img/logo/`：平台 Logo 資源
- `frontend/src/pages/Info.tsx`：新增 school、experience_years 可編輯欄位；儲存呼叫 `PUT /auth/me`

**重要陷阱（v1.6.0）**

**`curious` 與 `thinking` 的鍵值對應鏈**：DB `EmotionLog.curious` 欄位 → `voice_pipeline.py` 的 `EMOTION_KEY_MAP["CURIOUS"] = "thinking"` → `GET /session/{uuid}/emotion/latest` 回傳 `"thinking"` → 前端 `studentCharacter.ts` 的 `EMOTION_TO_CHINESE["thinking"] = "好奇"` → 圖片路徑 `好奇.png`。注意：前端 `StudentEmotion` type 含 `"thinking"` 而非 `"curious"`。

**`allowedPersonalityTags` 過濾**：`ScenarioDetail.tsx` 將 `scenario.tags` 傳入 `StudentProfileSelect`，用以過濾 personalities 只顯示適合的個性。若 `scenario.tags` 為空，則顯示全部 10 種。

**`grade_id` 不在 Session 主表欄位**：透過 `session_metadata = {"grade_id": grade_id}` 存入 JSONB，不是獨立 column；`voice_pipeline.py` 需從 `session.session_metadata["grade_id"]` 取出後自行查 `grade_levels` 表取得 `behavior_desc`。

---

## 範疇限制

此專案的後端程式碼位於 `backend/`，前端程式碼位於 `frontend/`，文件位於 `docs/`。團隊規則與 Git 指南詳見 `docs/1_TEAM_RULES.md` 與 `docs/0_GIT_GUIDE.md`，不應修改。
