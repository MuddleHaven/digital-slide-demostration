<template>
  <div class="card">
    <h2 class="title">编辑资料</h2>
    <div class="main">
      <a-row :gutter="20">
        <!-- 左侧医生信息 -->
        <a-col :span="6">
          <div class="doc-info">
            <div class="avatar2"
              :class="{ 'male-img': formState.gender === '男', 'female-img': formState.gender === '女' }"></div>
            <p class="doc-name">{{ formState.doctorName }} 医生</p>
            <p class="doc-title">{{ formState.department }} 副主任医师</p>
          </div>
        </a-col>

        <!-- 中间表单区域 -->
        <a-col :span="12">
          <div class="section-title">医生资料</div>
          <a-form class="form-fields" :model="formState" :rules="rules" ref="formRef">
            <a-row>
              <a-form-item label="必填" name="doctorName">
                <a-input v-model:value="formState.doctorName" class="input" placeholder="请输入医生姓名" />
              </a-form-item>
              <a-form-item label="必填" name="department">
                <div style="width: 12vw;">
                  <a-select v-model:value="formState.department" disabled placeholder="请选择科室" class="select">
                    <a-select-option v-for="option in departmentOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </a-select-option>
                  </a-select>
                </div>
              </a-form-item>
            </a-row>
            <a-row>
              <a-form-item label="必填" name="hospital">
                <div style="width: 12vw;margin-right: 1vh;">
                  <a-input v-model:value="formState.hospital" class="input" placeholder="请输入医院名称" />
                </div>
              </a-form-item>
              <a-form-item label="必填" name="gender">
                <div style="width: 12vw;margin-right: 1vh;">
                  <a-select v-model:value="formState.gender" placeholder="请选择性别" class="select">
                    <a-select-option v-for="option in genderOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </a-select-option>
                  </a-select>
                </div>
              </a-form-item>
            </a-row>
            <div class="upload">
              <div class="status" v-if="isUpload === '未上传'">签名：</div>
              <img v-else :src="signImg" alt="" class="sign-img">
              <div class="status">{{ isUpload }}</div>
              <a-upload v-model:fileList="fileList" :show-upload-list="false" :before-upload="beforeUpload"
                @change="handleAvatarChange">
                <a-button type="primary" class="btn">点击上传/修改</a-button>
              </a-upload>
            </div>
          </a-form>
        </a-col>

        <!-- 右侧账号信息 -->
        <a-col :span="6">
          <!-- <div class="section-title">账号信息</div> -->
          <!-- <div class="section-title">账号信息</div>
          <div class="account-info">
            <a-input v-model:value="doctorAccount" class="info-item">
              <template #prefix>
                <span class="icon_user"></span>
              </template>
</a-input>
<a-input type="password" class="info-item" placeholder="••••••••••••" v-model:value="password">
  <template #prefix>
                <span class="icon_password"></span>
              </template>
</a-input>
<a-input type="password" class="info-item" placeholder="••••••••••••" v-model:value="password2">
  <template #prefix>
                <span class="icon_password"></span>
              </template>
</a-input>
</div> -->
          <!-- optional buttons -->

          <!-- 底部按钮 -->
          <div class="bottom">
            <a-button type="primary" class="confirm-btn" @click="handleSubmit">
              确认修改
            </a-button>
            <a-tooltip title="修改密码">
              <a-button type="primary" shape="circle" :icon="h(LockOutlined)" @click="modifyModal = true" />
            </a-tooltip>
          </div>
        </a-col>
      </a-row>
    </div>
    <!-- modify password modal -->
    <a-modal v-model:open="modifyModal" title="修改密码" @cancel="handlePasswordCancel" @ok="handlePasswordSubmit" centered>
      <template #title>
        修改密码
      </template>
      <PasswordModify ref="passwordModifyRef" />
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, h } from 'vue';
import * as userAPI from '../api/user.js'
import { userUserStore } from '../stores/UserStore';
import { storeToRefs } from 'pinia';
import { message } from 'ant-design-vue';
import { LockOutlined } from '@ant-design/icons-vue';

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


// Store
const UserStore = userUserStore()
const { isSelfChange } = storeToRefs(UserStore)

// Form state and refs
const userId = ref('');
const doctorAccount = ref('');
const password = ref('');
const password2 = ref('');
const isUpload = ref('未上传');
const fileList = ref([]);
const signImg = ref('');
const formRef = ref();

