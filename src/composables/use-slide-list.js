import { ref, reactive, computed, watch, onMounted, onUnmounted, createVNode } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import * as sliceAPI from '@/service/slice.js';
import * as userAPI from '@/service/user.js';
import { useRouter } from 'vue-router';
import { 
  SliceStatusEnum, 
  sliceQualityOptions, 
  sliceResultOptions, 
  sliceStatusOptions, 
  getSliceStatusText, 
  isSliceProcessing,
  isSliceProcessed
} from '@/common/sliceTypes.js';

export function useSlideList() {
  const router = useRouter();
  
  // Table Data
  const tableData = ref([]);
  const loading = ref(false);
  
  // Pagination
  const currentPage = ref(1);
  const pageSize = ref(10);
  const totalSize = ref(0);
  
  // Filters
  const filters = reactive({
    uploadTime: null,
    saveResultTime: null,
    status: null,
    sliceNo: null,
    quality: null,
    result: null,
    userId: null
  });

  // Options for filters
  const userOptions = ref([]);
  
  // Selection
  const selectedRowKeys = ref([]);

  // Modals
  const resultModalVisible = ref(false);
  const resultModel = ref({});
  const openCollectionArea = ref(null);

  // Timers
  let timer = null;
  let checkProgressInterval = null;

  // Fetch Users for filter
  const fetchAllUsers = async () => {
    try {
      const role = localStorage.getItem("role");
      if (role === '主任') {
        let res = await userAPI.getAllUsersInfo();
        if (res.code === 200) {
          userOptions.value = res.data.map(item => ({
            label: item.user.realname,
            value: item.user.id
          }));
        }
      }
    } catch (error) {
      console.error("Fetch users error:", error);
    }
  };

  // Fetch Table Data
  const fetchData = async (paramsOverride = null) => {
    // loading.value = true; // Optional: don't show loading on poll
    try {
      const filtersParams = paramsOverride || filters;
      const params = {
        current: currentPage.value,
        size: pageSize.value,
        uploadStartTime: filtersParams.uploadTime ? filtersParams.uploadTime[0] : null,
        uploadEndTime: filtersParams.uploadTime ? filtersParams.uploadTime[1] : null,
        saveResultStartTime: filtersParams.saveResultTime ? filtersParams.saveResultTime[0] : null,
        saveResultEndTime: filtersParams.saveResultTime ? filtersParams.saveResultTime[1] : null,
        ...filtersParams,
      };

      // Cleanup invalid params
      delete params.uploadTime;
      delete params.saveResultTime;

      const response = await sliceAPI.querySlideData(params);
      const { data } = response;

      if (data && data.records) {
        const tissueType = import.meta.env.VITE_APP_TISSUE_TYPE || 'stomach';
        let collectionArea = '胃';
        if (tissueType === 'colon') collectionArea = '肠';
        else if (tissueType === 'liver') collectionArea = '肝';
        else if (tissueType === 'lung') collectionArea = '肺';

        tableData.value = data.records.map((record) => ({
          ...record,
          no: `No.${record.sliceNo}`,
          img: record.thumbnailPath ? record.thumbnailPath.replace(/\\/g, '/') : '',
          time: record.processTime,
          focus: record.magnification,
          quality: record.overallQuality,
          collectionArea: collectionArea,
        }));
        
        totalSize.value = data.total;

        // Handle Polling Logic
        handlePolling(data.records);
      }
    } catch (error) {
      console.error("Fetch data error:", error);
    } finally {
      loading.value = false;
    }
  };

  const handlePolling = (records) => {
    const uploadingCount = records.filter(r => isSliceProcessing(r.status)).length;
    
    // Slice status polling
    if (uploadingCount > 0 && timer === null) {
      timer = setInterval(() => fetchData(), 2000);
    } else if (uploadingCount === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }

    // AI Progress polling
    const processingCount = records.filter(e => e.status === SliceStatusEnum.PROCESSING).length;
    if (processingCount > 0 && checkProgressInterval === null) {
      checkProgressInterval = setInterval(getAIprogress, 1500);
    } else if (processingCount === 0 && checkProgressInterval !== null) {
      clearInterval(checkProgressInterval);
      checkProgressInterval = null;
    }
  };

  const getAIprogress = async () => {
    try {
      let res = await sliceAPI.getAIProcessProgress();
      let progressData = res.data;
      if (!progressData) return;

      let hasCompleted = false;
      for (let item of tableData.value) {
        if (item.status === SliceStatusEnum.PROCESSING && progressData.hasOwnProperty(item.id)) {
          item.percent = progressData[item.id];
          if (item.percent === 100) hasCompleted = true;
        }
      }
      if (hasCompleted) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Filter Watcher
  watch(filters, (newVal) => {
    currentPage.value = 1;
    fetchData(newVal);
  }, { deep: true });

  // Actions
  const deleteSlice = async (ids) => {
    try {
      const response = await sliceAPI.deleteSlices(ids);
      if (response.code === 200) {
        message.success("删除成功");
        selectedRowKeys.value = [];
        fetchData();
      }
    } catch (error) {
      message.error("删除失败");
    }
  };

  const confirmDelete = (id) => {
    deleteSlice([id]);
  };

  const batchDelete = () => {
    if (selectedRowKeys.value.length === 0) {
      message.error("未选择切片");
      return;
    }
    Modal.confirm({
      title: '提示',
      icon: createVNode(ExclamationCircleOutlined),
      content: '你确认要删除这些切片吗？',
      okText: '确认',
      cancelText: '取消',
      centered: true,
      onOk() {
        deleteSlice(selectedRowKeys.value);
      },
    });
  };

  const AIDetect = async (status, id) => {
    if (status === SliceStatusEnum.PROCESSING) {
      message.info("切片正在处理中，请耐心等待完成");
      return;
    }
    
    // Error checks
    if (status === SliceStatusEnum.PARSING) return message.info("切片未解析成功，请等待解析完成");
    if (status === SliceStatusEnum.UPLOADING) return message.info("切片未上传成功，请等待上传完成");
    if (status === SliceStatusEnum.UPLOAD_FAILED) return message.error("切片上传失败，请重新上传");
    if (status === SliceStatusEnum.PARSE_FAILED) return message.error("切片解析失败，请重新解析");

    if (isSliceProcessed(status)) {
      handleSingleSlice(id);
      return;
    }

    try {
      let res = await sliceAPI.AIAnalyze(id);
      if (res.code === 200) {
        message.info("正在进行AI分析....");
        fetchData();
      }
    } catch (e) {
      message.error("请求AI分析失败");
    }
  };

  const handleSingleSlice = (id) => {
    // Navigate to detail with ID in query or params
    // Assuming route name 'SliceDetail' or path '/detail'
    // User asked to pass IDs via route params/query
    router.push({ path: '/detail', query: { id } });
  };

  const handleBatchSlice = () => {
    if (selectedRowKeys.value.length === 0) {
      message.error("未选择切片");
      return;
    }
    // Pass multiple IDs
    router.push({ path: '/detail', query: { ids: selectedRowKeys.value.join(',') } });
  };

  // Result Modal Logic
  const checkSliceProcessResult = async (record) => {
    const { id: sliceId, collectionArea } = record;
    openCollectionArea.value = collectionArea;
    try {
      const [aiRes, res] = await Promise.all([
        sliceAPI.getAIResult(sliceId),
        sliceAPI.getResult(sliceId)
      ]);
      
      resultModel.value = {
        aiResult: aiRes.data,
        result: res.data
      };
      
      if (aiRes.data) {
        resultModalVisible.value = true;
      } else {
        message.error("未获取到处理结果");
      }
    } catch (e) {
      message.error("获取结果失败");
    }
  };

  // Lifecycle
  onMounted(() => {
    fetchData();
    fetchAllUsers();
  });

  onUnmounted(() => {
    if (timer) clearInterval(timer);
    if (checkProgressInterval) clearInterval(checkProgressInterval);
  });

  return {
    tableData,
    loading,
    currentPage,
    pageSize,
    totalSize,
    filters,
    userOptions,
    selectedRowKeys,
    resultModalVisible,
    resultModel,
    openCollectionArea,
    
    fetchData,
    confirmDelete,
    batchDelete,
    AIDetect,
    handleSingleSlice,
    handleBatchSlice,
    checkSliceProcessResult
  };
}
