<template>
  <Window :startpos_x="startpos_x" :startpos_y="startpos_y" :uuid="uuid" :zindex="zindex" :default_width="default_width" :minimized="minimized" @resize_start="show_blocker=true" @resize_end="show_blocker=false">
    
    <template v-slot:header>
      <div class=" tw-ml-4 tw-font-bold tw-tracking-wider tw-flex tw-items-center tw-select-none" style="pointer-events:none;"> 
        <img src="../../assets/images/icons/browser.png" alt="" style="pointer-events:auto;" class=" tw-w-7 tw-h-7">
        <div class=" tw-ml-4 tw-font-bold tw-tracking-wider " style="pointer-events:none;"> {{ initial_title || 'Browser' }} </div>
      </div>
    </template>
    <template v-slot:content>
      <div class=" tw-w-full tw-h-full tw-rounded-b-2xl tw-overflow-hidden tw-flex tw-flex-col" style="background:#dee1e6;">
        <!-- Tab bar -->
        <div class="tw-h-9 tw-flex tw-items-end tw-select-none tw-flex-shrink-0" style="background:#d7dae0;">
          <div class="tw-flex tw-items-end tw-overflow-x-auto tw-h-full" style="max-width:calc(100% - 60px);scrollbar-width:none;">
            <div v-for="(tab, i) in tabs" :key="tab.id"
                 class="tw-h-8 tw-pl-3 tw-pr-2 tw-flex tw-items-center tw-gap-2 tw-rounded-t-lg tw-text-sm tw-max-w-52 tw-flex-shrink-0 tw-cursor-default"
                 :class="i === active_tab ? 'tw-bg-white tw-text-gray-800' : 'tw-text-gray-600 hover:tw-bg-gray-300/60'"
                 @click="switch_tab(i)" @mouseup="tab_mouseup($event, i)"
                 :style="{minWidth:'110px', maxWidth:'190px'}">
              <img v-if="tab.favicon" :src="tab.favicon" class="tw-w-4 tw-h-4 tw-flex-shrink-0" style="border-radius:2px;">
              <v-icon v-else small style="font-size:14px;" class="tw-flex-shrink-0">mdi-earth</v-icon>
              <span class="tw-truncate tw-flex-1" style="font-size:12px;line-height:1;">{{ tab.title || 'New Tab' }}</span>
              <v-icon v-if="tabs.length > 1" class="tw-flex-shrink-0" style="font-size:14px;color:#9aa0a6;"
                      @click.stop="close_tab(i)">mdi-close</v-icon>
            </div>
          </div>
          <div class="tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded-lg hover:tw-bg-gray-300/70 tw-ml-1 tw-mb-0.5 tw-cursor-pointer tw-text-gray-700" title="New Tab" @click="new_tab('about:newtab')">
            <v-icon small>mdi-plus</v-icon>
          </div>
        </div>

        <!-- Navigation bar -->
        <div class="tw-h-11 tw-border-t tw-border-gray-300 tw-flex tw-items-center tw-flex-shrink-0" style="background-color:#fafafa;width:100%">
          <WindowBrowserButton :disabled="!can_go_back" :icon="'chevron-left'" class="tw-ml-2" @button_clicked="go_back"/>
          <WindowBrowserButton :disabled="!can_go_forward" :icon="'chevron-right'" class="tw-ml-1" @button_clicked="go_forward"/>
          <WindowBrowserButton :disabled="false" :icon="loading ? 'close' : 'refresh'" class="tw-ml-1" @button_clicked="loading ? stop_loading() : refresh()"/>
          <WindowBrowserButton :disabled="false" :icon="'home'" class="tw-ml-1" @button_clicked="go_home"/>
          <div class="tw-relative tw-flex-grow tw-mx-2 tw-flex tw-items-center">
            <div class="tw-absolute tw-left-3 tw-flex tw-items-center pointer-events-none" style="color:#9aa0a6;">
              <v-icon small v-if="!is_secure && !is_internal">mdi-alert-circle-outline</v-icon>
              <v-icon small v-else-if="is_internal">mdi-desktop-tower</v-icon>
              <v-icon small v-else>mdi-lock-outline</v-icon>
            </div>
            <input class="tw-w-full tw-h-9 tw-rounded-full tw-pl-9 tw-pr-10 focus:tw-bg-white tw-tracking-tight tw-outline-none tw-text-sm" style="background:#f1f3f4;color:#202124;outline-color:#4285f4;" 
                   v-model="address_value" @keyup.enter="address_submit" @focus="address_focused = true" @blur="sync_address_value" @input="on_address_input"/>
            <button v-if="address_value && address_focused" class="tw-absolute tw-right-3 tw-outline-none tw-cursor-pointer" @mousedown.prevent="address_value = ''; address_focused = true">
              <v-icon small style="color:#9aa0a6;">mdi-close-circle</v-icon>
            </button>
            <div v-if="show_suggestions" class="tw-absolute tw-left-0 tw-right-0 tw-top-10 tw-rounded-xl tw-shadow-lg tw-overflow-hidden tw-z-50" style="background:#fff;border:1px solid #e0e0e0;">
              <div v-for="(s, si) in suggestions" :key="si" class="tw-px-4 tw-py-2 tw-flex tw-items-center tw-gap-2 tw-cursor-pointer hover:tw-bg-gray-100 tw-text-sm" style="color:#202124;" @mousedown.prevent="use_suggestion(s)">
                <v-icon small style="color:#9aa0a6;">{{ s.suggest_type === 'bookmark' ? 'mdi-star' : (s.suggest_type === 'history' ? 'mdi-history' : 'mdi-magnify') }}</v-icon>
                <span class="tw-truncate">{{ s.title }}</span>
                <span class="tw-truncate tw-text-xs" style="color:#80868b;">{{ s.url }}</span>
              </div>
            </div>
          </div>
          <button class="tw-w-9 tw-h-9 tw-flex tw-items-center tw-justify-center tw-outline-none tw-cursor-pointer" title="Bookmark this page" @click="toggle_bookmark">
            <v-icon small :style="{color: is_bookmarked ? '#fbbc04' : '#5f6368'}">{{ is_bookmarked ? 'mdi-star' : 'mdi-star-outline' }}</v-icon>
          </button>
        </div>
        <!-- Progress bar -->
        <div class="tw-h-0.5 tw-flex-shrink-0 tw-relative" style="background:transparent;">
          <div v-if="loading" class="tw-h-full tw-absolute tw-left-0" style="width:100%;background:#1a73e8;animation:tw-flow 1.2s infinite;"></div>
        </div>

        <!-- Content area -->
        <div class="tw-flex-grow tw-relative tw-bg-white tw-overflow-hidden">
          <!-- Start page (new tab) -->
          <div v-if="active_tab_data.show_start" class="tw-w-full tw-h-full tw-flex tw-flex-col tw-items-center tw-overflow-y-auto" style="background:linear-gradient(135deg,#e8eaed 0%,#f8f9fa 100%);">
            <div class="tw-mt-10 tw-flex tw-flex-col tw-items-center">
              <img src="../../assets/images/icons/browser.png" class="tw-w-16 tw-h-16" style="filter:drop-shadow(0 2px 6px rgba(0,0,0,.15));">
              <h2 class="tw-mt-2 tw-text-2xl" style="color:#5f6368;font-weight:400;">New Tab</h2>
              <div class="tw-mt-4 tw-flex tw-items-center tw-bg-white tw-rounded-full tw-shadow-md tw-px-4 tw-w-96 tw-h-10">
                <v-icon small style="color:#9aa0a6;">mdi-magnify</v-icon>
                <input class="tw-flex-grow tw-ml-2 tw-outline-none tw-text-sm" style="color:#202124" v-model="start_search" @keyup.enter="search_from_start" placeholder="Search the web">
              </div>
            </div>
            <div class="tw-w-3/4 tw-mt-6 tw-pb-8">
              <div class="tw-text-xs tw-mb-2 tw-pl-1" style="color:#80868b;">Quick links</div>
              <div class="tw-grid tw-gap-3" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr));">
                <div v-for="bm in bookmarks" :key="bm.id" class="tw-flex tw-flex-col tw-items-center tw-py-4 tw-rounded-xl tw-cursor-pointer hover:tw-bg-white hover:tw-shadow-sm tw-transition-all" @click="open_bookmark(bm)">
                  <div class="tw-w-11 tw-h-11 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-shadow-sm" :style="{background: bm.color || '#1a73e8'}">
                    <span style="color:#fff;font-weight:600;font-size:18px;">{{ (bm.title || '?')[0].toUpperCase() }}</span>
                  </div>
                  <div class="tw-text-xs tw-mt-2 tw-truncate tw-w-full tw-text-center" style="color:#202124;">{{ bm.title }}</div>
                </div>
                <div v-if="bookmarks.length === 0" class="tw-col-span-full tw-text-center tw-text-sm tw-py-8" style="color:#80868b;">
                  No bookmarks yet — visit a page and click the ☆ to save it.
                </div>
              </div>
            </div>
          </div>

          <!-- Content page / iframe: always rendered so that the onload event always fires -->
          <div v-else class="tw-w-full tw-h-full tw-relative">
            <iframe ref="iframe_main" :key="active_tab_data.iframe_key" :src="active_tab_data.src" frameborder="0" class="tw-w-full tw-h-full" @load="on_frame_load"></iframe>

            <!-- Error overlay (covers the failed iframe) -->
            <div v-if="active_tab_data.error" class="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center" style="background:#fff;">
              <v-icon style="font-size:56px;color:#dadce0;">mdi-alert-circle-outline</v-icon>
              <h3 class="tw-mt-3 tw-text-xl" style="color:#202124;">This page can't be displayed</h3>
              <p class="tw-mt-2 tw-text-sm tw-px-8 tw-text-center" style="color:#5f6368;">{{ active_tab_data.error }}</p>
              <div class="tw-mt-5 tw-flex tw-gap-3">
                <button class="tw-px-4 tw-py-2 tw-rounded tw-text-sm tw-font-medium hover:tw-shadow" style="background:#1a73e8;color:#fff;" @click="refresh">Reload</button>
                <button class="tw-px-4 tw-py-2 tw-rounded tw-text-sm tw-font-medium" style="background:#f1f3f4;color:#1a73e8;" @click="go_home">Home</button>
              </div>
            </div>

            <!-- Loading overlay (sits above the iframe while it loads) -->
            <div v-else-if="active_tab_data.loading_page" class="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center" style="background:#fff;">
              <v-progress-circular indeterminate color="#1a73e8" :size="42" :width="3"></v-progress-circular>
              <p class="tw-mt-4 tw-text-sm" style="color:#80868b;">Loading {{ active_tab_data.display_url }}…</p>
            </div>
          </div>
        </div>

        <div class="tw-w-full tw-h-full tw-absolute" style="top:0" v-if="show_blocker">
          <span class="tw-hidden"> this div is to prevent iframe take control over mouse event while dragging window </span>
        </div>
      </div>
    </template>
  </Window>
