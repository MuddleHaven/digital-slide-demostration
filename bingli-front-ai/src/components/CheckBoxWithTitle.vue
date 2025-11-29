<template>
  <div class="radio-group">
    <label :class="{ 'disabled': disabled }" @click="disabled ? showWarning() : selectOption()" class="radio-label">
      <img :src="isSelected(options[0]) ? activeImgSrc : noneImgSrc" alt="" class="radio-img"
        :class="{ 'disabled': disabled }" />
      <a-badge>
        <template #count>
          <div class="Aistyle" v-if="showAIBadge">AI</div>
          <div v-else></div>
        </template>
        <span class="label-text" :class="{ 'unselect': !isSelected(options[0]) }">{{ title }}</span>
      </a-badge>
    </label>
    <div class="tip" :class="{ 'tip-visible': isSelected(options[0]), 'tip-hidden': !isSelected(options[0]) }">i</div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import activeImgSrc from '../assets/icon/选框多选框active.png';
import noneImgSrc from '../assets/icon/选框多选框none.png';
import { message } from 'ant-design-vue';

// 定义组件接收的属性
const props = defineProps({
  options: {
    type: Array,
    required: true,
    validator: value => value.length === 2,
  },
  disabled: {
    type: Boolean,
    required: true
  },
  modelValue: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
    required: true
  },
  AIAnalyze: {
    type: [String, Number],
    default: '',
  }
});

// 定义组件可触发的事件
const emit = defineEmits(['update:modelValue']);

// 响应式数据
const selectedOption = ref(props.modelValue);

// 计算属性：检查是否显示AI徽章
const showAIBadge = computed(() => {
  return props.AIAnalyze == 10 || props.AIAnalyze === '10';
});

// 监听 modelValue 变化，同步到内部状态
watch(() => props.modelValue, (newVal) => {
  selectedOption.value = newVal;
});

// 方法
const selectOption = () => {
  selectedOption.value = selectedOption.value === props.options[0] ? props.options[1] : props.options[0];
  emit('update:modelValue', selectedOption.value);
};

const isSelected = (option) => {
  return selectedOption.value === option;
};

const showWarning = () => {
  message.warn("当前不可以选");
  selectedOption.value = '无';
  emit('update:modelValue', selectedOption.value);
};
</script>

<style scoped>
.radio-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 24px; /* 固定最小高度 */
  padding: 2px 0;
}

.radio-label {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.radio-img {
  width: 1.2vw;
  height: 1.2vw;
  display: inline-block;
  vertical-align: middle;
  cursor: pointer;

}

.disabled {
  cursor: not-allowed;
  /* 当元素具有 disabled 类时，将鼠标样式设置为禁止 */
  opacity: 0.6;
  /* 可选：降低禁用选项的透明度，使其看起来更不可点击 */
}

.radio-label span {
  margin-left: 5px;
  vertical-align: middle;
}

.label-text {
  font-family: 'Source Han Sans SC';
  font-weight: 400;
  font-size: 0.8vw;
  color: #242BA0;
  font-style: normal;
  text-transform: none;
}

.tip {
  width: 16px;
  height: 16px;
  background: #242BA0;
  border-radius: 8px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  flex-shrink: 0; /* 防止压缩 */
}

.tip-visible {
  opacity: 1;
  visibility: visible;
}

.tip-hidden {
  opacity: 0;
  visibility: hidden;
}

.unselect {
  color: #CCCCCC;
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