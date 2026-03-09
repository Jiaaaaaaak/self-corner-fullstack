# 響應式與無障礙設計規範 (Responsive & a11y Spec)

本平台遵循 WCAG 2.1 AA 標準，確保易用性與兼容性，服務所有類型的教師使用者。

## 1. 響應式斷點策略 (Responsive Breakpoints)

| 裝置類型 | 寬度斷點 | 佈局行為 |
| :--- | :--- | :--- |
| **Mobile** | < 640px | 單欄佈局, 導航收納入 HamburgerMenu, 字體放大 10% |
| **Tablet** | 640px - 1024px | 兩欄佈局, 側邊選單可收合 (Compact mode) |
| **Desktop** | > 1024px | 三欄佈局 (Feedback), 側邊選單常駐 |

## 2. 互動適配規範

*   **觸控目標 (Touch Targets)**: 行動端所有點擊元素最小尺寸為 `44x44px`。
*   **虛擬鍵盤 (Virtual Keyboard)**: 對話輸入框應固定在鍵盤上方，不遮擋學生頭像。

## 3. 無障礙設計 (a11y)

*   **色彩對比**: 主要文字對比度需至少 `4.5:1`。
*   **鍵盤導覽**: 所有對話框支援 `Esc` 關閉，並具備明確的 `Focus Ring`。
*   **螢幕閱讀器**:
    - 學生情緒變更時，透過 `aria-live` 告知。
    - 所有 Icon (如 Help, Settings) 必須配置 `aria-label`。

## 4. 性能與渲染
*   低效能設備自動關閉 `backdrop-blur` 與複雜漸變動畫，確保核心對話流程順暢。
