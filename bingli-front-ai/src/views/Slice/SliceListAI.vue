<template>
  <a-row :gutter="20">
    <a-col :span="24">
      <a-card class="card3 cardcommon">
        <a-row style="display: flex;justify-content: space-between;">
          <a-row>
            <a-checkbox style="margin-right: 10px;" v-model:checked="state.checkAll"
              :indeterminate="state.indeterminate" @change="onCheckAllChange">
            </a-checkbox>
            <a-button type="primary" class="top-btn" @click="handleSliceList">
              <span class="top-btn-text">处理面板</span>
            </a-button>
          </a-row>
          <div style="display: flex; flex-direction: row; column-gap: 16px">
            <!-- <a-button type="default" class="default-btn" @click="modalOpen = true">
              <span class="top-btn-text">上传管理</span>
            </a-button> -->
            <a-button type="primary" class="top-btn" @click="uploadModal = true">
              <span class="top-btn-text">上传切片</span>
            </a-button>
          </div>
        </a-row>
        <!-- 顶部查询按钮 -->
        <a-row style="margin-top: 0.7vw; margin-bottom: 0.7vw;">
          <a-col :span="10" class="flex-container">
            <!-- <a-input v-model:value="filters.sliceNo" placeholder="请输入病理号" class="content_input content_input_width" /> -->
            <!-- <a-select v-model:value="filters.quality" :options="qualityOptions" placeholder="请选择病理扫描质量"
              class="status_select" allowClear style=" width: 9vw;"></a-select> -->
            <a-select v-model:value="filters.result" :options="resultOptions" placeholder="请选择辅助处理结果"
              class="status_select" allowClear style=" width: 9vw;"></a-select>
            <a-select v-model:value="filters.status" :options="statusOptions" placeholder="请选择处理状态"
              class="status_select" allowClear style=" width: 9vw;"></a-select>
            <a-select v-show="userOptions.length > 0" v-model:value="filters.userId" :options="userOptions"
              placeholder="请选择上传用户" class="status_select" allowClear style=" width: 9vw;"></a-select>
          </a-col>
          <a-col :span="14" class="flex-container" style="justify-content: end;">
            <p class="right_text">上传时间</p>
            <a-range-picker size="default" class="date_picker" v-model:value="filters.uploadTime" />
            <p class="right_text">复核时间</p>
            <a-range-picker size="default" class="date_picker" v-model:value="filters.saveResultTime" />
            <a-input v-model:value="filters.sliceNo" placeholder="请输入搜索内容" class="content_input">
              <template #suffix>
                <img src="../../assets/icon/icon搜索.png" alt="">
              </template>
            </a-input>
          </a-col>
        </a-row>

        <!-- 中间列表 -->
        <div class="table-container">
          <AtTable :columns="tableColumns" :dataSource="tableData" size="large" :scroll="{ y: 'calc(100vh - 380px)' }"
            :pagination="{
              current: currentPage,
              pageSize: pageSize,
              total: totalSize,
              onChange: onChange,
              onShowSizeChange: (current, size) => {
                pageSize = size;
                currentPage = 1;
                // fetchData(filters);
              },
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showQuickJumper: true,
              showTotal: total => `共 ${total} 条`
            }" :rowClassName="(_, index) => index % 2 !== 0 ? 'shadowCard' : ''" :rowKey="record => record.id"
            :rowSelection="{
              selectedRowKeys: state.checkedList,
              onChange: keys => state.checkedList = keys,
              getCheckboxProps: record => ({
                disabled: !isSliceProcessed(record.status)
              })
            }">
            <!-- 自定义空状态 -->
            <template #emptyText>
              <div style="display: flex; justify-content: center; align-items: center; height: 50vh;">
                <el-empty description="暂无切片数据" :image-size="200" />
              </div>
            </template>
            <!-- Column for serial number -->
            <template #bodyCell="{ column, text, record, index }">
              <!-- Serial Number Column -->
              <template v-if="column.dataIndex === 'index'">
                <span class="text_no">{{ index + 1 }}</span>
              </template>

              <!-- Slice Number Column -->
              <template v-else-if="column.dataIndex === 'sliceNo'">
                <div class="number_c">{{ record.no }}</div>
              </template>

              <!-- Thumbnail Image Column -->
              <template v-else-if="column.dataIndex === 'img'">
                <div class="list_img_center" v-if="isSliceParseProcessing(record.status)">
                  <LoadingOutlined :style="{ fontSize: '1.5vw', color: '#242BA0' }" />
                </div>
                <a-popover v-else placement="right" trigger="hover" :mouseEnterDelay="0.3"
                  :overlayStyle="{ padding: 0 }">
                  <template #content>
                    <div class="image-preview-container">
                      <img :src="record.img" alt="slice-preview" class="preview-image" />
                    </div>
                  </template>
                  <div class="list_img">
                    <!-- object-fit: contain - 确保整个图片在容器内可见，保持原始宽高比。可能会在图片周围留有空白。
                    object-fit: cover - 填满整个容器，但可能会裁剪图片部分区域（目前您遇到的问题）。
                    object-fit: fill - 拉伸图片以填满容器，但可能会扭曲图片。
                    object-fit: scale-down - 类似于 contain，但不会放大图片超过其原始大小。
                    -->
                    <img :src="record.img" alt="slice-thumbnail" style="object-fit: fill;" />
                  </div>
                </a-popover>
              </template>

              <!-- User Column -->
              <template v-else-if="column.dataIndex === 'uploadUserRealName'">
                <span class="text_no">{{ record.uploadUserRealName || '-' }}</span>
              </template>

              <!-- Status Column -->
              <template v-else-if="column.dataIndex === 'status'">
                <div v-if="record.status == SliceStatusEnum.PROCESSING || record.status == SliceStatusEnum.PARSING"
                  style="display: flex; align-items: center; flex-direction: column; justify-content: center;">
                  <FlowingProgressBar />
                  <span class="text_no">{{ getSliceStatusText(record.status) }}</span>
                </div>
                <span class="text_no" v-else>{{ getSliceStatusText(record.status) }}</span>
              </template>

              <!-- Result Column -->
              <template v-else-if="column.dataIndex === 'result'">
                <span class="text_no" v-if="record.status == SliceStatusEnum.PARSE_SUCCESS">-</span>
                <span class="text_no" v-else-if="record.status == SliceStatusEnum.PROCESSING">{{
                  getSliceStatusText(record.status)
                }}</span>
                <span class="text_no" v-else>{{ record.result }}</span>
              </template>

              <!-- Detail Column -->
              <template v-else-if="column.dataIndex === 'detail'">
                <span class="blue_text text_click" v-if="isSliceProcessed(record.status)"
                  @mouseenter="() => delayShowResult(record, 500)" @mouseleave="clearHoverTimeout"
                  @click="checkSliceProcessResult(record)">查看详情</span>
                <span class="text_no" v-else>-</span>
              </template>

              <!-- Focus Column -->
              <template v-else-if="column.dataIndex === 'focus'">
                <span class="text_no">{{ record.focus != null ? ` ${record.focus} ` : ' 40 ' }}倍</span>
              </template>

              <!-- Time Column -->
              <template v-else-if="column.dataIndex === 'time'">
                <span class="text_no">{{ record.time }}</span>
              </template>

              <!-- Operations Column -->
              <template v-else-if="column.dataIndex === 'operation'">
                <a-tooltip color="white">
                  <template #title>
                    <div class="tip_text" v-if="isSliceProcessed(record.status)">复核</div>
                    <div class="tip_text" v-else>AI分析</div>
                  </template>
                  <img src="../../assets/icon/icon处理.png" alt="" class="icon_style"
                    @click="AIDetect(record.status, record.id)">
                </a-tooltip>
                <a-tooltip color="white">
                  <template #title>
                    <div class="tip_text">删除</div>
                  </template>
                  <a-popconfirm title="你确定要删除这张切片吗?" ok-text="是" cancel-text="否" @confirm="confirm(record.id)"
                    placement="bottom">
                    <img src="../../assets/icon/icon删除.png" alt="" class="icon_style" style="margin-left: 10px;">
                  </a-popconfirm>
                </a-tooltip>
                <a-tooltip color="white">
                  <template #title>
                    <div class="tip_text">重新解析</div>
                  </template>
                  <a-popconfirm title="你确定要重新解析这张切片吗?" ok-text="是" cancel-text="否" @confirm="handleReupload(record.id)"
                    placement="bottom">
                    <img v-show="isSliceInFailureState(record.status)" src="../../assets/icon/刷新.png" alt=""
                      class="icon_style">
                  </a-popconfirm>
                </a-tooltip>
                <a-tooltip color="white">
                  <template #title>
                    <div class="tip_text">重新处理</div>
                  </template>
                  <a-popconfirm title="你确定要重新处理这张切片吗?" ok-text="是" cancel-text="否" @confirm="reHandleAI(record.id)"
                    placement="bottom">
                    <img v-show="record.status == SliceStatusEnum.PROCESS_FAILED" src="../../assets/icon/刷新.png" alt=""
                      class="icon_style">
                  </a-popconfirm>
                </a-tooltip>
              </template>
            </template>
          </AtTable>
        </div>

        <!-- 底部代码 -->
        <!-- 暂时隐藏批量处理操作 -->
        <!-- <a-row class="bottom_box">
          <a-col :span="3" style="display: flex;justify-content: center; align-items: center;">

            <a-tooltip color="white">
              <template #title>
                <div class="tip_text">一键AI分析</div>
              </template>
              <img src="../../assets/icon/icon处理.png" alt="" class="icon_style" @click="AIDetectALL()">
            </a-tooltip>
            <a-tooltip color="white">
              <template #title>
                <div class="tip_text">一键删除</div>
              </template>
              <img src="../../assets/icon/icon删除.png" alt="" class="icon_style" style="margin-left: 10px;"
                @click="deleteSlices">
            </a-tooltip>
          </a-col>

          <a-col :span="21" style="display: flex;justify-content: end;align-items: center;">
            <a-pagination v-model:current="currentPage" show-quick-jumper :total="totalSize" @change="onChange"
              v-model:pageSize="pageSize" :show-total="total => `共 ${total} 条`" showSizeChanger
              :pageSizeOptions="['10', '20', '50', '100']" />
            <a-button style="margin-left: 10px;">确定</a-button>
          </a-col>
        </a-row> -->

      </a-card>
    </a-col>
  </a-row>

  <!-- 弹窗 -->
  <a-modal v-model:open="modalOpen" title="上传切片" :footer="null" :width="modalWidth"
    :closable="modalWidth === '400px' ? false : true" @cancel="closeModal(e)">
    <div class="modal-scroll-container">
      <el-empty description="暂无上传切片数据" v-show="uploadList.length == 0" />
      <a-row :gutter="10">
        <a-col :span="modalWidth === '400px' ? 24 : 12" v-for="data in uploadList" :key="data.name">
          <div class="box">
            <a-col :span="5">
              <div class="img-outer"
                v-loading="data.status == SliceStatusEnum.UPLOADING || data.status == SliceStatusEnum.UPLOAD_FAILED">
                <img v-if="data.status != SliceStatusEnum.UPLOADING && data.status != SliceStatusEnum.UPLOAD_FAILED"
                  :src="data.img" alt="">
                <img v-else src="../../assets/nullImage.jpg">
              </div>
            </a-col>
            <a-col :span="15">
              <div class="box-text">{{ data.name }}</div>
              <a-progress :percent="data.percent" :show-info="false" size="small" />
            </a-col>
            <a-col :span="4" style="display: flex;justify-content: end;">
              <a-tooltip color="white">
                <template #title>
                  <div class="tip_text">取消上传</div>
                </template>
                <a-popconfirm title="你确定要取消上传这张切片吗?" ok-text="是" cancel-text="否" @confirm="handleCancelUpload(data.id)"
                  placement="bottom">
                  <img src="../../assets/icon/icon删除.png" alt="" class="img-size">
                </a-popconfirm>
              </a-tooltip>
            </a-col>
          </div>
        </a-col>
      </a-row>
    </div>
    <div class="cancel-btn" @click="cancelUploads">
      <p>全部取消</p>
    </div>
  </a-modal>

  <!-- 上传弹窗 -->
  <Modal v-model:open="uploadModal" title="" :footer="null" destroyOnClose :maskClosable="false">
    <div class="card2 cardcommon">
      <!-- <a-spin tip="上传中..." size="large" :spinning="isUploading" style="top: 150px;"> -->
      <div class="title">上传切片</div>
      <div class="left_card">
        <div v-if="!isUploading">
          <div style="width:300px; min-height: 250px; max-height: 100%;">
            <el-scrollbar>
              <div style="width: 100%; max-height: 40vh;">
                <a-upload-dragger v-model:fileList="fileList" name="file" :multiple="true" accept=".svs, .tmap"
                  :customRequest="uploadFiles" :beforeUpload="beforeUpload" :onChange="onFileChange">
                  <div class="custom-upload-dragger">
                    <img src="../../assets/upload/undraw_folder_files_re_2cbm1.png" class="full-image" alt="">
                  </div>
                </a-upload-dragger>
              </div>
            </el-scrollbar>
          </div>
          <div class="text">点击上方图片选择文件，再点击下方点击上传按钮进行切片上传</div>
        </div>

        <!-- Upload queue display -->
        <div v-else class="upload-queue-container">
          <el-scrollbar>
            <div v-for="(item, index) in uploadQueue" :key="index" class="upload-queue-item-list">
              <div style="flex: 1;">
                <div style="font-size: 14px; margin-bottom: 4px;">{{ item.name }}</div>
                <a-progress :percent="item.progress" :status="item.status === 'error' ? 'exception' : undefined"
                  size="small" />
              </div>
              <div style="margin-left: 16px;">
                <a-tooltip color="white" v-if="item.status === 'pending'">
                  <template #title>
                    <div class="tip_text">取消上传</div>
                  </template>
                  <a-popconfirm title="你确定要取消上传这张切片吗?" ok-text="是" cancel-text="否" @confirm="removeFromQueue(index)"
                    placement="bottom">
                    <img src="../../assets/icon/icon删除.png" alt="" class="img-size"></a-popconfirm>
                </a-tooltip>
                <a-tag v-else
                  :color="item.status === 'success' ? 'success' : (item.status === 'error' ? 'error' : 'processing')">
                  {{ item.status === 'success' ? '完成' : (item.status === 'error' ? '失败' : '上传中') }}
                </a-tag>
              </div>
            </div>
          </el-scrollbar>
        </div>

        <!-- optional buttons -->
        <div style="display: flex; column-gap: 16px; margin-top: 16px;">
          <a-button v-if="!isUploading" class="btn" @click="uploadFiles"
            :disabled="isUploading || fileList.length === 0">
            开始上传
          </a-button>
          <a-button v-else type="default" @click="cancelAllPendingUploads"
            :disabled="!isUploading || uploadQueue.length === 0" danger>
            全部取消
          </a-button>
        </div>
        <!-- <div style="color: red; font-size: 12px; margin-top: 10px;">文件名不可为中文</div> -->
      </div>
      <!-- </a-spin> -->
    </div>
  </Modal>

  <!-- process result -->
  <Modal v-model:open="resultModal" title="处理结果" :footer="null" destroyOnClose maskClosable centered>
    <ProcessResult :aiResult="resultModel.aiResult" :result="resultModel.result" :collectionArea="openCollectionArea" />
  </Modal>
