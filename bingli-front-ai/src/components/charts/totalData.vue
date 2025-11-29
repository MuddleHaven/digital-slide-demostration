<template>
   <a-row class="card">
      <a-col :span="9" >
         <div class="left">
            <div class="box" v-if="role=='主任'&&curUserInfo==null">
               <div class="number">{{ data.doctorSum }}</div>
               <div class="text">在职医生</div>
            </div>
            <div class="box">
               <div class="number" style="color: #FFE043;">{{ data.sliceSum }}</div>
               <div class="text">切片总数</div>
            </div>
         </div>
      </a-col>
      <a-col :span="15" >
         <div class="right">
            <div class="box">
               <div class="number" style="color: #37AE2F;">{{ data.nonTumor }}</div>
               <div class="text">非肿瘤性</div>
            </div>
            <div class="box">
               <div class="number" style="color: #EB6296;">{{ data.precancerousState }}</div>
               <div class="text">癌前状态</div>
            </div>
            <div class="box">
               <div class="number">{{ data.precancerousLesion }}</div>
               <div class="text">癌前病变</div>
            </div>
            <div class="box">
               <div class="number" style="color: #FFE043;">{{ data.malignantTumor }}</div>
               <div class="text">恶性肿瘤</div>
            </div>
         </div>
      </a-col>
   </a-row>
</template>

<script setup>
import * as sliceApi from '../../api/slice.js'
import { onMounted, ref, watch } from 'vue';
import { userUserStore } from '../../stores/UserStore';
import { storeToRefs } from 'pinia';

const UserStore = userUserStore()
const {curUserInfo} = storeToRefs(UserStore)
const role = localStorage.getItem("role")


const data = ref("")
const getdata = async ()=>{
  let res = await sliceApi.getDepartmentSliceAccount()
  data.value = res.data
  console.log(data.value)
}

const getPersonalData = async () => {
  let res = await sliceApi.getUserSliceAccountByUserId(curUserInfo.value.id)
  data.value = res.data
}

onMounted(()=>{
  if(role == '主任') getdata()
  else getPersonalData()
})

watch(curUserInfo,(newval)=>{
  if(newval!=null){
    getPersonalData()
  }else{
    getdata()
  }
})

</script>

<style scoped>
.card{
   height: 10vh;
   background: #FFFFFF;
   box-shadow: 5px 15px 25px 0px rgba(36,43,160,0.05);
   border-radius: 25px 25px 25px 25px;
   box-sizing: border-box;
   padding: 1vh;
}

.left{
   width: 100%;
   height: 100%;
   border-right: 1px solid #EEEEEE;
   display: flex;
   justify-content: space-around;
   align-items: center;
}

.right{
   width: 100%;
   height: 100%;
   display: flex;
   justify-content: space-around;
   align-items: center;
}

.box{
   height: 100%;
   width: 10vw;
   display: flex;
   flex-direction: column;
   justify-content: center;
}

.number{
   font-family: Source Han Sans SC, Source Han Sans SC;
   font-weight: 500;
   font-size: 2vw;
   color: #242BA0;
   text-align: center;
   font-style: normal;
   text-transform: none;
   line-height: 4vh;
}

.text{
   font-family: Source Han Sans SC, Source Han Sans SC;
   font-weight: 400;
   font-size: 0.7vw;
   color: #666666;
   text-align: center;
   font-style: normal;
   text-transform: none;
   line-height: 2vh;
}
</style>