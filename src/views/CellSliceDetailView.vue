<template>
  <div class="relative w-screen h-screen overflow-hidden bg-black">
    <div class="absolute top-0 left-0 w-full h-full z-1">
      <CellOpenseadragonViewer :slide-name="slideName" />
    </div>

    <div class="absolute top-5 left-5 z-101 pointer-events-auto">
      <a-button class="back-button" type="primary" shape="circle" size="large" @click="goBack">
        <template #icon><ArrowLeftOutlined /></template>
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeftOutlined } from '@ant-design/icons-vue';
import CellOpenseadragonViewer from '@/components/CellOpenseadragonViewer.vue';

const route = useRoute();
const router = useRouter();

const slideName = computed(() => route.params.slideName || null);

const goBack = () => {
  router.back();
};
</script>

<style scoped>
.back-button :deep(.ant-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.back-button :deep(.anticon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.back-button :deep(svg) {
  display: block;
}
</style>
