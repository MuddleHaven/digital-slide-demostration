import { defineStore } from 'pinia';
import { ref, computed, reactive, watch } from 'vue';
import { SlicePart } from '../utils/options';
import {
  stomachConditions,
  stomachConditionKeys,
  stomachDiagnosisOptionsMap,
  stomachOptions
} from '../utils/options-stomach';
import {
  lungConditions,
  lungConditionKeys,
  lungDiagnosisOptionsMap,
  lungOptions
} from '../utils/options-lung';
import {
  colonConditions,
  colonConditionKeys,
  colonDiagnosisOptionsMap,
  colonOptions
} from '../utils/options-colon';

/*
{
  "id": 52,
  "sliceId": 85,
  "result": "非肿瘤性",
  "ac": "高",
  "mac": "阴性",
  "nens": "G2",
  "in": "低级别",
  "chronicInflammation": "轻",
  "acuteInflammation": null,
  "atrophy": null,
  "intestinalization": "重",
  "hyperplasia": null,
  "polypus": null,
  "hp": null,
  "srcc": null,
  "recommendation": null,
  "type": "AI"
}
{
  "ac": 0, # 腺癌。 说明一下：0代表没有选，10代表选择第一项，20代表选择第二项，以此类推
  "mac": 10, # 粘液腺癌。
  "srcc": 10,  # 印戒细胞癌。
  "nens": 0, # 神经内分泌肿瘤。
  "inChange": 0, # 上皮内瘤变。
  "chronicInflammation": 0, # 慢性炎。
  "acuteInflammation": 0,  # 急性炎。
  "atrophy": 0, # 萎缩。
  "intestinalization": 0, # 肠化。
  "hyperplasia": 0, # 增生。
  "polypus": 0, # 息肉。
  "hp": 0 # HP。
}
  0 代表第一项 10 代表第二项 20 默认为null
*/

/*
key result, text 整体结果 options [恶性肿瘤, 癌前病变, 癌前状态, 非肿瘤性]
key ac, text 腺癌 options [{label: 低, value: 0}, {label: 中, value: 10}, {label: 高, value: 20}]
key mac, text 粘液腺癌 options [{label: 阴性, value: 0}, {阳性, value: 10}]
key srcc, text 印戒细胞癌 options [{label: 阴性, value: 0}, {阳性, value: 10}]
key nens, text 神经内分泌肿瘤 options [{label: G1, value: 0}, { label: G2, value }, {  label: G3, value: 20}]
key inChange, text 上皮内瘤变 options [{label: 低级别, value: 0}, {label: 高级别, value: 10}]
key chronicInflammation, text 慢性炎 options [{label: 轻, value: 0}, {label: 中, value: 10}, {label: 重, value: 20}]
key acuteInflammation, text 急性炎 options [{label: 轻, value: 0}, {label: 中, value: 10}, {label: 重, value: 20}]
key atrophy, text 萎缩 options [{label: 轻, value: 0}, {label: 中, value: 10}, {label: 重, value: 20}]
key intestinalization, text 肠化 options [{label: 轻, value: 0}, {label: 中, value: 10}, {label: 重, value: 20}]
key hyperplasia, text 增生 options [{label: 轻, value: 0}, {label: 中, value: 10}, {label: 重, value: 20}]
key polypus, text 息肉 options [{label: 炎性, value: 0}, {label: 胃底腺, value: 10}, {label: 增生性, value: 20}, {label: 腺瘤性, value: 30}]
key hp, text HP options [{label: 阴性, value: 0}, {阳性, value: 10}]
*/


/**
 * 选项存储
 * @module stores/OptionsStore
 * @description 该模块用于管理选项的状态和更新逻辑
 */
