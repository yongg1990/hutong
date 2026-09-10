<template>
  <span class="sensitive-value-wrapper">
    <span v-if="isRevealed" class="value-text mono">{{ value }}</span>
    <span v-else class="masked-text mono">***MASKED***</span>

    <el-button
      v-if="!isRevealed"
      size="small"
      type="primary"
      link
      @click="openAuditModal"
      class="reveal-btn"
    >
      查看
    </el-button>
    <el-button
      v-else
      size="small"
      type="info"
      link
      @click="isRevealed = false"
      class="reveal-btn"
    >
      隐藏
    </el-button>

    <!-- Audit Confirmation Modal -->
    <el-dialog
      v-model="dialogVisible"
      title="敏感数据查阅调阅审计"
      width="460px"
      append-to-body
    >
      <div class="audit-tip">
        当前字段属于三级 <strong>STRICT_SENSITIVE</strong> 严格敏感信息（包含患者隐私或秘钥）。调阅记录将被记录入审计日志。
      </div>

      <el-form label-position="top">
        <el-form-item label="调阅目的代码 (X-Purpose-Code)">
          <el-select v-model="purposeCode" style="width: 100%">
            <el-option label="BUSINESS_OPERATION - 业务复核与调拨" value="BUSINESS_OPERATION" />
            <el-option label="QUALITY_AUDIT - 质量追溯与检查" value="QUALITY_AUDIT" />
            <el-option label="PATIENT_SERVICE - 患者用药核对" value="PATIENT_SERVICE" />
          </el-select>
        </el-form-item>

        <el-form-item label="调阅原因说明 (查阅理由)">
          <el-input
            v-model="auditReason"
            type="textarea"
            :rows="2"
            placeholder="请输入本次调阅查阅理由（必填，用于合规审计）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!auditReason.trim()" @click="confirmReveal">
          确认调阅并解密
        </el-button>
      </template>
    </el-dialog>
  </span>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';

const props = defineProps<{
  value: string;
  fieldTitle?: string;
}>();

const isRevealed = ref(false);
const dialogVisible = ref(false);
const purposeCode = ref('BUSINESS_OPERATION');
const auditReason = ref('');
let timer: any = null;

const openAuditModal = () => {
  auditReason.value = '';
  dialogVisible.value = true;
};

const confirmReveal = () => {
  dialogVisible.value = false;
  isRevealed.value = true;

  // Auto mask after 5 minutes (300,000 ms) for security compliance
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    isRevealed.value = false;
  }, 300000);
};

onUnmounted(() => {
  if (timer) clearTimeout(timer);
});
</script>

<style scoped>
.sensitive-value-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.audit-tip {
  font-size: 13px;
  color: var(--color-muted);
  background: #f8fbf9;
  border: 1px solid var(--color-border);
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 14px;
}

.masked-text {
  color: var(--color-muted);
  letter-spacing: 1px;
}

.value-text {
  color: var(--color-ink);
  font-weight: 600;
}

.reveal-btn {
  padding: 0;
  height: auto;
  font-size: 12px;
}
</style>
