<template>
  <div class="card">
    <h3 class="section-title">账户信息</h3>
    <div class="form-fields">
      <div class="center-input-select">
        <a-input v-model:value="doctorName" class="input" placeholder="请输入姓名" />
      </div>
      <div class="center-input-select">
        <a-select v-model:value="department" disabled placeholder="请选择科室" class="select">
          <a-select-option v-for="option in departmentOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </a-select-option>
        </a-select>
      </div>
      <div class="center-input-select">
        <!-- <a-select
                v-model:value="hospital"
                placeholder="请输入医院名称"
                class="select"
            >
                <a-select-option
                    v-for="option in hospitalOptions"
                    :key="option.value"
                    :value="option.value"
                >
                    {{ option.label }}
                </a-select-option>
                 </a-select> -->
        <a-input v-model:value="hospital" class="input" placeholder="请输入医院名称" />
      </div>

      <div class="center-input-select">
        <a-select v-model:value="gender" placeholder="请选择性别" class="select">
          <a-select-option v-for="option in genderOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </a-select-option>
        </a-select>
      </div>

      <div class="center-input-select">
        <div class="upload">
          <div class="status" v-if="isUpload == '未上传'">签名：</div>
          <img v-else :src="signImg" alt="" class="sign-img">
          <div class="status">{{ isUpload }}</div>
          <a-upload :show-upload-list="false" v-model:fileList="fileList" :before-upload="beforeUpload"
            :multiple="false" :on-change="handleChange">
            <a-button type="primary" class="btn">
              <span style="font-size: 0.65vw;">点击上传/修改</span>
            </a-button>
          </a-upload>
        </div>
      </div>
    </div>

    <div class="center-input-select" style="position: relative;">
      <a-button type="primary" class="btn2" @click="handleSubmit">确认修改</a-button>
      <div style="position: absolute; right: 1vw; top: 2vh; width: 44px; height: 44px; display: flex; justify-content: center; align-items: center;">
        <a-tooltip title="修改密码">
          <a-button type="primary" shape="circle" :icon="h(LockOutlined)" @click="modifyModal = true" />
        </a-tooltip>
      </div>
    </div>
    <div class="control-circle" @click="changeLeft(false)"><img src="../assets/icon/Group 2508.png" alt=""></div>
  </div>
  <!-- modify password modal -->
  <a-modal v-model:open="modifyModal" title="修改密码" @cancel="handlePasswordCancel" @ok="handlePasswordSubmit" centered>
    <template #title>
      修改密码
    </template>
    <PasswordModify ref="passwordModifyRef" />
  </a-modal>
</template>

<script setup>
import { ref, onMounted, h } from 'vue';
import * as userAPI from '../api/user.js'
import { message, Modal } from 'ant-design-vue';
import { userUserStore } from '../stores/UserStore';
import { storeToRefs } from 'pinia';
import { useSettingStore } from '../stores/SettingStore';
import PasswordModify from './setting/PasswordModify.vue';
import { LockOutlined } from '@ant-design/icons-vue';


const SettingStore = useSettingStore()
const { changeLeft } = SettingStore

const UserStore = userUserStore()
const { isSelfChange } = storeToRefs(UserStore)

const modifyModal = ref(false)
const passwordModifyRef = ref(null);


// Function to handle password change submission
const handlePasswordSubmit = async () => {
  // Get reference to the PasswordModify component
  const passwordModify = passwordModifyRef.value;

  if (!passwordModify) {
    message.error('组件初始化失败');
    return;
  }
  // console.log("passwordModify", passwordModify);

  // Validate passwords using the exposed method
  const validation = passwordModify.validatePasswords();
  if (!validation.valid) {
    message.warning(validation.message);
    return;
  }

  // Get the password values via the exposed refs
  const oldPwd = passwordModify.oldPassword;
  const newPwd = passwordModify.newPassword;

  try {

    // Call your API to change password
    const response = await userAPI.changePassword({
      oldPassword: oldPwd,
      newPassword: newPwd
    });

    console.log(response);

    message.success('密码修改成功');
    modifyModal.value = false;
    passwordModify.resetFields(); // Reset the form fields
  } catch (error) {
    // message.error('密码修改失败');
  }
};

