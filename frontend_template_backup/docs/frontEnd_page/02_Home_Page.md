# 首頁大廳設計規範 (Home Page Spec)

`/home` 頁面作為入口，重點在於願景展示、理論基礎與快速開始。

## 1. 頁面佈局
*   **Sidebar (左側)**: 固定 260px，背景 `#1E1D1B`。
*   **Main Content (右側)**: 
    - Header (問候區)
    - Hero (願景區)
    - Concepts (理論基礎區)
    - CTA (快速開始區)

## 2. 區塊詳細規範

### 2.1 Welcome Header (問候區)
*   **Greeting**: "早安，王老師 👋" (Space Grotesk, 28px, Bold)。
*   **Search Box**: 寬 `240px`，邊框 `#E5E2D9`，內含 `search` 圖示。
*   **Notification**: 具備 `bell` 圖示，右上角有 `#E07A5F` 的小圓點提示。

### 2.2 Product Vision (Hero Section)
*   **Hero Card**: 背景色 `#3D3831` (深咖)，內距 `48px 56px`。
*   **Slogan**: "在安心的空間裡，練習溫柔而堅定的對話" (32px, Bold, 白色)。
*   **Stats Row**:
    - 500+ 練習情境 (`#E07A5F`)
    - 2,400+ 教師使用者 (`#81B29A`)
    - 96% 正向回饋率 (`#F2CC8F`)

### 2.3 Core Concepts (理論基礎)
*   **卡片設計**: 
    - 背景 `#FFFFFF`，Hover 時位移 `Y-4px` 並增加 `shadow-md`。
    - 每個卡片對應一個 SEL 能力，配有專屬背景色的圖示容器 (如: 自我覺察配 `#E07A5F20`)。

### 2.4 Quick Start (快速開始)
*   **CTA Card**: 白色背景，內距 `40px 48px`。
*   **Primary Action**: "進入練習空間" (背景 `#E07A5F`, 配有 `play` 圖示)。
*   **Secondary Action**: "瀏覽學習資源" (邊框按鈕, 配有 `book-open` 圖示)。

## 3. 視覺參數
*   **Typography**: 標題使用 `Space Grotesk`，內文使用 `Inter`。
*   **Main Background**: `#FAF9F6` (Warm Sand)。
