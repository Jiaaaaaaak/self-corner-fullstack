# Design Tokens 規範庫 (Design Tokens & Variables)

本文件定義系統中所有的設計變量，完全同步自最新設計原稿 (`design.pen`)。

## 1. 色彩系統 (Color Palette)

| 變量名稱 | 色值 (HEX) | 名稱 | 語意用途 |
| :--- | :--- | :--- | :--- |
| `--color-bg-main` | `#FAF9F6` | Warm Sand | 全域背景。 |
| `--color-primary` | `#E07A5F` | Terracotta | 主要 CTA、關鍵高亮。 |
| `--color-secondary` | `#81B29A` | Sage Green | 成功、成長、平靜。 |
| `--color-accent` | `#F2CC8F` | Soft Gold | 特別成就、指標強調。 |
| `--color-text-main` | `#3D3831` | Dark Espresso | 主要閱讀文字。 |
| `--color-text-muted` | `#706C61` | Muted Gray | 次要描述、Placeholder。 |
| `--color-border` | `#E5E2D9` | Light Border | 分隔線、容器邊框。 |

## 2. 字階系統 (Typography Scale)

| Token | Size | Weight | 用途 |
| :--- | :--- | :--- | :--- |
| `text-display` | 36px | 700 | 頁面大標、得分數字。 |
| `text-h1` | 24px | 600 | 頁面主標題、卡片標題。 |
| `text-h2` | 20px | 600 | 區塊標題。 |
| `text-body` | 16px | 400 | 主要內容、建議文字。 |
| `text-label` | 14px | 500 | 標籤、按鈕、側邊欄項目。 |
| `text-caption` | 12px | 400 | 時間、註腳、輔助文字。 |

## 3. 間距系統 (Spacing)
*   `space-xs`: 4px
*   `space-sm`: 8px
*   `space-md`: 16px
*   `space-lg`: 24px
*   `space-xl`: 32px

## 4. 圓角與深度 (Effects)
*   **Radius**: `sm: 4px`, `md: 8px`, `lg: 12px`, `full: 999px`。
*   **Shadow**: 
    - `sm`: 4px blur (Card default)
    - `md`: 12px blur (Hover state)
    - `lg`: 24px blur (Dialog/CTA)