</template>

<script setup>
import { reactive, watch, computed, ref, onMounted, createVNode, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import * as sliceAPI from '../../api/slice.js';
import { useSliceDataStore } from '../../stores/SiceDataStore.js'
import { userUserStore } from '../../stores/UserStore';
import { useDictionaryStore } from '../../stores/DictionaryStore';
import { storeToRefs } from 'pinia';
import { Modal, message, Table as AtTable } from 'ant-design-vue';
import ProcessResult from '../../components/commons/ProcessResult.vue';
import { ExclamationCircleOutlined, LoadingOutlined } from '@ant-design/icons-vue';
import {
  getSliceStatusText, isSliceInFailureState, isSliceParseProcessing, isSliceProcessed, isSliceProcessing,
  sliceQualityOptions, sliceResultOptions, SliceStatusEnum, sliceStatusOptions
} from '../../common/sliceTypes.js';
import FlowingProgressBar from '../../components/commons/FlowingProgressBar.vue';
import { getAllUsersInfo } from '../../api/user.js';
import { useLayoutStore } from '../../stores/LayoutStore.js';

// 状态管理
const LayoutStore = useLayoutStore();
const { changeLeftCard } = LayoutStore;

/**
 * 
 *  <a-col :span="2" class="column_name">序号</a-col>
    <a-col :span="2" class="column_name">病理号</a-col>
    <a-col :span="2" class="column_name">缩略图</a-col>
    <a-col :span="2" class="column_name">上传用户</a-col>
    <a-col :span="3" class="column_name">处理进度</a-col>
    <a-col :span="3" class="column_name">处理结果</a-col>
    <a-col :span="2" class="column_name">处理详情</a-col>
    <!-- 暂时去除切片质量 20250306 -->
    <!-- <a-col :span="2" class="column_name">切片质量</a-col> -->
    <a-col :span="2" class="column_name">扫描倍数</a-col>
    <a-col :span="3" class="column_name">阅片时间</a-col>
    <a-col :span="3" class="column_name">操作</a-col>
 */
const tableHeaderData = ref([
  { text: '序号', span: 2 },
  { text: '病理号', span: 2 },
  { text: '缩略图', span: 2 },
  { text: '上传用户', span: 2 },
  { text: '处理进度', span: 3 },
  { text: '处理结果', span: 3 },
  { text: '处理详情', span: 2 },
  { text: '扫描倍数', span: 2 },
  { text: '阅片时间', span: 3 },
  { text: '操作', span: 3 },
]);

const tableColumns = [
  { title: '序号', dataIndex: 'index', key: 'index', width: '60px', align: 'center' },
  { title: '病理号', dataIndex: 'sliceNo', key: 'sliceNo', width: '140px', align: 'center' },
  { title: '缩略图', dataIndex: 'img', key: 'img', width: '60px', align: 'center' },
  { title: '上传用户', dataIndex: 'uploadUserRealName', key: 'uploadUserRealName', width: '100px', align: 'center' },
  { title: '处理进度', dataIndex: 'status', key: 'status', width: '100px', align: 'center' },
  { title: '处理结果', dataIndex: 'result', key: 'result', width: '100px', align: 'center' },
  { title: '处理详情', dataIndex: 'detail', key: 'detail', width: '100px', align: 'center' },
  { title: '扫描倍数', dataIndex: 'focus', key: 'focus', width: '100px', align: 'center' },
  { title: '部位', dataIndex: 'collectionArea', key: 'collectionArea', width: '100px', align: 'center' },
  { title: '上传时间', dataIndex: 'uploadTime', key: 'uploadTime', width: '120px', align: 'center' },
  { title: '复核时间', dataIndex: 'saveResultTime', key: 'saveResultTime', width: '120px', align: 'center' },
  { title: '操作', dataIndex: 'operation', key: 'operation', width: '140px', align: 'center' }
]

//顶部查询
const options = ref([]);
const qualityOptions = ref(sliceQualityOptions);
const resultOptions = ref(sliceResultOptions);

// add user selection options and slice status options
const userOptions = ref([]);
const statusOptions = ref(sliceStatusOptions);

const UserStore = userUserStore()
const { isSelfChange } = storeToRefs(UserStore)

const DictionaryStore = useDictionaryStore()

const SliceDataStore = useSliceDataStore()

let timer = null; // 定义计时器的引用
onMounted(() => {
  fetchData(filters) //初始化数据
  DictionaryStore.fetchDictionary()

  const role = localStorage.getItem("role")

  if (role == '主任') {
    // request all users
    fetchAllUsers()
  }
})

// request all users
const fetchAllUsers = async () => {
  let res = await getAllUsersInfo()
  /**
   {
      "code" : 200,
      "msg" : "获取成功",
      "data" : [ {
        "user" : {
          "id" : 2,
          "username" : "admin",
          "password" : "$2a$10$N61R8IZadwDar83Tnoh08.Ihbbu75RJC8rTxTHddcei9TjbAx1gDy",
          "realname" : "管理员",
          "hospital" : "xx医院",
          "department" : "病理科",
          "gender" : "男",
          "introduction" : "科室主任",
          "avatarPath" : "https://pipelinemedical.com/wp-content/uploads/2018/03/doctor-icon.png",
          "electronicSignaturePath" : null,
          "roleId" : 1
        },
        "roleName" : "主任"
      }, {
        "user" : {
          "id" : 3,
          "username" : "33333",
          "password" : "$2a$10$sphnNXgL9AqJiBDSSV1VpukcX6xqEOmoO6hrL6BkpoNb.FurKJFbC",
          "realname" : "33333",
          "hospital" : "xxx",
          "department" : "病理科",
          "gender" : "女",
          "introduction" : null,
          "avatarPath" : "https://pipelinemedical.com/wp-content/uploads/2018/03/doctor-icon.png",
          "electronicSignaturePath" : null,
          "roleId" : 2
        },
        "roleName" : "医生"
      } ]
    }
   */
  const options = res.data.map(item => {
    return {
      label: item.user.realname,
      value: item.user.id
    }
  })
  userOptions.value = options
}


onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null;
  }
  if (checkProgressInterval) {
    clearInterval(checkProgressInterval)
  }
})

