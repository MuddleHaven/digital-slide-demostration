<template>
    <a-card class="card1 cardcommon">
        <div class="avatar" :class="{'male-img':userInfo.gender==='男','female-img':userInfo.gender=='女'}"></div>
        <div class="exit" @click="exit">
            退出登录
        </div>
        <div class="avatar_text">
            <div class="name">{{userInfo.realName}}</div>
            <p class="address">{{userInfo.hostipal}} {{userInfo.department}} {{userInfo.roleName}}</p>
        </div>
        <div style="display: flex; justify-content: center; align-items: center; margin-top: 5vh;">
            <div style="display: flex; flex-direction: column; align-items: center;">
                <div class="card">
                    <h3 class="cardword1" style="color: #242BA0;">{{userInfo.fail}}</h3>
                    <p class="cardword2"> 处理失败切片</p>
                </div>
                <div class="card">
                    <h3 class="cardword1" style="color: #37AE2F;">{{userInfo.un}}</h3>
                    <p class="cardword2"> 待复核切片</p>
                </div>
                <div class="card">
                    <h3 class="cardword1" style="color: #EB6296;">{{userInfo.done}}</h3>
                    <p class="cardword2"> 已复核切片</p>
                </div>
            </div>
        </div>
        <div class="control-circle" @click="changeLeft(false)"><img src="../assets/icon/Group 2508.png" alt=""></div>        
    </a-card>
</template>

<script setup>
import { useRouter } from 'vue-router';
import * as userAPI from  '../api/user.js'
import * as sliceAPI from  '../api/slice.js'
import { onMounted,reactive,watch,createVNode} from 'vue';
import { userUserStore } from '../stores/UserStore';
import { storeToRefs } from 'pinia';
import { useSettingStore } from '../stores/SettingStore';
import { Modal } from 'ant-design-vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';

const SettingStore = useSettingStore()
const {changeLeft} = SettingStore

const router = useRouter()

const UserStore = userUserStore()
const {setUserInfo} = UserStore
const {isSelfChange} = storeToRefs(UserStore)

//用户信息：
const userInfo = reactive({
  avatarPath:'',
  realName: '',
  hostipal: '',
  department: '',
  roleName: '',
  taskPendingCount: '', //待处理
  taskInProcessCount: '',//处理中
  taskProcessedCount: '',//已处理
  gender:'',

  un: '',
  fail: '',
  done: '',
})

//初始化界面信息：
const initInfo =async () =>{
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

const exit = () =>{
  Modal.confirm({
    title: '提示',
    icon: createVNode(ExclamationCircleOutlined),
    content: '你确认要退出登录吗？',
    okText: '确认',
    cancelText: '取消',
    centered:true,
    onOk() {
      localStorage.clear();
      router.push("/login")
    }
  })
}

watch(isSelfChange,(object)=>{
  if(object){
    initInfo()
    isSelfChange.value = false;
  }
})

onMounted(()=>{
  initInfo()
})
</script>

<style scoped>
.exit{
    width: 100%;
    height: 20px;
    font-family: Source Han Sans SC, Source Han Sans SC;
    font-weight: 400;
    font-size: 14px;
    color: #EB6296;
    line-height: 16px;
    text-align: center;
    font-style: normal;
    text-transform: none;
    display: flex;
    justify-content: end;
    cursor: pointer;
}
.exit:hover{
    text-decoration: underline;
}

.card1{
    /* width: 20vw; */
    height: 87vh;
    background: #FFFFFF;
    box-shadow: 5px 15px 25px 0px rgba(36,43,160,0.05);
    border-radius: 0px 0px 0px 0px;
    position: relative;
    margin-top: 7vh;
    padding: 0;
}

.card {
  width: 10vw;
  height: 12vh;
  background: #FBFBFF;
  box-shadow: inset 0px 0px 23px 0px rgba(36, 43, 160, 0.05);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1vh;
  text-align: center;
  margin-bottom: 5vh;
}

.cardword1{
    /* width: 3vw; */
    height: 6vh;
    font-family: Source Han Sans SC, Source Han Sans SC;
    font-weight: 500;
    font-size: 5vh;
    line-height: 5vh;
    text-align: left;
    font-style: normal;
    text-transform: none;
    margin: 0;
}

.cardword2{
    /* width: 5vw; */
    height: 3vh;
    font-family: Source Han Sans SC, Source Han Sans SC;
    font-weight: 400;
    font-size: 1.5vh;
    color: #666666;
    line-height: 4vh;
    text-align: center;
    font-style: normal;
    text-transform: none;
    margin: 0;
}

.control-circle{
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
   img{
      position: absolute;
      right: 5px;
   }
}


.cardcommon{
   border-radius: 25px 25px 25px 25px; 
   box-shadow: 5px 15px 25px 0px rgba(36,43,160,0.05);
}

.avatar {
    width: 140px;
    height: 140px;
    background: #F6F6F6;
    box-shadow: 3px 3px 25px 0px rgba(36,43,160,0.1);
    border-radius: 170px 170px 170px 170px;
    position: absolute; 
    top: -70px; 
    left: 50%; 
    transform: translateX(-50%); 
    z-index: 2; 
    /* background-image: url('../assets/avatar/Group2426@2x.png'); */
    background-position: center center;
}

.male-img{
    background-image: url('../assets/avatar/Group2426@2x.png'); 
}

.female-img{
    background-image: url('../assets/avatar/Group2425.png');
}

.avatar_text{
    margin-top: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
}
.name{
    width: 100%;
    height: 29px;
    font-family: Source Han Sans SC, Source Han Sans SC;
    font-weight: 500;
    font-size: 20px;
    color: #333333;
    line-height: 23px;
    text-align: center;
    font-style: normal;
    text-transform: none;
    margin-top: 3vh;
}

.address{
    width: 100%;
    font-family: Source Han Sans SC, Source Han Sans SC;
    font-weight: 400;
    font-size: 12px;
    color: #666666;
    text-align: center;
    font-style: normal;
    text-transform: none;
}


</style>