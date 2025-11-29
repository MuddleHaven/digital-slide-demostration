<template>
  <div class="card">
    <h2 class="title">编辑资料</h2>
    <div class="main">
      <!-- 未选择医生时显示提示图 -->
      <div v-if="curUserInfo == null" class="image-container">
        <img src="../assets/normalsetting/undraw_doctors_p6aq 1.png" alt="点击编辑" class="initial-image" />
        <span class="clickword">点击上方医生头像，编辑医生资料</span>
      </div>

      <!-- 编辑表单 -->
      <div v-else>
        <a-row :gutter="6">
          <!-- 左侧医生信息 -->
          <a-col :span="6">
            <div class="doc-info">
              <div class="avatar2" :class="getAvatarClass">
              </div>
              <p class="doc-name">{{ displayDoctorName }} 医生</p>
              <span class="doc-title" v-if="formState.department">{{ formState.department }} {{ roleName }}</span>
            </div>
          </a-col>

          <!-- 中间表单区域 -->
          <a-col :span="12">
            <div class="section-title">医生资料</div>
            <a-form class="form-fields" :model="formState" :rules="rules" ref="formRef">
              <a-row>
                <a-form-item label="姓名" name="doctorName">
                  <a-input v-model:value="formState.doctorName" class="input" placeholder="请输入医生姓名" />
                </a-form-item>
                <a-form-item label="科室" name="department">
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
                <a-form-item label="医院" name="hospital">
                  <div style="width: 12vw;margin-right: 1vh;">
                    <!-- <a-select  v-model:value="formState.hospital"
                                    placeholder="请输入医院名称" class="select">
                                    <a-select-option v-for="option in hospitalOptions" :key="option.value"
                                        :value="option.value">
                                        {{ option.label }}
                                    </a-select-option>
                                    </a-select> -->
                    <a-input v-model:value="formState.hospital" class="input" placeholder="请输入医院名称" />
                  </div>
                </a-form-item>
                <a-form-item label="性别" name="gender">
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
                <img v-else :src="signImg" alt="签名" class="sign-img">
                <div class="status">{{ isUpload }}</div>
                <a-upload v-model:fileList="fileList" :show-upload-list="false" :before-upload="beforeUpload"
                  :on-change="handleAvatarChange">
                  <a-button type="primary" class="btn">点击上传/修改</a-button>
                </a-upload>
              </div>
            </a-form>
          </a-col>
          <a-col :span="6" flex="space-between">
            <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 2vh;">
              <a-tooltip title="重置密码">
                <a-button type="primary" shape="circle" :icon="h(UndoOutlined)" @click="handleResetPassword" />
              </a-tooltip>
              <a-popconfirm title="你确定要删除这个用户吗?" ok-text="是" cancel-text="否" @confirm="handleDelete" placement="bottom">
                <a-button danger class="delete-btn"> </a-button>
              </a-popconfirm>
            </div>
            <el-button type="success" class="confirm-btn" @click="handleSubmit" :loading="submitting">
              确认修改
            </el-button>
          </a-col>

          <!-- 右侧账号信息 -->
          <!-- <a-col :span="6"> -->
          <!-- <div class="section-title">账号信息</div>
            <div class="account-info">
              <a-input v-model:value="doctorAccount" class="info-item" disabled>
                <template #prefix>
                  <span class="icon_user"></span>
                </template>
</a-input>
<a-input type="password" class="info-item" placeholder="********" disabled>
  <template #prefix>
                  <span class="icon_password"></span>
                </template>
</a-input>
<a-input type="password" class="info-item" placeholder="********" disabled>
  <template #prefix>
                  <span class="icon_password"></span>
                </template>
</a-input>
</div> -->

          <!-- </a-col> -->
          <!-- 底部按钮 -->

        </a-row>

      </div>
    </div>
    <contextHolder />
  </div>
</template>

<script setup>
import { ref, computed, watch, reactive, h } from 'vue';
import { userUserStore } from '../stores/UserStore';
import { storeToRefs } from 'pinia';
import * as userAPI from '../api/user.js';
import { message, Modal } from 'ant-design-vue';
import { UndoOutlined } from '@ant-design/icons-vue';
const [modal, contextHolder] = Modal.useModal();

