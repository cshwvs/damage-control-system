<template>
  <el-container class="app-wrapper">
    <el-aside width="240px" class="sidebar-container">
      <Sidebar />
    </el-aside>
    <el-container>
      <el-header class="navbar-container" height="60px">
        <Navbar />
      </el-header>
      <el-main class="main-container">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import Sidebar from './Sidebar.vue'
import Navbar from './Navbar.vue'
</script>

<style scoped>
.app-wrapper {
  height: 100vh;
}
.sidebar-container {
  background-color: #ffffff;
  border-right: 1px solid #e0e0e0;
}
.navbar-container {
  background-color: #142864;
  padding: 0;
}
.main-container {
  background-color: #F0F0F0;
  padding: 20px;
  overflow-y: auto;
}
</style>