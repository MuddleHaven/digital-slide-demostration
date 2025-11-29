<script setup>
import { ConfigProvider } from 'ant-design-vue';
import zh_CN from 'ant-design-vue/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
dayjs.locale('zh-cn');
import { RouterView } from 'vue-router';
</script>

<template>
  <ConfigProvider :locale="zh_CN" :theme="{
    token: {
      colorPrimary: '#242BA0',
    },
  }">
    <RouterView />
  </ConfigProvider>
</template>

<style scoped>
body {
  margin: 0px;
  padding: 0px;
}
</style>
