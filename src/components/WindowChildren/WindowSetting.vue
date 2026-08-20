<template>
  <Window :uuid='uuid' :startpos_x="startpos_x" :startpos_y="startpos_y" :zindex="zindex"  :minimized="minimized">
    <template v-slot:header>
      <div class="tw-flex tw-items-center tw-select-none" style="pointer-events:none;"> 
        <img src="../../assets/images/icons/settings.png" alt="" style="pointer-events:auto;" class=" tw-w-7 tw-h-7 tw-ml-4">
        <div class=" tw-ml-4 tw-font-bold tw-tracking-wider" style="pointer-events:auto;"> Settings </div>
      </div>
    </template>
    <template v-slot:content>
      <div class=" tw-w-full  tw-h-full tw-rounded-b-2xl tw-overflow-hidden tw-flex
       tw-select-none" @contextmenu.prevent="mr_clicked">
        <div class="settings-nav tw-w-52 tw-bg-white tw-h-full tw-flex tw-flex-col tw-px-3 tw-py-2 tw-flex-none" >
          <div class="settings-nav-title">Personal</div>
          <WindowSettingIcon :tag="'Profile'" :img="'profile'" :selected_tag="selected_tag" @click.native="{selected_tag = 'Profile';selected_tag_2 = 'About Me'}"/>
          <WindowSettingIcon :tag="'Skills'" :img="'skills'" :selected_tag="selected_tag"  @click.native="{selected_tag = 'Skills';selected_tag_2 = 'Badges'}"/>
          <div class="settings-nav-title settings-nav-title-spaced">Appearance</div>
          <WindowSettingIcon :tag="'Wallpaper'" :mdi="'image'" :selected_tag="selected_tag"  @click.native="selected_tag = 'Wallpaper'"/>
          <div class="settings-nav-title settings-nav-title-spaced">More</div>
          <WindowSettingIcon :tag="'Resume'" :img="'paint'" :selected_tag="selected_tag"  @click.native="selected_tag = 'Resume'"/>
        </div>
        <div class=" tw-flex-grow tw-h-full  tw-p-2">
          <div class="tw-w-full tw-h-full  tw-flex">
            <div class="tw-w-48 tw-flex-none tw-rounded-xl tw-bg-white tw-p-2">
              <div class="tw-w-full tw-h-full" v-if="selected_tag === 'Profile'">
                <WindowSettingIcon :tag="'About Me'" :mdi="'beaker-question'" :selected_tag="selected_tag_2"  @click.native="selected_tag_2 = 'About Me'"/>
                <!-- <WindowSettingIcon :tag="'Github Stats'" :mdi="'card-account-details-star'" :selected_tag="selected_tag_2"  @click.native="selected_tag_2 = 'Github Stats'"/> -->
                <WindowSettingIcon :tag="'CodeWars'" :mdi="'pistol'" :selected_tag="selected_tag_2"  @click.native="selected_tag_2 = 'CodeWars'"/>
              </div>
              <div class="tw-w-full tw-h-full" v-if="selected_tag === 'Skills'">
                <WindowSettingIcon :tag="'Badges'" :mdi="'shield-half-full'" :selected_tag="selected_tag_2"  @click.native="selected_tag_2 = 'Badges'"/>
                <WindowSettingIcon :tag="'And Some Else'" :mdi="'card-account-details-star'" :selected_tag="selected_tag_2"  @click.native="selected_tag_2 = 'And Some Else'"/>
              </div>
            </div>
            <div class="vl"></div>
            <div class="tw-flex-grow tw-bg-white tw-h-full">
              <div class="wallpaper-settings tw-w-full tw-h-full" v-if="selected_tag === 'Wallpaper'">
                <div class="wallpaper-heading">
                  <div>
                    <div class="wallpaper-title">Wallpaper</div>
                    <div class="wallpaper-subtitle">Choose how your desktop looks</div>
                  </div>
                  <div class="wallpaper-current-dot" :style="{backgroundColor: wallpaper_mode === 'solid' ? wallpaper_color : '#d86b8a'}"></div>
                </div>
                <div class="wallpaper-modes">
                  <button class="wallpaper-mode" :class="{'wallpaper-mode-active': wallpaper_mode === 'image'}" @click="set_wallpaper_mode('image')"><v-icon small>mdi-image</v-icon><span>Image</span><small>One picture</small></button>
                  <button class="wallpaper-mode" :class="{'wallpaper-mode-active': wallpaper_mode === 'solid'}" @click="set_wallpaper_mode('solid')"><v-icon small>mdi-format-color-fill</v-icon><span>Solid color</span><small>Simple and calm</small></button>
                  <button class="wallpaper-mode" :class="{'wallpaper-mode-active': wallpaper_mode === 'slideshow'}" @click="set_wallpaper_mode('slideshow')"><v-icon small>mdi-play-circle-outline</v-icon><span>Slideshow</span><small>Refresh every 10s</small></button>
                </div>
                <div v-if="wallpaper_mode === 'image'" class="wallpaper-control">
                  <input ref="wallpaper_input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="tw-hidden" @change="wallpaper_selected">
                  <img :src="wallpaper_image" alt="Wallpaper preview" class="wallpaper-preview">
                  <button class="setting-action" @click="choose_wallpaper"><v-icon small>mdi-upload</v-icon>Choose image</button>
                </div>
                <div v-if="wallpaper_mode === 'solid'" class="wallpaper-control">
                  <div class="solid-preview" :style="{backgroundColor: wallpaper_color}"></div>
                  <label class="color-label">Background color <span>{{wallpaper_color}}</span></label>
                  <input class="color-picker" type="color" :value="wallpaper_color" @input="wallpaper_color_changed">
                </div>
                <div v-if="wallpaper_mode === 'slideshow'" class="slideshow-note"><v-icon small>mdi-cloud-refresh</v-icon> Images refresh automatically from the wallpaper service.</div>
              </div>
              <div class=" tw-w-full tw-h-full" v-if="selected_tag === 'Profile'">
                <div ref="overall_page" class="tw-w-full tw-h-full tw-items-center tw-flex tw-flex-col" style="text-align:center" v-if="selected_tag_2 ==='About Me'">
                  <div class="tw-w-20 tw-h-20 tw-rounded-full tw-overflow-hidden tw-mt-16">
                    <img :src="avatar" alt="User avatar" class="avatar-image">
                  </div>
                  <input ref="avatar_input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="tw-hidden" @change="avatar_selected">
                  <button class="tw-mt-3 tw-px-3 tw-py-1 tw-rounded-lg tw-bg-gray-200 hover:tw-bg-gray-300 tw-text-sm tw-outline-none" @click="choose_avatar">Change avatar</button>
                  <div class="username-editor">
                    <label class="color-label">Administrator name</label>
                    <div class="username-row">
                      <input v-model="username_draft" class="password-input" maxlength="24" @keyup.enter="save_username">
                      <button class="setting-action" @click="save_username">Save</button>
                    </div>
                    <div v-if="username_message" class="tw-text-xs tw-text-gray-500">{{username_message}}</div>
                  </div>
                  <div class="tw-mt-3 tw-text-gray-400">LoopRainOS</div>
                  <div class="tw-text-xl tw-mt-2 tw-tracking-wide"> LoopRainOS is a free and open-source operating system,</div>
                  <div class="tw-text-lg tw-mt-2 tw-tracking-wide"> Designed for running web applications and browsing the World Wide Web. Buzhidao xieshenmele suibian xie yidian pinyin. </div>
                </div>
                <!-- <div ref="github_page" class="tw-w-full tw-h-full tw-items-center tw-flex tw-flex-col tw-justify-center" style="text-align:center" v-if="selected_tag_2 ==='Github Stats'">
                  <img src="https://github-readme-stats.vercel.app/api?username=GoodManWEN&show_icons=true&line_height=24" alt="" class="tw-w-140 tw-h-40">
                  <img src="https://github-readme-stats.vercel.app/api/top-langs?username=goodmanwen" alt="" class="tw-mt-6  tw-w-120 tw-h-72">
                </div> -->
                <div ref="github_page" class="tw-w-full tw-h-full tw-items-center tw-flex tw-flex-col" style="text-align:center" v-if="selected_tag_2 ==='CodeWars'">
                  <div class=" tw-w-20 tw-h-20 tw-rounded-full tw-bg-red-50 tw-overflow-hidden tw-mt-16">
                    <img src="../../assets/images/bilibili.png" alt="" class="tw-bg-red-500">
                  </div>
                  <img src="https://www.codewars.com/users/GoodManWEN/badges/large" alt="" class="tw-mt-10">
                </div>
              </div>
              <div class="tw-w-full tw-h-full" v-if="selected_tag === 'Skills'">
                <div ref="overall_page" class="tw-w-full tw-h-full tw-items-center tw-flex tw-flex-col tw-justify-center" style="text-align:center" v-if="selected_tag_2 ==='Badges'">
                  <div class="tw-text-xl tw-mt-2 tw-tracking-wide"> Frameworks </div>
                  <div class="tw-flex tw-flex-wrap tw-px-4 tw-py-2 tw-items-center">
                    <img src="https://img.shields.io/badge/fastapi%20-%2313988a.svg?&style=flat&logo=data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgaWQ9InN2ZzgiCiAgIHZlcnNpb249IjEuMSIKICAgdmlld0JveD0iMCAwIDYuMzQ5OTk5OSA2LjM0OTk5OTkiCiAgIGhlaWdodD0iNi4zNDk5OTk5bW0iCiAgIHdpZHRoPSI2LjM0OTk5OTltbSI+CiAgPGRlZnMKICAgICBpZD0iZGVmczIiIC8+CiAgPG1ldGFkYXRhCiAgICAgaWQ9Im1ldGFkYXRhNSI+CiAgICA8cmRmOlJERj4KICAgICAgPGNjOldvcmsKICAgICAgICAgcmRmOmFib3V0PSIiPgogICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PgogICAgICAgIDxkYzp0eXBlCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4KICAgICAgICA8ZGM6dGl0bGU+PC9kYzp0aXRsZT4KICAgICAgPC9jYzpXb3JrPgogICAgPC9yZGY6UkRGPgogIDwvbWV0YWRhdGE+CiAgPGcKICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtODcuNTM5Mjg2LC04NC40MjYxOTEpIgogICAgIGlkPSJsYXllcjEiPgogICAgPHBhdGgKICAgICAgIGlkPSJwYXRoODE1IgogICAgICAgZD0ibSA4Ny41MzkyODYsODQuNDI2MTkxIGggNi4zNSB2IDYuMzUgaCAtNi4zNSB6IgogICAgICAgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2Utd2lkdGg6MC4yNjQ1ODMzMiIgLz4KICAgIDxwYXRoCiAgICAgICBzdHlsZT0ic3Ryb2tlLXdpZHRoOjAuMjY0NTgzMzI7ZmlsbDojZmZmZmZmIgogICAgICAgaWQ9InBhdGg4MTciCiAgICAgICBkPSJtIDkwLjcxNDI4Niw4NC45NjA2NDkgYyAtMS40NTc4NTQsMCAtMi42NDA1NDIsMS4xODI2ODggLTIuNjQwNTQyLDIuNjQwNTQyIDAsMS40NTc4NTQgMS4xODI2ODgsMi42NDA1NDIgMi42NDA1NDIsMi42NDA1NDIgMS40NTc4NTQsMCAyLjY0MDU0MiwtMS4xODI2ODggMi42NDA1NDIsLTIuNjQwNTQyIDAsLTEuNDU3ODU0IC0xLjE4MjY4OCwtMi42NDA1NDIgLTIuNjQwNTQyLC0yLjY0MDU0MiB6IG0gLTAuMTM3NTgzLDQuNzU3MjA5IHYgLTEuNjU2MjkyIGggLTAuOTIwNzUgbCAxLjMyMjkxNiwtMi41NzcwNDIgdiAxLjY1NjI5MiBoIDAuODg2MzU0IHoiIC8+CiAgPC9nPgo8L3N2Zz4K" alt="" class="tw-ml-3 tw-mt-2">
                    <img src="https://img.shields.io/badge/vuejs%20-%2335495e.svg?&style=flat&logo=vue.js&logoColor=%234FC08D" alt="" class="tw-ml-3 tw-mt-2">
                    <img src="https://img.shields.io/badge/spring%20-%236DB33F.svg?&style=flat&logo=spring&logoColor=white" alt="" class="tw-ml-3 tw-mt-2">
                    <img src="https://img.shields.io/badge/TensorFlow%20-%23FF6F00.svg?&style=flat&logo=TensorFlow&logoColor=white" alt="" class="tw-ml-3 tw-mt-2">
                    <img src="https://img.shields.io/badge/numpy%20-%23013243.svg?&style=flat&logo=numpy&logoColor=white" alt="" class="tw-ml-3 tw-mt-2">
                  </div>
                  <div class="tw-text-xl tw-mt-2 tw-tracking-wide"> Tools </div>
                  <div class="tw-flex tw-flex-wrap tw-px-4 tw-py-2  tw-items-center">
                    <img src="https://img.shields.io/badge/-Redis-black?style=flat-square&logo=Redis" alt="" class="tw-ml-3 tw-mt-2 tw-h-5">
                    <img src="https://img.shields.io/badge/mysql-%2300f.svg?&style=flat&logo=mysql&logoColor=white" alt="" class="tw-ml-3 tw-mt-2 tw-h-5">
                    <img src="https://img.shields.io/badge/oracle%20-%23F00000.svg?&style=flat&logo=oracle&logoColor=white" alt="" class="tw-ml-3 tw-mt-2 tw-h-5">
                    <img src="https://img.shields.io/badge/-Celery-black?style=flat-square&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB/ElEQVR4Ae2UA4xdQRSGbxo2Zh2niG2W0dq2FdXbuLbdtW3btm3b/nveNLOMM/V8yXf53j2jfxTJH4dEIknqsrtC3iO9RJncZe8V027iFddh/i1v8MbX5pkvXt2LIa87FwJO7S58mPxKQqTJ3faIaTNm13VTr9G7FAYqjs4FfzIglxVP7nE4To6TEGlKjyNiOkyR1uOCnqVQDK3Go2shUFV4W9aAhHbr3vh2ayQINqbFDPFtVqy3AyvR6Jj354XnyFJSQ4msM3YJLtFGcJkOQoSqi295F5DffQejm0noWNgufkPZTVilfqnqD6HluggRaFCpFqmJxqmPGFiN5sXfKPsJrdBbJiHawFJ1RFabsGHvWQ7jDTh3oAGJnbZLbMUKNq7dAqk9zmz+e5ZCeAPOHGgAxaSMhGgTu2yYLbNf0bccwRvw6ODG023vofpDiugIkjEdxqiafIzhtYTdCXBSdhPbZH4ovNpwIqzKABE1hqBrYQZXaLGzKvuDazHUCD/eiHGymLzwoxHNFmeCS7VXg0q0eITERLFcD94FlxFbZ4WBtWiMbCSgc/9GxIlqMDkaVmkQTRESmgb6JnwKryC8ygh142/RvxqJ7qVgvhVXKvuJqDEyDKvSf05/9hKnvhc1wiuwVMMrq/OaV8vMN6/upZB3NBpnld+NRCKRfAftOqATvvOv0AAAAABJRU5ErkJggg==" alt="" class="tw-ml-3 tw-mt-2 tw-h-5">
                    <img src="https://img.shields.io/badge/-ElasticSearch-005571?style=flat&logo=elasticsearch" alt="" class="tw-ml-3 tw-mt-2 tw-h-5">
                    <img src="https://img.shields.io/badge/travisci%20-%232B2F33.svg?&style=flat&logo=travis&logoColor=white" alt="" class="tw-ml-3 tw-mt-2 tw-h-5">
                    <img src="https://img.shields.io/badge/docker%20-%230db7ed.svg?&style=flat&logo=docker&logoColor=white" alt="" class="tw-ml-3 tw-mt-2 tw-h-5">
                    <img src="https://img.shields.io/badge/nginx%20-%23009639.svg?&style=flate&logo=nginx&logoColor=white" alt="" class="tw-ml-3 tw-mt-2 tw-h-5">
                    <img src="" alt="" class="tw-ml-3 tw-mt-2">
                    <img src="" alt="" class="tw-ml-3 tw-mt-2">
                  </div>
                  <div class="tw-text-xl tw-mt-2 tw-tracking-wide"> Others </div>
                  <div class="tw-flex tw-flex-wrap tw-px-4 tw-py-2 tw-mb-16  tw-items-center">
                    <img src="https://img.shields.io/badge/-Linux-black?style=flat-square&logo=Linux" alt="" class="tw-ml-3 tw-mt-2 tw-h-5">
                    <img src="https://img.shields.io/badge/-Debian-007CFF?style=flat-square&logo=debian" alt="" class="tw-ml-3 tw-mt-2 tw-h-5">
                    <img src="https://img.shields.io/badge/-Centos-262577?style=flat-square&logo=Centos" alt="" class="tw-ml-3 tw-mt-2 tw-h-5">
                    <img src="https://img.shields.io/badge/-Raspberry%20Pi-C51A4A?style=flat-square&logo=Raspberry-Pi" alt="" class="tw-ml-3 tw-mt-2 tw-h-5">
                  </div>
                </div>
                <div ref="github_page" class="tw-w-full tw-h-full tw-items-center tw-flex tw-flex-col tw-justify-center tw-mb-16" style="text-align:center" v-if="selected_tag_2 ==='And Some Else'">
                  <img src="../../assets/images/holo.gif" alt="" class="">
                  <div class="tw-text-lg tw-mt-2 tw-tracking-wide tw-mb-10"> Thanks for watching this demo, hope you enjoy it. </div>
                </div> 
              </div>
              <div class="tw-w-full tw-h-full" v-if="selected_tag === 'Resume'">
                <div ref="overall_page" class="tw-w-full tw-h-full tw-items-center tw-flex tw-flex-col tw-justify-center" style="text-align:center">
                  <div class="tw-text-4xl tw-mt-2 tw-tracking-wider"> Coming Soon </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </template>
  </Window>
