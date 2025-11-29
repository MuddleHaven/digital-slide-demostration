<template>
  <div class="card" v-show="isEmpty">
    <div class="title">{{ curUserInfo?.name }}累计切片类型统计</div>
    <el-empty description="暂无数据" :image-size="100" />
  </div>

  <div id="RadarChart" style="width: 100%; height: 100%" v-show="!isEmpty"></div>

</template>

<script setup>
import { onMounted, watch, ref } from 'vue';
import * as echarts from 'echarts';
import { userUserStore } from '../../stores/UserStore';
import { storeToRefs } from 'pinia';
import * as sliceApi from '../../api/slice.js'

const UserStore = userUserStore()
const { curUserInfo } = storeToRefs(UserStore)
const role = localStorage.getItem("role")

const conditionKeys = [
  // { key: 'ac', index: 1, text: "腺癌", defaultValue: 0 },
  { key: 'mac', index: 2, text: "粘液腺癌", defaultValue: 0 },
  { key: 'srcc', index: 3, text: "印戒细胞癌", defaultValue: 0 },
  { key: 'nens', index: 4, text: "神经内分泌肿瘤", defaultValue: 0 },
  { key: 'in', index: 5, text: "上皮内瘤变", defaultValue: 0 },
  { key: 'chronicInflammation', index: 6, text: "慢性炎", defaultValue: 0 },
  { key: 'acuteInflammation', index: 7, text: "急性炎", defaultValue: 0 },
  { key: 'atrophy', index: 8, text: "萎缩", defaultValue: 0 },
  { key: 'intestinalization', index: 9, text: "肠化", defaultValue: 0 },
  { key: 'hyperplasia', index: 10, text: "增生", defaultValue: 0 },
  { key: 'polypus', index: 11, text: "息肉", defaultValue: 0 },
  { key: 'HP', index: 12, text: "HP", defaultValue: 0 },
];
onMounted(() => {
  if (role == '主任') drawChart()
  else drawPersonalChart(curUserInfo.value)
})

watch(curUserInfo, (object) => {
  if (object != null) {
    drawPersonalChart(object)
  } else {
    drawChart()
  }
})

const isEmpty = ref(false)

async function drawChart() {
  let res = await sliceApi.getDiagnosisStatisticsByDepartment()
  const data = res.data.diagnosisTypeMap
  if (Object.keys(data).length == 0) {
    isEmpty.value = true
    return
  }
  isEmpty.value = false
  // 初始化两个数组
  let informdata = [];
  let maxarray = [];


  let indicators = []
  // 遍历对象，提取数据
  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      let value = data[key];
      const name = conditionKeys.find(item => item.key === key).text
      indicators.push({ name: name, max: value[1] })
      // 第一个元素放入 informdata
      informdata.push(value[0]);
      // 第二个元素放入 maxarray
      maxarray.push(value[1]);
    }
  }

  let myChart = echarts.init(document.getElementById("RadarChart"));
  let option = {
    title: {
      text: '科室累计切片类型统计',
      textStyle: {
        fontFamily: 'Source Han Sans SC, Source Han Sans SC',
        fontWeight: 500,
        fontSize: 16,
        color: '#000000',
        lineHeight: 19,
        textAlign: 'left',
        fontStyle: 'normal',
        textTransform: 'none'
      }
    },
    tooltip: {
      trigger: 'item', // 触发类型，默认数据项图形触发，见下文
    },
    radar: {
      // shape: 'circle',
      indicator: indicators,
      center: ['50%', '57%'],
      name: { //修改indicator文字的颜色
        textStyle: {
          fontFamily: "Source Han Sans SC",
          fontWeight: 400,
          fontSize: 12,
          color: '#666666',
          fontStyle: 'normal'
        }
      },
    },
    series: [
      {
        name: '切片类型统计',
        type: 'radar',
        itemStyle: {
          normal: {
            color: '#242BA0'
          }
        },
        data: [
          {
            value: informdata,
          },
        ]
      }
    ],
  };
  myChart.setOption(option);
}

async function drawPersonalChart(curUserInfo) {
  let res = await sliceApi.getDiagnosisStatisticsByUserId(curUserInfo.id)
  const data = res.data.diagnosisTypeMap
  if (Object.keys(data).length == 0) {
    isEmpty.value = true
    return
  }
  isEmpty.value = false
  // 初始化两个数组
  let informdata = [];
  let maxarray = [];
  let indicators = []
  // 遍历对象，提取数据
  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      let value = data[key];
      const name = conditionKeys.find(item => item.key === key).text
      indicators.push({ name: name, max: value[1] })
      informdata.push(value[0]);  // 第一个元素放入 informdata
      maxarray.push(value[1]);    // 第二个元素放入 maxarray
    }
  }

  let myChart = echarts.init(document.getElementById("RadarChart"));
  let option = {
    title: {
      text: (curUserInfo.name || curUserInfo.realname) + '累计切片类型统计',
      textStyle: {
        fontFamily: 'Source Han Sans SC, Source Han Sans SC',
        fontWeight: 500,
        fontSize: 16,
        color: '#000000',
        lineHeight: 19,
        textAlign: 'left',
        fontStyle: 'normal',
        textTransform: 'none'
      }
    },
    tooltip: {
      trigger: 'item', // 触发类型，默认数据项图形触发，见下文
    },
    radar: {
      // shape: 'circle',
      indicator: indicators,
      center: ['50%', '57%'],
      name: { //修改indicator文字的颜色
        textStyle: {
          fontFamily: "Source Han Sans SC",
          fontWeight: 400,
          fontSize: 12,
          color: '#666666',
          fontStyle: 'normal'
        }
      },
    },
    series: [
      {
        name: '切片类型统计',
        type: 'radar',
        itemStyle: {
          normal: {
            color: '#242BA0'
          }
        },
        data: [
          {
            value: informdata,
          },
        ]
      }
    ],
  };
  myChart.setOption(option);
}
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
</style>