<template>
  <div class="checkbox-group">
    <label :class="{ 'disabled': disabled }" @click="disabled ? showWarning() : selectOption()" class="checkbox-label">
      <a-badge>
        <template #count>
          <div class="Aistyle" v-if="isAI">AI</div>
          <div v-else></div>
        </template>
        <img :src="isChecked ? activeImgSrc : noneImgSrc" class="checkbox-img" :class="{ 'disabled': disabled }" />
      </a-badge>
    </label>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import activeImgSrc from '../assets/icon/选框多选框active.png';
import noneImgSrc from '../assets/icon/选框多选框none.png';

// Props 定义
const props = defineProps({
  options: {
    type: Array,
    required: false,
    default: () => [
      { label: '阴性', value: 0 },
      { label: '阳性', value: 10 }
    ],
  },
  disabled: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: [String, Number],
    default: 0
  },
  AiAnalyze: {
    type: [String, Number],
    default: ''
  }
});

const defaultOptions = [
  { label: '阴性', value: 0 },
  { label: '阳性', value: 10 }
];

// Emits 定义
const emit = defineEmits(['update:modelValue']);

// 响应式状态
const currentValue = ref(props.modelValue || 0);

// 获取实际使用的选项（带默认值保护）
const actualOptions = computed(() => {
  return props.options && props.options.length === 2 ? props.options : defaultOptions;
});

// 监听 props 中 modelValue 的变化
watch(() => props.modelValue, (newVal) => {
  currentValue.value = newVal;
});

// 计算是否显示 AI 标记
const isAI = computed(() => {
  const options = actualOptions.value;
  return props.AiAnalyze === options[1].value;
});

// 计算属性：判断是否勾选
const isChecked = computed(() => {
  const options = actualOptions.value;
  return currentValue.value === options[1].value;
});

// 选择选项方法
const selectOption = () => {
  const options = actualOptions.value;

  // 切换值：如果当前值等于第二个选项（阳性值），则切换到第一个选项（阴性值），否则相反
  const newValue = currentValue.value === options[1].value
    ? options[0].value
    : options[1].value;

  console.log('Toggling value from', currentValue.value, 'to', newValue);
  currentValue.value = newValue;
  emit('update:modelValue', newValue);
};

// 显示警告信息
const showWarning = () => {
  message.warn("当前不可以选");
  // 如果禁用，则设置为默认选项（通常为"阴性"）
  const options = actualOptions.value;
  currentValue.value = options[0].value;
  emit('update:modelValue', options[0].value);
};
</script>

<style scoped>
.checkbox-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  /* 允许子元素换行 */
}

.two-row-layout {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-auto-rows: minmax(auto, auto);
  /* 自动调整行高以适应内容 */
  gap: 10px;
}

.checkbox-label {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.checkbox-label:hover:not(.disabled) {
  transform: translateY(-1px);
}

.disabled {
  cursor: not-allowed;
  /* 当元素具有 disabled 类时，将鼠标样式设置为禁止 */
  opacity: 0.6;
  /* 可选：降低禁用选项的透明度，使其看起来更不可点击 */
}

.checkbox-img {
  width: 1vw;
  height: 1vw;
  transition: transform 0.2s ease;
}

.label-text {
  font-family: 'Source Han Sans SC';
  font-weight: 400;
  font-size: 0.7vw;
  color: #666666;
  font-style: normal;
  text-transform: none;
  margin-left: 0.6vw;
  transition: color 0.2s ease;
}

.checkbox-label:hover:not(.disabled) .label-text {
  color: #333333;
}

.Aistyle {
  width: 0.8vw;
  height: 0.8vw;
  background: #37AE2F;
  border-radius: 0.4vw;
  border: 1px solid #FFFFFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.5vw;
}
</style>