export const useOptionsStore = defineStore('options', () => {
  // 基本状态定义
  const totalRes = ref(null);
  const advice = ref("");

  const currentSlicePart = ref(SlicePart.stomach);

  // 根据切片部位选择相应的选项和条件
  const getSelectedOptions = (part) => {
    // console.log("获取选项配置 for part:", part);
    if (part == null) {
      // console.error("获取选项配置时，切片部位为 null");
    }
    // 确保 part 是有效的切片部位
    if (!part || !(part in SlicePart)) {
      // console.error("获取选项配置时，切片部位无效:", part);
    }
    // 定义肺部、肠道和胃部的选项和条件
    if (part == SlicePart.stomach) {
      return {
        conditions: stomachConditions,
        options: stomachOptions,
        conditionKeys: stomachConditionKeys,
        diagnosisOptionsMap: stomachDiagnosisOptionsMap
      };
    } else if (part == SlicePart.lung) {
      return {
        conditions: lungConditions,
        options: lungOptions,
        conditionKeys: lungConditionKeys,
        diagnosisOptionsMap: lungDiagnosisOptionsMap
      };
    } else if (part == SlicePart.colon) {
      return {
        conditions: colonConditions,
        options: colonOptions,
        conditionKeys: colonConditionKeys,
        diagnosisOptionsMap: colonDiagnosisOptionsMap
      };
    }

  };

  // 获取当前部位的选项配置
  const selectedOptions = getSelectedOptions(currentSlicePart.value);
  // 初始化条件键和诊断选项映射
  const conditionKeys = reactive(selectedOptions.conditionKeys);
  // 诊断类型允许的选项映射
  const diagnosisOptionsMap = reactive(selectedOptions.diagnosisOptionsMap);

  // 初始化疾病状态条件，使用深拷贝以防止修改原始对象
  const simplifiedIllCondition = reactive(
    JSON.parse(JSON.stringify(selectedOptions.conditions)).map(condition => {
      // 确保第一个元素使用 totalRes 值
      if (condition.key === 'result') {
        condition.value = totalRes.value;
      }
      // 添加AiAnalyze字段
      condition.AiAnalyze = "";
      return condition;
    })
  );

  // 设置切片部位并更新相关配置
  const setSlicePart = (part) => {
    console.log("设置切片部位:", part, currentSlicePart.value);

    // 验证输入
    if (!part || !(part in SlicePart)) {
      console.error("无效的切片部位:", part);
      return;
    }

    try {
      if (part !== currentSlicePart.value) {
        // 更新当前部位
        currentSlicePart.value = part;

        // 获取新选项
        console.log("获取新选项 with part :", part);
        const options = getSelectedOptions(part);
        if (!options || !options.conditions || !options.conditionKeys || !options.diagnosisOptionsMap) {
          console.error("获取选项失败，获取到无效数据:", options);
          return;
        }
        // console.log("获取到新选项:", options);

        // 1. 更新疾病条件
        simplifiedIllCondition.length = 0;
        const newConditions = JSON.parse(JSON.stringify(options.conditions)).map(condition => {
          if (condition.key === 'result') {
            condition.value = totalRes.value;
          }
          condition.AiAnalyze = "";
          return condition;
        });
        newConditions.forEach(item => simplifiedIllCondition.push(item));

        // 2. 更新条件键
        conditionKeys.length = 0;
        options.conditionKeys.forEach(item => conditionKeys.push(item));

        // 3. 更新诊断选项映射
        const existingKeys = Object.keys(diagnosisOptionsMap);
        existingKeys.forEach(key => {
          delete diagnosisOptionsMap[key];
        });

        Object.entries(options.diagnosisOptionsMap).forEach(([key, value]) => {
          diagnosisOptionsMap[key] = value;
        });

        // 4. 重置状态
        clearOptions();

        // 5. 验证更新是否成功
        if (simplifiedIllCondition.length === 0 ||
          conditionKeys.length === 0 ||
          Object.keys(diagnosisOptionsMap).length === 0) {
          // console.error("更新数据失败，至少一个集合为空!");
          // console.error("疾病条件:", simplifiedIllCondition);
          // console.error("条件键:", conditionKeys);
          // console.error("诊断选项映射:", diagnosisOptionsMap);
        } else {
          // console.log("切片部位更新完成:", currentSlicePart.value);
          // console.log("简化的疾病条件:", simplifiedIllCondition.length);
          // console.log("条件键:", conditionKeys.length);
          // console.log("诊断选项映射:", Object.keys(diagnosisOptionsMap).length);
        }
      }
    } catch (error) {
      console.error("设置切片部位时发生错误:", error);
    }
  };

  // 监听总体诊断结果变化以更新可用选项
  watch(totalRes, (newval, oldVal) => {
    // console.log('totalRes:', newval);
    if (newval == null) {
      simplifiedIllCondition.forEach(option => {
        option.disabled = false;
        if (typeof option.value == 'number') {
          option.value = 0;
        }
      });
    } else {
      const allowedOptions = diagnosisOptionsMap[newval];
      // console.log('allowedOptions:', allowedOptions);

      // console.log('totalRes:', newval);
      // 如果是恶性肿瘤或无匹配值，启用所有选项
      if (newval === "恶性肿瘤" || !allowedOptions) {
        simplifiedIllCondition.forEach(option => {
          option.disabled = false;
          // if (typeof option.value == 'number') {
          //   option.value = 0;
          // }
        });
        return;
      }

      // 根据允许的选项设置禁用状态
      simplifiedIllCondition.forEach(option => {
        option.disabled = !allowedOptions.includes(option.text);
        if (option.disabled) {
          if (typeof option.value == 'number') {
            option.value = 0;
          }
        }
      });
    }
  });

  /**
   * 更新选项数据
   * @param {Object} res - 包含诊断结果的响应对象
   */
  const updateOptions = (res) => {
    const data = res.data;
    totalRes.value = data.result;
    advice.value = data.recommendation;

    // 使用映射更新值
    conditionKeys.forEach(({ key, index }) => {
      if (data[key] !== undefined) {
        simplifiedIllCondition[index].value = data[key];
      }
    });
  };

  /**
   * 更新AI分析结果
   * @param {Object} res - 包含AI分析结果的响应对象
   */
  const updateAIOptions = (res) => {
    const data = res.data;
    // console.log("AI分析结果:", data, conditionKeys);
    // 更新整体诊断结果和建议

    // 使用映射更新AI分析结果
    conditionKeys.forEach(({ key, index }) => {
      if (data[key] !== undefined) {
        simplifiedIllCondition[index].AiAnalyze = data[key];
      }
      // console.log(`更新条件 ${key} 的 AI 分析结果:`, simplifiedIllCondition[index].AiAnalyze);
    });
  };

  /**
   * 清除所有选项值
   */
  function clearOptions() {
    totalRes.value = null;
    advice.value = "";

    // 使用映射重置值
    conditionKeys.forEach(({ index, defaultValue }) => {
      simplifiedIllCondition[index].value = defaultValue;
    });
  }

  /**
   * 清除所有AI分析结果
   */
  function clearAIOptions() {
    // 使用映射重置AI分析结果
    conditionKeys.forEach(({ index, defaultValue }) => {
      simplifiedIllCondition[index].AiAnalyze = defaultValue;
    });
  }

  /**
   * 设置整体诊断结果
   * @param {string} v - 诊断结果值
   */
  const setTotalRes = (v) => {
    totalRes.value = v;
  };

  // 获取当前切片部位
  const getSlicePart = () => currentSlicePart.value;

  // 获取当前可用的选项
  const getAvailableOptions = computed(() => {
    return selectedOptions.options;
  });

  return {
    simplifiedIllCondition,
    updateOptions,
    setTotalRes,
    advice,
    updateAIOptions,
    clearAIOptions,
    clearOptions,
    setSlicePart,
    getSlicePart,
    getAvailableOptions,
    conditionKeys,
    diagnosisOptionsMap
  };
});