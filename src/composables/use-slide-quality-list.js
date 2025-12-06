import { ref, reactive, watch, onMounted, createVNode } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import * as sliceAPI from '@/service/slice.js';
import * as userAPI from '@/service/user.js';
import { useRouter } from 'vue-router';
import { useSliceStore } from '@/stores/slice-store';

export function useSlideQualityList() {
  const router = useRouter();
  const sliceStore = useSliceStore();

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

  // Options
  const userOptions = ref([]);

  // Selection
  const selectedRowKeys = ref([]);

  // Fetch Users
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

  // Fetch Data
  const fetchData = async (paramsOverride = null) => {
    loading.value = true;
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

      delete params.uploadTime;
      delete params.saveResultTime;

      // Use queryQualitySlideData
      const response = await sliceAPI.queryQualitySlideData(params);
      const { data } = response;

      if (data && data.records) {
        tableData.value = data.records.map((record) => ({
          ...record,
          no: `No.${record.sliceNo}`,
          img: record.thumbnailPath ? record.thumbnailPath.replace(/\\/g, '/') : '@/assets/icons/nullImage.jpg',
          // Ensure quality field is present or mapped if needed
          quality: record.quality || '-'
        }));

        totalSize.value = data.total;
      }
    } catch (error) {
      console.error("Fetch quality data error:", error);
      message.error("获取质控列表失败");
    } finally {
      loading.value = false;
    }
  };

  // Watchers
  watch(filters, (newVal) => {
    currentPage.value = 1;
    fetchData(newVal);
  }, { deep: true });

  // Delete
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

  // Navigate to Detail
  const handleBatchSlice = () => {
    if (selectedRowKeys.value.length === 0) {
      message.error("未选择切片");
      return;
    }
    const ids = selectedRowKeys.value.map(String);
    sliceStore.setDetailIds(ids);

    const selectedItems = tableData.value.filter(item => ids.includes(String(item.id)));
    sliceStore.setSlideListData(selectedItems);

    router.push({ path: '/detail' });
  };

  const handleSingleSlice = (record) => {
    sliceStore.setDetailIds([String(record.id)]);
    sliceStore.setSlideListData([record]);
    router.push({ path: '/detail' });
  };

  onMounted(() => {
    fetchAllUsers();
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
    fetchData,
    confirmDelete,
    batchDelete,
    handleBatchSlice,
    handleSingleSlice
  };
}