</template>

<script>
import Window from '../WindowBasic/Window.vue'
import WindowBrowserButton from './WindowBrowserButton.vue'

const PROXY_PREFIX = '/api/proxy?url='
const HOME_URL = 'https://www.bing.com/search?q=LoopRainOS'
const SEARCH_URL = (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`

function guid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export default {
  name: 'WindowBrowser',
  components: {
    Window,
    WindowBrowserButton,
  },
  data(){
    return {
      show_blocker:false,
      tabs: [],
      active_tab: 0,
      address_value:'',
      address_focused:false,
      suggestions:[],
      start_search:'',
      bookmarks: JSON.parse(localStorage.getItem('looprainos-bookmarks') || '[]'),
      history_cache: {},
    }
  },
  props:{
    uuid:String,
    startpos_x:{ default:60 },
    startpos_y:{ default:60 },
    zindex:{ type:Number, default:999 },
    minimized:{ type:Boolean, default:false },
    default_width:{ type:Number, default:1000 },
    initial_src:{ type:String, default:'/#/blog' },
    initial_title:{ type:String, default:'' },
  },
  created(){
    this.restore_history()
    const start = this.initial_src && this.initial_src !== 'about:newtab'
      ? this.initial_src
      : '/#/blog'
    this.new_tab(start)
  },
  mounted(){
  },
  watch:{
  },
  computed:{
    active_tab_data(){
      if (!this.tabs.length) {
        return { show_start:true, src:'', error:'', loading_page:false, display_url:'', iframe_key:1 }
      }
      return this.tabs[this.active_tab] || this.tabs[0]
    },
    can_go_back(){
      const t = this.active_tab_data
      return t && t.history && t.history_pointer > 0
    },
    can_go_forward(){
      const t = this.active_tab_data
      return t && t.history && t.history_pointer < t.history.length - 1
    },
    loading(){
      return this.active_tab_data && this.active_tab_data.loading
    },
    is_secure(){
      const t = this.active_tab_data
      if (!t || !t.src) return false
      return t.src.startsWith('https:')
    },
    is_internal(){
      const t = this.active_tab_data
      return t && t.src && t.src.startsWith('/')
    },
    is_bookmarked(){
      const t = this.active_tab_data
      if (!t || !t.url) return false
      return this.bookmarks.some(b => this.normalize_url(b.url) === this.normalize_url(t.url))
    },
    show_suggestions(){
      return this.address_focused && this.suggestions.length > 0 && this.address_value
    },
  },
  methods:{
    /* ---------- helpers ---------- */
    normalize_url(u){
      return String(u || '').replace(/^https?:\/\//,'').replace(/\/+$/,'')
    },
    is_external_url(str){
      const s = String(str || '').trim()
      if (/^(https?|ftp):\/\//i.test(s)) return true
      if (/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(\/[^\s]*)?$/.test(s)) return true
      return false
    },
    build_proxy(url){
      return PROXY_PREFIX + encodeURIComponent(url)
    },
    resolve_address(input){
      let s = String(input || '').trim()
      if (!s) return null
      if (s.startsWith('/')) return s
      if (s.startsWith('#')) return s
      if (/^(https?|ftp):\/\//i.test(s)) return s
      if (/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(\/[^\s]*)?$/.test(s)) {
        return 'https://' + s
      }
      return null
    },
    parse_title_from_url(u){
      try {
        const url = new URL(u.includes('://') ? u : 'https://' + u)
        return url.hostname.replace(/^www\./,'')
      } catch (e) {
        return u
      }
    },

    /* ---------- tabs ---------- */
    make_tab(src, opts){
      opts = opts || {}
      const is_start = !src || src === 'about:newtab'
      const external = !is_start && this.is_external_url(src)
      return {
        id: guid(),
        title: opts.title || (is_start ? 'New Tab' : (external ? this.parse_title_from_url(src) : 'LoopRain')),
        url: is_start ? '' : src,
        src: is_start ? '' : (external ? this.build_proxy(src) : src),
        display_url: is_start ? '' : src,
        favicon: opts.favicon || (external ? `https://www.google.com/s2/favicons?domain=${this.parse_title_from_url(src)}&sz=32` : ''),
        show_start: is_start,
        loading: !is_start,
        loading_page: !is_start,
        error: '',
        iframe_key: guid(),
        history: is_start ? [] : [src],
        history_pointer: 0,
      }
    },
    new_tab(src){
      const tab = this.make_tab(src === undefined ? 'about:newtab' : src)
      this.tabs.push(tab)
      this.active_tab = this.tabs.length - 1
      this.on_tab_switch()
      return tab
    },
    switch_tab(i){
      if (i >= 0 && i < this.tabs.length) {
        this.active_tab = i
        this.on_tab_switch()
      }
    },
    close_tab(i){
      if (this.tabs.length <= 1) {
        this.tabs = [this.make_tab('about:newtab')]
        this.active_tab = 0
        this.on_tab_switch()
        return
      }
      this.tabs.splice(i, 1)
      if (this.active_tab >= i) {
        this.active_tab = Math.max(0, this.active_tab - 1)
      }
      this.on_tab_switch()
    },
    tab_mouseup(e, i){
      if (e.button === 1) {
        this.close_tab(i)
      }
    },
    on_tab_switch(){
      const t = this.active_tab_data
      this.address_value = t && t.url ? t.url : ''
      this.suggestions = []
      this.address_focused = false
    },

    /* ---------- navigation ---------- */
    address_submit(){
      const input = this.address_value
      const target = this.resolve_address(input)
      if (target) {
        this.navigate(target, { from_address:true })
      } else if (input.trim()) {
        this.navigate(SEARCH_URL(input.trim()), { from_address:true })
      }
      this.address_focused = false
      this.suggestions = []
    },
    search_from_start(){
      const q = this.start_search.trim()
      if (!q) return
      this.navigate(SEARCH_URL(q), { from_address:true, start_new:true })
    },
    navigate(src, opts){
      opts = opts || {}
      const tab = this.active_tab_data
      if (tab.show_start && !opts.start_new) {
        const nt = this.make_tab(src)
        this.tabs[this.active_tab] = nt
        this.on_tab_switch()
        return
      }
      tab.url = src
      tab.display_url = src
      tab.error = ''
      tab.loading = true
      tab.loading_page = true
      this.load_in_iframe(tab, src)
      if (tab.history[tab.history_pointer] !== src) {
        tab.history = tab.history.slice(0, tab.history_pointer + 1)
        tab.history.push(src)
        tab.history_pointer = tab.history.length - 1
      }
      this.on_tab_switch()
    },
    load_in_iframe(tab, src){
      if (this.is_external_url(src)) {
        tab.src = this.build_proxy(src)
        tab.favicon = `https://www.google.com/s2/favicons?domain=${this.parse_title_from_url(src)}&sz=32`
      } else {
        tab.src = src
        tab.favicon = ''
      }
      tab.iframe_key = guid()
    },
    go_back(){
      const t = this.active_tab_data
      if (t && t.history_pointer > 0) {
        t.history_pointer--
        this.navigate_to_history(t)
      }
    },
    go_forward(){
      const t = this.active_tab_data
      if (t && t.history_pointer < t.history.length - 1) {
        t.history_pointer++
        this.navigate_to_history(t)
      }
    },
    navigate_to_history(t){
      const src = t.history[t.history_pointer]
      t.url = src
      t.display_url = src
      t.error = ''
      t.loading = true
      t.loading_page = true
      this.load_in_iframe(t, src)
      this.on_tab_switch()
    },
    refresh(){
      const t = this.active_tab_data
      if (!t || t.show_start) return
      t.loading = true
      t.loading_page = true
      this.load_in_iframe(t, t.url)
    },
    stop_loading(){
      const t = this.active_tab_data
      if (t) {
        t.loading = false
        t.loading_page = false
      }
    },
    go_home(){
      this.navigate(HOME_URL, {})
    },
    open_bookmark(bm){
      this.navigate(bm.url, {})
    },

    /* ---------- bookmark ---------- */
    toggle_bookmark(){
      const t = this.active_tab_data
      if (!t || !t.url) return
      const idx = this.bookmarks.findIndex(b => this.normalize_url(b.url) === this.normalize_url(t.url))
      if (idx >= 0) {
        this.bookmarks.splice(idx, 1)
      } else {
        const colors = ['#1a73e8','#ea4335','#fbbc04','#34a853','#a142f4','#fa7b17']
        this.bookmarks.unshift({
          id: guid(),
          title: t.title || this.parse_title_from_url(t.url),
          url: t.url,
          color: colors[this.bookmarks.length % colors.length],
        })
      }
      localStorage.setItem('looprainos-bookmarks', JSON.stringify(this.bookmarks))
    },

    /* ---------- iframe events ---------- */
    on_frame_load(){
      const t = this.active_tab_data
      if (!t) return
      t.loading = false
      t.loading_page = false
      if (t.url) {
        this.history_cache[t.url] = {
          title: t.title || this.parse_title_from_url(t.url),
          url: t.url,
          time: Date.now(),
        }
        this.save_history()
      }
      try {
        const doc = this.$refs.iframe_main && this.$refs.iframe_main.contentDocument
        if (doc && doc.title && this.is_external_url(t.url)) {
          t.title = doc.title
        }
      } catch (e) {
        // cross-origin document read is not allowed - keep the title from the proxy
      }
    },

    /* ---------- suggestions ---------- */
    on_address_input(){
      const q = this.address_value.trim()
      if (!q) {
        this.suggestions = []
        return
      }
      const out = []
      const bms = this.bookmarks.filter(b => {
        return b.title.toLowerCase().includes(q.toLowerCase()) || b.url.toLowerCase().includes(q.toLowerCase())
      }).slice(0, 3)
      bms.forEach(b => out.push({ suggest_type:'bookmark', title:b.title, url:b.url }))
      const hist = Object.values(this.history_cache).filter(h => {
        return h.title.toLowerCase().includes(q.toLowerCase()) || h.url.toLowerCase().includes(q.toLowerCase())
      }).slice(0, 3)
      hist.forEach(h => out.push({ suggest_type:'history', title:h.title, url:h.url }))
      out.push({ suggest_type:'search', title:`Search for "${q}"`, url:SEARCH_URL(q) })
      this.suggestions = out
    },
    use_suggestion(s){
      this.navigate(s.url, { from_address:true })
      this.address_focused = false
      this.suggestions = []
    },
    sync_address_value(){
      const t = this.active_tab_data
      this.address_value = t && t.url ? t.url : this.address_value
      this.address_focused = false
      this.suggestions = []
    },

    /* ---------- history persistence ---------- */
    save_history(){
      const arr = Object.values(this.history_cache).sort((a,b)=>b.time-a.time).slice(0, 50)
      localStorage.setItem('looprainos-browser-history', JSON.stringify(arr))
    },
    restore_history(){
      try {
        const arr = JSON.parse(localStorage.getItem('looprainos-browser-history') || '[]')
        arr.forEach(h => { this.history_cache[h.url] = h })
      } catch (e) {
        // ignore corrupted localStorage history
      }
    },
  }
}
</script>

<style scoped>
.bg-b11 {
  background-color:#f1f3f4
}
@keyframes tw-flow {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