const router = useRouter()

//文件上传
const uploadCount = computed(() => tableData.value.map((item) => item.status === SliceStatusEnum.UPLOADING).length);
const fileList = ref([]);
//上传弹窗
const uploadModal = ref(false)

let uploadQueue = ref([
  // {
  //   file: null,
  //   name: 'test-file-name1',
  //   status: 'success', // pending, uploading, success, error
  //   progress: 100
  // },
  // {
  //   file: null,
  //   name: 'test-file-name2',
  //   status: 'pending', // pending, uploading, success, error
  //   progress: 0
  // },
  // {
  //   file: null,
  //   name: 'test-file-name3',
  //   status: 'pending', // pending, uploading, success, error
  //   progress: 0
  // },
  // {
  //   file: null,
  //   name: 'test-file-name4',
  //   status: 'pending', // pending, uploading, success, error
  //   progress: 0
  // },
  // {
  //   file: null,
  //   name: 'test-file-name5',
  //   status: 'pending', // pending, uploading, success, error
  //   progress: 0
  // },
]);
let currentUploadIndex = ref(0);
//手动上传
const isUploading = ref(false)
let intervalId = null;

// 去除重复文件名的文件:
const uniqueArr = (arr, tableData) => {
  // 提取 tableData 中的文件名和对应的所有 sliceNo
  const existingFileMap = tableData.reduce((map, item) => {
    if (!map.has(item.originalFileName)) {
      map.set(item.originalFileName, []);
    }
    map.get(item.originalFileName).push(item.sliceNo);
    return map;
  }, new Map());

  // 使用 Map 检查 arr 中是否有重复文件名
  const uniqueFiles = new Map();
  arr.value.forEach((file) => {
    // 检查是否与 tableData 重名
    if (existingFileMap.has(file.name)) {
      const sliceNos = existingFileMap.get(file.name); // 找到对应的所有 sliceNo
      message.warning(`文件 ${file.name} 与编号为 [${sliceNos.join(', ')}] 的切片上传的文件相同，已移除`);
      return; // 跳过该文件
    }

    // 检查是否在 arr 中重复
    if (uniqueFiles.has(file.name)) {
      message.warning(`文件 ${file.name} 与已有文件重名，已移除`);
      return; // 跳过该文件
    }

    // 将文件加入 uniqueFiles
    uniqueFiles.set(file.name, file);
  });

  // 返回去重后的文件数组
  return Array.from(uniqueFiles.values());
};

