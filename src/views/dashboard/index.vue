<template>
  <div>
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
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>系统简介</template>
      <p>xx辅助决策系统基于生命力理论，集成安全计算评估、风险预警、极限工况研判、动态处置决策、智能推理等功能。</p>
    </el-card>
  </div>
</template>

<script setup>
// 可以在此加载统计数据
</script>

<style scoped>
.stat-card {
  text-align: center;
}
</style>