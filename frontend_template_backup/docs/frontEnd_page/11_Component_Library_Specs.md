# 自定義組件庫詳細規範 (Component Library Specs)

本文件標準化 SELf-corner 的商業組件與 `shadcn/ui` 基礎組件覆蓋，確保全站 UI 的原子級一致性。

## 1. 商業組件規範 (Business Components)

### 1.1 ScenarioCard (情境卡片)
*   **結構**: Emoji + Title (600) + Tags (flex-wrap) + Description (line-clamp: 2)。
*   **參數**: Padding 24px, Radius 16px, Gap 16px。
*   **狀態矩陣**:
    - **Default**: `bg-main`, `shadow-sm` (4px), `border-border`。
    - **Hover**: `bg-main`, `shadow-md` (12px), `border-primary/30`。
    - **Disabled**: `bg-muted`, `grayscale`, `shadow-none`。

### 1.2 ChatBubble (對話氣泡)
*   **Teacher (我)**: 
    - 背景: `bg-primary` (#E07A5F), 文字白色。
    - 圓角: `rounded-tr-none` (0, 12, 12, 12)。
*   **Student**: 
    - 背景: `bg-muted` (#E8E4DC), 文字 `text-main`。
    - 圓角: `rounded-tl-none` (12, 0, 12, 12)。
*   **內距**: 12px 16px。

## 2. 基礎組件覆蓋 (Base UI Overrides)

### 2.1 Buttons
*   **Primary**: 背景 `#E07A5F`, 填充 12px 20px, Hover 時 Opacity 0.9。
*   **Outline**: 1px 實線邊框 `#1a1a1a`, 文字 `#1a1a1a`, Hover 時背景 `bg-muted/10`。

### 2.2 Inputs
*   **Focus State**: 2px 邊框 `primary`, 搭配 `ring-primary/20` 高亮光暈。
*   **Error State**: 2px 邊框 `#B54A4A`, 文字與輔助文字皆為 `#B54A4A`。

## 3. 圖表規範 (Chart Specs)
*   **Radar Chart**: 具備本次得分 (Terracotta 實線) 與平均得分 (Light Border 虛線) 的對比視圖。
*   **Score Badge**: 根據分數等級 (A+, B+) 變換背景與文字色。
