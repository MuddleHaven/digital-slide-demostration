<template>
  <div class="osd-container">
    <div :id="containerId" class="openseadragon"></div>
    <div class="controls-overlay">
      <div id="navigatorDiv" class="navigator"></div>
    </div>
    <CellResultPanel :viewer="viewerInstance" :cell-data="cellData" />
  </div>
</template>

<script setup>
import { computed, onMounted, watch, defineProps, markRaw } from 'vue';
import { useCellOpenseadragon } from '@/composables/use-cell-openseadragon';
import CellResultPanel from '@/components/CellResultPanel.vue';

const props = defineProps({
  slideName: {
    type: String,
    default: null
  },
});

const containerId = 'cell-openseadragon-viewer';
const { viewer, currentCellSlideData, initViewer, openCellSlide } = useCellOpenseadragon(containerId);

const normalizedSlideName = computed(() => props.slideName || null);
const viewerInstance = computed(() => (viewer.value ? markRaw(viewer.value) : null));
const cellData = computed(() => currentCellSlideData.value || null);

onMounted(() => {
  initViewer();
  if (normalizedSlideName.value) {
    openCellSlide(normalizedSlideName.value);
  }
});

watch(normalizedSlideName, (newName) => {
  if (newName) {
    openCellSlide(newName);
  }
});
</script>

<style scoped>
.osd-container {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #FFFFFF;
}

.openseadragon {
  width: 100%;
  height: 100%;
  z-index: 2;
  position: absolute;
  top: 0;
  left: 0;
}

.controls-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  z-index: 4;
  gap: 10px;
}

.navigator {
  width: 232px;
  height: 178px;
  border-radius: 25px;
  border: 2px solid #FFFFFF;
  pointer-events: auto;
}
</style>
