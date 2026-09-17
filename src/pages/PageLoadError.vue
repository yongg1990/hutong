<template>
  <div class="page-load-error">
    <el-result icon="error" title="页面暂时无法加载" sub-title="页面文件加载失败，请稍后重试。">
      <template #extra>
        <el-button type="primary" @click="retry">重试</el-button>
        <el-button @click="router.push('/workspace')">返回工作台</el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const retry = () => {
  const target = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
    ? route.query.redirect
    : '/workspace';
  window.location.assign(target);
};
</script>

<style scoped>
.page-load-error {
  min-height: 360px;
  display: grid;
  place-items: center;
}
</style>
