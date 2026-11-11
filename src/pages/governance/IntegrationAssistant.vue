<template>
  <div>
    <PageHeader title="对接助手" />
    <el-form label-position="top" :disabled="busy" class="selection-grid">
      <el-form-item label="租户" required><ApiOptionSelect v-model="selection.tenantId" :loader="loadTenants" value-key="tenantId" :label="tenantLabel" /></el-form-item>
      <el-form-item label="项目空间" required><ApiOptionSelect v-model="selection.projectSpaceId" :loader="loadProjects" value-key="projectSpaceId" :label="projectLabel" /></el-form-item>
      <el-form-item label="来源系统" required><ApiOptionSelect v-model="selection.sourceSystemId" :loader="loadSources" value-key="sourceSystemId" :label="sourceLabel" :disabled="!selection.tenantId" :scope="selection.tenantId" /></el-form-item>
      <el-form-item label="来源密钥" required><ApiOptionSelect v-model="selection.sourceSystemKeyId" :loader="loadKeys" value-key="id" :label="keyLabel" :disabled="!selection.sourceSystemId" :scope="selection.sourceSystemId" @select="selectedKey = $event || null" /></el-form-item>
      <el-form-item label="授权事件" required><ApiOptionSelect v-model="selection.eventType" :loader="loadEvents" value-key="eventType" :label="eventLabel" :disabled="!selection.tenantId || !selection.projectSpaceId" :scope="eventScope" /></el-form-item>
      <el-form-item label="Schema 版本" required><ApiOptionSelect v-model="selection.schemaVersion" :loader="loadSchemas" value-key="schemaVersion" :label="schemaLabel" :disabled="!selection.eventType" :scope="schemaScope" @select="selectSchema" /></el-form-item>
      <el-form-item label="业务请求标识 requestId" required><el-input v-model="idempotencyKey" :maxlength="128" clearable /></el-form-item>
    </el-form>
    <el-descriptions v-if="selectedKey" :column="2" border class="section">
      <el-descriptions-item label="密钥算法">{{ selectedKey.keyAlgorithm }}</el-descriptions-item><el-descriptions-item label="数据算法">{{ selectedKey.dataAlgorithm }}</el-descriptions-item>
      <el-descriptions-item label="平台公钥" :span="2"><el-input :model-value="selectedKey.publicKey" type="textarea" :rows="3" readonly /></el-descriptions-item>
      <el-descriptions-item label="对接方公钥" :span="2"><el-input :model-value="selectedKey.clientPublicKey" type="textarea" :rows="3" readonly /></el-descriptions-item>
    </el-descriptions>
    <template v-if="schema">
      <div class="section-heading"><h2>已发布 Schema</h2><el-button link @click="schemaVisible = true">完整定义</el-button></div>
      <div class="digest">{{ schema.contentDigest }}</div>
      <div class="table-surface">
        <LocalPaginatedTable :data="schema.fields" empty-text="暂无字段">
          <el-table-column prop="fieldName" label="字段代码" min-width="150" /><el-table-column prop="displayName" label="名称" min-width="140" />
          <el-table-column prop="dataType" label="类型" width="110" /><el-table-column label="必填" width="80"><template #default="{ row }">{{ row.required ? '是' : '否' }}</template></el-table-column>
          <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />
          <el-table-column prop="valueSetCode" label="值域" min-width="140" /><el-table-column prop="codeSchemeCode" label="编码体系" min-width="140" />
        </LocalPaginatedTable>
      </div>
    </template>
    <div class="actions"><el-button type="primary" :icon="Document" :loading="generating" :disabled="!ready || busy" @click="generate">生成明文模板</el-button></div>
    <el-drawer v-model="plaintextVisible" title="明文模板" size="min(1000px,94vw)">
    <template v-if="example">
      <div class="section-heading"><h2>SDK 明文输入</h2><div class="actions"><el-button :icon="Download" @click="download('plaintext-request.json', plaintext)">下载明文</el-button><el-button type="primary" :loading="validating" :disabled="busy || !plaintext.trim()" @click="validate">校验明文</el-button></div></div>
      <fieldset :disabled="busy"><JsonEditor v-model="plaintext" :rows="30" label="SDK 明文输入 JSON" /></fieldset>
      <el-button :disabled="busy || !plaintext.trim()" @click="encryptVisible = true">生成模拟加密请求</el-button>
    </template>
    <section v-if="validation" class="section">
      <div class="section-heading"><h2>校验结果</h2><el-tag :type="validation.valid ? 'success' : 'danger'">{{ validation.valid ? '通过' : '未通过' }}</el-tag></div>
      <p v-if="validation.scope">{{ validation.scope }}</p>
      <h3>错误</h3><div class="table-surface">
