<template>
  <el-sub-menu v-if="hasChildren" :index="fullPath">
    <template #title>
      <el-icon v-if="item.meta?.icon">
        <component :is="item.meta.icon" />
      </el-icon>
      <span>{{ item.meta.title }}</span>
    </template>
    <SidebarItem
      v-for="child in item.children"
      :key="child.path"
      :item="child"
      :base-path="fullPath"
    />
  </el-sub-menu>
  <el-menu-item v-else :index="fullPath">
    <el-icon v-if="item.meta?.icon">
      <component :is="item.meta.icon" />
    </el-icon>
    <span>{{ item.meta.title }}</span>
  </el-menu-item>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: { type: Object, required: true },
  basePath: { type: String, default: '' }
})

const hasChildren = computed(() => props.item.children && props.item.children.length > 0)

const fullPath = computed(() => {
  // 将 basePath 和 item.path 拼接为完整路径，去除重复斜杠
  if (!props.basePath) {
    return props.item.path.startsWith('/') ? props.item.path : `/${props.item.path}`
  }
  const base = props.basePath.endsWith('/') ? props.basePath.slice(0, -1) : props.basePath
  const child = props.item.path.startsWith('/') ? props.item.path : `/${props.item.path}`
  return `${base}${child}`.replace(/\/+/g, '/')
})
</script>

<style scoped>
/* 二级菜单缩进调整 */
:deep(.el-sub-menu .el-menu-item) {
  padding-left: 36px !important; /* 根据需要调整 */
}
/* 一级菜单图标对齐 */
:deep(.el-menu-item .el-icon) {
  margin-right: 8px;
}
</style>