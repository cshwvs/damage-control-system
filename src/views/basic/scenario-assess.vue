<template>
  <div>
    <PageHeader title="作业场景风险评估" desc="覆盖三大核心作业场景自动评估" />
    <el-card shadow="never">
      <el-form :inline="true">
        <el-form-item label="评估场景">
          <el-select v-model="scenario" style="width: 220px" @change="clearReport">
            <el-option label="出航物资装载风险评估" value="loading" />
            <el-option label="抗风浪风险评估" value="windwave" />
            <el-option label="舱室破损风险评估" value="damage" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="generateReport">生成评估报告</el-button>
        </el-form-item>
      </el-form>

      <div v-if="report" class="report-container">
        <el-card shadow="never">
          <template #header>评估报告</template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="场景名称">{{ report.scenarioName }}</el-descriptions-item>
            <el-descriptions-item label="评估时间">{{ report.time }}</el-descriptions-item>
            <el-descriptions-item label="风险等级">
              <el-tag :type="report.riskLevel.type">{{ report.riskLevel.label }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="综合评分">{{ report.score }}</el-descriptions-item>
            <el-descriptions-item label="主要风险">{{ report.mainRisk }}</el-descriptions-item>
            <el-descriptions-item label="建议措施" :span="2">{{ report.suggestion }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>
      <el-empty v-else description="请选择场景并生成报告" />
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'

const scenario = ref('loading')
const report = ref(null)

function clearReport() {
  report.value = null
}

function generateReport() {
  const now = new Date().toLocaleString()
  if (scenario.value === 'loading') {
    report.value = {
      scenarioName: '出航物资装载风险评估',
      time: now,
      riskLevel: { label: '低危险', type: 'success' },
      score: '85',
      mainRisk: '重心偏移',
      suggestion: '合理分布物资，保持重心在安全范围内。'
    }
  } else if (scenario.value === 'windwave') {
    report.value = {
      scenarioName: '抗风浪风险评估',
      time: now,
      riskLevel: { label: '中危险', type: 'warning' },
      score: '70',
      mainRisk: '风浪联合作用',
      suggestion: '降低航速，调整航向，必要时寻找避风锚地。'
    }
  } else {
    report.value = {
      scenarioName: '舱室破损风险评估',
      time: now,
      riskLevel: { label: '高危险', type: 'danger' },
      score: '45',
      mainRisk: '进水导致浮力损失',
      suggestion: '立即堵漏，启动排水，监控浮态和稳性。'
    }
  }
}
</script>

<style scoped>
.report-container {
  margin-top: 20px;
}
</style>