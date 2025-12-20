import { ref } from 'vue';
import { message } from 'ant-design-vue';
import * as sliceAPI from '@/service/slice.js';

export function useQualityUpload(fetchDataCallback) {
  const uploadModalVisible = ref(false);
  const isUploading = ref(false);

  const fileList = ref([]);
  const uploadQueue = ref([]);
  const currentUploadIndex = ref(0);

  const collectionArea = ref('胃');

  const uniqueArr = (arr, existingFiles) => {
    const existingFileMap = existingFiles.reduce((map, item) => {
      if (!map.has(item.originalFileName)) {
        map.set(item.originalFileName, []);
      }
      map.get(item.originalFileName).push(item.sliceNo);
      return map;
    }, new Map());

    const uniqueFiles = new Map();
    arr.forEach((file) => {
      if (existingFileMap.has(file.name)) {
        const sliceNos = existingFileMap.get(file.name);
        message.warning(`文件 ${file.name} 与编号为 [${sliceNos.join(', ')}] 的切片上传的文件相同，已移除`);
        return;
      }

      if (uniqueFiles.has(file.name)) {
        message.warning(`文件 ${file.name} 与已有文件重名，已移除`);
        return;
      }

      uniqueFiles.set(file.name, file);
    });

    return Array.from(uniqueFiles.values());
  };

  const onFileChange = async () => {
    try {
      const res = await sliceAPI.getQualitySliceFileNames();

      if (res.code === 200) {
        fileList.value = uniqueArr(fileList.value, res.data);
      }
    } catch (error) {
      console.error("Check duplicate quality files error:", error);
    }
  };

  const beforeUpload = () => {
    return false;
  };

  const uploadFiles = async () => {
    if (fileList.value.length === 0) {
      message.warning("没有选择文件，请先选择文件再上传");
      return;
    }

    isUploading.value = true;

    uploadQueue.value = fileList.value.map(file => ({
      file: file.originFileObj,
      name: file.name,
      status: 'pending',
      progress: 0
    }));

    fileList.value = [];
    currentUploadIndex.value = 0;

    processNextUpload();
  };

  const processNextUpload = async () => {
    if (currentUploadIndex.value >= uploadQueue.value.length) {
      isUploading.value = false;
      message.success("所有质控文件上传完成");
      allFilesUploadSuccess();
      return;
    }

    const currentFile = uploadQueue.value[currentUploadIndex.value];
    currentFile.status = 'uploading';
    message.info(`正在上传质控切片 ${currentFile.name}...`);

    let progressInterval = setInterval(() => {
      if (currentFile.progress < 90) {
        currentFile.progress += 10;
      }
    }, 500);

    try {
      let formdata = new FormData();
      formdata.append("file", currentFile.file);
      formdata.append("collectionArea", collectionArea.value);

      const res = await sliceAPI.uploadQuality(formdata);

      clearInterval(progressInterval);

      if (res.code === 200) {
        currentFile.progress = 100;
        currentFile.status = 'success';
        message.success(`质控文件 ${currentFile.name} 上传成功`);
      } else {
        currentFile.status = 'error';
      }
    } catch (error) {
      clearInterval(progressInterval);
      currentFile.status = 'error';
      message.error(`质控文件 ${currentFile.name} 上传失败: ${error.message || '网络错误'}`);
    }

    currentUploadIndex.value++;
    processNextUpload();
  };

  const allFilesUploadSuccess = () => {
    uploadModalVisible.value = false;
    if (fetchDataCallback) fetchDataCallback();
  };

  const cancelAllPendingUploads = () => {
    uploadQueue.value = uploadQueue.value.filter(file => file.status !== 'pending');
  };

  return {
    uploadModalVisible,
    isUploading,
    fileList,
    uploadQueue,
    collectionArea,
    onFileChange,
    beforeUpload,
    uploadFiles,
    cancelAllPendingUploads
  };
}

