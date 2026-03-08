# 系統設計文件 (System Design) v5.0

- **最近更新日期**: 2026-02-28
- **版本**: 5.0

## 1. 技術棧與選型理由 (Technology Stack)

| 層級 | 技術 | 選型理由 |
| :--- | :--- | :--- |
| **後端 API** | FastAPI (Python 3.11+) | 非同步支援優異，適合處理 AI API 的 I/O 等待與 RESTful 服務。 |
| **前端框架** | React 18 + TypeScript (Vite) | 嚴謹的型別安全，成熟的組件化生態，適配 Vite 快速開發。 |
| **UI 元件庫** | shadcn/ui + Tailwind CSS | 現代化、高度可自訂的 UI 設計。 |
| **狀態管理** | TanStack Query + Zustand | 分離伺服器狀態與本地持久化狀態。 |
| **資料庫** | PostgreSQL + SQLAlchemy 2.0 | 強大的關聯式查詢能力，SQLAlchemy 非同步模式確保效能。 |
| **即時通訊** | LiveKit (WebRTC) | 專業的語音串流管理與 Agent 工作流程調度。 |
| **語音 AI** | OpenAI Realtime API | 整合 STT/LLM/TTS，大幅降低對話延遲。 |
| **教練 AI** | OpenAI gpt-4o | 用於 Session 結束後的深度分析與報告生成。 |

## 2. 核心元件設計：LiveKit Agent Worker

LiveKit Agent Worker 是系統的對話核心，它作為橋樑連接了前端與 OpenAI Realtime API。

### 2.1 對話流程設計
1. **加入房間**: 用戶進入 `Chatroom` 頁面，前端透過後端 API 取得 LiveKit Token 並加入房間。
2. **Agent 派發**: LiveKit Server 偵測到新參與者，自動 dispatch 一個 Agent Worker 實例。
3. **建立連線**: Agent Worker 向 OpenAI Realtime API 建立 WebSocket 連線。
4. **雙向通訊**:
    - **語音**: 前端語音透過 WebRTC 傳至 Agent，Agent 轉發至 OpenAI。
    - **文字**: 前端文字透過 Data Channel 傳至 Agent，Agent 模擬為文字輸入傳至 OpenAI。
5. **情緒分析**: 在每輪對話中，Agent 呼叫 `semantic_analysis` tool，由 `gpt-3.5-turbo` 進行語意分析並記錄。

## 3. 回饋報告生成流程

Session 結束後，系統需生成量化與質化的回饋報告。

1. **觸發結束**: 用戶點擊「結束對話」，前端呼叫 `POST /session/{uuid}/end`。
2. **資料彙整**: 後端從 `transcripts` 表取得該 Session 的完整對話內容。
3. **Coach LLM 調用**: 使用 LangChain 封裝對 OpenAI `gpt-4o` 的請求，傳入對話紀錄與 SEL/KIST 指引。
4. **JSON 解析**: 教練生成包含 `sel_scores`、`analysis`、`feedback`、`kist_cards` 的 JSON 字串。
5. **資料持久化**: 將報告存入 `feedback_reports` 表，標記 Session 為 `completed`。

## 4. 認證與安全設計

### 4.1 JWT 與 Cookie 策略
- **Access Token**: 存儲於 HttpOnly Cookie，有效期 15 分鐘。
- **Refresh Token**: 存儲於 `refresh_tokens` 表與 HttpOnly Cookie，有效期 7 天。
- **Token Rotation**: 每次刷新 Token 時，舊的 Refresh Token 會被撤銷並核發新的，防止重放攻擊。

### 4.2 API 安全
- **CORS 設定**: 限制僅允許信任的前端域名存取。
- **路由保護**: 使用 FastAPI Dependency 注入，確保受保護路由必須具備有效的 `user_id`。

## 5. 技術限制與注意事項

- **Realtime API Tool Schema**: 必須嚴格遵循平鋪結構（無 `function` 嵌套），否則會導致 session 更新失敗。
- **bcrypt 版本**: 釘死在 `4.0.1` 以維持與 `passlib` 的相容性。
- **DB Migration**: 目前暫無 migration 工具，schema 異動需手動處理或重置資料庫。
