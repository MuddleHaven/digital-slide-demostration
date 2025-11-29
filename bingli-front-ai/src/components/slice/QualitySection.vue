<template>
  <a-row class="common-pannel" :style="sectionStyle" :gutter="10">
    <a-col class="common-title" :span="3">{{ title }}</a-col>
    <a-col :span="21" class="verticalcenter">
      <div class="quality-items-container">
        <CheckBoxWithTitle 
          v-for="error in errors" 
          :key="error.title" 
          :options="allOptions[error.options]"
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
import { computed, watch } from 'vue';
import CheckBoxWithTitle from '../../components/CheckBoxWithTitle.vue';

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

// 根据不同类型设置不同高度
const sectionStyle = computed(() => {
  const heightMap = {
    '染色差异': '3.8vw',
    '切片异常': '15vw',
    '制片不规范': '4.75vw',
    '扫描异常': '4.75vw'
  };
  
  return {
    height: heightMap[props.title] || '4vw'
  };
});

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
  margin-bottom: 8px;
  min-height: fit-content;
}

.common-title {
  font-weight: bold;
  color: #333;
  display: flex;
  align-items: flex-start;
  padding-top: 8px;
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
  gap: 8px;
  width: 100%;
  padding: 4px 0;
}

.quality-item {
  min-height: 24px; /* 固定最小高度 */
  display: flex;
  align-items: center;
  padding: 2px 0;
}
</style>
