<template><div><PageHeader title="加密事件提交" /><EncryptedRequestPanel endpoint="/openapi/v1/raw-records" submit-label="提交加密事件" confirm="确认提交此加密事件？提交后将保存原始记录并进入治理流程。" /></div></template>
<script setup lang="ts">
import PageHeader from '@/components/common/PageHeader.vue';
import EncryptedRequestPanel from '@/components/common/EncryptedRequestPanel.vue';
</script>
