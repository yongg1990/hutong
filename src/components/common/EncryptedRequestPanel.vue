<template>
  <div>
    <JsonEditor v-model="payload" :rows="18" label="加密请求信封 JSON" />
    <div class="actions"><el-button :icon="Upload" type="primary" :loading="busy" @click="submit">{{ submitLabel }}</el-button></div>
    <el-drawer v-model="visible" title="请求结果" size="min(760px, 94vw)"><pre>{{ result }}</pre></el-drawer>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Upload } from '@element-plus/icons-vue';
import JsonEditor from '@/components/common/JsonEditor.vue';
import { request, apiErrorMessage } from '@/api/client';
const props = defineProps<{ endpoint: string; submitLabel: string; confirm?: string }>();
const payload = ref('{}'), result = ref(''), busy = ref(false), visible = ref(false);
async function submit() {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(payload.value);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('请输入 JSON 对象');
    if (['tenantId', 'projectSpaceId', 'sourceSystemId', 'sourceSystemKeyId', 'requestId', 'timestamp', 'payload', 'iv', 'nonce', 'encryptedKey', 'sign'].some(key => typeof data[key] !== 'string' || !String(data[key]).trim())) throw new Error('请填写完整的加密请求信封');
  } catch (error) { ElMessage.warning(apiErrorMessage(error, 'JSON 格式错误')); return; }
  if (props.confirm) { try { await ElMessageBox.confirm(props.confirm, '确认提交', { type: 'warning' }); } catch { return; } }
  busy.value = true;
  try { const response = await request.post(props.endpoint, data); result.value = JSON.stringify(response, null, 2); visible.value = true; }
  catch (error) { ElMessage.error(apiErrorMessage(error, '请求失败')); }
  finally { busy.value = false; }
}
</script>
<style scoped>.actions{display:flex;justify-content:flex-end;margin-top:12px}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style>
