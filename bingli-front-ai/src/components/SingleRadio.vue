<template>
  <div :class="['radio-group', layoutClass]">
    <label v-for="option in options" :key="option.label" :class="{ 'disabled': disabled }"
      @click="disabled ? showWarning() : selectOption(option)" class="radio-label">
      <a-badge>
        <template #count>
          <div class="Aistyle" v-if="AiAnalyze === option.value">AI</div>
          <div v-else></div>
        </template>
        <img :src="isSelected(option) ? activeImgSrc : noneImgSrc" class="radio-img" />
      </a-badge>
      <span class="label-text">{{ option.label }}</span>
    </label>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { useOptionsStore } from '../stores/OptionsStore';
import activeImgSrc from '../assets/icon/选框多选框active.png';
import noneImgSrc from '../assets/icon/选框多选框none.png';

// Props 定义
const props = defineProps({
  options: {
    type: Array,
    required: true,
    // 假定选项始终是形如 {label: String, value: Number|String} 的对象
  },
  disabled: {
    type: Boolean,
    required: true
  },
  modelValue: {
    type: [String, Number, Object],
    default: ''
  },
  AiAnalyze: {
    type: [String, Number],
    default: ''
  }
});

// Emits 定义
const emit = defineEmits(['update:modelValue']);

// 响应式状态
const currentValue = ref(props.modelValue);

// Store
const optionsStore = useOptionsStore();

// 监听 props 中 modelValue 的变化
watch(() => props.modelValue, (newVal) => {
  currentValue.value = newVal;
});

// 计算属性
const layoutClass = computed(() => {
  const options = props.options || [];
  return options.length == 4 ? 'two-row-layout' : '';
});

// 获取当前选中值（可能是对象或值）
const getCurrentValue = () => {
  return currentValue.value;
};

// 方法
const selectOption = (option) => {
  const currentVal = getCurrentValue();
  console.log('selectOption', option, currentVal);

  // 特殊处理 "非肿瘤性" 选项
  // [恶性肿瘤, 癌前病变, 癌前状态, 非肿瘤性]
  // const arr = ["恶性肿瘤", "癌前病变", "癌前状态", "非肿瘤性"];
  if (props.options.some(opt => opt.label === "非肿瘤性")) {
    // 如果当前选中项与点击项相同，则取消选中
    if (option.value === currentVal) {
      currentValue.value = null;
    } else {
      // 否则选中点击的选项
      currentValue.value = option.value;
    }
    optionsStore.setTotalRes(currentValue.value);
  } else {
    // 如果当前选中项与点击项相同，则取消选中
    if (option.value === currentVal) {
      currentValue.value = 0;
    } else {
      // 否则选中点击的选项
      currentValue.value = option.value;
    }
  }

  // 发出更新事件
  emit('update:modelValue', currentValue.value);
};

const isSelected = (option) => {
  const currentVal = getCurrentValue();
  return option.value === currentVal;
};

const showWarning = () => {
  message.warn("当前不可以选");
  currentValue.value = null;
  emit('update:modelValue', currentValue.value);
};
</script>

<style scoped>
.radio-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.two-row-layout {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-auto-rows: minmax(auto, auto);
  gap: 10px;
}

.radio-label {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.radio-label:hover:not(.disabled) {
  transform: translateY(-1px);
}

.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.radio-img {
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

.radio-label:hover:not(.disabled) .label-text {
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