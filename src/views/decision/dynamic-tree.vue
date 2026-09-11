<template>
  <div>
    <PageHeader title="动态处置决策树" desc="整合三轴数据与风险等级、稳性计算、姿态预警、极限工况判定，数字化推演处置路径，自动输出最优方案" />

    <el-row :gutter="20">
      <!-- 动态决策树 -->
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>动态处置决策树</span>
              <div class="header-right">
                <span class="play-status">{{ playing ? '自动推演中' : '已暂停' }}</span>
                <el-button :type="playing ? 'warning' : 'primary'" size="small" round @click="togglePlay">
                  {{ playing ? '暂停' : '播放' }}
                </el-button>
                <el-button size="small" round @click="resetSim">重置</el-button>
              </div>
            </div>
          </template>
          <svg viewBox="0 0 540 360" class="dt-svg">
            <defs>
              <marker id="dt-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#142864" />
              </marker>
            </defs>
            <!-- 连线 -->
            <line v-for="e in edges" :key="e.id" :x1="e.x1" :y1="e.y1" :x2="e.x2" :y2="e.y2"
              class="dt-edge" :class="{ active: step >= e.step }"
              :marker-end="step >= e.step ? 'url(#dt-arrow)' : ''" />
            <!-- 节点 -->
            <g v-for="n in nodes" :key="n.id">
              <rect :x="n.x - n.w/2" :y="n.y - 16" :width="n.w" height="32" rx="8"
                class="dt-node" :class="{ done: step >= n.step, current: step === n.step }" />
              <text :x="n.x" :y="n.y + 4" class="dt-text">{{ n.label }}</text>
            </g>
          </svg>
          <!-- 自动推演进度条 -->
          <div class="progress-bar" v-if="playing && step <= simSteps.length">
            <div class="progress-fill" :key="'prog-' + step" :style="{ animationDuration: intervalMs + 'ms' }"></div>
          </div>
        </el-card>
      </el-col>

      <!-- 分步推演 -->
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>分步推演 · 实时验算</template>
          <el-scrollbar height="300px" ref="scrollRef">
            <div v-for="(s, i) in simSteps" :key="i" class="sim-step"
              :class="{ active: step === i + 1, done: step > i + 1 }">
              <div class="sim-head">
                <span class="sim-idx">{{ i + 1 }}</span>
                <span class="sim-name">{{ s.name }}</span>
              </div>
              <div class="sim-body">{{ s.desc }}</div>
              <div class="sim-result" v-if="step > i + 1">
                <el-tag size="small" :type="s.ok ? 'success' : 'warning'">{{ s.ok ? '验算通过' : '指标偏移' }}</el-tag>
                <span>{{ s.verify }}</span>
              </div>
            </div>
          </el-scrollbar>
          <div class="sim-actions">
            <el-button size="small" :disabled="step <= 0" @click="step--">上一步</el-button>
            <el-button size="small" type="primary" :disabled="step >= simSteps.length" @click="step++">下一步</el-button>
          </div>
          <!-- 推演进度条 -->
          <div class="progress-bar" v-if="playing && step <= simSteps.length" style="margin-top: 8px">
            <div class="progress-fill" :key="'prog2-' + step" :style="{ animationDuration: intervalMs + 'ms' }"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 极限工况最优方案 -->
    <el-alert v-if="step >= simSteps.length" type="error" :closable="false" show-icon style="margin-top: 20px">
      <template #title>
        极限工况触发 — 系统已通过逻辑分析与对比验证，自动输出最优处置方案
      </template>
    </el-alert>
    <el-card v-if="step >= simSteps.length" shadow="never" style="margin-top: 12px">
      <template #header>最优处置方案（自动输出）</template>
      <el-row :gutter="20">
        <el-col :span="8" v-for="opt in optimal" :key="opt.label">
          <div class="opt-card" :class="{ best: opt.best }">
            <div class="opt-label">{{ opt.label }}</div>
            <div class="opt-desc">{{ opt.desc }}</div>
            <el-descriptions :column="1" size="small" border>
              <el-descriptions-item label="残余风险">{{ opt.risk }}</el-descriptions-item>
              <el-descriptions-item label="综合评分">{{ opt.score }}</el-descriptions-item>
            </el-descriptions>
            <el-tag v-if="opt.best" type="success" size="small" class="opt-tag">最优推荐</el-tag>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 处置记录追溯 -->
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>处置记录追溯</template>
      <el-table :data="records" border stripe size="small">
        <el-table-column prop="seq" label="序号" width="60" />
        <el-table-column prop="time" label="操作时间" width="100" />
        <el-table-column prop="action" label="处置操作" min-width="160" />
        <el-table-column prop="duration" label="操作时长" width="90" />
        <el-table-column prop="change" label="险情变化" min-width="160" />
        <el-table-column prop="advice" label="系统建议" min-width="160" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.ok ? 'success' : 'warning'">{{ row.ok ? '已执行' : '待执行' }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import PageHeader from '@/components/PageHeader.vue'

// 动态决策树节点
const nodes = [
  { id: 'root', label: '险情评估', x: 270, y: 30, w: 90, step: 0 },
  { id: 'risk', label: '风险等级判定', x: 120, y: 95, w: 110, step: 1 },
  { id: 'stab', label: '稳性计算', x: 270, y: 95, w: 90, step: 2 },
  { id: 'att', label: '姿态预警', x: 420, y: 95, w: 90, step: 3 },
  { id: 'lim', label: '极限工况判定', x: 270, y: 160, w: 110, step: 4 },
  { id: 'disp', label: '处置方案生成', x: 270, y: 225, w: 110, step: 5 },
  { id: 'exec', label: '执行与验算', x: 270, y: 290, w: 100, step: 6 }
]

