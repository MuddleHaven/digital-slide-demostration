<template>
  <a-row :gutter="20">
    <div class="control-circle2" @click="changeListLeft(true)" v-show="!isLeft"><img
        src="../../assets/icon/Group 2508.png" alt=""></div>
    <a-col :span="getLeftSpan()">
      <AvatarCard />
      <a-card class="card2 cardcommon">
        <div class="title">上传切片 </div>
        <div class="left_card">
          <div style="width:300px;height: 250px;">
            <el-scrollbar :height="250">
              <a-upload-dragger v-model:fileList="fileList" name="file" :multiple="true" accept=".svs , .tmap, .png"
                :customRequest="customUpload" :beforeUpload="beforeUpload" :onChange="onFileChange">
                <div class="custom-upload-dragger">
                  <img src="../../assets/upload/undraw_folder_files_re_2cbm1.png" class="full-image" alt="">
                </div>
              </a-upload-dragger>
            </el-scrollbar>
          </div>
          <div class="text">点击上方图片选择文件，再点击下方点击上传按钮进行切片上传</div>
          <a-button class="btn" @click="upload" :disabled="isUploading">
            <p>点击上传</p>
          </a-button>
          <a-badge :count="uploadCount">
            <p @click="showModal" class="showModal-list">上传列表</p>
          </a-badge>
        </div>
        <div class="control-circle" @click="changeListLeft(false)"><img src="../../assets/icon/Group 2508.png" alt="">
        </div>

      </a-card>
    </a-col>
    <a-col :span="getRightSpan()">
      <a-card class="card3 cardcommon">
        <!-- 顶部查询按钮 -->
        <a-row>
          <a-col :span="18" class="flex-container">
            <p class="right_text">上传时间</p>
            <a-range-picker size="default" class="date_picker" v-model:value="filters.uploadTime" />
            <p class="right_text">处理时间</p>
            <a-range-picker size="default" class="date_picker" v-model:value="filters.processTime" />
            <a-select v-model:value="filters.status" :options="options" placeholder="请选择处理状态" class="status_select"
              allowClear style=" width: 160px;"></a-select>
          </a-col>
          <a-col :span="6" class="flex-container" style="justify-content: end;">
            <a-input v-model:value="filters.sliceNo" placeholder="请输入搜索内容" class="content_input">
              <template #suffix>
                <img src="../../assets/icon/icon搜索.png" alt="">
              </template>
            </a-input>
          </a-col>
        </a-row>

        <!-- 中间列表 -->
        <div class="scrollable-list-container" :class="{ 'empty-container': tableData.length == 0 }">
          <a-checkbox-group v-model:value="state.checkedList">
            <div class="list_column" v-for="data in tableData" :key="data.id"
              :class="{ 'shadowCard': ListCurIndex === data.id, 'list_column_width_max': !isLeft, 'list_column_width_min': isLeft }"
              @click="ListCurIndex = data.id">
              <a-col :span="1" style="display: flex; justify-content: center;">
                <a-checkbox :value="data.id"></a-checkbox>
              </a-col>
              <a-col :span="2">
                <div class="list_img">
                  <img :src="data.img" alt="">
                </div>
              </a-col>
              <a-col :span="6">
                <div class="number_c"> {{ data.no }} </div>
                <!-- <div class="symptom_c"> {{ data.disease }} </div> -->
                <div>
                  <span class="status_c" :style="statusColor(data.status)">
                    <span class="status_c_text">{{ data.status }} </span>
                  </span>
                  <span class="time_c"> {{ data.time }} </span>
                </div>
              </a-col>
              <a-col :span="15" style="display: flex; justify-content: end;">
                <a-tooltip color="white">
                  <template #title>
                    <div class="tip_text">处理</div>
                  </template>
                  <img src="../../assets/icon/icon处理.png" alt="" class="icon_style" @click="handleSlice(data.id)">
                </a-tooltip>
                <a-tooltip color="white">
                  <template #title>
                    <div class="tip_text">删除</div>
                  </template>
                  <a-popconfirm title="你确定要删除这张切片吗?" ok-text="是" cancel-text="否" @confirm="confirm(data.id)"
                    placement="bottom">
                    <img src="../../assets/icon/icon删除.png" alt="" class="icon_style" style="margin-left: 10px;"
                      @click="ListCurIndex = data.id;">
                  </a-popconfirm>
                </a-tooltip>
              </a-col>
            </div>
          </a-checkbox-group>
          <el-empty description="暂无切片数据" v-show="tableData.length == 0" :image-size="200" />
        </div>

        <!-- 底部代码 -->
        <a-row class="bottom_box">
          <a-col :span="4" style="display: flex;justify-content: center; align-items: center;">
            <a-checkbox v-model:checked="state.checkAll" :indeterminate="state.indeterminate"
              @change="onCheckAllChange">
            </a-checkbox>
            <a-tooltip color="white">
              <template #title>
                <div class="tip_text">一键处理</div>
              </template>
              <img src="../../assets/icon/icon处理.png" alt="" class="icon_style" @click="handleSlices">
            </a-tooltip>
            <a-tooltip color="white">
              <template #title>
                <div class="tip_text">一键删除</div>
              </template>
              <img src="../../assets/icon/icon删除.png" alt="" class="icon_style" style="margin-left: 10px;"
                @click="deleteSlices">
            </a-tooltip>
          </a-col>
          <a-col :span="20" style="display: flex;justify-content: center;align-items: center;">
            <a-pagination v-model:current="current1" show-quick-jumper :total="total1" @change="onChange"
              v-model:pageSize="size1" :show-total="total => `共 ${total} 条`" showSizeChanger
              :pageSizeOptions="['10', '20', '50', '100']" />
            <a-button style="margin-left: 10px;">确定</a-button>
          </a-col>
        </a-row>

      </a-card>
    </a-col>
  </a-row>


  <!-- 弹窗 -->
  <a-modal v-model:open="open" title="上传切片" :footer="null" :width="width"
    :closable="width === '400px' ? false : true" @cancel="closeModal(e)">
    <div class="modal-scroll-container">
      <el-empty description="暂无上传切片数据" v-show="uploadList.length == 0" />
      <a-row :gutter="10">
        <a-col :span="width === '400px' ? 24 : 12" v-for="data in uploadList" :key="data.name">
          <div class="box">
            <a-col :span="5">
              <div class="img-outer">
                <img v-if="data.status != '上传中' && data.status != '上传失败'" :src="data.img" alt="">
                <img v-else src="../../assets/nullImage.jpg">
              </div>
            </a-col>
            <a-col :span="15">
              <div class="box-text">{{ data.name }}</div>
              <a-progress :percent="data.percent" :show-info="false" size="small" />
            </a-col>
            <a-col :span="4" style="display: flex;justify-content: end;">
              <a-tooltip v-if="data.status != '上传失败'" color="white">
                <template #title>
                  <div class="tip_text">删除</div>
                </template>
                <img src="../../assets/icon/icon删除.png" alt="" class="img-size">
              </a-tooltip>
              <a-tooltip v-else color="white">
                <template #title>
                  <div class="tip_text">重新上传</div>
                </template>
                <img src="../../assets/icon/刷新.png" alt="" class="img-size">
              </a-tooltip>
            </a-col>
          </div>
        </a-col>
      </a-row>
    </div>
    <div style="width: 100%; display: flex;justify-content: space-around;margin-top: 20px;">
      <a-button class="up-btn">
        <p>上传更多</p>
      </a-button>
      <a-button class="up-btn" style="background: #242BA0;" @click="showMoreUp" v-if="width == '400px'">
        <p>上传进度</p>
      </a-button>
    </div>
    <div class="cancel-btn">
      <p>取消上传</p>
    </div>
  </a-modal>

