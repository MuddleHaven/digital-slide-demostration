<template>
  <div class="director-card">
    <a-row :gutter="20" justify="space-between">
      <el-scrollbar>
        <div class="container" :class="{ 'container-width': !isLeft || isDataBoard }">
          <div 
            v-for="(userInfo, index) in userList" 
            :key="userInfo.id" 
            class="doc"
            @click="setUser(index)"
          >
            <div 
              class="img" 
              :class="{
                'male-img': userInfo.gender === '男', 
                'female-img': userInfo.gender === '女', 
                'check-img': curIndex === index,
                'uncheck-img': curIndex !== index
              }"
            ></div>
            <p class="doc-name">{{ userInfo.name }}</p>
            <span class="doc-title">{{ userInfo.department }} {{ userInfo.status }}</span>
          </div>
        </div>
      </el-scrollbar>

      <div v-if="!isDataBoard" class="add" @click="newDoctor">
        <img src="../assets/normalsetting/icon／新增.png" alt="新增医生" class="image">
        <div class="text">新 增 医 生</div>
      </div>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { userUserStore } from '../stores/UserStore.js';
import * as userAPI from '../api/user.js';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { useLayoutStore } from '../stores/LayoutStore.js';
import { useSettingStore } from '../stores/SettingStore.js';

// Store 初始化
const UserStore = userUserStore();
const LayoutStore = useLayoutStore();
const SettingStore = useSettingStore();
const route = useRoute();
const router = useRouter();

// Store 属性和方法
const { setUserInfo } = UserStore;
const { isChange } = storeToRefs(UserStore);
const { isLeft } = storeToRefs(SettingStore);

// 组件状态
const curIndex = ref(null);
const userList = ref([]);
const loading = ref(false);

const isAddMode = ref(false);

// 计算属性
const isDataBoard = computed(() => {
  return route.path === '/databoard';
});

// 生命周期钩子
onMounted(async () => {
  await loadUserData();
});

// 监听器
watch(isChange, async (newVal) => {
  if (newVal) {
    await loadUserData();
    
    if (curIndex.value !== null && userList.value.length > curIndex.value) {
      setUserInfo(userList.value[curIndex.value]);
    }
    
    isChange.value = false;
  }
});

// 方法
const loadUserData = async () => {
  loading.value = true;
  try {
    if (isDataBoard.value) {
      await getAllUsers();
    } else {
      await initInfo();
    }
  } catch (error) {
    console.error('加载用户数据失败:', error);
    // 这里可以添加错误处理，如显示错误提示
  } finally {
    loading.value = false;
  }
};

const mapUserData = (data) => {
  return data.map((item) => ({
    id: item.user.id,
    roleName: item.roleName,
    name: item.user.realname || '未命名',
    department: item.user.department || '未分配',
    status: item.roleName || '无',
    gender: item.user.gender || '男', // 默认值
    hospital: item.user.hospital,
    account: item.user.username,
    electronicSignaturePath: item.user.electronicSignaturePath
  }));
};

const initInfo = async () => {
  const response = await userAPI.getUsersInfo();
  userList.value = mapUserData(response.data);
};

const getAllUsers = async () => {
  const response = await userAPI.getAllUsersInfo();
  userList.value = mapUserData(response.data);
};

const setUser = (index) => {
  // 如果点击已选中的用户，则取消选择
  curIndex.value = curIndex.value === index ? null : index;
  
  if (curIndex.value !== null) {
    setUserInfo(userList.value[index]);
  } else {
    setUserInfo(null);
  }
};

const newDoctor = () => {
  if (isDataBoard.value) {
    LayoutStore.changeMenu(3);
    router.push("/directset");
  } else {
    // setTempUserInfo('new');
    setUserInfo('new')
    // isAddMode.value = true;
    // setUserInfo(null);
  }
};
</script>

<style scoped lang="scss">
.director-card {
  // height: 18vh;
  background: #FFFFFF;
  box-shadow: 5px 15px 25px 0px rgba(36, 43, 160, 0.05);
  border-radius: 25px;
  margin: 0;
  padding: 0.5vw;
}

.container {
  display: flex;
  max-width: 54vw;
  flex-wrap: nowrap;
  
  &-width {
    max-width: 85vw;
  }
}

.doc {
  margin-left: 2vw;
  margin-top: 0.5vh;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  
  &:hover .img {
    transform: translateY(-3px);
    box-shadow: 3px 3px 20px 0px rgba(36, 43, 160, 0.2);
  }
}

.doc-name {
  width: 7vw;
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: bold;
  font-size: 1.5vh;
  color: #333333;
  line-height: 1.5vh;
  text-align: center;
  font-style: normal;
  text-transform: none;
  margin-top: 8px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-title {
  // width: 7vw;
  // min-height: 1vh;
  margin-top: 4px;
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: 400;
  font-size: 0.5vw;
  color: #666666;
  // line-height: 1px;
  text-align: center;
  font-style: normal;
  text-transform: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.img {
  width: 90px;
  height: 90px;
  background: #F6F6F6;
  box-shadow: 2px 2px 18px 0px rgba(36, 43, 160, 0.1);
  border-radius: 45px;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  box-sizing: border-box;
  margin-right: 1vw;
  margin-left: 1vw;
  transition: all 0.3s ease-in-out;
}

.check-img {
  border: 3px solid #242BA0;
}

.male-img {
  background-image: url('../assets/avatar/Group2426.png');
}

.female-img {
  background-image: url('../assets/avatar/Group2425.png');
}

.add {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  justify-content: space-evenly;
  width: 4vw;
  height: 15vh;
  background: #F1F1FF;
  border-radius: 25px;
  margin-left: 4vw;
  margin-right: 1vw;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #E5E5FF;
  }
  
  .image {
    transition: transform 0.2s;
  }
  
  &:hover .image {
    transform: scale(1.1);
  }
}

.text {
  writing-mode: vertical-rl;
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: 400;
  font-size: 14px;
  color: #242BA0;
  line-height: 1vh;
  text-align: center;
  font-style: normal;
  text-transform: none;
}
</style>