// Form validation rules
const rules = {
  doctorName: [{ required: true, message: '姓名不能为空!', trigger: 'blur' }],
  department: [{ required: true, message: '科室不能为空!', trigger: 'blur' }],
  hospital: [{ required: true, message: '医院不能为空!', trigger: 'blur' }],
  gender: [{ required: true, message: '性别不能为空!', trigger: 'blur' }]
};

// Reactive form state
const formState = reactive({
  doctorName: "",
  department: "病理科",
  hospital: "XX医院",
  gender: "男"
});

// Options data
const departmentOptions = ref([
  { value: '病理科', label: '病理科' },
  { value: '呼吸内科', label: '呼吸内科' },
  { value: '外科', label: '外科' }
]);

const genderOptions = ref([
  { value: '男', label: '男' },
  { value: '女', label: '女' }
]);

/**
 * Initialize user information
 */
const initInfo = async () => {
  try {
    const userInfoResponse = await userAPI.getUserInfo();
    const data = userInfoResponse.data;

    if (!data || !data.user) {
      message.error('获取用户信息失败');
      return;
    }

    userId.value = data.user.id;
    formState.doctorName = data.user.realname;
    formState.department = data.user.department;
    formState.hospital = data.user.hospital;
    formState.gender = data.user.gender;
    doctorAccount.value = data.user.username;
    signImg.value = data.user.electronicSignaturePath;

    if (data.user.electronicSignaturePath) {
      isUpload.value = '已上传';
    }
  } catch (error) {
    console.error('Failed to fetch user info:', error);
    message.error('获取用户信息失败');
  }
};

/**
 * Validate account and passwords
 * @returns {boolean} - Whether validation passed
 */
const validateAccountAndPasswords = () => {
  const account = doctorAccount.value;

  if (!account) {
    message.warning('用户名不能为空');
    return false;
  }

  const regex = /^[a-zA-Z0-9]{1,8}$/;
  if (!regex.test(account)) {
    message.warning('用户名只能是1到8位的英文或数字');
    return false;
  }

  const pwd = password.value;
  const pwd2 = password2.value;

  // If both password fields are empty, no password change is intended
  if (!pwd && !pwd2) return true;

  if (pwd !== pwd2) {
    message.warning('两次输入的密码不相同');
    return false;
  }

  // Password complexity validation
  const hasUpperCase = /[A-Z]/.test(pwd);
  const hasLowerCase = /[a-z]/.test(pwd);
  const hasSymbol = /[!@#$%^&*()\-_=+{};:,<.>?]/.test(pwd);
  const isLongEnough = pwd.length >= 8 && pwd.length <= 16;

  if (!(hasUpperCase && hasLowerCase && hasSymbol && isLongEnough)) {
    message.warning('密码至少8位且小于16位且需包含大写字母、小写字母和符号,如#、*、@、！等');
    return false;
  }

  return true;
};

/**
 * Handle form submission
 */
const handleSubmit = async () => {
  if (!validateAccountAndPasswords()) return;

  try {
    await formRef.value.validate();

    const formData = new FormData();
    formData.append('id', userId.value);
    formData.append('realname', formState.doctorName);
    formData.append('department', formState.department);
    formData.append('hospital', formState.hospital);
    formData.append('gender', formState.gender);
    formData.append('username', doctorAccount.value);
    formData.append('password', password.value);

    // Handle file upload
    if (fileList.value.length > 0) {
      formData.append('multipartFile', fileList.value[0].originFileObj);
    } else {
      formData.append('multipartFile', null);
    }

    const response = await userAPI.updateUserInfo(formData);

    if (response.code === '200') {
      isSelfChange.value = true;
      await initInfo();
      message.success(response.msg || '修改成功');
      // Reset password fields after successful submission
      password.value = '';
      password2.value = '';
    } else {
      message.error(response.msg || '修改失败');
    }
  } catch (error) {
    console.error('Form submission error:', error);
    message.error('提交失败，请检查表单内容');
  }
};

/**
 * Handle avatar change
 * @param {Object} info - Upload info
 */
const handleAvatarChange = (info) => {
  if (!info.file.originFileObj) return;

  // Only keep the latest uploaded file
  fileList.value = [info.file];

  const reader = new FileReader();
  reader.onload = (e) => {
    signImg.value = e.target.result;
    isUpload.value = '已上传';
  };
  reader.readAsDataURL(info.file.originFileObj);
};

/**
 * Validate file before upload
 * @param {File} file - File to be uploaded
 * @returns {boolean} - Whether to proceed with upload
 */
const beforeUpload = (file) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isJpgOrPng) {
    message.error('只能上传 JPG/PNG 格式的图片!');
    return false;
  }

  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('图片必须小于 2MB!');
    return false;
  }

  return false; // Return false to prevent auto upload
};

