<template>
  <div class="card">
    <div class="title">{{ curUserInfo.name || curUserInfo.realname }}近期处理结果</div>
    <el-empty description="近期暂无处理数据" v-show="Listdata.length == 0" :image-size="100" />
    <el-scrollbar height="24vh" ref="scrollbarContainer">
      <div ref="listWrapper">
        <a-row v-for="data in Listdata" :key="data.sliceNo" style="margin-top: 10px;">
          <a-col :span="11" :offset="1">
            <span class="number">No.{{ data.sliceNo }}</span>
            <span class="address">[送检医院]{{ data.hospital }}</span>
          </a-col>
          <a-col :span="11" style="display: flex;justify-content: end;">
            <span class="time">{{ data.processTime }}</span>
            <span class="btn" @click="getpdf(data.diagnosisId)">查看报告</span>
          </a-col>
          <a-col :span="1"></a-col>
        </a-row>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { userUserStore } from '../../stores/UserStore';
import { storeToRefs } from 'pinia';
import * as sliceApi from '../../api/slice.js'

const UserStore = userUserStore()
const { selfUserInfo, curUserInfo } = storeToRefs(UserStore)
const { isChange } = storeToRefs(UserStore)

watch(curUserInfo, (newval) => {
  if (newval != null) {
    // newval != 'new'
    if (newval.value != 'new') {
      getData()
    }
  }
})

const Listdata = ref([

])

const getData = async () => {
  console.log("curUserInfo changed", curUserInfo);
  if (curUserInfo.value == null) return
  if (curUserInfo.value == 'new') return
  let res = await sliceApi.getDiagnosisResultListByUserId(curUserInfo.value.id)
  Listdata.value = res.data
  // if(Listdata.value.length > 0) startAutoScroll()
}

const getpdf = async (id) => {
  let res = await sliceApi.getDiagnosisPDFByDiagnosisId(id)
  let url = res.data
  window.open(url, '_blank'); // '_blank'表示在新标签页中打开
}

//自动滚动
const duplicatedListdata = computed(() => {
  return [...Listdata.value, ...Listdata.value];
});

const scrollbarContainer = ref(null);
const listWrapper = ref(null);
let scrollInterval = null;
let isScrollingUp = false; // 用于判断滚动方向

const startAutoScroll = () => {
  const container = scrollbarContainer.value.$el.querySelector('.el-scrollbar__wrap');
  const wrapperHeight = listWrapper.value.clientHeight;
  const itemHeight = listWrapper.value.children[0].clientHeight;
  const totalItems = duplicatedListdata.value.length;
  let currentScrollTop = container.scrollTop;
  const scrollStep = 1; // 每次滚动的像素数

  scrollInterval = setInterval(() => {
    // 计算下一个滚动位置
    let nextScrollTop = currentScrollTop + scrollStep;

    // 判断是否到达列表底部或顶部，并调整滚动方向和位置
    if (nextScrollTop >= (totalItems * itemHeight - wrapperHeight)) {
      isScrollingUp = false; // 准备向上滚动
      nextScrollTop = totalItems * itemHeight - wrapperHeight;
      setTimeout(() => {
        nextScrollTop = 0; // 立即跳转到顶部并继续滚动
        currentScrollTop = 0; // 更新当前滚动位置
      }, 0);
    } else if (nextScrollTop <= 0 && !isScrollingUp) {
      isScrollingUp = true; // 准备向下滚动（但实际上是从顶部开始向下）
      nextScrollTop = 0; // 停在顶部
    }

    // 应用新的滚动位置
    container.scrollTop = nextScrollTop;
    currentScrollTop = nextScrollTop;
  }, 24); // 大约每秒滚动60次
};

onMounted(() => {
  getData()
});

onUnmounted(() => {
  clearInterval(scrollInterval);
});

</script>

<style scoped>
.card {
  width: 100%;
  height: 100%;
}

.title {
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: bold;
  font-size: 16px;
  color: #000000;
  text-align: left;
  font-style: normal;
  text-transform: none;
}

.number {
  width: 7vw;
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: normal;
  font-size: 0.7vw;
  color: #666666;
  text-align: left;
  font-style: normal;
  text-transform: none;
  display: inline-block;
  text-overflow: ellipsis;
  white-space: nowrap;
  /* 禁止换行（关键！） */
  overflow: hidden;
  /* 隐藏溢出内容（关键！） */
}

.address {
  width: 7vw;
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: normal;
  font-size: 0.7vw;
  color: #BBBBBB;
  text-align: left;
  font-style: normal;
  text-transform: none;
  margin-left: 10px;
  display: inline-block;
  text-overflow: ellipsis;
  white-space: nowrap;
  /* 禁止换行（关键！） */
  overflow: hidden;
  /* 隐藏溢出内容（关键！） */
}

.time {
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: normal;
  font-size: 14.22px;
  color: #666666;
  text-align: left;
  font-style: normal;
  text-transform: none;
}

.btn {
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: normal;
  font-size: 14.22px;
  color: #242BA0;
  text-align: left;
  font-style: normal;
  text-transform: none;
  margin-left: 15px;
  cursor: pointer;
}

.btn:hover {
  text-decoration: underline;
}
</style>