// Handle modal cancel
const handlePasswordCancel = () => {
  // Reset the form when canceling
  if (passwordModifyRef.value) {
    passwordModifyRef.value.resetFields();
  }
  modifyModal.value = false;
};

onMounted(() => {
  initInfo()
})

const userId = ref();
const doctorName = ref();
const department = ref(); // 默认选中病理科
const hospital = ref(); // 默认选中第一人民医院
const gender = ref(); // 默认选中男
const doctorAccount = ref(null);
const password = ref("");
const password2 = ref("")
const isUpload = ref("未上传")
const fileList = ref([])
const signImg = ref()

//初始化界面信息：
const initInfo = async () => {
  // 获取用户信息
  const userInfoResponse = await userAPI.getUserInfo()
  let data = userInfoResponse.data

  // console.log(data)

  userId.value = data.user.id
  doctorName.value = data.user.realname
  department.value = data.user.department || "病理科"
  hospital.value = data.user.hospital
  gender.value = data.user.gender || "男"
  doctorAccount.value = data.user.username
  signImg.value = data.user.electronicSignaturePath
  if (data.user.electronicSignaturePath != null && data.user.electronicSignaturePath != "") {
    isUpload.value = "已上传"
  }
}

const departmentOptions = ref([
  { value: '病理科', label: '病理科' },
  { value: '呼吸内科', label: '呼吸内科' },
  { value: '外科', label: '外科' },
]);

const hospitalOptions = ref([
  { value: '安医大一附院', label: '安医大一附院' },
  { value: '安医大二附院', label: '安医大二附院' },
  { value: '安医大三附院', label: '安医大三附院' },
]);

const genderOptions = ref([
  { value: '男', label: '男' },
  { value: '女', label: '女' },
]);

