<template>
  <div class="page-header">
    <h2 class="page-title">{{ title }}</h2>
    <p v-if="desc" class="page-desc">{{ desc }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  desc: { type: String, default: '' }
})
</script>

<style scoped>
.page-header {
  margin-bottom: 20px;
}
.page-title {
  color: var(--primary-color);
  margin: 0;
}
.page-desc {
  color: #666;
  margin-top: 8px;
}
</style>