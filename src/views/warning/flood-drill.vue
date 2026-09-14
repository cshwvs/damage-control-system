<template>
  <div>
    <PageHeader title="破损进水险情推演" desc="构建损害发展→人员损害管制→损害更新动态模型，图形化推演处置过程并提示薄弱环节" />

    <el-row :gutter="20">
      <!-- 动态推演树 -->
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>损害-管制-更新动态推演</span>
              <div class="header-right">
                <span class="play-status">{{ playing ? '推演中' : '已暂停' }}</span>
                <el-button :type="playing ? 'warning' : 'primary'" size="small" round @click="togglePlay">
                  {{ playing ? '暂停' : '播放' }}
                </el-button>
                <el-button size="small" round @click="resetSim">重置</el-button>
              </div>
            </div>
          </template>

          <svg viewBox="0 0 720 460" class="drill-svg">
            <defs>
              <marker id="drill-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#142864" />
              </marker>
              <marker id="drill-arrow-warn" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#e6a23c" />
              </marker>
              <marker id="drill-arrow-danger" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#c70000" />
              </marker>
            </defs>

            <!-- 三阶段标题 -->
            <text x="120" y="20" class="phase-title phase-damage">损害发展</text>
            <text x="360" y="20" class="phase-title phase-control">人员损害管制</text>
            <text x="600" y="20" class="phase-title phase-update">损害更新</text>

            <!-- 阶段分隔虚线 -->
            <line x1="240" y1="30" x2="240" y2="440" class="phase-divider" />
            <line x1="480" y1="30" x2="480" y2="440" class="phase-divider" />

            <!-- 损害发展节点 -->
            <g v-for="(n, i) in damageNodes" :key="'d' + i">
              <rect
                :x="n.x - 90" :y="n.y - 18" width="180" height="36" rx="8"
                class="drill-node"
                :class="{ done: step > n.step, current: step === n.step, weak: n.weak }"
              />
              <text :x="n.x" :y="n.y - 2" class="drill-text">{{ n.label }}</text>
              <text :x="n.x" :y="n.y + 12" class="drill-sub">{{ n.value }}</text>
              <text v-if="n.weak && step >= n.step" :x="n.x + 100" :y="n.y - 8" class="weak-mark">⚠</text>
            </g>

            <!-- 人员管制节点 -->
            <g v-for="(n, i) in controlNodes" :key="'c' + i">
              <rect
                :x="n.x - 90" :y="n.y - 18" width="180" height="36" rx="8"
                class="drill-node control"
                :class="{ done: step > n.step, current: step === n.step, weak: n.weak }"
              />
              <text :x="n.x" :y="n.y - 2" class="drill-text">{{ n.label }}</text>
              <text :x="n.x" :y="n.y + 12" class="drill-sub">{{ n.value }}</text>
              <text v-if="n.weak && step >= n.step" :x="n.x + 100" :y="n.y - 8" class="weak-mark">⚠</text>
            </g>

            <!-- 损害更新节点 -->
            <g v-for="(n, i) in updateNodes" :key="'u' + i">
              <rect
                :x="n.x - 90" :y="n.y - 18" width="180" height="36" rx="8"
                class="drill-node update"
                :class="{ done: step > n.step, current: step === n.step, weak: n.weak }"
              />
              <text :x="n.x" :y="n.y - 2" class="drill-text">{{ n.label }}</text>
              <text :x="n.x" :y="n.y + 12" class="drill-sub">{{ n.value }}</text>
              <text v-if="n.weak && step >= n.step" :x="n.x + 100" :y="n.y - 8" class="weak-mark">⚠</text>
            </g>

            <!-- 连线：损害发展内部 -->
            <line v-for="(e, i) in damageEdges" :key="'de' + i"
              :x1="e.x1" :y1="e.y1" :x2="e.x2" :y2="e.y2"
              class="drill-edge"
              :class="{ active: step >= e.step }"
              :marker-end="step >= e.step ? 'url(#drill-arrow)' : ''"
            />
            <!-- 连线：损害→管制 -->
            <line v-for="(e, i) in crossEdges" :key="'ce' + i"
              :x1="e.x1" :y1="e.y1" :x2="e.x2" :y2="e.y2"
              class="drill-edge cross"
              :class="{ active: step >= e.step }"
              :marker-end="step >= e.step ? (e.weak ? 'url(#drill-arrow-danger)' : 'url(#drill-arrow)') : ''"
            />
            <!-- 连线：管制→更新 -->
            <line v-for="(e, i) in updateEdges" :key="'ue' + i"
              :x1="e.x1" :y1="e.y1" :x2="e.x2" :y2="e.y2"
              class="drill-edge update-edge"
              :class="{ active: step >= e.step }"
              :marker-end="step >= e.step ? 'url(#drill-arrow)' : ''"
            />
          </svg>

          <!-- 推演进度条 -->
          <div class="progress-bar" v-if="playing">
            <div class="progress-fill" :key="'prog-' + step" :style="{ animationDuration: intervalMs + 'ms' }"></div>
          </div>
        </el-card>
      </el-col>

      <!-- 推演步骤详情 -->
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>分步推演详情</template>
          <el-scrollbar height="380px" ref="scrollRef">
            <div v-for="(s, i) in simSteps" :key="i" class="sim-step"
              :class="{ active: step === i + 1, done: step > i + 1 }">
              <div class="sim-head">
                <span class="sim-idx">{{ i + 1 }}</span>
                <span class="sim-name">{{ s.name }}</span>
                <el-tag v-if="s.weak" type="danger" size="small">薄弱</el-tag>
              </div>
              <div class="sim-body">{{ s.desc }}</div>
              <div class="sim-result" v-if="step > i + 1">
                <el-tag size="small" :type="s.improved ? 'success' : 'warning'">
                  {{ s.improved ? '态势改善' : '态势恶化' }}
                </el-tag>
                <span class="sim-verify">{{ s.verify }}</span>
              </div>
            </div>
          </el-scrollbar>
          <div class="sim-actions">
            <el-button size="small" :disabled="step <= 0" @click="step--">上一步</el-button>
            <el-button size="small" type="primary" :disabled="step >= simSteps.length" @click="step++">下一步</el-button>
          </div>
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

    <!-- 推演结论 -->
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>推演结论</template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="险情场景">舱室破损进水（II舱）</el-descriptions-item>
        <el-descriptions-item label="推演步数">{{ simSteps.length }} 步</el-descriptions-item>
        <el-descriptions-item label="薄弱环节">{{ weakPoints.length }} 项</el-descriptions-item>
        <el-descriptions-item label="最终态势">
          <el-tag type="success" size="small">险情可控</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="关键处置" :span="2">
          堵漏+排水+压载转移+高压气抗沉 组合方案有效控制险情，但高压气资源消耗过快、协同响应偏慢为薄弱环节
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import PageHeader from '@/components/PageHeader.vue'

