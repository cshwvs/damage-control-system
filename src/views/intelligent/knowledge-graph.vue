<template>
  <div>
    <PageHeader title="安全知识图谱" desc="展示安全要素逻辑关系图谱，支持从 OpenMetadata 获取术语表及术语关系" />
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>术语表列表</template>
          <el-menu>
            <el-menu-item v-for="g in glossaries" :key="g.id" @click="loadTerms(g.id)">{{ g.name }}</el-menu-item>
          </el-menu>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>术语及关系</template>
          <div v-if="terms.length">
            <el-table :data="terms" border>
              <el-table-column prop="name" label="术语名称" />
              <el-table-column prop="description" label="描述" />
              <el-table-column label="关系" width="120">
                <el-tag size="small">包含</el-tag>
              </el-table-column>
            </el-table>
          </div>
          <el-empty v-else description="请选择左侧术语表" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { getGlossaries, getGlossaryTerms } from '@/api/om'

const glossaries = ref([])
const terms = ref([])

async function loadGlossaries() {
  try {
    glossaries.value = await getGlossaries()
  } catch (e) {
    console.error('Failed to load glossaries', e)
  }
}

async function loadTerms(glossaryId) {
  try {
    terms.value = await getGlossaryTerms(glossaryId)
  } catch (e) {
    console.error('Failed to load terms', e)
  }
}

loadGlossaries()
</script>

<style scoped>
.el-card + .el-card {
  margin-left: 0;
}
</style>