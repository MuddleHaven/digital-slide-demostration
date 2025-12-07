<template>
  <div class="relative w-screen h-screen overflow-hidden bg-black">
    <!-- Openseadragon Viewer (Full Screen) -->
    <div class="absolute top-0 left-0 w-full h-full z-1">
      <OpenseadragonViewer :slide-id="currentSlide?.id" :ai-result="resultData.aiResult" :detail="currentSlide" />
    </div>

    <!-- Left Sidebar: Floating Slide List -->
    <div class="absolute top-5 left-5 z-101 pointer-events-auto">
      <a-button type="primary" shape="circle" size="large" @click="goBack">
        <template #icon><ArrowLeftOutlined /></template>
      </a-button>
    </div>

    <div class="absolute top-20 left-5 bottom-5 z-100 pointer-events-none">
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
             :advice="resultData.advice"
             @update:advice="(val) => { resultData.advice = val }"
             @toggle-collapse="toggleRight"
             @save-and-view="handleSave"
             @next-slice="handleNext"
          />
        </div>
        <div v-if="rightCollapsed" class="absolute right-5 top-1/2 -translate-y-1/2 z-101 pointer-events-auto">
            <div class="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center cursor-pointer text-gray-600 hover:text-blue-500" @click="toggleRight">
              <LeftOutlined />
            </div>
        </div>
      </div>
    </div>
    <!-- Signature Dialog -->
    <SignatureDialog :visible="signatureDialogVisible" @update:visible="val => signatureDialogVisible = val" @success="handleSignatureSuccess" />

    <!-- Report Dialog (Mask Result replacement) -->
    <ReportDialog 
      v-model:visible="reportVisible"
      :slice-no="currentSlide?.no"
      :upload-time="currentSlide?.uploadtime || currentSlide?.uploadTime"
      :process-time="currentSlide?.processTime"
      :conditions="resultData.conditions"
      :advice="resultData.advice"
      :slice-part="currentSlicePart"
      :save-loading="saveLoading"
      :export-loading="exportLoading"
      @save="handleReportSave"
      @download="handleReportDownload"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, provide } from 'vue';
import { useRouter } from 'vue-router';
import { LeftOutlined, ArrowLeftOutlined } from '@ant-design/icons-vue';
import { useSlideDetail } from '@/composables/use-slide-detail';
import { useSlideResult } from '@/composables/use-slide-result';
import { AllPartConditions, SlicePart } from '@/common/options.js';
import * as userApi from '@/service/user.js';
import * as sliceApi from '@/service/slice.js';
import { message } from 'ant-design-vue';

// Components
import SlideListSide from '@/components/slide/SlideListSide.vue';
import ResultPanel from '@/components/slide/ResultPanel.vue';
import OpenseadragonViewer from '@/components/OpenseadragonViewer.vue';
import SignatureDialog from '@/components/commons/SignatureDialog.vue';
import ReportDialog from '@/components/slide/ReportDialog.vue';

// Router
const router = useRouter();

// Refs
const signatureDialogVisible = ref(false);
const reportVisible = ref(false);
const saveLoading = ref(false);
const exportLoading = ref(false);

// Composables
const {
  slideList, currentIndex, currentSlide,
  leftCollapsed, toggleLeft,
  initSlideList, selectSlide
} = useSlideDetail();

const { resultData, loadResult, saveResult } = useSlideResult();

const pannel = ref("整体结果");
const rightCollapsed = ref(false);

// 下拉选项
const options = ref([
  { value: '整体结果', label: '整体结果' },
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
  // Use loaded conditions from resultData if available
  if (resultData.value && resultData.value.conditions && resultData.value.conditions.length > 0) {
    return resultData.value.conditions;
  }
  // Fallback to static default based on part
  const part = currentSlicePart.value;
  return AllPartConditions[part] || [];
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

const handleSave = async () => {
  if (!currentSlide.value) return;

  // Check for signature
  try {
    const res = await userApi.getElecNamePathAndDepartmentAndHospital();
    if (res.data.path == null || res.data.path == '') {
      message.info("请先上传个人签名");
      signatureDialogVisible.value = true;
      return;
    }
    
    // If signature exists, open ReportDialog
    reportVisible.value = true;
    
  } catch (error) {
    console.error("Check signature failed", error);
    message.error("无法验证签名信息");
  }
};

const prepareSaveData = () => {
  const data = {
    "sliceId": currentSlide.value.id,
    "recommendation": resultData.value.advice
  };
  
  if (resultData.value.conditions) {
    resultData.value.conditions.forEach(item => {
      data[item.key] = item.value;
    });
  }
  return data;
};

const handleReportSave = async () => {
  if (!currentSlide.value) return;
  
  try {
    saveLoading.value = true;
    const data = prepareSaveData();
    await saveResult(currentSlide.value.id, data);
    reportVisible.value = false;
  } catch (error) {
    // Error handled in saveResult or here
  } finally {
    saveLoading.value = false;
  }
};

const handleReportDownload = async () => {
  if (!currentSlide.value) return;

  try {
    exportLoading.value = true;
    message.info("正在导出为pdf，请稍等...");
    const data = prepareSaveData();
    // Add id for export if needed (usually diagnosis id)
    // If diagnosisId is not available, backend might create new or handle logic
    // We assume exportPDF takes same structure
    const res = await sliceApi.exportPDF(data);
    if (res.code === 200 && res.data) {
      window.open(res.data, '_blank');
    } else {
      message.error(res.msg || "导出失败");
    }
  } catch (error) {
    message.error("导出PDF失败：" + (error.message || "未知错误"));
  } finally {
    exportLoading.value = false;
  }
};

const handleSignatureSuccess = () => {
  // After signature upload success, try opening mask again
  handleSave();
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
  }
});

// Lifecycle
onMounted(() => {
  initSlideList();
});
</script>