const onFileChange = async () => {
  let res = await sliceAPI.getSliceFileNames();
  fileList.value = uniqueArr(fileList, res.data);
}

const beforeUpload = () => {
  // return true //自动上传
  return false //手动点击上传
}

// Modified upload function for sequential uploads
const uploadFiles = async () => {
  if (fileList.value.length == 0) {
    message.warning("没有选择文件，请先选择文件再上传")
    return
  }
  // console.log("fileList:", fileList.value);

  isUploading.value = true
  // Create upload queue from fileList
  uploadQueue.value = [...fileList.value.map(file => ({
    file: file.originFileObj,
    name: file.name,
    status: 'pending', // pending, uploading, success, error
    progress: 0
  }))];

  // Clear fileList since we've moved files to our queue
  fileList.value = [];

  // Begin sequential upload
  currentUploadIndex.value = 0;
  uploadNextFile();
}


// Function to upload the next file in the queue
const uploadNextFile = async () => {
  if (currentUploadIndex.value >= uploadQueue.value.length) {
    // All files uploaded
    isUploading.value = false;
    message.success("所有文件上传完成");
    allFilesUploadSuccess();
    return;
  }

  const currentFile = uploadQueue.value[currentUploadIndex.value];
  currentFile.status = 'uploading';

  // Show uploading message
  message.info(`正在上传 ${currentFile.name}...`);

  // Setup progress simulation (replace with real progress if your API supports it)
  let progressInterval = setInterval(() => {
    if (currentFile.progress < 90) {
      currentFile.progress += 10;
    }
  }, 500);

  try {
    let formdata = new FormData();
    formdata.append("files", currentFile.file);

    let res = await sliceAPI.upload(formdata);

    clearInterval(progressInterval);

    if (res.code == 200) {
      currentFile.progress = 100;
      currentFile.status = 'success';
      message.success(`文件 ${currentFile.name} 上传成功`);
    } else {
      currentFile.status = 'error';
      message.error(`文件 ${currentFile.name} 上传失败: ${res.msg || '未知错误'}`);
    }
  } catch (error) {
    clearInterval(progressInterval);
    currentFile.status = 'error';
    message.error(`文件 ${currentFile.name} 上传失败: ${error.message || '网络错误'}`);
  }

  // Move to next file
  currentUploadIndex.value++;
  // Continue with next file
  uploadNextFile();
}

