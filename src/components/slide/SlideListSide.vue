<template>
  <div class="list-container card-style" :class="{ 'collapsed-container': collapsed }">
    <!-- Header -->
    <div class="title" v-if="!collapsed">
      <span class="l-c-text">切片列表</span>
      <a-select v-model:value="pannelValue" :options="options" class="status_select" style="width: 120px;"
        @change="onPannelChange" size="small" />
    </div>
    <div class="title collapsed-title" v-else>
      <span>列表</span>
    </div>

    <!-- Scrollable List -->
    <div class="list-scroll-container">
      <div v-for="(data, index) in slices" :key="data.id" class="list_column"
        :class="{ 'shadowCard': activeIndex === index, 'collapsed-item': collapsed }" @click="onSliceSelect(index)">
        <!-- Expanded View -->
        <template v-if="!collapsed">
          <div class="list_img">
            <img :src="data.img" alt="" @error="handleImageError" />
          </div>
          <div style="margin-left: 10px; flex: 1; min-width: 0;">
            <div class="info-row">
              <div class="number_c" :title="data.no">{{ data.no }}</div>
            </div>

            <div class="tag_list" v-if="data.tagArr && data.tagArr.length > 0" style="margin-top: 4px;">
              <a-tag v-for="tag_item in data.tagArr" :key="tag_item.label"
                :color="tag_item.style >= 2 ? 'red' : 'green'"
                style="margin-right: 4px; margin-bottom: 4px; font-size: 10px; line-height: 18px;">
                {{ tag_item.label }}
              </a-tag>
            </div>

            <div class="time_c">{{ data.processTime || data.uploadTime }}</div>
          </div>
        </template>
        <!-- Collapsed View -->
        <template v-else>
          <div class="collapsed-content">
            <a-tooltip :title="data.no" placement="right">
              <div class="collapsed-img" v-if="data.img">
                <img :src="data.img" @error="handleImageError" />
              </div>
            </a-tooltip>
          </div>
        </template>
      </div>
    </div>

    <!-- Toggle Button (Floating outside or integrated) -->
    <div class="control-circle" @click="onToggleCollapse">
      <LeftOutlined v-if="!collapsed" />
      <RightOutlined v-else />
    </div>
  </div>
</template>

<script setup>
import { computed, watch, defineProps } from 'vue';
import { LeftOutlined, RightOutlined } from '@ant-design/icons-vue';

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
    default: true
  }
});

watch(() => props.slices, (val) => {
  // add tagArr in slices objcet
  for (const slice of val) {
    let tagArr = []
    if (slice.mainLabel != null && slice.mainLabel != '') {
      tagArr.push({
        label: slice.mainLabel,
        style: slice.mainHeatmapStyle
      })
    }
    if (slice.subLabel != null && slice.subLabel != '') {
      tagArr.push({
        label: slice.subLabel,
        style: slice.subHeatmapStyle
      })
    }
    slice.tagArr = tagArr
  }
})

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
  e.target.style.display = 'none';
  e.target.parentElement.style.backgroundColor = '#f0f0f0';
};
</script>

<style scoped>
.list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  position: relative;
  transition: width 0.3s, all 0.3s;
  width: 300px;
  pointer-events: auto;
}

.card-style {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: visible;
  /* Allow toggle button to hang out */
}

.collapsed-container {
  width: 80px;
}

.title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  /* border-bottom: 1px solid #f0f0f0; */
  font-weight: bold;
  font-size: 16px;
}

.collapsed-title {
  justify-content: center;
  padding: 15px 5px;
  font-size: 14px;
}

.l-c-text {
  font-size: 16px;
  color: #333;
  font-weight: bold;
}

.status_select {
  margin-left: auto;
}

.list-scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 10px 10px 10px;
}

/* Hide scrollbar for cleaner look */
.list-scroll-container::-webkit-scrollbar {
  width: 4px;
}

.list-scroll-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 2px;
}

.list_column {
  display: flex;
  padding: 12px;
  cursor: pointer;
  border-radius: 12px;
  margin-bottom: 8px;
  transition: all 0.2s;
  position: relative;
  background: white;
}

.list_column:hover {
  background-color: #f9f9f9;
}

.shadowCard {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: white;
  /* Override hover if needed, reference image shows white card with shadow */
  border: 1px solid #eee;
  /* Subtle border */
}

.collapsed-item {
  justify-content: center;
  padding: 10px 5px;
}

.list_img {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  flex-shrink: 0;
}

.list_img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.number_c {
  font-weight: bold;
  font-size: 13px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.disease-tag-wrapper {
  margin-bottom: 4px;
  grow: 1;
}

.disease-tag {
  display: inline-block;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
  background: #fff1f0;
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 4px;
}

.time_c {
  font-size: 12px;
  color: #999;
}

.close-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  color: #999;
  font-size: 12px;
}

/* Collapsed Styles */
.collapsed-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.collapsed-img {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  background: #eee;
  margin-bottom: 5px;
}

.collapsed-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.collapsed-no {
  font-size: 10px;
  color: #666;
}

/* Toggle Button */
.control-circle {
  position: absolute;
  right: -15px;
  /* Hangs off the right edge */
  top: 50%;
  width: 30px;
  height: 30px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  color: #666;
  font-weight: bold;
  transform: translateY(-50%);
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
