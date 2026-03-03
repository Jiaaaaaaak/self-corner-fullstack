# SELf-Corner 使用指南

---

## 目錄

1. [環境需求](#1-環境需求)
2. [安裝與初始化](#2-安裝與初始化)
3. [啟動服務](#3-啟動服務)
4. [使用流程](#4-使用流程)
5. [頁面功能說明](#5-頁面功能說明)
6. [API 端點速查](#6-api-端點速查)
7. [常見問題](#7-常見問題)

---

## 1. 環境需求

| 項目 | 需求 |
|------|------|
| Python | 3.11 以上 |
| Node.js | 18 以上 |
| npm | 9 以上 |
| PostgreSQL | 14 以上 |
| LiveKit Server | Cloud 帳號或自架 |
| OpenAI API | 需有 Realtime API 存取權限 |

---

## 2. 安裝與初始化

### 2.1 建立後端虛擬環境

```bash
cd backend
python -m venv venv
```

啟動虛擬環境：

```bash
# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

> 啟動後終端機提示符會出現 `(venv)` 前綴，後續所有 Python 指令皆在此環境中執行。

### 2.2 複製後端環境變數範本

```bash
# 仍在 backend/ 目錄下
cp .env.example .env
```

編輯 `.env`，填入以下必要欄位：

```
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/your_db
JWT_SECRET_KEY=your_random_secret_key
```

### 2.3 建立 PostgreSQL 資料庫

```sql
CREATE DATABASE self_corner;
```

### 2.4 安裝後端依賴

```bash
# 確認虛擬環境已啟動（(venv) 前綴）
pip install -r requirements.txt
```

### 2.5 初始化資料庫並匯入初始資料

```bash
# 建立所有資料表 + 預填 10 個情境與 5 種學生個性
python seed_data.py
```

預期輸出：
```
[INFO] Database tables created successfully!
[Seed] Inserted 10 scenarios.
[Seed] Inserted 5 student personalities.
[Seed] Done.
```

### 2.6 安裝前端依賴

```bash
cd ../frontend
npm install
```

### 2.7 複製前端環境變數範本

```bash
# 在 frontend/ 目錄下
cp .env.example .env
```

編輯 `frontend/.env`（可依實際部署修改）：

```
VITE_API_URL=http://localhost:8000
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
```

---

## 3. 啟動服務

需要同時開啟 **3 個終端機視窗**：

### Terminal 1 — FastAPI 後端

```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python main.py
```

服務啟動後可訪問：
- API：`http://localhost:8000`
- 互動文件：`http://localhost:8000/docs`

### Terminal 2 — LiveKit Agent Worker

```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python -m agents.voice_pipeline dev
```

> Agent Worker 會等待 LiveKit 房間有參與者加入時，自動接管並啟動 OpenAI Realtime API 連線。

### Terminal 3 — 前端開發伺服器

```bash
cd frontend
npm run dev
```

前端啟動後訪問：`http://localhost:8080`

---

## 4. 使用流程

```
註冊/登入
    ↓
首頁（了解平台與 SEL 框架）
    ↓
對話空間 → 選擇情境
    ↓
系統隨機分配學生個性（開始對話）
    ↓
即時語音對話（透過 LiveKit WebRTC）
    ↓
點擊「結束」→ 後端觸發教練分析（gpt-4o）
    ↓
回饋報告頁
  ├─ SEL 五維雷達圖
  ├─ 學生情緒流動折線圖（9 種情緒分別顯示）
  ├─ 教練條列式回饋
  ├─ 與 AI 教練深度文字討論
  └─ 完整師生對話逐字稿
    ↓
歷史紀錄（顯示每次練習的回合數與時長，可點入查看回饋）
```

---

## 5. 頁面功能說明

### 5.1 登入頁（`/login`）

- 支援帳號（用戶名或電子信箱）+ 密碼登入
- 提供「註冊」彈窗（需填：用戶名、姓、名、電子信箱、密碼）
- 提供「忘記密碼」彈窗
- Google OAuth 按鈕（待串接，目前為預留位置）

### 5.2 首頁（`/home`）

- 顯示登入使用者姓名
- 說明平台初衷、SEL 五大核心能力、操作方式

### 5.3 對話空間（`/chatroom`）

| 功能 | 說明 |
|------|------|
| 情境卡 | 每次隨機顯示 6 張（從 10 個情境抽取），可點擊「換一批」刷新 |
| 情境詳情 | 點擊情境卡後展開完整情境說明，按「開始」進入對話 |
| 隨機情境 | 點擊「隨機情境」卡片由系統隨機選定 |
| 語音對話 | 開始後麥克風自動啟動，與 AI 虛擬學生進行即時語音互動 |
| 文字模式 | 透過文字輸入框發言，同樣會觸發 AI 學生語音回應；可與語音模式自由切換 |
| 暫停/繼續 | 點擊 ⏸ 暫停對話，麥克風停止傳送音訊 |
| 結束 | 點擊 🚪 結束對話，後端觸發教練分析後導向回饋頁 |

> **每次對話**：系統會從情境資料庫取得完整情境說明，並從 5 種學生個性中隨機選取一種，動態組裝 AI 學生的 Prompt，確保每次體驗不同。
>
> **輸入模式說明**：語音輸入與文字輸入皆透過 LiveKit 傳送給 Agent，最終都觸發 AI 學生語音回應，兩種模式下的發言內容都會即時顯示在對話框中。

### 5.4 回饋報告頁（`/feedback`）

| 區塊 | 說明 |
|------|------|
| SEL 指標分析 | 雷達圖顯示本次對話的五維 SEL 評分（1–10 分） |
| 學生情緒流動 | 折線圖顯示 9 種情緒（開心/悲傷/憤怒/驚訝/焦慮/挫折/自信/好奇/中性）隨對話輪次的變化 |
| 核心優化建議 | AI 教練依 KIST 12 張對話卡框架提供的條列式改進建議與分析 |
| 回顧討論 | 可與 AI 教練進行文字問答；教練擁有完整逐字稿與報告內容作為知識背景 |
| 對話紀錄 | 完整師生逐字稿（依 speaker 分側顯示） |
| 重試/練新情境 | 可直接重練相同情境或進入新情境 |

### 5.5 歷史紀錄頁（`/history`）

- 顯示所有已結束的練習 Session
- 每筆記錄顯示：練習日期、情境名稱、**回合數**（師生對話筆數）、**時長**（hh:mm 格式）
- 支援依情境名稱或日期搜尋
- 點擊任一記錄，會設定 sessionUuid 並跳轉至回饋報告頁

### 5.6 個人資料頁（`/info`）

- 顯示登入使用者資訊（姓名、電子郵件）
- 顯示累計練習次數
- 提供編輯與登出功能

---

## 6. API 端點速查

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/auth/register` | 註冊 |
| POST | `/auth/login` | 登入（設定 Cookie） |
| POST | `/auth/refresh` | 刷新 access token |
| POST | `/auth/logout` | 登出（撤銷 token） |
| GET | `/auth/me` | 取得當前使用者資訊 |
| GET | `/scenarios` | 取得所有情境列表 |
| POST | `/session/create` | 建立新 Session（帶 `scenario_id`） |
| POST | `/session/{uuid}/end` | 結束 Session + 觸發教練分析 |
| POST | `/livekit/token` | 取得 LiveKit 房間 Token |
| GET | `/report/{uuid}/feedback` | 取得完整回饋報告 |
| POST | `/report/{uuid}/chat` | 與教練進行文字對話 |
| GET | `/history` | 取得使用者所有歷史紀錄 |
| GET | `/history/{uuid}` | 取得特定歷史 Session 摘要 |

完整 API 文件：啟動後端後訪問 `http://localhost:8000/docs`

---

## 7. 常見問題

### Q：語音對話沒有反應？

**A**：請確認：
1. Terminal 2 的 LiveKit Agent Worker 已啟動且無錯誤
2. 瀏覽器已授權麥克風存取權限
3. `backend/.env` 中的 `LIVEKIT_URL`、`LIVEKIT_API_KEY`、`LIVEKIT_API_SECRET` 與 LiveKit Cloud 專案設定一致

### Q：結束對話後回饋頁顯示「尚無回饋報告」？

**A**：請確認：
1. `backend/.env` 中的 `OPENAI_API_KEY` 有效且有 `gpt-4o` 存取權限
2. 對話中有產生至少一筆逐字稿（需有實際語音或文字輸入）
3. 後端 Terminal 1 無錯誤訊息

### Q：登入後重新整理頁面被導回登入頁？

**A**：登入狀態透過 `localStorage` 持久化（Zustand persist），正常不會遺失。若發生此問題：
1. 確認後端 `JWT_SECRET_KEY` 在每次重啟後保持一致（在 `backend/.env` 中固定設定，而非自動生成）
2. 清除瀏覽器 `localStorage` 重新登入

### Q：`seed_data.py` 執行後提示「already exist, skipping」？

**A**：正常行為。代表初始資料已存在，不會重複匯入。

### Q：如何新增自訂情境或學生個性？

**A**：直接編輯 `backend/seed_data.py` 中的 `SCENARIOS` 或 `STUDENT_PERSONALITIES` 列表，然後重新執行：
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python seed_data.py
```
或直接透過 PostgreSQL 工具（如 pgAdmin）手動插入。

### Q：Teacher 端語音有說話，但前端對話框沒有出現老師的語音轉文字？

**A**：最常見原因是 Agent Worker 的 `session.update` 報錯，導致 `input_audio_transcription` 設定沒有生效。請確認：
1. Agent Worker 終端機有無 `[OpenAI Event] error` 訊息
2. 若有，通常是 `backend/agents/prompts.py` 的 `TOOLS_SCHEMA` 格式錯誤（Realtime API 格式與 Chat Completions API 不同，不可使用 `"function": {...}` 嵌套）

### Q：Agent Worker 結束時出現 `TypeError: a coroutine was expected, got None`？

**A**：此錯誤為非致命性（功能不受影響），但應修正。原因是 `ctx.add_shutdown_callback()` 需要傳入 async 函數，若傳入普通 lambda 會觸發此錯誤。請確認 `backend/agents/voice_pipeline.py` 的 shutdown callback 使用 `async def`。

### Q：登入時出現 `ValueError: password cannot be longer than 72 bytes` 或驗證失敗？

**A**：`passlib 1.7.4` 與 `bcrypt >= 5.0` 不相容。請確認 venv 中的 bcrypt 版本為 4.0.1：
```bash
pip show bcrypt  # 應顯示 Version: 4.0.1
pip install "bcrypt==4.0.1"  # 若不符合則重新安裝
```

---

*SELf-Corner v2.0 | 2026-03-03*
