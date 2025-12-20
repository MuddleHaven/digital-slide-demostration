<template>
  <div style="padding: 20px;">
    <a-card :bordered="false" style="border-radius: 8px;">
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="result" tab="辅助诊断">
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
                诊断上传
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
        </a-tab-pane>
        
        <a-tab-pane key="quality" tab="质控评价">
          <!-- Quality Actions -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <a-button type="primary" :disabled="qSelectedRowKeys.length === 0" @click="qHandleBatchSlice" style="margin-right: 10px;">
                质控面板
              </a-button>
              <a-button danger :disabled="qSelectedRowKeys.length === 0" @click="qBatchDelete">
                批量删除
              </a-button>
            </div>
            <div>
              <a-button type="primary" @click="qUploadModalVisible = true">
                <template #icon><UploadOutlined /></template>
                质控上传
              </a-button>
            </div>
          </div>

          <!-- Quality Filters -->
           <a-row :gutter="16" style="margin-bottom: 20px;">
            <a-col :span="4">
              <!-- Reusing status filter for now, maybe quality status? -->
              <a-select v-model:value="qFilters.status" :options="qualityCheckStatusOptions" placeholder="请选择处理状态" style="width: 100%" allowClear />
            </a-col>
            <a-col :span="4" v-if="qUserOptions.length > 0">
              <a-select v-model:value="qFilters.userId" :options="qUserOptions" placeholder="请选择上传用户" style="width: 100%" allowClear />
            </a-col>
            <a-col :span="6">
              <a-range-picker v-model:value="qFilters.uploadTime" style="width: 100%" />
            </a-col>
            <a-col :span="6">
              <a-input v-model:value="qFilters.sliceNo" placeholder="搜索病理号" allowClear>
                <template #suffix><SearchOutlined /></template>
              </a-input>
            </a-col>
          </a-row>

          <!-- Quality Table -->
          <a-table
            :columns="qualityColumns"
            :data-source="qTableData"
            :loading="qLoading"
            :pagination="{
              current: qCurrentPage,
              pageSize: qPageSize,
              total: qTotalSize,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: total => `共 ${total} 条`,
              onChange: (page, size) => { qCurrentPage = page; qPageSize = size; qFetchData(); },
              onShowSizeChange: (current, size) => { qCurrentPage = 1; qPageSize = size; qFetchData(); }
            }"
            :row-selection="{ 
              selectedRowKeys: qSelectedRowKeys, 
              onChange: keys => qSelectedRowKeys = keys,
              getCheckboxProps: record => ({
                disabled: record.qualityCheckStatus !== QualityCheckStatusEnum.PROCESSED
              })
            }"
            row-key="id"
          >
             <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'index'">{{ index + 1 }}</template>
              
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

              <template v-else-if="column.key === 'status'">
                 <div v-if="record.qualityCheckStatus === QualityCheckStatusEnum.PROCESSING">
                   <LoadingOutlined />
                   <span style="font-size: 12px; margin-left: 8px;">{{ getQualityCheckStatusText(record.qualityCheckStatus) }}</span>
                 </div>
                 <a-tag v-else :color="getQualityStatusColor(record.qualityCheckStatus)">
                   {{ getQualityCheckStatusText(record.qualityCheckStatus) }}
                 </a-tag>
              </template>

              <template v-else-if="column.key === 'quality'">
                <span>{{ record.quality || '-' }}</span>
              </template>

              <template v-else-if="column.key === 'operation'">
                 <a-space>
                   <!-- Quality Panel Action -->
                   <a-tooltip title="查看质控详情" v-if="record.qualityCheckStatus === QualityCheckStatusEnum.PROCESSED">
                     <a-button type="text" @click="qHandleSingleSlice(record)">
                       <template #icon><EyeOutlined /></template>
                     </a-button>
                   </a-tooltip>
                   <a-popconfirm title="确定删除吗？" @confirm="qConfirmDelete(record.id)">
                     <a-button type="text" danger>
                       <template #icon><DeleteOutlined /></template>
                     </a-button>
                   </a-popconfirm>
                 </a-space>
              </template>
             </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <!-- Result Upload Modal -->
    <a-modal
      v-model:open="uploadModalVisible"
      title="上传辅助诊断切片"
      :footer="null"
      width="800px"
      :maskClosable="false"
    >
      <div v-if="!isUploading">
        <a-form layout="inline" style="margin-bottom: 16px;">
          <a-form-item label="部位">
            <a-radio-group v-model:value="collectionArea">
              <a-radio-button value="胃">胃部</a-radio-button>
              <a-radio-button value="肺">肺部</a-radio-button>
              <a-radio-button value="肠">肠部</a-radio-button>
            </a-radio-group>
          </a-form-item>
        </a-form>
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
          <p class="ant-upload-text">点击或拖拽文件到此处上传（辅助诊断）</p>
          <p class="ant-upload-hint">支持 .svs, .tmap, .kfb, .sdpc 格式</p>
        </a-upload-dragger>
        <div style="text-align: right; margin-top: 16px;">
          <a-button type="primary" @click="uploadFiles" :disabled="fileList.length === 0">开始上传辅助诊断切片</a-button>
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

    <!-- Quality Upload Modal -->
    <a-modal
      v-model:open="qUploadModalVisible"
      title="上传质控切片"
      :footer="null"
      width="800px"
      :maskClosable="false"
    >
      <div v-if="!qIsUploading">
        <a-form layout="inline" style="margin-bottom: 16px;">
          <a-form-item label="部位">
            <a-radio-group v-model:value="qCollectionArea">
              <a-radio-button value="胃">胃部</a-radio-button>
              <a-radio-button value="肺">肺部</a-radio-button>
              <a-radio-button value="肠">肠部</a-radio-button>
            </a-radio-group>
          </a-form-item>
        </a-form>
        <a-upload-dragger
          v-model:fileList="qFileList"
          name="file"
          :multiple="true"
          accept=".svs, .tmap, .kfb, .sdpc"
          :beforeUpload="qBeforeUpload"
          @change="qOnFileChange"
        >
          <p class="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p class="ant-upload-text">点击或拖拽文件到此处上传（质控评价）</p>
          <p class="ant-upload-hint">支持 .svs, .tmap, .kfb, .sdpc 格式</p>
        </a-upload-dragger>
        <div style="text-align: right; margin-top: 16px;">
          <a-button type="primary" @click="qUploadFiles" :disabled="qFileList.length === 0">开始上传质控切片</a-button>
        </div>
      </div>
      <div v-else>
        <div style="max-height: 400px; overflow-y: auto;">
          <div v-for="(item, index) in qUploadQueue" :key="index" style="margin-bottom: 10px;">
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
          <a-button danger @click="qCancelAllPendingUploads">取消剩余</a-button>
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
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { 
  UploadOutlined, SearchOutlined, DeleteOutlined, 
  FundProjectionScreenOutlined, EyeOutlined, ReloadOutlined, 
  InboxOutlined, LoadingOutlined 
} from '@ant-design/icons-vue';
import { useSlideList } from '@/composables/use-slide-list';
import { useSlideQualityList } from '@/composables/use-slide-quality-list';
import { useUpload } from '@/composables/use-upload';
import { useQualityUpload } from '@/composables/use-quality-upload';
import { 
  QualityCheckStatusEnum,
  qualityCheckStatusOptions,
  getQualityCheckStatusText,
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

const router = useRouter();
const route = useRoute();

const activeTab = ref(route.query.tab || 'result');

watch(activeTab, (newTab) => {
  router.replace({ query: { ...route.query, tab: newTab } });
});

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

// Use Slide Quality List
const {
  tableData: qTableData,
  loading: qLoading,
  currentPage: qCurrentPage,
  pageSize: qPageSize,
  totalSize: qTotalSize,
  filters: qFilters,
  userOptions: qUserOptions,
  selectedRowKeys: qSelectedRowKeys,
  fetchData: qFetchData,
  confirmDelete: qConfirmDelete,
  batchDelete: qBatchDelete,
  handleBatchSlice: qHandleBatchSlice,
  handleSingleSlice: qHandleSingleSlice
} = useSlideQualityList();

const {
  uploadModalVisible,
  isUploading,
  fileList,
  uploadQueue,
  collectionArea,
  beforeUpload,
  onFileChange,
  uploadFiles,
  cancelAllPendingUploads,
  handleReupload
} = useUpload(() => {
  fetchData();
});

const {
  uploadModalVisible: qUploadModalVisible,
  isUploading: qIsUploading,
  fileList: qFileList,
  uploadQueue: qUploadQueue,
  collectionArea: qCollectionArea,
  beforeUpload: qBeforeUpload,
  onFileChange: qOnFileChange,
  uploadFiles: qUploadFiles,
  cancelAllPendingUploads: qCancelAllPendingUploads
} = useQualityUpload(() => {
  qFetchData();
});

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

const qualityColumns = [
  { title: '序号', key: 'index', width: 60, align: 'center' },
  { title: '病理号', dataIndex: 'no', key: 'no', width: 140, align: 'center' },
  { title: '缩略图', key: 'img', width: 80, align: 'center' },
  { title: '上传用户', dataIndex: 'uploadUserRealName', key: 'uploadUserRealName', width: 100, align: 'center' },
  { title: '处理进度', key: 'status', width: 120, align: 'center' },
  { title: '切片质量', key: 'quality', width: 100, align: 'center' },
  { title: '扫描倍数', dataIndex: 'focus', key: 'focus', width: 80, align: 'center', customRender: ({text}) => text ? text + '倍' : '-' },
  { title: '上传时间', dataIndex: 'uploadTime', key: 'uploadTime', width: 150, align: 'center' },
  { title: '复核时间', dataIndex: 'saveResultTime', key: 'saveResultTime', width: 150, align: 'center' },
  { title: '操作', key: 'operation', width: 180, align: 'center' }
];

// Initial Fetch for Quality Tab
onMounted(() => {
  qFetchData();
});

const getStatusColor = (status) => {
  if (status === SliceStatusEnum.PROCESS_SUCCESS) return 'orange';
  if (status === SliceStatusEnum.REVIEWED) return 'green';
  if (isSliceInFailureState(status)) return 'red';
  return 'default';
};

const getQualityStatusColor = (status) => {
  if (status === QualityCheckStatusEnum.PROCESSED) return 'green';
  if (status === QualityCheckStatusEnum.PROCESSING) return 'blue';
  if (status === QualityCheckStatusEnum.FAILED) return 'red';
  return 'default';
};

</script>

<style scoped>
/* Add any specific styles if needed */
</style>
