<template>
  <div>
    <PageHeader title="安全计算模型引擎" desc="集成物资装载等作业安全计算模块、抗风浪计算安全模块、破损抗沉计算安全模块三类标准化模型，支持独立调用与组合运算，计算结果实时展示、历史回溯" />
    <el-card shadow="never">
      <el-form :inline="true">
        <el-form-item label="计算场景">
          <el-select v-model="scenario" style="width: 220px" @change="resetResult">
            <el-option label="出航物资装载计算" value="loading" />
            <el-option label="抗风浪计算" value="windwave" />
            <el-option label="破损抗沉计算" value="damage" />
          </el-select>
        </el-form-item>
      </el-form>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="never" class="input-card">
            <template #header>输入参数</template>
            <!-- 动态表单：根据场景显示不同输入 -->
            <el-form label-width="120px">
              <template v-if="scenario === 'loading'">
                <el-form-item label="物资总重量"><el-input-number v-model="params.totalWeight" :min="0" /></el-form-item>
                <el-form-item label="载体重心高度"><el-input-number v-model="params.cogHeight" :min="0" /></el-form-item>
              </template>
              <template v-else-if="scenario === 'windwave'">
                <el-form-item label="风速"><el-input-number v-model="params.windSpeed" :min="0" /></el-form-item>
                <el-form-item label="波高"><el-input-number v-model="params.waveHeight" :min="0" /></el-form-item>
                <el-form-item label="受风面积"><el-input-number v-model="params.windArea" :min="0" /></el-form-item>
              </template>
              <template v-else>
                <el-form-item label="破损舱室数"><el-input-number v-model="params.breachCount" :min="1" /></el-form-item>
                <el-form-item label="破损直径"><el-input-number v-model="params.breachDiameter" :min="0" /></el-form-item>
              </template>
              <el-form-item>
                <el-button type="primary" @click="calculate">开始计算</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card shadow="never" class="result-card">
            <template #header>计算结果</template>
            <div v-if="result" class="result-content">
              <el-descriptions :column="1" border>
                <el-descriptions-item label="安全等级">
                  <el-tag :type="result.riskLevel.type">{{ result.riskLevel.label }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="判定指标">{{ result.indicator }}</el-descriptions-item>
                <el-descriptions-item label="指标值">{{ result.value }}</el-descriptions-item>
                <el-descriptions-item label="结论">{{ result.conclusion }}</el-descriptions-item>
              </el-descriptions>
            </div>
            <el-empty v-else description="请选择场景并点击计算" />
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import PageHeader from '@/components/PageHeader.vue'

const scenario = ref('loading')
const params = reactive({
  totalWeight: 1000,
  cogHeight: 5,
  windSpeed: 20,
  waveHeight: 2,
  windArea: 100,
  breachCount: 1,
  breachDiameter: 0.5
})

const result = ref(null)

function resetResult() {
  result.value = null
}

function calculate() {
  // 模拟计算逻辑
  let riskLevel = { label: '低危险', type: 'success' }
  let indicator = ''
  let value = ''
  let conclusion = ''

  if (scenario.value === 'loading') {
    const ratio = params.totalWeight / 1500
    indicator = '装载率'
    value = (ratio * 100).toFixed(1) + '%'
    if (ratio < 0.8) {
      riskLevel = { label: '低危险', type: 'success' }
      conclusion = '物资装载合理，重心变化在安全范围内。'
    } else if (ratio < 0.95) {
      riskLevel = { label: '低危险', type: 'warning' }
      conclusion = '接近满载，需注意重心高度。'
    } else {
      riskLevel = { label: '高危险', type: 'danger' }
      conclusion = '超载风险，立即调整装载方案。'
    }
  } else if (scenario.value === 'windwave') {
    const windForce = 0.5 * 1.2 * params.windSpeed ** 2 * params.windArea
    indicator = '风载荷'
    value = windForce.toFixed(0) + ' N'
    if (windForce < 5000) {
      riskLevel = { label: '低危险', type: 'success' }
      conclusion = '抗风能力满足要求。'
    } else if (windForce < 10000) {
      riskLevel = { label: '低危险', type: 'warning' }
      conclusion = '风速较高，建议降低航速或调整航向。'
    } else {
      riskLevel = { label: '高危险', type: 'danger' }
      conclusion = '风载荷过大，立即采取避风措施。'
    }
  } else {
    const inflow = params.breachCount * Math.PI * (params.breachDiameter / 2) ** 2
    indicator = '进水量估算'
    value = inflow.toFixed(2) + ' m³/s'
    if (inflow < 0.5) {
      riskLevel = { label: '低危险', type: 'warning' }
      conclusion = '破损较小，及时堵漏可控制。'
    } else {
      riskLevel = { label: '极限危险', type: 'danger' }
      conclusion = '大量进水，立即启动应急抗沉程序。'
    }
  }

  result.value = { riskLevel, indicator, value, conclusion }
}
</script>

<style scoped>
.input-card, .result-card {
  border-radius: 4px;
}
.result-content {
  padding: 10px;
}
</style>