// Initialize on mount
onMounted(() => {
  initInfo();
});

</script>

<style scoped>
.card {
  height: 61vh;
  background: #FFFFFF;
  box-shadow: 5px 15px 25px 0px rgba(36, 43, 160, 0.05);
  border-radius: 25px;
  margin: 0;
  padding: 1vw;
}

.main {
  width: 100%;
  height: 80%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  padding: 0;
  margin-left: 1.5vw;
  width: 64px;
  height: 23px;
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: 500;
  font-size: 16px;
  color: #000000;
  line-height: 19px;
  text-align: center;
  font-style: normal;
  text-transform: none;
}

.doc-info {
  width: 11vw;
  height: 30vh;
  background: #FBFBFF;
  box-shadow: inset 0px 0px 23px 0px rgba(36, 43, 160, 0.05);
  border-radius: 15px;
  text-align: center;
  align-items: center;
  justify-content: center;
  display: flex;
  flex-direction: column;
}

.avatar2 {
  width: 5vw;
  height: 5vw;
  background: #F6F6F6;
  box-shadow: 3px 3px 25px 0px rgba(36, 43, 160, 0.1);
  border-radius: 50%;
  z-index: 2;
  background-repeat: no-repeat;
  background-position: center;
}

.male-img {
  background-image: url('../assets/avatar/Group2426.png');
}

.female-img {
  background-image: url('../assets/avatar/Group2425.png');
}

.doc-name {
  width: 7vw;
  height: 2vh;
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: bold;
  font-size: 2vh;
  color: #333333;
  line-height: 3vh;
  text-align: center;
  font-style: normal;
  text-transform: none;
}

.doc-title {
  width: 10vw;
  height: 1vh;
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: 400;
  font-size: 1.5vh;
  color: #666666;
  line-height: 2vh;
  text-align: center;
  font-style: normal;
  text-transform: none;
}

.section-title {
  font-weight: 500;
  margin-bottom: 1.5vh;
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: 500;
  font-size: 16px;
  color: #000000;
  font-style: normal;
  text-transform: none;
}

.form-fields {
  margin-top: 1.5vh;
}

.input {
  width: 12vw;
  height: 4vh;
  background: #F6F7FF;
  border-radius: 41px;
  border-color: #FFFFFF;
  color: #666666;
  margin-right: 1vh;
  padding-left: 1vw;
}

:deep(.select .ant-select-selection-placeholder) {
  color: #666666;
}

:deep(.select .ant-select-selector) {
  width: 100%;
  height: 4vh;
  background: #F6F7FF;
  border-radius: 41px;
  padding: 0;
  border-color: #FFFFFF;
  font-weight: 2vh;
  text-align: left;
  padding-left: 1vw;
  display: flex;
  align-items: center;
  color: #666666;
}

.upload {
  display: flex;
  width: 28.5vw;
  height: 4vh;
  background: #F6F7FF;
  border-radius: 41px;
  text-align: center;
  padding-left: 0.5vw;
  justify-content: center;
  align-items: center;
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
  width: 7vw;
  height: 3.5vh;
  background: #242BA0;
  border-radius: 76px;
  margin-left: 16vw;
}

.account-info {
  margin-top: 1.5vh;
}

.info-item {
  width: 13vw;
  height: 4vh;
  border-radius: 48px;
  margin-bottom: 2vh;
  display: flex;
  align-items: center;
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
  margin-right: 0.75vw;
  background-image: url('../assets/icon/password.png');
}

.confirm-btn {
  background-color: #48bb78;
  border-radius: 50px;
  width: 135px;
  height: 36px;
}

.bottom {
  justify-content: center;
  display: flex;
  align-items: center;
  margin-top: 30px;
  column-gap: 20px;
}
</style>