// 三阶段节点：损害发展 / 人员管制 / 损害更新
// step: 0=初始, 1-3=损害发展, 4-6=管制, 7-9=更新
const damageNodes = [
  { label: '破损进水起始', value: '进水 22 t/h', x: 120, y: 70, step: 1, weak: false },
  { label: '舱室持续进水', value: '横倾 9.2°', x: 120, y: 160, step: 2, weak: false },
  { label: '稳性下降', value: 'GM 0.12m', x: 120, y: 250, step: 3, weak: true }
]
const controlNodes = [
  { label: '堵漏操作', value: '堵漏耗时 3 min', x: 360, y: 70, step: 4, weak: false },
  { label: '排水启动', value: '排水 85 t/h', x: 360, y: 160, step: 5, weak: false },
  { label: '压载+抗沉', value: '高压气抗沉', x: 360, y: 250, step: 6, weak: true }
]
const updateNodes = [
  { label: '进水减缓', value: '进水 8 t/h', x: 600, y: 70, step: 7, weak: false },
  { label: '横倾改善', value: '横倾 5.1°', x: 600, y: 160, step: 8, weak: false },
  { label: '稳性恢复', value: 'GM 0.18m', x: 600, y: 250, step: 9, weak: true }
]

// 连线
const damageEdges = [
  { x1: 120, y1: 88, x2: 120, y2: 142, step: 2 },
  { x1: 120, y1: 178, x2: 120, y2: 232, step: 3 }
]
const crossEdges = [
  { x1: 210, y1: 70, x2: 270, y2: 70, step: 4, weak: false },
  { x1: 210, y1: 160, x2: 270, y2: 160, step: 5, weak: false },
  { x1: 210, y1: 250, x2: 270, y2: 250, step: 6, weak: true }
]
const updateEdges = [
  { x1: 450, y1: 70, x2: 510, y2: 70, step: 7 },
  { x1: 450, y1: 160, x2: 510, y2: 160, step: 8 },
  { x1: 450, y1: 250, x2: 510, y2: 250, step: 9 }
]

