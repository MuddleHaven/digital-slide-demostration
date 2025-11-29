<template>
  <div class="notfound-container">
    <a-result status="404" title="404" sub-title="Sorry, the page you visited does not exist.">
      <template #extra>
        <a-button type="primary" @click="$router.push('/')">
          Back Home
        </a-button>
      </template>
    </a-result>
  </div>
</template>
<script>

export default {
  data() {
    return {};
  },
};
</script>

<style scoped>
.notfound-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}
</style>