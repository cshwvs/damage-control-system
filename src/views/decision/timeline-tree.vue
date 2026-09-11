<template>
  <div>
    <PageHeader title="三轴一体化" desc="以进水险情为背景，融合险情时间轴、故障损害树、对策集，构建时序化、可视化动态决策体系" />

    <!-- 轴一：险情时间轴 -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>险情时间轴</span>
          <div class="header-right">
            <span class="play-status">{{ playing ? '自动推演中' : '已暂停' }}</span>
            <el-button :type="playing ? 'warning' : 'primary'" size="small" round @click="togglePlay">
              {{ playing ? '暂停' : '播放' }}
            </el-button>
          </div>
        </div>
      </template>
      <div class="timeline-track">
        <div class="track-line"></div>
        <div
          v-for="s in stages"
          :key="s.id"
          class="track-node"
          :class="{ active: currentStage === s.id, passed: currentStage > s.id }"
          @click="handleStageClick(s.id)"
        >
          <div class="node-dot"></div>
          <div class="node-label">{{ s.name }}</div>
        </div>
      </div>
      <!-- 自动推演进度条 -->
      <div class="progress-bar" v-if="playing">
        <div class="progress-fill" :key="'prog-' + currentStage" :style="{ animationDuration: intervalMs + 'ms' }"></div>
      </div>
      <el-descriptions :column="3" border class="stage-detail">
        <el-descriptions-item label="阶段">{{ activeStage.name }}</el-descriptions-item>
        <el-descriptions-item label="处置窗口期">{{ activeStage.window }}</el-descriptions-item>
        <el-descriptions-item label="险情特征">{{ activeStage.feature }}</el-descriptions-item>
        <el-descriptions-item label="关键指标" :span="3">{{ activeStage.metric }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 轴二：故障损害树 -->
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>故障损害树</template>
          <svg viewBox="0 0 560 380" class="tree-svg">
            <defs>
              <marker id="t-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#909399" />
              </marker>
            </defs>
            <!-- 连线 -->
            <line x1="280" y1="52" x2="100" y2="112" class="t-edge" marker-end="url(#t-arrow)" />
            <line x1="280" y1="52" x2="280" y2="112" class="t-edge" marker-end="url(#t-arrow)" />
            <line x1="280" y1="52" x2="460" y2="112" class="t-edge" marker-end="url(#t-arrow)" />
            <line x1="100" y1="142" x2="100" y2="202" class="t-edge" marker-end="url(#t-arrow)" />
            <line x1="280" y1="142" x2="280" y2="202" class="t-edge" marker-end="url(#t-arrow)" />
            <line x1="460" y1="142" x2="460" y2="202" class="t-edge" marker-end="url(#t-arrow)" />
            <line x1="100" y1="232" x2="180" y2="292" class="t-edge" marker-end="url(#t-arrow)" />
            <line x1="280" y1="232" x2="280" y2="292" class="t-edge" marker-end="url(#t-arrow)" />
            <line x1="460" y1="232" x2="380" y2="292" class="t-edge" marker-end="url(#t-arrow)" />

            <!-- 根节点 -->
            <g>
              <rect x="220" y="16" width="120" height="36" rx="8" class="t-node t-root" />
              <text x="280" y="39" class="t-text t-text-root">进水险情</text>
            </g>
            <!-- 第二层：根源 -->
            <g v-for="n in l2" :key="n.name">
              <rect :x="n.x - 56" :y="n.y - 18" width="112" height="36" rx="8" class="t-node t-l2" />
              <text :x="n.x" :y="n.y + 5" class="t-text">{{ n.name }}</text>
            </g>
            <!-- 第三层：连锁故障 -->
            <g v-for="n in l3" :key="n.name">
              <rect :x="n.x - 56" :y="n.y - 18" width="112" height="36" rx="8" class="t-node t-l3" />
              <text :x="n.x" :y="n.y + 5" class="t-text">{{ n.name }}</text>
            </g>
            <!-- 第四层：次生风险 -->
            <g v-for="n in l4" :key="n.name">
              <rect :x="n.x - 52" :y="n.y - 16" width="104" height="32" rx="8" class="t-node t-l4" />
              <text :x="n.x" :y="n.y + 4" class="t-text t-text-sm">{{ n.name }}</text>
            </g>
          </svg>
        </el-card>
      </el-col>

      <!-- 轴三：对策集 -->
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>对策集</template>
          <el-table :data="schemes" border stripe size="small">
            <el-table-column prop="scene" label="适用场景" min-width="100" />
            <el-table-column prop="measure" label="处置方案" min-width="120" />
            <el-table-column label="等级" width="70">
              <template #default="{ row }">
                <el-tag size="small" :type="row.tagType">{{ row.level }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import PageHeader from '@/components/PageHeader.vue'

// 险情时间轴五阶段
const stages = [
  { id: 1, short: '进水发生', name: '进水发生', window: '0-5分钟', feature: '破损口初始进水，流速峰值', metric: '进水速率 > 20 t/h，破口面积 > 0.2 m²' },
  { id: 2, short: '渗漏扩散', name: '渗漏扩散', window: '5-15分钟', feature: '水线沿舱壁蔓延，相邻舱室渗漏', metric: '渗漏速率 2-5 t/h，扩散面积持续扩大' },
  { id: 3, short: '舱室漫水', name: '舱室漫水', window: '15-30分钟', feature: '破损舱室大面积积水，浮态开始偏移', metric: '积水深度 > 0.5m，吃水差变化 > 0.2m' },
  { id: 4, short: '姿态失稳', name: '姿态失稳', window: '30-60分钟', feature: '横倾纵倾超限，稳性裕度急剧下降', metric: '横倾角 > 8°，GM < 0.15m' },
  { id: 5, short: '极限工况', name: '极限工况触发', window: '>60分钟', feature: '稳性丧失、动力瘫痪逼近临界', metric: 'GM ≤ 0.1m，动力冗余 < 15%' }
]
const currentStage = ref(1)
const activeStage = computed(() => stages.find(s => s.id === currentStage.value))

// 自动播放
const playing = ref(true)
const intervalMs = 3500
let timer = null

function startTimer() {
  stopTimer()
  timer = setInterval(() => {
    currentStage.value = currentStage.value >= stages.length ? 1 : currentStage.value + 1
  }, intervalMs)
}
function stopTimer() {
  if (timer) { clearInterval(timer); timer = null }
}
function togglePlay() {
  playing.value = !playing.value
  if (playing.value) startTimer()
  else stopTimer()
}
function handleStageClick(id) {
  currentStage.value = id
  playing.value = false
  stopTimer()
}

onMounted(() => { if (playing.value) startTimer() })
onUnmounted(() => stopTimer())

// 故障损害树节点
const l2 = [
  { name: '结构破损', x: 100, y: 112 },
  { name: '稳性丧失', x: 280, y: 112 },
  { name: '动力失效', x: 460, y: 112 }
]
const l3 = [
  { name: '破口扩展', x: 100, y: 202 },
  { name: '浮态恶化', x: 280, y: 202 },
  { name: '供电中断', x: 460, y: 202 }
]
const l4 = [
  { name: '舱室连锁进水', x: 180, y: 292 },
  { name: '倾覆风险', x: 280, y: 292 },
  { name: '操纵失控', x: 380, y: 292 }
]

// 对策集
const schemes = [
  { scene: '小破口/低危', measure: '堵漏毯封堵 + 常规排水', level: 'I级', tagType: 'warning' },
  { scene: '中破口/中危', measure: '堵漏+压载调控+姿态校正', level: 'II级', tagType: 'danger' },
  { scene: '大破口/高危', measure: '高压气抗沉+动力抗沉', level: 'II级', tagType: 'danger' },
  { scene: '极限工况', measure: '紧急上浮+全员撤离', level: '极限', tagType: 'danger' }
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
  margin-bottom: 16px;
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
.timeline-track {
  position: relative;
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  margin-bottom: 20px;
}
.track-line {
  position: absolute;
  top: 11px;
  left: 40px;
  right: 40px;
  height: 2px;
  background: #d0d0d0;
  z-index: 0;
}
.track-node {
  position: relative;
  z-index: 1;
  cursor: pointer;
  text-align: center;
  width: 18%;
}
.node-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid #d0d0d0;
  margin: 0 auto 8px;
  transition: all 0.25s;
}
.track-node.active .node-dot {
  background: #142864;
  border-color: #142864;
  box-shadow: 0 0 0 4px rgba(20, 40, 100, 0.15);
}
.track-node.passed .node-dot {
  background: #a0c3f0;
  border-color: #a0c3f0;
}
.node-label {
  font-size: 13px;
  color: #909399;
  transition: color 0.25s;
}
.track-node.active .node-label {
  color: #142864;
  font-weight: 600;
}
.stage-detail {
  margin-top: 4px;
}
.tree-svg {
  width: 100%;
  height: auto;
}
.t-edge {
  stroke: #c0c4cc;
  stroke-width: 1.5;
}
.t-node {
  fill: #fff;
  stroke: #142864;
  stroke-width: 1.5;
}
.t-root {
  fill: #142864;
  stroke: #142864;
}
.t-l2 {
  stroke: #e6a23c;
  stroke-width: 2;
}
.t-l3 {
  stroke: #e6532f;
  stroke-width: 2;
}
.t-l4 {
  stroke: #c70000;
  stroke-width: 1.5;
  fill: #fef0f0;
}
.t-text {
  font-size: 14px;
  fill: #142864;
  text-anchor: middle;
  font-weight: 600;
}
.t-text-root {
  fill: #fff;
}
.t-text-sm {
  font-size: 13px;
}
</style>
