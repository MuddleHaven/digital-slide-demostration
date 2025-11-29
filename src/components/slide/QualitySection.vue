<template>
  <div class="section-container">
    <div class="section-title">{{ title }}</div>
    <div v-for="(error, index) in errors" :key="index" class="error-item">
      <div class="error-label">
        {{ error.title }}
        <span v-if="error.AIAnalyze" class="ai-analyze">AI: {{ error.AIAnalyze }}</span>
      </div>
      <a-radio-group v-model:value="error.value" :disabled="error.disabled">
        <a-radio value="无">无</a-radio>
        <a-radio value="有">有</a-radio>
        <!-- Simplified for now, actual options might come from 'allOptions' -->
      </a-radio-group>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  errors: Array
});
</script>

<style scoped>
.section-container {
  margin-bottom: 15px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
}
.section-title {
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 14px;
}
.error-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  font-size: 13px;
}
.ai-analyze {
  font-size: 10px;
  color: #1890ff;
  margin-left: 5px;
}
</style>
