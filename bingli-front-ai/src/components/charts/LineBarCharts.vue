<template>
  <div id="LineBarChart" style="width: 100%; height: 100%"></div>
</template>

<script setup>
import { onMounted, watch } from 'vue';
import * as echarts from 'echarts';
import { userUserStore } from '../../stores/UserStore';
import { storeToRefs } from 'pinia';
import * as sliceApi from '../../api/slice.js'

const UserStore = userUserStore()
const { curUserInfo } = storeToRefs(UserStore)
const role = localStorage.getItem("role")

onMounted(() => {
  if (role == '主任' && curUserInfo.value == null) { 
    drawChart() 
  } else { 
    // console.log("onMounted curUserInfo changed===================", curUserInfo.value);
    drawPersonalChart(curUserInfo.value)
  }
})

watch(curUserInfo, (object) => {
  if (object != null && object.value != 'new') {
    // console.log("watch curUserInfo changed===================", object.value);
    drawPersonalChart(object)
  } else {
    drawChart()
  }
})

const chartTextArr = ['处理失败', '待复核', '已复核', '全部切片']

async function drawChart() {

  let res = await sliceApi.getRecentSlicesByDepartment('week')
  let data = res.data
  const dates = [];
  const allSlices = [];
  const processFailed = [];
  const processed = [];
  const resolved = [];
  let max = null
  let min = null
  let interval = null

  data.forEach(obj => {
    if (obj.date) {
      dates.push(obj.date);
      // 使用字符串索引以避免中文变量名问题，尽管直接访问obj.未处理也是有效的
      processFailed.push(obj['处理失败']);
      processed.push(obj['待复核']);
      resolved.push(obj['已复核']);
      allSlices.push(obj['全部切片']);
    } {
      max = obj.maxValue
      min = obj.minValue
      interval = obj.interval
    }
  });

  let myChart = echarts.init(document.getElementById("LineBarChart"));
  let option = {
    title: {
      text: '科室近期处理切片数量',
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
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      }
    },
    legend: {
      left: '50%',
      data: chartTextArr
    },
    xAxis: [
      {
        type: 'category',
        data: dates,
        axisPointer: {
          type: 'shadow'
        },
        axisLabel: {
          textStyle: {
            fontFamily: "Source Han Sans SC",
            fontWeight: 400,
            fontSize: 12,
            color: '#666666',
            fontStyle: 'normal'
          }
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        min: min,
        max: max,
        interval: interval,
        axisLabel: {
          formatter: '{value}',
          textStyle: {
            fontFamily: "Source Han Sans SC",
            fontWeight: 400,
            fontSize: 12,
            color: '#666666',
            fontStyle: 'normal'
          }
        }
      },
    ],
    series: [
      {
        name: chartTextArr[0],
        type: 'bar',
        itemStyle: {
          normal: {
            color: '#37AE2F'
          }
        },
        tooltip: {
          valueFormatter: function (value) {
            return value;
          }
        },
        data: processFailed
      },
      {
        name: chartTextArr[1],
        type: 'bar',
        itemStyle: {
          normal: {
            color: '#242BA0'
          }
        },
        tooltip: {
          valueFormatter: function (value) {
            return value;
          }
        },
        data: processed
      },
      {
        name: chartTextArr[2],
        type: 'bar',
        itemStyle: {
          normal: {
            color: '#FFE043'
          }
        },
        tooltip: {
          valueFormatter: function (value) {
            return value;
          }
        },
        data: resolved
      },
      {
        name: '全部切片',
        type: 'line',
        itemStyle: {
          normal: {
            color: '#242BA0'
          }
        },
        tooltip: {
          valueFormatter: function (value) {
            return value;
          }
        },
        data: allSlices
      }
    ],
    grid: { // 让图表占满容器
      top: "40px",
      left: "40px",
      right: "20px",
      bottom: "20px"
    }
  };
  myChart.setOption(option);
}

async function drawPersonalChart(curUserInfo) {
  // console.log("drawPersonalChart curUserInfo changed===================", curUserInfo);
  // console.log(2)
  if (curUserInfo == null) return
  if (curUserInfo == 'new') return
  let res = await sliceApi.getRecentSlicesByUserId(curUserInfo.id, 'week')
  let data = res.data
  const dates = [];
  const allSlices = [];
  const processFailed = [];
  const processed = [];
  const resolved = [];
  let max = null
  let min = null
  let interval = null

  data.forEach(obj => {
    if (obj.date) {
      dates.push(obj.date);
      processFailed.push(obj['处理失败']);
      processed.push(obj['待复核']);
      resolved.push(obj['已复核']);
      allSlices.push(obj['全部切片']);
    } {
      max = obj.maxValue
      min = obj.minValue
      interval = obj.interval
    }
  });

  let myChart = echarts.init(document.getElementById("LineBarChart"));
  let option = {
    title: {
      text: (curUserInfo.name || curUserInfo.realname) + '近期处理切片数量',
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
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      }
    },
    legend: {
      data: chartTextArr
    },
    xAxis: [
      {
        type: 'category',
        data: dates,
        axisPointer: {
          type: 'shadow'
        },
        axisLabel: {
          textStyle: {
            fontFamily: "Source Han Sans SC",
            fontWeight: 400,
            fontSize: 12,
            color: '#666666',
            fontStyle: 'normal'
          }
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        min: min,
        max: max,
        interval: interval,
        axisLabel: {
          formatter: '{value}',
          textStyle: {
            fontFamily: "Source Han Sans SC",
            fontWeight: 400,
            fontSize: 12,
            color: '#666666',
            fontStyle: 'normal'
          }
        }
      },
    ],
    series: [
      {
        name: chartTextArr[0],
        type: 'bar',
        itemStyle: {
          normal: {
            color: '#37AE2F'
          }
        },
        tooltip: {
          valueFormatter: function (value) {
            return value;
          }
        },
        data: processFailed
      },
      {
        name: chartTextArr[1],
        type: 'bar',
        itemStyle: {
          normal: {
            color: '#242BA0'
          }
        },
        tooltip: {
          valueFormatter: function (value) {
            return value;
          }
        },
        data: processed
      },
      {
        name: chartTextArr[2],
        type: 'bar',
        itemStyle: {
          normal: {
            color: '#FFE043'
          }
        },
        tooltip: {
          valueFormatter: function (value) {
            return value;
          }
        },
        data: resolved
      },
      {
        name: '全部切片',
        type: 'line',
        itemStyle: {
          normal: {
            color: '#242BA0'
          }
        },
        tooltip: {
          valueFormatter: function (value) {
            return value;
          }
        },
        data: allSlices
      }
    ],
    grid: { // 让图表占满容器
      top: "40px",
      left: "40px",
      right: "20px",
      bottom: "20px"
    }
  };
  myChart.setOption(option);
}
</script>

<style scoped></style>