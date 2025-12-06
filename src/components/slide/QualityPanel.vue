<template>
  <div class="quality-panel">
    <!-- Top Panel: Quality Control -->
    <a-card class="right-up-card cardcommon">
      <div class="panel-header">
        <span class="l-c-text">质控面板</span>
      </div>
      
      <div class="scroll-container" style="height: 53vh; overflow-y: auto; padding-right: 5px;">
        <!-- Overall Quality Selection -->
        <div class="quality-selection-row">
          <span class="label-text">切片质量: </span>
          <div class="quality-options">
            <div 
              v-for="q in qualities" 
              :key="q.value" 
              class="quality-option"
              :class="{ 
                'active': quality === q.value,
                'active-pass': quality === '合格' && q.value === '合格',
                'active-fail': quality === '不合格' && q.value === '不合格'
              }"
              @click="onChange(q.value)"
            >
              <a-badge>
                <template #count>
                  <div class="Aistyle" v-if="aiQuality === q.value">AI</div>
                  <div v-else></div>
                </template>
                <span class="option-text">{{ q.label }}</span>
              </a-badge>
            </div>
          </div>
        </div>

        <!-- Sections -->
        <QualitySection 
          title="染色差异" 
          :errors="ranseErrors" 
          :all-options="allOptions"
          @update-quality-areas="(areas) => $emit('update-quality-areas', areas)"
        />
        
        <QualitySection 
          title="扫描异常" 
          :errors="saomiaoErrors" 
          :all-options="allOptions"
          @update-quality-areas="(areas) => $emit('update-quality-areas', areas)"
        />

        <QualitySection 
          title="切片异常" 
          :errors="qiepianErrors" 
          :all-options="allOptions"
          @update-quality-areas="(areas) => $emit('update-quality-areas', areas)"
        />
      </div>
      
      <div class="control-circle2" @click="onToggleCollapse">
        <RightOutlined />
      </div>
    </a-card>

    <!-- Bottom Panel: Summary and Actions -->
    <a-card class="right-down-card cardcommon" style="margin-top: 10px;">
      <div class="panel-header">
        <span class="l-c-text">质控评价</span>
      </div>
      <div class="res-card">
        <div style="height: 15vh; overflow-y: auto;">
          <QualitySummary 
            :label="label"
            :currentQuality="quality"
            :ranseErrors="ranseErrors"
            :qiepianErrors="qiepianErrors"
            :saomiaoErrors="saomiaoErrors"
          />
        </div>
      </div>
      <div class="action-buttons">
        <a-button type="primary" class="btn save-btn" @click="onSaveAndView">保存并浏览</a-button>
        <a-button class="btn next-btn" type="text" @click="onNextSlice">下一例</a-button>
      </div>
      <div class="control-circle2" @click="onToggleCollapse">
        <RightOutlined />
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { RightOutlined } from '@ant-design/icons-vue';
import QualitySection from './QualitySection.vue';
import QualitySummary from './QualitySummary.vue';
import { allOptions } from '@/common/options.js';

const props = defineProps({
  quality: String,
  aiQuality: String,
  qualities: {
    type: Array,
    default: () => [{label:'合格', value:'合格'}, {label:'不合格', value:'不合格'}]
  },
  ranseErrors: Array,
  qiepianErrors: Array,
  saomiaoErrors: Array,
  label: String
});

const emit = defineEmits(['change-quality', 'save-and-view', 'next-slice', 'toggle-collapse', 'update-quality-areas']);

const onChange = (val) => {
  emit('change-quality', val);
};

const onSaveAndView = () => emit('save-and-view');
const onNextSlice = () => emit('next-slice');
const onToggleCollapse = () => emit('toggle-collapse');
</script>

<style scoped>
.quality-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  pointer-events: auto;
}

.cardcommon {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: visible;
}

.panel-header {
  margin-bottom: 15px;
  font-weight: bold;
  font-size: 18px; /* Larger header */
  color: #333;
}

.l-c-text {
  font-size: 18px;
  color: #333;
  font-weight: bold;
}

.quality-selection-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 25px;
  padding: 0 10px;
}

.label-text {
  font-size: 14px;
  color: #666;
}

.quality-options {
  display: flex;
  background-color: #f5f5f5;
  border-radius: 20px;
  padding: 2px;
}

.quality-option {
  padding: 6px 20px;
  border-radius: 18px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
  position: relative;
}

.quality-option.active {
  font-weight: bold;
  color: white;
}

/* Pass state (Greenish if needed, but user image shows purple for fail) */
.quality-option.active-pass {
  background-color: #37AE2F; /* Green for pass */
}

/* Fail state (Purple as in user image) */
.quality-option.active-fail {
  background-color: #242BA0; /* Purple for fail */
}

.Aistyle {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 16px;
  height: 16px;
  background: #37AE2F;
  border-radius: 8px;
  border: 1px solid #FFFFFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  z-index: 10;
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

/* Custom scrollbar */
.scroll-container::-webkit-scrollbar {
  width: 4px;
}
.scroll-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 2px;
}
</style>