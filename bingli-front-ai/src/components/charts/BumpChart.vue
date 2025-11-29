<template>
   <div class="card" v-show="isEmpty">
      <div class="title">{{curUserInfo?.name}}分析结果</div>
      <el-empty description="暂无数据"  :image-size="100" />
   </div>
   <div id="BumpChart" style="width: 100%; height: 100%" v-show="!isEmpty"></div>
</template>

<script setup>
import { onMounted,watch,ref } from 'vue';
import * as echarts from 'echarts';
import { userUserStore } from '../../stores/UserStore';
import { storeToRefs } from 'pinia';
import * as sliceApi from '../../api/slice.js'

const UserStore = userUserStore()
const { curUserInfo } = storeToRefs(UserStore)
const { isChange } = storeToRefs(UserStore)
const role = localStorage.getItem("role")

watch(curUserInfo, (object) => {
  if (object != null){
    drawPersonalChart(object)
  }else{
    drawChart()
  }
})

onMounted(() => {
  if(role == '主任') drawChart()
  else drawPersonalChart(curUserInfo.value)
})

const isEmpty = ref(false)

async function drawChart() {
  let res = await sliceApi.getDiagnosisStatisticsByDepartment()
  const data = res.data.resultByDataMap
  if(Object.keys(data).length == 0 ){
    isEmpty.value = true
    return
  }
  isEmpty.value = false
  const dates = Object.keys(data)
  // 初始化一个空数组来存储每个位置上的值数组
  const combinedValues = Array.from({ length: data[dates[0]].length }, () => []);
   
  // 遍历每个日期
  dates.forEach(date => {
    const values = data[date];
      
    values.forEach((value, index) => {
      combinedValues[index].push(value);
    });
  });

  let myChart = echarts.init(document.getElementById("BumpChart"));
  const names = [
    '非肿瘤性',
    '癌前状态',
    '癌前病变',
    '恶性肿瘤',
  ];
  const colorMap = {
    '非肿瘤性': '#37AE2F',
    '癌前状态': '#EB6296',
    '癌前病变': '#242BA0',
    '恶性肿瘤': '#FFE043',
  };

  const simulatedRankingData = new Map([
    ['非肿瘤性', combinedValues[0]], 
    ['癌前状态', combinedValues[1]], 
    ['癌前病变', combinedValues[2]], 
    ['恶性肿瘤', combinedValues[3]], 
  ]);
  const generateSeriesList = () => {
    const seriesList = [];
    const rankingMap = simulatedRankingData;
    rankingMap.forEach((data, name) => {
      const series = {
        name,
        symbolSize: 10,
        type: 'line',
        smooth: true,
        emphasis: {
          focus: 'series'
        },
        // endLabel: {
        //    show: true,
        //    formatter: '{a}',
        //    distance: 20
        // },
        lineStyle: {
          width: 4,
          color: colorMap[name]
        },
        itemStyle: {
          color: colorMap[name]
        },
        data
      };
      seriesList.push(series);
    });
    return seriesList;
  };
  let option = {
    title: {
      text: '科室分析结果',
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
      trigger: 'item'
    },
    legend: {
      data: names
    },
    // grid: {
    //   left: 30,
    //   right: 110,
    //   bottom: 30,
    //   containLabel: true
    // },
    // toolbox: {
    //    feature: {
    //       saveAsImage: {}
    //    }
    // },
    xAxis: {
      type: 'category',
      splitLine: {
        show: true
      },
      axisLabel: {
        margin: 30,
        fontSize: 16,
        textStyle: {
          fontFamily: "Source Han Sans SC",
          fontWeight: 400,
          fontSize: 12,
          color: '#666666',
          fontStyle: 'normal'
        }
      },
      boundaryGap: false,
      data: dates
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        margin: 30,
        fontSize: 16,
        formatter: '{value}',
        textStyle: {
          fontFamily: "Source Han Sans SC",
          fontWeight: 400,
          fontSize: 12,
          color: '#666666',
          fontStyle: 'normal'
        }
      },
      // inverse: true,
      interval: res.data.interval,
      min: res.data.minValue,
      max: res.data.maxValue,
         
    },
    series: generateSeriesList(),
    grid:{ // 让图表占满容器
      top:"40px",
      left:"70px",
      right:"40px",
      bottom:"50px"
    }
  };
  myChart.setOption(option);
}

async function drawPersonalChart(curUserInfo) {
  let res = await sliceApi.getDiagnosisStatisticsByUserId(curUserInfo.id)
  const data = res.data.resultByDataMap
  if(Object.keys(data).length == 0 ){
    isEmpty.value = true
    return
  }
  isEmpty.value = false
  const dates = Object.keys(data)
  // 初始化一个空数组来存储每个位置上的值数组
  const combinedValues = Array.from({ length: data[dates[0]].length }, () => []);

  // 遍历每个日期
  dates.forEach(date => {
    const values = data[date];
      
    values.forEach((value, index) => {
      combinedValues[index].push(value);
    });
  });
   
  let myChart = echarts.init(document.getElementById("BumpChart"));
  const names = [
    '非肿瘤性',
    '癌前状态',
    '癌前病变',
    '恶性肿瘤',
  ];
  const colorMap = {
    '非肿瘤性': '#37AE2F',
    '癌前状态': '#EB6296',
    '癌前病变': '#242BA0',
    '恶性肿瘤': '#FFE043',
  };

  const simulatedRankingData = new Map([
    ['非肿瘤性', combinedValues[0]], 
    ['癌前状态', combinedValues[1]], 
    ['癌前病变', combinedValues[2]], 
    ['恶性肿瘤', combinedValues[3]], 
  ]);
  const generateSeriesList = () => {
    const seriesList = [];
    const rankingMap = simulatedRankingData;
    rankingMap.forEach((data, name) => {
      const series = {
        name,
        symbolSize: 10,
        type: 'line',
        smooth: true,
        emphasis: {
          focus: 'series'
        },
        // endLabel: {
        //    show: true,
        //    formatter: '{a}',
        //    distance: 20
        // },
        lineStyle: {
          width: 4,
          color: colorMap[name]
        },
        itemStyle: {
          color: colorMap[name]
        },
        data
      };
      seriesList.push(series);
    });
    return seriesList;
  };
  let option = {
    title: {
      text: (curUserInfo.name || curUserInfo.realname) + '分析结果',
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
      trigger: 'item'
    },
    legend: {
      data: names
    },
    // grid: {
    //   left: 30,
    //   right: 110,
    //   bottom: 30,
    //   containLabel: true
    // },
    // toolbox: {
    //    feature: {
    //       saveAsImage: {}
    //    }
    // },
    xAxis: {
      type: 'category',
      splitLine: {
        show: true
      },
      axisLabel: {
        margin: 30,
        fontSize: 16,
        textStyle: {
          fontFamily: "Source Han Sans SC",
          fontWeight: 400,
          fontSize: 12,
          color: '#666666',
          fontStyle: 'normal'
        }
      },
      boundaryGap: false,
      data: dates
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        margin: 30,
        fontSize: 16,
        formatter: '{value}',
        textStyle: {
          fontFamily: "Source Han Sans SC",
          fontWeight: 400,
          fontSize: 12,
          color: '#666666',
          fontStyle: 'normal'
        }
      },
      // inverse: true,
      interval: res.data.interval,
      min: res.data.minValue,
      max: res.data.maxValue,
         
    },
    series: generateSeriesList(),
    grid:{ // 让图表占满容器
      top:"40px",
      left:"70px",
      right:"70px",
      bottom:"50px"
    }
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