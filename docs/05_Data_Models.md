# 資料模型設計 (Data Models) v5.0

- **最近更新日期**: 2026-02-28
- **版本**: 5.0

## 1. 關聯式資料庫 (PostgreSQL)

本專案使用 SQLAlchemy 2.0 (async) 進行 ORM 管理。

### 1.1 `users` (使用者)
| 欄位 | 型態 | 描述 |
| :--- | :--- | :--- |
| `id` | Integer (PK) | 唯一識別碼 |
| `email` | String | 登入電子郵件 (Unique) |
| `hashed_password` | String | bcrypt 加密後的密碼 |

### 1.2 `refresh_tokens` (刷新令牌)
| 欄位 | 型態 | 描述 |
| :--- | :--- | :--- |
| `id` | Integer (PK) | |
| `user_id` | Integer (FK) | 關聯用戶 |
| `token` | String | Refresh Token 內容 |
| `expires_at` | DateTime | 到期時間 |
| `is_revoked` | Boolean | 是否已撤銷 |

### 1.3 `scenarios` (情境)
| 欄位 | 型態 | 描述 |
| :--- | :--- | :--- |
| `id` | Integer (PK) | |
| `title` | String | 情境標題 |
| `description` | Text | 情境描述 |
| `system_prompt` | Text | 該情境對應的 AI 指令 |

### 1.4 `student_personalities` (學生個性)
| 欄位 | 型態 | 描述 |
| :--- | :--- | :--- |
| `id` | Integer (PK) | |
| `name` | String | 個性名稱 |
| `system_prompt` | Text | 該個性對應的 AI 指令 |

### 1.5 `sessions` (對話 Session)
| 欄位 | 型態 | 描述 |
| :--- | :--- | :--- |
| `uuid` | UUID (PK) | Session 唯一識別碼 |
| `user_id` | Integer (FK) | 關聯用戶 |
| `scenario_id` | Integer (FK) | 選用的情境 |
| `personality_id` | Integer (FK) | 分配的個性 |
| `livekit_room_name`| String | LiveKit 房間名稱 |
| `created_at` | DateTime | 開始時間 |

### 1.6 `transcripts` (逐字稿)
| 欄位 | 型態 | 描述 |
| :--- | :--- | :--- |
| `id` | Integer (PK) | |
| `session_uuid` | UUID (FK) | 關聯 Session |
| `speaker` | String | `teacher` / `student` |
| `content` | Text | 對話內容 |
| `source` | String | `realtime` / `text` |

### 1.7 `emotion_logs` (情緒日誌)
| 欄位 | 型態 | 描述 |
| :--- | :--- | :--- |
| `id` | Integer (PK) | |
| `session_uuid` | UUID (FK) | 關聯 Session |
| `scores` | JSON | 9 維情緒分數 (0.0-1.0) |
| `created_at` | DateTime | 紀錄時間 |

### 1.8 `feedback_reports` (回饋報告)
| 欄位 | 型態 | 描述 |
| :--- | :--- | :--- |
| `id` | Integer (PK) | |
| `session_uuid` | UUID (FK) | 關聯 Session |
| `sel_scores` | JSON | SEL 五維評分 |
| `analysis` | Text | 觀察亮點 |
| `feedback` | Text | 教練式啟發提問 |
| `kist_cards` | JSON | KIST 對話卡清單 |
