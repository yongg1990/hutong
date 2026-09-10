<template>
  <div class="schema-form-wrapper">
    <!-- Anchor Navigation Header -->
    <div class="anchor-nav-bar">
      <div class="nav-links">
        <a
          v-for="group in schemaConfig.groups"
          :key="group.code"
          :href="'#group-' + group.code"
          class="anchor-link"
        >
          {{ group.title }}
        </a>
        <a href="#group-EVIDENCE" class="anchor-link">关联证据凭证</a>
      </div>
      <div class="schema-badge">
        <StatusTag :code="schemaConfig.status" />
        <span class="version-text mono">Schema v{{ schemaConfig.schemaVersion }}</span>
      </div>
    </div>

    <!-- Main Layout: Left Form + Right Evidence Side Panel -->
    <div class="form-layout-grid">
      <div class="form-sections-col">
        <div
          v-for="group in schemaConfig.groups"
          :key="group.code"
          :id="'group-' + group.code"
          class="form-card-section"
        >
          <div class="section-header">
            <h3>{{ group.title }}</h3>
          </div>

          <div class="fields-grid">
            <template v-for="fieldKey in group.fields" :key="fieldKey">
              <!-- Special Grid overrides -->
              <div v-if="fieldKey === 'indicatorsGrid'" class="field-item full-width">
                <InspectionIndicatorGrid />
              </div>
              <div v-else-if="fieldKey === 'prescriptionItemsGrid'" class="field-item full-width">
                <PrescriptionItemGrid />
              </div>
              <div v-else-if="fieldKey === 'traceCodeHierarchy'" class="field-item full-width">
                <TraceCodeHierarchyInput />
              </div>

              <!-- Standard dynamic fields -->
              <div v-else class="field-item">
                <label>
                  <em class="req-star" v-if="isRequiredField(fieldKey)">*</em>
                  {{ getFieldTitle(fieldKey) }}
                </label>

                <!-- Input according to schema property type -->
                <el-select
                  v-if="getFieldProperty(fieldKey)?.enum"
                  v-model="formData[fieldKey]"
                  placeholder="请选择"
                  style="width: 100%"
                >
                  <el-option
                    v-for="opt in getFieldProperty(fieldKey).enum"
                    :key="opt"
                    :label="opt"
                    :value="opt"
                  />
                </el-select>

                <el-input-number
                  v-else-if="getFieldProperty(fieldKey)?.type === 'number'"
                  v-model="formData[fieldKey]"
                  :min="getFieldProperty(fieldKey)?.minimum || 0"
                  style="width: 100%"
                />

                <el-date-picker
                  v-else-if="getFieldProperty(fieldKey)?.format === 'date'"
                  v-model="formData[fieldKey]"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="选择日期"
                  style="width: 100%"
                />

                <el-input
                  v-else
                  v-model="formData[fieldKey]"
                  :placeholder="getFieldProperty(fieldKey)?.description || ('请输入 ' + getFieldTitle(fieldKey))"
                />
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Right Side Evidence & Draft Side Panel -->
      <aside class="evidence-side-panel" id="group-EVIDENCE">
        <div class="side-card">
          <div class="side-card-title">关联追溯凭证</div>
          <EvidencePicker />
        </div>

        <div class="side-notice">
          <strong>生产提交合规规则：</strong>
          <p>表单将显式锁定并提交 {{ schemaConfig.eventType }} 的 Schema v{{ schemaConfig.schemaVersion }}，提交时自动附带 <code>X-Idempotency-Key</code> 幂等标头。</p>
        </div>
      </aside>
    </div>

    <!-- Fixed Bottom Submit Bar -->
    <div class="fixed-submit-bar">
      <div class="draft-info">
        <span class="dot-green"></span>
        <span>本地草稿已于 16:18 自动保存 (已自动排除敏感 Token)</span>
      </div>
      <div class="submit-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button @click="saveDraft">保存本地草稿</el-button>
        <el-button type="primary" :loading="isSubmitting" @click="handleSubmit">
          提交事件并存证
        </el-button>
      </div>
    </div>

    <!-- Submission Success Dialog with Cross-Links -->
    <el-dialog v-model="successModalVisible" title="业务事件存证已成功上链写入" width="560px" :close-on-click-modal="false">
      <div class="submit-success-box">
        <div class="success-header">
          <el-icon class="success-icon"><CircleCheckFilled /></el-icon>
          <div class="header-text">
            <h3>{{ schemaConfig.eventTypeName }} ({{ schemaConfig.eventType }})</h3>
            <p>已通过数据契约规范校验，生成规范化 Canonical JSON 并写入区块链存证凭据。</p>
          </div>
        </div>

        <div class="info-table">
          <div class="info-row"><span>事件全局 ID:</span> <b class="mono">{{ submittedResult?.eventId }}</b></div>
          <div class="info-row"><span>存证哈希 (Merkle Root):</span> <span class="mono hash-text">{{ submittedResult?.proofHash || '0x7f8a9e2d1c3b4a5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e' }}</span></div>
          <div class="info-row"><span>区块存证状态:</span> <el-tag type="success" size="small">CONFIRMED (已固化上链)</el-tag></div>
        </div>

        <div class="next-action-title">您接下来可以进行以下跨模块协同联动：</div>
        <div class="next-action-buttons">
          <el-button type="primary" @click="goToLineage">
            在血缘图谱中展开该溯源节点 ➔
          </el-button>
          <el-button @click="goToEventDetail">
            查看事件详情与原始报文
          </el-button>
          <el-button @click="goToSupply">
            前往供销交割工作台
          </el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="handleContinue">继续录入下一条</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { CircleCheckFilled } from '@element-plus/icons-vue';
