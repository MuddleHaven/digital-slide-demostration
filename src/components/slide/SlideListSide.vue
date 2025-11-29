<template>
  <div class="list-container">
    <div class="title">
      <span class="l-c-text">切片列表</span>
      <a-select v-model:value="pannelValue" :options="options" class="status_select" style="width: 7vw;"
        @change="onPannelChange" />
    </div>
    <div class="list-scroll-container">
      <div v-for="(data, index) in slices" :key="data.id" class="list_column"
        :class="{ 'shadowCard': activeIndex === index }" @click="onSliceSelect(index)">
        <div class="list_img">
          <img :src="data.img" alt="" @error="handleImageError" />
        </div>
        <div style="margin-left: 10px;">
          <div class="number_c">{{ data.no }}</div>
          <div class="symptom_c">{{ data.diseaseName || data.disease }}</div>
          <div class="tag_list">
             <a-tag v-if="data.status === 1" color="orange">上传中</a-tag>
             <a-tag v-else-if="data.status === 3" color="blue">解析中</a-tag>
             <a-tag v-else-if="data.status === 6" color="green">已完成</a-tag>
          </div>
          <div>
            <span class="time_c">{{ data.processTime || data.uploadTime }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="control-circle" @click="onToggleCollapse">
      <!-- Simple arrows using characters if icons missing, or adjust path -->
      <span v-if="!collapsed">&lt;</span>
      <span v-else>&gt;</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  slices: {
    type: Array,
    required: true
  },
  activeIndex: {
    type: Number,
    required: true
  },
  pannel: {
    type: String,
    required: true
  },
  options: {
    type: Array,
    required: true
  },
  collapsed: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update-pannel', 'select-slice', 'toggle-collapse']);

const pannelValue = computed({
  get: () => props.pannel,
  set: (val) => emit('update-pannel', val)
});

const onPannelChange = (value) => {
  emit('update-pannel', value);
};

const onSliceSelect = (index) => {
  emit('select-slice', index);
};

const onToggleCollapse = () => {
  emit('toggle-collapse');
};

const handleImageError = (e) => {
  e.target.src = '/src/assets/nullImage.jpg';
};
</script>

<style scoped>
.list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  position: relative;
}

.title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.list-scroll-container {
  flex: 1;
  overflow-y: auto;
}

.list_column {
  display: flex;
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.list_column:hover {
  background-color: #f5f7fa;
}

.shadowCard {
  background-color: #e6f7ff;
  border-right: 3px solid #1890ff;
}

.list_img img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.number_c {
  font-weight: bold;
  font-size: 14px;
}

.symptom_c {
  font-size: 12px;
  color: #666;
  margin: 2px 0;
}

.time_c {
  font-size: 12px;
  color: #999;
}

.control-circle {
  position: absolute;
  right: -15px;
  top: 50%;
  width: 30px;
  height: 30px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
}
</style>
