<template>
  <Modal v-model:open="open" centered title="上传个人签名" @ok="handleOk" @cancel="handleCancel">
    <p>请上传您的个人签名以继续操作。</p>
    <Upload name="avatar" listType="picture-card" maxCount="1" :beforeUpload="beforeUpload" :showUploadList="false">
      <a-avatar v-if="imageUrl" :src="imageUrl" :size="64" shape="square" />
      <div v-else>
        <loading-outlined v-if="loading"></loading-outlined>
        <plus-outlined v-else></plus-outlined>
        <div class="ant-upload-text">上传签名</div>
      </div>
    </Upload>
  </Modal>
</template>

<script>
export default {
  name: 'SignatureDialog',
  // 其他组件选项
};
</script>

<script setup>
import { reactive, ref, watch } from 'vue';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons-vue';
import { Modal, Upload, Avatar, message } from 'ant-design-vue';
import * as userAPI from '../../api/user.js'
import eventBus from '../../utils/eventBus.js';

const props = defineProps({
  title: {
    type: String,
    default: '上传个人签名'
  },
  visible: {
    type: Boolean,
    default: false
  },
  handleClick: {
    type: Function,
    default: () => { }
  }
});

const open = ref(props.visible);

watch(() => props.visible, (newVal) => {
  open.value = newVal;
});

const handleOk = () => {
  if (file.value) {
    customRequest({
      file: file.value, onSuccess: () => {
        open.value = false;
        props.handleClick(false);
        // 发布签名更新事件，通知其他组件刷新签名
        eventBus.emit('signature-updated');
      }, onError: () => {
        message.error('上传失败');
      }
    });
  }

};

const handleCancel = () => {
  open.value = false;
  props.handleClick(true);
};

const loading = ref(false);
const imageUrl = ref('');
const file = ref(null);

const customRequest = async (options) => {
  const { file: selectedFile, onSuccess, onError } = options;

  const userRes = await userAPI.getUserInfo();
  const userData = userRes.data.user;
  const formData = new FormData();

  /**
   {
    "code": 200,
    "msg": "获取成功",
    "data": {
        "user": {
            "id": 6,
            "username": "admin",
            "password": "$2a$10$vAmsGwu3TFamz6sSaeAF.eP37qk6GV/rrZ8y.zPLWdxAZnwRNC9TC",
            "realname": "管理员",
            "hospital": "xx医院",
            "department": "病理科",
            "gender": "男",
            "introduction": "老师",
            "avatarPath": "https://pipelinemedical.com/wp-content/uploads/2018/03/doctor-icon.png",
            "electronicSignaturePath": null,
            "roleId": 1
        },
        "roleName": "主任"
    }
    }
   */

  formData.append('id', userData.id); // 医生姓名
  formData.append('realname', userData.realname); // 医生姓名
  formData.append('department', userData.department); // 科室
  formData.append('hospital', userData.hospital); // 医院
  formData.append('gender', userData.gender); // 性别
  // formData.append('username', userData.username); // 账号
  // formData.append('password', userData.password); // 密码

  if (selectedFile) {
    formData.append("multipartFile", selectedFile)
  }
  const response = await userAPI.updateUserInfo(formData);
  if (response.code == 200) {
    message.success(response.msg)
    onSuccess();
  } else {
    onError();
  }
};

const beforeUpload = (selectedFile) => {
  console.log(selectedFile);
  loading.value = false
  file.value = selectedFile;
  imageUrl.value = URL.createObjectURL(selectedFile);
  return false; // 阻止自动上传
};

</script>

<style scoped>
.avatar-uploader>.ant-upload {
  width: 128px;
  height: 128px;
}

.ant-upload-select-picture-card i {
  font-size: 32px;
  color: #999;
}

.ant-upload-select-picture-card .ant-upload-text {
  margin-top: 8px;
  color: #666;
}
</style>