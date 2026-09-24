<template>
  <div>
    <PageHeader title="通用危险等级与评估" desc="结合作业工况与损害场景划分低级危险、高级危险两级安全等级；联动设备故障（高压气系统、姿态平衡系统、操纵系统、潜浮系统）、姿态异常（横倾、纵倾、深度、稳性）、人员处置效能多维度评估逻辑，自动判定风险等级并明确典型场景判定阈值" />

    <el-card shadow="never">
      <el-table :data="riskLevels" border stripe>
        <el-table-column prop="level" label="等级" width="80" />
        <el-table-column prop="label" label="名称" width="120" />
        <el-table-column prop="color" label="标识颜色" width="100">
          <template #default="{ row }">
            <div :style="{ width: '30px', height: '20px', backgroundColor: row.color, borderRadius: '2px' }"></div>
          </template>
        </el-table-column>
        <el-table-column prop="indicator" label="判定指标" min-width="180" />
        <el-table-column prop="threshold" label="阈值" min-width="200" />
        <el-table-column prop="description" label="特征描述" min-width="220" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="编辑危险等级阈值" width="500px">
      <el-form label-width="100px">
        <el-form-item label="等级名称">
          <el-input v-model="editForm.label" disabled />
        </el-form-item>
        <el-form-item label="判定指标">
          <el-input v-model="editForm.indicator" />
        </el-form-item>
        <el-form-item label="阈值">
          <el-input v-model="editForm.threshold" />
        </el-form-item>
        <el-form-item label="特征描述">
          <el-input type="textarea" v-model="editForm.description" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { ElMessage } from 'element-plus'

// 两级危险等级定义
const riskLevels = ref([
  {
    level: 'I',
    label: '低危险',
    color: '#ffc579',
    indicator: '浮态可控、稳性达标、动力可靠',
    threshold: 'F>1.2, GM>0.15m, 冗余≥30%',
    description: '正常运行状态，无显著风险'
  },
  {
    level: 'II',
    label: '高危险',
    color: '#c70000',
    indicator: '浮态失衡、稳性丧失、动力严重不足',
    threshold: 'F≤1.0, GM≤0.1m, 冗余<15%',
    description: '立即处置，防止恶化，必要时启动应急程序'
  }
])

const dialogVisible = ref(false)
const editForm = reactive({ level: '', label: '', indicator: '', threshold: '', description: '' })

function handleEdit(row) {
  Object.assign(editForm, row)
  dialogVisible.value = true
}

function saveEdit() {
  const index = riskLevels.value.findIndex(item => item.level === editForm.level)
  if (index !== -1) {
    riskLevels.value[index] = { ...editForm }
  }
  dialogVisible.value = false
  ElMessage.success('保存成功')
}
</script>