<template>
  <div>
    <PageHeader title="智能化推理与辅助决策" desc="依托知识图谱与动态评估规则智能推理，自动生成多套备选方案并推荐最优，支持规则自定义配置" />

    <!-- 当前态势 -->
    <el-alert type="error" :closable="false" show-icon class="situation">
      <template #title>
        当前态势：II 舱破损进水，险情等级 <b>II 级（高危险）</b>，预警已触发，智能推理引擎已生成备选处置方案
      </template>
    </el-alert>

    <!-- 全场景智能处置决策框架 -->
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>全场景智能处置决策框架</template>
      <el-steps :active="4" align-center finish-status="success">
        <el-step v-for="step in framework" :key="step.title" :title="step.title" :description="step.desc" />
      </el-steps>
    </el-card>

    <!-- 备选处置方案 -->
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>智能推理备选方案</span>
          <el-button type="primary" size="small" @click="rerun">重新推理</el-button>
        </div>
      </template>
      <el-table :data="schemes" border stripe :row-class-name="rowClass">
        <el-table-column prop="name" label="方案" width="90" />
        <el-table-column prop="action" label="处置措施" min-width="220" />
        <el-table-column prop="resource" label="资源需求" min-width="160" />
        <el-table-column prop="duration" label="预期耗时" width="100" />
        <el-table-column label="残余风险" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.riskType">{{ row.risk }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="综合评分" width="100">
          <template #default="{ row }">
            <b :class="{ 'score-best': row.recommended }">{{ row.score }}</b>
          </template>
        </el-table-column>
        <el-table-column label="推荐" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.recommended" type="success" size="small">最优推荐</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 决策规则自定义配置 -->
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>决策规则配置</span>
          <el-button type="primary" size="small" @click="openEdit()">新增规则</el-button>
        </div>
      </template>
      <el-table :data="rules" border stripe>
        <el-table-column prop="model" label="设备型号" width="140" />
        <el-table-column prop="scene" label="作业场景" width="160" />
        <el-table-column prop="condition" label="触发条件" min-width="200" />
        <el-table-column prop="logic" label="决策逻辑" min-width="200" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 规则编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="editForm.id ? '编辑决策规则' : '新增决策规则'" width="500px">
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="设备型号">
          <el-select v-model="editForm.model" placeholder="如：A型 / B型" style="width: 100%">
            <el-option label="A型密闭载体" value="A型" />
            <el-option label="B型密闭载体" value="B型" />
          </el-select>
        </el-form-item>
        <el-form-item label="作业场景">
          <el-select v-model="editForm.scene" placeholder="请选择" style="width: 100%">
            <el-option label="浅水巡航" value="浅水巡航" />
            <el-option label="深水作业" value="深水作业" />
            <el-option label="坐底抢修" value="坐底抢修" />
          </el-select>
        </el-form-item>
        <el-form-item label="触发条件">
          <el-input v-model="editForm.condition" placeholder="如：进水速率 > 5 t/h 且 GM < 0.15m" />
        </el-form-item>
        <el-form-item label="决策逻辑">
          <el-input type="textarea" v-model="editForm.logic" :rows="3" placeholder="如：优先排水堵漏，同步载荷转移，稳性不恢复则上浮" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRule">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { ElMessage } from 'element-plus'

// 决策框架全流程
const framework = [
  { title: '数据流转', desc: '样本库与实时监测数据汇聚接入' },
  { title: '预警触发', desc: '动态评估越限自动触发分级预警' },
  { title: '智能推理', desc: '知识图谱匹配规则推演处置路径' },
  { title: '决策输出', desc: '生成多套备选方案并推荐最优' },
  { title: '闭环管控', desc: '处置反馈回传，规则持续优化' }
]

// 备选方案（推理引擎输出）
const schemes = ref([
  {
    name: '方案一',
    action: '启动舱底排水 + 堵漏毯封堵破损口，同步调拨相邻舱室压载水',
    resource: '排水泵2台 / 堵漏组4人',
    duration: '约25分钟',
    risk: '低',
    riskType: 'success',
    score: 92,
    recommended: true
  },
  {
    name: '方案二',
    action: '封闭破损舱室 + 载荷横向转移，抑制横倾恶化',
    resource: '封闭装置1套 / 搬运组6人',
    duration: '约40分钟',
    risk: '中',
    riskType: 'warning',
    score: 85,
    recommended: false
  },
  {
    name: '方案三',
    action: '应急排水并紧急上浮，全员撤至安全舱段',
    resource: '应急排水1套 / 全体艇员',
    duration: '约15分钟',
    risk: '较高',
    riskType: 'danger',
    score: 76,
    recommended: false
  }
])

// 决策规则配置
const rules = ref([
  { id: 1, model: 'A型', scene: '深水作业', condition: '进水速率 > 5 t/h 且 GM < 0.15m', logic: '优先排水堵漏，同步载荷转移；稳性10分钟内不恢复则上浮' },
  { id: 2, model: 'A型', scene: '浅水巡航', condition: '横倾角 > 12°', logic: '立即载荷横移平衡，启动排水，通报指挥舱' },
  { id: 3, model: 'B型', scene: '坐底抢修', condition: '动力冗余 < 30%', logic: '停止非必要用电，优先保障排水与通信，准备应急上浮' }
])

const dialogVisible = ref(false)
const editForm = reactive({ id: null, model: '', scene: '', condition: '', logic: '' })

function rowClass({ row }) {
  return row.recommended ? 'row-recommended' : ''
}

function rerun() {
  ElMessage.info('推理引擎已基于最新态势重新推演，方案排序已更新')
}

function openEdit(row) {
  if (row) {
    Object.assign(editForm, row)
  } else {
    Object.assign(editForm, { id: null, model: '', scene: '', condition: '', logic: '' })
  }
  dialogVisible.value = true
}

function saveRule() {
  if (!editForm.model || !editForm.scene || !editForm.condition) {
    ElMessage.warning('请完善设备型号、作业场景与触发条件')
    return
  }
  if (editForm.id) {
    const idx = rules.value.findIndex(r => r.id === editForm.id)
    if (idx !== -1) rules.value[idx] = { ...editForm }
  } else {
    rules.value.push({ ...editForm, id: Date.now() })
  }
  dialogVisible.value = false
  ElMessage.success('决策规则已保存并生效')
}
</script>

<style scoped>
.situation {
  margin-top: 4px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.score-best {
  color: #67c23a;
  font-size: 16px;
}
:deep(.row-recommended) {
  background-color: #f0f9eb;
}
</style>
