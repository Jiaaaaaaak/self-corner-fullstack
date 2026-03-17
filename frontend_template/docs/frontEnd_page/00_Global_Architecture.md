# 全域前端架構規範 (Global Frontend Architecture & IA)

本文件定義 SELf-corner 的技術架構核心與導航邏輯，為開發者與設計師提供統一的實作準則。

## 1. 核心開發棧 (The Modern Stack)
*   **核心框架**: React 18+ (TypeScript)
*   **建構工具**: Vite
*   **路由系統**: `react-router-dom` v6
*   **樣式引擎**: Tailwind CSS + `shadcn/ui` (Radix UI)
*   **數據流管理**: 
    - **Server State**: TanStack Query v5 (處理 API 緩存與 Loading/Error 狀態)
    - **Local State**: Zustand (用於全域與持久化狀態，如登入資訊與 Session UUID)
*   **圖表庫**: Recharts (用於五力雷達圖)
*   **反饋系統**: `sonner` / `toast`

## 2. 導航體系 (Information Architecture)

### 2.1 頁面與路由對應
| 頁面 | 路由 | 存取權限 | 核心組件 |
| :--- | :--- | :--- | :--- |
| **登入頁面** | `/login` | Public | Login Card, Register Dialog |
| **首頁大廳** | `/home` | Private | Sidebar, Hero Section, Core Concepts |
| **對話空間** | `/chatroom` | Private | Scenario Grid, Student Avatar, Chat Panel |
| **專家回饋** | `/feedback` | Private | Radar Chart, Expert Suggestions |
| **歷史紀錄** | `/history` | Private | History List, Filter Bar |
| **個人資料** | `/info` | Private | Profile Form, Stats Card |

### 2.2 全域佈局組件：Sidebar & AppLayout
採用左側固定導航欄 (Sidebar) 搭配右側主內容區 (Main Content) 的佈局模式。
*   **Sidebar (260px)**: 
    - 背景色: `#1E1D1B` (Dark Espresso 深色版)
    - 導航項目: 具備 4px 左側邊框高亮 (`primary`) 與 15% 透明度背景。
*   **AppLayout**: 負責封裝 Sidebar 與 Main Content，並處理響應式斷點 (Mobile 端隱藏 Sidebar 改用 Sheet)。

## 3. 視覺一致性標準
*   **背景色**: 全域使用 `#FAF9F6` (Warm Sand)。
*   **間距系統**: 嚴格遵循 4px 增量系統 (`space-xs`=4px, `space-md`=16px)。
*   **圓角規範**: 
    - Card: `12px` (rounded-xl)
    - Button: `8px` (rounded-lg)
    - Avatar: `pill` (rounded-full)

## 4. 動態與交互標準
*   **轉場**: 頁面間切換使用 300ms 漸變 (Fade-in)。
*   **反饋**: 所有發送操作 (Send/Login) 必須具備 Loading 狀態 (`loader` icon)。
