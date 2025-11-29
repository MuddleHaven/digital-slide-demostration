<template>
  <div>
    <!-- 上部面板 -->
    <a-card class="right-up-card cardcommon">
      <div class="l-c-text">处理面板</div>
      <el-scrollbar height="53vh">
        <a-row class="row-css" v-for="(condition, index) in conditions" :key="index">
          <!-- condition.key == ac condition.AiAnalyze == 5 显示AI的标识 -->
          <a-col :span="8" class="choice_text" :class="{ 'disabled': condition.disabled }" v-if="condition.key == 'ac'">
            <a-badge :offset="[10, 0]">
              <span  class="choice_text">{{ condition.text }}</span>
              <template #count>
                <div class="Aistyle" v-if="condition.AiAnalyze == 5">AI</div>
                <div v-else></div>
              </template>
            </a-badge>
          </a-col>
          <!-- condition.key == ac condition.AiAnalyze != 5 不显示AI的标识 -->
          <a-col :span="8" class="choice_text" :class="{ 'disabled': condition.disabled }" v-else>
            {{ condition.text }}
            <span v-if="condition.AiAnalyze == 5" class="ai-label">AI</span>
          </a-col>
          <a-col :span="16">
            <!-- SingleRadio 为有AI标签的checkout -->
            <component :is="condition.componentType === 'SingleRadio' ? SingleRadio : CheckBox"
              :options="getOptions(condition.options)" :disabled="condition.disabled"
              v-model="localConditions[index].value" :AiAnalyze="condition.AiAnalyze" />
          </a-col>
        </a-row>
      </el-scrollbar>
      <div class="control-circle2" @click="onToggleCollapse">
        <img src="../../assets/icon/Group 2508.png" alt="">
      </div>
    </a-card>

    <!-- 下部面板 -->
    <a-card class="right-down-card cardcommon">
      <div class="l-c-text">辅助建议</div>
      <div class="res-card">
        <el-scrollbar height="15vh">
          <a-textarea v-model:value="adviceValue" placeholder="请填写辅助建议" auto-size class="res-text textarea-text" />
        </el-scrollbar>
      </div>
      <div style="width: 100%; display: flex;justify-content: space-around;">
        <a-button class="btn" @click="onSaveAndView">
          <p>保存并浏览</p>
        </a-button>
        <a-button class="btn" style="background: #FBFBFF;border: none;">
          <p style="color: #666666;" @click="onNextSlice">下一例</p>
        </a-button>
      </div>
      <div class="control-circle2" @click="onToggleCollapse">
        <img src="../../assets/icon/Group 2508.png" alt="">
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { computed, ref, inject, watch, onMounted } from 'vue';
import SingleRadio from '../../components/SingleRadio.vue';
import CheckBox from '../../components/CheckBox.vue';
import { getCheckoutOptionsArray } from '../../utils/options.js';

// 定义组件接收的属性
const props = defineProps({
  conditions: {
    type: Array,
    required: true
  },
  advice: {
    type: String,
    required: true
  }
});

// 注入当前切片部位
const currentSlicePart = inject('currentSlicePart', null);

// 创建本地副本并监听变化
const localConditions = ref([...props.conditions]);

// 本地缓存，避免重复计算
const optionsCache = ref({});

// 添加一个方法，用于获取特定部位的选项，带缓存功能
const getOptions = (optionsKey) => {
  const part = currentSlicePart.value;
  const cacheKey = `${optionsKey}_${part}`;

  // 检查缓存
  if (optionsCache.value[cacheKey]) {
    return optionsCache.value[cacheKey];
  }

  // 不在缓存中，获取新选项
  const options = getCheckoutOptionsArray(optionsKey, part);
  optionsCache.value[cacheKey] = options;
  return options;
};

// 监听 props.conditions 变化，更新本地副本
watch(() => props.conditions, (newConditions) => {
  console.log('Conditions changed in ResultPanel:', newConditions.length);
  // 清空本地副本并添加新项
  localConditions.value = [...newConditions];
}, { deep: true });

// 监听切片部位变化
watch(() => currentSlicePart.value, (newPart) => {
  console.log('SlicePart changed in ResultPanel:', newPart);
  // 当部位变化时，清除缓存
  optionsCache.value = {};

  console.log("local:", localConditions.value);

  // 强制组件重新渲染
  localConditions.value = [...localConditions.value];
}, { immediate: true });

// 在组件挂载时确保选项正确加载
onMounted(() => {
  // 确保所有选项都预加载
  if (props.conditions) {
    props.conditions.forEach(condition => {
      if (condition.options) {
        getOptions(condition.options);
      }
    });
  }
});

// 定义组件可触发的事件
const emit = defineEmits(['update:advice', 'save-and-view', 'next-slice', 'toggle-collapse']);

// 计算属性，用于双向绑定建议内容
const adviceValue = computed({
  get: () => props.advice,
  set: (val) => emit('update:advice', val)
});

// 当点击"保存并浏览"按钮时
const onSaveAndView = () => {
  emit('save-and-view');
};

// 当点击"下一例"按钮时
const onNextSlice = () => {
  emit('next-slice');
};

// 当折叠/展开右侧面板时
const onToggleCollapse = () => {
  emit('toggle-collapse');
};

</script>

<style src="../../assets/styles/sliceDetail.scss" lang="scss" scoped></style>
