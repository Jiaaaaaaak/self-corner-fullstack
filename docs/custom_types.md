# SQLAlchemy 自定義型別說明

> 適用對象：資料庫工程師、DBA
> 對應專案：SELf-Corner（`models.py`）

---

## 概述

`models.py` 中有兩種欄位型別不是 PostgreSQL 內建的基本型別（如 `INTEGER`、`TEXT`），而是透過 SQLAlchemy 的 `Enum` 機制，將 Python 列舉（`enum.Enum`）映射為 **PostgreSQL 原生 ENUM 型別**。

本文說明這些型別的定義方式、在資料庫層的實際型態，以及維護時的注意事項。

---

## 定義的自定義型別

### `UserRole`

```python
class UserRole(str, enum.Enum):
    TEACHER = "teacher"
    ADMIN   = "admin"
```

| 欄位 | 資料表 | 欄位定義 |
|------|--------|----------|
| `role` | `users` | `role userrole DEFAULT 'teacher'` |

---

### `AgentType`

```python
class AgentType(str, enum.Enum):
    STUDENT = "student"
    EXPERT  = "expert"
```

| 欄位 | 資料表 | 欄位定義 |
|------|--------|----------|
| `agent_type` | `conversations` | `agent_type agenttype NOT NULL` |

---

## PostgreSQL 層的實際型態

應用程式首次執行 `create_all()` 時，SQLAlchemy 會在 PostgreSQL 建立對應的原生 ENUM 型別，然後在欄位定義中引用這些型別。

### 自動產生的 DDL

```sql
-- 建立自定義型別
CREATE TYPE userrole AS ENUM ('teacher', 'admin');
CREATE TYPE agenttype AS ENUM ('student', 'expert');

-- 在資料表欄位中使用
CREATE TABLE users (
    ...
    role userrole NOT NULL DEFAULT 'teacher',
    ...
);

CREATE TABLE conversations (
    ...
    agent_type agenttype NOT NULL,
    ...
);
```

### 查詢現有 ENUM 型別

```sql
-- 查詢所有自定義 ENUM 型別及其合法值
SELECT
    t.typname        AS enum_name,
    e.enumlabel      AS enum_value,
    e.enumsortorder  AS sort_order
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
ORDER BY t.typname, e.enumsortorder;
```

預期結果：

| enum_name | enum_value | sort_order |
|-----------|------------|------------|
| agenttype | student    | 1 |
| agenttype | expert     | 2 |
| userrole  | teacher    | 1 |
| userrole  | admin      | 2 |

---

## 為什麼使用原生 ENUM 而非 VARCHAR

| 比較項目 | PostgreSQL 原生 ENUM | VARCHAR |
|----------|----------------------|---------|
| **DB 層資料驗證** | 插入非法值時，PostgreSQL 直接報錯 | 無驗證，需仰賴應用層 |
| **儲存效率** | 內部以 OID 儲存，略優於字串 | 標準字串儲存 |
| **可讀性** | `\d+ users` 可直接看出合法值範圍 | 無法從結構判斷 |
| **新增合法值** | 需 `ALTER TYPE` | 直接改程式即可 |
| **刪除 / 改名合法值** | PostgreSQL 不直接支援，需重建型別 | 直接改程式即可 |

---

## 維護操作

### 新增合法值

PostgreSQL 支援直接新增值（不影響現有資料）：

```sql
-- 新增 userrole 的值
ALTER TYPE userrole ADD VALUE 'superadmin';

-- 新增 agenttype 的值
ALTER TYPE agenttype ADD VALUE 'observer';
```

> 注意：新值一旦加入，**無法透過 `ALTER TYPE` 移除**。

---

### 刪除或改名合法值

PostgreSQL 目前不支援直接刪除或改名 ENUM 值，需走以下流程：

```sql
-- 步驟 1：建立新型別
CREATE TYPE agenttype_new AS ENUM ('student', 'expert', 'observer');

-- 步驟 2：將欄位改用新型別（需轉型）
ALTER TABLE conversations
    ALTER COLUMN agent_type TYPE agenttype_new
    USING agent_type::text::agenttype_new;

-- 步驟 3：刪除舊型別
DROP TYPE agenttype;

-- 步驟 4：重新命名
ALTER TYPE agenttype_new RENAME TO agenttype;
```

> 執行前務必確認應用程式的 Python 程式碼（`models.py`）也已同步更新，否則應用層會與 DB 層不一致。

---

### 確認欄位目前使用的型別

```sql
SELECT
    table_name,
    column_name,
    udt_name   AS pg_type
FROM information_schema.columns
WHERE udt_name IN ('userrole', 'agenttype')
ORDER BY table_name, column_name;
```

---

## 應用層與資料庫層的對應關係

Python 使用 `str + enum.Enum` 混合繼承，讓每個列舉成員本身就是一個字串，與 PostgreSQL ENUM 值完全對應：

```python
# Python 端
AgentType.STUDENT == "student"   # True
str(AgentType.STUDENT)           # "student"

# 寫入 DB：Python enum → 取出字串值 → 存為 PostgreSQL ENUM
# 讀出 DB：PostgreSQL ENUM 字串 → SQLAlchemy 自動轉回 Python enum 成員
```

資料庫工程師在做資料查詢或手動更新時，直接使用字串值即可：

```sql
-- 查詢所有老師角色的使用者
SELECT * FROM users WHERE role = 'teacher';

-- 手動更新某筆對話的 agent_type
UPDATE conversations SET agent_type = 'expert' WHERE id = 42;
```

---

## 相關檔案

| 檔案 | 說明 |
|------|------|
| `models.py` | ENUM 型別定義與 ORM 欄位宣告 |
| `seed_data.py` | 初始資料匯入（呼叫 `init_db()` 觸發 `create_all()`） |
| `database.py` | `init_db()` 實作，內含 `Base.metadata.create_all()` |

---

*SELf-Corner 內部技術文件 — 2026-03-03*
