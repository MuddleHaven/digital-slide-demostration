<!-- password modify -->
<template>
  <div class="password-modify-container">
    <!-- 输入原密码，输入新密码，以及重新新密码 -->
    <FormItem label="原密码" name="原密码">
      <a-input v-model:value="oldPassword" type="password" placeholder="请输入原密码" />
    </FormItem>
    <FormItem label="新密码" name="新密码">
      <a-input v-model:value="newPassword" type="password" placeholder="请输入新密码" />
    </FormItem>
    <FormItem label="确认密码" name="确认新密码">
      <a-input v-model:value="reNewPassword" type="password" placeholder="请再次输入新密码" />
    </FormItem>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { FormItem } from 'ant-design-vue';

const oldPassword = ref('');
const newPassword = ref('');
const reNewPassword = ref('');

// Add a validation method that can be called from the parent
const validatePasswords = () => {
  // Your validation logic here
  if (!oldPassword.value) {
    return { valid: false, message: '请输入原密码' };
  }
  
  if (!newPassword.value) {
    return { valid: false, message: '请输入新密码' };
  }
  
  if (newPassword.value !== reNewPassword.value) {
    return { valid: false, message: '两次输入的新密码不一致' };
  }
  
  // Add more validation as needed (password strength, etc.)
  return { valid: true };
};

// Reset form fields
const resetFields = () => {
  oldPassword.value = '';
  newPassword.value = '';
  reNewPassword.value = '';
};

// Expose methods and data to the parent component
defineExpose({
  oldPassword,
  newPassword,
  reNewPassword,
  validatePasswords,
  resetFields
});

</script>

<style lang="scss" scoped>
.password-modify-container {
  position: relative;
  padding: 16px;
  height: 100%;
}

</style>