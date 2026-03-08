# API 規格文件 (API Specification) v5.0

- **最近更新日期**: 2026-02-28
- **版本**: 5.0

## 1. 共通規格

*   **Base URL:** `http://localhost:8000/api`
*   **資料格式:** `application/json`
*   **授權機制:** JWT 儲存於 HttpOnly Cookie。

---

## 2. 身份認證 (Auth)

### POST `/auth/register`
- **描述**: 註冊新帳號。
- **Request**: `{ "email": "...", "password": "..." }`
- **Response**: 201 Created.

### POST `/auth/login`
- **描述**: 登入並核發 Access/Refresh Token (HttpOnly Cookie)。
- **Request**: `{ "email": "...", "password": "..." }`
- **Response**: `{ "id": "...", "email": "..." }`

### POST `/auth/refresh`
- **描述**: 使用 Refresh Token 換領新的 Access/Refresh Token。
- **Response**: 200 OK.

### POST `/auth/logout`
- **描述**: 登銷 Access/Refresh Token。
- **Response**: 200 OK.

---

## 3. 會話管理 (Sessions)

### POST `/session/start`
- **描述**: 開始一個新的對話 Session。
- **Request**: `{ "scenario_id": int }`
- **Response**: `{ "uuid": "...", "livekit_room": "...", "livekit_token": "..." }`

### POST `/session/{uuid}/end`
- **描述**: 結束會話並觸發教練回饋生成。
- **Response**: `{ "report_ready": true, "session_id": "..." }`

### GET `/sessions`
- **描述**: 取得當前用戶的歷史對話清單。
- **Response**: `[ { "uuid": "...", "scenario_name": "...", "created_at": "...", "has_report": bool }, ... ]`

---

## 4. 回饋報告 (Reports)

### GET `/report/{session_uuid}`
- **描述**: 取得特定 Session 的回饋報告。
- **Response**:
    ```json
    {
      "sel_scores": {
        "self_awareness": 0.8,
        "self_management": 0.7,
        "social_awareness": 0.9,
        "relationship_skills": 0.6,
        "responsible_decision_making": 0.8
      },
      "analysis": "...",
      "feedback": "...",
      "kist_cards": ["card1", "card2"],
      "transcripts": [ ... ]
    }
    ```

---

## 5. 即時通訊 (LiveKit)

- **WebSocket URL**: 由 LiveKit Server 提供（通常為 `ws://localhost:7800`）。
- **Data Channel Events**:
    - `teacher_text_input`: `{ "type": "teacher_text_input", "text": "..." }`
    - `agent_response`: `{ "type": "agent_response", "text": "..." }`
    - `user_transcription`: `{ "type": "user_transcription", "text": "..." }`