</template>

<script setup>
import AvatarCard from '../../components/AvatarCard.vue';
import { reactive, watch, computed, ref, onMounted, createVNode, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import * as sliceAPI from '../../api/slice.js';
import { message } from 'ant-design-vue';
import { useSliceDataStore } from '../../stores/SiceDataStore.js'
import { userUserStore } from '../../stores/UserStore';
import { storeToRefs } from 'pinia';
import { useListStore } from '../../stores/ListStore.js';
import { Modal } from 'ant-design-vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { status } from 'nprogress';
import { fa } from 'element-plus/es/locales.mjs';


const ListStore = useListStore()
const { changeListLeft, getLeftSpan, getRightSpan } = ListStore
const { isLeft } = storeToRefs(ListStore)

const UserStore = userUserStore()
const { isSelfChange } = storeToRefs(UserStore)

const SliceDataStore = useSliceDataStore()


let timer = null; // 定义计时器的引用
onMounted(() => {
  fetchData(filters) //初始化数据

  timer = setInterval(() => {
    fetchUploadData()
  }, 1500);
})

onUnmounted(() => {
  clearInterval(timer)
})


const router = useRouter()

//文件上传
const uploadCount = ref(0)
const fileList = ref([]);

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

//手动上传
const isUploading = ref(false)
let intervalId = null;

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
    console.log(item.originFileObj)
    formdata.append("files", item.originFileObj)
  })
  let res = await sliceAPI.upload(formdata)
  uploadCount.value = fileList.value.length;
  fileList.value = []
  if (res.code == 200) {
    isUploading.value = false
    clearInterval(intervalId);
    message.success("文件正在解析中，详情请查看列表")
    isUploading.value = false
    timer = setInterval(() => {
      fetchUploadData()
    }, 1500);
  }
}