</template>

<script>
import Window from '../WindowBasic/Window.vue'
import WindowSettingIcon from './WindowSettingIcon.vue'

export default {
  name: 'WindowSettings',
  components: {
    Window,
    WindowSettingIcon,
  },
  data(){
    return {
      selected_tag:"Profile",
      selected_tag_2:"About Me",
      username_draft:'',
      username_message:'',
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
    default_width:{
      type:Number,
      default:680
    }
  },
  created(){
  },
  mounted(){
    this.username_draft = this.admin_username
  },
  watch:{
  },
  computed:{
    avatar(){
      return this.$store.state.avatar
    },
    wallpaper_mode(){
      return this.$store.state.wallpaper_mode
    },
    wallpaper_image(){
      return this.$store.state.wallpaper_image
    },
    wallpaper_color(){
      return this.$store.state.wallpaper_color
    },
    admin_username(){
      return this.$store.state.admin_username
    }
  },
  methods:{
    save_username(){
      let username = this.username_draft.trim()
      if (username.length < 2) {
        this.username_message = 'Name must be at least 2 characters.'
        return
      }
      this.$store.commit('set_admin_username', username)
      this.username_draft = username
      this.username_message = 'Administrator name updated.'
    },
    choose_avatar(){
      this.$refs.avatar_input.click()
    },
    avatar_selected(event){
      let file = event.target.files[0]
      if (!file || !file.type.startsWith('image/')) {
        return
      }
      if (file.size > 4 * 1024 * 1024) {
        window.alert('Please choose an image smaller than 4 MB.')
        event.target.value = ''
        return
      }
      let reader = new FileReader()
      reader.onload = () => {
        this.$store.commit('set_avatar', reader.result)
        event.target.value = ''
      }
      reader.readAsDataURL(file)
    },
    set_wallpaper_mode(mode){
      this.$store.commit('set_wallpaper_mode', mode)
    },
    choose_wallpaper(){
      this.$refs.wallpaper_input.click()
    },
    wallpaper_selected(event){
      let file = event.target.files[0]
      if (!file || !file.type.startsWith('image/')) {
        return
      }
      if (file.size > 6 * 1024 * 1024) {
        window.alert('Please choose an image smaller than 6 MB.')
        event.target.value = ''
        return
      }
      let reader = new FileReader()
      reader.onload = () => {
        this.$store.commit('set_wallpaper_image', reader.result)
        this.$store.commit('set_wallpaper_mode', 'image')
        event.target.value = ''
      }
      reader.readAsDataURL(file)
    },
    wallpaper_color_changed(event){
      this.$store.commit('set_wallpaper_color', event.target.value)
    },
    mr_clicked(){
      this.$store.commit('show_context_menu')
    }
  }
}
</script>

<style scoped>
.settings-nav {
  border-right: 1px solid #edf1f2;
}

.settings-nav-title {
  padding: 8px 12px 4px;
  color: #90a4ae;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.settings-nav-title-spaced {
  margin-top: 14px;
}

.vl {
  border-left: 1.5px solid rgba(244,244,244);
  height: 100%;
  left: 50%;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.wallpaper-settings {
  padding: 28px;
  overflow: auto;
  color: #263238;
}

.wallpaper-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.wallpaper-title {
  font-size: 24px;
  font-weight: 700;
}

.wallpaper-subtitle {
  margin-top: 4px;
  color: #78909c;
  font-size: 13px;
}

.wallpaper-current-dot {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 4px solid #eceff1;
}

.wallpaper-modes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.wallpaper-mode {
  min-height: 92px;
  padding: 12px;
  border: 1px solid #e0e6e9;
  border-radius: 10px;
  background: #fafcfd;
  color: #546e7a;
  text-align: left;
  outline: none;
}

.wallpaper-mode span,
.wallpaper-mode small {
  display: block;
}

.wallpaper-mode span {
  margin-top: 8px;
  color: #263238;
  font-weight: 700;
}

.wallpaper-mode small {
  margin-top: 4px;
  color: #90a4ae;
  font-size: 11px;
}

.wallpaper-mode:hover,
.wallpaper-mode-active {
  border-color: #d86b8a;
  background: #fff3f6;
  color: #c14f72;
}

.wallpaper-control {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 18px;
  padding: 14px;
  border-radius: 10px;
  background: #f5f8f9;
}

.wallpaper-preview {
  width: 170px;
  height: 96px;
  border-radius: 8px;
  object-fit: cover;
}

.solid-preview {
  width: 170px;
  height: 96px;
  border-radius: 8px;
}

.color-label {
  color: #607d8b;
  font-size: 13px;
}

.color-label span {
  margin-left: 8px;
  color: #263238;
  font-family: monospace;
}

.color-picker {
  width: 42px;
  height: 32px;
  border: 0;
  background: transparent;
}

.slideshow-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  color: #607d8b;
  font-size: 13px;
}

.username-editor {
  width: 280px;
  margin-top: 20px;
}

.username-row {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.setting-action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  border-radius: 7px;
  background: #eceff1;
  color: #37474f;
  font-size: 12px;
  outline: none;
}

.setting-action:hover {
  background: #dfe5e8;
}
</style>
