<template>
  <div class="quality-summary">
    <div class="res-text">{{ label }}</div>
    <div class="res-text">{{ "整体质量:" + currentQuality }}</div>
    
    <!-- 渲染问题列表 -->
    <div v-for="category in qualityCategories" :key="category.name">
      <div v-for="item in category.errors" :key="item.title">
        <div class="res-text" v-if="item.value == '有'">
          {{ category.prefix ? `${category.prefix}-${item.title}` : item.title }}:{{ item.value }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  currentQuality: {
    type: String,
    required: true
  },
  ranseErrors: {
    type: Array,
    required: true
  },
  qiepianErrors: {
    type: Array,
    required: true
  },
  makepianErrors: {
    type: Array,
    required: true
  },
  saomiaoErrors: {
    type: Array,
    required: true
  }
});

// 组织质量分类数据
const qualityCategories = computed(() => [
  {
    name: 'ranse',
    errors: props.ranseErrors,
    prefix: null
  },
  {
    name: 'qiepian',
    errors: props.qiepianErrors,
    prefix: '切片异常'
  },
  {
    name: 'makepian',
    errors: props.makepianErrors,
    prefix: '制片不规范'
  },
  {
    name: 'saomiao',
    errors: props.saomiaoErrors,
    prefix: '扫描异常'
  }
]);
</script>

<style scoped>
.quality-summary {
  padding: 8px 0;
}

.res-text {
  margin-bottom: 4px;
  font-size: 14px;
  color: #333;
}
</style>
