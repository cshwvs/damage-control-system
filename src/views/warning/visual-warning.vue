<template>
  <div>
    <PageHeader title="三维物理环境搭建" desc="以目标对象构建以生命力为主旨的三维模型结构，通过三维前端可视化展示载体姿态、舱室布局与险情要素，为模型运算、数据调用、安全评估与决策建议提供物质基础" />

    <!-- 深海三维视窗：xxx模型，可 360° 查看、缩放、移动 -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>xxx深海三维视窗</span>
          <span class="header-tip">左键拖拽 360° 环绕 · 滚轮缩放 · 右键拖拽平移</span>
        </div>
      </template>
      <SubmarineScene
        title="xxx · 深海威胁态势"
        caption="当前姿态按实时预警映射：横倾 9.2°（超阈值 8°），艇体横滚状态与预警列表同步"
        :height="560"
        :list-angle="9.2"
        :depth="320"
        :bubble-count="90"
      />
    </el-card>

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
import { ref } from 'vue'
import { WarningFilled } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import SubmarineScene from '@/components/SubmarineScene.vue'

// 实时预警列表
const activeWarnings = ref([
  { time: '08:32:05', dim: '姿态异常', source: '陀螺仪', desc: '横倾角 9.2° 超阈值 8°', levelType: 'danger', levelText: '高危险', advice: '立即压载水横向转移', handled: false },
  { time: '08:31:42', dim: '设备故障', source: '稳性计算', desc: 'GM 0.12m 低于安全下限 0.15m', levelType: 'danger', levelText: '高危险', advice: '启动高压气抗沉', handled: false },
  { time: '08:30:15', dim: '设备故障', source: '压力传感器', desc: '高压气压力 18 MPa 低于预警值 20 MPa', levelType: 'warning', levelText: '低危险', advice: '检查管路，启动备用气源', handled: false },
  { time: '08:28:50', dim: '姿态异常', source: '深度计', desc: '深度偏离设定值 12 m', levelType: 'warning', levelText: '低危险', advice: '调整潜浮系统', handled: true },
  { time: '08:25:30', dim: '人员效能', source: '协同记录', desc: '协同作业耗时 6 min 超阈值 5 min', levelType: 'warning', levelText: '低危险', advice: '加强岗位协同', handled: true }
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
.header-tip {
  font-size: 12px;
  color: #909399;
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
