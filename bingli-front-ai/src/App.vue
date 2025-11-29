<template>
  <a-config-provider :theme="{
    token: {
      colorPrimary: '#242BA0',
    },
  }" :locale="zh_CN">
    <router-view />
  </a-config-provider>
</template>

<script setup>
import zh_CN from 'ant-design-vue/es/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
dayjs.locale('zh-cn');
</script>

<style scoped>
/* 更改进度条颜色 */
#nprogress .bar {
  background: #184AA7 !important;
  height: 4px !important;
}

body {
  margin: 0px;
  padding: 0px;
}

@font-face {
  font-family: 'PangMenZhengDao';
  src: url('./assets/fonts/pangmenzhengdao.ttf');
}

@font-face {
  font-family: 'Source Han Sans SC';
  src: url('./assets/fonts/SourceHanSansSC-VF.ttf');
}
</style>
