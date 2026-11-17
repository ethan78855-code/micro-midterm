# 個體經濟學期中考 衝刺講義

考前複習網站，範圍是作業 HW6–HW9，對應課堂簡報 Ch7（顯示性偏好）、Ch8（Slutsky 方程式）、Ch9（買與賣）、Ch10（跨期選擇），另有 Ch2–Ch5 的暖身頁與去年的考古題。

- 每一章先用白話講觀念，再用可以操作的圖表示範（滑桿、步驟按鈕、顯示性偏好檢查器）
- 12 題作業題與去年的期中考都有一步一步的解答；題目是英文（可點開中文翻譯），解答是中文
- 進度（讀完的頁面、會做的題目）存在瀏覽器裡
- 右上角倒數計時對準考試時間，改 `src/assets/app.js` 開頭的 `EXAM` 即可

## 怎麼改內容

原始檔在 `src/`（頁面、`assets/style.css`、`assets/app.js`）。根目錄的 `*.html` 是 `build.py` 產生的發布版本：樣式和程式直接內嵌在每一頁裡，這樣即使手機沒載到外部樣式檔，頁面也不會變成沒有排版。

```bash
python build.py
```

改完 `src/` 之後跑一次，再把根目錄產生的頁面一起 commit。本機預覽：

```bash
python -m http.server 8766
```

然後打開 http://localhost:8766 。

數學式用 KaTeX，字型用 Google Fonts（LXGW WenKai TC、Noto Sans TC、JetBrains Mono），這兩樣仍從 CDN 載入。
解答是自己算的，不是老師公布的版本；若有出入，以老師上課講的為準。
