import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettingStore = defineStore('setStore',()=>{
  const isLeft = ref(true)

  const changeLeft = (v)=>{
    isLeft.value = v
  }

  function getLeftSpan(){
    if(isLeft.value) return 6
    return 0
  }

  function getRightSpan(){
    if(!isLeft.value) return 24
    return 18
  }

  return{
    isLeft,
    changeLeft,
    getLeftSpan,
    getRightSpan
  }
})