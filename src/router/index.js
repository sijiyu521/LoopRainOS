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
    path:"*",
    redirect:'/blog',
  },
]


const router = new VueRouter({
  base: process.env.BASE_URL,
  routes
})

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth) && !store.state.role) {
    next({name:'LoginPage'})
    return
  }
  store.commit('show_interlude')
  next()
})

export default router
