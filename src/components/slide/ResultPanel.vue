<template>
  <div>
    <!-- Top Panel: Checkbox List -->
    <a-card class="panel-card">
      <div class="panel-title">处理面板</div>
      <div class="panel-content">
        <div v-for="(condition, index) in conditions" :key="index" class="condition-row">
          <div class="condition-label">
            {{ condition.text }}
            <a-tag v-if="condition.AiAnalyze == 5" color="blue" class="ai-tag">AI</a-tag>
          </div>
          <div class="condition-value">
            <a-radio-group v-if="condition.componentType === 'SingleRadio'" v-model:value="localConditions[index].value" :disabled="condition.disabled">
              <a-radio v-for="opt in getOptions(condition.options)" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </a-radio>
            </a-radio-group>
            <a-checkbox-group v-else v-model:value="localConditions[index].value" :disabled="condition.disabled">
              <a-checkbox v-for="opt in getOptions(condition.options)" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </a-checkbox>
            </a-checkbox-group>
          </div>
        </div>
      </div>
    </a-card>

    <!-- Bottom Panel: Advice and Actions -->
    <a-card class="panel-card" style="margin-top: 10px;">
      <div class="panel-title">辅助建议</div>
      <div class="panel-content">
        <a-textarea v-model:value="adviceValue" placeholder="请填写辅助建议" :rows="4" />
      </div>
      <div class="action-buttons">
        <a-button type="primary" @click="onSaveAndView">保存并浏览</a-button>
        <a-button @click="onNextSlice">下一例</a-button>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue';
import { getCheckoutOptionsArray } from '@/common/options.js';

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

const emit = defineEmits(['update:advice', 'save-and-view', 'next-slice']);
const currentSlicePart = inject('currentSlicePart', ref('stomach'));

const localConditions = ref([...props.conditions]);

const getOptions = (optionsKey) => {
  return getCheckoutOptionsArray(optionsKey, currentSlicePart.value);
};

watch(() => props.conditions, (newVal) => {
  localConditions.value = newVal;
}, { deep: true });

const adviceValue = computed({
  get: () => props.advice,
  set: (val) => emit('update:advice', val)
});

const onSaveAndView = () => emit('save-and-view');
const onNextSlice = () => emit('next-slice');
</script>

<style scoped>
.panel-card {
  margin-bottom: 10px;
  border-radius: 8px;
}
.panel-title {
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 16px;
}
.panel-content {
  max-height: 50vh;
  overflow-y: auto;
}
.condition-row {
  margin-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 10px;
}
.condition-label {
  font-weight: 500;
  margin-bottom: 5px;
}
.ai-tag {
  margin-left: 5px;
  font-size: 10px;
  line-height: 16px;
}
.action-buttons {
  display: flex;
  justify-content: space-around;
  margin-top: 15px;
}
</style>
