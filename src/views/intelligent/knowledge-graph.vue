<template>
  <div>
    <PageHeader title="安全知识图谱" desc="梳理安全要素因果逻辑、传导关系与关联规则，量化核心指标权重，支撑密闭水下场景动态智能评估" />

    <el-row :gutter="20">
      <!-- 要素逻辑关系图谱 -->
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>要素逻辑关系图谱</span>
              <div class="legend">
                <span class="legend-item"><i class="line solid"></i>直接作用</span>
                <span class="legend-item"><i class="line dashed"></i>间接传导</span>
              </div>
            </div>
          </template>
          <svg viewBox="0 0 600 420" class="graph-svg">
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#142864" />
              </marker>
            </defs>

            <!-- 间接传导关系（虚线） -->
            <line x1="490" y1="92" x2="490" y2="192" class="edge dashed" />
            <text x="522" y="144" class="edge-label">恶化传导</text>
            <path d="M 112 228 Q 300 430 488 228" class="edge dashed" fill="none" />
            <text x="300" y="322" class="edge-label">环境诱发</text>
            <line x1="194" y1="350" x2="406" y2="350" class="edge dashed" />
            <text x="300" y="342" class="edge-label">动力保障</text>

            <!-- 直接作用关系（实线） -->
            <line x1="185" y1="92" x2="255" y2="190" class="edge" marker-end="url(#arrow)" />
            <text x="212" y="134" class="edge-label">因果</text>
            <line x1="415" y1="92" x2="345" y2="190" class="edge" marker-end="url(#arrow)" />
            <text x="388" y="134" class="edge-label">因果</text>
            <line x1="488" y1="224" x2="358" y2="220" class="edge" marker-end="url(#arrow)" />
            <text x="432" y="244" class="edge-label">传导</text>
            <line x1="415" y1="332" x2="350" y2="232" class="edge" marker-end="url(#arrow)" />
            <text x="372" y="272" class="edge-label">表征</text>
            <line x1="185" y1="330" x2="258" y2="232" class="edge" marker-end="url(#arrow)" />
            <text x="212" y="278" class="edge-label">支撑</text>
            <line x1="112" y1="202" x2="244" y2="208" class="edge" marker-end="url(#arrow)" />
            <text x="165" y="190" class="edge-label">关联</text>

            <!-- 中心节点 -->
            <g>
              <rect x="240" y="187" width="120" height="46" rx="10" class="node center" />
              <text x="300" y="216" class="node-text center-text">载体安全状态</text>
            </g>

            <!-- 要素节点 -->
            <g v-for="n in factorNodes" :key="n.name">
              <rect :x="n.x - 42" :y="n.y - 20" width="84" height="40" rx="9" class="node" />
              <text :x="n.x" :y="n.y + 5" class="node-text">{{ n.name }}</text>
            </g>
          </svg>
        </el-card>
      </el-col>

      <!-- 核心指标权重 -->
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>核心指标权重量化</template>
          <div v-for="item in weights" :key="item.name" class="weight-row">
            <div class="weight-head">
              <span>{{ item.name }}</span>
              <span class="weight-value">{{ item.weight.toFixed(2) }}</span>
            </div>
            <el-progress :percentage="item.weight * 100" :stroke-width="10" :show-text="false" :color="item.color" />
            <div class="weight-effect">相互影响：{{ item.effect }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 动态智能评估方法 -->
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>密闭水下场景动态智能评估方法</template>
      <el-steps :active="4" align-center finish-status="success">
        <el-step v-for="step in assessSteps" :key="step.title" :title="step.title" :description="step.desc" />
      </el-steps>
    </el-card>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// 六大核心要素节点坐标
const factorNodes = [
  { name: '装载', x: 150, y: 70 },
  { name: '稳性', x: 450, y: 70 },
  { name: '进水', x: 530, y: 210 },
  { name: '姿态', x: 450, y: 350 },
  { name: '动力', x: 150, y: 350 },
  { name: '环境', x: 70, y: 210 }
]

// 指标权重及相互影响规律
const weights = [
  { name: '稳性', weight: 0.22, color: '#c70000', effect: '进水后稳性快速丧失，决定倾覆风险' },
  { name: '进水', weight: 0.20, color: '#e6532f', effect: '进水速率传导影响浮态与稳性' },
  { name: '装载', weight: 0.18, color: '#e6a23c', effect: '载荷分布偏移直接改变姿态' },
  { name: '姿态', weight: 0.16, color: '#409eff', effect: '横倾纵摇是安全状态的直观表征' },
  { name: '动力', weight: 0.14, color: '#142864', effect: '动力冗余保障排水与操纵能力' },
  { name: '环境', weight: 0.10, color: '#67c23a', effect: '浪流环境诱发并加速险情恶化' }
]

// 动态评估流程
const assessSteps = [
  { title: '多源数据接入', desc: '汇聚姿态、环境、物资等实时与历史数据' },
  { title: '指标加权计算', desc: '按量化权重融合六大指标生成安全指数' },
  { title: '变化规律推演', desc: '时序分析安全演变趋势与要素传导路径' },
  { title: '动态智能评估', desc: '适配密闭水下场景输出分级评估结论' }
]
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.legend {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}
.legend-item {
  display: flex;
  align-items: center;
}
.line {
  display: inline-block;
  width: 24px;
  height: 0;
  border-top: 2px solid #142864;
  margin-right: 6px;
}
.line.dashed {
  border-top-style: dashed;
  border-top-color: #909399;
}
.graph-svg {
  width: 100%;
  height: auto;
}
.edge {
  stroke: #142864;
  stroke-width: 1.8;
}
.edge.dashed {
  stroke: #909399;
  stroke-dasharray: 6 5;
  stroke-width: 1.5;
}
.edge-label {
  font-size: 12px;
  fill: #606266;
  text-anchor: middle;
  paint-order: stroke;
  stroke: #fff;
  stroke-width: 4;
}
.node {
  fill: #fff;
  stroke: #142864;
  stroke-width: 2;
}
.node.center {
  fill: #142864;
  stroke: #142864;
}
.node-text {
  font-size: 15px;
  fill: #142864;
  text-anchor: middle;
  font-weight: 600;
}
.center-text {
  fill: #fff;
}
.weight-row {
  margin-bottom: 20px;
}
.weight-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-weight: 600;
  color: #303133;
}
.weight-value {
  color: #142864;
}
.weight-effect {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}
</style>