//自动上传
const customUpload = async (raw) => {
  let formdata = new FormData()
  formdata.append("files", raw.file)
  let res = await sliceAPI.upload(formdata)
  if (res.code == 200) {
    uploadCount.value++;
    message.success("文件正在上传中，详情请查看列表")
  }
}

//顶部查询
const options = ref([
  {
    value: '已处理',
    label: '已处理',
  },
  {
    value: '未处理',
    label: '未处理',
  },
  {
    value: '处理中',
    label: '处理中',
  },
]);

//查询的一些参数
const filters = reactive({
  uploadTime: null, // 上传时间范围
  processTime: null, // 处理时间范围
  status: null, // 处理状态
  sliceNo: null //切片编号
});

//分页相关数据：
const current1 = ref(1); //当前页数
const size1 = ref(10);
const total1 = ref(0);
const curCount = ref(0);//当前页的数据量


//条件查询的监听:
watch(
  () => filters, // 监听整个 filters 对象
  (newFilters) => {
    console.log('当前筛选条件:', newFilters);
    // 查询逻辑:
    fetchData(filters)
  },
  { deep: true } // 深度监听
);

//条件查询数据:
const fetchData = async (filters) => {
  if (curCount.value <= 0 && current1.value >= 2) { //防止在某一页删完的时候停留在那一页
    current1.value--;
  }
  const params = {
    current: current1.value,
    size: size1.value,
    uploadStartTime: filters.uploadTime ? filters.uploadTime[0] : null,
    uploadEndTime: filters.uploadTime ? filters.uploadTime[1] : null,
    processStartTime: filters.processTime ? filters.processTime[0] : null,
    processEndTime: filters.processTime ? filters.processTime[1] : null,
    status: filters.status,
    sliceNo: filters.sliceNo,
  };

  const response = await sliceAPI.querySlideData(params);

  console.log(response.data)

  tableData.value = response.data.records.map((record) => ({
    id: record.id,
    no: `No.${record.sliceNo}`, // 将 id 转换为 No.xxx 格式
    disease: record.diseaseName, // 
    status: record.status, // 直接使用 status
    time: record.processTime ? `${record.uploadTime} - ${record.processTime}` : record.uploadTime, // 如果没有 processTime，只显示 uploadTime
    img: record.thumbnailPath ? record.thumbnailPath.replace(/\\/g, '/') : 'src/assets/nullImage.jpg', // 如果没有缩略图，使用占位图
    uploadtime: record.uploadTime,
    processTime: record.processTime,
  }));

  total1.value = response.data.total //总数
  curCount.value = response.data.records.length
};

//页码变化：
const onChange = pageNumber => {
  current1.value = pageNumber
  fetchData(filters)
};

//删除的函数:
const confirm = (id) => {
  deleteSlice(id)
};

const deleteSlice = async (sliceIds) => {
  const response = await sliceAPI.deleteSlices(sliceIds);
  console.log(response)
  if (response.code == 200) {
    message.success("删除成功")

    isSelfChange.value = true;

    curCount.value -= sliceIds.length;
    fetchData(filters)
  }
}

