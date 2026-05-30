# 冒险岛 MapleStory HTML Game

一个基于 HTML5 Canvas 的冒险岛风格 2D 横版动作游戏。

## 游戏截图

![Game Screenshot](screenshot.png)

## 游戏特色

- 🎮 2D 横版卷轴地图
- 🏃 角色移动、跳跃、攻击
- 👾 多种怪物（蓝色蜗牛、绿蘑菇、缎带肥肥）
- ⚔️ 战斗系统与伤害数字
- 📊 角色属性（HP、MP、EXP、等级）
- 🎯 Combo 连击系统
- 🗺️ 小地图
- ✨ 粒子特效与升级动画

## 操作方式

| 按键 | 功能 |
|------|------|
| `← →` / `A D` | 左右移动 |
| `↑` / `W` / `空格` | 跳跃 |
| `Z` / `J` | 攻击 |
| `Enter` | 复活（死亡时） |

## 在线游玩

🌐 **https://jiajerry501-tech.github.io/maplestory-html-game/**

直接点击链接即可在浏览器中游玩，无需下载任何文件。

## 本地运行

直接用浏览器打开 `index.html` 即可运行，无需任何构建工具或服务器。

```bash
git clone https://github.com/jiajerry501-tech/maplestory-html-game.git
cd maplestory-html-game
# 用浏览器打开 index.html
```

## 项目结构

```
├── index.html          # 入口页面
├── css/
│   └── style.css       # 样式
├── js/
│   ├── config.js       # 游戏配置
│   ├── engine.js       # 输入、摄像机、碰撞、粒子系统
│   ├── player.js       # 玩家角色
│   ├── monster.js      # 怪物
│   ├── map.js          # 地图与背景
│   ├── ui.js           # 界面与特效
│   └── main.js         # 游戏主循环
├── .gitignore
├── LICENSE             # MIT 许可证
└── README.md
```

## 技术栈

- HTML5 Canvas
- 原生 JavaScript（ES6+）
- 无第三方依赖

## 开源协议

本项目基于 MIT 许可证开源。