const allFilesUploadSuccess = () => {
  uploadModal.value = false
  // Start timer for checking slice parsing status
  if (timer === null) {
    message.success("文件正在解析中，详情请查看列表")
    timer = setInterval(() => {
      fetchData();
    }, 2000);
  }
}

// Function to remove a file from the upload queue
const removeFromQueue = (index) => {
  const file = uploadQueue.value[index];
  if (file.status === 'pending') {
    uploadQueue.value.splice(index, 1);
    // If we're removing a file before the current upload index, adjust the index
    if (index < currentUploadIndex.value) {
      currentUploadIndex.value--;
    }
  } else {
    message.warning('只能移除待上传的文件');
  }
}

// Function to cancel all pending uploads
const cancelAllPendingUploads = () => {
  // Only keep files that are not in 'pending' status
  uploadQueue.value = uploadQueue.value.filter(file =>
    file.status !== 'pending'
  );
}

// upload multiple files
const upload = async () => {
  if (fileList.value.length == 0) {
    message.warning("没有选择文件，请先选择文件再上传")
    return
  }
  isUploading.value = true
  intervalId = setInterval(() => {
    if (isUploading.value) {
      message.info('文件上传中.....', 3);
    }
  }, 3000);
  let formdata = new FormData()
  fileList.value.forEach((item) => {
    // console.log(item.originFileObj)
    formdata.append("files", item.originFileObj)
  })
  try {
    let res = await sliceAPI.upload(formdata)
    fileList.value = []
    // close upload modal
    uploadModal.value = false
    if (res.code == 200) {
      isUploading.value = false
      clearInterval(intervalId);
      message.success("文件正在解析中，详情请查看列表")
      // start timer
      timer = setInterval(() => {
        fetchData()
      }, 2000);
    } else {
      isUploading.value = false
      clearInterval(intervalId);
    }
  } catch (error) {
    isUploading.value = false
    clearInterval(intervalId);
    message.error("上传失败")
  }
}

