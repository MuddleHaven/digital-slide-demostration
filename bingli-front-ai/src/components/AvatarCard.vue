<template>
  <a-card class="card1 cardcommon">
    <div class="avatar" :class="{ 'male-img': userInfo.gender === '男', 'female-img': userInfo.gender == '女' }"></div>
    <div class="exit" @click="exit">
      退出登录
    </div>
    <div class="avatar_text">
      <p class="name">{{ userInfo.realName }}</p>
      <p class="address">{{ userInfo.hostipal }} {{ userInfo.department }} {{ userInfo.roleName }}</p>
    </div>
    <div style="margin-top:10px;">
      <a-row>
        <a-col :span="8">
          <div class="solve_data" style="border-right: 1px solid #EEEEEE;">
            <p class="number">{{ userInfo.fail }}</p>
            <p class="solve_name">处理失败</p>
          </div>
        </a-col>
        <a-col :span="8">
          <div class="solve_data" style="border-right: 1px solid #EEEEEE;">
            <p class="number">{{ userInfo.un }}</p>
            <p class="solve_name">待复核</p>
          </div>
        </a-col>
        <a-col :span="8">
          <div class="solve_data">
            <p class="number">{{ userInfo.done }}</p>
            <p class="solve_name">已复核</p>
          </div>
        </a-col>
      </a-row>
      <div class="control-circle" @click="changeListLeft(false)" v-if="route.path == '/list'"><img
          src="../assets/icon/Group 2508.png" alt=""></div>
      <div class="control-circle" @click="changeLeft(false)" v-else><img src="../assets/icon/Group 2508.png" alt="">
      </div>
    </div>
  </a-card>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router';
import { onMounted, ref, reactive, watch, createVNode } from "vue";
import * as userAPI from '../api/user.js'
import * as sliceAPI from '../api/slice.js'
import { userUserStore } from '../stores/UserStore';
import { storeToRefs } from 'pinia';
import { useSettingStore } from '../stores/SettingStore';
import { useListStore } from '../stores/ListStore.js'
import { Modal } from 'ant-design-vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';

const route = useRoute()

const ListStore = useListStore()
const { changeListLeft } = ListStore

const SettingStore = useSettingStore()
const { changeLeft } = SettingStore

const UserStore = userUserStore()
const { setUserInfo } = UserStore
const { isSelfChange } = storeToRefs(UserStore)

const router = useRouter()
onMounted(() => {
  initInfo()
})

//用户信息：
const userInfo = reactive({
  avatarPath: '',
  realName: '',
  hostipal: '',
  department: '',
  roleName: '',
  taskPendingCount: '0', //待处理
  taskInProcessCount: '0',//处理中
  taskProcessedCount: '0',//已处理
  gender: '',
  // 
  un: '',
  fail: '',
  done: '',
})

//初始化界面信息：
const initInfo = async () => {
  // 获取用户信息
  const userInfoResponse = await userAPI.getUserInfo()
  let data = userInfoResponse.data
  userInfo.avatarPath = data.user.avatarPath
  userInfo.realName = data.user.realname
  userInfo.hostipal = data.user.hospital
  userInfo.department = data.user.department
  userInfo.roleName = data.roleName
  userInfo.gender = data.user.gender


  //获取任务数量信息：
  const taskInfoResponse = await sliceAPI.getProcessInfo()
  data = taskInfoResponse.data
  userInfo.taskPendingCount = data.taskPendingCount
  userInfo.taskInProcessCount = data.taskInProcessCount
  userInfo.taskProcessedCount = data.taskProcessedCount

  // un failed done
  userInfo.un = data.un
  userInfo.fail = data.fail
  userInfo.done = data.done
}

watch(isSelfChange, (object) => {
  if (object) {
    initInfo()
    isSelfChange.value = false;
  }
})

const exit = () => {
  Modal.confirm({
    title: '提示',
    icon: createVNode(ExclamationCircleOutlined),
    content: '你确认要退出登录吗？',
    okText: '确认',
    cancelText: '取消',
    centered: true,
    onOk() {
      localStorage.clear();
      router.push("/login")
    }
  })
}
</script>

<style scoped>
.card1 {
  /* width: 20vw; */
  height: 25vh;
  position: relative;
  margin-top: 3.5vw;
}

.card2 {
  height: 58vh;
  margin-top: 18px;
}

.cardcommon {
  border-radius: 25px 25px 25px 25px;
  box-shadow: 5px 15px 25px 0px rgba(36, 43, 160, 0.05);
}

.avatar {
  width: 140px;
  height: 140px;
  background: #F6F6F6;
  box-shadow: 3px 3px 25px 0px rgba(36, 43, 160, 0.1);
  border-radius: 70px;
  position: absolute;
  top: -70px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  background-size: contain;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
}

.male-img {
  background-image: url('../assets/avatar/Group2426@2x.png');
}

.female-img {
  background-image: url('../assets/avatar/Group2425.png');
}

.avatar_text {
  margin-top: 1.5vw;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
}

.name {
  width: 100%;
  font-family: Source Han Sans SC;
  font-weight: 500;
  font-size: 1vw;
  color: #333333;
  line-height: 0px;
  text-align: center;
  font-style: normal;
  text-transform: none;
}

.address {
  width: 10.8vw;
  font-family: Source Han Sans SC;
  font-weight: 400;
  font-size: 0.7vw;
  color: #666666;
  line-height: 0px;
  text-align: center;
  font-style: normal;
  text-transform: none;
}

.solve_data {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

}

.number {
  width: 1.5vw;
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: 500;
  font-size: 1vw;
  color: #666666;
  line-height: 0px;
  text-align: center;
  font-style: normal;
  text-transform: none;
}

.solve_name {
  /* width: 2.5vw; */
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: 400;
  font-size: 0.7vw;
  color: #242BA0;
  line-height: 0px;
  text-align: center;
  font-style: normal;
  text-transform: none;
}

.line {
  width: 1px;
  height: 30px;
  background: #EEEEEE;
  border-radius: 0px 0px 0px 0px;
}

.exit {
  width: 100%;
  height: 20px;
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: 400;
  font-size: 0.7vw;
  color: #EB6296;
  line-height: 16px;
  text-align: center;
  font-style: normal;
  text-transform: none;
  display: flex;
  justify-content: end;
  cursor: pointer;
}

.exit:hover {
  text-decoration: underline;
}

.half-circle {
  position: absolute;
  top: 50%;
  right: -1vh;
  width: 1vh;
  height: 2vh;
  background-color: #FFFFFF;
  border-bottom-right-radius: 40px;
  border-top-right-radius: 40px;
  transform: translateY(-50%);
  box-shadow: inset 0px 0px 23px 0px rgba(36, 43, 160, 0.05);
  background-image: url('../assets/normalsetting/Group 2514.png');
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
</style>