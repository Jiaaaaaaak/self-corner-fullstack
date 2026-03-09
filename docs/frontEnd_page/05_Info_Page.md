# 個人資料設計規範 (Info Page Spec)

`/info` 頁面管理用戶的身分資訊與平台使用時長。

## 1. 視覺佈局
*   **User Header**: 顯示大尺寸頭像、姓名與加入時間。
*   **Profile Form**: 詳細的個人資訊編輯區塊。
*   **Stats Area**: (預留) 顯示累計練習成就。

## 2. 區塊詳細規範

### 2.1 User Header
*   **Avatar**: 圓形, `#C05A3C` 填充。
*   **Join Info**: "since 2024.09" (顏色 `#A09C94`, 字號 12px)。

### 2.2 基本資料表單 (Profile Form)
*   **容器**: 背景 `#FFFFFF`，內距 `32px`，邊框 `#E5E2D9`。
*   **編輯按鈕**: 文字與圖示皆為 `#E07A5F`，字號 13px (Space Grotesk)。
*   **欄位設計**:
    - **標籤 (Label)**: Space Grotesk, 12px, Bold, 顏色 `#706C61`。
    - **數值框 (Value Box)**: 背景 `#F8F7F4`, 內距 `10px 14px`。
    - **內容文字**: Inter, 14px, 顏色 `#3D3831`。
*   **欄位列表**:
    - 姓名 (NAME)
    - 電子郵件 (EMAIL)
    - 學校 (SCHOOL)
    - 教學年資 (EXPERIENCE)

## 3. 交互行為
*   **編輯模式**: 點擊「編輯」後，數值框轉為 `input` 狀態，背景變為純白並增加高亮邊框。
*   **儲存反饋**: 點擊儲存後，使用 `sonner` 顯示成功訊息。
