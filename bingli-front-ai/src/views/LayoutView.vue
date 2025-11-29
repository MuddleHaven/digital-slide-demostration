<template>
  <div style="width: 100vw;height: 100vh;">
    <a-card class="container">
      <a-row>
        <a-col :span="2">
          <div class="menu">
            <div class="logo">
              <img src="../assets/logo/Group2440.png" alt="">
            </div>
            <div style="height: 120px;"></div>
            <div class="box-container">
              <div class="box" :style="{ backgroundColor: menu == 1 ? '#F1F1FF' : '#242BA0' }" @click="goList">
                <img src="../assets/icon/icon_b切片.png" alt="" v-if="menu == 1">
                <img src="../assets/icon/icon_w.png" alt="" v-else>
                <div class="text" :style="{ color: menu == 1 ? '#242BA0' : '#F1F1FF' }">切片列表</div>
              </div>
              <!-- <div class="box" :style="{ backgroundColor: menu == 2 ? '#F1F1FF' : '#242BA0' }" @click="goData">
                <img src="../assets/icon/icon_b数据看板.png" alt="" v-if="menu == 2">
                <img src="../assets/icon/icon_w数据看板.png" alt="" v-else>
                <div class="text" :style="{ color: menu == 2 ? '#242BA0' : '#F1F1FF' }">数据看板</div>
              </div> -->
              <div class="box" :style="{ backgroundColor: menu == 3 ? '#F1F1FF' : '#242BA0' }" @click="goSetting">
                <img src="../assets/icon/icon_b系统设置.png" alt="" v-if="menu == 3">
                <img src="../assets/icon/icon_w系统设置.png" alt="" v-else>
                <div class="text" :style="{ color: menu == 3 ? '#242BA0' : '#F1F1FF' }">系统设置</div>
              </div>
            </div>
            <div :class="tissueClassName"></div>
          </div>
        </a-col>
        <a-col :span="22">
          <router-view></router-view>
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>

<script setup>
import { ref, h, onMounted } from 'vue'
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia'
import { useLayoutStore } from '../stores/LayoutStore';
import { notification, Button } from 'ant-design-vue';
import { WarningOutlined } from '@ant-design/icons-vue';
import * as userAPI from '../api/user.js'

const tissueClassName = ref('bottom-img-wrapper-stomach')

const tissueType = import.meta.env.VITE_APP_TISSUE_TYPE

if (tissueType == 'stomach') {
  tissueClassName.value = 'bottom-img-wrapper-stomach'
} else if (tissueType == 'colon') {
  tissueClassName.value = 'bottom-img-wrapper-colon'
} else if (tissueType == 'lung') {
  tissueClassName.value = 'bottom-img-wrapper-lung'
} else if (tissueType == 'multiple') {
  // 多部位不显示
  tissueClassName.value = ''
}


const router = useRouter()
const LayoutStore = useLayoutStore()
const { menu } = storeToRefs(LayoutStore)
const role = localStorage.getItem("role")

const goList = () => {
  LayoutStore.changeMenu(1)
  router.push('/list')
}

const goData = () => {
  LayoutStore.changeMenu(2)
  router.push('/databoard')
}

const goSetting = () => {
  LayoutStore.changeMenu(3)
  if (role == '主任') {
    router.push('/directset')
  } else {
    router.push('/normalset')
  }
}

const openNotification = async () => {
  let res = await userAPI.checkDefaultPassword()
  if (!res.data) return
  const key = `open${Date.now()}`;
  notification.open({
    message: '警告！！！',
    description:
      '你的密码为初始密码，可能会造成安全问题，请前往系统设置页面进行密码修改。',
    icon: () => h(WarningOutlined, { style: 'color: #FFCC00' }),
    btn: () =>
      h(
        Button,
        {
          type: 'primary',
          size: 'small',
          onClick: () => {
            notification.close(key)
            goSetting()
          },
        },
        {
          default: () => '前往修改',
        },
      ),
    key,
    duration: 0,
  });
};


onMounted(() => {
  // debug close notification
  if (import.meta.env.DEV) return;
  openNotification()
})
</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;
  background: #FBFBFF;
  border-radius: 0px 0px 0px 0px;
}

.menu {
  width: 8rem;
  height: calc(100vh - 50px);
  background: #242BA0;
  box-shadow: 5px 15px 25px 0px rgba(36, 43, 160, 0.05);
  border-radius: 25px 25px 25px 25px;
  padding-top: 10px;
  box-sizing: border-box;
}

.logo {
  width: 100%;
  height: 38px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.box {
  width: 88px;
  height: 132px;
  background: #F1F1FF;
  border-radius: 25px 25px 25px 25px;
  margin-top: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  cursor: pointer;
}


.box-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: calc(100% - 320px);
}

.text {
  width: 48px;
  height: 17px;
  font-family: Source Han Sans SC;
  font-weight: 400;
  font-size: 12px;
  color: #242BA0;
  line-height: 14px;
  text-align: left;
  font-style: normal;
  text-transform: none;
  margin-top: 10px;
}

.bottom-img-wrapper {
  width: 100%;
  height: 167px;
  overflow: hidden;
  background-image: url("../assets/background/Group-2375@2x.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.bottom-img-wrapper-stomach {
  width: 100%;
  height: 167px;
  overflow: hidden;
  background-image: url("../assets/background/Group-2375@2x.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.bottom-img-wrapper-colon {
  width: 100%;
  height: 167px;
  overflow: hidden;
  background-image: url("../assets/background/Group-2604.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.bottom-img-wrapper-lung {
  width: 100%;
  height: 167px;
  overflow: hidden;
  background-image: url("../assets/background/Group-2376.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

</style>