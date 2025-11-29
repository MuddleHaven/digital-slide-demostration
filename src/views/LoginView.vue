<template>
  <div class="login-container">
    <a-card title="登录" style="max-width: 360px; width: 100%;">
      <a-form :model="formState" name="basic" ref="formRef" :rules="rules">
        <a-form-item name="username">
          <a-input type="text" placeholder="请输入用户名" v-model:value="formState.username" />
        </a-form-item>
        <a-form-item name="password">
          <a-input type="password" placeholder="请输入密码" v-model:value="formState.password" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" block @click="login" :loading="loading">立即登录</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
  
</template>

<script setup>
import { useRouter } from 'vue-router'
import * as userAPI from '@/service/user.js'
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue';

const router = useRouter()

const formState = reactive({
  username: 'admin',
  password: 'a1234567',
});
const formRef = ref();
const rules = {
  username: [
    { required: true, message: '用户名不能为空!', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '密码不能为空!', trigger: 'blur' },
  ]
};

const loading = ref(false);
const enterHandler = ref(null);

const login = async () => {
  formRef.value.validate()
    .then(async () => {
      loading.value = true
      const loginResponse = await userAPI.login(formState.username, formState.password);
      loading.value = false
      if (loginResponse.code == 200) {
        localStorage.setItem('token', loginResponse.data.token);
        localStorage.setItem('role', loginResponse.data.roleName);
        message.success('登录成功')
        router.push('/list');
      }
    })
    .catch(() => {
      loading.value = false
    })
}

onMounted(() => {
  const handler = (e) => { if (e.key === 'Enter') login() }
  document.addEventListener('keydown', handler)
  enterHandler.value = handler
})

onUnmounted(() => {
  if (enterHandler.value) {
    document.removeEventListener('keydown', enterHandler.value)
  }
})
</script>

<style scoped>
.login-container {
  min-height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-image: url('../assets/images/login-bg.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
</style>
