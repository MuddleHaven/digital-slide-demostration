<template>
  <div>
    <!-- 上部面板 -->
    <a-card class="right-up-card cardcommon">
      <div class="l-c-text">质控面板</div>
      <el-scrollbar height="53vh">
        <!-- 整体质量选择 -->
        <div class="common-pannel"
          style="height: 1.7vw;display: flex;justify-content: space-around;align-items: center;padding: 0px;">
          <span class="res-text">整体质量: </span>
          <span v-for="quality in qualities" :key="quality.value" class="center-cursor span-flex-grow"
            :class="{ 'check_quality': currentQuality == quality.value }" @click="onChange(quality.value)">
            <a-badge>
              <template #count>
                <div class="Aistyle" v-if="aiQuality == quality.value">AI</div>
                <div v-else></div>
              </template>
              <span class="res-text" :class="{ 'check_quality_color': currentQuality == quality.value }">{{ quality.label }}</span>
            </a-badge>
          </span>
        </div>
        
        <!-- 染色差异 -->
        <QualitySection 
          title="染色差异" 
          :errors="ranseErrors" 
          :all-options="allOptions"
          @update-quality-areas="updateQualityAreas('staining', $event)" 
        />
        
        <!-- 切片异常 -->
        <QualitySection 
          title="切片异常" 
          :errors="qiepianErrors" 
          :all-options="allOptions"
          @update-quality-areas="updateQualityAreas('slice', $event)" 
        />
        
        <!-- 制片不规范 -->
        <QualitySection 
          title="制片不规范" 
          :errors="makepianErrors" 
          :all-options="allOptions"
          @update-quality-areas="updateQualityAreas('preparation', $event)" 
        />
        
        <!-- 扫描异常 -->
        <QualitySection 
          title="扫描异常" 
          :errors="saomiaoErrors" 
          :all-options="allOptions"
          @update-quality-areas="updateQualityAreas('scanning', $event)" 
        />
      </el-scrollbar>
      <div class="control-circle2" @click="onToggleCollapse"><img src="../../assets/icon/Group 2508.png" alt=""></div>
    </a-card>

    <!-- 下部面板 -->
    <a-card class="right-down-card cardcommon">
      <div class="l-c-text">质控评价</div>
      <div class="res-card">
        <el-scrollbar height="15vh">
          <QualitySummary 
            :label="label"
            :current-quality="currentQuality"
            :ranse-errors="ranseErrors"
            :qiepian-errors="qiepianErrors"
            :makepian-errors="makepianErrors"
            :saomiao-errors="saomiaoErrors"
          />
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
      <div class="control-circle2" @click="onToggleCollapse"><img src="../../assets/icon/Group 2508.png" alt=""></div>
    </a-card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { allOptions } from '../../utils/options.js';
import QualitySection from './QualitySection.vue';
import QualitySummary from './QualitySummary.vue';

// 定义组件接收的属性
const props = defineProps({
  quality: {
    type: String,
    required: true
  },
  aiQuality: {
    type: String,
    required: true
  },
  qualities: {
    type: Array,
    required: true
  },
  ranseErrors: {
    type: Array,
    required: true
  },
  qiepianErrors: {
    type: Array, 
    required: true
  },
  makepianErrors: {
    type: Array,
    required: true
  },
  saomiaoErrors: {
    type: Array,
    required: true
  },
  label: {
    type: String,
    required: true
  }
});

console.log('QualityPanel组件加载，当前质量:', props.quality, 'AI质量:', props.aiQuality);
console.log('所有选项:', allOptions);
console.log('染色差异错误:', props.ranseErrors);
console.log('切片异常错误:', props.qiepianErrors);
console.log('制片不规范错误:', props.makepianErrors);
console.log('扫描异常错误:', props.saomiaoErrors);

// 定义组件可触发的事件
const emit = defineEmits(['change-quality', 'save-and-view', 'next-slice', 'toggle-collapse', 'update-quality-areas']);

// 使用计算属性方便访问当前质量
const currentQuality = computed(() => props.quality);

// 当改变质量等级时
const onChange = (value) => {
  emit('change-quality', value);
};

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

// 更新质量控制区域
const updateQualityAreas = (type, areas) => {
  emit('update-quality-areas', { type, areas });
};
</script>

<style src="../../assets/styles/sliceDetail.scss" lang="scss" scoped></style>