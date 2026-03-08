# 登入頁面設計規範 (Login Page Spec)

`/login` 頁面旨在建立教師對平台的安全感與信賴感。

## 1. 視覺參數 (Visual Specs)
*   **背景**: `#FAF9F6` (Warm Sand)。
*   **Login Card**: 
    - 寬度: `440px`。
    - 填充: `#FFFFFF`。
    - 邊框: `1px solid #E5E2D9`。
    - 內距 (Padding): `40px`。

## 2. 頁面狀態矩陣 (State Matrix)

### 2.1 Empty State (初始狀態)
*   **Input**: 顯示佔位符文字 (Email, Password)，顏色 `#A09C94`。
*   **Login Button**: 
    - 背景色: `#D4C4B8` (禁用色)。
    - 文字顏色: `#A09C94`。
    - 狀態: `Disabled`。

### 2.2 Filled State (已填寫狀態)
*   **Login Button**: 
    - 背景色: `#E07A5F` (主色 Terracotta)。
    - 文字顏色: `#FFFFFF`。
    - 狀態: `Enabled`。

### 2.3 Validating State (驗證中)
*   **Input**: 透明度降至 `0.6`。
*   **Login Button**: 
    - 文字變更為 "驗證中..."。
    - 前方顯示 `loader` (Lucide) 旋轉動畫。
    - 背景色稍微變深至 `#C8694F`。

### 2.4 Error State (錯誤狀態)
*   **Error Banner**: 出現於 Card 頂部，背景 `#B54A4A14`，左側 3px 紅色邊框，文字顏色 `#B54A4A`。
*   **Input Border**: 變更為 `#B54A4A` (Error Red)。
*   **Interaction**: Card 觸發輕微的 `Shake` 震動動畫。

## 3. 組件細節
*   **Slogan**: "每個老師，都需要一個能安心犯錯的角落。" (字體: Inter, 字號: 14, 斜體, 顏色: `#706C61`)。
*   **Brand Icon**: `#E07A5F` 方塊底色搭配白色標誌。
*   **Password Toggle**: 使用 `eye` / `eye-off` 圖示，顏色 `#A09C94`。
