# 歷史紀錄設計規範 (History Page Spec)

`/history` 頁面讓用戶回顧過去的練習，並觀察成長趨勢。

## 1. 視覺佈局
*   **Header Row**: 標題、標籤與搜尋框。
*   **Filter Row**: 時間與分類篩選器。
*   **List Area**: 垂直排列的練習紀錄卡片。

## 2. 區塊詳細規範

### 2.1 搜尋與篩選 (Search & Filters)
*   **搜尋框**: 寬 `280px`，邊框 `#E5E2D9`，使用 `Inter` 字體。
*   **篩選按鈕**: 
    - 具備 `calendar` 或 `chevron-down` 圖示。
    - 內距 `8px 14px`，文字字號 12px (Space Grotesk)。

### 2.2 紀錄列表項目 (List Item)
*   **容器**: 
    - 背景 `#FFFFFF`，邊框 `#E5E2D9`。
    - 具備極細微陰影 `shadow-sm` (透明度 0.08)。
*   **內容組成**:
    - **日期欄**: 寬 `80px`，日期 (14px Bold) 搭配 星期 (12px Muted)。
    - **Emoji**: 大型圖示 (32px)，居中顯示。
    - **資訊欄**: 
        - 標題 (15px, Bold, 深咖)。
        - 輔助資訊 (12px, Muted): "練習時長 15:42 · 回合數 12"。
    - **評分標籤 (Score Badge)**: 
        - A+: 背景 `#81B29A15`, 文字 `#81B29A`。
        - B+: 背景 `#F2CC8F15`, 文字 `#D4A853`。
    - **導向圖示**: `chevron-right` (顏色 `#A09C94`)。

## 3. 響應式適配
*   **Mobile**: 日期欄與 Emoji 縮小，標題文字自動換行。
*   **Empty State**: 當無紀錄時，顯示溫暖的提示文案與前往對話空間的按鈕。
