<template>
  <div class="sidebar">
    <div class="logo">
      <span>xx辅助决策系统</span>
    </div>
    <el-menu
      :default-active="activeMenu"
      router
      class="sidebar-menu"
      background-color="#ffffff"
      text-color="#333333"
      active-text-color="#409EFF"
    >
      <SidebarItem v-for="route in routes" :key="route.path" :item="route" :base-path="''" />
    </el-menu>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SidebarItem from './SidebarItem.vue'
import { menuRoutes } from '@/router/menu'

const route = useRoute()
const routes = menuRoutes
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.sidebar {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #142864;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.logo span {
  color: #ffffff;
  font-weight: bold;
  font-size: 20px;
  letter-spacing: 1px;
}

.sidebar-menu {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  border-right: none;
  padding: 8px 0;
  /* 关键：滚动条悬浮于内容上方，不占用布局宽度 */
  scrollbar-width: thin;
  scrollbar-color: #b1b1b1 transparent;
  /* 预留右侧空间，防止滚动条遮挡内容 */
  padding-right: 0px;
}

/* WebKit 滚动条 */
.sidebar-menu::-webkit-scrollbar {
  width: 6px;
  background: transparent;
}
.sidebar-menu::-webkit-scrollbar-thumb {
  background-color: #b1b1b1;
  border-radius: 3px;
}
.sidebar-menu::-webkit-scrollbar-track {
  background: transparent;
}

/* 一级菜单和子菜单标题 */
.sidebar-menu :deep(.el-menu-item),
.sidebar-menu :deep(.el-sub-menu__title) {
  font-size: 16px !important;
  border-radius: 4px;
  margin: 4px 8px 4px 12px;      /* 左右边距8px，右侧实际到边缘约14px(8+6滚动条预留) */
  width: auto;                   /* 自动宽度，由 flex 父容器控制 */
  padding: 0 10px !important;
  height: 40px;
  line-height: 48px;
  display: flex;
  align-items: center;
  /* 确保右侧固定间距，不受滚动条影响 */
  box-sizing: border-box;
}

/* 二级菜单项 */
.sidebar-menu :deep(.el-sub-menu .el-menu-item) {
  padding-left: 26px !important;
  font-size: 14px !important;
}

/* active 状态 */
.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: #e8f0fe;
  color: #142864;
  font-weight: 600;
}

/* hover 状态 */
.sidebar-menu :deep(.el-menu-item:hover:not(.is-active)),
.sidebar-menu :deep(.el-sub-menu__title:hover:not(.is-active)) {
  background-color: #F0F0F0;
}

/* 展开箭头：用 flex 推到最右，与右侧边距保持10px */
.sidebar-menu :deep(.el-sub-menu__title) {
  position: relative;
}
.sidebar-menu :deep(.el-sub-menu__title .el-sub-menu__icon-arrow) {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  transition: transform 0.3s;
}

.sidebar-menu :deep(.el-sub-menu.is-opened > .el-sub-menu__title .el-sub-menu__icon-arrow) {
  transform: translateY(-50%) rotate(-90deg);
}
</style>