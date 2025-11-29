<template>
   <div class="card">
      <div class="title">AI性能指标</div>
      <div class="box">
         <a-row>
            <a-col :span="3" :offset="1" class="text" style="color: #666666;">ACC</a-col>
            <a-col :span="5" class="text">{{ data.ACC[0] * 100 }}%</a-col>
            <a-col :span="13" class="text flex-end">{{ data.ACC[1] }}</a-col>
         </a-row>
         <a-progress :percent="data.ACC[0] * 100" :show-info="false" strokeColor="#242BA0" :size="20"/>
         <a-row>
            <a-col :span="3" :offset="1" class="text" style="color: #666666;">AUC</a-col>
            <a-col :span="5" class="text">{{ data.AUC[0] * 100 }}%</a-col>
            <a-col :span="13" class="text flex-end">{{ data.AUC[1] }}</a-col>
         </a-row>
         <a-progress :percent="data.AUC[0] * 100 " :show-info="false" strokeColor="#242BA0" :size="20"/>
         <a-row>
            <a-col :span="3" :offset="1" class="text" style="color: #666666;">敏感性</a-col>
            <a-col :span="5" class="text">{{ data.sensitive[0] * 100 }}%</a-col>
            <a-col :span="13" class="text flex-end">{{ data.sensitive[1] }}</a-col>
         </a-row>
         <a-progress :percent="data.sensitive[0] * 100" :show-info="false"  strokeColor="#242BA0" :size="20"/>
         <a-row>
            <a-col :span="3" :offset="1" class="text" style="color: #666666;">特异性</a-col>
            <a-col :span="5" class="text">{{ data.special[0] * 100 }}%</a-col>
            <a-col :span="13" class="text flex-end">{{ data.special[1] }}</a-col>
         </a-row>
         <a-progress :percent="data.special[0] * 100" :show-info="false" strokeColor="#242BA0" :size="20"/>
      </div>
   </div>
</template>

<script setup>
import { ref,onMounted,onUnmounted,computed,watch, reactive } from 'vue';
import { userUserStore } from '../../stores/UserStore';
import { storeToRefs } from 'pinia';
import * as sliceApi from '../../api/slice.js'

const UserStore = userUserStore()
const { curUserInfo } = storeToRefs(UserStore)

watch(curUserInfo,(newval)=>{
   
})

let data = reactive({
  ACC:[],
  special:[],
  AUC:[],
  sensitive:[]
})
const getAIData = async ()=>{
  let res = await sliceApi.getAIMetrics()
  data.ACC = res.data['ACC']
  data.special = res.data['特异性']
  data.AUC = res.data['AUC']
  data.sensitive = res.data['敏感性']
}

onMounted(()=>{
  getAIData()
})

</script>

<style scoped>
.card {
   width: 100%;
   height: 100%;
}

.title {
   font-family: Source Han Sans SC, Source Han Sans SC;
   font-weight: 600;
   font-size: 16px;
   color: #000000;
   text-align: left;
   font-style: normal;
   text-transform: none;
}
.box{
   width: 100%;
   height: 100%;
   padding: 15px;
   box-sizing: border-box;
}

.text{
   font-family: Source Han Sans SC, Source Han Sans SC;
   font-weight: Normal;
   font-size: 0.7vw;
   color: #BBBBBB;
   font-style: normal;
   text-transform: none;
}

.flex-end{
   display: flex;
   justify-content: end;
}
</style>