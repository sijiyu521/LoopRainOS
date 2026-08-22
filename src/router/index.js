import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '../store'
import LoginPage from '../components/LoginPage/LoginPage'
import Desktop from '../components/Desktop/Desktop'
import Down from '../components/Down'
import Blog from '../components/Blog'

Vue.use(VueRouter)

const routes = [
  {
    path: '/blog/post/:postfilename',
    name: "BlogPost",
    component: Blog,
    meta: { title: "LoopRain 博客" }
  },
  {
    path: '/blog',
    name: "Blog",
    component: Blog,
    meta: { title: "LoopRain 博客" }
  },
  {
    path: '/terminated',
    name: "Down",
    component: Down,
    meta : {
      title:"No signal"
    }
  },
  {
    path: '/login',
    name: "LoginPage",
    component: LoginPage,
    meta : {
      title:"LoopRainOS"
    }
  },
  {
    path: '/desktop/post/:postfilename',
    name: "DesktopWithPost",
    component: Desktop,
    meta : {
      title:"LoopRainOS",
      requiresAuth:true
    }
  },
  {
    path: '/desktop',
    name: "Desktop",
    component: Desktop,
    meta : {
      title:"LoopRainOS",
      requiresAuth:true
    }
  },
  {
    path:"/",
    redirect:'/login',
  },
  {
    path:"*",
    redirect:'/login',
  },
]


const router = new VueRouter({
  base: process.env.BASE_URL,
  routes
})

const inIframe = (() => {
  try {
    return window.self !== window.top
  } catch (e) {
    return true
  }
})()

router.beforeEach((to, from, next) => {
  // 当博客页面运行在浏览器窗口(iframe)中时，禁止导航到桌面系统，否则会导致"桌面套桌面"嵌套渲染
  if (inIframe && to.path.startsWith('/desktop')) {
    next('/blog')
    return
  }
  if (to.matched.some(record => record.meta.requiresAuth) && !store.state.role) {
    next({name:'LoginPage'})
    return
  }
  store.commit('show_interlude')
  next()
})

export default router
