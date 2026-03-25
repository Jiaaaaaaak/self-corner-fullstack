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
8. [ngrok 遠端分享](#8-ngrok-遠端分享)

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
| Gmail 帳號 | 需開啟兩步驟驗證並申請 App Password（用於寄送驗證信與密碼重設信） |

---

## 2. 安裝與初始化

### 2.1 建立虛擬環境（在專案根目錄）

> ⚠️ **venv 建在專案根目錄**，不要建在 `backend/` 內部。後續所有 Python 指令（含 FastAPI、Agent Worker、seed_data.py）都從根目錄的 venv 取用。

```bash
# 在 ai-classroom/ 根目錄執行
python -m venv venv
```

啟動虛擬環境：

```bash
# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

> 啟動後終端機提示符會出現 `(venv)` 前綴。**每個需要執行 Python 的終端機視窗都必須先啟動 venv。**

### 2.2 複製後端環境變數範本

```bash
# 切到 backend/ 目錄（venv 保持啟動）
cd backend
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
FRONTEND_URL=http://localhost:8080
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email SMTP（Gmail App Password）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
SMTP_FROM_NAME=SELf-Corner
```

> **SMTP 設定說明**：`SMTP_USER` 填申請 App Password 的 Gmail 帳號，`SMTP_PASSWORD` 填 Google 產生的 16 碼應用程式密碼。詳見 [2.8 Gmail App Password 申請](#28-gmail-app-password-申請)。

### 2.3 建立 PostgreSQL 資料庫

```sql
CREATE DATABASE self_corner;
```

### 2.4 安裝後端依賴

```bash
# 確認：(1) 虛擬環境已啟動（(venv) 前綴），(2) 目前在 backend/ 目錄
pip install -r requirements.txt
```

### 2.5 初始化資料庫並匯入初始資料

```bash
# 確認 venv 已啟動，且在 backend/ 目錄下
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

### 2.8 Gmail App Password 申請

Email 驗證與忘記密碼功能需要 SMTP 寄信能力。本專案使用 Gmail App Password：

1. 到 Google 帳號安全性頁面，確認已開啟**兩步驟驗證**
2. 前往 [App Passwords](https://myaccount.google.com/apppasswords) 頁面
3. 選擇「其他」→ 輸入名稱 `SELf-Corner` → 點擊「產生」
4. 記下產生的 16 字元密碼，填入 `backend/.env` 的 `SMTP_PASSWORD`
5. `SMTP_USER` 填入該 Gmail 帳號（例如 `selfcorner.team@gmail.com`）

### 2.9 Google OAuth 憑證申請（Google 登入功能）

Google 登入功能需要在 Google Cloud Console 申請 OAuth 2.0 憑證，取得 `GOOGLE_CLIENT_ID` 與 `GOOGLE_CLIENT_SECRET`。

#### 步驟一：建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)，用 Google 帳號登入
2. 左上角點擊「選取專案」→「新增專案」
3. 專案名稱輸入 `SELf-Corner`（或任意名稱），點擊「建立」
4. 等待建立完成後，確認已切換至該專案

#### 步驟二：設定 OAuth 同意畫面

1. 左側選單「API 和服務」→「OAuth 同意畫面」
2. User Type 選擇**外部**（External），點擊「建立」
3. 填寫以下欄位：
   - 應用程式名稱：`SELf-Corner`
   - 使用者支援電子郵件：選擇你的 Gmail
   - 開發人員聯絡資訊：填入你的 email
4. 點擊「儲存並繼續」
5. 範圍（Scopes）頁面，點擊「新增或移除範圍」，勾選：
   - `email`
   - `profile`
   - `openid`
6. 點擊「更新」→「儲存並繼續」
7. 測試使用者頁面，點擊「Add Users」，加入所有需要測試 Google 登入的 Gmail 帳號
8. 點擊「儲存並繼續」→「返回資訊主頁」

> ⚠️ 同意畫面處於「測試中」狀態時，**只有被加入的測試使用者能完成 Google 登入**，其他人會看到錯誤畫面。最多可加 100 個測試使用者，開發階段完全夠用。

#### 步驟三：建立 OAuth 2.0 憑證

1. 左側選單「API 和服務」→「憑證」
2. 點擊上方「建立憑證」→「OAuth 用戶端 ID」
3. 應用程式類型選擇**網頁應用程式**
4. 名稱可填 `SELf-Corner Web`（任意）
5. **已授權的 JavaScript 來源**，點擊「新增 URI」，加入：
   - `http://localhost:5173`
   - `http://localhost:8080`
6. **已授權的重新導向 URI**，點擊「新增 URI」，加入：
   - `http://localhost:8000/auth/google/callback`
7. 點擊「建立」

建立完成後會顯示兩個值：

| 欄位 | 範例 | 填入 `.env` 的位置 |
|------|------|-------------------|
| 用戶端 ID | `123456789-xxxxx.apps.googleusercontent.com` | `GOOGLE_CLIENT_ID` |
| 用戶端密碼 | `GOCSPX-xxxxxxxxxxxxxxxxxx` | `GOOGLE_CLIENT_SECRET` |

#### 步驟四：填入環境變數

將取得的值填入 `backend/.env`：

```
GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
```

> **重要**：`GOOGLE_REDIRECT_URI` 必須與步驟三第 6 點填入的「已授權的重新導向 URI」**完全一致**，包含 protocol（http/https）和 port。

> **若不使用 Google 登入**：可以不設定這三個值，Google 登入按鈕點擊後會失敗但不影響其他功能。

---

## 3. 啟動服務

需要同時開啟 **3 個終端機視窗**：

> ⚠️ **Terminal 1 與 Terminal 2 都必須啟動 venv**，每個視窗各自獨立執行一次啟動指令。Terminal 3（前端）使用 npm，**不需要** venv。

### Terminal 1 — FastAPI 後端

```bash
# 從專案根目錄（ai-classroom/）
source venv/bin/activate  # Windows: venv\Scripts\activate
cd backend
python main.py
```

服務啟動後可訪問：
- API：`http://localhost:8000`
- 互動文件：`http://localhost:8000/docs`

### Terminal 2 — LiveKit Agent Worker

```bash
# 從專案根目錄（ai-classroom/）
source venv/bin/activate  # Windows: venv\Scripts\activate
cd backend
python -m agents.voice_pipeline dev
```

> Agent Worker 會等待 LiveKit 房間有參與者加入時，自動接管並啟動 OpenAI Realtime API 連線。

### Terminal 3 — 前端開發伺服器

```bash
# 不需要 venv，直接執行
cd frontend
npm run dev
```

前端啟動後訪問：`http://localhost:8080`

---

## 4. 使用流程

```
註冊（填寫帳號資訊）
    ↓
收到驗證信 → 點擊連結完成 Email 驗證
    ↓
登入（支援帳號密碼或 Google OAuth）
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
  - 註冊成功後自動切換為「等待驗證」畫面，提示使用者前往信箱點擊驗證連結
  - 15 秒後顯示「重新寄送驗證信」按鈕
  - 使用者完成驗證後切回此頁面，系統自動偵測並登入
- 提供「沒收到驗證信？」連結（位於登入表單內），可重新寄送驗證信
- 提供「忘記密碼」彈窗，輸入信箱後寄送密碼重設連結
- Google OAuth 登入（需在 `backend/.env` 設定 `GOOGLE_CLIENT_ID` 與 `GOOGLE_CLIENT_SECRET`）

### 5.2 Email 驗證頁（`/verify-email`）

- 使用者點擊驗證信中的連結後自動開啟此頁面
- 頁面載入時自動呼叫後端 API 完成驗證
- 驗證成功後顯示成功訊息，隨後自動關閉分頁（若瀏覽器不支援自動關閉，會提示使用者手動關閉）

### 5.3 密碼重設頁（`/reset-password`）

- 使用者點擊密碼重設信中的連結後開啟此頁面
- 載入時先驗證 token 是否有效，無效則顯示「連結已過期」
- 輸入新密碼（須符合與註冊相同的密碼規則：至少 10 字元且含英文字母）
- 重設成功後 3 秒自動跳轉至登入頁

### 5.4 首頁（`/home`）

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
| POST | `/auth/register` | 註冊（自動寄出驗證信） |
| POST | `/auth/login` | 登入（需已完成 Email 驗證） |
| POST | `/auth/refresh` | 刷新 access token |
| POST | `/auth/logout` | 登出（撤銷 token） |
| GET | `/auth/me` | 取得當前使用者資訊 |
| GET | `/auth/verify-email` | 驗證 Email（帶 `token` query 參數） |
| POST | `/auth/resend-verification` | 重新寄送驗證信 |
| POST | `/auth/forgot-password` | 忘記密碼（寄送重設連結） |
| POST | `/auth/reset-password` | 重設密碼（帶 `token` 與 `new_password`） |
| GET | `/auth/validate-reset-token` | 檢查密碼重設 token 是否有效 |
| GET | `/auth/google/login` | 重導向至 Google 授權頁 |
| GET | `/auth/google/callback` | Google OAuth 回調處理 |
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

### Q：註冊後沒有收到驗證信？

**A**：請確認：
1. `backend/.env` 中的 `SMTP_USER`、`SMTP_PASSWORD` 已正確填入（`SMTP_PASSWORD` 為 Google 16 碼應用程式密碼，非 Gmail 登入密碼）
2. 檢查垃圾郵件匣（Gmail 寄出的信有時會被歸類為垃圾郵件）
3. 確認 `FRONTEND_URL=http://localhost:8080`（須與前端實際 port 一致，驗證信中的連結依此產生）
4. 後端 Terminal 1 查看是否有 `[WARN] 驗證信寄送失敗` 的錯誤訊息
5. 可在登入頁點擊「沒收到驗證信？」重新寄送

### Q：點擊驗證連結後顯示「驗證連結無效或已過期」？

**A**：驗證連結有效期為 24 小時。若已過期，請在登入頁點擊「沒收到驗證信？」重新寄送。每次重寄會產生新的 token，舊的會自動失效。

### Q：忘記密碼的重設信收不到？

**A**：與驗證信相同的 SMTP 設定。請確認 `.env` 中的 SMTP 相關變數正確。密碼重設連結有效期為 1 小時。注意：純 Google OAuth 使用者（沒有設定密碼的帳號）不會收到重設信，請直接使用 Google 登入。

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

**A**：登入狀態透過 `AuthInitializer` 元件（`App.tsx`）在頁面載入時自動呼叫 `/auth/me` 恢復。若仍被導回登入頁：
1. 確認後端 `JWT_SECRET_KEY` 在每次重啟後保持一致（在 `backend/.env` 中固定設定，而非自動生成）
2. 確認 `backend/.env` 的 `FRONTEND_URL` 與前端實際 port 一致（預設為 `http://localhost:8080`）

### Q：Google OAuth 登入後被導回登入頁而非首頁？

**A**：Google OAuth 透過整頁 302 重導向完成，回到前端後由 `AuthInitializer` 自動以 cookie 呼叫 `/auth/me` 恢復登入狀態。若失敗：
1. 確認 `backend/.env` 中 `FRONTEND_URL=http://localhost:8080`（須與前端實際 port 一致）
2. 確認 `vite.config.ts` 的 `server.proxy` 有設定 `/auth` 轉發至 `http://localhost:8000`
3. 確認 `GOOGLE_CLIENT_ID` 與 `GOOGLE_CLIENT_SECRET` 正確且已在 Google Cloud Console 設定正確的 redirect URI

### Q：`seed_data.py` 執行後提示「already exist, skipping」？

**A**：正常行為。代表初始資料已存在，不會重複匯入。

### Q：如何新增自訂情境或學生個性？

**A**：直接編輯 `backend/seed_data.py` 中的 `SCENARIOS` 或 `STUDENT_PERSONALITIES` 列表，然後重新執行（記得啟動 venv）：
```bash
source venv/bin/activate  # Windows: venv\Scripts\activate（在 ai-classroom/ 根目錄）
cd backend
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

## 8. ngrok 遠端分享

ngrok 可將本機開發伺服器暴露為公開 HTTPS URL，適合 Demo 給外部人員或在沒有固定 IP 的環境下遠端分享。

> **適用情境**：期末報告 Demo、讓評審在自己裝置上試用、遠端協作測試。本機開發**不需要**啟動 ngrok。

---

### 8.1 下載並安裝 ngrok

#### 方法一：官網下載（所有平台）

1. 前往 [https://ngrok.com/download](https://ngrok.com/download)
2. 選擇對應作業系統（Windows / macOS / Linux）下載壓縮檔
3. 解壓縮後將執行檔放到系統 PATH 可存取的位置：
   - **Windows**：解壓縮到任意資料夾（如 `C:\ngrok\`），並將該路徑加入環境變數 `PATH`，或直接將 `ngrok.exe` 複製到 `C:\Windows\System32\`
   - **macOS / Linux**：`sudo mv ngrok /usr/local/bin/`

#### 方法二：套件管理工具

```bash
# macOS（Homebrew）
brew install ngrok/ngrok/ngrok

# Windows（Chocolatey）
choco install ngrok

# Windows（Winget）
winget install ngrok
```

確認安裝成功：

```bash
ngrok version
# 應輸出 ngrok version x.x.x
```

---

### 8.2 建立帳號並取得 Authtoken

ngrok 需要帳號才能建立 tunnel（免費方案已足夠 Demo 使用）。

1. 前往 [https://dashboard.ngrok.com/signup](https://dashboard.ngrok.com/signup) 註冊帳號
2. 登入後前往 **Your Authtoken** 頁面：[https://dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
3. 複製 Authtoken，執行以下指令完成設定：

```bash
ngrok config add-authtoken <YOUR_AUTHTOKEN>
```

設定會寫入 `~/.config/ngrok/ngrok.yml`（macOS/Linux）或 `%USERPROFILE%\AppData\Local\ngrok\ngrok.yml`（Windows），**只需設定一次**。

---

### 8.3 啟動服務

依照 [第 3 節](#3-啟動服務) 正常啟動所有三個服務後，**額外開第 4 個終端機**執行 ngrok：

```bash
# Terminal 4 — ngrok（不需要 venv）
ngrok http 8080
```

啟動後終端機會顯示類似：

```
Forwarding   https://abcd-1234-5678.ngrok-free.app -> http://localhost:8080
```

記下這個 `https://xxxx.ngrok-free.app` URL，這就是分享給外部使用者的網址。

> **注意**：免費方案每次重啟 ngrok 都會產生**不同的 URL**，需重新更新以下設定。

---

### 8.4 更新後端環境變數

由於後端 CORS 設定需要允許來自 ngrok URL 的請求，每次取得新 URL 後需更新 `backend/.env`：

```bash
# 編輯 backend/.env，找到（或新增）以下行：
CORS_ORIGINS=https://abcd-1234-5678.ngrok-free.app
```

若有**多個** ngrok URL（例如同時分享給多人），以逗號分隔：

```
CORS_ORIGINS=https://xxxx.ngrok-free.app,https://yyyy.ngrok-free.app
```

修改 `.env` 後**重啟 FastAPI**（Terminal 1）才會生效：

```bash
# 中斷 Terminal 1（Ctrl+C）後重新啟動
cd backend
python main.py
```

---

### 8.5 更新 Google OAuth 設定（使用 Google 登入時才需要）

若使用者需要透過 ngrok URL 進行 **Google OAuth 登入**，須額外更新兩個設定：

#### 步驟一：更新 `backend/.env`

```bash
FRONTEND_URL=https://abcd-1234-5678.ngrok-free.app
GOOGLE_REDIRECT_URI=https://abcd-1234-5678.ngrok-free.app/auth/google/callback
```

> `FRONTEND_URL` 同時影響**驗證信**與**密碼重設信**中的連結 URL。若有寄信需求（使用者透過 ngrok URL 完成 Email 驗證或密碼重設），也必須更新此欄位。

#### 步驟二：在 Google Cloud Console 新增 redirect URI

1. 前往 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. 找到對應的 OAuth 2.0 Client ID，點擊編輯
3. 在「已授權的重新導向 URI」新增：
   ```
   https://abcd-1234-5678.ngrok-free.app/auth/google/callback
   ```
4. 儲存

更新後**重啟 FastAPI**。

---

### 8.6 完整啟動順序（含 ngrok）

```
Terminal 1：python main.py          （FastAPI，port 8000）
Terminal 2：python -m agents.voice_pipeline dev  （LiveKit Agent Worker）
Terminal 3：npm run dev              （前端，port 8080）
Terminal 4：ngrok http 8080          （取得 ngrok URL）
→ 更新 backend/.env 的 CORS_ORIGINS
→ 重啟 Terminal 1
→ 將 https://xxxx.ngrok-free.app 分享給外部使用者
```

---

### 8.7 常見問題

**Q：瀏覽器開啟 ngrok URL 顯示警告頁（「You are about to visit...」）？**

A：ngrok 免費方案會對外部訪客顯示一個警告頁。使用者點擊「Visit Site」即可繼續。若要跳過此頁面，可要求訪客在瀏覽器開發者工具中設定 Cookie，或改用 ngrok 付費方案（提供自訂網域）。

**Q：更新 `CORS_ORIGINS` 並重啟後，仍出現 CORS 錯誤？**

A：請確認：
1. `.env` 中的 URL **不含**結尾斜線（`/`），例如 `https://xxxx.ngrok-free.app`（正確）而非 `https://xxxx.ngrok-free.app/`（錯誤）
2. FastAPI 確實已重啟（Ctrl+C 後重新執行 `python main.py`）
3. 後端 Terminal 1 啟動訊息中確認 `[INFO] Starting SELf-Corner Backend...` 已出現

**Q：ngrok 重啟後 URL 改變，所有設定要重做一遍？**

A：是的，免費方案每次重啟都會更換 URL。可考慮：
- 購買 ngrok 付費方案，使用靜態網域（Static Domain）
- 或在 Demo 期間保持 ngrok 持續執行（不要中斷 Terminal 4）

**Q：語音功能（LiveKit）在 ngrok 下無法使用？**

A：LiveKit 使用 WebRTC，連線至 LiveKit Cloud（`wss://your-project.livekit.cloud`），與 ngrok tunnel 無關，不受影響。確認 `backend/.env` 中的 `LIVEKIT_URL`、`LIVEKIT_API_KEY`、`LIVEKIT_API_SECRET` 設定正確即可。

---

*SELf-Corner v2.2 | 2026-03-09*
