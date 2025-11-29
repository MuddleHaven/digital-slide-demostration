<template>
  <a-modal
    :visible="visible"
    :title="title"
    width="800px"
    centered
    @cancel="onClose"
    :footer="null"
  >
    <div class="report-content">
      <!-- Header Info -->
      <div class="report-header">
        <p><strong>病理号：</strong> {{ sliceNo }}</p>
        <p><strong>处理时间：</strong> {{ processTime }}</p>
      </div>
      
      <!-- Content Slot -->
      <div class="report-body">
        <slot></slot>
      </div>

      <!-- Footer / Signature -->
      <div class="report-footer">
        <div class="signature-box">
          <span>医生签名：</span>
          <!-- Image placeholder -->
          <div class="signature-placeholder">[Signature]</div>
        </div>
      </div>

      <!-- Actions -->
      <div class="report-actions">
        <a-button type="primary" @click="onDownload">结果下载</a-button>
        <a-button @click="onSave">结果保存</a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
defineProps({
  visible: Boolean,
  title: String,
  sliceNo: String,
  processTime: String
});

const emit = defineEmits(['update:visible', 'download', 'save']);

const onClose = () => {
  emit('update:visible', false);
};

const onDownload = () => emit('download');
const onSave = () => emit('save');
</script>

<style scoped>
.report-content {
  padding: 20px;
}
.report-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}
.report-body {
  min-height: 200px;
  background: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}
.report-footer {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}
.signature-box {
  text-align: center;
}
.report-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}
</style>
