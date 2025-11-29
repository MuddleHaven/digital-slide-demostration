<template>
  <div class="modal-content">
    <!-- Header -->
    <div class="modal-header">
      <h2 class="modal-title">关于我们</h2>
      <!-- <div class="close-button"></div> -->
    </div>

    <!-- Content -->
    <div class="modal-body">
      <div class="company-info">
        <div class="logo-container">
          <img src="../assets/normalsetting/Group 2494.png" style="width: 8vw; height: 3vh;">
        </div>
        <h3 class="company-name">武汉优云智能医疗科技有限公司</h3>
      </div>

      <!-- Product Info -->
      <div class="product-info">
        <div class="info-item">
          <span class="info-label">产品名称：</span>
          <span>{{ tissueTitle }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">型号规格：</span>
          <span>{{ tissueModel }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">软件版本：</span>
          <span>V1.0.0.1</span>
        </div>
        <div class="info-item">
          <span class="info-label">地址：湖北省武汉市东湖新技术开发区高新大道818号武汉高科医疗器械园B区22号楼3层1号、2号、3号301和2层2号</span>
        </div>
        <div class="info-item">
          <span class="info-label">联系电话：</span>
          <span>027-59320989</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const tissueTitle = import.meta.env.VITE_APP_TITLE || '胃组织病理图像处理软件'
const tissueModel = import.meta.env.VITE_APP_MODELNUMBER || 'UI-STOThink'

</script>

<style scoped>
.modal-content {
  /* width: 63vw; */
  height: 24vh;
  background: #FFFFFF;
  box-shadow: 5px 15px 25px 0px rgba(36, 43, 160, 0.05);
  border-radius: 25px;
  margin: 0;
  padding: 1vw;
}

.modal-header {
  padding: 0;
  margin-left: 1vw;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  padding: 0;
  margin-left: 0.5vw;
  width: 64px;
  height: 23px;
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: 500;
  font-size: 16px;
  color: #000000;
  line-height: 19px;
  text-align: center;
  font-style: normal;
  text-transform: none;
}

.close-button {
  display: flex;
  width: 14px;
  height: 14px;
  background-image: url('../assets/normalsetting/Group 2350.png');
  background-size: contain;
  background-repeat: no-repeat;
  border: none;
  cursor: pointer;
}

.close-button:hover {
  color: #374151;
}

.modal-body {
  margin-left: 1.5vw;
  padding: 0;
}

.company-info {
  align-items: center;
  display: flex;
}

.logo-container {
  padding: 4px;
  margin-right: 16px;
}

.logo-text {
  font-family: "Pacifico", serif;
  color: #2563EB;
  font-size: 24px;
}

.company-name {
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: 400;
  font-size: 14px;
  color: #666666;
  line-height: 28px;
  text-align: left;
  font-style: normal;
  text-transform: none;
}

.product-info,
.contact-info {
  width: 50vw;
  height: 140px;
  font-family: Source Han Sans SC, Source Han Sans SC;
  font-weight: 400;
  font-size: 0.8vw;
  color: #666666;
  line-height: 20px;
  text-align: left;
  font-style: normal;
  text-transform: none;
}

.info-item {
  width: 50vw;
  margin-bottom: 5px;
}

.info-label {
  color: #6B7280;
}
</style>