<LocalPaginatedTable :data="validation.errors || []" empty-text="无错误"><el-table-column prop="path" label="字段路径" min-width="200" /><el-table-column prop="code" label="代码" min-width="160" /><el-table-column prop="message" label="说明" min-width="280" /></LocalPaginatedTable>
</div>
      <h3>待确认业务字段</h3><div class="table-surface">
<LocalPaginatedTable :data="validation.requiredInputs || []" empty-text="无待确认字段"><el-table-column prop="path" label="字段路径" min-width="200" /><el-table-column prop="code" label="代码" min-width="160" /><el-table-column prop="message" label="说明" min-width="280" /></LocalPaginatedTable>
</div>
    </section>
    </el-drawer>
    <el-dialog v-model="schemaVisible" title="Schema 完整定义" width="min(920px, 94vw)"><pre class="json-output">{{ pretty(schema) }}</pre></el-dialog>
    <el-dialog v-model="encryptVisible" title="模拟加密请求" width="min(640px,94vw)" :close-on-click-modal="false" @closed="privateKey = ''"><el-form label-position="top"><el-form-item label="对接方 PKCS#8 私钥 Base64" required><el-input v-model="privateKey" type="password" show-password autocomplete="off" /></el-form-item></el-form><template #footer><el-button @click="encryptVisible = false">取消</el-button><el-button type="primary" :loading="encrypting" @click="encrypt">生成</el-button></template></el-dialog>
    <el-drawer v-model="encryptedVisible" title="加密请求结果" size="min(800px,94vw)"><pre class="json-output">{{ encrypted }}</pre><div class="actions"><el-button :icon="Download" @click="download('event-encrypted.json', encrypted)">下载加密请求</el-button><el-button :icon="CopyDocument" :disabled="!encrypted" @click="copyRequest">复制请求</el-button></div></el-drawer>
  </div>
</template>

<script setup lang="ts">
import LocalPaginatedTable from '@/components/common/LocalPaginatedTable.vue';
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { CopyDocument, Document, Download } from '@element-plus/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import ApiOptionSelect from '@/components/common/ApiOptionSelect.vue';
import { enumLabel } from '@/utils/enumLabels';
import JsonEditor from '@/components/common/JsonEditor.vue';
import { apiErrorMessage } from '@/api/client';
import { integrationApi, type IntegrationSelection, type IntegrationSchema, type IntegrationExample, type IntegrationValidation, type SourceSystemKey, type TenantOption, type ProjectOption, type EventAuthorization } from '@/api/integration';
import type { SourceSystemManagement } from '@/api/governance';

