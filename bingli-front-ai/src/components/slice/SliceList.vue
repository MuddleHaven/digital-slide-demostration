<template>
  <div class="list-container">
    <div class="title">
      <span class="l-c-text">切片列表</span>
      <a-select v-model:value="pannelValue" :options="options" class="status_select" style="width: 7vw;"
        @change="onPannelChange" />
    </div>
    <el-scrollbar height="84vh">
      <div v-for="(data, index) in slices" :key="data.id" class="list_column"
        :class="{ 'shadowCard': activeIndex === index }" @click="onSliceSelect(index)">
        <div class="list_img">
          <img :src="data.img" alt="" />
        </div>
        <div style="margin-left: 10px;">
          <div class="number_c">{{ data.no }}</div>
          <div class="symptom_c">{{ data.disease }}</div>
          <div class="tag_list">
            <a-tag v-for="tag_item in data.tagArr" :key="tag_item.label"
              :color="tag_item.style >= 2 ? 'red' : 'green'">{{ tag_item.label
              }}</a-tag>
          </div>
          <div>
            <span class="time_c">{{ data.processTime || data.uploadTime }}</span>
          </div>
        </div>
        <div class="s_e_img" v-if="activeIndex === index" @click.stop="onDeleteClick(index)">
          <img src="../../assets/icon/Group2503.png" alt="" />
        </div>
      </div>
    </el-scrollbar>
    <div class="control-circle" @click="onToggleCollapse"><img src="../../assets/icon/Group 2508.png" alt="" /></div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

// 定义组件接收的属性
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
});


// const tagArr = ref([])
watch(() => props.slices, (val) => {
  // console.log('props slices', val);

  // add tagArr in slices objcet
  for (const slice of val) {
    let tagArr = []
    if (slice.mainLabel != null && slice.mainStyle != null && slice.mainLabel != '') {
      tagArr.push({
        label: slice.mainLabel,
        style: slice.mainStyle
      })
    }
    if (slice.subLabel != null && slice.subStyle != null && slice.subLabel != '') {
      tagArr.push({
        label: slice.subLabel,
        style: slice.subStyle
      })
    }
    // console.log('tagArr', tagArr);
    slice.tagArr = tagArr
  }
})


// 计算属性，用于双向绑定
const pannelValue = computed({
  get: () => props.pannel,
  set: (val) => emit('update-pannel', val)
});

// 定义组件可触发的事件
const emit = defineEmits(['update-pannel', 'select-slice', 'delete-slice', 'toggle-collapse']);

const onPannelChange = (value) => {
  emit('update-pannel', value);
};

// 当选择切片时
const onSliceSelect = (index) => {
  emit('select-slice', index);
};

// 当删除切片时
const onDeleteClick = (index) => {
  emit('delete-slice', index);
};

// 当折叠/展开左侧面板时
const onToggleCollapse = () => {
  emit('toggle-collapse');
};
</script>

<style src="../../assets/styles/sliceDetail.scss" lang="scss" scoped></style>