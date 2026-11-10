<template>
  <div>
    <PageHeader title="查询请求生成" />
    <el-form label-position="top" class="selection-grid" :disabled="busy">
      <el-form-item label="租户" required><ApiOptionSelect v-model="selection.tenantId" :loader="loadTenants" value-key="tenantId" :label="tenantLabel" /></el-form-item>
      <el-form-item label="项目空间" required><ApiOptionSelect v-model="selection.projectSpaceId" :loader="loadProjects" value-key="projectSpaceId" :label="projectLabel" /></el-form-item>
      <el-form-item label="来源系统" required><ApiOptionSelect v-model="selection.sourceSystemId" :loader="loadSources" value-key="sourceSystemId" :label="sourceLabel" :disabled="!selection.tenantId" :scope="selection.tenantId" /></el-form-item>
      <el-form-item label="来源密钥" required><ApiOptionSelect v-model="selection.sourceSystemKeyId" :loader="loadKeys" value-key="id" :label="keyLabel" :disabled="!selection.sourceSystemId" :scope="selection.sourceSystemId" /></el-form-item>
      <el-form-item label="查询方案" required><ApiOptionSelect v-model="selection.profileCode" :loader="loadProfiles" value-key="profileCode" :label="profileLabel" :disabled="!identityReady" :scope="identityScope" /></el-form-item>
      <el-form-item label="已发布版本" required><ApiOptionSelect v-model="selection.profileVersion" :loader="loadVersions" value-key="version" :label="versionLabel" :disabled="!selection.profileCode" :scope="profileScope" /></el-form-item>
      <el-form-item label="业务请求标识"><el-input v-model="requestId" maxlength="128" /></el-form-item>
    </el-form>
    <div class="actions"><el-button :icon="Document" :disabled="!ready" :loading="busy" @click="definition">方案定义</el-button><el-button :icon="Document" type="primary" :disabled="!ready" :loading="busy" @click="generate">生成明文请求</el-button></div>
    <JsonEditor v-model="sampleQueryJson" :rows="10" label="查询 Payload JSON" />
    <template v-if="plaintext">
      <h2>明文请求信封</h2><JsonEditor v-model="plaintext" :rows="12" label="明文请求信封 JSON" />
      <div class="actions"><el-button :icon="Download" @click="download">下载明文</el-button><el-button :icon="Lock" :loading="busy" @click="encryptVisible = true">生成加密请求</el-button></div>
    </template>
    <el-dialog v-model="encryptVisible" title="模拟加密请求" width="min(560px, 94vw)" :close-on-click-modal="false" @closed="privateKey = ''">
      <el-form label-position="top"><el-form-item label="对接方 PKCS#8 私钥 Base64" required><el-input v-model="privateKey" type="password" show-password autocomplete="off" /></el-form-item></el-form>
      <template #footer><el-button @click="encryptVisible = false">取消</el-button><el-button type="primary" :loading="busy" @click="encrypt">生成</el-button></template>
    </el-dialog>
    <el-drawer v-model="detailVisible" title="方案与请求结果" size="min(800px, 94vw)"><el-button :icon="Download" @click="downloadResult">下载结果</el-button><pre>{{ detail }}</pre></el-drawer>
  </div>
