<template>
  <div>
    <PageHeader title="危险等级与评估规则" desc="划分四级安全等级，明确判定指标及阈值" />
    <el-card shadow="never">
      <el-table :data="riskLevels" border stripe>
        <el-table-column prop="level" label="等级" width="100" />
        <el-table-column prop="label" label="名称" width="120" />
        <el-table-column prop="color" label="标识颜色" width="100">
          <template #default="{ row }">
            <div :style="{ width: '30px', height: '20px', backgroundColor: row.color, borderRadius: '2px' }"></div>
          </template>
        </el-table-column>
        <el-table-column prop="indicator" label="判定指标" min-width="150" />
        <el-table-column prop="threshold" label="阈值" min-width="150" />
        <el-table-column prop="description" label="特征描述" min-width="200" />
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

const riskLevels = ref([
  { level: 'I', label: '低危险', color: '#67C23A', indicator: '浮态可控、稳性达标、动力可靠', threshold: 'F>1.2, GM>0.15m, 冗余≥30%', description: '正常运行状态，无显著风险' },
  { level: 'II', label: '中危险', color: '#E6A23C', indicator: '浮态微变、稳性偏低、动力部分损失', threshold: '1.0<F≤1.2, 0.1<GM≤0.15m, 冗余15%~30%', description: '需关注，采取预防措施' },
  { level: 'III', label: '高危险', color: '#F56C6C', indicator: '浮态失衡、稳性接近下限、动力严重不足', threshold: '0.8<F≤1.0, 0.05<GM≤0.1m, 冗余5%~15%', description: '立即处置，防止恶化' },
  { level: 'IV', label: '极限危险', color: '#909399', indicator: '浮态失控、稳性丧失、动力失效', threshold: 'F≤0.8, GM≤0.05m, 冗余<5%', description: '启动应急程序，准备弃船/上浮' }
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