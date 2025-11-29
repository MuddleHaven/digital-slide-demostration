<template>
  <div :class="bgClass">
    <img src="../assets/logo/logo1_1.png" class="logo" alt="Logo">
    <div class="card">
      <div class="title">
        {{ tissueTitle }}
      </div>
      <a-form :model="formState" name="basic" ref="formRef" :rules="rules">
        <a-form-item name="username">
          <div class="prompt">
            用户名
          </div>
          <a-input type="text" class="input" placeholder="请输入用户名" v-model:value="formState.username">
            <template #prefix>
              <span class="icon_user"></span>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item name="password">
          <div class="prompt">
            密码
          </div>
          <a-input type="password" class="input" placeholder="请输入密码" v-model:value="formState.password">
            <template #prefix>
              <span class="icon_password"></span>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item>
          <a-button class="button" @click="login" :loading="iconLoading">
            <p class="text">立即登录</p>
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import * as userAPI from '../api/user.js'
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue';
import { useLayoutStore } from '../stores/LayoutStore';

const tissueTitle = import.meta.env.VITE_APP_TITLE || '胃组织病理图像处理软件'
const tissueType = import.meta.env.VITE_APP_TISSUE_TYPE || 'stomach'
const bgClass = tissueType == 'lung' ? 'container-lung' : (tissueType == 'colon' ? 'container-colon' : 'container')

const LayoutStore = useLayoutStore()

const formState = reactive({
  username: '',
  password: '',
});
const formRef = ref();
const rules = {
  username: [
    {
      required: true,
      message: '用户名不能为空!',
      trigger: 'blur',
    },
  ],
  password: [
    {
      required: true,
      message: '密码不能为空!',
      trigger: 'blur',
    },
  ]
};

const router = useRouter()
const iconLoading = ref(false);

const login = async () => {
  formRef.value.validate()
    .then(async () => {
      iconLoading.value = true
      console.log("formState", formState);
      
      const loginResponse = await userAPI.login(formState.username, formState.password);
      // console.log(loginResponse.value)
      iconLoading.value = false
      if (loginResponse.code == 200) {
        localStorage.setItem("token", loginResponse.data.token);
        localStorage.setItem("role", loginResponse.data.roleName);
        LayoutStore.changeMenu(1)
        message.success("登录成功")
        router.push("/list");
      }
    })
    .catch(error => {
      // console.log('error', error);
      iconLoading.value = false
    });
}

onMounted(() => {
  // lister the keydown event, enter to login
  document.addEventListener('keydown', (e) => {
    if (e.key == "Enter") {
      login()
    }
  })
})

onUnmounted(() => {
  // console.log("login unmounted")
  document.removeEventListener("keydown", (e) => {
    if (e.key == "Enter") {
      login()
    }
  })
})

</script>


<style scoped>
.container {
  width: 100vw;
  height: 100vh;
  background-image: url("../assets/background/loginbg.jpg");
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  color: white;
  margin: 0;
  padding: 0;
  overflow: hidden;
  position: relative;
}

.container-lung {
  width: 100vw;
  height: 100vh;
  background-image: url("../assets/background/lung5.jpg");
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  color: white;
  margin: 0;
  padding: 0;
  overflow: hidden;
  position: relative;
}

.container-colon {
  width: 100vw;
  height: 100vh;
  background-image: url("../assets/background/colon3.jpg");
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  color: white;
  margin: 0;
  padding: 0;
  overflow: hidden;
  position: relative;
}

.logo {
  position: absolute;
  top: 40px;
  left: 122px;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
}

.card {
  position: absolute;
  width: 20vw;
  height: 15vw;
  background: #FFFFFF;
  border-radius: 25px 25px 25px 25px;
  right: 100px;
  top: 50%;
  transform: translateY(-50%);
  padding: 40px;
}

.title {
  width: 20vw;
  height: 2vw;
  font-family: PangMenZhengDao;
  font-weight: 400;
  font-size: 1.8vw;
  color: #242BA0;
  text-align: left;
  font-style: normal;
  text-transform: none;
}

.content {
  margin: 10px;
}

.prompt {
  width: 36px;
  height: 34px;
  font-family: Source Han Sans SC;
  font-weight: 400;
  font-size: 12px;
  color: #666666;
  text-align: left;
  font-style: normal;
  text-transform: none;
  margin-left: 10px;
  /* margin-top: 10px; */
}

.input {
  width: 20vw;
  height: 2vw;
  /* background: #F6F7FF; */
  border-radius: 2vw;
  /* border: none;  */
}

:deep(:where(.css-dev-only-do-not-override-qzdq9e).ant-input-affix-wrapper >input.ant-input) {
  /* background: #F6F7FF; */
}


.icon_user {
  display: inline-block;
  width: 1.2vw;
  height: 1.2vw;
  background-size: contain;
  background-repeat: no-repeat;
  vertical-align: middle;
  margin-right: 8px;
  background-image: url('../assets/icon/user.png');
}

.icon_password {
  display: inline-block;
  width: 1.2vw;
  height: 1.2vw;
  background-size: contain;
  background-repeat: no-repeat;
  vertical-align: middle;
  margin-right: 0.4vw;
  background-image: url('../assets/icon/password.png');
}

.button {
  width: 20vw;
  height: 2vw;
  background: #242BA0;
  border-radius: 1vw;
  margin-top: 10px;
  align-items: center;
  display: flex;
  justify-content: center;
  cursor: pointer;

  .text {
    font-family: Source Han Sans SC;
    font-weight: 400;
    font-size: 0.7vw;
    color: #FFFFFF;
    text-align: center;
    font-style: normal;
    text-transform: none;

  }
}
</style>