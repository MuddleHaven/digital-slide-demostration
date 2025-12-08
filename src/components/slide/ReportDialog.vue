<template>
  <a-modal
    :open="visible"
    :title="title"
    width="800px"
    centered
    @cancel="onClose"
    :footer="null"
    class="report-modal"
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

      <div class="section-title">处理结果：</div>
      
      <!-- Content -->
      <div class="report-content">
        <div class="scroll-area">
          <div v-for="(item, index) in conditions" :key="index" class="condition-item">
            <template v-if="shouldShowCondition(item)">
              <span class="condition-label">{{ item.text }}:</span>
              <span class="condition-value">{{ formatValue(item) }}</span>
            </template>
          </div>
          <div v-if="advice" class="advice-item">
            <span class="condition-label">辅助建议:</span>
            <span class="condition-value">{{ advice }}</span>
          </div>
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
import { getCheckoutOptionLabel } from '@/common/options.js';

const props = defineProps({
  visible: Boolean,
  title: { type: String, default: '病理图像处理结果' },
  sliceNo: String,
  uploadTime: String,
  processTime: String,
  conditions: { type: Array, default: () => [] },
  advice: String,
  slicePart: String,
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

// Helper to format value based on options
const formatValue = (item) => {
  if (item.key === 'result') {
    return item.value || '无';
  }
  // CheckBox usually has value 0 or 10. 10 is '有'/'阳性'
  if (item.componentType === 'CheckBox') {
    return item.value === 10 ? '阳性' : '阴性'; // Or use option label if available
  }
  
  // For SingleRadio, map value to label
  if (item.options) {
    return getCheckoutOptionLabel(item.options, item.value, props.slicePart);
  }
  return item.value;
};

const shouldShowCondition = (item) => {
  // Show if value is not 0/null/empty
  if (item.value === 0 || item.value === null || item.value === '') return false;
  // Always show 'result' (Overall result) if present
  if (item.key === 'result') return true;
  return true;
};

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

.condition-item, .advice-item {
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
