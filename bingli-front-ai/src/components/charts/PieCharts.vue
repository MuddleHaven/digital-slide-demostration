<template>
   <div id="pieChart" style="width: 100%; height: 100%"></div>
</template>

<script setup>
import { onMounted } from 'vue';
import * as echarts from 'echarts';
import * as sliceApi from '../../api/slice.js'

onMounted(() => {
  drawChart()
})


async function drawChart() {
  let res = await sliceApi.getDepartmentSliceAccount()
  let data = res.data.sliceAccountMap
  // 初始化结果数组
  const userdata = [];
 
  // 遍历sliceAccountMap对象
  for (const name in data) {
    if (data.hasOwnProperty(name)) {
      if(data[name]!=0){
        userdata.push({
          value: data[name], // 使用sliceAccountMap中的值
          name: name 
        });
      }

    }
  }

  let myChart = echarts.init(document.getElementById("pieChart"));
  let option = {
    title: {
      text: '科室上传数量',
      textStyle: {
        fontFamily: 'Source Han Sans SC, Source Han Sans SC',
        fontWeight: 500,
        fontSize: 16,
        color: '#000000',
        textAlign: 'left',
        fontStyle: 'normal',
        textTransform: 'none'
      }
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      top: '5%',
      right: '10%',
      orient: 'vertical',
      formatter: function (name) {
        let v;
        userdata.forEach((item) => {
          if (item.name === name) {
            v = item.value;
          }
        });
        return name + ' ' + v;
      },
    },
    series: [
      {
        // name: 'Access From',
        type: 'pie',
        center: ['35%', '50%'],    
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 40,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: userdata
      }
    ]
  };
  myChart.setOption(option);
}

</script>

<style scoped></style>