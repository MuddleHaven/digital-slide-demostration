<template>
  <div>
    <!-- Top Panel: Quality Control -->
    <a-card class="panel-card">
      <div class="panel-title">质控面板</div>
      <div class="panel-content">
        <!-- Overall Quality -->
        <div class="quality-row">
          <span>整体质量: </span>
          <a-radio-group :value="quality" @update:value="onChange">
             <a-radio-button v-for="q in qualities" :key="q.value" :value="q.value">
               {{ q.label }}
               <span v-if="aiQuality === q.value" class="ai-badge">AI</span>
             </a-radio-button>
          </a-radio-group>
        </div>

        <!-- Sections -->
        <QualitySection title="染色差异" :errors="ranseErrors" />
        <QualitySection title="切片异常" :errors="qiepianErrors" />
        <QualitySection title="制片不规范" :errors="makepianErrors" />
        <QualitySection title="扫描异常" :errors="saomiaoErrors" />
      </div>
    </a-card>

    <!-- Bottom Panel: Summary and Actions -->
    <a-card class="panel-card" style="margin-top: 10px;">
      <div class="panel-title">质控评价</div>
      <div class="panel-content summary-content">
        <div>整体质量: {{ quality || '未评定' }}</div>
        <!-- Summary list logic here similar to reference -->
      </div>
      <div class="action-buttons">
        <a-button type="primary" @click="onSaveAndView">保存并浏览</a-button>
        <a-button @click="onNextSlice">下一例</a-button>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import QualitySection from './QualitySection.vue';

const props = defineProps({
  quality: String,
  aiQuality: String,
  qualities: Array,
  ranseErrors: Array,
  qiepianErrors: Array,
  makepianErrors: Array,
  saomiaoErrors: Array
});

const emit = defineEmits(['change-quality', 'save-and-view', 'next-slice']);

const onChange = (e) => {
  emit('change-quality', e); // Antdv RadioGroup emits value directly or event? usually event.target.value but v-model handles it.
  // Here we use :value and @update:value for manual control if needed, or just direct emit
};

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
.quality-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 10px;
}
.ai-badge {
  font-size: 10px;
  color: red;
  vertical-align: super;
}
.action-buttons {
  display: flex;
  justify-content: space-around;
  margin-top: 15px;
}
.summary-content {
  font-size: 13px;
  color: #666;
}
</style>
