<template>
  <div>
    <PageHeader title="破损进水险情推演" desc="以深海三维视窗推演破损进水全过程，按损害发展→人员损害管制→损害更新动态映射艇体姿态并提示薄弱环节" />

    <!-- 深海三维推演视窗：xxx模型，可 360° 查看、缩放、移动 -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>破损进水三维动态推演</span>
          <div class="header-right">
            <span class="play-status">推演进度 {{ step }} / {{ simSteps.length }} · {{ playing ? '推演中' : '已暂停' }}</span>
            <el-button size="small" :disabled="step <= 0" @click="step--">上一步</el-button>
            <el-button size="small" type="primary" :disabled="step >= simSteps.length" @click="step++">下一步</el-button>
            <el-button :type="playing ? 'warning' : 'primary'" size="small" round @click="togglePlay">
              {{ playing ? '暂停' : '播放' }}
            </el-button>
            <el-button size="small" round @click="resetSim">重置</el-button>
          </div>
        </div>
      </template>

      <SubmarineScene
        title="xxx · 破损进水推演"
        :caption="sceneCaption"
        :height="560"
        :list-angle="currentRoll"
        :trim-angle="currentPitch"
        :depth="260"
        :bubble-count="110"
      />

      <div class="progress-bar" v-if="playing">
        <div class="progress-fill" :key="'prog-' + step" :style="{ animationDuration: intervalMs + 'ms' }"></div>
      </div>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 推演步骤详情 -->
      <el-col :span="10">
        <el-card shadow="never" class="full-card">
          <template #header>分步推演详情</template>
          <el-scrollbar height="360px" ref="scrollRef">
            <div v-for="(s, i) in simSteps" :key="i" class="sim-step"
              :class="{ active: step === i + 1, done: step > i + 1 }">
              <div class="sim-head">
                <span class="sim-idx">{{ i + 1 }}</span>
                <span class="sim-name">{{ s.name }}</span>
                <el-tag v-if="s.weak" type="danger" size="small">薄弱</el-tag>
              </div>
              <div class="sim-body">{{ s.desc }}</div>
              <div class="sim-pose">
                <span>横倾 {{ s.roll.toFixed(1) }}°</span>
                <span>纵倾 {{ s.pitch.toFixed(1) }}°</span>
              </div>
              <div class="sim-result" v-if="step > i + 1">
                <el-tag size="small" :type="s.improved ? 'success' : 'warning'">
                  {{ s.improved ? '态势改善' : '态势恶化' }}
                </el-tag>
                <span class="sim-verify">{{ s.verify }}</span>
              </div>
            </div>
          </el-scrollbar>
        </el-card>
      </el-col>

      <!-- 推演结论 -->
      <el-col :span="14">
        <el-card shadow="never" class="full-card">
          <template #header>推演结论</template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="险情场景">舱室破损进水（II舱）</el-descriptions-item>
            <el-descriptions-item label="推演步数">{{ simSteps.length }} 步</el-descriptions-item>
            <el-descriptions-item label="薄弱环节">{{ weakPoints.length }} 项</el-descriptions-item>
            <el-descriptions-item label="最终态势">
              <el-tag type="success" size="small">险情可控</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前步骤">
              {{ step > 0 ? `${step}. ${simSteps[step - 1].name}` : '推演未启动' }}
            </el-descriptions-item>
            <el-descriptions-item label="当前姿态">
              横倾 {{ currentRoll.toFixed(1) }}° / 纵倾 {{ currentPitch.toFixed(1) }}°
            </el-descriptions-item>
            <el-descriptions-item label="关键处置" :span="2">
              堵漏+排水+压载转移+高压气抗沉 组合方案有效控制险情，但高压气资源消耗过快、协同响应偏慢为薄弱环节
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <!-- 处置薄弱环节汇总 -->
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>处置薄弱环节汇总</span>
          <el-tag type="danger" size="small" effect="dark">{{ weakPoints.length }} 项薄弱</el-tag>
        </div>
      </template>
      <el-table :data="weakPoints" border stripe>
        <el-table-column prop="stage" label="推演阶段" width="120" />
        <el-table-column prop="node" label="薄弱节点" width="160" />
        <el-table-column prop="issue" label="问题描述" min-width="220" />
        <el-table-column prop="impact" label="影响分析" min-width="200" />
        <el-table-column prop="suggest" label="改进建议" min-width="200" />
        <el-table-column label="优先级" width="90">
          <template #default="{ row }">
            <el-tag :type="row.priorityType" size="small">{{ row.priorityText }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import SubmarineScene from '@/components/SubmarineScene.vue'

// 三阶段推演步骤：损害发展(1-3) / 人员损害管制(4-6) / 损害更新(7-9)
// roll/pitch 为该步骤对应的艇体横倾与纵倾角（°），驱动三维视窗中的艇体姿态
const simSteps = [
  { name: '破损进水起始', desc: 'II舱破损直径 0.3m，进水速率 22 t/h', weak: false, improved: false, verify: '险情触发', roll: 2.4, pitch: 0.6 },
  { name: '舱室持续进水', desc: '横倾扩大至 9.2°，吃水差 0.3m', weak: false, improved: false, verify: '姿态预警', roll: 6.5, pitch: 1.4 },
  { name: '稳性下降', desc: 'GM 降至 0.12m，低于安全下限', weak: true, improved: false, verify: '稳性不足', roll: 9.2, pitch: 2.2 },
  { name: '堵漏操作', desc: '部署堵漏毯，3 min 完成封堵', weak: false, improved: true, verify: '进水减缓', roll: 8.4, pitch: 2.0 },
  { name: '排水启动', desc: '启动排水泵，排水量 85 t/h', weak: false, improved: true, verify: '水位下降', roll: 7.0, pitch: 1.6 },
  { name: '压载+抗沉', desc: '压载转移+高压气抗沉，气源消耗快', weak: true, improved: true, verify: '稳性部分恢复', roll: 6.2, pitch: 1.2 },
  { name: '进水减缓', desc: '进水速率降至 8 t/h', weak: false, improved: true, verify: '可控', roll: 5.6, pitch: 0.9 },
  { name: '横倾改善', desc: '横倾恢复至 5.1°', weak: false, improved: true, verify: '姿态改善', roll: 5.1, pitch: 0.6 },
  { name: '稳性恢复', desc: 'GM 恢复至 0.18m，气源仅剩 40%', weak: true, improved: true, verify: '稳性达标但气源不足', roll: 3.8, pitch: 0.2 }
]

const step = ref(0)
const playing = ref(true)
const intervalMs = 2500
const scrollRef = ref(null)
let timer = null

const currentStep = computed(() => (step.value > 0 ? simSteps[step.value - 1] : null))
const currentRoll = computed(() => (currentStep.value ? currentStep.value.roll : 0))
const currentPitch = computed(() => (currentStep.value ? currentStep.value.pitch : 0))
const sceneCaption = computed(() =>
  currentStep.value
    ? `推演第 ${step.value} 步 · ${currentStep.value.name}：${currentStep.value.desc}`
    : '推演待启动：艇体处于初始平衡状态，点击“播放”开始破损进水险情推演'
)

function startTimer() {
  stopTimer()
  timer = setInterval(() => {
    if (step.value < simSteps.length) {
      step.value++
    } else {
      stopTimer()
      timer = setTimeout(() => {
        step.value = 0
        if (playing.value) startTimer()
      }, intervalMs * 2)
    }
  }, intervalMs)
}
function stopTimer() {
  if (timer) { clearInterval(timer); clearTimeout(timer); timer = null }
}
function togglePlay() {
  playing.value = !playing.value
  if (playing.value) startTimer()
  else stopTimer()
}
function resetSim() {
  step.value = 0
  playing.value = false
  stopTimer()
}

watch(step, () => {
  // 只在“分步推演详情”面板内部滚动到当前条目，避免整页滚动遮住上方三维视窗
  requestAnimationFrame(() => {
    const bar = scrollRef.value
    const wrap = bar && bar.wrapRef
    if (!wrap) return
    const active = wrap.querySelector('.sim-step.active')
    if (!active) return
    const delta = active.getBoundingClientRect().top - wrap.getBoundingClientRect().top
    bar.setScrollTop(Math.max(0, wrap.scrollTop + delta - 8))
  })
})

onMounted(() => { if (playing.value) startTimer() })
onUnmounted(() => stopTimer())

// 处置薄弱环节汇总
const weakPoints = [
  {
    stage: '损害发展', node: '稳性下降', issue: 'GM 降至 0.12m，低于安全下限 0.15m',
    impact: '稳性不足导致姿态失控风险增加', suggest: '提前介入高压气抗沉，避免稳性持续下降',
    priorityType: 'danger', priorityText: '高'
  },
  {
    stage: '人员管制', node: '压载+抗沉', issue: '高压气消耗过快，气源剩余 40%',
    impact: '后续抗沉能力受限，可能无法维持稳性', suggest: '优化高压气使用策略，启用备用气源',
    priorityType: 'danger', priorityText: '高'
  },
  {
    stage: '损害更新', node: '稳性恢复', issue: '稳性恢复但气源储备不足',
    impact: '若险情反复，抗沉能力受限', suggest: '补充气源储备，建立气源监控预警',
    priorityType: 'warning', priorityText: '中'
  },
  {
    stage: '人员管制', node: '协同响应', issue: '协同作业耗时 6 min，超阈值 5 min',
    impact: '处置时序延误，险情控制效率降低', suggest: '强化岗位协同演练，优化处置流程',
    priorityType: 'warning', priorityText: '中'
  }
]
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.play-status {
  font-size: 12px;
  color: #909399;
}
.progress-bar {
  height: 3px;
  background: #e8e8e8;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 12px;
}
.progress-fill {
  height: 100%;
  background: #142864;
  width: 0;
  animation: progressGrow linear forwards;
}
@keyframes progressGrow {
  from { width: 0; }
  to { width: 100%; }
}
.full-card {
  height: 100%;
}
/* 分步推演 */
.sim-step {
  padding: 10px 12px;
  border-radius: 6px;
  margin-bottom: 10px;
  background: #f5f7fa;
  transition: all 0.25s;
}
.sim-step.active {
  background: #e8f4ff;
  border-left: 3px solid #142864;
}
.sim-step.done {
  opacity: 0.7;
}
.sim-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.sim-idx {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #d0d0d0;
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.sim-step.active .sim-idx {
  background: #142864;
}
.sim-name {
  font-weight: 600;
  color: #303133;
  font-size: 13px;
}
.sim-body {
  font-size: 12px;
  color: #606266;
  padding-left: 28px;
}
.sim-pose {
  display: flex;
  gap: 14px;
  padding-left: 28px;
  margin-top: 4px;
  font-size: 12px;
  color: #142864;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.sim-result {
  padding-left: 28px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #909399;
}
.sim-verify {
  font-size: 12px;
}
</style>
