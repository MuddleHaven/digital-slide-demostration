<template>
  <a-row class="common-pannel" :gutter="10">
    <a-col class="common-title" :span="6">{{ title }}</a-col>
    <a-col :span="18" class="verticalcenter">
      <div class="quality-items-container">
        <CheckBoxWithTitle 
          v-for="error in props.errors" 
          :key="error.title" 
          :options="allOptions[error.options]"
          :disabled="error.disabled" 
          v-model="error.value" 
          :title="error.title" 
          :AIAnalyze="error.AIAnalyze"
          :color="error.color"
          @update:model-value="onQualityChange(error, $event)"
          class="quality-item"
        />
      </div>
    </a-col>
  </a-row>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue';
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

console.log(props.allOptions, props.errors, props.title);


const emit = defineEmits(['update-quality-areas']);

// 当质量选项改变时
const onQualityChange = (error, value) => {
  // 生成对应的质量控制区域数据
  if (value === 10 || value === 0) {
    const areasError = {...error};
    emit('update-quality-areas', areasError);
  }
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