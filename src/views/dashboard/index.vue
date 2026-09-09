<template>
  <div>
    <!-- 顶部统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <el-statistic title="今日预警" :value="5" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <el-statistic title="待处置险情" :value="2" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <el-statistic title="知识图谱节点" :value="128" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <el-statistic title="推理规则数" :value="36" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 系统简介 -->
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>系统简介</template>
      <p>损管辅助决策系统基于生命力理论，集成安全计算评估、风险预警、极限工况研判、动态处置决策、智能推理等功能。</p>
    </el-card>

    <!-- Unity 3D 可视化区域 -->
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>三维潜艇可视化</span>
          <span style="font-size: 12px; color: #909399">WebGL 交互 · 实时三维态势</span>
        </div>
      </template>
      <div class="unity-container">
        <iframe
          src="/unity-webgl/index.html"
          class="unity-frame"
          frameborder="0"
          allowfullscreen
          title="Unity 3D 视图"
        ></iframe>
      </div>
    </el-card>
  </div>
</template>

<script setup>
// 目前无需额外逻辑，统计卡片数据为静态示例
</script>

<style scoped>
.stat-card {
  text-align: center;
}
.unity-container {
  width: 100%;
  height: 640px;
  min-height: 500px;
  background: #000;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}
.unity-frame {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

@media (max-width: 768px) {
  .unity-container {
    height: 480px;
  }
}
</style>