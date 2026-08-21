<template>
  <div class="blog-shell">
    <header class="blog-header">
      <div class="blog-header-inner">
        <router-link to="/blog" class="blog-brand">
          <span class="brand-mark">L</span>
          <span>
            <strong>LoopRain</strong>
            <small>notes from the loop</small>
          </span>
        </router-link>
        <nav class="blog-nav">
          <router-link to="/blog" exact>首页</router-link>
          <a href="#archive">归档</a>
          <a href="#about">关于</a>
          <router-link to="/desktop">进入桌面</router-link>
        </nav>
      </div>
    </header>

    <main class="blog-main">
      <section v-if="!isArticle" class="blog-intro">
        <div>
          <p class="eyebrow">PERSONAL KNOWLEDGE GARDEN</p>
          <h1>把想法写下来，<br><em>让时间留下回声。</em></h1>
          <p class="intro-copy">记录技术、生活与那些值得慢慢想清楚的事。这里是 LoopRainOS 的公开笔记本。</p>
          <div class="intro-actions">
            <a href="#posts" class="primary-button">开始阅读 <span>↓</span></a>
            <span class="article-count">{{ articles.length }} 篇文章 · 持续更新</span>
          </div>
        </div>
        <div class="intro-note">
          <span class="note-pin"></span>
          <p>“好的博客不只是在<br>发布内容，也在整理<br>一个人的思考轨迹。”</p>
          <small>— LoopRain / 2024</small>
        </div>
      </section>

      <section v-if="!isArticle" id="posts" class="posts-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">LATEST WRITINGS</p>
            <h2>最近文章</h2>
          </div>
          <label class="search-box">
            <span>⌕</span>
            <input v-model="searchText" type="search" placeholder="搜索文章...">
          </label>
        </div>
        <div class="category-tabs">
          <button v-for="category in categories" :key="category" :class="{active: selectedCategory === category}" @click="selectedCategory = category">
            {{ category }}
          </button>
        </div>
        <div v-if="filteredArticles.length" class="post-grid">
          <article v-for="(article, index) in filteredArticles" :key="article.path" class="post-card" :class="{'post-card-featured': index === 0 && !searchText && selectedCategory === '全部'}">
            <div class="post-card-top"><span>{{ article.category }}</span><time>{{ formatDate(article.lastedittime) }}</time></div>
            <h3>{{ article.title || article.name }}</h3>
            <p>{{ article.abstract || '一篇正在等待被阅读的文章。' }}</p>
            <router-link :to="{name: 'BlogPost', params: {postfilename: article.name}}" class="read-link">阅读全文 <span>↗</span></router-link>
          </article>
        </div>
        <div v-else class="empty-state">没有找到匹配的文章。</div>
      </section>

      <section v-if="!isArticle" id="archive" class="archive-section">
        <div>
          <p class="eyebrow">ARCHIVE</p>
          <h2>按时间整理</h2>
        </div>
        <div class="archive-years">
          <button v-for="year in years" :key="year" @click="selectedCategory = '全部'; searchText = String(year)">{{ year }} <span>{{ yearCount(year) }}</span></button>
        </div>
      </section>

      <section v-if="!isArticle" id="about" class="about-section">
        <div class="about-avatar">LR</div>
        <div><p class="eyebrow">A LITTLE ABOUT THIS PLACE</p><h2>你好，我是 LoopRain。</h2><p>这是一个运行在浏览器里的个人博客与 WebOS 实验场。文章用 Markdown 写成，内容和代码一起生长。</p></div>
      </section>

      <article v-else class="article-page">
        <router-link to="/blog" class="back-link">← 返回文章列表</router-link>
        <div v-if="article" class="article-wrap">
          <div class="article-meta"><span>{{ article.category }}</span><time>{{ formatDate(article.lastedittime) }}</time></div>
          <h1>{{ article.title || article.name }}</h1>
          <p class="article-lead">{{ article.abstract }}</p>
          <div v-if="articleContent" class="markdown-body"><markdown-it-vue :content="articleContent" :options="{markdownIt: {html: true}}" /></div>
          <div v-else class="article-loading">正在打开这篇文章...</div>
        </div>
        <div v-else class="empty-state article-missing">文章不存在，或它还没有被生成。</div>
      </article>
    </main>

    <footer class="blog-footer"><span>© {{ new Date().getFullYear() }} LoopRainOS</span><span>Built with curiosity & Markdown</span></footer>
  </div>
</template>

<script>
import MarkdownItVue from 'markdown-it-vue'
import 'markdown-it-vue/dist/markdown-it-vue.css'