//自动上传
const customUpload = async (raw) => {
  uploadFiles(raw.file)
  // let formdata = new FormData()
  // formdata.append("files", raw.file)
  // let res = await sliceAPI.upload(formdata)
  // if (res.code == 200) {
  // uploadCount.value++;
  // message.success("文件正在上传中，详情请查看列表")
  // }
}

//根据id取消上传:
const handleCancelUpload = async (id) => {
  let res = await sliceAPI.cancelUpload(id);
  if (res.code == 200) {
    message.success("取消成功")
  }
}

//批量取消上传:
const cancelUploads = async () => {
  Modal.confirm({
    title: '提示',
    icon: createVNode(ExclamationCircleOutlined),
    content: '你确认要取消上传全部切片吗？',
    okText: '确认',
    cancelText: '取消',
    centered: true,
    async onOk() {
      if (uploadList.value.length == 0) {
        message.warn("目前没有正在处理的切片")
        return
      } else if (uploadList.value.length == 1) {
        message.warn("当前切片正在处理中,无法取消上传")
        return
      }
      let res = await sliceAPI.cancelUploads();
      if (res.code == 200) {
        message.success("取消成功")
      }
    },
  });
}

//重新上传:
const handleReupload = async (id) => {
  // console.log("id：", id);
  let res = await sliceAPI.reUpload(id);
  if (res.code == 200) {
    message.success("操作成功")
    fetchData(filters)
  }
}

// rehandle ai analysis
const reHandleAI = async (id) => {
  AIDetect(SliceStatusEnum.PROCESS_FAILED, id)
}

//Ai分析
const AIDetect = async (status, id) => {
  if (status == SliceStatusEnum.PROCESSING) {
    message.info("切片正在处理中，请耐心等待完成")
    return
  }

  function getSliceErrorMsg(status) {
    let errorMsg = "";
    if (status == SliceStatusEnum.PARSING) {
      errorMsg = "切片未解析成功，请等待解析完成"
      return
    }
    if (status == SliceStatusEnum.UPLOADING) {
      errorMsg = "切片未上传成功，请等待上传完成"
      return
    }
    if (status == SliceStatusEnum.UPLOAD_FAILED) {
      errorMsg = "切片上传失败，请重新上传"
    }
    if (status == SliceStatusEnum.PARSE_FAILED) {
      errorMsg = "切片解析失败，请重新解析"
    }
    return errorMsg
  }

  const errorMsg = getSliceErrorMsg(status);
  if (errorMsg.length > 0) {
    message.error(errorMsg)
    return
  }

  // if status is process success, start hunmanize analysis/review
  if (isSliceProcessed(status)) {
    handleSingleSlice(id)
    return
  }
  let res = await sliceAPI.AIAnalyze(id)
  if (res.code == 200) {
    message.info("正在进行AI分析....")
    fetchData(filters)
  }
}

//一键AI分析
const AIDetectALL = async () => {
  if (state.checkedList.length <= 0) {
    message.error("未选择切片")
    return
  }
  let res = await sliceAPI.AIAnalyze(state.checkedList)
  if (res.code == 200) {
    message.info("正在进行AI分析....")
    state.checkedList = []
    fetchData(filters)
  }
}

//查询的一些参数
const filters = reactive({
  // 上传时间范围 
  uploadTime: null,
  // 保存结果的时间，保存后为已复核的状态
  saveResultTime: null,
  // 处理状态
  status: null,
  //切片编号
  sliceNo: null,
  quality: null,
  result: null,
  userId: null
});

//分页相关数据：
const currentPage = ref(1); //当前页数
const pageSize = ref(10);
const totalSize = ref(0);
const curCount = ref(0);//当前页的数据量


//条件查询的监听:
watch(filters, (newFilters) => {
  // console.log('当前筛选条件:', newFilters);
  // 查询逻辑:
  fetchData(newFilters)
}, { deep: true } // 深度监听
);

