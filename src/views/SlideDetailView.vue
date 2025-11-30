<template>
  <div class="slide-detail-container">
    <!-- Openseadragon Viewer (Full Screen) -->
    <div class="viewer-wrapper">
      <OpenseadragonViewer 
        :slide-id="currentSlide?.id" 
        :ai-result="resultData.aiResult" 
        :detail="currentSlide"
      />
    </div>

    <!-- Left Sidebar: Floating Slide List -->
    <div class="floating-sidebar">
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, provide } from 'vue';
import { useSlideDetail } from '@/composables/use-slide-detail';
import { useSlideResult } from '@/composables/use-slide-result';
import { useSlideQuality } from '@/composables/use-slide-quality';

// Components
import SlideListSide from '@/components/slide/SlideListSide.vue';
import OpenseadragonViewer from '@/components/OpenseadragonViewer.vue';

// Composables
const { 
  slideList, currentIndex, currentSlide, 
  leftCollapsed, toggleLeft,
  initSlideList, selectSlide
} = useSlideDetail();

const { resultData, loadResult } = useSlideResult();
const { loadQuality } = useSlideQuality();

// Provide current slice part to children
const currentSlicePart = computed(() => currentSlide.value?.collectionArea || 'stomach');
provide('currentSlicePart', currentSlicePart);

// Handlers
const handlePannelChange = (val) => {
  console.log("Panel changed to:", val);
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
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #000; /* Viewer background usually dark */
}

.viewer-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.floating-sidebar {
  position: absolute;
  top: 20px;
  left: 20px;
  bottom: 20px;
  z-index: 100;
  /* Width is handled by the child component, but we can set a max/min here if needed */
  pointer-events: none; /* Allow clicking through transparent areas if any */
}

/* Re-enable pointer events for the sidebar itself */
.floating-sidebar > * {
  pointer-events: auto;
}
</style>
