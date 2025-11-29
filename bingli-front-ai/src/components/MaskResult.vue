<template>
  <div class="overlay" v-if="isVisible">
    <a-tooltip>
      <template #title>保存为pdf</template>
      <img src="../assets/normalsetting/Group 2350.png" alt="" class="img1" @click="changeVis(false)">
    </a-tooltip>
    <div class="card">
      <div class="title">病理图像处理结果</div>
      <a-row>
        <a-col :span="7" style="margin-top: 15px;">
          <span class="key">医院：</span>
          <span class="value">{{ hospital }}</span>
        </a-col>
      </a-row>
      <a-row class="data">
        <a-col :span="7">
          <span class="key">病理号：</span>
          <span class="value">{{ sliceList[curIndex].no }}</span>
        </a-col>
        <a-col :span="9">
          <span class="key">切片上传时间：</span>
          <span class="value">{{ sliceList[curIndex].uploadTime }}</span>
        </a-col>
        <a-col :span="8">
          <span class="key">切片处理时间：</span>
          <span class="value">{{ sliceList[curIndex].processTime }}</span>
        </a-col>
      </a-row>
      <a-row>
        <a-col :span="7" style="margin-top: 10px;">
          <span class="key">图像处理结果：</span>
        </a-col>
      </a-row>
      <div class="content">
        <el-scrollbar height="186px" style="margin-top: 10px;">
          <!-- 整体结果 -->
          <div v-if="simplifiedIllCondition[0].value != null && simplifiedIllCondition[0].value.length > 0" class="value other">{{ simplifiedIllCondition[0].text + ':' + (simplifiedIllCondition[0].value || '无') }}</div>
          <!-- 其他结果 -->
          <a-row>
            <a-col :span="8" class="value other" v-for="(item, index) in simplifiedIllCondition" :key="index"
              v-show="index != 0 && item.value > 0">
              <span v-if="item.key === 'nens' && item.value > 0">{{ item.text + ':阳性' + '(' +
                getCheckoutOptionLabel(item.options, item.value, OptionsStore.getSlicePart()) + '阶段)'}}</span>
              <span v-else>{{ item.text + ':' + getCheckoutOptionLabel(item.options, item.value, OptionsStore.getSlicePart()) }}</span>
            </a-col>
          </a-row>
          <div class="value other" v-if="advice != null && advice.length > 0" >{{ "辅助建议:" + (advice || '无') }}</div>
        </el-scrollbar>
      </div>
      <a-row :gutter="16">
        <div style="width: 100%;display: flex;align-items: center;justify-content: end;">
          <div class="key">医生签名：</div>
          <img style="width: 4vw;height: 3vw;" :src="url" alt="医生签名">
        </div>
      </a-row>
    </div>
    <div class="operation">
      <a-button class="btn" @click="exportPdf" :loading="exportLoading">
        <p>结果下载</p>
      </a-button>
      <a-button class="btn" style="background: #FBFBFF;margin-left: 20px;" @click="saveDataConfirm" :loading="saveLoading">
        <p style="color: #666666;">结果保存</p>
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, createVNode, onBeforeUnmount } from 'vue';
import eventBus from '../utils/eventBus.js'; // Ensure eventBus is correctly imported
import { useOptionsStore } from '../stores/OptionsStore.js';
import { storeToRefs } from 'pinia';
import * as userApi from '../api/user.js'
import { useSliceDataStore } from '../stores/SiceDataStore.js'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { Modal, message } from 'ant-design-vue';
import * as sliceApi from '../api/slice.js'
import { getCheckoutOptionLabel } from '../utils/options.js';

const OptionsStore = useOptionsStore()
const { simplifiedIllCondition, conditionKeys } = OptionsStore
const { advice } = storeToRefs(OptionsStore)

const SliceDataStore = useSliceDataStore()
const { curIndex, DiagnosisId } = storeToRefs(SliceDataStore)
const { getSliceList } = SliceDataStore
const sliceList = getSliceList();

const isVisible = ref(false)
const exportLoading = ref(false)
const saveLoading = ref(false)
const url = ref('')
const department = ref('')
const hospital = ref('')

const changeVis = (v) => {
  isVisible.value = v
}

// console.log("simplifiedIllCondition", simplifiedIllCondition);

// 修改后的 prepareData 函数
const prepareData = () => {
  // 创建基础对象，包含 ID 和切片 ID
  const data = {
    "id": DiagnosisId.value,
    "sliceId": sliceList.value[curIndex.value].id,
    "recommendation": advice.value
  };

  // 遍历条件键，动态构建数据
  conditionKeys.forEach(mapping => {
    // 确保索引有效
    if (mapping.index < simplifiedIllCondition.length) {
      // 处理特殊字段名称（比如 'in' 在代码中是关键字，实际保存为 'inChange'）
      let key = mapping.key;
      
      // 将字段值添加到数据对象中
      data[key] = simplifiedIllCondition[mapping.index].value;
    }
  });
  // console.log("准备保存的数据:", simplifiedIllCondition, conditionKeys);
  // console.log("准备保存的数据:", data);
  return data;
};

