# 山西财专“云上”游校园 - 虚拟漫游系统

这是一个基于 **React 19**、**TypeScript** 和 **Marzipano** 引擎开发的 360° 全景虚拟校园漫游系统。该项目对原始的静态 HTML 版本进行了深度重构，采用了现代化的前端技术栈和 **Glassmorphism（玻璃拟态）** 设计风格。

## 🌟 项目特性

- **360° 全景体验**：基于 Marzipano 引擎，支持平滑的视角旋转、缩放和场景切换。
- **现代化 UI 设计**：采用 Tailwind CSS 4.0 打造的玻璃拟态界面，包含响应式侧边栏、欢迎弹窗和控制面板。
- **智能热点交互**：
  - **前进热点**：根据场景数据自动旋转图标方向，指向真实的地理位置。
  - **信息热点**：点击可查看校园地点的详细介绍。
- **多功能控制栏**：
  - **自动旋转**：一键开启/关闭全景图自动巡航。
  - **背景音乐**：内置校园主题背景音乐，支持静音控制。
  - **全屏模式**：支持沉浸式全屏浏览体验。
- **响应式适配**：完美兼容 PC 端和移动端浏览器。

## 🛠️ 技术栈

- **框架**: [React 19](https://react.dev/)
- **构建工具**: [Vite 7](https://vitejs.dev/)
- **样式**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **全景引擎**: [Marzipano](https://www.marzipano.net/)
- **路由**: [React Router 7](https://reactrouter.com/)
- **语言**: [TypeScript](https://www.typescriptlang.org/)

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) (建议 v18 或更高版本)
- npm 或 yarn

### 安装与运行

1. **克隆仓库**
   ```bash
   git clone https://github.com/<您的用户名>/sxcz-virtual-tour.git
   cd sxcz-virtual-tour
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **构建生产版本**
   ```bash
   npm run build
   ```

## 📂 目录结构

```text
├── public/             # 静态资源
│   ├── tiles/          # 全景图切片数据
│   ├── img/            # UI 图标及素材
│   ├── vendor/         # Marzipano 等第三方库
│   └── sxcz.mp3        # 背景音乐
├── src/                # 源代码
│   ├── components/     # React 组件 (Viewer, UI 等)
│   ├── data.ts         # 场景配置文件 (核心数据)
│   ├── App.tsx         # 主应用入口
│   └── main.tsx        # 渲染入口
├── index.html          # HTML 模板
└── vite.config.ts      # Vite 配置文件
```

## 📖 操作指南

1. **旋转视角**：在屏幕上点击并拖动鼠标（或触摸屏滑动）。
2. **场景切换**：点击地面上闪烁的蓝色“前进”图标，或通过左侧菜单选择目标场景。
3. **查看信息**：点击场景中的“i”图标查看地点详情。
4. **控制面板**：使用右下角按钮控制自动旋转、音乐和全屏。

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 协议。
