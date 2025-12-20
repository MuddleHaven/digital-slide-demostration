import { ref } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { createVNode } from 'vue';
import * as sliceAPI from '@/service/slice.js';

export function useUpload(fetchDataCallback) {
  // Modal visibility
  const uploadModalVisible = ref(false);
  const isUploading = ref(false);

  // File list from dragger
  const fileList = ref([]);
  
  // Upload queue
  const uploadQueue = ref([]);
  const currentUploadIndex = ref(0);
  
  // Upload list (status of uploaded files from server)
  const uploadList = ref([]);
  const uploadTimer = ref(null);

  const collectionArea = ref('胃');

  // Remove duplicate files
  const uniqueArr = (arr, existingFiles) => {
    // Extract existing file names and sliceNos
    const existingFileMap = existingFiles.reduce((map, item) => {
      if (!map.has(item.originalFileName)) {
        map.set(item.originalFileName, []);
      }
      map.get(item.originalFileName).push(item.sliceNo);
      return map;
    }, new Map());

    const uniqueFiles = new Map();
    arr.forEach((file) => {
      // Check against server files
      if (existingFileMap.has(file.name)) {
        const sliceNos = existingFileMap.get(file.name);
        message.warning(`文件 ${file.name} 与编号为 [${sliceNos.join(', ')}] 的切片上传的文件相同，已移除`);
        return;
      }

      // Check against currently selected files
      if (uniqueFiles.has(file.name)) {
        message.warning(`文件 ${file.name} 与已有文件重名，已移除`);
        return;
      }

      uniqueFiles.set(file.name, file);
    });

    return Array.from(uniqueFiles.values());
  };

  const onFileChange = async () => {
    // In a real scenario, you might want to optimize this call or debounce it
    // Here we follow the logic to check duplicates against server
    try {
      const res = await sliceAPI.getSliceFileNames();
      
      if (res.code === 200) {
        fileList.value = uniqueArr(fileList.value, res.data);
      }
    } catch (error) {
      console.error("Check duplicate files error:", error);
    }
  };

  const beforeUpload = () => {
    return false;
  };

  // Main upload function
  const uploadFiles = async () => {
    if (fileList.value.length === 0) {
      message.warning("没有选择文件，请先选择文件再上传");
      return;
    }

    isUploading.value = true;
    // Initialize queue
    uploadQueue.value = fileList.value.map(file => ({
      file: file.originFileObj,
      name: file.name,
      status: 'pending', // pending, uploading, success, error
      progress: 0
    }));

    // Clear dragger list
    fileList.value = [];
    currentUploadIndex.value = 0;
    
    processNextUpload();
  };

  const processNextUpload = async () => {
    if (currentUploadIndex.value >= uploadQueue.value.length) {
      isUploading.value = false;
      message.success("所有文件上传完成");
      allFilesUploadSuccess();
      return;
    }

    const currentFile = uploadQueue.value[currentUploadIndex.value];
    currentFile.status = 'uploading';
    message.info(`正在上传 ${currentFile.name}...`);

    // Simulate progress
    let progressInterval = setInterval(() => {
      if (currentFile.progress < 90) {
        currentFile.progress += 10;
      }
    }, 500);

    try {
      let formdata = new FormData();
      formdata.append("file", currentFile.file);

      formdata.append("collectionArea", collectionArea.value);

      const res = await sliceAPI.upload(formdata);

      clearInterval(progressInterval);

      if (res.code === 200) {
        currentFile.progress = 100;
        currentFile.status = 'success';
        message.success(`文件 ${currentFile.name} 上传成功`);
      } else {
        currentFile.status = 'error';
      }
    } catch (error) {
      clearInterval(progressInterval);
      currentFile.status = 'error';
      message.error(`文件 ${currentFile.name} 上传失败: ${error.message || '网络错误'}`);
    }

    currentUploadIndex.value++;
    processNextUpload();
  };

  const allFilesUploadSuccess = () => {
    uploadModalVisible.value = false;
    if (fetchDataCallback) fetchDataCallback();
  };

  const removeFromQueue = (index) => {
    const file = uploadQueue.value[index];
    if (file.status === 'pending') {
      uploadQueue.value.splice(index, 1);
      if (index < currentUploadIndex.value) {
        currentUploadIndex.value--;
      }
    } else {
      message.warning('只能移除待上传的文件');
    }
  };

  const cancelAllPendingUploads = () => {
    uploadQueue.value = uploadQueue.value.filter(file => file.status !== 'pending');
  };

  // Server-side upload cancellation
  const handleCancelUpload = async (id) => {
    let res = await sliceAPI.cancelUpload(id);
    if (res.code === 200) {
      message.success("取消成功");
      fetchUploadData(); // Refresh upload list
    }
  };

  const cancelUploads = async () => {
    Modal.confirm({
      title: '提示',
      icon: createVNode(ExclamationCircleOutlined),
      content: '你确认要取消上传全部切片吗？',
      okText: '确认',
      cancelText: '取消',
      centered: true,
      async onOk() {
        if (uploadList.value.length === 0) {
          message.warn("目前没有正在处理的切片");
          return;
        }
        let res = await sliceAPI.cancelUploads();
        if (res.code === 200) {
          message.success("取消成功");
          fetchUploadData();
        }
      },
    });
  };

  const handleReupload = async (id) => {
    let res = await sliceAPI.reUpload(id);
    if (res.code === 200) {
      message.success("操作成功");
      if (fetchDataCallback) fetchDataCallback();
    }
  };

  /**
   * Fetch upload progress/list from server
   */
  const fetchUploadData = async () => {
    try {
      const response = await sliceAPI.getUploadProgress();
      
      if (response.code === 200 && response.data) {
        uploadList.value = response.data.map((item) => ({
          ...item,
          img: item.thumbnailPath ? item.thumbnailPath.replace(/\\/g, "/") : '@/assets/icons/nullImage.jpg',
          percent: item.progress * 100,
        }));
      }
    } catch (error) {
      console.error("Fetch upload data error:", error);
    }
  };

  return {
    uploadModalVisible,
    isUploading,
    fileList,
    uploadQueue,
    uploadList,
    collectionArea,
    onFileChange,
    beforeUpload,
    uploadFiles,
    removeFromQueue,
    cancelAllPendingUploads,
    handleCancelUpload,
    cancelUploads,
    handleReupload,
    fetchUploadData
  };
}