</template>
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Document, Download, Lock } from '@element-plus/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import ApiOptionSelect from '@/components/common/ApiOptionSelect.vue';
import JsonEditor from '@/components/common/JsonEditor.vue';
import { request, apiErrorMessage } from '@/api/client';
const base = '/exchange-query/integration-assistant';
const selection = reactive({ tenantId: '', projectSpaceId: '', sourceSystemId: '', sourceSystemKeyId: '', profileCode: '', profileVersion: '' });
const requestId = ref(''), sampleQueryJson = ref(''), plaintext = ref(''), busy = ref(false), detailVisible = ref(false), detail = ref(''), encryptVisible = ref(false), privateKey = ref('');
const identityScope = computed(() => [selection.tenantId, selection.projectSpaceId, selection.sourceSystemId, selection.sourceSystemKeyId].join('|'));
const profileScope = computed(() => `${identityScope.value}|${selection.profileCode}`);
const identityReady = computed(() => [selection.tenantId, selection.projectSpaceId, selection.sourceSystemId, selection.sourceSystemKeyId].every(Boolean));
const ready = computed(() => Object.values(selection).every(Boolean));
const options = (resource: string, params: Record<string, unknown>) => request.get<any, any>(`${base}/${resource}`, { params });
const loadTenants = (keyword: string, page: number) => options('tenants', { tenantName: keyword || undefined, page, size: 10 });
const loadProjects = (keyword: string, page: number) => options('project-spaces', { projectName: keyword || undefined, page, size: 10 });
const loadSources = (keyword: string, page: number) => options('source-systems', { tenantId: selection.tenantId, keyword: keyword || undefined, page, size: 10 });
const loadKeys = (keyword: string, page: number) => options('source-system-keys', { sourceSystemId: selection.sourceSystemId, keyword: keyword || undefined, page, size: 10 });
const identity = () => ({ tenantId: selection.tenantId, projectSpaceId: selection.projectSpaceId, sourceSystemId: selection.sourceSystemId });
const loadProfiles = (keyword: string, page: number) => options('profiles', { ...identity(), keyword: keyword || undefined, page, size: 10 });
const loadVersions = (keyword: string, page: number) => options('profile-versions', { ...identity(), profileCode: selection.profileCode, keyword: keyword || undefined, page, size: 10 });
const tenantLabel = (row: any) => `${row.tenantName} (${row.tenantId})`;
const projectLabel = (row: any) => `${row.projectName} (${row.projectCode})`;
const sourceLabel = (row: any) => `${row.sourceSystemName} (${row.sourceSystemCode})`;
const keyLabel = (row: any) => `${row.id} (${row.keyAlgorithm})`;
const profileLabel = (row: any) => `${row.profileName} (${row.profileCode})`;
const versionLabel = (row: any) => row.version;
watch(() => selection.tenantId, () => { selection.sourceSystemId = ''; }, { flush: 'sync' });
watch(() => selection.sourceSystemId, () => { selection.sourceSystemKeyId = ''; }, { flush: 'sync' });
watch(identityScope, () => { selection.profileCode = ''; }, { flush: 'sync' });
watch(() => selection.profileCode, () => { selection.profileVersion = ''; }, { flush: 'sync' });
watch(() => ({ ...selection }), () => { plaintext.value = ''; sampleQueryJson.value = ''; }, { flush: 'sync' });
watch([sampleQueryJson, requestId], () => { plaintext.value = ''; });
async function run(action: () => Promise<void>) { if (busy.value) return; busy.value = true; try { await action(); } catch (error) { ElMessage.error(apiErrorMessage(error, '操作失败')); } finally { busy.value = false; } }
function show(value: unknown) { detail.value = JSON.stringify(value, null, 2); detailVisible.value = true; }
async function definition() { await run(async () => { show(await options('profile-definition', { ...selection })); }); }
async function generate() { await run(async () => { if (!ready.value) throw new Error('请完成配置选择'); if (requestId.value && !/^[A-Za-z0-9._:-]{1,128}$/.test(requestId.value)) throw new Error('请求标识格式不正确'); if (sampleQueryJson.value.trim()) { const payload = JSON.parse(sampleQueryJson.value); if (!payload || Array.isArray(payload) || typeof payload !== 'object') throw new Error('查询 Payload 须为 JSON 对象'); } const result: any = await request.post(`${base}/request-examples`, { ...selection, requestId: requestId.value || undefined, sampleQueryJson: sampleQueryJson.value || undefined }); if (!result.plaintextRequest) throw new Error('接口未返回明文请求信封'); plaintext.value = typeof result.plaintextRequest === 'string' ? result.plaintextRequest : JSON.stringify(result.plaintextRequest, null, 2); }); }
async function encrypt() { if (!privateKey.value.trim()) { ElMessage.warning('请输入对接方私钥'); return; } await run(async () => { const body = JSON.parse(plaintext.value); if (!body || Array.isArray(body) || typeof body !== 'object') throw new Error('明文请求须为 JSON 对象'); const result = await request.post(`${base}/request-examples/encrypt`, body, { params: { clientPrivateKey: privateKey.value.trim() } }); privateKey.value = ''; encryptVisible.value = false; show(result); }); }
function download() { const url = URL.createObjectURL(new Blob([plaintext.value], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = 'query-plaintext.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function downloadResult() { const url = URL.createObjectURL(new Blob([detail.value], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = 'query-result.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
</script>
<style scoped>.selection-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 16px}.actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin:12px 0}h2{font-size:16px}pre{white-space:pre-wrap;overflow-wrap:anywhere}@media(max-width:800px){.selection-grid{grid-template-columns:1fr}}</style>
