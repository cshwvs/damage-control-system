import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'
import { menuRoutes } from './menu'

const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: menuRoutes
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - xx辅助决策系统` : 'xx辅助决策系统'
  next()
})

export default router