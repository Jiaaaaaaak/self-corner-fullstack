# UI/UX 設計系統總綱 (Visual Identity & Philosophy)

本文件建立 SELf-corner 的設計靈魂。我們不只是做一個工具，而是為教師打造一個「心理避風港 (Safe Harbor)」。

## 1. 核心設計理念 (The "Safe Harbor" Concept)

教師在面對學生衝突時常處於高度防禦狀態。我們的設計必須透過視覺與互動，引導教師進入「一致性 (Congruence)」的溝通狀態。

* **溫暖 (Warmth)**: 使用大地色系 (Warm Sand, Terracotta)，消除 AI 的冰冷感。
* **安全 (Safety)**: 容許犯錯的環境，UI 應減少「警告式」紅字，改用「引導式」提示。
* **裝飾語意**: 採用粉筆點 (Chalk Dots) 與線條，營造教室黑板的親切感，透明度設定為 0.08 - 0.15。

## 2. 視覺語言：基礎規範 (Foundations)

### 2.1 色彩系統 (Semantic Colors)

* **Brand**: `#C05A3C` (專屬品牌方塊色)。
* **Primary**: `#E07A5F` (主要行動、高亮)。
* **Background**: `#FAF9F6` (全域底色)。
* **Success/Growth**: `#81B29A` (Sage Green)。
* **Accent**: `#F2CC8F` (Soft Gold)。

### 2.2 字階與排版 (Typography)

* **標題 (Headings)**: Space Grotesk (700/600 字重)。
* **內文 (Body)**: Inter (400 字重)。
* **規範**: 採用 4px 增量系統，確保字階比例平衡。

### 2.3 間距與網格 (Grid & Spacing)

* **Base Unit**: 4px。
* **Desktop Grid**: 12 欄位，最大寬度 1280px，間隙 24px。
* **Mobile Grid**: 4 欄位，邊距 16px，間隙 16px。

## 3. 組件設計原則 (Component Principles)

* **容器 (Surfaces)**: 使用 `rounded-xl` (12px) 圓角，搭配 Elev-1 輕量陰影。
* **交互 (Interactions)**:
  - Hover 狀態觸發 Elev-2 深度與 Y 軸 -4px 位移。
  - 所有重要動作 (如發送、登入) 必須具備平滑轉場與 Loading 反饋。
* **對話氣泡**: 教師與學生具備不對稱圓角設計，強調對話的流動感。

## 4. 動態與轉場 (Motion)

* 頁面切換: 300ms 漸變。
* 情緒切換: 學生表情採用 Cross-fade，避免突兀。
* 回饋氣泡: 彈跳進入 (Slide-in + Bounce)。
