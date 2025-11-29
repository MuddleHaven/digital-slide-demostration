<template>
  <div style="position: absolute;width: 100%;height: 100%;">
    <a-row :gutter="4">
      <!-- 左侧栏：切片列表 -->
      <a-col :span="getLeftSpan()">
        <a-card class="left_card cardcommon">
          <SliceList :slices="tableData" :active-index="curIndex" :pannel="pannel" :options="options"
            @select-slice="getOpenseaImg" @delete-slice="deleteSlice" @toggle-collapse="changeLeftCard(false)"
            @update-pannel="(value) => pannel = value" />
        </a-card>
      </a-col>

      <!-- 中间区域：图像查看器 -->
      <a-col :span="getCenterSpan()" class="center-card">
        <div class="image-viewer-container" style="position: relative;">
          <MaskResult ref="childRef" v-if="pannel == '整体结果'" />
          <MaskQuality ref="qualityref" v-else />
        </div>
      </a-col>

      <!-- 右侧栏：控制面板 -->
      <a-col :span="getRightSpan()">
        <!-- 根据当前选择的面板类型显示不同内容 -->
        <template v-if="pannel == '整体结果'">
          <ResultPannel :key="currentSlicePart" :conditions="simplifiedIllCondition" :advice="advice"
            @update:advice="advice = $event" @save-and-view="openMaskRes" @next-slice="gotoNext"
            @toggle-collapse="changeRightCard(false)" />
        </template>
        <template v-else>
          <QualityPanel :quality="currentQualityData.AllQuality" :ai-quality="currentQualityData.AIQuality"
            :qualities="qualities" :ranse-errors="currentQualityData.ranseError"
            :qiepian-errors="currentQualityData.qiepianError" :makepian-errors="currentQualityData.makepianError"
            :saomiao-errors="currentQualityData.saomiaoError" :label="label" @change-quality="handleQualityChange"
            @save-and-view="openMaskQuality" @next-slice="gotoNext" @toggle-collapse="changeRightCard(false)"
            @update-quality-areas="handleQualityAreasUpdate" />
        </template>
      </a-col>
    </a-row>
  </div>

  <!-- 签名对话框 -->
  <SignatureDialog :visible="signatureDialogVisible" :handle-click="handleSignatureUpload" />

  <!-- 图像查看组件 -->
  <Openseadragon ref="openseaRef" :ai-result="aiResult" />
</template>

<script setup>
import { ref, onMounted, computed, watch, createVNode, provide } from 'vue';
import { useLayoutStore } from '../../stores/LayoutStore.js';
import { storeToRefs } from 'pinia';
import * as sliceAPI from '../../api/slice.js'
import { useSliceDataStore } from '../../stores/SiceDataStore.js'
import { useOptionsStore } from '../../stores/OptionsStore.js';
import { message, Modal } from 'ant-design-vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import * as userApi from '../../api/user.js'

// 导入组件
import SliceList from '../../components/slice/SliceList.vue';
import ResultPanel from '../../components/slice/ResultPanel.vue';
import QualityPanel from '../../components/slice/QualityPanel.vue';
import MaskResult from '../../components/MaskResult.vue';
import Openseadragon from '../../components/Openseadragon.vue';
import MaskQuality from '../../components/MaskQuality.vue';
import SignatureDialog from '../../components/commons/SignatureDialog.vue';
import { SlicePart } from '../../utils/options.js';
import { useQualityControl } from '../../composables/useQualityControl.js';

// 状态管理
const LayoutStore = useLayoutStore();
const { isfull, isLeftCard, AIDetect } = storeToRefs(LayoutStore);

const { changeLeftCard, getLeftSpan, getCenterSpan, getRightSpan, changeRightCard } = LayoutStore;

// 注意：我们不再使用全局的 PannelStore，而是使用本地的质量控制 composable

// 质量控制管理
const {
  currentQualityData,
  currentAIQualityData,
  switchToSlice,
  loadQualityData,
  loadAIQualityData,
  updateQuality,
  updateQualityAreas: handleQualityAreasUpdate
} = useQualityControl();

// 添加一个响应式的 currentSlicePart 变量
const currentSlicePart = ref(SlicePart.stomach);

