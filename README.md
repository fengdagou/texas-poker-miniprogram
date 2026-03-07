# 🃏 德州扑克微信小程序

Texas Hold'em Poker Mini Program for WeChat

## 📖 项目简介

一个原生开发的德州扑克微信小程序，支持人机对战和好友对战。

### ✨ 功能特性

- 🤖 **人机对战** - 单人练习模式，与 AI 对战
- 👥 **好友对战** - 创建房间，邀请好友一起玩
- 💰 **金币系统** - 初始赠送金币，输赢结算
- 🎮 **完整玩法** - 支持所有德州扑克基本操作
- 📱 **原生开发** - 微信小程序原生开发，性能优秀
- 🔧 **易于扩展** - 代码结构清晰，方便后续添加多人在线功能

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/YOUR_USERNAME/texas-poker-miniprogram.git
cd texas-poker-miniprogram
```

### 2. 导入微信开发者工具

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开微信开发者工具
3. 选择"导入项目"
4. 选择项目目录
5. 填入你的 AppID（或使用测试号）

### 3. 配置 AppID

修改 `project.config.json` 中的 `appid` 字段：

```json
{
  "appid": "你的小程序 AppID"
}
```

### 4. 运行项目

点击微信开发者工具的"编译"按钮即可预览

## 📁 项目结构

```
texas-poker-miniprogram/
├── app.js                    # 小程序入口
├── app.json                  # 小程序配置
├── project.config.json       # 项目配置
├── pages/
│   ├── index/               # 首页（大厅）
│   ├── game/                # 游戏页面
│   └── room/                # 房间页面
├── components/              # 可复用组件
├── utils/
│   ├── poker.js            # 扑克牌逻辑
│   └── game.js             # 游戏状态管理
└── images/                 # 图片资源
```

## 🎮 游戏说明

### 牌型大小（从大到小）

1. 🃏 皇家同花顺
2. 🃏 同花顺
3. 🔢 四条
4. 🏠 葫芦
5. 🌸 同花
6. 📈 顺子
7. 🔢 三条
8. 👫 两对
9. 👫 一对
10. 🔝 高牌

### 操作说明

- **弃牌 (Fold)** - 放弃本局
- **过牌 (Check)** - 不加注，把行动权交给下家
- **跟注 (Call)** - 跟上前面的下注
- **加注 (Raise)** - 增加下注额
- **全下 (All-in)** - 押上所有金币

## 🔧 开发说明

### 技术栈

- 微信小程序原生开发
- JavaScript ES6+
- 无第三方依赖

### 核心模块

- `utils/poker.js` - 扑克牌、牌堆、牌型评估
- `utils/game.js` - 游戏状态机、玩家管理
- `pages/game/game.js` - 游戏界面逻辑、AI 决策

### 扩展多人在线

当前版本使用本地游戏状态，后续可通过以下方式扩展多人在线：

1. 接入 WebSocket 服务器
2. 使用微信云开发
3. 自建 Node.js 后端

## 📝 待办事项

- [ ] 好友系统
- [ ] 多人在线对战
- [ ] 排行榜
- [ ] 更多 AI 难度
- [ ] 游戏动画优化
- [ ] 音效和背景音乐

## 📄 License

MIT License

## 👨‍💻 作者

Created with ❤️ by OpenClaw

## 🙏 贡献

欢迎提交 Issue 和 Pull Request！

---

**注意：** 本项目仅供学习交流使用，请勿用于赌博等违法活动。

