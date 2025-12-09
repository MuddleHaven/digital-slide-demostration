<template>
  <div class="quality-summary">
    <div class="summary-row">
      <span class="label">切片编号:</span>
      <span class="value">{{ label || '未编号' }}</span>
    </div>
    <div class="summary-row">
      <span class="label">整体质量:</span>
      <span class="value quality-tag" :class="currentQuality == 0 ? 'tag-green' : 'tag-red'">
        {{ currentQuality == 0 ? '合格' : '不合格' }}
      </span>
    </div>
    
    <!-- 渲染问题列表 -->
    <div class="error-list">
      <template v-for="category in qualityCategories" :key="category.name">
        <div v-for="item in category.errors" :key="item.title" class="error-item">
          <div v-if="item.value == 10" class="error-text">
            <span class="error-dot"></span>
            {{ category.prefix ? `${category.prefix}-${item.title}` : item.title }}
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue';

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  currentQuality: {
    type: [String, Number],
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
    prefix: null // 染色差异直接显示名称
  },
  {
    name: 'qiepian',
    errors: props.qiepianErrors,
    prefix: '切片'
  },
  {
    name: 'saomiao',
    errors: props.saomiaoErrors,
    prefix: '扫描'
  }
]);

console.log('QualitySummary props:', props.currentQuality, props.label, props.ranseErrors, props.qiepianErrors, props.saomiaoErrors);
console.log('qualityCategories:', qualityCategories.value);

</script>

<style scoped>
.quality-summary {
  padding: 10px 0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.label {
  color: #666;
}

.value {
  font-weight: 500;
  color: #333;
}

.quality-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.tag-green {
  background-color: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.tag-red {
  background-color: #fff1f0;
  color: #f5222d;
  border: 1px solid #ffa39e;
}

.error-list {
  margin-top: 12px;
  border-top: 1px dashed #eee;
  padding-top: 10px;
}

.error-item {
  margin-bottom: 6px;
}

.error-text {
  font-size: 13px;
  color: #f5222d;
  display: flex;
  align-items: center;
}

.error-dot {
  width: 6px;
  height: 6px;
  background-color: #f5222d;
  border-radius: 50%;
  margin-right: 8px;
}
</style>