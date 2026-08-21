# LoopRainOS

LoopRainOS 是一个基于 Vue 的 WebOS 项目，将轻量的桌面系统体验带到浏览器中，适合制作个人主页、项目展示、简历和 Markdown 博客。

## 主要功能

- 仿 Deepin 风格的桌面、壁纸、侧边栏和任务栏
- 支持移动、缩放、最大化、最小化和关闭窗口
- 文件管理器、浏览器、终端、音乐播放器、设置和文本查看器
- 根据 `blog/` 目录生成虚拟文件系统
- 支持 Markdown 文章渲染和文章直达链接
- 支持将部分设置和内容修改保存到浏览器本地存储

## 环境要求

- Node.js 与 npm
- Python 3，用于重新生成虚拟文件目录

## 本地运行

```bash
npm install
npm run serve
```

启动后访问 `http://localhost:8080`。

## 修改博客与构建

将 Markdown 文章和目录放入 `blog/`，然后运行生成脚本：

```bash
python3 generate.py
npm run build
```

生成的静态网站位于 `docs/`，可使用任意静态 Web 服务器部署。

文章可以通过以下格式直接访问：

```text
https://<域名>/#/desktop/post/<文件名>.md
```

程序会在虚拟文件树中递归查找第一个匹配的文件名。文章的第一个 `# ` 标题会作为文章标题，标题后的第一行合适文本会作为摘要。

## 音乐配置

编辑 `public/musics.json`，按照现有格式配置 `vue-aplayer` 音乐播放器。音乐封面可以放在 `public/musiccovers/` 中。请只配置拥有合法分发权限的音乐资源。

## 技术栈

Vue 2、Vue Router、Vuex、Vuetify、Tailwind CSS、Axios、Markdown-it Vue、Vue APlayer 和 Vue CLI。

## 目录结构

```text
blog/       映射到虚拟文件系统的 Markdown 内容
public/     静态资源、生成数据、音乐和封面
src/        Vue 应用、组件、路由、状态管理和插件
docs/       构建后的静态文件
generate.py Markdown 数据生成脚本
```

## 贡献

欢迎提交问题修复和功能改进。提交 PR 时请说明修改原因、涉及范围和预期效果，并参考[二次开发说明](misc/Guidelines%20for%20further%20development.md)。

## 开源协议

本项目基于 AGPLv3 协议开源，与 Deepin 官方没有任何关系。