//条件查询数据:
const fetchData = async (inputParams = null) => {
  const filtersParams = inputParams || filters;
  if (curCount.value <= 0 && currentPage.value >= 2) { //防止在某一页删完的时候停留在那一页
    currentPage.value--;
  }
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

  const response = await sliceAPI.querySlideData(params);
  const { data } = response;

  if (data == null) return
  if (data.records == null) return

  const tissueType = import.meta.env.VITE_APP_TISSUE_TYPE
  let collectionArea = '胃'
  if (tissueType == 'colon') {
    collectionArea = '肠'
  } else if (tissueType == 'liver') {
    collectionArea = '肝'
  } else if (tissueType == 'lung') {
    collectionArea = '肺'
  } else if (tissueType == 'stomach') {
    collectionArea = '胃'
  }

  data.records.forEach((record) => {
    record.collectionArea = collectionArea;
  });

  tableData.value = data.records.map((record) => ({
    ...record,
    no: `No.${record.sliceNo}`, // 将 id 转换为 No.xxx 格式
    img: record.thumbnailPath ? record.thumbnailPath.replace(/\\/g, '/') : 'src/assets/nullImage.jpg',
    time: record.processTime,
    focus: record.magnification,
    quality: record.overallQuality,
    mainStyle: record.mainHeatmapStyle,
    subStyle: record.subHeatmapStyle,
    // status: SliceStatusEnum.PROCESS_SUCCESS
    collectionArea: collectionArea,
  }));

  console.log("tableData:", tableData.value);

  totalSize.value = data.total //总数
  curCount.value = data.records.length

  // if status is not uploading, end timer
  const uploadingCount = data.records.filter(
    (record) => isSliceProcessing(record.status)).length;
  if (uploadingCount > 0 && timer == null) {
    timer = setInterval(() => {
      fetchData();
    }, 2000);
  }
  if (uploadingCount === 0 && timer != null) {
    clearInterval(timer);
    timer = null;
  }

  // if status is processing, start ai progress timer
  const processingCount = data.records.filter((e) => e.status === SliceStatusEnum.PROCESSING).length;
  if (processingCount > 0 && checkProgressInterval == null) {
    // fetch AI progress
    checkProgressInterval = setInterval(async () => {
      await getAIprogress();
    }, 1500);
  }
  if (processingCount == 0 && checkProgressInterval != null) {
    clearInterval(checkProgressInterval);
    checkProgressInterval = null;
  }
};

//获取处理进度条
let checkProgressInterval = null;

async function getAIprogress() {
  let res = await sliceAPI.getAIProcessProgress()
  let progressData = res.data
  if (progressData == null) return
  for (let item of tableData.value) {
    if (item.status === SliceStatusEnum.PROCESSING && progressData.hasOwnProperty(item.id)) {
      item.percent = progressData[item.id];
      if (item.percent == 100) fetchData(filters)
    }
  }
}

//页码变化：
const onChange = (page, pageN) => {
  currentPage.value = page;
  pageSize.value = pageN;
  fetchData(filters);
};

//删除的函数:
const confirm = (id) => {
  deleteSlice(id)
};

const deleteSlice = async (sliceIds) => {
  const response = await sliceAPI.deleteSlices(sliceIds);
  // console.log(response)
  if (response.code == 200) {
    message.success("删除成功")
    isSelfChange.value = true;
    curCount.value -= sliceIds.length;
    fetchData(filters)
  }
}

//处理的函数，将选择的slice list传递到全局store中
const handleSlice = async (sliceIds) => {
  const { setSliceList } = SliceDataStore
  const filteredSlices = tableData.value.filter((item) =>
    Array.isArray(sliceIds) ? sliceIds.includes(item.id) : item.id === sliceIds
  );
  curIndex.value = 0
  // 将筛选结果存储到全局 store:
  setSliceList(filteredSlices);
  router.push('/sliceDetailList')
}

const handleSingleSlice = async (sliceId) => {

  const { setSliceList } = SliceDataStore

  const filteredSlices = tableData.value.filter((item) =>
    item.id === sliceId
  );
  curIndex.value = 0
  // 将筛选结果存储到全局 store:
  setSliceList(filteredSlices);
  // console.log("filteredSlices:", filteredSlices);
  router.push('/sliceDetailList', { sliceId: sliceId })
}

const resultModal = ref(false)
const resultModel = ref({})

const hoverTimeout = ref(null);
const isHovering = ref(false);

// 鼠标离开隐藏详情
const hideResultOnHover = () => {
  // 清除悬停超时
  if (hoverTimeout.value) {
    clearTimeout(hoverTimeout.value);
    hoverTimeout.value = null;
  }

  // 设置一个短暂延迟，以便用户有时间将鼠标移动到模态框上
  setTimeout(() => {
    // 如果不是通过点击打开的模态框，则关闭它
    if (isHovering.value) {
      resultModal.value = false;
      isHovering.value = false;
    }
  }, 200);
};


// 悬停延迟相关变量
const resultHoverTimeout = ref(null);
const isResultHovering = ref(false);

const openCollectionArea = ref(null);

// 延迟显示结果的方法
const delayShowResult = (record, delay) => {
  const { id: sliceId, collectionArea } = record;
  // 先清除任何现有的超时
  clearResultHoverTimeout();

  // 设置新的延迟
  resultHoverTimeout.value = setTimeout(() => {
    openCollectionArea.value = collectionArea
    showResultOnHover(sliceId);
  }, delay); // 延迟500毫秒(0.5秒)才触发
};