const validateAccountAndPasswords = () => {
  const account = doctorAccount.value
  if (account == null || account == "") {
    message.warning("用户名不能为空")
    return false
  }

  const regex = /^[a-zA-Z0-9]{1,8}$/;
  if (!regex.test(account)) {
    message.warning("用户名只能是1到8位的英文或数字");
    return false;
  }

  const pwd = password.value;
  const pwd2 = password2.value;

  if (pwd == "" && pwd2 == "") return true

  if (pwd != pwd2) {
    message.warning("两次输入的密码不相同")
    return false
  }

  const hasUpperCase = /[A-Z]/.test(pwd);
  const hasLowerCase = /[a-z]/.test(pwd);
  const hasSymbol = /[!@#$%^&*()\-_=+{};:,<.>?]/.test(pwd);
  const isLongEnough = pwd.length >= 8 && pwd.length <= 16;
  const isPasswordValid = hasUpperCase && hasLowerCase && hasSymbol && isLongEnough;
  if (!isPasswordValid) {
    message.warning("密码至少8位且小于16位且需包含大写字母、小写字母和符号,如#、*、@、！等")
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateAccountAndPasswords()) return
  const formData = new FormData();
  formData.append('id', userId.value); // 医生姓名
  formData.append('realname', doctorName.value); // 医生姓名
  formData.append('department', department.value); // 科室
  formData.append('hospital', hospital.value); // 医院
  formData.append('gender', gender.value); // 性别
  // formData.append('username', doctorAccount.value); // 账号
  // formData.append('password', password.value); // 密码
  //formData.append('multipartFile', null); // 无文件时传 null
  //如果有文件上传
  console.log(fileList.value)
  if (fileList.value.length) {
    fileList.value.forEach((item) => {
      formData.append("multipartFile", item.originFileObj)
    })
  } else {
    console.log("无文件")
  }
  const response = await userAPI.updateUserInfo(formData);
  if (response.code == "200") {
    isSelfChange.value = true;
    initInfo()
    message.success(response.msg)
  }
}

const handleChange = () => {
  fileList.value = fileList.value.slice(-1); // 只保留最新上传的一个文件
  const file = fileList.value[0];
  // 通过 FileReader 读取文件
  const reader = new FileReader();
  reader.onload = (e) => {
    signImg.value = e.target.result; // 将 base64 赋值给图片地址
    isUpload.value = '已上传';
  };
  reader.readAsDataURL(file.originFileObj);
}

const beforeUpload = () => {
  return false //手动点击上传
}

</script>

<style scoped>
.card {
  /* width: 18vw; */
  height: 55vh;
  background: #FFFFFF;
  box-shadow: 5px 15px 25px 0px rgba(36, 43, 160, 0.05);
  border-radius: 25px;
  margin-top: 2vh;
  padding: 1vw;
}

.form-fields {
  margin-top: 1vh;
  width: 100%;
}

.input {
  width: 17vw;
  height: 3.5vh;
  background: #F6F7FF;
  border-radius: 41px 41px 41px 41px;
  border-color: #FFFFFF;
  color: #666666;
  margin: 0px;
  padding-left: 0.9vw;
  margin-bottom: 1vh;
}

:deep(.select .ant-select-selection-placeholder) {
  color: #666666;
}

.select {
  margin-bottom: 1vh;
}

:deep(.select .ant-select-selector) {
  width: 17vw;
  height: 3.5vh;
  background: #F6F7FF;
  border-radius: 2vh;
  border-color: #FFFFFF;
  font-weight: 2vh;
  padding-left: 1vw;
  display: flex;
  align-items: center;
  color: #666666;
}


.upload {
  display: flex;
  /* width: 17vw; */
  height: 3.5vh;
  background: #F6F7FF;
  border-radius: 41px 41px 41px 41px;
  text-align: center;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
}

.status {
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: 400;
  font-size: 1.5vh;
  color: #666666;
  text-align: center;
  font-style: normal;
  text-transform: none;
  display: flex;
  align-items: center;
}

.sign-img {
  width: 1.5vw;
  height: 1.5vw;
  margin-right: 5px;
}

.btn {
  width: 5.5vw;
  height: 3.5vh;
  background: #242BA0;
  border-radius: 76px 76px 76px 76px;
  margin-left: 5.5vw;
}

.info-item {
  width: 17vw;
  height: 3.5vh;
  border-radius: 48px 48px 48px 48px;
  margin-bottom: 1vh;
  display: flex;
  /* 使用 Flexbox */
  align-items: center;
  /* 垂直居中 */
  background-color: #F6F7FF;
}

:deep(.info-item .ant-input) {
  background-color: #F6F7FF;
}


.icon_user {
  display: inline-block;
  width: 24px;
  height: 24px;
  background-size: contain;
  background-repeat: no-repeat;
  vertical-align: middle;
  margin-right: 0.75vw;
  background-image: url('../assets/icon/user.png');
}

.icon_password {
  display: inline-block;
  width: 24px;
  height: 24px;
  background-size: contain;
  background-repeat: no-repeat;
  vertical-align: middle;
  margin-right: 8px;
  margin-right: 0.75vw;
  background-image: url('../assets/icon/password.png');
}


.icon {
  margin-right: 0.75vw;
}

.icon2 {
  margin-right: 0.75vw;
  background-image: url('../assets/normalsetting/icon／密码.png');
}

.btn2 {
  width: 7vw;
  height: 3.5vh;
  background: #37AE2F;
  border-radius: 76px 76px 76px 76px;
  margin-top: 2vh;
}

.center-input-select {
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-circle {
  width: 32px;
  height: 32px;
  background: #FFFFFF;
  border-radius: 16px 16px 16px 16px;
  right: -6px;
  top: 65%;
  position: absolute;
  z-index: 9;
  display: flex;
  align-items: center;
  cursor: pointer;

  img {
    position: absolute;
    right: 5px;
  }
}
</style>