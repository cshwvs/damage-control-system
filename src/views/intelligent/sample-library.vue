<template>
  <div>
    <PageHeader title="学习样本库" desc="归集载体实时姿态、历史事故案例、水域环境等全维度数据，搭建专用学习样本库，支持持续迭代更新" />

    <!-- 样本库概况 -->
    <el-row :gutter="20">
      <el-col :span="6" v-for="stat in stats" :key="stat.label">
        <el-card shadow="never" class="stat-card">
          <el-statistic v-if="typeof stat.value === 'number'" :title="stat.label" :value="stat.value" :suffix="stat.suffix" />
          <div v-else>
            <div class="stat-title">{{ stat.label }}</div>
            <div class="stat-version">{{ stat.value }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 全维度数据归集 -->
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>全维度数据归集</template>
      <el-row :gutter="20">
        <el-col :span="12" v-for="dim in dimensions" :key="dim.name">
          <div class="dim-card">
            <div class="dim-head">
              <span class="dim-name">{{ dim.name }}</span>
              <el-tag size="small" :type="dim.tagType">{{ dim.freq }}</el-tag>
            </div>
            <div class="dim-desc">{{ dim.desc }}</div>
            <div class="dim-meta">已归集样本 <b>{{ dim.count }}</b> 条</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 样本迭代记录 -->
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>样本迭代记录</span>
          <el-button type="primary" size="small" @click="dialogVisible = true">导入新样本</el-button>
        </div>
      </template>
      <el-table :data="records" border stripe>
        <el-table-column prop="version" label="版本" width="100" />
        <el-table-column prop="time" label="更新时间" width="180" />
        <el-table-column prop="source" label="数据来源" min-width="200" />
        <el-table-column prop="count" label="新增样本" width="120" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === '已入库' ? 'success' : 'warning'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 导入样本对话框 -->
    <el-dialog v-model="dialogVisible" title="导入新样本" width="460px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="数据维度">
          <el-select v-model="form.dimension" placeholder="请选择" style="width: 100%">
            <el-option v-for="dim in dimensions" :key="dim.name" :label="dim.name" :value="dim.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="样本数量">
          <el-input-number v-model="form.count" :min="1" :max="10000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="数据来源">
          <el-input v-model="form.source" placeholder="如：实船监测 / 演习记录 / 案例文献" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImport">确认导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { ElMessage } from 'element-plus'

// 样本库概况统计
const stats = ref([
  { label: '样本总量', value: 12860, suffix: '条' },
  { label: '数据维度', value: 6, suffix: '类' },
  { label: '本月新增', value: 342, suffix: '条' },
  { label: '当前版本', value: 'v3.2', suffix: '' }
])

// 六大归集维度
const dimensions = ref([
  { name: '载体实时姿态', desc: '横摇纵摇、浮态、吃水差等实时监测数据', count: 3260, freq: '实时', tagType: 'danger' },
  { name: '历史事故案例', desc: '国内外破损进水、失稳沉没等事故处置案例', count: 486, freq: '按需', tagType: 'info' },
  { name: '水域环境', desc: '水深、流速、浪级、水温等海洋环境参数', count: 2180, freq: '小时级', tagType: '' },
  { name: '险情等级', desc: '险情分级标注及对应处置结果标签数据', count: 960, freq: '按事件', tagType: 'warning' },
  { name: '安全物资存量', desc: '堵漏器材、排水设备等物资库存与消耗记录', count: 1540, freq: '日级', tagType: 'success' },
  { name: '人员处置效能', desc: '处置班组响应时间、操作熟练度、协同效率', count: 2434, freq: '按演习', tagType: '' }
])

// 迭代更新记录
const records = ref([
  { version: 'v3.2', time: '2026-09-05 10:20', source: '实船姿态监测系统', count: 180, status: '已入库' },
  { version: 'v3.1', time: '2026-08-28 15:40', source: '季度损管演习记录', count: 96, status: '已入库' },
  { version: 'v3.0', time: '2026-08-15 09:00', source: '历史事故案例文献', count: 42, status: '已入库' },
  { version: 'v2.9', time: '2026-07-30 14:10', source: '水域环境观测站', count: 260, status: '清洗中' }
])

const dialogVisible = ref(false)
const form = reactive({ dimension: '', count: 100, source: '' })

function handleImport() {
  if (!form.dimension || !form.source) {
    ElMessage.warning('请填写数据维度和来源')
    return
  }
  records.value.unshift({
    version: 'v3.3',
    time: '2026-09-09 09:30',
    source: form.source,
    count: form.count,
    status: '清洗中'
  })
  dialogVisible.value = false
  ElMessage.success('样本已提交，清洗入库后将自动更新模型')
}
</script>

<style scoped>
.stat-card {
  text-align: center;
}
.stat-title {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}
.stat-version {
  font-size: 28px;
  font-weight: 600;
  color: #142864;
  line-height: 1.4;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.dim-card {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 14px 16px;
  margin-bottom: 16px;
  transition: box-shadow 0.2s;
}
.dim-card:hover {
  box-shadow: 0 2px 12px rgba(20, 40, 100, 0.12);
}
.dim-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.dim-name {
  font-weight: 600;
  color: #142864;
}
.dim-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}
.dim-meta {
  margin-top: 8px;
  font-size: 13px;
  color: #909399;
}
.dim-meta b {
  color: #142864;
}
</style>