const exportPdf = async () => {
  try {
    exportLoading.value = true
    message.info("正在导出为pdf，请稍等...")
    const data = prepareData()
    const res = await sliceApi.exportPDF(data)
    window.open(res.data, '_blank')
  } catch (error) {
    message.error("导出PDF失败：" + (error.message || "未知错误"))
  } finally {
    exportLoading.value = false
  }
}

const saveDataConfirm = () => {
  Modal.confirm({
    title: '提示',
    icon: createVNode(ExclamationCircleOutlined),
    content: '你确认要保存当前结果吗？',
    okText: '确认',
    cancelText: '取消',
    centered: true,
    onOk() {
      saveData()
    },
  });
}

const saveData = async () => {
  try {
    saveLoading.value = true
    message.info("正在保存结果，请稍等...")
    const data = prepareData()
    const res = await sliceApi.updateResult(data)
    if (res.code == 200) {
      message.success("保存成功")
      changeVis(false) // 保存成功后隐藏mask
    } else { 
      message.error(res.message || "保存失败")
    }
  } catch (error) {
    message.error("保存失败：" + (error.message || "未知错误"))
  } finally {
    saveLoading.value = false
  }
}

const getImage = async () => {
  try {
    const res = await userApi.getElecNamePathAndDepartmentAndHospital()
    department.value = res.data.department
    hospital.value = res.data.hospital
    url.value = res.data.path
  } catch (error) {
    message.error("获取医生信息失败")
  }
}

// 声明导出父组件调用的方法
defineExpose({
  changeVis
})

onMounted(() => {
  getImage()
  // 监听签名更新事件
  eventBus.on('signature-updated', refreshSignature);
})

onBeforeUnmount(() => {
  // 组件销毁前移除事件监听，避免内存泄漏
  eventBus.off('signature-updated', refreshSignature);
})

// 添加对签名更新事件的监听
const refreshSignature = () => {
  message.info("正在刷新签名信息...");
  getImage();
}

</script>

<style scoped>
.overlay {
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(4px);
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  border-radius: 25px;
  position: relative;

  .icon1 {
    position: absolute;
    top: 30px;
    right: 60px;
    cursor: pointer;
  }

  .img1 {
    position: absolute;
    top: 30px;
    right: 30px;
    cursor: pointer;
  }

  .card {
    width: 42.5vw;
    height: 26vw;
    background: #FFFFFF;
    box-shadow: 5px 15px 25px 0px rgba(36, 43, 160, 0.05);
    border-radius: 25px 25px 25px 25px;
    box-sizing: border-box;
    padding: 46px 70px 46px 70px;

    .title {
      font-family: Source Han Sans SC, Source Han Sans SC;
      font-weight: 800;
      font-size: 1.4vw;
      color: #333333;
      text-align: center;
      font-style: normal;
      text-transform: none;
    }

    .data {
      width: 100%;
      margin-top: 10px;
    }
  }
}

.key {
  font-family: Source Han Sans SC;
  font-size: 0.7vw;
  font-weight: 600;
  color: #333333;
  font-style: normal;
  text-transform: none;
}

.value {
  font-family: Source Han Sans SC;
  font-size: 0.7vw;
  font-weight: normal;
  color: #666666;
  font-style: normal;
  text-transform: none;
}

.content {
  width: 100%;
  height: 10vw;
  background: #FBFBFF;
  box-shadow: inset 0px 0px 23px 0px rgba(36, 43, 160, 0.05);
  border-radius: 15px 15px 15px 15px;
  margin-top: 35px;
  box-sizing: border-box;
  padding: 0px 30px 0px 40px;
}

.other {
  margin-top: 15px;
}

.btn {
  width: 6.5vw;
  height: 2vw;
  background: #242BA0;
  box-shadow: inset 0px 0px 25px 0px rgba(36, 43, 160, 0.05);
  border-radius: 44px 44px 44px 44px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 12px;
  cursor: pointer;
  border: 1px solid #242BA0;

  p {
    font-family: Source Han Sans SC, Source Han Sans SC;
    font-weight: 400;
    font-size: 0.7vw;
    color: #FFFFFF;
    text-align: left;
    font-style: normal;
    text-transform: none;
  }
}

.operation {
  display: flex;
  margin-top: 10px;
}
</style>