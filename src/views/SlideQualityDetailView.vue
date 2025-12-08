<template>
  <div class="relative w-screen h-screen overflow-hidden bg-black">
    <!-- Openseadragon Viewer (Full Screen) -->
    <div class="absolute top-0 left-0 w-full h-full z-1">
      <OpenseadragonViewer :slide-id="currentSlide?.id" 
      :detail="currentSlide" 
      :is-quality="true" 
      :left-sidebar-width="leftCollapsed ? 0 : 250"
      :right-sidebar-width="rightCollapsed ? 0 : 350"
    />
    </div>

    <!-- Left Sidebar: Floating Slide List -->
    <div class="absolute top-5 left-5 z-101 pointer-events-auto">
      <a-button type="primary" shape="circle" size="large" @click="goBack">
        <template #icon>
          <ArrowLeftOutlined />
        </template>
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
    <div class="absolute top-5 right-5 bottom-5 z-100 pointer-events-none" :class="{ '!right-0': rightCollapsed }">
      <div class="pointer-events-auto h-full transition-all duration-300"
        :style="{ width: rightCollapsed ? '0px' : '350px' }">
        <div v-if="!rightCollapsed" class="h-full">
          <QualityPanel v-if="pannel === '整体质量'" :quality="qualityData.quality" :ai-quality="qualityData.aiQuality"
            :qualities="[{ label: '合格', value: 0 }, { label: '不合格', value: 10 }]"
            :ranse-errors="qualityData.ranseErrors" :qiepian-errors="qualityData.qiepianErrors"
            :saomiao-errors="qualityData.saomiaoErrors" :label="currentSlide?.no || ''"
            @change-quality="(val) => qualityData.quality = val" @save-and-view="handleSaveQuality"
            @next-slice="handleNext" @toggle-collapse="toggleRight" @update-quality-areas="handleQualityAreasUpdate" />
        </div>
        <div v-if="rightCollapsed" class="absolute right-5 top-1/2 -translate-y-1/2 z-101 pointer-events-auto">
          <div
            class="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center cursor-pointer text-gray-600 hover:text-blue-500"
            @click="toggleRight">
            <LeftOutlined />
          </div>
        </div>
      </div>
    </div>
    <!-- Signature Dialog -->
    <SignatureDialog :visible="signatureDialogVisible" @update:visible="val => signatureDialogVisible = val"
      @success="handleSignatureSuccess" />

    <!-- Quality Report Dialog -->
    <QualityReportDialog v-model:visible="reportVisible" :slice-no="currentSlide?.no"
      :upload-time="currentSlide?.uploadtime || currentSlide?.uploadTime" :process-time="currentSlide?.processTime"
      :quality-data="qualityData" :save-loading="saveLoading" :export-loading="exportLoading" @save="handleReportSave"
      @download="handleReportDownload" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, provide } from 'vue';
import { useRouter } from 'vue-router';
import { LeftOutlined, ArrowLeftOutlined } from '@ant-design/icons-vue';
import { useSlideQualityDetail } from '@/composables/use-slide-quality-detail';
import { useSlideQuality } from '@/composables/use-slide-quality';
import { SlicePart } from '@/common/options.js';
import * as userApi from '@/service/user.js';
import * as sliceApi from '@/service/slice.js'; // Assuming slice API has quality related exports or we use quality specific service
import { message } from 'ant-design-vue';

// Components
import SlideListSide from '@/components/slide/SlideListSide.vue';
import QualityPanel from '@/components/slide/QualityPanel.vue';
import OpenseadragonViewer from '@/components/OpenseadragonViewer.vue';
import SignatureDialog from '@/components/commons/SignatureDialog.vue';
import QualityReportDialog from '@/components/slide/QualityReportDialog.vue';

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
} = useSlideQualityDetail();

const { qualityData, loadQuality, 
  saveQuality, updateQualityAreas } = useSlideQuality();

console.log('qualityData =============', qualityData.value);

const pannel = ref("整体质量");
const rightCollapsed = ref(false);

// 下拉选项
const options = ref([
  { value: '整体质量', label: '整体质量' },
]);

// Provide current slice part to children (if needed by Viewer or Panels, though QualityPanel might not strictly need it, it's safer to provide default)
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

const handleSaveQuality = async () => {
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

const handleReportSave = async () => {
  if (!currentSlide.value) return;

  try {
    saveLoading.value = true;
    // We can reuse the saveQuality function from composable!
    await saveQuality(currentSlide.value.id, qualityData.value);
    reportVisible.value = false;
  } catch (error) {
    // Error handled in saveQuality
  } finally {
    saveLoading.value = false;
  }
};

const handleReportDownload = async () => {
  if (!currentSlide.value) return;

  try {
    exportLoading.value = true;
    message.info("正在导出为pdf，请稍等...");

    // Prepare data for PDF export (using nested structure to match API)
    const data = qualityData.value;
    const frontToApi = (val) => val === '有' ? 10 : 0;
    const formatVal = (frontVal) => JSON.stringify({ value: frontToApi(frontVal) });

    const payload = {
      sliceId: currentSlide.value.id,
      category: {
        type: 2,
        totalResult: data.quality === '不合格' ? 10 : 0,
      }
    };

    // Stain
    if (data.ranseErrors[0]) payload.category.stain = formatVal(data.ranseErrors[0].value);

    // Blur
    if (data.saomiaoErrors[0]) payload.category.blur = formatVal(data.saomiaoErrors[0].value);

    // Qiepian
    const qiepianMap = {
      '褶皱折叠': 'fold',
      '组织空窗': 'tinyHole',
      '封片气泡': 'bubbleFeng',
      '刀痕损伤': 'cut',
      '异物污染': 'shadow'
    };
    data.qiepianErrors.forEach(err => {
      const apiKey = qiepianMap[err.title];
      if (apiKey) payload.category[apiKey] = formatVal(err.value);
    });

    const res = await sliceApi.exportQCPDF(payload);
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
  handleSaveQuality();
};

const handleQualityAreasUpdate = (areas) => {
  updateQualityAreas({ type: 'manual', areas });
};

const handleNext = () => {
  if (currentIndex.value < slideList.value.length - 1) {
    selectSlide(currentIndex.value + 1);
  }
};

// Watchers
watch(currentSlide, (newVal) => {
  if (newVal) {
    // Only load quality data, skip result/aiResult
    loadQuality(newVal.id);
  }
});

// Lifecycle
onMounted(() => {
  initSlideList();
});
</script>
