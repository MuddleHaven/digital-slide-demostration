<template>
  <a-row class="common-pannel" :gutter="10">
    <a-col class="common-title" :span="6">{{ title }}</a-col>
    <a-col :span="18" class="verticalcenter">
      <div class="quality-items-container">
        <CheckBoxWithTitle 
          v-for="error in errors" 
          :key="error.title" 
          :options="allOptions[error.options] || defaultOptions"
          :disabled="error.disabled" 
          v-model="error.value" 
          :title="error.title" 
          :AIAnalyze="error.AIAnalyze"
          @update:model-value="onQualityChange(error, $event)"
          class="quality-item"
        />
      </div>
    </a-col>
  </a-row>
</template>

<script setup>
import { computed } from 'vue';
import CheckBoxWithTitle from '@/components/CheckBoxWithTitle.vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  errors: {
    type: Array,
    required: true
  },
  allOptions: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update-quality-areas']);

const defaultOptions = [{label: '无', value: '无'}, {label: '有', value: '有'}];

// 当质量选项改变时
const onQualityChange = (error, value) => {
  // 生成对应的质量控制区域数据
  if (value === '有') {
    const areas = generateQualityAreas(error.title);
    emit('update-quality-areas', areas);
  } else {
    // 移除对应区域
    emit('update-quality-areas', []);
  }
};

// 根据错误类型生成质量控制区域（示例数据，实际应该从AI分析结果获取）
const generateQualityAreas = (errorTitle) => {
  // 这里应该根据AI分析结果生成实际的区域坐标
  // 目前返回示例数据
  return [
    {
      x: Math.random() * 500,
      y: Math.random() * 500,
      width: 100 + Math.random() * 100,
      height: 100 + Math.random() * 100,
      description: `${errorTitle}检测区域`,
      showLabel: true,
      opacity: 0.3
    }
  ];
};
</script>

<style scoped>
.common-pannel {
  margin-bottom: 15px; /* Increased spacing */
  min-height: fit-content;
  background-color: #fff; /* Ensure background if card style */
  padding: 10px; /* Add padding inside section */
  border-radius: 12px; /* Rounded corners like reference */
  /* box-shadow: 0 2px 8px rgba(0,0,0,0.05); Optional shadow for section */
}

.common-title {
  font-weight: bold;
  color: #333;
  display: flex;
  align-items: flex-start;
  padding-top: 8px;
  font-size: 16px; /* Larger title */
}

.verticalcenter {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  min-height: 100%;
}

.quality-items-container {
  display: flex;
  flex-direction: column;
  gap: 12px; /* Spacing between items */
  width: 100%;
  padding: 4px 0;
}

.quality-item {
  min-height: 24px;
  display: flex;
  align-items: center;
  padding: 2px 0;
}
</style>