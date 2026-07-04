# Flow Todo 🌳

一个支持多级自由嵌套子目录的待办事项工具。就像思维导图一样，你可以一层一层地创建子目录来组织你的待办事项。

## ✨ 功能

- **无限嵌套分组** — 像文件系统或思维导图一样自由创建子目录
- **拖拽排序** — 长按拖动即可重新排列或移动条目
- **进度环** — 每个分组自动统计任务完成进度
- **暗色/亮色支持** — 自动跟随系统
- **数据持久化** — 自动保存到本地
- **导出/导入** — JSON 格式，方便备份和迁移
- **原生 Mac 应用** — 基于 Electron，支持 Apple Silicon 和 Intel

## 🖥 使用示例

```
爱好
├── 骑行
│   └── 改装
│       └── ☐ 给自行车换个轮子
│           └── ✅ 买一对700C公路车轮组
├── 两轮
│   ├── 自行车
│   └── 摩托车
└── 摄影
    └── ☐ 学习Lightroom调色
```

想怎么分就怎么分，随时可以编辑、移动、重命名。

## 🚀 快速开始

### Web 版本

```bash
cd work/todo-tree
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`

### Mac 桌面版

从 [GitHub Releases](https://github.com/lichenming/flow-todo/releases) 下载最新的 `.dmg` 安装包。

或从源码构建：

```bash
cd work/todo-tree
npm install
npm run build
npm run electron:start
```

## 📦 技术栈

- **前端**: React 19 + TypeScript + Tailwind CSS
- **图标**: Lucide React
- **状态管理**: Context + useReducer
- **桌面端**: Electron 33
- **构建**: Vite + electron-builder

## 🏗 项目结构

```
ban-2/
├── work/
│   └── todo-tree/           # Web + Electron 应用源码
│       ├── electron/         # Electron 主进程
│       ├── src/              # React 源码
│       │   ├── components/   # UI 组件
│       │   ├── store.tsx     # 数据层
│       │   └── types.ts      # 类型定义
│       └── package.json
└── outputs/
    └── todo-mac/             # Mac 构建产物
```

## 📄 License

MIT
