<template><div><PageHeader title="来源系统加密查询" /><EncryptedRequestPanel endpoint="/openapi/v1/exchange-query" submit-label="执行加密查询" /></div></template>
<script setup lang="ts">
import PageHeader from '@/components/common/PageHeader.vue';
import EncryptedRequestPanel from '@/components/common/EncryptedRequestPanel.vue';
</script>
