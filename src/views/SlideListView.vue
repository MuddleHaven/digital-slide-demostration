<template>
  <div style="padding: 20px;">
    <a-card :bordered="false" style="border-radius: 8px;">
      <!-- Top Actions -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <!-- Batch Actions -->
          <a-button type="primary" :disabled="selectedRowKeys.length === 0" @click="handleBatchSlice" style="margin-right: 10px;">
            处理面板
          </a-button>
          <a-button danger :disabled="selectedRowKeys.length === 0" @click="batchDelete">
            批量删除
          </a-button>
        </div>
        <div>
          <a-button type="primary" @click="uploadModalVisible = true">
            <template #icon><UploadOutlined /></template>
            上传切片
          </a-button>
        </div>
      </div>

      <!-- Filters -->
      <a-row :gutter="16" style="margin-bottom: 20px;">
        <a-col :span="4">
          <a-select v-model:value="filters.result" :options="sliceResultOptions" placeholder="请选择辅助处理结果" style="width: 100%" allowClear />
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="filters.status" :options="sliceStatusOptions" placeholder="请选择处理状态" style="width: 100%" allowClear />
        </a-col>
        <a-col :span="4" v-if="userOptions.length > 0">
          <a-select v-model:value="filters.userId" :options="userOptions" placeholder="请选择上传用户" style="width: 100%" allowClear />
        </a-col>
        <a-col :span="6">
          <a-range-picker v-model:value="filters.uploadTime" style="width: 100%" />
        </a-col>
        <a-col :span="6">
          <a-input v-model:value="filters.sliceNo" placeholder="搜索病理号" allowClear>
            <template #suffix><SearchOutlined /></template>
          </a-input>
        </a-col>
      </a-row>

      <!-- Table -->
      <a-table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="{
          current: currentPage,
          pageSize: pageSize,
          total: totalSize,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `共 ${total} 条`,
          onChange: (page, size) => { currentPage = page; pageSize = size; fetchData(); },
          onShowSizeChange: (current, size) => { currentPage = 1; pageSize = size; fetchData(); }
        }"
        :row-selection="{ 
          selectedRowKeys: selectedRowKeys, 
          onChange: keys => selectedRowKeys = keys,
          getCheckboxProps: record => ({
            disabled: !isSliceProcessed(record.status)
          })
        }"
        row-key="id"
      >
        <template #bodyCell="{ column, record, index }">
          <!-- Index -->
          <template v-if="column.key === 'index'">
            {{ index + 1 }}
          </template>

          <!-- Thumbnail -->
          <template v-else-if="column.key === 'img'">
            <div v-if="isSliceParseProcessing(record.status)" style="display: flex; justify-content: center;">
              <LoadingOutlined style="font-size: 24px; color: #1890ff;" />
            </div>
            <a-popover v-else placement="right">
              <template #content>
                <img :src="record.img" style="max-width: 200px; max-height: 200px;" />
              </template>
              <img :src="record.img" style="width: 40px; height: 40px; object-fit: cover; cursor: pointer;" />
            </a-popover>
          </template>

          <!-- Status -->
          <template v-else-if="column.key === 'status'">
            <div v-if="record.status == SliceStatusEnum.PROCESSING || record.status == SliceStatusEnum.PARSING">
               <FlowingProgressBar />
               <span style="font-size: 12px;">{{ getSliceStatusText(record.status) }} <span v-if="record.percent">({{ record.percent }}%)</span></span>
            </div>
            <a-tag v-else :color="getStatusColor(record.status)">
              {{ getSliceStatusText(record.status) }}
            </a-tag>
          </template>

          <!-- Result -->
           <template v-else-if="column.key === 'result'">
             <span v-if="record.status == SliceStatusEnum.PROCESSING">-</span>
             <span v-else>{{ record.result || '-' }}</span>
           </template>

          <!-- Operations -->
          <template v-else-if="column.key === 'operation'">
            <a-space>
              <a-tooltip title="AI分析/复核">
                <a-button type="text" @click="AIDetect(record.status, record.id)">
                  <template #icon><FundProjectionScreenOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="查看详情" v-if="isSliceProcessed(record.status)">
                 <a-button type="text" @click="checkSliceProcessResult(record)">
                   <template #icon><EyeOutlined /></template>
                 </a-button>
              </a-tooltip>
              <a-popconfirm title="确定删除吗？" @confirm="confirmDelete(record.id)">
                <a-button type="text" danger>
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-popconfirm>
              <a-tooltip title="重新上传" v-if="isSliceInFailureState(record.status)">
                 <a-popconfirm title="确定重新上传吗？" @confirm="handleReupload(record.id)">
                    <a-button type="text">
                      <template #icon><ReloadOutlined /></template>
                    </a-button>
                 </a-popconfirm>
              </a-tooltip>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- Upload Modal -->
    <a-modal
      v-model:open="uploadModalVisible"
      title="上传切片"
      :footer="null"
      width="800px"
      :maskClosable="false"
    >
      <div v-if="!isUploading">
        <a-upload-dragger
          v-model:fileList="fileList"
          name="file"
          :multiple="true"
          accept=".svs, .tmap, .kfb, .sdpc"
          :beforeUpload="beforeUpload"
          @change="onFileChange"
        >
          <p class="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p class="ant-upload-text">点击或拖拽文件到此处上传</p>
          <p class="ant-upload-hint">支持 .svs, .tmap, .kfb, .sdpc 格式</p>
        </a-upload-dragger>
        <div style="text-align: right; margin-top: 16px;">
          <a-button type="primary" @click="uploadFiles" :disabled="fileList.length === 0">开始上传</a-button>
        </div>
      </div>
      <div v-else>
        <div style="max-height: 400px; overflow-y: auto;">
          <div v-for="(item, index) in uploadQueue" :key="index" style="margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between;">
              <span>{{ item.name }}</span>
              <span>
                <a-tag v-if="item.status === 'success'" color="success">完成</a-tag>
                <a-tag v-else-if="item.status === 'error'" color="error">失败</a-tag>
                <a-tag v-else-if="item.status === 'uploading'" color="processing">上传中</a-tag>
                <a-tag v-else>等待中</a-tag>
              </span>
            </div>
            <a-progress :percent="item.progress" size="small" status="active" />
          </div>
        </div>
        <div style="text-align: right; margin-top: 16px;">
          <a-button danger @click="cancelAllPendingUploads">取消剩余</a-button>
        </div>
      </div>
    </a-modal>

    <!-- Result Modal -->
    <a-modal
      v-model:open="resultModalVisible"
      title="处理结果"
      :footer="null"
      destroyOnClose
    >
      <ProcessResult 
        v-if="resultModel.aiResult"
        :aiResult="resultModel.aiResult" 
        :result="resultModel.result" 
        :collectionArea="openCollectionArea" 
      />
    </a-modal>
  </div>