// 提供给子组件使用
provide('currentSlicePart', currentSlicePart);

// 创建一个方法用于更新切片部位
const updateSlicePart = (collectionArea) => {
  if (!collectionArea) return;
  if (typeof collectionArea !== 'string') {
    return;
  }

  // 根据 collectionArea 确定部位
  const area = String(collectionArea).toLowerCase();
  let newPart = SlicePart.stomach; // 默认胃部

  if (area.includes('lung') || area.includes('肺')) {
    newPart = SlicePart.lung;
  } else if (area.includes('colon') || area.includes('肠')) {
    newPart = SlicePart.colon;
  } else if (area.includes('stomach') || area.includes('胃')) {
    newPart = SlicePart.stomach;
  }

  // 更新响应式变量
  currentSlicePart.value = newPart;

  // 通知 OptionsStore 更新部位
  if (OptionsStore.setSlicePart) {
    OptionsStore.setSlicePart(currentSlicePart.value);

    setTimeout(() => {
      getAIResult().then(() => {
        // AI result updated after slice part change
      }).catch(() => {
        // Error updating AI result
      });
    }, 200);
  }
};

const OptionsStore = useOptionsStore();
const { simplifiedIllCondition } = OptionsStore;
const { advice } = storeToRefs(OptionsStore);

// 数据
const tableData = ref([]); // 左侧列表数据
const SliceDataStore = useSliceDataStore();
const { curIndex, DiagnosisId, QualityId, sliceList } = storeToRefs(SliceDataStore);
const signatureDialogVisible = ref(false);
const childRef = ref(null);
const qualityref = ref(null);
const openseaRef = ref(null);
const pannel = ref("整体结果");

// 下拉选项
const options = ref([
  { value: '整体质量', label: '整体质量' },
  { value: '整体结果', label: '整体结果' },
]);

// 质量选项
const qualities = [
  { value: '优', label: '优' },
  { value: '良', label: '良' },
  { value: '中', label: '中' },
  { value: '差', label: '差' }
];

// 计算当前切片标签
const label = computed(() => {
  return tableData.value[curIndex.value]?.no;
});

// 方法
// 初始化切片列表信息
const initInfo = async () => {
  // console.log("initInfo", sliceList.value);

  tableData.value = sliceList.value.map((data) => ({
    id: data.id,
    no: data.no,
    disease: data.diseaseName,
    status: data.status,
    time: data.time,
    img: data.img ? data.img.replace(/\\/g, '/') : 'src/assets/nullImage.jpg',
    uploadtime: data.uploadtime,
    ...data
  }));
}

// 获取切片诊断结果
const getResult = async () => {
  OptionsStore.clearOptions();
  let res = await sliceAPI.getResult(sliceList.value[curIndex.value].id);
  if (res.data != null) {
    OptionsStore.updateOptions(res);
    DiagnosisId.value = res.data.id;
  }
}

const aiResult = ref(null);

// 获取AI诊断结果
const getAIResult = async () => {
  OptionsStore.clearAIOptions();
  let res = await sliceAPI.getAIResult(sliceList.value[curIndex.value].id);
  if (res.data != null) {
    OptionsStore.updateAIOptions(res);
    AIDetect.value = true;
    aiResult.value = res.data;
  }
}

// 处理质量控制变更
const handleQualityChange = (newQuality) => {
  const currentSliceId = sliceList.value[curIndex.value].id;
  updateQuality(currentSliceId, newQuality);
};

// 获取质量控制结果（使用 composable）
const getQuality = async () => {
  const currentSliceId = sliceList.value[curIndex.value].id;
  const result = await loadQualityData(currentSliceId);
  if (result.success && result.id) {
    QualityId.value = result.id;
  }
};

// 获取AI质量控制结果（使用 composable）
const getAIQuality = async () => {
  const currentSliceId = sliceList.value[curIndex.value].id;
  const result = await loadAIQualityData(currentSliceId);
  if (result.success) {
    AIDetect.value = true;
  }
};

