<template>
  <a-modal v-model:open="visible" title="上传电子签名" :footer="null" :width="500">
    <div class="signature-upload-container">
      <div v-if="!fileList.length" class="upload-area">
        <a-upload-dragger
          name="file"
          :multiple="false"
          :showUploadList="false"
          :beforeUpload="beforeUpload"
          accept=".png,.jpg,.jpeg"
        >
          <p class="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p class="ant-upload-text">点击或拖拽文件到此处上传</p>
          <p class="ant-upload-hint">支持 .png, .jpg, .jpeg 格式</p>
        </a-upload-dragger>
      </div>

      <div v-else class="preview-area">
        <img :src="previewImage" alt="signature preview" class="preview-img" />
        <div class="actions">
          <a-button @click="removeFile">重新选择</a-button>
          <a-button type="primary" :loading="uploading" @click="handleUpload">确认上传</a-button>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue';
import { InboxOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import * as userAPI from '@/service/user.js';

const props = defineProps({
  visible: Boolean
});

const emit = defineEmits(['update:visible', 'success']);

const visible = ref(props.visible);
const fileList = ref([]);
const previewImage = ref('');
const uploading = ref(false);

watch(() => props.visible, (val) => {
  visible.value = val;
});

watch(visible, (val) => {
  emit('update:visible', val);
  if (!val) {
    // Reset on close
    fileList.value = [];
    previewImage.value = '';
  }
});

const beforeUpload = (file) => {
  const isImage = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isImage) {
    message.error('只能上传 JPG/PNG 格式的图片!');
    return false;
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB!');
    return false;
  }

  fileList.value = [file];
  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImage.value = e.target.result;
  };
  reader.readAsDataURL(file);
  return false; // Prevent auto upload
};

const removeFile = () => {
  fileList.value = [];
  previewImage.value = '';
};

const handleUpload = async () => {
  if (!fileList.value.length) return;

  const formData = new FormData();
  formData.append('file', fileList.value[0]);

  uploading.value = true;
  try {
    const res = await userAPI.uploadElecName(formData);
    if (res.code === 200) {
      message.success('签名上传成功');
      emit('success');
      visible.value = false;
    } else {
      message.error(res.msg || '上传失败');
    }
  } catch (error) {
    message.error('上传出错');
  } finally {
    uploading.value = false;
  }
};
</script>

<style scoped>
.signature-upload-container {
  padding: 20px;
}
.preview-area {
  text-align: center;
}
.preview-img {
  max-width: 100%;
  max-height: 200px;
  margin-bottom: 20px;
  border: 1px dashed #d9d9d9;
  padding: 10px;
}
.actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}
</style>
