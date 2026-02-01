📖 AI-Classroom 團隊 Git 協作與版控操作指南

本指南用於規範團隊協作流程，確保：程式碼品質可控、責任分工明確、開發流程一致

主分支（main）維持可部署狀態

本專案採用策略：

Feature Branch Workflow（簡化 Git Flow）

🛠 一、開發前置作業（Environment Setup）
1️⃣ 複製專案
git clone [專案網址]
cd [專案資料夾]

2️⃣ 設定 Git 身分（僅第一次需要）
git config --global user.name "您的 GitHub 帳號"
git config --global user.email "您的註冊信箱"


驗證設定：

git config --list

🚀 二、小組成員：日常開發流程（SOP）

⚠ 原則：禁止直接對 main 分支 commit 或 push

Step 1：同步最新主線

每次開始開發前，務必同步最新版本：

git checkout main
git pull origin main


目的：避免基於舊版本開發，減少合併衝突。

Step 2：建立功能分支
分支命名規範

feature/功能名稱

fix/問題名稱

refactor/調整項目

範例：

git checkout -b feature/login-api

Step 3：開發與階段性 Commit

建議採用 Conventional Commits 格式：

git add .
git commit -m "feat: 新增登入 API 驗證機制"

常見 Commit 類型
類型	說明
feat	新功能
fix	修正錯誤
refactor	重構（不影響功能）
docs	文件更新
chore	雜項維護

原則：小步提交，避免一次巨大 commit

Step 4：推送至 GitHub
git push -u origin feature/login-api


若未 push，GitHub 無法建立 Pull Request。

Step 5：建立 Pull Request（PR）

進入 GitHub 專案頁面：

點擊 Compare & pull request

指派 Reviewer（小組長）

填寫 PR 描述

PR 描述建議格式
## 修改內容
- 新增登入 API
- 加入 JWT 驗證

## 測試方式
- Postman 測試成功
- 前端登入流程正常

## 影響範圍
- 僅影響 login 模組

🔍 三、小組長：審核與合併流程（Code Review SOP）

小組長為品質把關者。

1️⃣ 進入 PR 頁面

檢查：

是否基於最新 main

Commit 訊息是否清楚

是否附測試說明

2️⃣ 逐行 Review

點擊 Files changed

有問題 → 留言 + Request changes

無問題 → 點擊 Approve

3️⃣ 執行 Merge

合併前確認：

至少一個 Approve

無衝突

功能測試正常

建議使用：

Squash and merge

合併後請：

點擊 Delete branch

保持專案整潔

📊 四、Git 常用指令對照表
功能	指令	使用時機
同步主線	git pull origin main	每日開工第一件事
建立分支	git checkout -b feature/xxx	開新功能
查看狀態	git status	不確定改了什麼
提交存檔	git commit -m "訊息"	階段完成
上傳遠端	git push	建 PR 前
切換分支	git checkout 分支名	切換任務
⚠ 五、衝突（Conflict）處理流程

當執行：

git pull origin main


若出現衝突，會看到：

<<<<<<< HEAD
您的版本
=======
對方版本
>>>>>>> main

解決步驟
1️⃣ 手動修改檔案

保留正確版本內容，刪除標記。

2️⃣ 標記解決完成
git add .
git commit -m "fix: 解決 merge conflict"
git push

🧭 六、團隊責任分工
角色	責任
組員	建立分支、開發、Push、發 PR
組長	Review、Approve、Merge

⚠ 即使免費版無法強制保護分支，也必須遵守流程紀律。