const selection = reactive<IntegrationSelection>({ tenantId: '', projectSpaceId: '', sourceSystemId: '', sourceSystemKeyId: '', eventType: '', schemaVersion: '' });
const schema = ref<IntegrationSchema | null>(null), selectedKey = ref<SourceSystemKey | null>(null);
const example = ref<IntegrationExample | null>(null), validation = ref<IntegrationValidation | null>(null);
const plaintext = ref(''), idempotencyKey = ref('');
const plaintextVisible = ref(false);
const generating = ref(false), validating = ref(false), schemaVisible = ref(false);
const encryptVisible = ref(false), encrypting = ref(false), privateKey = ref(''), encrypted = ref(''), encryptedVisible = ref(false);
const busy = computed(() => generating.value || validating.value || encrypting.value);
const ready = computed(() => Object.values(selection).every(Boolean));
const eventScope = computed(() => `${selection.tenantId}|${selection.projectSpaceId}`);
const schemaScope = computed(() => `${eventScope.value}|${selection.eventType}`);
const pretty = (value: unknown) => JSON.stringify(value, null, 2);
const loadTenants = (keyword: string, page: number) => integrationApi.tenants({ tenantName: keyword || undefined, page, size: 10 });
const loadProjects = (keyword: string, page: number) => integrationApi.projects({ projectName: keyword || undefined, page, size: 10 });
const loadSources = (keyword: string, page: number) => integrationApi.sources({ tenantId: selection.tenantId, keyword: keyword || undefined, page, size: 10 });
const loadKeys = (keyword: string, page: number) => integrationApi.keys({ sourceSystemId: selection.sourceSystemId, keyword: keyword || undefined, page, size: 10 });
const loadEvents = (keyword: string, page: number) => integrationApi.events({ tenantId: selection.tenantId, projectSpaceId: selection.projectSpaceId, keyword: keyword || undefined, page, size: 10 });
const loadSchemas = (keyword: string, page: number) => integrationApi.schemas({ tenantId: selection.tenantId, projectSpaceId: selection.projectSpaceId, eventType: selection.eventType, schemaVersion: keyword || undefined, page, size: 10 });
const tenantLabel = (item: TenantOption) => `${item.tenantName} (${item.tenantId})`;
const projectLabel = (item: ProjectOption) => `${item.projectName} (${item.projectCode}) · ${enumLabel(item.status)}`;
const sourceLabel = (item: SourceSystemManagement) => `${item.sourceSystemName} (${item.sourceSystemCode})`;
const keyLabel = (item: SourceSystemKey) => `${item.id} · ${item.keyAlgorithm}/${item.dataAlgorithm}`;
const eventLabel = (item: EventAuthorization) => `${item.eventName} (${item.eventType})`;
const schemaLabel = (item: IntegrationSchema) => item.schemaVersion;
function clearOutput() { plaintextVisible.value = false; example.value = null; plaintext.value = ''; validation.value = null; encrypted.value = ''; encryptedVisible.value = false; privateKey.value = ''; encryptVisible.value = false; }
watch(() => selection.tenantId, () => { selection.sourceSystemId = ''; selection.sourceSystemKeyId = ''; selectedKey.value = null; selection.eventType = ''; selection.schemaVersion = ''; }, { flush: 'sync' });
watch(() => selection.projectSpaceId, () => { selection.eventType = ''; selection.schemaVersion = ''; }, { flush: 'sync' });
watch(() => selection.sourceSystemId, () => { selection.sourceSystemKeyId = ''; selectedKey.value = null; }, { flush: 'sync' });
watch(() => selection.eventType, () => { selection.schemaVersion = ''; }, { flush: 'sync' });
watch(() => selection.schemaVersion, () => { schema.value = null; }, { flush: 'sync' });
watch(() => ({ ...selection }), clearOutput, { flush: 'sync' });
watch(idempotencyKey, clearOutput, { flush: 'sync' });
watch(plaintext, () => { validation.value = null; }, { flush: 'sync' });
async function selectSchema(value?: IntegrationSchema) {
  schema.value = null;
  if (!value) return;
  const scope = schemaScope.value, version = selection.schemaVersion;
  try { const result = await integrationApi.schemaFields({ tenantId: selection.tenantId, projectSpaceId: selection.projectSpaceId, eventType: selection.eventType, schemaVersion: version }); if (scope === schemaScope.value && version === selection.schemaVersion) schema.value = result; }
  catch (error) { ElMessage.error(apiErrorMessage(error, '加载 Schema 字段失败')); }
}
function requireJsonObject(text: string) {
  if (new TextEncoder().encode(text).length > 2097152) throw new Error('JSON 不得超过 2 MiB');
  const data = JSON.parse(text);
  if (!data || Array.isArray(data) || typeof data !== 'object') throw new Error('请输入 JSON 对象');
  return data;
}
async function generate() {
  if (!ready.value || busy.value) return;
  try {
    if (!/^[A-Za-z0-9._:-]{1,128}$/.test(idempotencyKey.value)) throw new Error('请填写业务请求标识，仅支持字母、数字及 . _ : -');
  } catch (cause) { ElMessage.warning(cause instanceof Error ? cause.message : '样例 JSON 格式错误'); return; }
  generating.value = true; clearOutput();
  try {
    const result = await integrationApi.example({ ...selection, requestId: idempotencyKey.value });
    if (!result || !result.payload || Array.isArray(result.payload) || typeof result.payload !== 'object') throw new Error('接口未返回有效的明文请求信封');
    example.value = result; plaintext.value = pretty(result); plaintextVisible.value = true;
  } catch (cause) { ElMessage.error(apiErrorMessage(cause, '生成明文模板失败')); }
  finally { generating.value = false; }
}
async function validate() {
  if (busy.value) return;
  try { requireJsonObject(plaintext.value); }
  catch (cause) { ElMessage.warning(cause instanceof Error ? cause.message : '明文 JSON 格式错误'); return; }
  validating.value = true; validation.value = null;
  try { validation.value = await integrationApi.validate(plaintext.value); }
  catch (cause) { ElMessage.error(apiErrorMessage(cause, '明文校验失败')); }
  finally { validating.value = false; }
}
function download(filename: string, text: string) {
  if (!text) return;
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function encrypt() {
  if (busy.value || !privateKey.value.trim()) return ElMessage.warning('请输入对接方私钥');
  encrypting.value = true;
  try { encrypted.value = pretty(await integrationApi.encrypt(requireJsonObject(plaintext.value), privateKey.value.trim())); privateKey.value = ''; encryptVisible.value = false; encryptedVisible.value = true; }
  catch (error) { ElMessage.error(apiErrorMessage(error, '加密失败')); } finally { encrypting.value = false; }
}
async function copyRequest() {
  if (!encrypted.value) return;
  try {
    let copied = false;
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(encrypted.value); copied = true; }
      catch { /* Fall back for browsers that deny clipboard access. */ }
    }
    if (!copied) {
      const focused = document.activeElement;
      const textarea = document.createElement('textarea');
      textarea.value = encrypted.value;
      textarea.readOnly = true;
      textarea.style.cssText = 'position:fixed;left:-9999px;top:0;';
      (focused?.closest('.el-drawer') || document.body).appendChild(textarea);
      try {
        textarea.select();
        if (!document.execCommand('copy')) throw new Error('复制失败');
      } finally {
        textarea.remove();
        if (focused instanceof HTMLElement) focused.focus();
      }
    }
    ElMessage.success('请求已复制');
  } catch { ElMessage.error('复制失败，请检查浏览器剪贴板权限'); }
}
</script>

<style scoped>
.selection-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0 18px; }
.section { margin-top: 20px; }
.section-heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin: 22px 0 12px; }
h2 { margin: 0; font-size: 16px; }
h3 { font-size: 14px; margin: 18px 0 8px; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
.actions .el-button + .el-button { margin-left: 0; }
.digest { overflow-wrap: anywhere; font-family: monospace; margin-bottom: 12px; }
fieldset { min-width: 0; border: 0; margin: 12px 0 0; padding: 0; }
.json-output { max-height: 560px; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; padding: 14px; border: 1px solid var(--color-border); background: var(--color-surface); font-size: 12px; line-height: 1.6; }
@media (max-width: 1100px) { .selection-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 700px) { .selection-grid { grid-template-columns: minmax(0, 1fr); } }
</style>
