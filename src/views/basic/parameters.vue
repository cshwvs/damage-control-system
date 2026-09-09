<template>
  <div>
    <PageHeader title="基础参数管理" desc="管理载体结构、舱室布局、动力设备、载荷、水域环境、生命力等基础数据" />

    <el-card shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <el-button type="primary" @click="handleCreate">新增参数</el-button>
        <el-button @click="handleImport">批量导入</el-button>
        <el-button @click="handleExport">导出</el-button>
        <div class="spacer"></div>
        <el-input
          v-model="searchKey"
          placeholder="搜索参数名称或编码"
          clearable
          style="width: 220px"
          @keyup.enter="handleSearch"
        />
        <el-button style="margin-left: 10px" @click="handleSearch">查询</el-button>
      </div>

      <!-- 分类筛选 -->
      <div class="filter-row">
        <el-radio-group v-model="activeCategory" @change="handleSearch">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button v-for="cat in categories" :key="cat.value" :label="cat.value">
            {{ cat.label }}
          </el-radio-button>
        </el-radio-group>
      </div>

      <!-- 参数表格 -->
      <el-table :data="pagedData" border stripe v-loading="loading">
        <el-table-column prop="code" label="编码" width="120" />
        <el-table-column prop="name" label="参数名称" min-width="150" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="value" label="数值" width="100" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="deviceModel" label="适用设备型号" width="150" />
        <el-table-column prop="updateTime" label="更新时间" width="140" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredData.length"
          layout="total, prev, pager, next, sizes"
          :page-sizes="[10, 20, 50]"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑参数' : '新增参数'" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="参数编码" prop="code">
          <el-input v-model="form.code" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="参数名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="cat in categories" :key="cat.value" :label="cat.label" :value="cat.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="数值" prop="value">
          <el-input v-model="form.value" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" />
        </el-form-item>
        <el-form-item label="适用设备型号">
          <el-input v-model="form.deviceModel" placeholder="可选" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input type="textarea" v-model="form.remark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="importVisible" title="批量导入" width="400px">
      <el-upload
        drag
        action="#"
        :auto-upload="false"
        :on-change="onFileChange"
        :limit="1"
        accept=".csv,.xlsx"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">支持 CSV、XLSX 格式，单次不超过 10MB</div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="primary" @click="submitImport">开始导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'

// ========== 常量与模拟数据 ==========
const categories = [
  { label: '载体结构', value: 'structure' },
  { label: '舱室布局', value: 'cabin' },
  { label: '动力设备', value: 'power' },
  { label: '载荷参数', value: 'load' },
  { label: '水域环境', value: 'environment' },
  { label: '生命力参数', value: 'vitality' }
]

const mockData = [
  { code: 'JG-001', name: '排水量', category: 'structure', value: '1500', unit: 't', deviceModel: 'XX-2000', updateTime: '2026-09-01' },
  { code: 'JG-002', name: '储备浮力', category: 'structure', value: '20', unit: '%', deviceModel: 'XX-2000', updateTime: '2026-09-02' },
  { code: 'CB-001', name: '舱室数量', category: 'cabin', value: '12', unit: '个', deviceModel: 'XX-2000', updateTime: '2026-09-01' },
  { code: 'DL-001', name: '主机功率', category: 'power', value: '2000', unit: 'kW', deviceModel: 'XX-2000', updateTime: '2026-09-03' },
  { code: 'ZH-001', name: '最大载荷', category: 'load', value: '500', unit: 't', deviceModel: 'XX-2000', updateTime: '2026-09-01' },
  { code: 'HJ-001', name: '设计波高', category: 'environment', value: '3.5', unit: 'm', deviceModel: 'XX-2000', updateTime: '2026-09-01' },
  { code: 'SM-001', name: '分舱因数', category: 'vitality', value: '0.85', unit: '-', deviceModel: 'XX-2000', updateTime: '2026-09-01' },
]

// ========== 状态 ==========
const loading = ref(false)
const searchKey = ref('')
const activeCategory = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const importVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const form = reactive({
  code: '',
  name: '',
  category: '',
  value: '',
  unit: '',
  deviceModel: '',
  remark: ''
})

const rules = {
  code: [{ required: true, message: '请输入参数编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入参数名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  value: [{ required: true, message: '请输入数值', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }]
}

// 数据容器
let allParameters = ref([...mockData])

// 过滤后的数据
const filteredData = computed(() => {
  let list = allParameters.value
  if (activeCategory.value) {
    list = list.filter(item => item.category === activeCategory.value)
  }
  if (searchKey.value.trim()) {
    const key = searchKey.value.trim().toLowerCase()
    list = list.filter(item =>
      item.code.toLowerCase().includes(key) ||
      item.name.toLowerCase().includes(key)
    )
  }
  return list
})

// 分页数据
const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

// ========== 方法 ==========
function handleSearch() {
  currentPage.value = 1
}

function handleCreate() {
  isEdit.value = false
  Object.assign(form, { code: '', name: '', category: '', value: '', unit: '', deviceModel: '', remark: '' })
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除参数 ${row.name} 吗？`, '提示', { type: 'warning' })
    allParameters.value = allParameters.value.filter(item => item.code !== row.code)
    ElMessage.success('删除成功')
  } catch (e) {
    // 取消
  }
}

function handleSave() {
  formRef.value.validate(valid => {
    if (!valid) return
    if (isEdit.value) {
      const index = allParameters.value.findIndex(item => item.code === form.code)
      if (index !== -1) {
        allParameters.value[index] = { ...form, updateTime: new Date().toLocaleDateString() }
      }
    } else {
      allParameters.value.push({ ...form, updateTime: new Date().toLocaleDateString() })
    }
    dialogVisible.value = false
    ElMessage.success('保存成功')
  })
}

function handleExport() {
  // 模拟导出 CSV
  const headers = ['编码', '参数名称', '分类', '数值', '单位', '适用设备型号', '更新时间']
  const rows = filteredData.value.map(item => [
    item.code, item.name, categories.find(c => c.value === item.category)?.label || '',
    item.value, item.unit, item.deviceModel, item.updateTime
  ])
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `基础参数_${new Date().toISOString().slice(0,10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('导出成功')
}

function handleImport() {
  importVisible.value = true
}

function onFileChange(file) {
  // 暂存文件，实际可上传
  console.log(file)
}

function submitImport() {
  importVisible.value = false
  ElMessage.success('导入成功（模拟）')
  // 可在此处解析文件并添加到 allParameters
}

onMounted(() => {
  // 可加载后端数据
})
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}
.spacer {
  flex: 1;
}
.filter-row {
  margin-bottom: 16px;
}
.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>