// 清除悬停超时
const clearResultHoverTimeout = () => {
  if (hoverTimeout.value) {
    clearTimeout(resultHoverTimeout.value);
    resultHoverTimeout.value = null;
  }
};

// 原始的悬停显示方法（修改为不包含延迟逻辑）
const showResultOnHover = async (sliceId) => {
  try {
    // 请求AI结果和切片结果
    const ai_response = await sliceAPI.getAIResult(sliceId);
    const response = await sliceAPI.getResult(sliceId);

    const sliceResult = response.data;
    const aiResult = ai_response.data;

    if (aiResult != null) {
      resultModel.value = {
        result: sliceResult,
        aiResult: aiResult
      };
      isResultHovering.value = true;
      resultModal.value = true;
    }
  } catch (error) {
    console.error('加载详情数据失败:', error);
  }
};

const checkSliceProcessResult = async (record) => {
  const { id: sliceId, collectionArea } = record;
  openCollectionArea.value = collectionArea
  // request slice result and ai result
  const ai_response = await sliceAPI.getAIResult(sliceId)
  const response = await sliceAPI.getResult(sliceId)
  const sliceResult = response.data
  const aiResult = ai_response.data

  resultModel.value = {
    result: sliceResult,
    aiResult: aiResult
  }
  // show modal
  if (aiResult != null) {
    resultModal.value = true
  } else {
    message.error("未获取到处理结果")
  }
}

//一键删除：
const deleteSlices = async () => {
  if (state.checkedList.length <= 0) {
    message.error("未选择切片")
    return
  }
  
  Modal.confirm({
    title: '提示',
    icon: createVNode(ExclamationCircleOutlined),
    content: '你确认要删除这些切片吗？',
    okText: '确认',
    cancelText: '取消',
    centered: true,
    onOk() {
      deleteSlice(state.checkedList)
    },
  });
}

//一键处理：
const { curIndex } = storeToRefs(SliceDataStore)
const handleSliceList = async () => {
  if (state.checkedList.length <= 0) {
    message.error("未选择切片")
    return
  }
  if (state.checkedList.length > 1) {
    changeLeftCard(true)
  }
  curIndex.value = 0
  handleSlice(state.checkedList)
}

const ListCurIndex = ref()

const tableData = ref([
  // {
  //    id:1,
  //    no:"No.B20029380-4",
  //    status:"处理中",
  //    time:"2024.12.31 16:32",
  //    img:"src/assets/thumbnail/1.jpeg",
  //    percent:40,
  //    focus:80,
  //    result:"非肿瘤性",
  //    quality:"差"
  // },
  // {
  //    id:2,
  //    no:"No.B20029380-4",
  //    status:"未处理",
  //    time:"2024.12.31 16:32",
  //    img:"src/assets/thumbnail/2.jpeg",
  //    percent:40,
  //    focus:80,
  //    result:"癌前状态",
  //    quality:"差"
  // },

])

const plainOptions = computed(() => {
  return [...new Set(tableData.value.filter(item => isSliceProcessed(item.status)).map(item => item.id))];
});

//复选框:
const state = reactive({
  indeterminate: false,
  checkAll: false,
  checkedList: [],
});

const onCheckAllChange = e => {
  Object.assign(state, {
    checkedList: e.target.checked ? plainOptions.value : [],
    indeterminate: false,
  });
};

watch(
  () => state.checkedList,
  val => {
    state.indeterminate = !!val.length && val.length < plainOptions.value.length;
    state.checkAll = val.length === plainOptions.value.length;
  },
);




//弹窗
const modalOpen = ref(false);
// const showModal = () => {
//   modalOpen.value = true;
// };

// const closeModal = () => {
//   modalOpen.value = false;
//   setTimeout(() => {
//     modalWidth.value = '400px'
//   }, 1000);
// }

const modalWidth = ref('400px')
const showMoreUp = () => {
  modalWidth.value = '800px'
}

const uploadList = ref([
  // {
  //    name:"B20029380-4",
  //    status:"上传完毕",
  //    img:"src/assets/thumbnail/3.jpeg",
  //    percent:40
  // },
  // {
  //    name:"B20029380-5",
  //    status:"上传完毕",
  //    img:"src/assets/thumbnail/4.jpeg",
  //    percent:50
  // }
])

// 进度查询：
const fetchUploadData = async () => {
  const response = await sliceAPI.getUploadProgress();

  uploadList.value = response.data.map((item) => ({
    id: item.id,
    img: item.thumbnailPath.replace(/\\/g, "/"), // 替换路径中的反斜杠为正斜杠
    name: item.name,
    percent: item.progress * 100, // 假设 progress 是小数，转为百分比
    status: item.status,
  }));

  // console.log(uploadList.value)

  if (uploadList.value.length == 0 && timer != null) {
    // console.log("关闭定时器")
    clearInterval(timer);
    timer = null;//关闭定时器

    // request table data
    fetchData(filters)
  }
};

watch(() => uploadList.value.length, (newLength, oldLength) => {
  if (newLength < oldLength) {
    // console.log("上传列表减少了");
    fetchData(filters) // 刷新数据
  }
  if (newLength === 0) {
    // console.log("上传列表为0");
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
});


</script>

<style src="../../assets/styles/sliceList.scss" scoped></style>