// 获取用户存储
const UserStore = userUserStore();
const { curUserInfo, isChange } = storeToRefs(UserStore);

// 表单状态
const formRef = ref();
const doctorId = ref(null);
const roleName = ref(null);
const doctorAccount = ref(null);
const signImg = ref(null);
const isUpload = ref("未上传");
const fileList = ref([]);
const submitting = ref(false);

// 表单校验规则
const rules = {
  doctorName: [{ required: true, message: '姓名不能为空!', trigger: 'blur' }],
  department: [{ required: false, message: '科室不能为空!', trigger: 'blur' }],
  hospital: [{ required: true, message: '医院不能为空!', trigger: 'blur' }],
  gender: [{ required: true, message: '性别不能为空!', trigger: 'blur' }],
};

// 表单数据
const formState = reactive({
  doctorName: "",
  department: "病理科",
  hospital: "XX医院",
  gender: "男"
});

// 计算属性
const displayDoctorName = computed(() => formState.doctorName || '新增');

const getAvatarClass = computed(() => ({
  'male-img': formState.gender === '男',
  'female-img': formState.gender === '女'
}));

// 选项数据
const departmentOptions = [
  { value: '病理科', label: '病理科' },
  { value: '呼吸内科', label: '呼吸内科' },
  { value: '外科', label: '外科' },
];

const genderOptions = [
  { value: '男', label: '男' },
  { value: '女', label: '女' },
];

// 监听用户信息变化
watch(curUserInfo, (newValue) => {
  if (newValue === 'new') {
    resetForm();
  } else if (newValue) {
    loadUserData(newValue);
  }
});

// 方法
function resetForm() {
  roleName.value = null;
  doctorId.value = null;
  doctorAccount.value = null;
  isUpload.value = '未上传';
  signImg.value = null;

  Object.keys(formState).forEach(key => {
    if (key === 'department') {
      formState[key] = '病理科';
    } else if (key === 'gender') {
      formState[key] = '男';
    } else {
      formState[key] = "";
    }
  });

  fileList.value = [];
}

function loadUserData(userData) {
  roleName.value = userData.roleName;
  doctorId.value = userData.id;
  doctorAccount.value = userData.account;
  isUpload.value = userData.electronicSignaturePath ? '已上传' : '未上传';
  signImg.value = userData.electronicSignaturePath;

  formState.doctorName = userData.name;
  formState.department = userData.department;
  formState.hospital = userData.hospital;
  formState.gender = userData.gender;
}

async function handleSubmit() {
  try {
    await formRef.value.validate();
    submitting.value = true;

    const formData = new FormData();

    if (doctorId.value) {
      // 更新现有用户
      formData.append('id', doctorId.value);
    }

    // 添加共同字段
    formData.append('realname', formState.doctorName);
    formData.append('department', formState.department);
    formData.append('hospital', formState.hospital);
    formData.append('gender', formState.gender);

    // 添加签名文件（如果有）
    if (fileList.value.length) {
      formData.append('multipartFile', fileList.value[0].originFileObj);
    }

    // 根据是新增还是修改调用不同的API
    const response = await (doctorId.value
      ? userAPI.updateUserInfo(formData)
      : userAPI.insertUser(formData));

    if (response.code === 200) {
      isChange.value = true;
      message.success(response.msg);
    } else {
      message.error(response.msg || '操作失败');
    }
  } catch (error) {
    // console.error('表单提交错误:', error);
    message.error('提交失败，请检查表单');
  } finally {
    submitting.value = false;
  }
}

function handleAvatarChange(info) {
  fileList.value = fileList.value.slice(-1); // 只保留最新上传的一个文件

  if (fileList.value.length === 0) return;

  const file = fileList.value[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    signImg.value = e.target.result;
    isUpload.value = '已上传';
  };

  reader.readAsDataURL(file.originFileObj);
}

function beforeUpload(file) {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isJpgOrPng) {
    message.error('只能上传 JPG/PNG 格式的图片!');
  }

  if (!isLt2M) {
    message.error('图片必须小于 2MB!');
  }

  return false; // 阻止自动上传
}

async function handleDelete() {
  if (!doctorId.value) return;

  try {
    const response = await userAPI.deleteUser(doctorId.value);

    if (response.code === 200) {
      isChange.value = true;
      curUserInfo.value = null;
      message.success(response.msg);
    } else {
      message.error(response.msg || '删除失败');
    }
  } catch (error) {
    console.error('删除用户错误:', error);
    message.error('删除失败，请稍后重试');
  }
}