</template>

<script setup>
import { 
  UploadOutlined, SearchOutlined, DeleteOutlined, 
  FundProjectionScreenOutlined, EyeOutlined, ReloadOutlined, 
  InboxOutlined, LoadingOutlined 
} from '@ant-design/icons-vue';
import { useSlideList } from '@/composables/use-slide-list';
import { useUpload } from '@/composables/use-upload';
import { 
  SliceStatusEnum, 
  sliceResultOptions, 
  sliceStatusOptions, 
  getSliceStatusText, 
  isSliceParseProcessing, 
  isSliceInFailureState,
  isSliceProcessed 
} from '@/common/sliceTypes.js';
import FlowingProgressBar from '@/components/FlowingProgressBar.vue';
import ProcessResult from '@/components/ProcessResult.vue';

const {
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
  handleBatchSlice,
  checkSliceProcessResult
} = useSlideList();

const {
  uploadModalVisible,
  isUploading,
  fileList,
  uploadQueue,
  beforeUpload,
  onFileChange,
  uploadFiles,
  cancelAllPendingUploads,
  handleReupload
} = useUpload(fetchData);

const columns = [
  { title: '序号', key: 'index', width: 60, align: 'center' },
  { title: '病理号', dataIndex: 'no', key: 'no', width: 140, align: 'center' },
  { title: '缩略图', key: 'img', width: 80, align: 'center' },
  { title: '上传用户', dataIndex: 'uploadUserRealName', key: 'uploadUserRealName', width: 100, align: 'center' },
  { title: '处理进度', key: 'status', width: 120, align: 'center' },
  { title: '处理结果', key: 'result', width: 100, align: 'center' },
  { title: '扫描倍数', dataIndex: 'focus', key: 'focus', width: 80, align: 'center', customRender: ({text}) => text ? text + '倍' : '-' },
  { title: '部位', dataIndex: 'collectionArea', key: 'collectionArea', width: 80, align: 'center' },
  { title: '上传时间', dataIndex: 'uploadTime', key: 'uploadTime', width: 150, align: 'center' },
  { title: '复核时间', dataIndex: 'saveResultTime', key: 'saveResultTime', width: 150, align: 'center' },
  { title: '操作', key: 'operation', width: 180, align: 'center' }
];

const getStatusColor = (status) => {
  if (status === SliceStatusEnum.PROCESS_SUCCESS) return 'orange';
  if (status === SliceStatusEnum.REVIEWED) return 'green';
  if (isSliceInFailureState(status)) return 'red';
  return 'default';
};

</script>

<style scoped>
/* Add any specific styles if needed */
</style>