export default {
  name: 'Blog',
  components: { MarkdownItVue },
  data () {
    return { articles: [], searchText: '', selectedCategory: '全部', articleContent: '' }
  },
  computed: {
    isArticle () { return Boolean(this.$route.params.postfilename) },
    categories () { return ['全部'].concat(Array.from(new Set(this.articles.map(article => article.category)))) },
    filteredArticles () {
      const query = this.searchText.trim().toLowerCase()
      return this.articles.filter(article => {
        const matchesCategory = this.selectedCategory === '全部' || article.category === this.selectedCategory
        const haystack = (article.title + article.abstract + article.name).toLowerCase()
        return matchesCategory && (!query || haystack.indexOf(query) !== -1 || String(this.formatDate(article.lastedittime)).indexOf(query) !== -1)
      })
    },
    years () { return Array.from(new Set(this.articles.map(article => new Date(article.lastedittime * 1000).getFullYear()))).sort((a, b) => b - a) }
  },
  created () { this.loadArticles() },
  watch: {
    '$route.params.postfilename' () { this.loadArticleContent() }
  },
  methods: {
    flatten (items, category) {
      return items.reduce((result, item) => {
        if (item.children) return result.concat(this.flatten(item.children, item.name))
        result.push(Object.assign({}, item, { category: category || '未分类' }))
        return result
      }, [])
    },
    loadArticles () {
      this.$axios.raw('map.json').then(response => {
        this.articles = this.flatten(response.data).sort((a, b) => b.lastedittime - a.lastedittime)
        this.loadArticleContent()
      }).catch(() => { this.articles = [] })
    },
    loadArticleContent () {
      this.articleContent = ''
      const article = this.articles.find(item => item.name === this.$route.params.postfilename)
      if (!article) return
      this.$axios.raw(article.path).then(response => { this.articleContent = response.data.data || '' }).catch(() => {})
    },
    formatDate (timestamp) {
      if (!timestamp) return '未标注日期'
      const date = new Date(timestamp * 1000)
      return date.getFullYear() + '.' + String(date.getMonth() + 1).padStart(2, '0') + '.' + String(date.getDate()).padStart(2, '0')
    },
    yearCount (year) { return this.articles.filter(article => new Date(article.lastedittime * 1000).getFullYear() === year).length }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap');
:root { --ink: #17211c; --muted: #6f7c72; --line: #dce4dc; --mint: #d9f0dc; --accent: #ef6b45; --paper: #f7f8f3; }
.blog-shell { min-height: 100vh; color: var(--ink); background: var(--paper); font-family: Manrope, sans-serif; }
.blog-header { border-bottom: 1px solid var(--line); background: rgba(247,248,243,.92); position: sticky; top: 0; z-index: 5; backdrop-filter: blur(12px); }
.blog-header-inner, .blog-main, .blog-footer { width: min(1120px, calc(100% - 48px)); margin: auto; }
.blog-header-inner { min-height: 76px; display: flex; justify-content: space-between; align-items: center; }
.blog-brand { display: flex; gap: 11px; align-items: center; color: var(--ink); text-decoration: none; }.blog-brand strong { display: block; font-size: 17px; letter-spacing: -.5px; }.blog-brand small { display: block; color: var(--muted); font: 10px 'DM Mono', monospace; letter-spacing: .04em; margin-top: 2px; }.brand-mark { background: var(--ink); color: #f5cf65; width: 34px; height: 34px; display: grid; place-items: center; font-weight: 800; font-size: 20px; border-radius: 50%; }
.blog-nav { display: flex; gap: 28px; align-items: center; }.blog-nav a { color: var(--muted); font-size: 13px; text-decoration: none; }.blog-nav a:hover, .blog-nav .router-link-active { color: var(--ink); }
.blog-main { padding: 88px 0 40px; }.blog-intro { display: grid; grid-template-columns: 1.4fr .6fr; gap: 80px; align-items: end; min-height: 380px; }.eyebrow { color: var(--accent); font: 11px 'DM Mono', monospace; letter-spacing: .11em; margin: 0 0 15px; }.blog-intro h1 { font-size: clamp(42px, 6vw, 72px); line-height: 1.06; letter-spacing: -3px; margin: 0; font-weight: 700; }.blog-intro h1 em { color: #537c65; font-style: normal; }.intro-copy { max-width: 470px; color: var(--muted); line-height: 1.8; margin: 25px 0; font-size: 15px; }.intro-actions { display: flex; gap: 22px; align-items: center; }.primary-button { background: var(--ink); color: white; padding: 14px 20px; text-decoration: none; font-size: 13px; border-radius: 3px; }.primary-button span { color: #f5cf65; margin-left: 12px; }.article-count { color: var(--muted); font: 11px 'DM Mono', monospace; }.intro-note { background: var(--mint); padding: 33px 30px 28px; transform: rotate(3deg); position: relative; box-shadow: 8px 9px 0 #b7d2bc; }.intro-note p { font-size: 21px; line-height: 1.45; margin: 0 0 20px; letter-spacing: -1px; }.intro-note small { font: 10px 'DM Mono', monospace; color: #5e7a65; }.note-pin { position: absolute; width: 10px; height: 10px; background: var(--accent); border-radius: 50%; top: 14px; left: 50%; }
.posts-section { padding-top: 130px; }.section-heading { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid var(--line); padding-bottom: 20px; }.section-heading h2, .archive-section h2, .about-section h2 { font-size: 30px; letter-spacing: -1.4px; margin: 0; }.search-box { border-bottom: 1px solid #aebbb1; padding: 6px 0; display: flex; gap: 8px; color: var(--muted); }.search-box input { border: 0; outline: 0; background: transparent; width: 150px; font: 12px Manrope, sans-serif; }.category-tabs { display: flex; gap: 8px; margin: 22px 0; }.category-tabs button, .archive-years button { border: 0; background: transparent; cursor: pointer; color: var(--muted); padding: 7px 12px; font: 12px Manrope, sans-serif; }.category-tabs button.active, .category-tabs button:hover { background: var(--ink); color: white; border-radius: 2px; }.post-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }.post-card { min-height: 270px; background: white; border: 1px solid var(--line); padding: 26px; display: flex; flex-direction: column; transition: transform .2s, box-shadow .2s; }.post-card:hover { transform: translateY(-5px); box-shadow: 7px 7px 0 var(--mint); }.post-card-featured { grid-column: span 2; background: #e9f2e5; }.post-card-top, .article-meta { display: flex; justify-content: space-between; color: var(--accent); font: 10px 'DM Mono', monospace; letter-spacing: .04em; }.post-card-top time, .article-meta time { color: var(--muted); }.post-card h3 { font-size: 22px; line-height: 1.3; letter-spacing: -.8px; margin: 35px 0 12px; }.post-card p { color: var(--muted); font-size: 13px; line-height: 1.75; margin: 0; }.read-link { color: var(--ink); margin-top: auto; padding-top: 28px; font-size: 12px; text-decoration: none; font-weight: 700; }.read-link span { color: var(--accent); margin-left: 6px; }.empty-state { padding: 55px 0; color: var(--muted); font-size: 14px; }
.archive-section { border-top: 1px solid var(--line); margin-top: 120px; padding: 40px 0; display: flex; justify-content: space-between; }.archive-years { display: flex; gap: 25px; }.archive-years button { font: 18px 'DM Mono', monospace; color: var(--ink); }.archive-years span { color: var(--accent); font-size: 11px; margin-left: 5px; }.about-section { border-top: 1px solid var(--line); padding: 50px 0 75px; display: flex; gap: 28px; align-items: center; max-width: 700px; }.about-avatar { width: 72px; height: 72px; flex: none; border-radius: 50%; display: grid; place-items: center; background: #f5cf65; font-weight: 800; font-size: 22px; }.about-section h2 { font-size: 24px; margin-bottom: 9px; }.about-section p:not(.eyebrow) { color: var(--muted); line-height: 1.7; font-size: 13px; margin: 0; }
.article-page { max-width: 760px; margin: 0 auto; padding: 10px 0 100px; }.back-link { color: var(--muted); text-decoration: none; font: 12px 'DM Mono', monospace; }.article-wrap { margin-top: 80px; }.article-meta { margin-bottom: 20px; }.article-wrap h1 { font-size: clamp(38px, 6vw, 62px); line-height: 1.1; letter-spacing: -2.5px; margin: 0; }.article-lead { color: var(--muted); font-size: 17px; line-height: 1.7; margin: 25px 0 55px; }.markdown-body { border-top: 1px solid var(--line); padding-top: 40px; font-size: 15px; line-height: 1.9; }.markdown-body >>> h2, .markdown-body >>> h3 { letter-spacing: -1px; margin-top: 2em; }.markdown-body >>> a { color: var(--accent); }.markdown-body >>> code { background: #e9eee8; padding: 3px 5px; }.markdown-body >>> pre { background: var(--ink); color: #e8f0e7; padding: 20px; overflow: auto; }.article-loading { color: var(--muted); }.blog-footer { border-top: 1px solid var(--line); padding: 22px 0 30px; display: flex; justify-content: space-between; color: var(--muted); font: 10px 'DM Mono', monospace; }
@media (max-width: 720px) { .blog-header-inner, .blog-main, .blog-footer { width: min(100% - 32px, 560px); }.blog-nav { gap: 12px; }.blog-nav a:nth-child(2), .blog-nav a:nth-child(3) { display: none; }.blog-main { padding-top: 55px; }.blog-intro { display: block; min-height: 0; }.blog-intro h1 { letter-spacing: -2px; }.intro-note { margin: 55px 12px 10px; max-width: 300px; }.posts-section { padding-top: 95px; }.section-heading { display: block; }.search-box { margin-top: 24px; width: 100%; }.post-grid { display: block; }.post-card, .post-card-featured { min-height: 240px; margin-bottom: 12px; }.archive-section { display: block; margin-top: 85px; }.archive-years { flex-wrap: wrap; margin-top: 25px; gap: 8px; }.about-section { align-items: flex-start; }.blog-footer { display: block; }.blog-footer span { display: block; margin-top: 8px; } }
</style>