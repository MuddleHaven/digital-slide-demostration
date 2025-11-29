import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

/**
 * 布局状态管理
 */
export const useLayoutStore = defineStore('layout', () => {
  // 路由
  const route = useRoute();
  
  // 布局配置常量
  const LAYOUT_SPANS = {
    // 侧边栏宽度
    SIDEBAR: 5,      
    // 全宽度
    FULL_WIDTH: 24,  
    // 中间区域宽度(当有一个侧边栏时)
    CENTER_WITH_ONE_SIDEBAR: 19,
    CENTER_WITH_TWO_SIDEBAR: 14,
  };
  
  // 状态定义
  const menu = ref(1);
  const isLeftCard = ref(true);
  const isRightCard = ref(true);
  const AIDetect = ref(false);
  
  // 计算属性
  const isfull = computed(() => route.path === '/fullScreen');
  
  /**
   * 计算左侧区域宽度
   * @returns {number} 左侧区域宽度
   */
  function getLeftSpan() {
    if (isLeftCard.value && !isfull.value) return LAYOUT_SPANS.SIDEBAR
    return 0
  }
  
  /**
   * 计算中间区域宽度
   * @returns {number} 中间区域宽度
   */
  function getCenterSpan() {
    if (isfull.value || (!isLeftCard.value && !isRightCard.value)) return LAYOUT_SPANS.FULL_WIDTH
    else if (!isLeftCard.value || !isRightCard.value) return LAYOUT_SPANS.CENTER_WITH_ONE_SIDEBAR
    return LAYOUT_SPANS.CENTER_WITH_TWO_SIDEBAR
  }
  
  /**
   * 计算右侧区域宽度
   * @returns {number} 右侧区域宽度
   */
  function getRightSpan() {
    if (!isfull.value && isRightCard.value) return LAYOUT_SPANS.SIDEBAR
    return 0
  }
  
  /**
   * 更新菜单状态
   * @param {number} v - 新的菜单状态值
   */
  function changeMenu(v) {
    menu.value = v;
  }
  
  /**
   * 更新左侧边栏显示状态
   * @param {boolean} v - 是否显示左侧边栏
   */
  function changeLeftCard(v) {
    isLeftCard.value = v;
  }
  
  /**
   * 更新右侧边栏显示状态
   * @param {boolean} v - 是否显示右侧边栏
   */
  function changeRightCard(v) {
    isRightCard.value = v;
  }
  
  /**
   * 切换AI检测状态
   */
  function toggleAIDetection() {
    AIDetect.value = !AIDetect.value;
  }
  
  return {
    menu,
    isLeftCard,
    isRightCard,
    isfull,
    AIDetect,
    
    // Computed spans
    getLeftSpan,
    getCenterSpan,
    getRightSpan,
    
    // Actions
    changeMenu,
    changeLeftCard,
    changeRightCard,
    toggleAIDetection,
  };
}, {
  persist: true
});
