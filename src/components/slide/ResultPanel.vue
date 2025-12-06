<template>
  <div class="result-panel">
    <!-- Upper Panel -->
    <a-card class="right-up-card cardcommon">
      <div class="panel-header">
        <span class="l-c-text">处理面板</span>
      </div>
      <div class="scroll-container" style="height: 53vh; overflow-y: auto; padding-right: 5px;">
        <a-row class="row-css" v-for="(condition, index) in conditions" :key="index" align="middle">
          <!-- Label Column -->
          <a-col :span="8" class="choice_text" :class="{ 'disabled': condition.disabled }">
            <div class="label-wrapper">
              <span>{{ condition.text }}</span>
              <span v-if="condition.AiAnalyze == 5" class="ai-label">AI</span>
            </div>
          </a-col>
          
          <!-- Component Column -->
          <a-col :span="16">
            <div class="component-wrapper">
              <!-- Case 1: Binary Toggle (CheckBox) -->
              <template v-if="isBinary(condition)">
                <CheckBox
                  v-if="condition.componentType === 'CheckBox'"
                  :options="getOptions(condition.options)"
                  :disabled="condition.disabled"
                  v-model="localConditions[index].value"
                  :AiAnalyze="condition.AiAnalyze"
                />
                <!-- Or if user wants CheckBoxWithTitle for binary but with label -->
                <!-- But usually mac (mucinous) has no label in image, just checkbox. So CheckBox is correct. -->
              </template>

              <!-- Case 2: List of Options (SingleRadio replacement) -->
              <template v-else>
                <div class="radio-list">
                  <!-- Iterate options and use CheckBoxWithTitle to render each as a selectable item -->
                  <div v-for="opt in getOptions(condition.options)" :key="opt.value" class="radio-item">
                     <CheckBoxWithTitle
                       :title="opt.label"
                       :modelValue="localConditions[index].value"
                       :options="[{value: opt.value}, {value: null}]" 
                       :disabled="condition.disabled"
                       :AIAnalyze="condition.AiAnalyze"
                       @update:modelValue="handleListSelection(index, opt.value, $event)"
                     />
                  </div>
                </div>
              </template>
            </div>
          </a-col>
        </a-row>
      </div>
      <div class="control-circle2" @click="onToggleCollapse">
        <RightOutlined />
      </div>
    </a-card>

    <!-- Lower Panel -->
    <a-card class="right-down-card cardcommon" style="margin-top: 10px;">
      <div class="panel-header">
        <span class="l-c-text">辅助建议</span>
      </div>
      <div class="res-card">
         <div style="height: 15vh; overflow-y: auto;">
          <a-textarea v-model:value="adviceValue" placeholder="请填写辅助建议" :auto-size="{ minRows: 3, maxRows: 6 }" class="res-text textarea-text" />
        </div>
      </div>
      <div class="action-buttons">
        <a-button type="primary" class="btn save-btn" @click="onSaveAndView">
          保存并浏览
        </a-button>
        <a-button class="btn next-btn" type="text" @click="onNextSlice">
          下一例
        </a-button>
      </div>
      <div class="control-circle2" @click="onToggleCollapse">
        <RightOutlined />
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { computed, ref, inject, watch, onMounted } from 'vue';
import { RightOutlined } from '@ant-design/icons-vue';
import CheckBoxWithTitle from '@/components/CheckBoxWithTitle.vue';
import CheckBox from '@/components/CheckBox.vue';
import { getCheckoutOptionsArray } from '@/common/options.js';

// Props definition
const props = defineProps({
  conditions: {
    type: Array,
    required: true
  },
  advice: {
    type: String,
    required: true
  }
});

// Inject current slice part
const currentSlicePart = inject('currentSlicePart', ref('stomach'));

// Local copy of conditions
const localConditions = ref([...props.conditions]);

// Cache for options
const optionsCache = ref({});

