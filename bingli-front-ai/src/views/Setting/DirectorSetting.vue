<template>
  <div class="director-setting-container">
    <a-row :gutter="[24, 24]">
      <!-- 左侧面板 -->
      <a-col :span="getLeftSpan()" class="left-panel">
        <AvatarCard class="panel-card" />
        <InformSide class="panel-card" />
      </a-col>

      <!-- 右侧面板 -->
      <a-col :span="getRightSpan()" class="right-panel">
        <DirectorList class="panel-card" />
        <DirectorInformCard class="panel-card" />
        <AboutCard class="panel-card" />
      </a-col>
    </a-row>

    <!-- 控制按钮 - 使用过渡效果 -->
    <transition name="fade">
      <div class="control-circle" v-show="!isLeft" @click="changeLeft(true)">
        <img src="../../assets/icon/Group 2508.png" alt="展开侧边栏">
      </div>
    </transition>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import AboutCard from '../../components/AboutCard.vue';
import AvatarCard from '../../components/AvatarCard.vue';
import InformSide from '../../components/InformSide.vue';
import DirectorInformCard from '../../components/DirectorInformCard.vue';
import DirectorList from '../../components/DirectorList.vue';
import { useSettingStore } from '../../stores/SettingStore';
import { storeToRefs } from 'pinia';

const settingStore = useSettingStore();
const { isLeft } = storeToRefs(settingStore);
const { getLeftSpan, getRightSpan, changeLeft } = settingStore;

// 页面加载时自动保存上次状态，离开时清理
onMounted(() => {
  // 可以从localStorage恢复上次的布局状态
  const savedLayout = localStorage.getItem('directorSettingLayout');
  if (savedLayout) {
    changeLeft(savedLayout === 'expanded');
  }
});

onUnmounted(() => {
  // 保存当前布局状态
  localStorage.setItem('directorSettingLayout', isLeft.value ? 'expanded' : 'collapsed');
});
</script>

<style lang="scss" scoped>
.director-setting-container {
  position: relative;
  padding: 16px;
  height: 100%;

  .panel-card {
    margin-bottom: 24px;
    transition: all 0.3s ease;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .left-panel,
  .right-panel {
    transition: width 0.3s ease;
  }

  .control-circle {
    width: 32px;
    height: 32px;
    background: #FFFFFF;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    position: absolute;
    left: -16px;
    top: 45%;
    z-index: 9;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    img {
      width: 16px;
      height: 16px;
      margin-left: 5px;
    }
  }
}

// 添加过渡效果
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>