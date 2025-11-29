<template>
  <DirectorList v-if="role == '主任'" />
  <totalData style="margin-top: 15px;" />
  <a-row :gutter="16" style="margin-top: 15px;">
    <a-col :span="12">
      <div class="card1" :class="{ 'card-h': role != '主任' }">
        <LineBarCharts v-if="curUserInfo == null" />
        <LogResult v-else />
      </div>
    </a-col>
    <a-col :span="6" v-if="curUserInfo == null">
      <div class="card1" :class="{ 'card-h': role != '主任' }">
        <PieCharts />
      </div>
    </a-col>
    <a-col :span="6" v-if="curUserInfo == null">
      <div class="card1" :class="{ 'card-h': role != '主任' }">
        <AiStatistics />
      </div>
    </a-col>
    <a-col :span="12" v-else>
      <div class="card1" :class="{ 'card-h': role != '主任' }">
        <LineBarCharts />
      </div>
    </a-col>
  </a-row>
  <a-row :gutter="16" style="margin-top: 15px;">
    <a-col :span="6">
      <div class="card1" :class="{ 'card-h': role != '主任' }">
        <RadarChart />
      </div>
    </a-col>
    <a-col :span="18">
      <div class="card1" :class="{ 'card-h': role != '主任' }">
        <BumpChart />
      </div>
    </a-col>
  </a-row>
</template>

<script setup>
import DirectorList from '../../components/DirectorList.vue';
import totalData from '../../components/charts/totalData.vue';
import PieCharts from '../../components/charts/PieCharts.vue';
import LineBarCharts from '../../components/charts/LineBarCharts.vue';
import RadarChart from '../../components/charts/RadarChart.vue';
import BumpChart from '../../components/charts/BumpChart.vue';
import LogResult from '../../components/charts/LogResult.vue';
import * as userAPI from '../../api/user.js'
import AiStatistics from '../../components/charts/AiStatistics.vue';

import { userUserStore } from '../../stores/UserStore';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';

const UserStore = userUserStore()
const { curUserInfo } = storeToRefs(UserStore)
const { setUserInfo } = UserStore
const role = localStorage.getItem("role")

const getUserInfo = async () => {
  let res = await userAPI.getUserInfo()
  setUserInfo(res.data.user)
}

onMounted(() => {
  if (role != "主任") getUserInfo()
  else setUserInfo(null)
})
</script>

<style scoped>
.card1 {
  width: 100%;
  height: 30vh;
  background: #FFFFFF;
  box-shadow: 5px 15px 25px 0px rgba(36, 43, 160, 0.05);
  border-radius: 25px 25px 25px 25px;
  padding: 10px;
  box-sizing: border-box;
}

.card-h {
  height: 38vh;
}
</style>