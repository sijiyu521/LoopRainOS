<template>
  <Window :uuid='uuid' :startpos_x="startpos_x" :startpos_y="startpos_y" :zindex="zindex" :blacktheme="true"  :minimized="minimized" @resize_start="show_blocker=true" @resize_end="show_blocker=false">
    <template v-slot:header>
      <div class="tw-flex tw-items-center tw-select-none" style="pointer-events:none;"> 
        <img src="../../assets/images/icons/vscode.png" alt="" style="pointer-events:none;" class=" tw-w-8 tw-h-7 tw-ml-4">
        <div class=" tw-ml-4 tw-font-semibold tw-tracking-wider tw-h-8 tw-rounded-lg tw-px-4 tw-py-1  tw-text-white tw-bg-mygray-b13 hover:tw-bg-mygray-b14 " style="pointer-events:auto;max-width:400px;white-space:nowrap;text-overflow: ellipsis;overflow: hidden;"> {{ headerTitle }} </div>
      </div>
    </template>
    <template v-slot:content>
      <div class="tw-w-full tw-h-full tw-flex tw-overflow-hidden" @click="go_focus">
        <div v-if="hasFile" class="tw-w-full tw-h-full tw-flex tw-flex-col tw-bg-mygray-b15">
          <div class="tw-flex tw-items-center tw-h-9 tw-bg-mygray-b13 tw-px-4 tw-gap-2 tw-select-none">
            <div class="tw-text-xs tw-text-gray-400 tw-px-2 tw-py-0.5 tw-rounded tw-bg-mygray-b14" v-for="(tab, i) in openTabs" :key="i" :class="{'tw-text-white tw-bg-mygray-b12': i === activeTab}">
              {{ tab }}
            </div>
          </div>
          <div class="tw-flex-grow tw-overflow-hidden">
            <textarea v-if="isEditable" v-model="fileContent" class="vscode-editor" spellcheck="false"></textarea>
            <pre v-else class="vscode-editor vscode-readonly">{{ fileContent }}</pre>
          </div>
          <div class="tw-h-6 tw-bg-mygray-b13 tw-flex tw-items-center tw-px-4 tw-text-xs tw-text-gray-400 tw-select-none">
            <span>Ln {{ lineCount }}, Col {{ colCount }}</span>
            <span class="tw-ml-4">{{ fileSize }}</span>
            <span class="tw-ml-4">UTF-8</span>
            <span class="tw-ml-auto tw-mr-3" v-if="saveMessage">{{ saveMessage }}</span>
            <button v-if="isEditable" class="tw-text-xs tw-px-2 tw-py-0.5 tw-rounded hover:tw-bg-mygray-b14 tw-text-gray-300 tw-outline-none" @click="saveFile" title="Ctrl+S">Save</button>
          </div>
        </div>
        <iframe v-else src="https://github1s.com/GoodManWEN/GoodManWEN.github.io/blob/main/src/components/Interlude.vue" frameborder="0" class=" zoomined-frame "></iframe>
        <div class="tw-w-full tw-h-full tw-absolute background-color" style="top:0" v-if="show_blocker">
          <span class="tw-hidden"> this div is to prevent iframe take control over mouse event </span>
        </div>
      </div>
    </template>
  </Window>
</template>

<script>
import Window from '../WindowBasic/Window.vue'
import { saveFileContentToBackend, loadFileContentFromBackend } from '../../network/sync'

export default {
  name: 'WindowVSCode',
  components: {
    Window,
  },
  data(){
    return {
      show_blocker:false,
      fileContent:'',
      saveMessage:'',
    }
  },
  props:{
    uuid:String,
    startpos_x:{
      default:60,
    },
    startpos_y:{
      default:60
    },
    zindex:{
      type:Number,
      default:999,
    },
    minimized:{
      type:Boolean,
      default:false,
    },
    filesrc:{
      type:String,
      default:"",
    },
    filename:{
      type:String,
      default:"",
    },
    size:{
      type:Number,
      default:0,
    },
  },
  created(){
    if (this.hasFile) {
      this.loadFile()
    }
  },
  mounted(){ 
    window.addEventListener('keydown', this.handleKeydown)
  },
  beforeDestroy(){
    window.removeEventListener('keydown', this.handleKeydown)
  },
  watch:{
  },
  computed:{
    hasFile(){
      return !!this.filesrc
    },
    headerTitle(){
      if (this.hasFile) {
        return this.filename + ' - Visual Studio Code'
      }
      return 'Github - Visual Studio Code'
    },
    openTabs(){
      return this.hasFile ? [this.filename] : []
    },
    activeTab(){
      return 0
    },
    isEditable(){
      return this.filesrc && this.filesrc.indexOf('local:') === 0 && /\.md$/i.test(this.filename)
    },
    lineCount(){
      return this.fileContent ? this.fileContent.split(/\r?\n/).length : 0
    },
    colCount(){
      if (!this.fileContent) return 0
      let lines = this.fileContent.split(/\r?\n/)
      let max = 0
      lines.forEach(l => { if (l.length > max) max = l.length })
      return max
    },
    fileSize(){
      let s = this.size || (this.fileContent ? new Blob([this.fileContent]).size : 0)
      if (s >= (1<<20)) {
        return (s / (1<<20)).toFixed(1) + 'MB'
      } else if (s >= (1<<10)) {
        return (s / (1<<10)).toFixed(1) + 'KiB'
      } else {
        return s + ' Bytes'
      }
    },
  },
  methods:{
    async loadFile(){
      if (this.filesrc.indexOf('local:') === 0) {
        // Try backend first, fallback to localStorage
        const backendContent = await loadFileContentFromBackend(this.filesrc)
        if (backendContent !== null) {
          this.fileContent = backendContent
        } else {
          this.fileContent = localStorage.getItem(this.filesrc) || ''
        }
        this.saveMessage = ''
        return
      }
      this.$axios.raw(this.filesrc)
      .then((res) => {
        if (typeof res.data === 'string') {
          this.fileContent = res.data
        } else if (res.data && res.data.data) {
          this.fileContent = res.data.data
        }
      })
      .catch(() => {
        this.fileContent = '## Failed to load file'
      })
    },
    go_focus(){
      this.$store.commit('refresh_window_focus', {'type':'vscode'})
    },
    async saveFile(){
      if (!this.isEditable || !this.filesrc) return
      // Save to both localStorage (fallback) and backend
      localStorage.setItem(this.filesrc, this.fileContent)
      await saveFileContentToBackend(this.filesrc, this.fileContent)
      this.saveMessage = 'Saved'
      window.setTimeout(() => { this.saveMessage = '' }, 2000)
    },
    handleKeydown(e){
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && this.$store.state.current_focus === this.uuid) {
        e.preventDefault()
        this.saveFile()
      }
    },
  }
}
</script>

<style scoped>
.zoomined-frame{
  width: 100%;
  height: 100%;
}

.vscode-editor {
  width: 100%;
  height: 100%;
  background-color: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  padding: 12px 16px;
  border: none;
  outline: none;
  resize: none;
  overflow: auto;
  tab-size: 4;
}

.vscode-readonly {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.vscode-editor::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.vscode-editor::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.vscode-editor::-webkit-scrollbar-thumb {
  background: #424242;
  border-radius: 5px;
}

.vscode-editor::-webkit-scrollbar-thumb:hover {
  background: #4f4f4f;
}
</style>