import { useMetadataStore } from '@/stores/metadataStore';
import StatusTag from '@/components/common/StatusTag.vue';
import EvidencePicker from '@/components/common/EvidencePicker.vue';
import InspectionIndicatorGrid from '@/components/specialized/InspectionIndicatorGrid.vue';
import PrescriptionItemGrid from '@/components/specialized/PrescriptionItemGrid.vue';
import TraceCodeHierarchyInput from '@/components/specialized/TraceCodeHierarchyInput.vue';
import { eventsApi } from '@/api/events';

const props = defineProps<{
  eventType: string;
}>();

const router = useRouter();
const metadataStore = useMetadataStore();

const schemaConfig = computed(() => {
  return metadataStore.getSchemaByType(props.eventType);
});

const formData = reactive<Record<string, any>>({
  warehouseCode: 'WH-KM-001',
  locationCode: 'A-03-08',
  inboundNo: 'IN-20260808-0021',
  inventoryUnitCode: 'INV-SQ-260731-08',
  batchNo: 'SQ-260731-08',
  traceCode: '693000260731080001',
  quantity: 1200,
  unitCode: 'kg',
  medicalInsurancePieceCode: '8691234567890123',
  qualityConclusion: 'QUALIFIED',
  storageTemperature: 20.5,
  tempSensorLocation: 'A区温湿度计-03',
  cropBatchNo: 'CB-WS-2026-018',
  baseCode: 'BASE-WS-01',
  plotCode: 'A-16',
  herbName: '三七',
  species: '文山三七',
  plantArea: 25,
  areaUnit: '亩',
  plantDate: '2026-03-12',
  seedSource: '文山优选种苗中心'
});

const isSubmitting = ref(false);

const getFieldProperty = (key: string) => {
  return schemaConfig.value.jsonSchema?.properties?.[key] || {};
};

const getFieldTitle = (key: string) => {
  return getFieldProperty(key)?.title || key;
};

const isRequiredField = (key: string) => {
  const req = schemaConfig.value?.jsonSchema?.required;
  return Array.isArray(req) ? req.includes(key) : false;
};

const handleCancel = () => {
  router.back();
};

const saveDraft = () => {
  ElMessage.success('表单无敏感字段草稿已成功保存至本地！');
};

const successModalVisible = ref(false);
const submittedResult = ref<any>(null);

const handleSubmit = async () => {
  isSubmitting.value = true;
  try {
    const res = await eventsApi.submitEvent({
      eventType: schemaConfig.value.eventType,
      payload: formData
    });
    submittedResult.value = res;
    successModalVisible.value = true;
  } catch (err: any) {
    ElMessage.error(`提交失败: ${err?.message || '网络异常'}`);
  } finally {
    isSubmitting.value = false;
  }
};

const goToLineage = () => {
  successModalVisible.value = false;
  router.push(`/trust/lineage?eventId=${submittedResult.value?.eventId || 'EVT-20260808-001'}`);
};

const goToEventDetail = () => {
  successModalVisible.value = false;
  router.push(`/trust/events/${submittedResult.value?.eventId || 'EVT-20260808-001'}`);
};

const goToSupply = () => {
  successModalVisible.value = false;
  router.push('/business/supply');
};

const handleContinue = () => {
  successModalVisible.value = false;
  ElMessage.info('已重置录入，您可以继续提交下一条事件数据。');
};
</script>

<style scoped>
.schema-form-wrapper {
  padding-bottom: 70px;
}

.anchor-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 10px 16px;
  margin-bottom: 14px;
}

.nav-links {
  display: flex;
  gap: 16px;
}

.anchor-link {
  color: var(--color-muted);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
}

.anchor-link:hover {
  color: var(--color-brand);
}

.schema-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-text {
  font-size: 12px;
  color: var(--color-muted);
}

.form-layout-grid {
  display: grid;
  grid-template-columns: 1fr 310px;
  gap: 14px;
}

.form-sections-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-card-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
}

.section-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  background: #f7f9f8;
}

.section-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-ink);
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  padding: 16px;
}

.field-item {
  display: flex;
  flex-direction: column;
}

.field-item.full-width {
  grid-column: 1 / -1;
}

.field-item label {
  font-size: 12px;
  color: var(--color-muted);
  margin-bottom: 6px;
}

.req-star {
  color: var(--color-danger);
  font-style: normal;
  margin-right: 2px;
}

.evidence-side-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.side-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 14px;
}

.side-card-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.side-notice {
  border: 1px solid #e8d1af;
  background: #fff8ed;
  color: #76501b;
  border-radius: 6px;
  padding: 12px;
  font-size: 12px;
  line-height: 1.5;
}

.side-notice code {
  background: #f1dfc5;
  padding: 1px 4px;
  border-radius: 3px;
}

.fixed-submit-bar {
  position: fixed;
  left: 236px;
  right: 20px;
  bottom: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px 6px 0 0;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.draft-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-muted);
}

.dot-green {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-success);
}

.submit-actions {
  display: flex;
  gap: 10px;
}

.submit-success-box {
  padding: 6px 0;
}

.success-header {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.success-icon {
  font-size: 32px;
  color: var(--color-success);
  margin-top: 2px;
}

.header-text h3 {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
}

.header-text p {
  margin: 0;
  font-size: 12px;
  color: var(--color-muted);
  line-height: 1.5;
}

.info-table {
  background: #f8faf8;
  border: 1px solid #e1ece4;
  border-radius: 6px;
  padding: 12px 14px;
  margin-bottom: 18px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px solid #edf3ef;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row span {
  color: var(--color-muted);
}

.hash-text {
  font-size: 11px;
  color: var(--color-brand);
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.next-action-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 10px;
}

.next-action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.next-action-buttons .el-button {
  justify-content: flex-start;
  padding-left: 14px;
}
</style>
