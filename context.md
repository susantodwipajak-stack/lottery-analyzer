# 📋 项目上下文 — 体育彩票计算器

> 本文件用于在对话丢失后快速恢复 AI 工作上下文

## 项目概况
- **类型**: Web App (纯前端 HTML/CSS/JS)
- **名称**: 体彩深度分析 V2.0
- **版本**: 2.2.0 (package.json)
- **技术栈**: HTML/CSS/JS, Chart.js, AOS.js, Animate.css, Node.js (数据脚本)
- **Git**: 已初始化，有 GitHub Actions CI
- **功能**: 竞彩足球赔率分析 + 大乐透号码统计 + 走势图 + 中奖查询

## 关键文件
- `index.html` — 主页面（4 个 Tab: 竞彩足球/大乐透/走势图/中奖查询）
- `index.css` — 样式（深色主题，69KB）
- `app.js` — 前端主逻辑（137KB）
- `js/football.js` — 竞彩足球模块
- `js/dlt.js` — 大乐透模块
- `js/charts.js` — 图表模块
- `js/main.js` — 入口/初始化
- `js/utils.js` — 工具函数
- `scripts/fetch-data.js` — 数据抓取（大乐透）
- `scripts/analyze.js` — 分析脚本
- `scripts/fetch-matches.js` — 竞彩足球赛事抓取
- `scripts/generate-fb-picks.js` — AI 推荐生成
- `scripts/compare-fb-results.js` — 对比开奖结果
- `server.ps1` / `serve.ps1` — 本地 HTTP 服务器
- `DEPLOY.md` — GitHub Pages 部署指南
- `test-verify.js` / `test-deep-verify.js` — 功能验证测试脚本
- `.github/workflows/daily.yml` — 每日定时数据抓取

## 核心功能
1. **竞彩足球**: 赛事数据拉取 → 赔率分析 → 凯利指数 → EV 分析 → AI 推荐方案
2. **大乐透**: 号码频率/遗漏/冷热分析 → 智能缩水(5算法) → 预测存档系统 → 策略表现追踪
3. **走势图**: 号码走势/大小比/连号/三区比/AC值
4. **中奖查询**: 大乐透 + 竞彩足球奖金计算
5. **一键复制**: 推荐号码一键复制到剪贴板（含视觉反馈）

## 算法亮点
- 5算法集成缩水: 马尔可夫+泊松+贝叶斯+蒙特卡洛+共现亲和
- 凯利指数分析
- 预测存档 → 对比开奖 → 策略自进化

## npm 命令
```bash
npm run fetch          # 抓取大乐透数据
npm run analyze        # 运行分析
npm run fetch-matches  # 抓取竞彩足球赛事
npm run fb-picks       # 生成足球推荐
npm run compare        # 对比开奖结果
npm run update-all     # 全部更新
```

## 本地运行
```powershell
.\server.ps1   # 启动 HTTP 服务器 → http://localhost:8080
```

## 部署
- GitHub Pages + GitHub Actions (每日北京 21:30 自动运行)
- 详见 `DEPLOY.md`
