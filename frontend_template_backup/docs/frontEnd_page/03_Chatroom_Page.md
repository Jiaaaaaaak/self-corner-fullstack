# 對話空間設計規範 (Chatroom Page Spec)

`/chatroom` 是系統的核心，包含「情境選擇」與「對話練習」兩個主要視圖。

## 1. 情境選擇視圖 (Scenario Selection)

### 1.1 頂部工具列 (Toolbar)
*   **標籤過濾 (Tags)**: 
    - 啟用中: `#3D3831` 背景, 白色文字。
    - 未啟用: 透明背景, `#E5E2D9` 邊框, `#706C61` 文字。
*   **換一批按鈕**: `#E5E2D9` 邊框，Hover 時觸發 `refresh-cw` 圖示旋轉。

### 1.2 情境卡片 (Scenario Card)
*   **尺寸**: 響應式 Grid 佈局。
*   **元素**:
    - Emoji (36px)。
    - 標題 (16px, Bold)。
    - 標籤 (小標籤背景 `#F0EDE6`, 文字 `#706C61`)。
    - 描述文字 (13px, 行高 1.5)。

## 2. 對話練習視圖 (Active Session)

### 2.1 學生視覺區 (Student Area)
*   **Avatar**: 圓形容器 (`120x120px`)，背景 `#F0EDE6`。
*   **表情符號**: 根據情緒狀態切換 (😤, 🥺, 🤔, 🧑‍🎓)。
*   **情緒標籤**: 顯示於 Avatar 下方，如「抗拒 · 防衛」 (背景 `#E07A5F15`, 文字 `#E07A5F`)。

### 2.2 對話面板 (Chat Panel)
*   **輸入模式 (Dual Mode)**: 支援語音輸入與文字輸入。語音輸入透過 LiveKit 實時傳輸，文字輸入透過 Data Channel 送出，皆可觸發 AI 學生回應。
*   **氣泡樣式**:
    - **教師 (我)**: 背景 `#E07A5F` (Terracotta)，文字白色，圓角 `16, 16, 4, 16`。
    - **學生**: 背景 `#81B29A20` (Sage Green 輕量版)，文字深咖，圓角 `16, 16, 16, 4`。
*   **氣泡內距**: `10px 14px`。

### 2.3 輸入控制列 (Input Bar)
*   **Mic Button**: `#E5E2D9` 邊框，內含 `mic` 圖示。
*   **Input Field**: 背景 `#F8F7F4` (淺米色)，字號 14px。
*   **Send Button**: 背景 `#E07A5F`，內含白色 `send` 圖示。

## 3. 側邊會話資訊 (Sidebar Session Info)
*   **Session Card**: 在側邊欄顯示當前練習情境名稱與計時器 (20px Bold, Space Grotesk)。
*   **底部操作**: 包含「暫停練習」與「結束對話」 (紅色 `#B54A4A`) 按鈕。
