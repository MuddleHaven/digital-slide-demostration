<template>
  <a-row :gutter="20">
    <a-col :span="getLeftSpan()">
      <NormalCard />
    </a-col>
    <a-col :span="getRightSpan()">
      <InformCard />
      <AboutCard style="margin-top: 2vh;" />
    </a-col>
  </a-row>
  <div class="control-circle" v-show="!isLeft" @click="changeLeft(true)"><img src="../../assets/icon/Group 2508.png"
      alt=""></div>
</template>

<script setup>
import InformCard from '../../components/InformCard.vue';
import NormalCard from '../../components/NormalCard.vue';
import AboutCard from '../../components/AboutCard.vue';
import { useSettingStore } from '../../stores/SettingStore';
import { storeToRefs } from 'pinia';

const SettingStore = useSettingStore()
const { isLeft } = storeToRefs(SettingStore)
const { getLeftSpan, getRightSpan, changeLeft } = SettingStore

</script>

<style scoped>
.control-circle {
  width: 32px;
  height: 32px;
  background: #FFFFFF;
  border-radius: 16px 16px 16px 16px;
  left: -16px;
  top: 45%;
  position: absolute;
  z-index: 9;
  display: flex;
  align-items: center;
  cursor: pointer;

  img {
    position: absolute;
    left: 5px;
  }
}
</style>