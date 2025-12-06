<template>
  <div class="relative w-screen h-screen overflow-hidden bg-black">
    <!-- Openseadragon Viewer (Full Screen) -->
    <div class="absolute top-0 left-0 w-full h-full z-1">
      <OpenseadragonViewer :slide-id="currentSlide?.id" :ai-result="resultData.aiResult" :detail="currentSlide" />
    </div>

    <!-- Left Sidebar: Floating Slide List -->
    <div class="absolute top-5 left-5 bottom-5 z-100 pointer-events-none">
      <div class="pointer-events-auto h-full">
        <SlideListSide :slices="slideList" :active-index="currentIndex" :pannel="pannel" :options="options"
          :collapsed="leftCollapsed" @select-slice="selectSlide" @toggle-collapse="toggleLeft"
          @update-pannel="handlePannelChange" />
      </div>
    </div>

    <!-- Right Sidebar: result panel -->
    <div class="absolute top-5 right-5 bottom-5 z-100 pointer-events-none" :class="{'!right-0': rightCollapsed}">
      <div class="pointer-events-auto h-full transition-all duration-300" :style="{ width: rightCollapsed ? '0px' : '350px' }">
        <div v-if="!rightCollapsed" class="h-full">
           <ResultPanel 
             v-if="pannel === '整体结果'"
             :conditions="resultConditions" 
             :advice="resultData.aiResult?.advice || ''"
             @update:advice="(val) => { if(resultData.aiResult) resultData.aiResult.advice = val }"
             @toggle-collapse="toggleRight"
             @save-and-view="handleSave"
             @next-slice="handleNext"
          />
          <QualityPanel
            v-else
            :quality="qualityData.quality"
            :ai-quality="qualityData.aiQuality"
            :qualities="[{label:'合格', value:'0'}, {label:'不合格', value:'10'}]"
            :ranse-errors="qualityData.ranseErrors"
            :qiepian-errors="qualityData.qiepianErrors"
            :saomiao-errors="qualityData.saomiaoErrors"
            :label="currentSlide?.no || ''"
            @change-quality="(val) => qualityData.quality = val"
            @save-and-view="handleSaveQuality"
            @next-slice="handleNext"
            @toggle-collapse="toggleRight"
            @update-quality-areas="handleQualityAreasUpdate"
          />
        </div>
        <div v-if="rightCollapsed" class="absolute right-5 top-1/2 -translate-y-1/2 z-101 pointer-events-auto">
            <div class="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center cursor-pointer text-gray-600 hover:text-blue-500" @click="toggleRight">
              <LeftOutlined />
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, provide } from 'vue';
import { useRouter } from 'vue-router';
import { LeftOutlined } from '@ant-design/icons-vue';
import { useSlideDetail } from '@/composables/use-slide-detail';
import { useSlideResult } from '@/composables/use-slide-result';
import { useSlideQuality } from '@/composables/use-slide-quality';
import { AllPartConditions, SlicePart } from '@/common/options.js';

// Components
import SlideListSide from '@/components/slide/SlideListSide.vue';
import ResultPanel from '@/components/slide/ResultPanel.vue';
import QualityPanel from '@/components/slide/QualityPanel.vue';
import OpenseadragonViewer from '@/components/OpenseadragonViewer.vue';

// Router
const router = useRouter();

// Composables
const {
  slideList, currentIndex, currentSlide,
  leftCollapsed, toggleLeft,
  initSlideList, selectSlide
} = useSlideDetail();

const { resultData, loadResult } = useSlideResult();
const { qualityData, loadQuality, saveQuality, loadAIQualityData, updateQualityAreas } = useSlideQuality();

const pannel = ref("整体结果");
const rightCollapsed = ref(false);

// 下拉选项
const options = ref([
  { value: '整体结果', label: '整体结果' },
  { value: '整体质量', label: '整体质量' },
]);

// Provide current slice part to children
const currentSlicePart = computed(() => {
  const collectionArea = currentSlide.value?.collectionArea || '胃';
  let part = SlicePart.stomach
  if (collectionArea === '胃') {
    part = SlicePart.stomach;
  } else if (collectionArea === '肺') {
    part = SlicePart.colon;
  } else if (collectionArea === '肠') {
    part = SlicePart.lung;
  }
  return part;
});
provide('currentSlicePart', currentSlicePart);

// Computed Conditions
const resultConditions = computed(() => {
  const part = currentSlicePart.value;
  return AllPartConditions[part];
});

// Handlers
const handlePannelChange = (val) => {
  pannel.value = val;
};

const toggleRight = () => {
  rightCollapsed.value = !rightCollapsed.value;
};

const goBack = () => {
  router.back();
};

const handleSave = () => {
  // Implement save logic
  console.log('Save and View clicked');
};

const handleSaveQuality = () => {
  saveQuality(currentSlide.value.id, qualityData.value);
};

const handleQualityAreasUpdate = (areas) => {
  updateQualityAreas({ type: 'manual', areas }); // Pass appropriate type if needed, or adjust composable
};

const handleNext = () => {
  // Implement next slice logic
  // Assuming sliceList and currentIndex are available
  if (currentIndex.value < slideList.value.length - 1) {
    selectSlide(currentIndex.value + 1);
  }
};

// Watchers
watch(currentSlide, (newVal) => {
  if (newVal) {
    loadResult(newVal.id, newVal.collectionArea);
    loadQuality(newVal.id);
    loadAIQualityData(newVal.id);
  }
});

// Lifecycle
onMounted(() => {
  initSlideList();
});
</script>

