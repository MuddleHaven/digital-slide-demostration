<template>
  <div class="indeterminate-progress-container">
    <div class="indeterminate-progress-bar">
      <div class="progress-segment segment1"></div>
      <div class="progress-segment segment2"></div>
    </div>
  </div>
</template>

<script setup>
// 不需要props因为这是一个不确定进度的进度条
</script>

<style scoped>
.indeterminate-progress-container {
  width: 100%;
  height: 4px;
  margin-top: 4px;
  margin-bottom: 4px;
  background-color: rgba(36, 43, 160, 0.05);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.indeterminate-progress-bar {
  width: 100%;
  height: 100%;
  position: relative;
}

.progress-segment {
  position: absolute;
  height: 100%;
  background: linear-gradient(90deg,
    rgba(36, 43, 160, 0.3) 0%,
    rgba(36, 43, 160, 1) 50%,
    rgba(36, 43, 160, 0.3) 100%);
  border-radius: 2px;
}

.segment1 {
  animation: moveSegment1 2s infinite cubic-bezier(0.65, 0.815, 0.735, 0.395);
}

.segment2 {
  animation: moveSegment2 2s infinite cubic-bezier(0.165, 0.84, 0.44, 1);
  animation-delay: 1s;
}

@keyframes moveSegment1 {
  0% {
    left: -35%;
    width: 35%;
  }
  100% {
    left: 100%;
    width: 35%;
  }
}

@keyframes moveSegment2 {
  0% {
    left: -50%;
    width: 50%;
  }
  100% {
    left: 100%;
    width: 50%;
  }
}
</style>