function handleResetPassword() {
  modal.confirm({
    title: '重置密码',
    centered: true,
    content: '你确定要重置这个用户的密码吗？',
    onOk() {
      userAPI.resetPassword(doctorId.value).then(response => {
        if (response.code === 200) {
          message.success(response.msg);
        } else {
          message.error(response.msg || '重置密码失败');
        }
      }).catch(error => {
        message.error('重置密码失败，请稍后重试');
      });
    },
    onCancel() {
      console.log('取消重置密码');
    }
  });
}

</script>

<style scoped>
.card {
  height: 40vh;
  background: #FFFFFF;
  box-shadow: 5px 15px 25px 0px rgba(36, 43, 160, 0.05);
  border-radius: 25px;
  margin: 0;
  padding: 1vw;
}

.main {
  width: 100%;
  padding: 20px;
}

.image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  flex-direction: column;
}

.initial-image {
  max-width: 80%;
  max-height: 80%;
  cursor: pointer;
  margin-bottom: 4vh;
  transition: transform 0.3s ease;
}

.initial-image:hover {
  transform: scale(1.05);
}

.clickword {
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: 400;
  font-size: 1vh;
  color: #666666;
  line-height: 1.5vh;
  text-align: center;
  font-style: normal;
  text-transform: none;
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
  margin-left: 30px;
}

.avatar2 {
  width: 95px;
  height: 95px;
  background: #F6F6F6;
  box-shadow: 3px 3px 25px 0px rgba(36, 43, 160, 0.1);
  border-radius: 50px;
  z-index: 2;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  transition: transform 0.3s ease;
}

.avatar2:hover {
  transform: scale(1.05);
  box-shadow: 3px 3px 30px 0px rgba(36, 43, 160, 0.2);
}

.male-img {
  background-image: url('../assets/avatar/Group2426.png');
}

.female-img {
  background-image: url('../assets/avatar/Group2425.png');
}

.doc-name {
  max-width: 8vw;
  /* height: 2vh; */
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: bold;
  font-size: 2vh;
  color: #333333;
  line-height: 2vh;
  text-align: center;
  font-style: normal;
  text-transform: none;
  /* margin-top: 15px;
  margin-bottom: 5px; */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-title {
  width: 10vw;
  height: 1vh;
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: 400;
  font-size: 1.5vh;
  color: #666666;
  /* line-height: 2vh; */
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
  transition: all 0.3s ease;
}

.input:hover,
.input:focus {
  border-color: #242BA0;
  box-shadow: 0 0 0 2px rgba(36, 43, 160, 0.1);
}

:deep(.select .ant-select-selector) {
  width: 100%;
  height: 4vh;
  background: #F6F7FF;
  border-radius: 2vh;
  border-color: #FFFFFF;
  font-weight: 2vh;
  text-align: left;
  padding-left: 1vw;
  display: flex;
  align-items: center;
  color: #666666;
  transition: all 0.3s ease;
}

:deep(.select .ant-select-selector:hover) {
  border-color: #242BA0;
}

.upload {
  display: flex;
  /* width: 28.5vw; */
  height: 4vh;
  background: #F6F7FF;
  border-radius: 41px;
  text-align: center;
  padding-left: 0.5vw;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
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
  transition: all 0.3s ease;
}

.btn:hover {
  background: #343FD1;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(36, 43, 160, 0.2);
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

.bottom {
  justify-content: center;
  display: flex;
  align-items: center;
  margin-top: 30px;
}

.confirm-btn {
  background-color: #48bb78;
  border-radius: 50px;
  width: 135px;
  height: 36px;
  transition: all 0.3s ease;
}

.confirm-btn:hover {
  background-color: #38a169;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(72, 187, 120, 0.2);
}

.delete-btn {
  border-radius: 50%;
  margin-left: 20px;
  width: 37px;
  height: 37px;
  background-image: url('../assets/normalsetting/icon／删除.png');
  transition: all 0.3s ease;
}

.delete-btn:hover {
  transform: rotate(15deg);
  box-shadow: 0 2px 8px rgba(245, 101, 101, 0.2);
}
</style>