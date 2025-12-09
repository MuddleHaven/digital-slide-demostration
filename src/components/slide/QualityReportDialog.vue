<template>
  <a-modal
    :open="visible"
    :title="title"
    width="800px"
    centered
    @cancel="onClose"
    :footer="null"
    class="quality-report-modal"
  >
    <div class="report-card">
      <div class="report-title">{{ title }}</div>
      
      <!-- Hospital Info -->
      <a-row v-if="hospital" class="info-row">
        <a-col :span="24">
          <span class="label">医院：</span>
          <span class="value">{{ hospital }}</span>
        </a-col>
      </a-row>

      <!-- Basic Info -->
      <a-row class="info-row">
        <a-col :span="8">
          <span class="label">病理号：</span>
          <span class="value">{{ sliceNo }}</span>
        </a-col>
        <a-col :span="8">
          <span class="label">上传时间：</span>
          <span class="value">{{ uploadTime }}</span>
        </a-col>
        <a-col :span="8">
          <span class="label">处理时间：</span>
          <span class="value">{{ processTime }}</span>
        </a-col>
      </a-row>

      <div class="section-title">质控评价结果:</div>
      
      <!-- Content -->
      <div class="report-content">
        <div class="scroll-area">
          <!-- Overall Quality -->
          <div class="condition-item">
            <span class="condition-label">整体质量:</span>
            <span class="condition-value">{{ qualityData.quality == 10 ? '不合格':'合格' }}</span>
          </div>

          <!-- Ranse Errors (Staining) -->
          <template v-for="(item, index) in qualityData.ranseErrors" :key="'ranse-'+index">
             <div v-if="item.value == 10" class="condition-item">
               <span class="condition-label">{{ item.title }}:</span>
               <span class="condition-value">{{ item.value == 10 ? '有':'无' }}</span>
             </div>
          </template>

          <!-- Saomiao Errors (Scanning) -->
          <template v-for="(item, index) in qualityData.saomiaoErrors" :key="'saomiao-'+index">
             <div v-if="item.value == 10" class="condition-item">
               <span class="condition-label">扫描异常-{{ item.title }}:</span>
               <span class="condition-value">{{ item.value == 10 ? '有':'无' }}</span>
             </div>
          </template>

          <!-- Qiepian Errors (Slice) -->
          <template v-for="(item, index) in qualityData.qiepianErrors" :key="'qiepian-'+index">
             <div v-if="item.value == 10" class="condition-item">
               <span class="condition-label">切片异常-{{ item.title }}:</span>
               <span class="condition-value">{{ item.value == 10 ? '有':'无' }}</span>
             </div>
          </template>
        </div>
      </div>

      <!-- Signature -->
      <div class="signature-section">
        <span class="label">医生签名：</span>
        <img v-if="signatureUrl" :src="signatureUrl" alt="Signature" class="signature-img" />
        <span v-else class="no-signature">未检测到签名</span>
      </div>

      <!-- Actions -->
      <div class="actions">
        <a-button type="primary" @click="onDownload" :loading="exportLoading">结果下载</a-button>
        <a-button class="save-btn" @click="onSave" :loading="saveLoading">结果保存</a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted, watch } from 'vue';
import * as userApi from '@/service/user.js';

const props = defineProps({
  visible: Boolean,
  title: { type: String, default: '质控评价结果' },
  sliceNo: String,
  uploadTime: String,
  processTime: String,
  qualityData: { type: Object, default: () => ({}) },
  exportLoading: Boolean,
  saveLoading: Boolean
});

const emit = defineEmits(['update:visible', 'download', 'save']);

const signatureUrl = ref('');
const hospital = ref('');
const department = ref('');

const fetchSignature = async () => {
  try {
    const res = await userApi.getElecNamePathAndDepartmentAndHospital();
    if (res.code === 200 && res.data) {
      signatureUrl.value = res.data.path;
      hospital.value = res.data.hospital;
      department.value = res.data.department;
    }
  } catch (e) {
    console.error('Fetch signature failed', e);
  }
};

watch(() => props.visible, (val) => {
  if (val) {
    fetchSignature();
  }
});

const onClose = () => {
  emit('update:visible', false);
};

const onDownload = () => emit('download');
const onSave = () => emit('save');

onMounted(() => {
  if (props.visible) fetchSignature();
});
</script>

<style scoped>
.report-card {
  padding: 20px;
  background: #fff;
}

.report-title {
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.info-row {
  margin-bottom: 15px;
}

.label {
  font-weight: bold;
  color: #333;
  margin-right: 5px;
}

.value {
  color: #666;
}

.section-title {
  font-weight: bold;
  margin-top: 20px;
  margin-bottom: 10px;
  color: #333;
}

.report-content {
  background: #fbfbff;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.scroll-area {
  height: 200px;
  overflow-y: auto;
}

.condition-item {
  margin-bottom: 10px;
  font-size: 14px;
}

.condition-label {
  font-weight: bold;
  margin-right: 8px;
}

.signature-section {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 20px;
  margin-bottom: 20px;
}

.signature-img {
  height: 60px;
  max-width: 150px;
  object-fit: contain;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.save-btn {
  background: #fbfbff;
  color: #666;
}
</style>