//处理的函数
const handleSlice = async (sliceIds) => {

  const { setSliceList } = SliceDataStore

  const filteredSlices = tableData.value.filter((item) =>
    Array.isArray(sliceIds) ? sliceIds.includes(item.id) : item.id === sliceIds
  );
  curIndex.value = 0
  // 将筛选结果存储到全局 store:
  setSliceList(filteredSlices);

  //修改状态为处理中:
  const response = await sliceAPI.setSliceStatusChulizhong(sliceIds);
  router.push('/sliceDetailList')
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
const handleSlices = async () => {
  if (state.checkedList.length <= 0) {
    message.error("未选择切片")
    return
  }
  curIndex.value = 0
  handleSlice(state.checkedList)
}

const statusColor = (status) => {
  const statusColors = {
    '处理中': '#37AE2F',
    '未处理': '#EB6296',
    '已处理': '#242BA0'
  };
  return {
    backgroundColor: statusColors[status]
  }
};

const ListCurIndex = ref()

const tableData = ref([
  // {
  //    id:1,
  //    no:"No.B20029380-4",
  //    status:"处理中",
  //    time:"2024.12.31 16:32",
  //    img:"src/assets/thumbnail/1.jpeg"
  // },
  // {
  //    id:2,
  //    no:"No.B20029380-4",
  //    status:"处理中",
  //    time:"2024.12.31 16:32",
  //    img:"src/assets/thumbnail/2.jpeg"
  // },
  // {
  //    id:13,
  //    no:"No.B20029380-4",
  //    status:"处理中",
  //    time:"2024.12.31 16:32",
  //    img:"src/assets/thumbnail/3.jpeg"
  // },
  // {
  //    id:1,
  //    no:"No.B20029380-4",
  //    status:"处理中",
  //    time:"2024.12.31 16:32",
  //    img:"src/assets/thumbnail/1.jpeg"
  // },
  // {
  //    id:2,
  //    no:"No.B20029380-4",
  //    status:"处理中",
  //    time:"2024.12.31 16:32",
  //    img:"src/assets/thumbnail/2.jpeg"
  // },
  // {
  //    id:13,
  //    no:"No.B20029380-4",
  //    status:"处理中",
  //    time:"2024.12.31 16:32",
  //    img:"src/assets/thumbnail/3.jpeg"
  // },
  // {
  //    id:1,
  //    no:"No.B20029380-4",
  //    status:"处理中",
  //    time:"2024.12.31 16:32",
  //    img:"src/assets/thumbnail/1.jpeg"
  // },
  // {
  //    id:2,
  //    no:"No.B20029380-4",
  //    status:"处理中",
  //    time:"2024.12.31 16:32",
  //    img:"src/assets/thumbnail/2.jpeg"
  // },
  // {
  //    id:13,
  //    no:"No.B20029380-4",
  //    status:"处理中",
  //    time:"2024.12.31 16:32",
  //    img:"src/assets/thumbnail/3.jpeg"
  // },
])

const plainOptions = computed(() => {
  return [...new Set(tableData.value.map(item => item.id))];
});

//复选框:
const state = reactive({
  indeterminate: false,
  checkAll: false,
  checkedList: [],
});

const onCheckAllChange = e => {
  console.log(plainOptions)
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
const open = ref(false);

const showModal = () => {
  open.value = true;
};

const width = ref('400px')
const showMoreUp = () => {
  width.value = '800px'
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

  console.log(uploadList.value)

  if (uploadList.value.length == 0 && timer != null) {
    console.log("关闭定时器")
    clearInterval(timer);
    timer = null;//关闭定时器
  }

};


watch(() => uploadList.value.length, (newLength, oldLength) => {

  uploadCount.value = newLength;

  if (newLength < oldLength) {
    console.log("上传列表减少了");
    fetchData(filters) // 刷新数据
  }

  if (newLength === 0) {
    console.log("上传列表为0");
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
});



const closeModal = (e) => {
  open.value = false;
  setTimeout(() => {
    width.value = '400px'
  }, 1000);
}


</script>

<style scoped>
.card2 {
  height: 58vh;
  margin-top: 18px;
}

.card3 {
  height: 93vh;

}

.cardcommon {
  border-radius: 25px 25px 25px 25px;
  box-shadow: 5px 15px 25px 0px rgba(36, 43, 160, 0.05);
}

.title {
  width: 64px;
  height: 23px;
  font-family: Source Han Sans SC;
  font-weight: 500;
  font-size: 16px;
  color: #000000;
  line-height: 19px;
  text-align: center;
  font-style: normal;
  text-transform: none;
}


.left_card {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 50vh;

  .custom-upload-dragger {
    width: 290px;
    height: 180px;
    position: relative;
    overflow: hidden;
  }

  .full-image {
    width: 100%;
    height: 100%;
  }

  .text {
    width: 210px;
    height: 40px;
    font-family: Source Han Sans SC;
    font-weight: 400;
    font-size: 14px;
    color: #666666;
    line-height: 16px;
    text-align: center;
    font-style: normal;
    text-transform: none;
    margin-top: 10px;
  }

  .btn {
    width: 135px;
    height: 36px;
    background: #242BA0;
    border-radius: 25px 25px 25px 25px;
    color: #FFF;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 20px;
  }

  .btn p {
    width: 56px;
    height: 20px;
    font-family: Source Han Sans SC, Source Han Sans SC;
    font-weight: 400;
    font-size: 14px;
    color: #FFFFFF;
    line-height: 16px;
    text-align: center;
    font-style: normal;
    text-transform: none;
  }

  p {
    width: 56px;
    height: 20px;
    font-family: Source Han Sans SC, Source Han Sans SC;
    font-weight: 400;
    font-size: 14px;
    color: #666666;
    line-height: 0px;
    text-align: center;
    font-style: normal;
    text-transform: none;
    cursor: pointer;
  }
}

.right_text {
  font-family: Source Han Sans SC;
  font-weight: 400;
  font-size: 14px;
  color: #333333;
  text-align: center;
  font-style: normal;
  text-transform: none;
}

.flex-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date_picker {
  width: 236px;
  height: 41px;
  background: #F6F7FF;
  border-radius: 48px 48px 48px 48px;
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: 400;
  font-size: 14px;
  color: #666666;
}

:deep() :where(.css-dev-only-do-not-override-qzdq9e).ant-picker .ant-picker-input>input:placeholder-shown {
  font-family: Source Han Sans SC, Source Han Sans SC;
  text-align: center;
}

:deep() .status_select .ant-select-selector {
  border-radius: 41px 41px 41px 41px;
  background-color: #F6F7FF;
  height: 41px;
  text-align: center;
  display: flex;
  align-items: center;
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: 400;
  font-size: 14px;
  color: #666666;
}

:deep() :where(.css-dev-only-do-not-override-qzdq9e).ant-input:placeholder-shown {
  font-family: Source Han Sans SC, Source Han Sans SC;
}

.content_input {
  width: 223px;
  height: 41px;
  background: #F6F7FF;
  border-radius: 21px 21px 21px 21px;
}

:deep() :where(.css-dev-only-do-not-override-qzdq9e).ant-input-affix-wrapper>input.ant-input {
  background: #F6F7FF;
}

:deep() .content_input:where(.css-dev-only-do-not-override-1p3hq3p).ant-input-affix-wrapper>input.ant-input {
  background-color: #F6F7FF;
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: 400;
  font-size: 14px;
  color: #666666;
}

:deep() :where(.css-dev-only-do-not-override-qzdq9e).ant-upload-wrapper .ant-upload-drag {
  background: white;
  border: none;
}

.bottom_box {
  width: 90%;
  height: 105px;
  position: absolute;
  bottom: 0px;
  background: linear-gradient(180deg, rgba(229, 231, 255, 0) 0%, #FFFFFF 19%);
}

.icon_style {
  height: 36px;
  width: 36px;
  cursor: pointer;
  margin-left: 20px;
}

.tip_text {
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: 400;
  font-size: 14px;
  color: #666666;
  line-height: 14px;
  text-align: center;
  font-style: normal;
  text-transform: none;
}

.shadowCard {
  box-shadow: inset 0px 0px 35px 0px rgba(229, 231, 255, 0.5);
  border-radius: 25px 25px 25px 25px;
}

.list_column_width_max {
  width: 85vw;
}

.list_column_width_min {
  width: 64vw;
}

.list_column {
  height: 104px;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  padding: 17px;
  box-sizing: border-box;
  margin-top: 10px;

  .list_img {
    width: 74px;
    height: 74px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 20px 20px 20px 20px;
    opacity: 0.8;
    overflow: hidden;
  }

  .list_img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .number_c {
    width: 81px;
    height: 23px;
    font-family: Source Han Sans SC, Source Han Sans SC;
    font-weight: 500;
    font-size: 16px;
    color: #000000;
    line-height: 19px;
    text-align: left;
    font-style: normal;
    text-transform: none;
  }

  .symptom_c {
    width: 112px;
    height: 21px;
    font-family: Source Han Sans SC, Source Han Sans SC;
    font-weight: 400;
    font-size: 14px;
    color: #666666;
    line-height: 21px;
    text-align: left;
    font-style: normal;
    text-transform: none;
  }

  .status_c {
    width: 62px;
    height: 20px;
    background: #242BA0;
    border-radius: 5px 5px 5px 5px;
    display: inline-block;
    text-align: center;
    margin-top: 5px;

    .status_c_text {
      width: 42px;
      height: 20px;
      font-family: Source Han Sans SC, Source Han Sans SC;
      font-weight: 400;
      font-size: 14px;
      color: #FFFFFF;
      line-height: 16px;
      text-align: left;
      font-style: normal;
      text-transform: none;
    }
  }

  .time_c {
    width: 225px;
    height: 14px;
    font-family: Source Han Sans SC, Source Han Sans SC;
    font-weight: 400;
    font-size: 14px;
    color: #666666;
    line-height: 14px;
    text-align: left;
    font-style: normal;
    text-transform: none;
    margin-left: 10px;
  }
}

.scrollable-list-container {
  height: 74vh;
  overflow-y: auto;
}

.scrollable-list-container::-webkit-scrollbar {
  display: none;
}

.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.showModal-list:hover {
  text-decoration: underline;
}

.modal-scroll-container {
  height: 40vh;
  overflow-y: auto;
  margin-top: 30px;

  .box {
    height: 60px;
    width: 100%;
    display: flex;
    align-items: center;
    margin-bottom: 10px;

    .img-outer {
      width: 54px;
      height: 54px;
      border-radius: 10px 10px 10px 10px;
      opacity: 0.8;
      overflow: hidden;
    }

    .box-text {
      height: 21px;
      font-family: Source Han Sans SC, Source Han Sans SC;
      font-weight: 400;
      font-size: 14px;
      color: #666666;
      line-height: 21px;
      text-align: left;
      font-style: normal;
      text-transform: none;
    }

    .img-size {
      width: 28px;
      height: 28px;
    }
  }
}

.img-outer img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-scroll-container::-webkit-scrollbar {
  display: none;
}

.up-btn {
  width: 135px;
  height: 36px;
  background: #37AE2F;
  border-radius: 25px 25px 25px 25px;
  display: flex;
  justify-content: center;
  align-items: center;

  p {
    font-family: Source Han Sans SC, Source Han Sans SC;
    font-weight: 400;
    font-size: 14px;
    color: #FFFFFF;
    text-align: center;
    font-style: normal;
    text-transform: none;
  }
}

.cancel-btn {
  width: 100%;
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: 400;
  font-size: 14px;
  color: #EB6296;
  line-height: 16px;
  text-align: center;
  font-style: normal;
  text-transform: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}

.cancel-btn:hover {
  text-decoration: underline;
}

.control-circle {
  width: 32px;
  height: 32px;
  background: #FFFFFF;
  border-radius: 16px 16px 16px 16px;
  right: -16px;
  top: 45%;
  position: absolute;
  z-index: 9;
  display: flex;
  align-items: center;
  cursor: pointer;

  img {
    position: absolute;
    right: 5px;
  }
}

.control-circle2 {
  width: 32px;
  height: 32px;
  background: #FFFFFF;
  border-radius: 16px 16px 16px 16px;
  left: -16px;
  top: 45%;
  position: absolute;
  z-index: 9;
  display: flex;
  align-items: center;
  cursor: pointer;

  img {
    position: absolute;
    left: 5px;
  }
}
</style>