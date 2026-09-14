<template>
  <div>
    <PageHeader title="可视化预警展示" desc="以仪表盘、雷达图、态势面板实时展示多维度预警信息与处置薄弱环节" />

    <el-row :gutter="20">
      <!-- 预警等级仪表盘 -->
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>综合危险等级仪表</template>
          <div class="gauge-wrap">
            <svg viewBox="0 0 200 130" class="gauge-svg">
              <!-- 背景弧 -->
              <path d="M 20 110 A 80 80 0 0 1 180 110" class="gauge-bg" />
              <!-- 绿色段 低危险 -->
              <path d="M 20 110 A 80 80 0 0 1 60 40" class="gauge-green" />
              <!-- 黄色段 中危险 -->
              <path d="M 60 40 A 80 80 0 0 1 100 30" class="gauge-yellow" />
              <!-- 红色段 高危险 -->
              <path d="M 100 30 A 80 80 0 0 1 180 110" class="gauge-red" />
              <!-- 指针 -->
              <line
                :x1="100" :y1="110"
                :x2="pointerX" :y2="pointerY"
                class="gauge-pointer"
                :style="{ transform: `rotate(${pointerAngle}deg)`, transformOrigin: '100px 110px' }"
              />
              <circle cx="100" cy="110" r="5" class="gauge-pivot" />
            </svg>
            <div class="gauge-center">
              <div class="gc-value" :class="levelClass">{{ gauge.level }}</div>
              <div class="gc-label">{{ gauge.label }}</div>
            </div>
            <div class="gauge-scale">
              <span class="gs-green">低</span>
              <span class="gs-yellow">中</span>
              <span class="gs-red">高</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 三维度雷达图 -->
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>多维度预警雷达</span>
              <el-radio-group v-model="radarMode" size="small">
                <el-radio-button label="current">当前</el-radio-button>
                <el-radio-button label="threshold">阈值对比</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="radar-wrap">
            <svg viewBox="0 0 400 320" class="radar-svg">
              <!-- 背景网格 -->
              <g v-for="ring in 4" :key="'r' + ring">
                <polygon
                  :points="radarRing(ring * 25)"
                  class="radar-grid"
                />
              </g>
              <!-- 轴线 -->
              <g v-for="(axis, i) in radarAxes" :key="'a' + i">
                <line
                  x1="200" y1="160"
                  :x2="radarPoint(i, 100).x" :y2="radarPoint(i, 100).y"
                  class="radar-axis"
                />
                <text
                  :x="radarPoint(i, 120).x" :y="radarPoint(i, 120).y"
                  class="radar-label"
                  text-anchor="middle" dominant-baseline="middle"
                >{{ axis }}</text>
              </g>
              <!-- 阈值多边形 -->
              <polygon
                v-if="radarMode === 'threshold'"
                :points="thresholdPolygon"
                class="radar-threshold"
              />
              <!-- 当前值多边形 -->
              <polygon
                :points="currentPolygon"
                class="radar-current"
              />
              <!-- 数据点 -->
              <g v-for="(p, i) in currentPoints" :key="'p' + i">
                <circle :cx="p.x" :cy="p.y" r="4" class="radar-dot" />
              </g>
            </svg>
            <div class="radar-legend">
              <div class="legend-item">
                <span class="legend-color lc-current"></span>
                <span>当前指标</span>
              </div>
              <div class="legend-item" v-if="radarMode === 'threshold'">
                <span class="legend-color lc-threshold"></span>
                <span>安全阈值</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 实时预警列表 -->
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>实时预警列表</span>
          <div class="header-right">
            <span class="warning-count">活跃预警 {{ activeWarnings.length }} 条</span>
            <el-button type="primary" size="small" @click="refreshWarnings">刷新</el-button>
          </div>
        </div>
      </template>
      <el-table :data="activeWarnings" border stripe>
        <el-table-column prop="time" label="触发时间" width="140" />
        <el-table-column prop="dim" label="预警维度" width="130" />
        <el-table-column prop="source" label="预警来源" width="140" />
        <el-table-column prop="desc" label="预警描述" min-width="220" />
        <el-table-column label="等级" width="100">
          <template #default="{ row }">
            <el-tag :type="row.levelType" size="small" effect="dark">{{ row.levelText }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="advice" label="处置建议" min-width="200" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.handled ? 'info' : 'warning'" size="small">
              {{ row.handled ? '已处置' : '待处置' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 处置薄弱环节提示 -->
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>处置薄弱环节提示</template>
      <el-row :gutter="20">
        <el-col :span="6" v-for="weak in weakLinks" :key="weak.name">
          <div class="weak-card" :class="weak.level">
            <div class="wc-icon">
              <el-icon><WarningFilled /></el-icon>
            </div>
            <div class="wc-name">{{ weak.name }}</div>
            <div class="wc-desc">{{ weak.desc }}</div>
            <div class="wc-suggest">{{ weak.suggest }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { WarningFilled } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'

const radarMode = ref('current')

// 仪表盘数据 - 高危险，指针指向红色段
const gauge = ref({ level: 'II', label: '高危险' })
const levelClass = computed(() => gauge.value.level === 'II' ? 'high' : 'low')
// 指针角度：-90度(左)到 90度(右)，高危险指向约 60度
const pointerAngle = ref(60)
const pointerX = computed(() => 100 + 70 * Math.sin(pointerAngle.value * Math.PI / 180))
const pointerY = computed(() => 110 - 70 * Math.cos(pointerAngle.value * Math.PI / 180))

// 雷达图配置
const radarAxes = ['设备故障', '姿态异常', '人员效能', '稳性', '浮态', '动力保障']
// 当前值（百分比 0-100，越接近100越危险）
const radarValues = ref([75, 85, 30, 80, 65, 40])
// 阈值（安全上限）
const thresholdValues = ref([50, 50, 50, 50, 50, 50])

function radarPoint(index, radius) {
  const angle = (Math.PI * 2 * index) / radarAxes.length - Math.PI / 2
  return {
    x: 200 + radius * Math.cos(angle),
    y: 160 + radius * Math.sin(angle)
  }
}

function radarRing(radius) {
  return radarAxes.map((_, i) => {
    const p = radarPoint(i, radius)
    return `${p.x},${p.y}`
  }).join(' ')
}

const currentPoints = computed(() =>
  radarValues.value.map((v, i) => radarPoint(i, v))
)

const currentPolygon = computed(() =>
  currentPoints.value.map(p => `${p.x},${p.y}`).join(' ')
)

const thresholdPolygon = computed(() =>
  thresholdValues.value.map((v, i) => {
    const p = radarPoint(i, v)
    return `${p.x},${p.y}`
  }).join(' ')
)

// 实时预警列表
const activeWarnings = ref([
  { time: '08:32:05', dim: '姿态异常', source: '陀螺仪', desc: '横倾角 9.2° 超阈值 8°', levelType: 'danger', levelText: '高危险', advice: '立即压载水横向转移', handled: false },
  { time: '08:31:42', dim: '设备故障', source: '稳性计算', desc: 'GM 0.12m 低于安全下限 0.15m', levelType: 'danger', levelText: '高危险', advice: '启动高压气抗沉', handled: false },
  { time: '08:30:15', dim: '设备故障', source: '压力传感器', desc: '高压气压力 18 MPa 低于预警值 20 MPa', levelType: 'warning', levelText: '中危险', advice: '检查管路，启动备用气源', handled: false },
  { time: '08:28:50', dim: '姿态异常', source: '深度计', desc: '深度偏离设定值 12 m', levelType: 'warning', levelText: '中危险', advice: '调整潜浮系统', handled: true },
  { time: '08:25:30', dim: '人员效能', source: '协同记录', desc: '协同作业耗时 6 min 超阈值 5 min', levelType: 'warning', levelText: '中危险', advice: '加强岗位协同', handled: true }
])

// 处置薄弱环节
const weakLinks = ref([
  { name: '稳性恢复', desc: 'GM 持续低于安全下限', suggest: '优先启动高压气抗沉', level: 'high' },
  { name: '横倾控制', desc: '横倾角持续扩大', suggest: '压载水转移+堵漏', level: 'high' },
  { name: '高压气资源', desc: '气源压力下降', suggest: '启用备用气源', level: 'medium' },
  { name: '协同响应', desc: '协同耗时偏长', suggest: '强化岗位协同演练', level: 'low' }
])

function refreshWarnings() {
  // 刷新预警数据
}
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
  gap: 12px;
}
.warning-count {
  font-size: 12px;
  color: #909399;
}
/* 仪表盘 */
.gauge-wrap {
  text-align: center;
  padding: 10px 0;
}
.gauge-svg {
  width: 100%;
  max-width: 240px;
  height: auto;
}
.gauge-bg {
  fill: none;
  stroke: #f0f0f0;
  stroke-width: 16;
  stroke-linecap: round;
}
.gauge-green {
  fill: none;
  stroke: #67c23a;
  stroke-width: 16;
  stroke-linecap: round;
}
.gauge-yellow {
  fill: none;
  stroke: #e6a23c;
  stroke-width: 16;
  stroke-linecap: round;
}
.gauge-red {
  fill: none;
  stroke: #c70000;
  stroke-width: 16;
  stroke-linecap: round;
}
.gauge-pointer {
  stroke: #142864;
  stroke-width: 3;
  stroke-linecap: round;
  transition: transform 0.5s ease;
}
.gauge-pivot {
  fill: #142864;
}
.gauge-center {
  margin-top: -50px;
  position: relative;
}
.gc-value {
  font-size: 32px;
  font-weight: 700;
  color: #c70000;
}
.gc-value.low {
  color: #67c23a;
}
.gc-label {
  font-size: 13px;
  color: #909399;
}
.gauge-scale {
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
  padding: 0 20px;
}
.gs-green { color: #67c23a; font-size: 12px; }
.gs-yellow { color: #e6a23c; font-size: 12px; }
.gs-red { color: #c70000; font-size: 12px; }

/* 雷达图 */
.radar-wrap {
  text-align: center;
}
.radar-svg {
  width: 100%;
  max-width: 400px;
  height: auto;
}
.radar-grid {
  fill: none;
  stroke: #e0e0e0;
  stroke-width: 1;
}
.radar-axis {
  stroke: #d0d0d0;
  stroke-width: 1;
}
.radar-label {
  font-size: 12px;
  fill: #606266;
  font-weight: 600;
}
.radar-current {
  fill: rgba(20, 40, 100, 0.25);
  stroke: #142864;
  stroke-width: 2;
}
.radar-threshold {
  fill: none;
  stroke: #e6a23c;
  stroke-width: 2;
  stroke-dasharray: 6 4;
}
.radar-dot {
  fill: #142864;
  stroke: #fff;
  stroke-width: 1.5;
}
.radar-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 10px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;
}
.legend-color {
  width: 14px;
  height: 14px;
  border-radius: 2px;
}
.lc-current {
  background: rgba(20, 40, 100, 0.6);
  border: 1px solid #142864;
}
.lc-threshold {
  background: transparent;
  border: 1px dashed #e6a23c;
}

/* 薄弱环节卡片 */
.weak-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  transition: all 0.25s;
}
.weak-card.high {
  border-color: #c70000;
  background: #fff5f5;
}
.weak-card.medium {
  border-color: #e6a23c;
  background: #fdf6ec;
}
.weak-card.low {
  border-color: #67c23a;
  background: #f0f9eb;
}
.wc-icon {
  font-size: 28px;
  color: #c70000;
  margin-bottom: 8px;
}
.weak-card.medium .wc-icon {
  color: #e6a23c;
}
.weak-card.low .wc-icon {
  color: #67c23a;
}
.wc-name {
  font-weight: 700;
  color: #303133;
  margin-bottom: 6px;
}
.wc-desc {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}
.wc-suggest {
  font-size: 12px;
  color: #142864;
  font-weight: 600;
}
</style>
