import { ref } from 'vue';
import * as sliceAPI from '@/service/slice.js';
import { message } from 'ant-design-vue';
import { getCheckoutOptionsArray } from '@/common/options.js';

export function useSlideResult() {
  const resultData = ref({
    conditions: [],
    advice: ''
  });
  const resultVisible = ref(false);

  const loadResult = async (sliceId, slicePart) => {
    if (!sliceId) return;
    try {
      const res = await sliceAPI.getResult(sliceId);
      // Initialize conditions based on slicePart
      // We need to map the API result to the conditions structure expected by the UI
      // This mapping logic is similar to SliceDetailList.vue's prepare/init logic
      
      // Simplified for now:
      if (res.data) {
        // Map data to UI structure
        // This requires knowing the 'options' config. 
        // For now, let's load default empty structure and fill it
        const defaults = getInitialConditions(slicePart);
        
        // Merge logic (simplified)
        resultData.value.conditions = defaults; 
        resultData.value.advice = res.data.recommendation || '';
        // Actual merging of values needs specific logic based on options keys
      } else {
        resultData.value.conditions = getInitialConditions(slicePart);
        resultData.value.advice = '';
      }
    } catch (e) {
      console.error("Load result error", e);
    }
  };
  
  const getInitialConditions = (part) => {
     // This should return the array structure like 'simplifiedIllCondition' in reference
     // We might need to export this from options.js or reconstruct it
     return [
         { text: "总体诊断", key: "overall", value: "", options: "OverallOptions", componentType: "SingleRadio" },
         // Add more based on part... this is complex to replicate exactly without full options.js context
         // For now, returning a generic placeholder list
         { text: "Placeholder Condition 1", key: "c1", value: [], options: "YouWuOptions", componentType: "CheckBox" }
     ];
  };

  const saveResult = async (sliceId, data) => {
    try {
      await sliceAPI.updateResult({ ...data, sliceId });
      message.success("保存成功");
      resultVisible.value = false;
    } catch (e) {
      message.error("保存失败");
    }
  };

  return {
    resultData,
    resultVisible,
    loadResult,
    saveResult
  };
}
