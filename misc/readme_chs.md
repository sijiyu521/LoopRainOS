# LoopRainOS 中文说明

LoopRainOS 是一个运行在浏览器中的 Vue WebOS，提供仿 Deepin 的桌面体验，适合用于个人主页、项目展示、简历和 Markdown 博客。

## 快速开始

环境要求：Node.js、npm，以及用于生成虚拟文件目录的 Python 3。

```bash
npm install
npm run serve
```

启动后访问 `http://localhost:8080`。

## 修改博客与构建

将 Markdown 文章和目录放入 `blog/`，然后运行：

```bash
python3 generate.py
npm run build
```

构建结果位于 `docs/`，可以使用任意静态 Web 服务器部署。

文章支持通过以下格式直接访问：

```text
https://<域名>/#/desktop/post/<文件名>.md
```

程序会递归查找第一个匹配的文件名。文章的第一个 `# ` 标题会作为标题，标题后的第一行合适文本会作为摘要。

## 主要功能

- 仿 Deepin 风格的桌面、壁纸、侧边栏和任务栏
- 支持窗口移动、缩放、最大化、最小化和关闭
- 文件管理器、浏览器、终端、音乐播放器、设置和文本查看器
- 根据 `blog/` 目录生成嵌套的虚拟文件系统
- 支持 Markdown 渲染和浏览器本地存储

## 音乐配置

编辑 `public/musics.json` 配置基于 `vue-aplayer` 的音乐播放器，封面可以放在 `public/musiccovers/`。请只配置拥有合法分发权限的音乐资源。

## 技术栈

Vue 2、Vue Router、Vuex、Vuetify、Tailwind CSS、Axios、Markdown-it Vue、Vue APlayer 和 Vue CLI。

## 目录结构

```text
blog/       Markdown 内容
public/     静态资源、生成数据、音乐和封面
src/        Vue 应用、组件、路由、状态管理和插件
docs/       构建后的静态文件
generate.py Markdown 数据生成脚本
```

## 贡献与协议

欢迎提交问题修复和功能改进。提交 PR 时请说明修改原因、涉及范围和预期效果，并参考[二次开发说明](Guidelines%20for%20further%20development.md)。

本项目基于 AGPLv3 协议开源，与 Deepin 官方没有任何关系。
