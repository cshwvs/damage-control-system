<template>
  <div>
    <PageHeader title="险情分级闭环处置" desc="结合三维前端界面，以数字标注、图形分区、颜色标识展示险情类型、等级与影响范围，预警实时推送，闭环管控" />

    <!-- 顶部播放控制 -->
    <div class="play-control-bar">
      <span class="play-status">{{ playing ? '实时推演中' : '已暂停' }}</span>
      <el-button :type="playing ? 'warning' : 'primary'" size="small" round @click="togglePlay">
        {{ playing ? '暂停' : '播放' }}
      </el-button>
      <span class="step-indicator">当前环节：{{ activeLoopStep?.title || '等待中' }}</span>
    </div>

    <el-row :gutter="20" style="margin-top: 12px">
      <!-- 可视化预警展示 -->
      <el-col :span="15">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>可视化预警展示</span>
              <el-tag size="small" type="danger" effect="dark">II级 · 高危险</el-tag>
            </div>
          </template>
          <svg viewBox="0 0 560 320" class="viz-svg">
            <!-- 舱室分区 -->
            <rect v-for="z in zones" :key="z.id"
              :x="z.x" :y="z.y" :width="z.w" :height="z.h" rx="6"
              :class="['zone', 'zone-' + z.level]" />
            <text v-for="z in zones" :key="'t-' + z.id"
              :x="z.x + z.w/2" :y="z.y + z.h/2 + 4" class="zone-text">{{ z.name }}</text>

            <!-- 数字标注 -->
            <g v-for="(a, i) in annotations" :key="i">
              <circle :cx="a.x" :cy="a.y" r="11" class="annot-dot" />
              <text :x="a.x" :y="a.y + 4" class="annot-num">{{ i + 1 }}</text>
              <text :x="a.x + 16" :y="a.y + 4" class="annot-text">{{ a.text }}</text>
            </g>

            <!-- 进水水位（动态高度） -->
            <rect :x="waterRect.x" :y="waterRect.y + waterRect.h * (1 - waterLevel)" :width="waterRect.w" :height="waterRect.h * waterLevel"
              class="water-rect" />
            <text :x="waterRect.x + waterRect.w/2" :y="waterRect.y + 30" class="water-text">进水区</text>
          </svg>
          <div class="legend">
            <span class="legend-item"><i class="dot danger"></i>高危险</span>
            <span class="legend-item"><i class="dot warning"></i>中危险</span>
            <span class="legend-item"><i class="dot safe"></i>正常</span>
          </div>
        </el-card>
      </el-col>

      <!-- 预警信息推送 -->
      <el-col :span="9">
        <el-card shadow="never" class="alert-card">
          <template #header>
            <div class="card-header">
              <span>预警信息推送</span>
              <el-tag size="small" type="danger" effect="dark" class="pulse-tag">实时</el-tag>
            </div>
          </template>
          <el-scrollbar height="280px" ref="alertScrollRef">
            <transition-group name="alert" tag="div">
              <div v-for="msg in visibleAlerts" :key="msg.id" class="alert-item" :class="'alert-' + msg.level">
                <span class="alert-time">{{ msg.time }}</span>
                <span class="alert-type">{{ msg.type }}</span>
                <span class="alert-text">{{ msg.text }}</span>
              </div>
            </transition-group>
          </el-scrollbar>
        </el-card>
      </el-col>
    </el-row>

    <!-- 闭环处置流程 -->
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>险情分级闭环处置流程</span>
          <span class="step-counter">步骤 {{ activeStepIndex + 1 }} / {{ loopSteps.length }}</span>
        </div>
      </template>
      <el-steps :active="activeStepIndex" align-center finish-status="success">
        <el-step v-for="s in loopSteps" :key="s.title" :title="s.title" :description="s.desc" />
      </el-steps>
      <!-- 进度条 -->
      <div class="progress-bar" v-if="playing">
        <div class="progress-fill" :key="'prog-' + activeStepIndex" :style="{ animationDuration: intervalMs + 'ms' }"></div>
      </div>
    </el-card>

    <!-- 闭环记录 -->
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>闭环处置记录</template>
      <el-table :data="loopRecords" border stripe size="small">
        <el-table-column prop="stage" label="环节" width="110" />
        <el-table-column prop="time" label="时间" width="100" />
        <el-table-column prop="content" label="处置内容" min-width="200" />
        <el-table-column prop="result" label="结果" min-width="160" />
        <el-table-column label="闭环状态" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="row.closed ? 'success' : 'warning'">{{ row.closed ? '已闭环' : '处置中' }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import PageHeader from '@/components/PageHeader.vue'

// 舱室分区
const zones = [
  { id: 1, name: 'I舱', x: 50, y: 70, w: 90, h: 180, level: 'safe' },
  { id: 2, name: 'II舱', x: 150, y: 70, w: 130, h: 180, level: 'danger' },
  { id: 3, name: 'III舱', x: 290, y: 70, w: 90, h: 180, level: 'warning' },
  { id: 4, name: 'IV舱', x: 390, y: 70, w: 90, h: 180, level: 'safe' },
  { id: 5, name: 'V舱', x: 490, y: 70, w: 50, h: 180, level: 'safe' }
]

// 数字标注
const annotations = [
  { x: 215, y: 90, text: '破损进水口' },
  { x: 215, y: 200, text: '积水深度 0.6m' },
  { x: 335, y: 90, text: '渗漏蔓延' },
  { x: 95, y: 90, text: '横倾 9.2°' }
]

// 进水水位区域
const waterRect = { x: 280, y: 70, w: 100, h: 180 }

// 预警信息全量数据
const allAlerts = [
  { id: 1, time: 'T+00:01', level: 'danger', type: '进水', text: 'II舱破损进水，速率22t/h' },
  { id: 2, time: 'T+00:05', level: 'warning', type: '扩散', text: 'III舱渗漏，速率3t/h' },
  { id: 3, time: 'T+00:08', level: 'danger', type: '姿态', text: '横倾角超8°预警' },
  { id: 4, time: 'T+00:12', level: 'danger', type: '稳性', text: 'GM降至0.12m，稳性不足' },
  { id: 5, time: 'T+00:15', level: 'danger', type: '极限', text: '动力冗余28%，逼近极限工况' },
  { id: 6, time: 'T+00:20', level: 'info', type: '处置', text: '排水堵漏已执行，进水降至8t/h' },
  { id: 7, time: 'T+00:25', level: 'info', type: '处置', text: '高压气抗沉启动，GM恢复至0.18m' }
]

// 逐条显示的预警
const visibleAlerts = ref([])

// 闭环流程
const loopSteps = [
  { title: '险情分级', desc: '融合评估与预警数据判定险情等级' },
  { title: '方案制定', desc: '决策树推演匹配最优处置方案' },
  { title: '处置执行', desc: '分步执行堵漏、压载、抗沉操作' },
  { title: '效果验证', desc: '实时验算指标恢复情况' },
  { title: '闭环确认', desc: '险情解除，记录归档复盘' }
]

// 闭环记录
const loopRecords = [
  { stage: '险情分级', time: 'T+01:00', content: 'II舱进水22t/h，判定II级', result: '高危险，启动处置流程', closed: true },
  { stage: '方案制定', time: 'T+02:00', content: '决策树推演，输出方案B最优', result: '高压气抗沉+动力抗沉+上浮', closed: true },
  { stage: '处置执行', time: 'T+05:00', content: '排水堵漏+压载转移+高压气抗沉', result: '进水降至3t/h，横倾5.1°', closed: true },
  { stage: '效果验证', time: 'T+15:00', content: 'GM 0.18m，动力冗余35%', result: '指标恢复安全区间', closed: true },
  { stage: '闭环确认', time: 'T+25:00', content: '险情解除，记录归档', result: '闭环完成，进入复盘', closed: false }
]

// === 自动播放逻辑 ===
const playing = ref(true)
const activeStepIndex = ref(0)
const waterLevel = ref(0)
const intervalMs = 3000
let stepTimer = null
let alertTimer = null
let waterTimer = null
let alertIdx = 0

// 当前环节
const activeLoopStep = computed(() => loopSteps[activeStepIndex.value])

function startStepTimer() {
  stopStepTimer()
  stepTimer = setInterval(() => {
    activeStepIndex.value = activeStepIndex.value >= loopSteps.length - 1 ? 0 : activeStepIndex.value + 1
  }, intervalMs)
}
function stopStepTimer() {
  if (stepTimer) { clearInterval(stepTimer); stepTimer = null }
}

function startAlertTimer() {
  stopAlertTimer()
  // 每隔更短时间推送一条预警
  alertTimer = setInterval(() => {
    if (alertIdx < allAlerts.length) {
      visibleAlerts.value.push(allAlerts[alertIdx])
      alertIdx++
    } else {
      // 全部推送完，清空重新开始
      setTimeout(() => {
        visibleAlerts.value = []
        alertIdx = 0
      }, 2000)
    }
  }, 1800)
}
function stopAlertTimer() {
  if (alertTimer) { clearInterval(alertTimer); alertTimer = null }
}

function startWaterTimer() {
  stopWaterTimer()
  // 水位随闭环步骤变化：前3步水位上升（险情恶化），后2步水位下降（处置见效）
  waterTimer = setInterval(() => {
    const phase = activeStepIndex.value
    if (phase <= 2) {
      // 上升阶段
      waterLevel.value = Math.min(0.85, waterLevel.value + 0.12)
    } else {
      // 下降阶段
      waterLevel.value = Math.max(0.15, waterLevel.value - 0.1)
    }
  }, 800)
}
function stopWaterTimer() {
  if (waterTimer) { clearInterval(waterTimer); waterTimer = null }
}

function togglePlay() {
  playing.value = !playing.value
  if (playing.value) {
    startStepTimer()
    startAlertTimer()
    startWaterTimer()
  } else {
    stopStepTimer()
    stopAlertTimer()
    stopWaterTimer()
  }
}

// 预警列表自动滚动到底
watch(visibleAlerts, async () => {
  await nextTick()
  const container = document.querySelector('.alert-card .el-scrollbar__wrap')
  if (container) container.scrollTop = container.scrollHeight
}, { deep: true })

onMounted(() => {
  if (playing.value) {
    startStepTimer()
    startAlertTimer()
    startWaterTimer()
  }
})
onUnmounted(() => {
  stopStepTimer()
  stopAlertTimer()
  stopWaterTimer()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.play-control-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}
.play-status {
  font-size: 13px;
  color: #142864;
  font-weight: 600;
}
.step-indicator {
  font-size: 13px;
  color: #909399;
  margin-left: auto;
}
.step-counter {
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
.water-rect {
  fill: rgba(64, 158, 255, 0.2);
  stroke: #409eff;
  stroke-width: 1;
  transition: all 0.3s ease;
}
/* 预警条目动画 */
.alert-enter-active {
  transition: all 0.4s ease;
}
.alert-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.alert-leave-active {
  transition: all 0.3s ease;
}
.alert-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
.viz-svg {
  width: 100%;
  height: auto;
}
.zone {
  stroke: #c0c4cc;
  stroke-width: 1.5;
}
.zone-safe {
  fill: #f0f9eb;
  stroke: #67c23a;
}
.zone-warning {
  fill: #fdf6ec;
  stroke: #e6a23c;
}
.zone-danger {
  fill: #fef0f0;
  stroke: #c70000;
  stroke-width: 2.5;
}
.zone-text {
  font-size: 14px;
  fill: #606266;
  text-anchor: middle;
  font-weight: 600;
}
.water-text {
  font-size: 12px;
  fill: #409eff;
  text-anchor: middle;
  font-weight: 600;
}
.water {
  stroke: #409eff;
  stroke-width: 1.5;
  stroke-dasharray: 4 3;
}
.annot-dot {
  fill: #c70000;
}
.annot-num {
  font-size: 11px;
  fill: #fff;
  text-anchor: middle;
  font-weight: 700;
}
.annot-text {
  font-size: 12px;
  fill: #303133;
  font-weight: 600;
}
.legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 12px;
  font-size: 13px;
  color: #606266;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.dot {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 3px;
}
.dot.danger { background: #fef0f0; border: 2px solid #c70000; }
.dot.warning { background: #fdf6ec; border: 2px solid #e6a23c; }
.dot.safe { background: #f0f9eb; border: 2px solid #67c23a; }
.alert-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 4px;
  margin-bottom: 6px;
  font-size: 13px;
}
.alert-danger { background: #fef0f0; border-left: 3px solid #c70000; }
.alert-warning { background: #fdf6ec; border-left: 3px solid #e6a23c; }
.alert-info { background: #f4f4f5; border-left: 3px solid #909399; }
.alert-time { color: #909399; flex-shrink: 0; }
.alert-type {
  font-weight: 600;
  color: #303133;
  flex-shrink: 0;
  width: 36px;
}
.alert-text { color: #606266; }
.pulse-tag {
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