// Get options with cache
const getOptions = (optionsKey) => {
  const part = currentSlicePart.value;
  const cacheKey = `${optionsKey}_${part}`;

  if (optionsCache.value[cacheKey]) {
    return optionsCache.value[cacheKey];
  }

  const options = getCheckoutOptionsArray(optionsKey, part);
  optionsCache.value[cacheKey] = options;
  return options;
};

// Helper to determine if binary
const isBinary = (condition) => {
  // If componentType is explicitly CheckBox, treat as binary (like 'mac')
  if (condition.componentType === 'CheckBox') return true;
  
  // Otherwise, check options length. If 2 options and not resultOptions (which has 4), maybe binary?
  // But 'highoptions' has 3. 'resultOptions' has 4.
  // 'yinyangOptions' has 2.
  // Usually SingleRadio means List. CheckBox means Binary.
  return false;
};

const handleListSelection = (index, optValue, newValue) => {
  // CheckBoxWithTitle toggles between optValue and null.
  // newValue will be optValue (if selecting) or null (if deselecting).
  
  // If selecting (newValue == optValue), we set the condition value to optValue.
  // If deselecting (newValue == null), we set condition value to null/0/empty.
  // Wait, what is the 'empty' value for this condition?
  // conditions usually have a defaultValue (e.g. 0 or '').
  
  if (newValue === optValue) {
    localConditions.value[index].value = optValue;
  } else {
    // Deselected. Revert to default? Or null?
    // Let's set to null for now, or 0 if it was number.
    // Most options use 0 as 'None' or 'Negative'.
    localConditions.value[index].value = 0; // Assuming 0 is safe default
  }
};

// Watch props.conditions
watch(() => props.conditions, (newConditions) => {
  localConditions.value = [...newConditions];
}, { deep: true });

// Watch currentSlicePart
watch(() => currentSlicePart.value, (newPart) => {
  optionsCache.value = {};
  localConditions.value = [...localConditions.value];
}, { immediate: true });

// Preload options on mount
onMounted(() => {
  if (props.conditions) {
    props.conditions.forEach(condition => {
      if (condition.options) {
        getOptions(condition.options);
      }
    });
  }
});

// Emits
const emit = defineEmits(['update:advice', 'save-and-view', 'next-slice', 'toggle-collapse']);

// Computed advice
const adviceValue = computed({
  get: () => props.advice,
  set: (val) => emit('update:advice', val)
});

// Handlers
const onSaveAndView = () => {
  emit('save-and-view');
};

const onNextSlice = () => {
  emit('next-slice');
};

const onToggleCollapse = () => {
  emit('toggle-collapse');
};
</script>

<style scoped>
.result-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  pointer-events: auto; /* Ensure interaction */
}

.cardcommon {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: visible; /* For the collapse button */
}

.panel-header {
  margin-bottom: 10px;
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

.l-c-text {
  font-size: 16px;
  color: #333;
  font-weight: bold;
}

.row-css {
  margin-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 10px;
}

.choice_text {
  font-size: 14px;
  color: #333;
}

.label-wrapper {
  display: flex;
  align-items: center;
  gap: 5px;
}

.ai-label {
  background-color: #37AE2F;
  color: white;
  font-size: 10px;
  padding: 0 4px;
  border-radius: 4px;
  line-height: 1.5;
}

.radio-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.radio-item {
  /* margin-right: 10px; */
}

.control-circle2 {
  position: absolute;
  left: -15px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  color: #666;
}

.control-circle2:hover {
  color: #1890ff;
}

.action-buttons {
  display: flex;
  justify-content: space-around;
  margin-top: 15px;
}

.save-btn {
  border-radius: 20px;
  padding-left: 20px;
  padding-right: 20px;
}

.next-btn {
  color: #666;
}

/* Custom scrollbar for the panel */
.scroll-container::-webkit-scrollbar {
  width: 4px;
}
.scroll-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 2px;
}
</style>