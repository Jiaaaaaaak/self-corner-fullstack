# 動態與交互指南 (Motion & Interaction Guidelines)

動態設計不只是裝飾，它是 SELf-corner 提供「情緒反饋」與「流暢感」的關鍵路徑。

## 1. 動態原則 (Motion Principles)

*   **自然過渡 (Naturalism)**: 動畫應模擬自然物理行為，使用 ease-in-out 曲線讓過渡感覺流暢有機。
*   **低干擾 (Low Cognitive Load)**: 微妙的過渡優於華麗的動效，確保交互輔助而非阻礙使用者。
*   **回應性 (Responsiveness)**: 100ms 內的回應讓交互感覺即時。

## 2. 核心動畫定義 (Specs)

### 2.1 緩動曲線 (Easings)
*   **Standard**: `cubic-bezier(0.4, 0, 0.2, 1)` — 用於元素移動、展開、收合。
*   **Decelerate**: `cubic-bezier(0.0, 0, 0.2, 1)` — 用於元素從外部進入視圖。
*   **Accelerate**: `cubic-bezier(0.4, 0, 1, 1)` — 用於元素離開視圖消失。

### 2.2 持續時間 (Durations)
*   **Instant**: 100ms (微小狀態切換)
*   **Prompt**: 200ms (小組件展開/收合)
*   **Smooth**: 300ms (訊息氣泡、頁面轉場)
*   **Deliberate**: 500ms (複雜動態繪製)

## 3. 關鍵場景互動規範

### 3.1 對話訊息流 (Chat Stream)
*   **進入動畫**: `translateY(8px) → 0`, `Opacity: 0 → 1`。
*   **參數**: 200ms decelerate, 訊息間 Stagger 50ms。

### 3.2 學生頭像過渡 (Avatar Transition)
*   **切換模式**: Cross-fade + Scale (`0.95 → 1.0`)。
*   **時長**: 300ms standard。

### 3.3 暫停覆蓋 (Pause Overlay)
*   **效果**: `backdrop-blur(8px)` + `rgba(0,0,0,0.3)`。
*   **時長**: 300ms standard。

## 4. 性能與無障礙
*   **性能**: 僅動畫化 `transform` 與 `opacity`。
*   **a11y**: 偵測 `prefers-reduced-motion`，若啟用則將時長縮減至 0ms 或使用簡單淡入淡出。
