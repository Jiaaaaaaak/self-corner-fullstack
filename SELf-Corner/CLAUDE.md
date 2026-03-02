# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

### Backend

```bash
# 安裝依賴
pip install -r requirements.txt

# 初始化資料庫並匯入初始資料（首次執行）
python seed_data.py

# 啟動 FastAPI 伺服器（port 8000，開發模式自動 reload）
python main.py

# 啟動 LiveKit Agent Worker（獨立 process，需與 FastAPI 並行執行）
python -m agents.voice_pipeline dev
```

### Frontend（`web_client/`）

```bash
npm run dev        # 開發伺服器 (port 8080)
npm run build      # 生產建置
npm run lint       # ESLint 檢查
npm run test       # Vitest 單次執行
npm run test:watch # Vitest 監聽模式
```

---

## 架構概覽

### 需同時執行的三個 Process

1. **FastAPI Server** (`main.py`) — REST API，處理認證、Session、報告
2. **LiveKit Agent Worker** (`agents/voice_pipeline.py`) — 獨立 Python process，由 LiveKit 在有人加入房間時自動 dispatch job；負責 OpenAI Realtime API 連線與逐字稿寫入
3. **React Dev Server** (`web_client/`) — 前端

### 關鍵資料流：一次完整練習

```
[前端] POST /session/create (scenario_id)
    → 後端隨機選 student_personality，建 Session 存 DB，回傳 session_uuid
[前端] POST /livekit/token (session_uuid)
    → 後端生成 LiveKit Token，前端連入房間
[LiveKit] 觸發 Agent Worker job
    → voice_pipeline.py 透過 room_name 查 DB，取得 scenario + personality
    → 動態組裝 student prompt，連線 OpenAI Realtime API
    → 每輪老師說話：Realtime API 觸發 semantic_analysis tool → 存 EmotionLog
    → 逐字稿（teacher/student）即時寫入 transcripts 表
    → 回應音訊透過 LiveKit 播放給老師
[前端] POST /session/{uuid}/end
    → 後端取全部逐字稿 → 呼叫 gpt-4o coach LLM → 儲存 FeedbackReport
[前端] GET /report/{uuid}/feedback → 顯示 SEL 雷達圖、回饋、逐字稿
[前端] POST /report/{uuid}/chat (message + history)
    → 後端帶入完整逐字稿 + FeedbackReport 作為 system context → 呼叫 gpt-4o
```

### 認證機制

- **HttpOnly Cookie**：`access_token`（15 分鐘）+ `refresh_token`（7 天）
- **Token Rotation**：每次刷新撤銷舊 refresh_token，發行新的，記錄在 `refresh_tokens` 表
- **前端攔截器**：`web_client/src/lib/api.ts` 攔截 401，自動呼叫 `/auth/refresh` 後重試原請求
- **後端保護**：各 API 路由透過 `get_current_user_id` dependency 從 Cookie 解析 JWT

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

### 前端狀態管理

- **`useAuthStore`**（`src/lib/auth.ts`，Zustand + persist）：跨頁面共享 `user`、`isLoggedIn`、`sessionUuid`
- `sessionUuid` 在 Chatroom 建立 Session 時寫入，Feedback 頁面讀取用來呼叫 `/report/{uuid}/feedback`
- History 頁面點擊紀錄時會覆寫 `sessionUuid`，再導向 Feedback 頁

---

## 資料庫模型重點

`models.py` 定義 8 張表，關鍵關聯：
- `Session` → FK 到 `scenarios`（情境）和 `student_personalities`（個性）
- `FeedbackReport` 與 `Session` 是 1:1 關係（`uselist=False`），在 `POST /session/{uuid}/end` 同步生成
- `EmotionLog` 每輪逐字稿一筆，記錄 9 種情緒分數（0.0–1.0）

初始資料（情境 × 學生個性）透過 `seed_data.py` 匯入，有防重複保護（先 `SELECT` 確認無資料才 INSERT）。

---

## 環境變數

必填：`LIVEKIT_URL`、`LIVEKIT_API_KEY`、`LIVEKIT_API_SECRET`、`OPENAI_API_KEY`、`DATABASE_URL`、`JWT_SECRET_KEY`

選填（有預設值）：`COACH_MODEL`（預設 `gpt-4o`）、`ENV`、`API_HOST`、`API_PORT`

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

---

## 範疇限制

此專案的所有後端與前端程式碼均嚴格限定在 `SELf-Corner/` 資料夾內。`virtual_classroom_livekit/` 是架構參考來源，不應修改。
