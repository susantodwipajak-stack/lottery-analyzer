# 🚀 部署指南

## 一键部署到 GitHub Pages

### 步骤 1: 创建 GitHub 仓库

```bash
cd e:/AIProjects/体育彩票计算器
git init
git add .
git commit -m "🎉 初始提交：体彩深度分析 V2.1"
```

在 [github.com/new](https://github.com/new) 创建新仓库（如 `lottery-analyzer`），然后：

```bash
git remote add origin https://github.com/你的用户名/lottery-analyzer.git
git branch -M main
git push -u origin main
```

### 步骤 2: 启用 GitHub Pages

1. 进入仓库 → **Settings** → **Pages**
2. Source 选择 **GitHub Actions**
3. 或者选择 **Deploy from a branch** → 选 `main` 分支 → `/ (root)` → Save

### 步骤 3: 启用 Actions

1. 进入仓库 → **Actions** 标签页
2. 如果看到提示，点击 **I understand my workflows, go ahead and enable them**
3. 左侧应该能看到 **📊 每日自动分析** 工作流

### 步骤 4: 手动触发第一次运行

1. 进入 **Actions** → **📊 每日自动分析**
2. 点击 **Run workflow** → **Run workflow**
3. 等待约 30 秒完成
4. 查看仓库，`data/` 文件夹应该多出 `history.json` 和 `analysis.json`

### 步骤 5: 访问你的在线系统

```
https://你的用户名.github.io/lottery-analyzer/
```

---

## ⏰ 自动运行说明

| 事件 | 频率 | 说明 |
|------|------|------|
| 定时触发 | 每天北京 21:30 | 大乐透开奖后自动抓取+分析 |
| 手动触发 | 随时 | Actions 页面点击 Run workflow |

### 自定义定时频率

修改 `.github/workflows/daily.yml` 中的 cron 表达式：

```yaml
# 每天两次（14:00 和 22:00 北京时间）
- cron: '0 6,14 * * *'

# 只在开奖日运行（周一三六）
- cron: '30 13 * * 1,3,6'
```

---

## 📋 文件结构

```
体育彩票计算器/
├── .github/workflows/daily.yml  ← 每日定时任务
├── scripts/
│   ├── fetch-data.js           ← 数据抓取脚本
│   └── analyze.js              ← 分析+预测脚本
├── data/                        ← 自动生成
│   ├── history.json            ← 历史开奖数据
│   └── analysis.json           ← 分析结果+预测
├── index.html                   ← 前端页面
├── index.css                    ← 样式
├── app.js                       ← 前端逻辑
└── package.json                 ← Node.js 配置
```

## ❓ 常见问题

**Q: Actions 运行失败怎么办？**
> 检查 Actions 日志，通常是 API 暂时不可用，下次定时会自动重试。

**Q: 数据会一直累积吗？**
> 是的，每次运行会合并新数据，不会覆盖旧数据。

**Q: 需要任何费用吗？**
> 完全免费。GitHub Actions 每月有 2000 分钟免费额度，本工作流每次约 30 秒。
