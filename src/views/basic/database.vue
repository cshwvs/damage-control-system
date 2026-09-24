<template>
  <div>
    <PageHeader title="专属数据库调用" desc="配套业务专用数据库，支持关系建模与维度建模，兼容主流数据库类型；载体参数、水域环境数据、风险案例、计算阈值、操作记录分类存储、快速调取与增量更新；具备数据清理、数据比对能力，对新增/修改/删除数据分类展示并提供错误数据引导修正" />
    <el-card shadow="never">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="表结构" name="tables">
          <el-table :data="tables" border stripe>
            <el-table-column prop="name" label="表名" width="200" />
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="fieldCount" label="字段数" width="100" />
            <el-table-column prop="rowCount" label="行数（估算）" width="120" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button size="small" @click="showColumns(row)">查看字段</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="字段字典" name="fields">
          <el-table :data="allFields" border stripe>
            <el-table-column prop="fieldName" label="字段名" width="150" />
            <el-table-column prop="dataType" label="数据类型" width="120" />
            <el-table-column prop="length" label="长度" width="80" />
            <el-table-column prop="nullable" label="可空" width="80" />
            <el-table-column prop="primaryKey" label="主键" width="80" />
            <el-table-column prop="description" label="描述" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="数据比对" name="compare">
          <div class="compare-container">
            <el-select v-model="tableA" placeholder="选择表A" style="width: 200px" @change="compareTables">
              <el-option v-for="t in tables" :key="t.name" :label="t.name" :value="t.name" />
            </el-select>
            <span style="margin: 0 10px">对比</span>
            <el-select v-model="tableB" placeholder="选择表B" style="width: 200px" @change="compareTables">
              <el-option v-for="t in tables" :key="t.name" :label="t.name" :value="t.name" />
            </el-select>
            <el-button type="primary" style="margin-left: 10px" @click="compareTables">比对</el-button>
          </div>
          <el-table v-if="compareResult.length" :data="compareResult" border stripe style="margin-top: 20px">
            <el-table-column prop="fieldName" label="字段名" width="150" />
            <el-table-column prop="tableAExists" label="表A是否存在" width="120">
              <template #default="{ row }">
                <el-tag :type="row.tableAExists ? 'success' : 'danger'">{{ row.tableAExists ? '是' : '否' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="tableBExists" label="表B是否存在" width="120">
              <template #default="{ row }">
                <el-tag :type="row.tableBExists ? 'success' : 'danger'">{{ row.tableBExists ? '是' : '否' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="dataTypeA" label="表A类型" width="120" />
            <el-table-column prop="dataTypeB" label="表B类型" width="120" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import PageHeader from '@/components/PageHeader.vue'

const activeTab = ref('tables')

// 模拟表数据
const tables = ref([
  { name: 'ship_structure', description: '载体结构参数表', fieldCount: 12, rowCount: 150 },
  { name: 'cabin_layout', description: '舱室布局表', fieldCount: 8, rowCount: 30 },
  { name: 'power_equipment', description: '动力设备性能表', fieldCount: 15, rowCount: 80 },
  { name: 'load_parameters', description: '载荷参数表', fieldCount: 10, rowCount: 200 }
])

// 模拟字段字典数据
const allFields = ref([
  { fieldName: 'id', dataType: 'varchar', length: 36, nullable: false, primaryKey: true, description: '主键' },
  { fieldName: 'name', dataType: 'varchar', length: 100, nullable: false, primaryKey: false, description: '名称' },
  { fieldName: 'value', dataType: 'float', length: 10, nullable: true, primaryKey: false, description: '数值' },
  { fieldName: 'unit', dataType: 'varchar', length: 20, nullable: true, primaryKey: false, description: '单位' },
  { fieldName: 'device_model', dataType: 'varchar', length: 50, nullable: true, primaryKey: false, description: '设备型号' }
])

const tableA = ref('')
const tableB = ref('')
const compareResult = ref([])

function showColumns(row) {
  activeTab.value = 'fields'
}

function compareTables() {
  // 模拟比对结果
  compareResult.value = [
    { fieldName: 'id', tableAExists: true, tableBExists: true, dataTypeA: 'varchar', dataTypeB: 'varchar' },
    { fieldName: 'name', tableAExists: true, tableBExists: true, dataTypeA: 'varchar', dataTypeB: 'varchar' },
    { fieldName: 'value', tableAExists: true, tableBExists: false, dataTypeA: 'float', dataTypeB: '-' },
    { fieldName: 'unit', tableAExists: true, tableBExists: true, dataTypeA: 'varchar', dataTypeB: 'varchar' }
  ]
}
</script>

<style scoped>
.compare-container {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
</style>