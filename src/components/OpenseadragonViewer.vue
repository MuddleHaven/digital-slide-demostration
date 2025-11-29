<template>
  <div class="osd-placeholder">
    <div class="osd-content">
      <h2>Openseadragon Viewer Placeholder</h2>
      <p>Slide ID: {{ slideId }}</p>
      <p>Status: {{ aiResult ? 'AI Analyzed' : 'Waiting...' }}</p>
      <!-- Future implementation of OSD, Annotations, Heatmaps here -->
    </div>
  </div>
</template>

<script setup>
defineProps({
  slideId: String,
  aiResult: Object
});
</script>

<style scoped>
.osd-placeholder {
  width: 100%;
  height: 100%;
  background-color: #e0e0e0;
  display: flex;
  justify-content: center;
  align-items: center;
}
.osd-content {
  text-align: center;
  color: #666;
}
</style>