// 推演步骤
const simSteps = [
  { name: '破损进水起始', desc: 'II舱破损直径 0.3m，进水速率 22 t/h', weak: false, improved: false, verify: '险情触发' },
  { name: '舱室持续进水', desc: '横倾扩大至 9.2°，吃水差 0.3m', weak: false, improved: false, verify: '姿态预警' },
  { name: '稳性下降', desc: 'GM 降至 0.12m，低于安全下限', weak: true, improved: false, verify: '稳性不足' },
  { name: '堵漏操作', desc: '部署堵漏毯，3 min 完成封堵', weak: false, improved: true, verify: '进水减缓' },
  { name: '排水启动', desc: '启动排水泵，排水量 85 t/h', weak: false, improved: true, verify: '水位下降' },
  { name: '压载+抗沉', desc: '压载转移+高压气抗沉，气源消耗快', weak: true, improved: true, verify: '稳性部分恢复' },
  { name: '进水减缓', desc: '进水速率降至 8 t/h', weak: false, improved: true, verify: '可控' },
  { name: '横倾改善', desc: '横倾恢复至 5.1°', weak: false, improved: true, verify: '姿态改善' },
  { name: '稳性恢复', desc: 'GM 恢复至 0.18m，气源仅剩 40%', weak: true, improved: true, verify: '稳性达标但气源不足' }
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

watch(step, async () => {
  await nextTick()
  const active = document.querySelector('.sim-step.active')
  if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
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
  margin-top: 8px;
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
.drill-svg {
  width: 100%;
  height: auto;
}
.phase-title {
  font-size: 14px;
  font-weight: 700;
  text-anchor: middle;
}
.phase-damage { fill: #c70000; }
.phase-control { fill: #142864; }
.phase-update { fill: #67c23a; }
.phase-divider {
  stroke: #e0e0e0;
  stroke-width: 1;
  stroke-dasharray: 4 4;
}
.drill-node {
  fill: #f5f7fa;
  stroke: #c0c4cc;
  stroke-width: 1.5;
  transition: all 0.3s;
}
.drill-node.done {
  fill: #e8f4ff;
  stroke: #142864;
}
.drill-node.current {
  fill: #142864;
  stroke: #142864;
}
.drill-node.control.done {
  fill: #f0f9eb;
  stroke: #67c23a;
}
.drill-node.control.current {
  fill: #67c23a;
  stroke: #67c23a;
}
.drill-node.update.done {
  fill: #fdf6ec;
  stroke: #e6a23c;
}
.drill-node.update.current {
  fill: #e6a23c;
  stroke: #e6a23c;
}
.drill-node.weak {
  stroke: #c70000;
  stroke-dasharray: 4 2;
}
.drill-text {
  font-size: 12px;
  fill: #303133;
  text-anchor: middle;
  font-weight: 600;
  transition: fill 0.3s;
}
.drill-node.done .drill-text,
.drill-node.current .drill-text {
  fill: #fff;
}
.drill-sub {
  font-size: 10px;
  fill: #909399;
  text-anchor: middle;
}
.drill-node.done .drill-sub,
.drill-node.current .drill-sub {
  fill: rgba(255, 255, 255, 0.8);
}
.weak-mark {
  font-size: 14px;
  fill: #c70000;
  font-weight: 700;
}
.drill-edge {
  stroke: #d0d0d0;
  stroke-width: 1.5;
  transition: all 0.3s;
}
.drill-edge.active {
  stroke: #142864;
  stroke-width: 2;
}
.drill-edge.cross.active {
  stroke: #67c23a;
}
.drill-edge.update-edge.active {
  stroke: #e6a23c;
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
.sim-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
