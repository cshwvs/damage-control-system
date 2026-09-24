<template>
  <div>
    <PageHeader title="电子图表手册" desc="将图形数据电子化，汇总计算公式、评估指标与数据关联关系，形成生命力电子图表手册，支持在线查阅、检索、作图与导出" />
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>公式分类</template>
          <el-tree
            :data="formulaTree"
            :props="{ label: 'label', children: 'children' }"
            node-key="id"
            highlight-current
            @node-click="handleNodeClick"
          />
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>公式内容</template>
          <div v-if="selectedFormula">
            <h3>{{ selectedFormula.title }}</h3>
            <p>{{ selectedFormula.formula }}</p>
            <el-divider />
            <p><strong>说明：</strong>{{ selectedFormula.description }}</p>
          </div>
          <el-empty v-else description="请选择左侧公式" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'

const formulaTree = ref([
  {
    id: '1',
    label: '浮力与浮态',
    children: [
      { id: '1-1', label: '浮力公式', formula: 'F = ρgV', description: '浮力等于液体密度乘重力加速度乘排开体积', title: '浮力公式' },
      { id: '1-2', label: '浮心位置计算', formula: 'KB = (∫ z dA) / A', description: '浮心纵向坐标计算', title: '浮心位置计算' }
    ]
  },
  {
    id: '2',
    label: '稳性计算',
    children: [
      { id: '2-1', label: '初稳性高', formula: 'GM = KB + BM - KG', description: '初稳性高等于浮心高度加横稳心半径减重心高度', title: '初稳性高' },
      { id: '2-2', label: '横稳心半径', formula: 'BM = I_T / V', description: '横稳心半径等于水线面横向惯性矩除以排水体积', title: '横稳心半径' }
    ]
  },
  {
    id: '3',
    label: '抗沉计算',
    children: [
      { id: '3-1', label: '分舱因数', formula: 'F = (V_b / V) * 100%', description: '分舱因数等于储备浮力与总容积之比', title: '分舱因数' },
      { id: '3-2', label: '破损进水时间', formula: 't = V_in / (C_d * A * sqrt(2gh))', description: '进水时间估算公式', title: '破损进水时间' }
    ]
  }
])

const selectedFormula = ref(null)

function handleNodeClick(data) {
  if (data.formula) {
    selectedFormula.value = data
  } else {
    selectedFormula.value = null
  }
}
</script>