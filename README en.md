# LoopRainOS

LoopRainOS is a Vue-based WebOS that brings a lightweight desktop experience to the browser. It is designed for personal homepages, project showcases, resumes, and Markdown blogs.

## Features

- Deepin-inspired desktop interface with wallpapers, sidebar, taskbar, and window management
- Windowed file manager, browser, terminal, music player, settings, and text viewer
- Nested virtual directories generated from the `blog` folder
- Markdown article rendering with direct article routes
- Local browser storage for supported user settings and content changes

## Requirements

- Node.js and npm
- Python 3, required when regenerating the virtual file map

## Local development

```bash
npm install
npm run serve
```

Open `http://localhost:8080` after the development server starts.

## Blog content and production build

Put Markdown articles and directories in `blog/`. The generator copies Markdown content and creates the virtual file map in `public/`:

```bash
python3 generate.py
npm run build
```

The production files are written to `docs/` according to the Vue CLI configuration and can be served by a static web server.

Articles can be opened directly with:

```text
https://<host>/#/desktop/post/<file-name>.md
```

The first matching filename in the virtual directory tree is used. The first `# ` heading becomes the article title, and the first suitable following line becomes its abstract.

## Music configuration

Edit `public/musics.json` using the existing format to configure the built-in `vue-aplayer` music player. Album covers can be placed in `public/musiccovers/`. Configure only music sources that you are allowed to distribute.

## Technology

Vue 2, Vue Router, Vuex, Vuetify, Tailwind CSS, Axios, Markdown-it Vue, Vue APlayer, and Vue CLI.

## Project structure

```text
blog/       Markdown content exposed by the virtual file system
public/     Static assets, generated file data, music, and covers
src/        Vue application, components, router, store, and plugins
docs/       Generated production output
generate.py Markdown-to-static-data generator
```

## Contributing

Bug fixes and improvements are welcome. Please describe the motivation, modified areas, and expected result in a pull request. See [the development guidelines](misc/Guidelines%20for%20further%20development.md) for the application architecture.

## License

This project is released under the AGPLv3 license.

LoopRainOS is an independent project and has no official affiliation with Deepin.