// getSingleSliceData
const getSingleSliceData = async (id) => {
  if (!id) return;
  let res = await sliceAPI.getSingleSliceData(id);
  const sliceData = res.data
  if (sliceData && sliceData.slice) {
    // 更新切片部位 胃、肺、肠 
    // 转化为slicePart
    let collectionArea = sliceData.slice.collectionArea;
    const tissueType = import.meta.env.VITE_APP_TISSUE_TYPE
    if (tissueType == 'colon') {
      collectionArea = '肠'
    } else if (tissueType == 'liver') {
      collectionArea = '肝'
    } else if (tissueType == 'lung') {
      collectionArea = '肺'
    } else if (tissueType == 'stomach') {
      collectionArea = '胃'
    }
    updateSlicePart(collectionArea);
  }
};
const gotoNext = () => {
  if (curIndex.value < sliceList.value.length - 1) {
    const nextIndex = curIndex.value + 1;
    curIndex.value = nextIndex;
    const id = sliceList.value[nextIndex].id;
    openseaRef.value.getDetailSliceData(id);
  }
  else {
    message.warning("当前已是最后一例");
  }
}

// 加载选中切片的图像
const getOpenseaImg = (index) => {
  if (curIndex.value == index) return;
  // notify curIndex change
  curIndex.value = index;
  const id = sliceList.value[curIndex.value].id;
  openseaRef.value.getDetailSliceData(id);
}

// 从列表中删除切片
const deleteSlice = (index) => {
  if (sliceList.value.length == 1) {
    message.warn("仅剩一张切片无法从列表移除！");
  } else {
    Modal.confirm({
      title: '提示',
      icon: createVNode(ExclamationCircleOutlined),
      content: '你确认要从当前列表移除该切片吗？',
      okText: '确认',
      cancelText: '取消',
      centered: true,
      onOk() {
        sliceList.value.splice(index, 1);
        initInfo();
        if (index == 0) getOpenseaImg(index);
        else getOpenseaImg(index - 1);
      }
    });
  }
}

// 打开签名对话框
const openSignatureDialog = () => {
  signatureDialogVisible.value = true;
};

// 处理签名上传
const handleSignatureUpload = () => {
  signatureDialogVisible.value = false;
};

// 打开结果查看
const openMaskRes = async () => {
  let res = await userApi.getElecNamePathAndDepartmentAndHospital();
  if (res.data.path == null || res.data.path == '') {
    message.info("请先上传个人签名");
    openSignatureDialog();
    return;
  }
  childRef.value.changeVis(true);
}

// 打开质量报告
const openMaskQuality = async () => {
  let res = await userApi.getElecNamePathAndDepartmentAndHospital();
  if (res.data.path == null || res.data.path == '') {
    message.info("请先上传个人签名");
    openSignatureDialog();
    return;
  }
  qualityref.value.changeVis(true);
}

// 生命周期
onMounted(() => {
  AIDetect.value = false;
  initInfo();
  getResult();
  getAIResult();
  getQuality();
  getAIQuality();
  getSingleSliceData(sliceList.value[curIndex.value].id);
});

// 监听当前切片索引变化，加载相应数据
watch(curIndex, () => {
  AIDetect.value = false;
  const currentSliceId = sliceList.value[curIndex.value].id;

  // 切换到新切片的质量控制数据
  switchToSlice(currentSliceId);

  // 加载其他数据
  getSingleSliceData(currentSliceId);
  getResult();
  getQuality();
  getAIQuality();
  getAIResult();
});

// 监听面板切换，控制质量轮廓的显示和隐藏
watch(pannel, async (newPannel) => {
  if (!openseaRef.value) return;

  if (newPannel === '整体质量') {
    // 切换到质量面板，显示质量轮廓
    try {
      const sliceId = sliceList.value[curIndex.value].id;
      const res = await sliceAPI.getAIQualityContours(sliceId);
      if (res.data) {
        const AIQualityContoursData = res.data;
        openseaRef.value.showQualityContours(AIQualityContoursData);
      }
    } catch (error) {
      console.error("获取切片数据失败:", error);
      return;
    }
  } else if (newPannel === '整体结果') {
    // 切换到结果面板，隐藏质量轮廓
    openseaRef.value.hideQualityContours();
  }
}, { immediate: false });
</script>

<style src="../../assets/styles/sliceDetail.scss" lang="scss" scoped></style>