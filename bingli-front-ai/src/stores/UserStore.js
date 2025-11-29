import { defineStore } from 'pinia';
import { ref } from 'vue';

export const userUserStore = defineStore('userStore',()=>{

  const isChange = ref(false) //是否修改了其他用户的信息

  const isSelfChange = ref(false) //是否修改了自己的用户信息

  const curUserInfo = ref(null)
  // 临时存储用户信息
  const tempUserInfo = ref(null) 

  const selfUserInfo = ref(null) //当前登录的用户信息

  const setUserInfo = (value)=>{
    curUserInfo.value = value
  }

  function setSelfUserInfo(value){
    selfUserInfo.value = value
  }

  function setTempUserInfo(value){
    tempUserInfo.value = value
  }

  return{
    isChange,
    isSelfChange,
    curUserInfo,
    tempUserInfo,
    selfUserInfo,
    setUserInfo,
    setSelfUserInfo,
    setTempUserInfo,
  }
})