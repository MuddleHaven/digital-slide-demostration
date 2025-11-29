import { ref, computed } from 'vue';
import { useSliceStore } from '@/stores/slice-store';
import * as sliceAPI from '@/service/slice.js';
import { message } from 'ant-design-vue';

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
  const rightSpan = computed(() => rightCollapsed.value ? 0 : 6);
  const centerSpan = computed(() => 24 - leftSpan.value - rightSpan.value);

  // Initialize list
  const initSlideList = async () => {
    if (!detailIds.value || detailIds.value.length === 0) return;
    
    loading.value = true;
    try {
      // Fetch details for all IDs to populate the list
      // Optimization: Could fetch simplified list if API supports it, but here we might fetch one by one or batch
      // Assuming we have to build the list from the IDs. 
      // If we don't have a batch API, we might just store the IDs and fetch current.
      // However, the sidebar needs to show info. Let's assume we fetch simplified info for all.
      
      // Since we don't have a "getByIds" API shown in previous context, we might iterate.
      // Or better, we just use the IDs and fetch current, and maybe lazily fetch others?
      // For now, let's try to fetch minimal info or just use placeholders if data is missing.
      
      // Actually, let's check if we can get data.
      // Ideally, the previous page passed data, but here we only passed IDs.
      // We need to fetch data for these IDs.
      
      const promises = detailIds.value.map(id => sliceAPI.getSingleSliceData(id));
      const results = await Promise.all(promises);
      
      slideList.value = results.map((res, index) => {
        const data = res.data.slice; // Assuming structure based on getSingleSliceData
        return {
            id: data.id,
            no: `No.${data.sliceNo}`,
            disease: data.diseaseName || 'Unknown', // Field might vary
            img: data.thumbnailPath ? data.thumbnailPath.replace(/\\/g, '/') : '',
            status: data.status,
            processTime: data.processTime,
            uploadTime: data.uploadTime,
            collectionArea: data.collectionArea
        };
      });
      
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
    rightSpan,
    centerSpan,
    
    initSlideList,
    selectSlide,
    nextSlide,
    toggleLeft,
    toggleRight
  };
}
