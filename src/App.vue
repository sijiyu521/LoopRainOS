<template>
  <v-app>
    <Interlude/>
    <router-view v-wechat-title="$route.meta.title" />
  </v-app>
</template>

<script>
import Interlude from './components/Interlude.vue';
import { migrateToBackend } from './network/sync';

export default {
  name: 'App',
  components: {
    Interlude
  },
  data: () => ({
    authed: false,
  }),
  created(){
    this.$utils.dynamic_append_link("https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.min.css")
    this.authed = this.$store.state.authed
    // resize
    this.$store.commit('refresh_sizes')
    this.$store.commit('refresh_scroll')
    window.onresize = () => {
      this.$store.commit('refresh_sizes')
      this.$store.commit('refresh_scroll')
    }
    window.onscroll = () => {
      this.$store.commit('refresh_scroll')
    }
    // 从后端拉取账号信息与设置，覆盖本地 localStorage 旧值
    this.$store.dispatch('init_from_backend')
    // Migrate localStorage to backend
    migrateToBackend()
  },
  mounted(){
  },
  watch:{
  },
  computed:{
  },
  methods:{
  }
};
</script>

<style>
::-webkit-scrollbar {
  width: 0px;
  background: transparent; /* make scrollbar transparent */
}
</style>