import { ref, computed } from 'vue';
import { useSliceStore } from '@/stores/slice-store';
import * as sliceAPI from '@/service/slice.js';
import { message } from 'ant-design-vue';
import { getImagePrefix } from '@/utils';

export function useSlideDetail() {
  const sliceStore = useSliceStore();
  const detailIds = computed(() => sliceStore.detailIds);

  const currentIndex = ref(0);
  const slideList = ref([]);
  const currentSlide = ref(null);
  const loading = ref(false);

  // Sidebar state
  const leftCollapsed = ref(false);
  const rightCollapsed = ref(false);

  // Layout computation
  const leftSpan = computed(() => leftCollapsed.value ? 1 : 4);
  // Right panel is removed, so span is always 0 or handled by not rendering it.
  // But for layout calculation, if we want center to take up space:
  const centerSpan = computed(() => 24 - leftSpan.value);

  // Initialize list
  const initSlideList = async () => {
    if (!detailIds.value || detailIds.value.length === 0) return;

    loading.value = true;
    try {
      const promises = detailIds.value.map(id => sliceAPI.getSingleSliceData(id));
      const results = await Promise.all(promises);
      
      // Get stored list data for extra fields (tagArr, etc.)
      const storedListData = sliceStore.slideListData || [];

      slideList.value = results.map((res, index) => {
        const data = res.data.slice; 
        const storedItem = storedListData.find(item => String(item.id) === String(data.id));

        // Merge properties: API data + Stored List Data (for tags/extra info)
        return {
          ...data,
          ...(storedItem || {}), 
          // Re-ensure essential fields
          id: data.id,
          no: `No.${data.sliceNo}`,
          img: data.thumbnailPath ? `${getImagePrefix()}${data.thumbnailPath.replace(/\\/g, '/')}` : '@/assets/icons/nullImage.jpg',
        };
      });
      console.log(slideList.value);
      if (slideList.value.length > 0) {
        selectSlide(0);
      }

    } catch (e) {
      console.error("Failed to init slide list", e);
      message.error("加载切片列表失败");
    } finally {
      loading.value = false;
    }
  };

  const selectSlide = (index) => {
    if (index < 0 || index >= slideList.value.length) return;
    currentIndex.value = index;
    currentSlide.value = slideList.value[index];
  };

  const nextSlide = () => {
    if (currentIndex.value < slideList.value.length - 1) {
      selectSlide(currentIndex.value + 1);
    } else {
      message.warning("已经是最后一例");
    }
  };

  const toggleLeft = () => leftCollapsed.value = !leftCollapsed.value;
  const toggleRight = () => rightCollapsed.value = !rightCollapsed.value;

  return {
    slideList,
    currentIndex,
    currentSlide,
    loading,
    leftCollapsed,
    rightCollapsed,
    leftSpan,
    centerSpan,

    initSlideList,
    selectSlide,
    nextSlide,
    toggleLeft,
    toggleRight
  };
}
