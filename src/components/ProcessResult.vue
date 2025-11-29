<!-- slice process result -->
<template>
  <div class="content">
    <!-- AI分析结果 -->
    <div class="span-text total-result margin-bottom-4"><span>AI分析结果</span></div>
    <a-row>
      <a-col :span="12" v-for="(item, index) in currentConditionKeys" :key="item.key"
        v-show="index == 0">
        <span class="span-text">{{ `${item.text}:` }}</span>
        <span class="span-value">{{ getCheckoutOptionLabel(item.options, aiResult[item.key] ||
          item.defaultValue, currentSlicePart) }}</span>
      </a-col>
    </a-row>
    <a-row>
      <a-col :span="12" class="other" v-for="(item, index) in currentConditionKeys" :key="item.key"
        v-show="index > 0 && aiResult[item.key] > 0">
        <!-- 判断条件：是胃部且是神经内分泌肿瘤(nens) -->
        <div v-if="item.key === 'nens' && aiResult[item.key] > 0">
          <span class="span-text">{{ `${item.text}:` }}</span>
          <span class="span-value">{{ `阳性 (${getCheckoutOptionLabel(item.options, aiResult[item.key] ||
            item.defaultValue, currentSlicePart)}) 阶段` }}</span>
        </div>
        <div v-else-if="item.key === 'ac' && aiResult[item.key] == 5">
          <span class="span-text">{{ '恶性肿瘤' }}</span>
          <span class="span-value">腺癌</span>
        </div>
        <div v-else>
          <span class="span-text">{{ `${item.text}:` }}</span>
          <span class="span-value">{{ getCheckoutOptionLabel(item.options, aiResult[item.key] || item.defaultValue, currentSlicePart)
          }}</span>
        </div>
      </a-col>
    </a-row>
    <div class="other" v-show="aiResult.recommendation">
      <span class="span-text">辅助建议:</span>
      <span class="span-value">{{ aiResult.recommendation || '无' }}</span>
    </div>
  </div>
  
  <!-- 医生复核结果部分，使用相同的逻辑 -->
  <div v-if="result != null" class="content">
    <div class="span-text total-result margin-bottom-4" style="margin-top: 16px;"><span>医生复核结果</span></div>
    <a-row>
      <a-col :span="12" v-for="(item, index) in currentConditionKeys" :key="item.key"
        v-show="index == 0">
        <span class="span-text">{{ `${item.text}:` }}</span>
        <span class="span-value">{{ getCheckoutOptionLabel(item.options, result[item.key] || item.defaultValue, currentSlicePart)
        }}</span>
      </a-col>
    </a-row>
    <a-row>
      <a-col :span="12" class="other" v-for="(item, index) in currentConditionKeys" :key="item.key"
        v-show="index > 0 && result[item.key] > 0">
        <!-- 同样修改判断条件 -->
        <div v-if="item.key === 'nens' && result[item.key] > 0">
          <span class="span-text">{{ `${item.text}:` }}</span>
          <span class="span-value">{{ `阳性 (${getCheckoutOptionLabel(item.options, result[item.key] ||
            item.defaultValue, currentSlicePart)}) 阶段` }}</span>
        </div>
        <div v-else>
          <span class="span-text">{{ `${item.text}:` }}</span>
          <span class="span-value">{{ getCheckoutOptionLabel(item.options, result[item.key] || item.defaultValue, currentSlicePart)
            }}</span>
        </div>
      </a-col>
    </a-row>
    <div class="other" v-show="result != null && result.recommendation != null">
      <span class="span-text">辅助建议:</span>
      <span class="span-value">{{ result.recommendation || '无' }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { getCheckoutOptionLabel, SlicePart } from '@/common/options';
import { colonConditionKeys } from '@/common/options-colon'
import { lungConditionKeys } from '@/common/options-lung'
import { stomachConditionKeys } from '@/common/options-stomach'


// props result, aiResult, collectionArea
const props = defineProps({
  result: {
    type: Object,
    default: () => null
  },
  aiResult: {
    type: Object,
    required: true
  },
  collectionArea: {
    type: String,
    default: '胃'
  }
});

const result = ref(props.result);
const aiResult = ref(props.aiResult);

// 根据 collectionArea 确定当前切片部位
const currentSlicePart = computed(() => {
  const area = String(props.collectionArea).toLowerCase();
  // console.log("当前切片部位:", area);
  
  if (area.includes('lung') || area.includes('肺')) {
    return SlicePart.lung;
  } else if (area.includes('colon') || area.includes('肠')) {
    return SlicePart.colon;
  } 
  // 默认为胃部
  return SlicePart.stomach;
});

// 根据当前部位获取对应的条件键
const currentConditionKeys = computed(() => {
  // 从各部位条件键映射中获取
  const part = currentSlicePart.value;
  if (part === SlicePart.lung) {
    return lungConditionKeys;
  } else if (part === SlicePart.colon) {
    return colonConditionKeys;
  } else if (part === SlicePart.stomach) {
    return stomachConditionKeys;
  }
  return stomachConditionKeys;
});

// 监听 props 变化更新本地数据
watch(() => props.result, (newVal) => {
  result.value = newVal;
});

watch(() => props.aiResult, (newVal) => {
  aiResult.value = newVal;
});

// 调试输出
// console.log("切片部位:", props.collectionArea);
// console.log("当前使用的部位类型:", currentSlicePart.value);
// console.log("当前使用的条件键:", currentConditionKeys.value);
</script>

<style scoped>
.content {
  margin-top: 10px;
  overflow: auto;
}

.other {
  margin-top: 15px;
}

.span-text {
  font-family: Source Han Sans SC;
  font-size: 14px;
  font-weight: bold;
  color: #666666;
  font-style: normal;
  text-transform: none;
  margin-right: 4px;
}

.span-value {
  font-family: Source Han Sans SC;
  font-size: 14px;
  font-weight: normal;
  color: #666666;
  font-style: normal;
  text-transform: none;
}

.total-result {
  /* font size + 4 */
  font-size: 18px;
  font-weight: bold;
}

.margin-bottom-4 {
  margin-bottom: 8px;
}
</style>
