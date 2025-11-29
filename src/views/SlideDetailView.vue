<template>
  <div class="slide-detail-container">
    <a-row :gutter="0" style="height: 100%">
      <!-- Left Sidebar: Slide List -->
      <a-col :span="leftSpan" class="column-container">
        <SlideListSide
          :slices="slideList"
          :active-index="currentIndex"
          pannel="整体结果"
          :options="[{ value: '整体结果', label: '整体结果' }, { value: '整体质量', label: '整体质量' }]"
          :collapsed="leftCollapsed"
          @select-slice="selectSlide"
          @toggle-collapse="toggleLeft"
          @update-pannel="handlePannelChange"
        />
      </a-col>

      <!-- Center: Openseadragon Viewer -->
      <a-col :span="centerSpan" class="column-container center-column">
        <div class="viewer-wrapper">
           <OpenseadragonViewer 
             :slide-id="currentSlide?.id" 
             :ai-result="resultData.aiResult" 
           />
           <!-- Overlays for Reports -->
           <ReportDialog 
             v-model:visible="resultVisible" 
             title="病理图像处理结果"
             :slice-no="currentSlide?.no"
             :process-time="currentSlide?.processTime"
             @save="saveResultData"
           >
             <!-- Result Content -->
             <div>Result Details...</div>
           </ReportDialog>

           <ReportDialog 
             v-model:visible="qualityVisible" 
             title="质控评价结果"
             :slice-no="currentSlide?.no"
             :process-time="currentSlide?.processTime"
             @save="saveQualityData"
           >
              <!-- Quality Content -->
              <div>Quality Details...</div>
           </ReportDialog>
        </div>
      </a-col>

      <!-- Right Sidebar: Panels -->
      <a-col :span="rightSpan" class="column-container" v-show="!rightCollapsed">
        <div class="right-panel-wrapper">
           <component 
             :is="currentPanelComponent"
             v-bind="currentPanelProps"
             @update:advice="resultData.advice = $event"
             @change-quality="handleQualityChange"
             @save-and-view="handleSaveAndView"
             @next-slice="nextSlide"
           />
           
           <!-- Toggle Button for Right Panel (Absolute positioned usually, or inside) -->
           <!-- Reusing the style from reference where it might be inside the card -->
        </div>
      </a-col>
      
      <!-- Right Toggle Button (Floating if collapsed) -->
      <div v-if="rightCollapsed" class="right-toggle-btn" @click="toggleRight">
        <span>&lt;</span>
      </div>
    </a-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, provide } from 'vue';
import { useSlideDetail } from '@/composables/use-slide-detail';
import { useSlideResult } from '@/composables/use-slide-result';
import { useSlideQuality } from '@/composables/use-slide-quality';

// Components
import SlideListSide from '@/components/slide/SlideListSide.vue';
import ResultPanel from '@/components/slide/ResultPanel.vue';
import QualityPanel from '@/components/slide/QualityPanel.vue';
import OpenseadragonViewer from '@/components/OpenseadragonViewer.vue';
import ReportDialog from '@/components/slide/ReportDialog.vue';

// Composables
const { 
  slideList, currentIndex, currentSlide, 
  leftSpan, centerSpan, rightSpan, leftCollapsed, rightCollapsed,
  initSlideList, selectSlide, nextSlide, toggleLeft, toggleRight 
} = useSlideDetail();

const { resultData, resultVisible, loadResult, saveResult } = useSlideResult();
const { qualityData, qualityVisible, loadQuality, saveQuality } = useSlideQuality();

const activePanel = ref('result'); // 'result' or 'quality'

// Provide current slice part to children
const currentSlicePart = computed(() => currentSlide.value?.collectionArea || 'stomach');
provide('currentSlicePart', currentSlicePart);

// Computed for Dynamic Component
const currentPanelComponent = computed(() => {
  return activePanel.value === 'result' ? ResultPanel : QualityPanel;
});

const currentPanelProps = computed(() => {
  if (activePanel.value === 'result') {
    return {
      conditions: resultData.value.conditions,
      advice: resultData.value.advice
    };
  } else {
    return {
      quality: qualityData.value.quality,
      aiQuality: qualityData.value.aiQuality,
      qualities: [{value:'优',label:'优'},{value:'良',label:'良'},{value:'中',label:'中'},{value:'差',label:'差'}],
      ranseErrors: qualityData.value.ranseErrors,
      qiepianErrors: qualityData.value.qiepianErrors,
      makepianErrors: qualityData.value.makepianErrors,
      saomiaoErrors: qualityData.value.saomiaoErrors
    };
  }
});

// Handlers
const handlePannelChange = (val) => {
  if (val === '整体结果') activePanel.value = 'result';
  else activePanel.value = 'quality';
};

const handleQualityChange = (val) => {
  qualityData.value.quality = val; // Update local state
};

const handleSaveAndView = () => {
  if (activePanel.value === 'result') {
    resultVisible.value = true;
  } else {
    qualityVisible.value = true;
  }
};

const saveResultData = () => {
  saveResult(currentSlide.value.id, { 
    recommendation: resultData.value.advice 
    // Add other fields
  });
};

const saveQualityData = () => {
  saveQuality(currentSlide.value.id, {
    overallQuality: qualityData.value.quality
    // Add other fields
  });
};

// Watchers
watch(currentSlide, (newVal) => {
  if (newVal) {
    loadResult(newVal.id, newVal.collectionArea);
    loadQuality(newVal.id);
  }
});

// Lifecycle
onMounted(() => {
  initSlideList();
});
</script>

<style scoped>
.slide-detail-container {
  height: 100vh;
  overflow: hidden;
  background: #f0f2f5;
}
.column-container {
  height: 100%;
  overflow: hidden;
  transition: all 0.3s;
}
.center-column {
  position: relative;
  border-left: 1px solid #ddd;
  border-right: 1px solid #ddd;
}
.viewer-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}
.right-panel-wrapper {
  padding: 10px;
  height: 100%;
  overflow-y: auto;
  background: white;
}
.right-toggle-btn {
  position: absolute;
  right: 0;
  top: 50%;
  width: 20px;
  height: 40px;
  background: white;
  border: 1px solid #ddd;
  border-right: none;
  border-radius: 4px 0 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
}
</style>