// 连线
const edges = [
  { id: 'e1', x1: 270, y1: 46, x2: 120, y2: 79, step: 1 },
  { id: 'e2', x1: 270, y1: 46, x2: 270, y2: 79, step: 2 },
  { id: 'e3', x1: 270, y1: 46, x2: 420, y2: 79, step: 3 },
  { id: 'e4', x1: 120, y1: 111, x2: 225, y2: 144, step: 4 },
  { id: 'e5', x1: 270, y1: 111, x2: 270, y2: 144, step: 4 },
  { id: 'e6', x1: 420, y1: 111, x2: 315, y2: 144, step: 4 },
  { id: 'e7', x1: 270, y1: 176, x2: 270, y2: 209, step: 5 },
  { id: 'e8', x1: 270, y1: 241, x2: 270, y2: 274, step: 6 }
]

// 分步推演
const simSteps = [
  { name: '风险等级判定', desc: 'II舱进水速率 22 t/h，破口面积 0.3m²', ok: true, verify: '判定为 II级（高危险）' },
  { name: '稳性计算', desc: 'GM = 0.12m，稳性裕度低于安全阈值', ok: false, verify: 'GM < 0.15m，稳性不足' },
  { name: '姿态预警', desc: '横倾角 9.2°，吃水差 0.3m', ok: false, verify: '横倾超8°，姿态预警触发' },
  { name: '极限工况判定', desc: '动力冗余 28%，稳性持续下降', ok: false, verify: '逼近极限工况阈值' },
  { name: '处置方案生成', desc: '匹配三轴对策集，生成备选方案', ok: true, verify: '方案集已生成待比选' }
]

const step = ref(0)
const playing = ref(true)
const intervalMs = 2500
let timer = null

function startTimer() {
  stopTimer()
  timer = setInterval(() => {
    if (step.value < simSteps.length) {
      step.value++
    } else {
      // 推演完成后等待更久再循环
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

// 当前步骤变化时自动滚动到激活项
watch(step, async () => {
  await nextTick()
  const active = document.querySelector('.sim-step.active')
  if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
})

onMounted(() => { if (playing.value) startTimer() })
onUnmounted(() => stopTimer())

// 极限工况最优方案
const optimal = [
  { label: '方案A', desc: '堵漏+压载调控+高压气抗沉', risk: '中', score: 88, best: false },
  { label: '方案B', desc: '高压气抗沉+动力抗沉+紧急上浮', risk: '低', score: 94, best: true },
  { label: '方案C', desc: '封闭舱室+载荷转移+等待救援', risk: '较高', score: 72, best: false }
]

// 处置记录追溯
const records = [
  { seq: 1, time: 'T+02:00', action: '启动II舱排水泵', duration: '1min', change: '进水速率 22→18 t/h', advice: '继续排水，准备堵漏', ok: true },
  { seq: 2, time: 'T+05:00', action: '部署堵漏毯封堵破口', duration: '3min', change: '进水速率 18→8 t/h', advice: '破口已部分封堵', ok: true },
  { seq: 3, time: 'T+10:00', action: '压载水横向转移', duration: '2min', change: '横倾 9.2°→5.1°', advice: '姿态改善中', ok: true },
  { seq: 4, time: 'T+15:00', action: '启动高压气抗沉', duration: '持续', change: 'GM 0.12→0.18m', advice: '稳性恢复，维持抗沉', ok: true },
  { seq: 5, time: 'T+20:00', action: '动力系统切换冗余', duration: '1min', change: '动力冗余 28→35%', advice: '动力裕度恢复', ok: false }
]
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
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
.dt-svg {
  width: 100%;
  height: auto;
}
.dt-edge {
  stroke: #d0d0d0;
  stroke-width: 1.5;
}
.dt-edge.active {
  stroke: #142864;
  stroke-width: 2;
}
.dt-node {
  fill: #f5f7fa;
  stroke: #c0c4cc;
  stroke-width: 1.5;
  transition: all 0.3s;
}
.dt-node.done {
  fill: #e8f4ff;
  stroke: #142864;
}
.dt-node.current {
  fill: #142864;
  stroke: #142864;
}
.dt-text {
  font-size: 13px;
  fill: #909399;
  text-anchor: middle;
  font-weight: 600;
  transition: fill 0.3s;
}
/* done 状态：浅蓝底 + 深色字 */
:deep(.dt-node.done + .dt-text),
:deep(.dt-node.done ~ .dt-text) {
  fill: #142864;
}
/* current 状态：深蓝底 + 白色字 */
:deep(.dt-node.current + .dt-text),
:deep(.dt-node.current ~ .dt-text) {
  fill: #fff;
}
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
}
.sim-body {
  font-size: 13px;
  color: #606266;
  padding-left: 28px;
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
.sim-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.opt-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 14px;
  position: relative;
  transition: box-shadow 0.2s;
}
.opt-card.best {
  border-color: #67c23a;
  box-shadow: 0 2px 12px rgba(103, 194, 58, 0.2);
}
.opt-label {
  font-weight: 700;
  color: #142864;
  margin-bottom: 6px;
}
.opt-desc {
  font-size: 13px;
  color: #606266;
  margin-bottom: 10px;
}
.opt-tag {
  position: absolute;
  top: 8px;
  right: 8px;
}
</style>
