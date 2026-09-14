<template>
  <div class="sidebar">
    <div class="logo">
      <span>xx辅助决策系统</span>
    </div>
    <div class="menu-scroll-wrapper">
      <el-menu
        :default-active="activeMenu"
        router
        :collapse-transition="false"
        class="sidebar-menu"
        background-color="#ffffff"
        text-color="#333333"
        active-text-color="#409EFF"
      >
        <SidebarItem v-for="route in routes" :key="route.path" :item="route" :base-path="''" />
      </el-menu>
    </div>
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

/* 新增：滚动容器，独立于菜单 */
.menu-scroll-wrapper {
  flex: 1;
  overflow-y: scroll;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #b1b1b1 transparent;
  box-sizing: border-box;
}

.menu-scroll-wrapper::-webkit-scrollbar {
  width: 6px;
  background: transparent;
}
.menu-scroll-wrapper::-webkit-scrollbar-thumb {
  background-color: #b1b1b1;
  border-radius: 3px;
}
.menu-scroll-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

/* 菜单本身不再滚动，宽度完全固定 */
.sidebar-menu {
  border-right: none;
  padding: 8px 0;
  width: 100%;
  box-sizing: border-box;
}

/* 一级菜单和子菜单标题 */
.sidebar-menu :deep(.el-menu-item),
.sidebar-menu :deep(.el-sub-menu__title) {
  font-size: 16px !important;
  border-radius: 4px;
  margin: 4px 8px 4px 12px;
  width: auto;
  padding: 0 10px !important;
  height: 40px;
  line-height: 48px;
  display: flex;
  align-items: center;
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

/* 展开箭头：固定位置，不受影响 */
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

/* 彻底禁用子菜单展开动画和高度过渡 */
.sidebar-menu :deep(.el-menu--inline) {
  transition: none !important;
  animation: none !important;
}

.sidebar-menu :deep(.el-menu--inline .el-menu-item) {
  transition: none !important;
  animation: none !important;
  height: 40px;          /* 与一级菜单项保持一致 */
  line-height: 40px;     /* 固定行高，防止文字跳动 */
  display: flex;
  align-items: center;
}

/* 确保所有菜单项行高一致，避免基线变化 */
.sidebar-menu :deep(.el-menu-item),
.sidebar-menu :deep(.el-sub-menu__title) {
  line-height: 40px;
  height: 40px;
}
</style>