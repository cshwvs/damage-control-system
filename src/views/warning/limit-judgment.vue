<template>
  <div>
    <PageHeader title="极限险情判定" desc="明确典型评估维度下的危险等级判定阈值：浮态可控（上浮、下潜姿态是否可控）、稳性是否安全、其他因素可靠判定（高压气资源等），为抗沉决策提供极限工况边界" />

    <!-- 综合判定结果 -->
    <el-card shadow="never" class="verdict-card">
      <template #header>
        <div class="card-header">
          <span>综合极限险情判定</span>
          <div class="header-right">
            <span class="verdict-time">判定时间：{{ verdict.time }}</span>
            <el-button type="primary" size="small" @click="recalc">重新判定</el-button>
          </div>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="verdict-summary" :class="verdict.levelClass">
            <div class="vs-label">综合危险等级</div>
            <div class="vs-value">{{ verdict.levelText }}</div>
            <div class="vs-desc">{{ verdict.desc }}</div>
          </div>
        </el-col>
        <el-col :span="16">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="浮态判定">
              <el-tag :type="floatStatus.type" size="small">{{ floatStatus.text }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="稳性判定">
              <el-tag :type="stabilityStatus.type" size="small">{{ stabilityStatus.text }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="高压气资源">
              <el-tag :type="gasStatus.type" size="small">{{ gasStatus.text }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="动力电力保障">
              <el-tag :type="powerStatus.type" size="small">{{ powerStatus.text }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="上浮姿态可控性" :span="2">
              <el-tag :type="surfacingStatus.type" size="small">{{ surfacingStatus.text }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-col>
      </el-row>
    </el-card>

    <!-- 三大判定准则 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 浮态可控判定 -->
      <el-col :span="8">
        <el-card shadow="never" class="criterion-card">
          <template #header>
            <div class="card-header">
              <span>浮态可控判定</span>
              <el-tag :type="floatStatus.type" size="small" effect="dark">{{ floatStatus.text }}</el-tag>
            </div>
          </template>
          <div v-for="item in floatCriteria" :key="item.name" class="criterion-item">
            <div class="ci-head">
              <span class="ci-name">{{ item.name }}</span>
              <el-tag :type="item.pass ? 'success' : 'danger'" size="small">
                {{ item.pass ? '达标' : '超限' }}
              </el-tag>
            </div>
            <div class="ci-row">
              <span class="ci-label">当前值</span>
              <span class="ci-value" :class="{ fail: !item.pass }">{{ item.current }}</span>
            </div>
            <div class="ci-row">
              <span class="ci-label">临界范围</span>
              <span class="ci-threshold">{{ item.range }}</span>
            </div>
            <div class="ci-row">
              <span class="ci-label">判定依据</span>
              <span class="ci-basis">{{ item.basis }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 稳性达标判定 -->
      <el-col :span="8">
        <el-card shadow="never" class="criterion-card">
          <template #header>
            <div class="card-header">
              <span>稳性达标判定</span>
              <el-tag :type="stabilityStatus.type" size="small" effect="dark">{{ stabilityStatus.text }}</el-tag>
            </div>
          </template>
          <div v-for="item in stabilityCriteria" :key="item.name" class="criterion-item">
            <div class="ci-head">
              <span class="ci-name">{{ item.name }}</span>
              <el-tag :type="item.pass ? 'success' : 'danger'" size="small">
                {{ item.pass ? '达标' : '超限' }}
              </el-tag>
            </div>
            <div class="ci-row">
              <span class="ci-label">当前值</span>
              <span class="ci-value" :class="{ fail: !item.pass }">{{ item.current }}</span>
            </div>
            <div class="ci-row">
              <span class="ci-label">安全下限</span>
              <span class="ci-threshold">{{ item.range }}</span>
            </div>
            <div class="ci-row">
              <span class="ci-label">判定依据</span>
              <span class="ci-basis">{{ item.basis }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 其他因素可靠判定 -->
      <el-col :span="8">
        <el-card shadow="never" class="criterion-card">
          <template #header>
            <div class="card-header">
              <span>其他因素可靠判定</span>
              <el-tag :type="otherStatus.type" size="small" effect="dark">{{ otherStatus.text }}</el-tag>
            </div>
          </template>
          <div v-for="item in otherCriteria" :key="item.name" class="criterion-item">
            <div class="ci-head">
              <span class="ci-name">{{ item.name }}</span>
              <el-tag :type="item.pass ? 'success' : 'danger'" size="small">
                {{ item.pass ? '达标' : '超限' }}
              </el-tag>
            </div>
            <div class="ci-row">
              <span class="ci-label">当前值</span>
              <span class="ci-value" :class="{ fail: !item.pass }">{{ item.current }}</span>
            </div>
            <div class="ci-row">
              <span class="ci-label">安全下限</span>
              <span class="ci-threshold">{{ item.range }}</span>
            </div>
            <div class="ci-row">
              <span class="ci-label">判定依据</span>
              <span class="ci-basis">{{ item.basis }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 姿态可控性评估 -->
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>上浮 / 下潜姿态可控性评估</template>
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="attitude-block">
            <h4 class="ab-title">上浮姿态可控性</h4>
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="上浮速率">{{ attitude.surfacing.rate }} m/s</el-descriptions-item>
              <el-descriptions-item label="纵倾角">{{ attitude.surfacing.trim }}°</el-descriptions-item>
              <el-descriptions-item label="浮力裕度">{{ attitude.surfacing.margin }}%</el-descriptions-item>
              <el-descriptions-item label="可控结论">
                <el-tag :type="attitude.surfacing.controllable ? 'success' : 'danger'" size="small">
                  {{ attitude.surfacing.controllable ? '姿态可控' : '姿态失控风险' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="attitude-block">
            <h4 class="ab-title">下潜姿态可控性</h4>
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="下潜速率">{{ attitude.diving.rate }} m/s</el-descriptions-item>
              <el-descriptions-item label="纵倾角">{{ attitude.diving.trim }}°</el-descriptions-item>
              <el-descriptions-item label="浮力裕度">{{ attitude.diving.margin }}%</el-descriptions-item>
              <el-descriptions-item label="可控结论">
                <el-tag :type="attitude.diving.controllable ? 'success' : 'danger'" size="small">
                  {{ attitude.diving.controllable ? '姿态可控' : '姿态失控风险' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 处置建议 -->
    <el-alert
      :title="verdict.advice"
      :type="verdict.alertType"
      :closable="false"
      show-icon
      style="margin-top: 20px"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import PageHeader from '@/components/PageHeader.vue'

// 浮态可控判定项
const floatCriteria = ref([
  { name: '浮力裕度', current: '108%', range: '≥100% 可控 / <95% 失控', pass: true, basis: '储备浮力/排水量比值，F>1.2为安全' },
  { name: '浮心横向偏移', current: '0.35 m', range: '≤0.3 m 可控 / >0.5 m 失控', pass: false, basis: '浮心横向偏移影响横倾平衡' },
  { name: '浮心纵向偏移', current: '0.18 m', range: '≤0.2 m 可控 / >0.4 m 失控', pass: true, basis: '浮心纵向偏移影响纵倾平衡' },
  { name: '吃水变化', current: '+0.3 m', range: '±0.5 m 可控 / >0.8 m 失控', pass: true, basis: '吃水变化反映进水与浮力平衡' }
])

// 稳性达标判定项
const stabilityCriteria = ref([
  { name: '初稳性高 GM', current: '0.12 m', range: '≥0.15 m 达标 / ≤0.1 m 极限', pass: false, basis: '初稳性高，xx核心稳性指标' },
  { name: '最大稳性力臂', current: '0.28 m', range: '≥0.25 m 达标 / <0.2 m 极限', pass: true, basis: '稳性曲线最大力臂' },
  { name: '稳性消失角', current: '55°', range: '≥50° 达标 / <40° 极限', pass: true, basis: '稳性曲线与横轴交点' },
  { name: '稳性曲线下面积', current: '0.15 m·rad', range: '≥0.12 m·rad 达标 / <0.08 m·rad 极限', pass: true, basis: '动稳性积分面积' }
])

// 其他因素可靠判定项
const otherCriteria = ref([
  { name: '高压气资源', current: '18 MPa', range: '≥20 MPa 可靠 / <15 MPa 不可靠', pass: false, basis: '高压气资源支撑抗沉与上浮' },
  { name: '动力冗余', current: '35%', range: '≥30% 可靠 / <15% 不可靠', pass: true, basis: '动力系统冗余度保障机动能力' },
  { name: '电力保障', current: '92%', range: '≥80% 可靠 / <60% 不可靠', pass: true, basis: '电力系统供电能力' },
  { name: '排水能力', current: '85 t/h', range: '≥80 t/h 可靠 / <50 t/h 不可靠', pass: true, basis: '排水系统排水量' }
])

// 姿态可控性
const attitude = ref({
  surfacing: { rate: 0.6, trim: 1.2, margin: 65, controllable: true },
  diving: { rate: 0.45, trim: 0.8, margin: 55, controllable: false }
})

// 各维度状态
const floatStatus = computed(() => {
  const fail = floatCriteria.value.some(i => !i.pass)
  return fail ? { type: 'danger', text: '浮态超限' } : { type: 'success', text: '浮态可控' }
})
const stabilityStatus = computed(() => {
  const fail = stabilityCriteria.value.some(i => !i.pass)
  return fail ? { type: 'danger', text: '稳性不足' } : { type: 'success', text: '稳性达标' }
})
const otherStatus = computed(() => {
  const fail = otherCriteria.value.some(i => !i.pass)
  return fail ? { type: 'warning', text: '部分不可靠' } : { type: 'success', text: '其他可靠' }
})
const gasStatus = computed(() => otherCriteria.value[0].pass ? { type: 'success', text: '气源充足' } : { type: 'danger', text: '气源不足' })
const powerStatus = computed(() => otherCriteria.value[1].pass && otherCriteria.value[2].pass ? { type: 'success', text: '动力电力可靠' } : { type: 'warning', text: '动力电力预警' })
const surfacingStatus = computed(() => attitude.value.surfacing.controllable ? { type: 'success', text: '上浮可控' } : { type: 'danger', text: '上浮失控' })

// 综合判定
const verdict = computed(() => {
  const allPass = !floatCriteria.value.some(i => !i.pass) &&
                  !stabilityCriteria.value.some(i => !i.pass) &&
                  !otherCriteria.value.some(i => !i.pass)
  const time = '2026-09-11 08:35:00'
  if (allPass) {
    return {
      time,
      levelText: 'I 级 · 低危险',
      levelClass: 'low',
      desc: '浮态可控、稳性达标、其他因素可靠，未达极限工况。',
      advice: '当前状态安全，保持监控，确保各项指标在阈值范围内。',
      alertType: 'success'
    }
  }
  return {
    time,
    levelText: 'II 级 · 高危险',
    levelClass: 'high',
    desc: '存在指标超限，逼近极限工况，需立即处置防止恶化。',
    advice: '立即启动应急处置：1) 堵漏+排水控制浮态；2) 高压气抗沉恢复稳性；3) 检查高压气资源与动力冗余；4) 评估上浮/下潜姿态可控性。',
    alertType: 'error'
  }
})

function recalc() {
  // 重新判定（模拟刷新）
}
</script>

<style scoped>
.verdict-card {
  margin-bottom: 0;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.verdict-time {
  font-size: 12px;
  color: #909399;
}
.verdict-summary {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  height: 100%;
}
.verdict-summary.high {
  border-color: #c70000;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
}
.verdict-summary.low {
  border-color: #67c23a;
  background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
}
.vs-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}
.vs-value {
  font-size: 26px;
  font-weight: 700;
  color: #142864;
  margin-bottom: 10px;
}
.verdict-summary.high .vs-value {
  color: #c70000;
}
.verdict-summary.low .vs-value {
  color: #67c23a;
}
.vs-desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
.criterion-card {
  height: 100%;
}
.criterion-item {
  padding: 10px 0;
  border-bottom: 1px dashed #e0e0e0;
}
.criterion-item:last-child {
  border-bottom: none;
}
.ci-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.ci-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}
.ci-row {
  display: flex;
  font-size: 12px;
  margin-bottom: 4px;
}
.ci-label {
  width: 70px;
  color: #909399;
  flex-shrink: 0;
}
.ci-value {
  color: #67c23a;
  font-weight: 600;
}
.ci-value.fail {
  color: #c70000;
}
.ci-threshold {
  color: #606266;
}
.ci-basis {
  color: #909399;
  line-height: 1.4;
}
.attitude-block {
  padding: 10px;
}
.ab-title {
  margin: 0 0 12px 0;
  color: #142864;
  font-size: 15px;
}
</style>
