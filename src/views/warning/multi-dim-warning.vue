<template>
  <div>
    <PageHeader title="多维度预警要素" desc="结合三维前端界面，以数字标注、图形分区、颜色标识等方式展示险情类型、等级与影响范围，预警信息实时推送至显示终端" />

    <!-- 总体预警态势 -->
    <el-card shadow="never" class="overview-card">
      <template #header>
        <div class="card-header">
          <span>总体预警态势</span>
          <div class="header-right">
            <span class="update-time">数据更新：{{ updateTime }}</span>
            <el-button type="primary" size="small" @click="refreshAll">刷新数据</el-button>
          </div>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="6" v-for="s in overview" :key="s.label">
          <div class="overview-item" :class="s.level">
            <div class="ov-label">{{ s.label }}</div>
            <div class="ov-value">{{ s.value }}</div>
            <div class="ov-status">
              <el-tag :type="s.type" size="small" effect="dark">{{ s.statusText }}</el-tag>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 维度切换 -->
    <el-card shadow="never" style="margin-top: 20px">
      <el-radio-group v-model="activeDim" @change="handleDimChange">
        <el-radio-button label="device">设备故障维度</el-radio-button>
        <el-radio-button label="posture">设备姿态异常维度</el-radio-button>
        <el-radio-button label="personnel">人员处置效能维度</el-radio-button>
      </el-radio-group>
    </el-card>

    <!-- 维度详情 -->
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>{{ currentDim.label }}</span>
          <el-tag :type="currentDim.levelType" effect="dark">
            {{ currentDim.levelText }}
          </el-tag>
        </div>
      </template>

      <!-- 维度要素表格 -->
      <el-table :data="currentDim.items" border stripe>
        <el-table-column prop="name" label="预警要素" min-width="140" />
        <el-table-column prop="current" label="当前值" width="120" />
        <el-table-column prop="threshold" label="判定阈值" min-width="180" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.statusType" size="small">{{ row.statusText }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="数据来源" width="140" />
        <el-table-column label="关联案例" min-width="160">
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="showCase(row.caseId)">
              {{ row.caseName }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" link @click="showDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 维度说明 -->
      <el-alert :title="currentDim.desc" type="info" :closable="false" show-icon style="margin-top: 16px" />
    </el-card>

    <!-- 要素详情对话框 -->
    <el-dialog v-model="detailVisible" :title="detailData.name + ' · 要素详情'" width="640px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="预警要素">{{ detailData.name }}</el-descriptions-item>
        <el-descriptions-item label="当前值">{{ detailData.current }}</el-descriptions-item>
        <el-descriptions-item label="判定阈值">{{ detailData.threshold }}</el-descriptions-item>
        <el-descriptions-item label="数据来源">{{ detailData.source }}</el-descriptions-item>
        <el-descriptions-item label="关联载体参数">{{ detailData.paramRef }}</el-descriptions-item>
        <el-descriptions-item label="关联历史案例">{{ detailData.caseName }}</el-descriptions-item>
        <el-descriptions-item label="关联模型运算">{{ detailData.modelRef }}</el-descriptions-item>
        <el-descriptions-item label="趋势分析">{{ detailData.trend }}</el-descriptions-item>
        <el-descriptions-item label="处置建议">{{ detailData.advice }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 关联案例对话框 -->
    <el-dialog v-model="caseVisible" title="关联历史案例" width="560px">
      <el-descriptions v-if="caseData" :column="1" border>
        <el-descriptions-item label="案例编号">{{ caseData.id }}</el-descriptions-item>
        <el-descriptions-item label="案例名称">{{ caseData.name }}</el-descriptions-item>
        <el-descriptions-item label="发生时间">{{ caseData.time }}</el-descriptions-item>
        <el-descriptions-item label="关键参数">{{ caseData.params }}</el-descriptions-item>
        <el-descriptions-item label="处置措施">{{ caseData.action }}</el-descriptions-item>
        <el-descriptions-item label="经验教训">{{ caseData.lesson }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import PageHeader from '@/components/PageHeader.vue'

const updateTime = ref('2026-09-11 08:32:00')
const activeDim = ref('device')

// 总体预警态势
const overview = ref([
  { label: '设备故障预警', value: '2/4', statusText: '高级危险', level: 'high', type: 'danger' },
  { label: '姿态异常预警', value: '3/4', statusText: '高级危险', level: 'high', type: 'danger' },
  { label: '人员效能预警', value: '1/4', statusText: '低级危险', level: 'low', type: 'success' },
  { label: '综合危险等级', value: 'II 级', statusText: '高级危险', level: 'high', type: 'danger' }
])

// 设备故障维度
const deviceItems = ref([
  { name: '高压气系统', current: '18 MPa', threshold: '≥20 MPa 正常 / <15 MPa 报警', statusType: 'warning', statusText: '预警', source: '传感器实时', caseId: 'C-2023-08', caseName: '高压气泄漏致上浮失败', paramRef: 'DL-001 主机功率', modelRef: '抗风浪计算模块', trend: '压力持续下降 0.2 MPa/min', advice: '检查管路密封，启动备用气源', current2: '' },
  { name: '姿态平衡系统', current: '横倾 9.2°', threshold: '横倾≤5° 正常 / >8° 报警', statusType: 'danger', statusText: '报警', source: '陀螺仪', caseId: 'C-2022-14', caseName: '横倾过大致操纵失效', paramRef: 'JG-001 排水量', modelRef: '破损抗沉计算模块', trend: '横倾角扩大 1°/min', advice: '立即压载水横向转移', current2: '' },
  { name: '操纵系统', current: '响应延迟 0.8s', threshold: '≤0.3s 正常 / >0.5s 报警', statusType: 'danger', statusText: '报警', source: '操控总线', caseId: 'C-2021-03', caseName: '操纵延迟致航向偏离', paramRef: 'DL-001 主机功率', modelRef: '抗风浪计算模块', trend: '延迟持续超标', advice: '切换至备用控制通道', current2: '' },
  { name: '潜浮系统', current: '正常', threshold: '潜浮速率 0.3~0.8 m/s', statusType: 'success', statusText: '正常', source: '深度传感器', caseId: 'C-2020-11', caseName: '潜浮速率异常致深度失控', paramRef: 'SM-001 分舱因数', modelRef: '破损抗沉计算模块', trend: '稳定', advice: '保持监控', current2: '' }
])

// 设备姿态异常维度
const postureItems = ref([
  { name: '横倾', current: '9.2°', threshold: '≤5° 正常 / >8° 高危险', statusType: 'danger', statusText: '高危险', source: '陀螺仪', caseId: 'C-2022-14', caseName: '横倾过大致操纵失效', paramRef: 'JG-002 储备浮力', modelRef: '破损抗沉计算模块', trend: '持续扩大', advice: '压载水转移+堵漏', current2: '' },
  { name: '纵倾', current: '0.3 m', threshold: '≤0.2 m 正常 / >0.5 m 报警', statusType: 'warning', statusText: '预警', source: '吃水差传感器', caseId: 'C-2021-07', caseName: '纵倾失衡致首部进水', paramRef: 'JG-001 排水量', modelRef: '物资装载计算模块', trend: '缓慢增大', advice: '调整载荷分布', current2: '' },
  { name: '深度', current: '85 m', threshold: '设定深度 ±10 m', statusType: 'warning', statusText: '预警', source: '深度计', caseId: 'C-2020-05', caseName: '深度超限致压力告警', paramRef: 'HJ-001 设计波高', modelRef: '抗风浪计算模块', trend: '偏离设定深度 12 m', advice: '调整潜浮系统恢复深度', current2: '' },
  { name: '稳性参数', current: 'GM 0.12 m', threshold: 'GM≥0.15 m 正常 / ≤0.1 m 极限', statusType: 'danger', statusText: '高危险', source: '稳性计算', caseId: 'C-2023-01', caseName: 'GM 过低致稳性丧失', paramRef: 'SM-001 分舱因数', modelRef: '破损抗沉计算模块', trend: '稳性持续下降', advice: '启动高压气抗沉', current2: '' }
])

// 人员处置效能维度
const personnelItems = ref([
  { name: '应急响应', current: '响应时长 45s', threshold: '≤60s 正常 / >90s 报警', statusType: 'success', statusText: '正常', source: '指挥记录', caseId: 'C-2023-09', caseName: '快速响应成功控制险情', paramRef: '-', modelRef: '-', trend: '达标', advice: '保持战位', current2: '' },
  { name: '堵漏操作', current: '堵漏耗时 3 min', threshold: '≤3 min 正常 / >5 min 报警', statusType: 'success', statusText: '正常', source: '现场记录', caseId: 'C-2022-08', caseName: '堵漏及时避免扩散', paramRef: '-', modelRef: '破损抗沉计算模块', trend: '达标', advice: '保持堵漏器材就位', current2: '' },
  { name: '设备操控', current: '操作准确率 92%', threshold: '≥90% 正常 / <80% 报警', statusType: 'success', statusText: '正常', source: '操控评估', caseId: 'C-2021-12', caseName: '操控失误致系统异常', paramRef: '-', modelRef: '-', trend: '稳定', advice: '持续训练', current2: '' },
  { name: '协同作业', current: '协同时长 6 min', threshold: '≤5 min 正常 / >8 min 报警', statusType: 'warning', statusText: '预警', source: '协同记录', caseId: 'C-2020-06', caseName: '协同不畅致处置延误', paramRef: '-', modelRef: '-', trend: '协同偏慢', advice: '加强岗位协同演练', current2: '' }
])

// 维度配置
const dims = {
  device: {
    label: '设备故障维度',
    items: deviceItems,
    levelType: 'danger',
    levelText: '高级危险',
    desc: '设备故障维度涵盖高压气系统、姿态平衡系统、操纵系统、潜浮系统等关键设备运行状态，实时监测设备健康度，联动载体参数与模型运算结果判定风险。'
  },
  posture: {
    label: '设备姿态异常维度',
    items: postureItems,
    levelType: 'danger',
    levelText: '高级危险',
    desc: '设备姿态异常维度监测横倾、纵倾、深度、稳性等核心姿态参数，超出判定阈值即触发预警，为极限工况研判提供姿态依据。'
  },
  personnel: {
    label: '人员处置效能维度',
    items: personnelItems,
    levelType: 'success',
    levelText: '低级危险',
    desc: '人员处置效能维度量化人员应急响应、堵漏操作、设备操控、协同作业等效能指标，评估人员处置能力是否满足险情控制需求。'
  }
}

const currentDim = computed(() => {
  const d = dims[activeDim.value]
  return { ...d, items: d.items.value }
})

// 历史案例库
const caseMap = {
  'C-2023-08': { id: 'C-2023-08', name: '高压气泄漏致上浮失败', time: '2023-08-12', params: '气源压力 14 MPa', action: '启动备用气源+紧急上浮', lesson: '气源冗余不足导致上浮失败，需保证≥30%备用气量' },
  'C-2022-14': { id: 'C-2022-14', name: '横倾过大致操纵失效', time: '2022-11-03', params: '横倾 10.5°', action: '压载水转移+堵漏', lesson: '横倾>8°即应启动平衡处置' },
  'C-2021-03': { id: 'C-2021-03', name: '操纵延迟致航向偏离', time: '2021-03-20', params: '响应延迟 0.9s', action: '切换备用控制通道', lesson: '控制通道冗余设计必要性' },
  'C-2020-11': { id: 'C-2020-11', name: '潜浮速率异常致深度失控', time: '2020-11-05', params: '潜浮速率 1.2 m/s', action: '调整压载+高压气抗沉', lesson: '潜浮速率监控阈值应纳入预警体系' },
  'C-2021-07': { id: 'C-2021-07', name: '纵倾失衡致首部进水', time: '2021-07-18', params: '吃水差 0.6 m', action: '载荷调整+排水', lesson: '纵倾监控应与装载方案联动' },
  'C-2020-05': { id: 'C-2020-05', name: '深度超限致压力告警', time: '2020-05-22', params: '深度偏离 15 m', action: '紧急恢复深度', lesson: '深度告警阈值应留有安全裕度' },
  'C-2023-01': { id: 'C-2023-01', name: 'GM 过低致稳性丧失', time: '2023-01-15', params: 'GM 0.08 m', action: '高压气抗沉+压载调整', lesson: 'GM<0.15 m 即应预警' },
  'C-2023-09': { id: 'C-2023-09', name: '快速响应成功控制险情', time: '2023-09-08', params: '响应 42s', action: '堵漏+排水+抗沉', lesson: '快速响应是控制险情关键' },
  'C-2022-08': { id: 'C-2022-08', name: '堵漏及时避免扩散', time: '2022-08-30', params: '堵漏耗时 2.5 min', action: '堵漏毯+快速固化', lesson: '堵漏器材战位部署重要性' },
  'C-2021-12': { id: 'C-2021-12', name: '操控失误致系统异常', time: '2021-12-10', params: '准确率 78%', action: '人工干预+系统恢复', lesson: '操控培训与考核应常态化' },
  'C-2020-06': { id: 'C-2020-06', name: '协同不畅致处置延误', time: '2020-06-25', params: '协同 9 min', action: '重新分工+应急处置', lesson: '岗位协同演练应强化' }
}

// 详情与案例对话框
const detailVisible = ref(false)
const detailData = ref({})
const caseVisible = ref(false)
const caseData = ref(null)

function showDetail(row) {
  detailData.value = { ...row }
  detailVisible.value = true
}

function showCase(caseId) {
  caseData.value = caseMap[caseId] || null
  caseVisible.value = true
}

function handleDimChange() {
  // 维度切换可扩展为加载后端数据
}

function refreshAll() {
  updateTime.value = new Date().toLocaleString()
}
</script>

<style scoped>
.overview-card {
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
.update-time {
  font-size: 12px;
  color: #909399;
}
.overview-item {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 16px;
  text-align: center;
  transition: all 0.25s;
}
.overview-item.high {
  border-color: #c70000;
  background: #fff5f5;
}
.overview-item.low {
  border-color: #67c23a;
  background: #f0f9eb;
}
.ov-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}
.ov-value {
  font-size: 22px;
  font-weight: 700;
  color: #142864;
  margin-bottom: 8px;
}
.overview-item.high .ov-value {
  color: #c70000;
}
</style>
