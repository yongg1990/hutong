<template>
  <div class="settings-page">
    <PageHeader
      title="多租户管理"
      subtitle="中药产业链参与方的租户信息与生命周期管理"
    >
      <template #actions>
        <el-button @click="loadTenants">刷新列表</el-button>
        <el-button type="primary" @click="openCreateDialog">
          + 新增租户机构
        </el-button>
      </template>
    </PageHeader>

    <!-- Top KPI Row -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="label">入驻租户机构总数</span>
        <div class="value">
          <strong class="mono">{{ total }}</strong>
          <span class="unit">家</span>
        </div>
      </div>

      <div class="kpi-card">
        <span class="label">本页正常运行租户</span>
        <div class="value">
          <strong class="mono brand-color">{{ activeTenantsCount }}</strong>
          <span class="unit">家活跃</span>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-input
        v-model="keyword"
        placeholder="租户名称关键字"
        style="width: 260px"
        clearable
      />
    </FilterBar>

    <!-- Tenants Table Panel -->
    <div class="panel">
      <div class="panel-header">
        <h2>协同租户列表 ({{ total }})</h2>
      </div>
      <div class="panel-body">
        <el-table :data="tenants" v-loading="loading" style="width: 100%" empty-text="暂无匹配的租户记录">
          <el-table-column prop="id" label="租户 ID" width="110" class-name="mono" />
          <el-table-column prop="tenantCode" label="租户编码" min-width="140" class-name="mono">
            <template #default="{ row }">
              <span class="tenant-code-text">{{ row.tenantCode }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="tenantName" label="机构/企业全称" min-width="220" show-overflow-tooltip />
          <el-table-column prop="tenantType" label="租户类型" width="130" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <StatusTag :code="row.status" :label="row.status === 'ACTIVE' ? '启用' : row.status === 'INACTIVE' ? '停用' : row.status" />
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="170" />
          <el-table-column prop="updatedAt" label="更新时间" width="170" />
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="openEditDialog(row)">
                编辑
              </el-button>
              <el-button size="small" link @click="viewDetail(row)">
                详情
              </el-button>
              <el-button
                size="small"
                :type="row.status === 'ACTIVE' ? 'warning' : 'success'"
                link
                @click="toggleStatus(row)"
              >
                {{ row.status === 'ACTIVE' ? '停用' : '启用' }}
              </el-button>
              <el-button size="small" type="danger" link @click="confirmDelete(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-row">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next"
            @current-change="loadTenants"
            @size-change="handleSizeChange"
          />
        </div>
      </div>
    </div>

    <!-- Create / Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑租户机构信息' : '新增入驻租户机构'"
      width="640px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="130px" label-position="right">
        <el-form-item label="租户编码" prop="tenantCode">
          <el-input v-model="form.tenantCode" placeholder="可选，留空由服务端生成" :disabled="isEditing" />
        </el-form-item>
        <el-form-item label="机构/企业全称" prop="tenantName">
          <el-input v-model="form.tenantName" placeholder="如 云南中药产业发展有限公司" />
        </el-form-item>
        <el-form-item label="机构类型" prop="tenantType">
            <el-select v-model="form.tenantType" placeholder="请选择机构业务类型">
              <el-option label="示范联盟/平台 (PLATFORM)" value="PLATFORM" />
              <el-option label="中药材种植加工生产方 (PRODUCER)" value="PRODUCER" />
              <el-option label="中药饮片交割商贸方 (EXCHANGE)" value="EXCHANGE" />
              <el-option label="第三方检验检测中心 (INSPECTION)" value="INSPECTION" />
              <el-option label="医疗机构/处方调剂方 (HOSPITAL)" value="HOSPITAL" />
            </el-select>
        </el-form-item>
        <el-form-item v-if="isEditing" label="运行状态">
            <el-select v-model="form.status">
              <el-option label="正常运行 (ACTIVE)" value="ACTIVE" />
              <el-option label="停用 (INACTIVE)" value="INACTIVE" />
            </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">保存提交</el-button>
      </template>
    </el-dialog>

    <!-- Detail Drawer -->
    <el-drawer v-model="drawerVisible" title="租户详细信息" size="520px">
      <div v-if="activeTenant" class="drawer-detail">
        <div class="detail-header-card">
          <div class="tenant-title">{{ activeTenant.tenantName }}</div>
          <div class="tenant-meta mono">ID: {{ activeTenant.id }} | 编码: {{ activeTenant.tenantCode }}</div>
        </div>

        <div class="detail-sec">
          <h4>租户信息</h4>
          <div class="kv-list">
            <div class="kv-item"><span>租户类型:</span> <strong>{{ activeTenant.tenantType }}</strong></div>
            <div class="kv-item"><span>当前状态:</span> <StatusTag :code="activeTenant.status" :label="activeTenant.status === 'ACTIVE' ? '启用' : '停用'" /></div>
          </div>
        </div>

        <div class="detail-sec">
          <h4>时间信息</h4>
          <div class="kv-list">
            <div class="kv-item"><span>创建时间:</span> <span class="mono">{{ activeTenant.createdAt }}</span></div>
            <div class="kv-item"><span>更新时间:</span> <span class="mono">{{ activeTenant.updatedAt || '-' }}</span></div>
          </div>
        </div>

        <div style="margin-top: 24px; display: flex; gap: 10px;">
          <el-button type="primary" plain style="flex: 1" @click="openEditDialog(activeTenant)">
            修改此租户配置
          </el-button>
          <el-button style="flex: 1" @click="drawerVisible = false">
            关闭
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { rbacApi, type TenantItem } from '@/api/rbac';
import { apiErrorMessage } from '@/api/client';

const tenants = ref<TenantItem[]>([]);
const loading = ref(false);
const submitting = ref(false);
const keyword = ref('');
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

const dialogVisible = ref(false);
const drawerVisible = ref(false);
const isEditing = ref(false);
const activeTenant = ref<TenantItem | null>(null);

const formRef = ref<FormInstance>();
const form = ref<Partial<TenantItem>>({
  tenantCode: '',
  tenantName: '',
  tenantType: 'PRODUCER',
  status: 'ACTIVE'
});

const rules = {
  tenantName: [{ required: true, message: '请输入机构/企业全称', trigger: 'blur' }],
  tenantType: [{ required: true, message: '请选择机构类型', trigger: 'change' }]
};

const activeTenantsCount = computed(() => tenants.value.filter(t => t.status === 'ACTIVE').length);
const loadTenants = async () => {
  loading.value = true;
  try {
    const result = await rbacApi.getTenantPage({
      tenantName: keyword.value,
      page: page.value,
      size: pageSize.value
    });
    tenants.value = result.records;
    total.value = result.total;
    page.value = result.page;
    pageSize.value = result.size;
  } catch (err) {
    tenants.value = [];
    total.value = 0;
    ElMessage.error(apiErrorMessage(err, '租户列表加载失败'));
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadTenants();
});

const handleSearch = () => {
  page.value = 1;
  loadTenants();
};

const handleReset = () => {
  keyword.value = '';
  page.value = 1;
  loadTenants();
};

const handleSizeChange = () => {
  page.value = 1;
  loadTenants();
};

const openCreateDialog = () => {
  isEditing.value = false;
  form.value = {
    tenantCode: '',
    tenantName: '',
    tenantType: 'PRODUCER',
    status: 'ACTIVE'
  };
  dialogVisible.value = true;
};

const openEditDialog = (row: TenantItem) => {
  isEditing.value = true;
  form.value = { ...row };
  if (drawerVisible.value) drawerVisible.value = false;
  dialogVisible.value = true;
};

const viewDetail = async (row: TenantItem) => {
  activeTenant.value = row;
  drawerVisible.value = true;
  try {
    const detail = await rbacApi.getTenantById(row.id);
    if (detail) {
      activeTenant.value = { ...row, ...detail };
    }
  } catch (e) {
    ElMessage.error(apiErrorMessage(e, '租户详情加载失败'));
  }
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      const data = { tenantName: form.value.tenantName!, tenantType: form.value.tenantType! };
      if (isEditing.value && form.value.id != null) {
        await rbacApi.updateTenant(form.value.id, { ...data, status: form.value.status });
        ElMessage.success(`租户 [${form.value.tenantName}] 信息更新成功！`);
      } else {
        await rbacApi.createTenant({ ...data, tenantCode: form.value.tenantCode || '' });
        ElMessage.success(`新租户 [${form.value.tenantName}] 创建成功！`);
      }
      dialogVisible.value = false;
      await loadTenants();
    } catch (err) {
      ElMessage.error(apiErrorMessage(err, '保存失败，请检查填写内容'));
    } finally {
      submitting.value = false;
    }
  });
};

const toggleStatus = async (row: TenantItem) => {
  const nextStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const label = nextStatus === 'ACTIVE' ? '启用' : '停用';
  try {
    await rbacApi.updateTenant(row.id, { tenantName: row.tenantName, tenantType: row.tenantType || '', status: nextStatus });
    ElMessage.success(`租户 [${row.tenantName}] 已${label}`);
    await loadTenants();
  } catch (err) {
    ElMessage.error(apiErrorMessage(err, `租户${label}失败`));
  }
};

const confirmDelete = (row: TenantItem) => {
  ElMessageBox.confirm(
    `确定要注销并删除租户机构【${row.tenantName}】吗？删除后该租户下所有项目空间与用户账号将被停用。`,
    '确认删除租户',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await rbacApi.deleteTenant(row.id);
      ElMessage.success(`租户 [${row.tenantName}] 已删除`);
      await loadTenants();
    } catch (err) {
      ElMessage.error(apiErrorMessage(err, '删除租户失败'));
    }
  }).catch(() => {});
};
</script>

<style scoped>
.settings-page {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding-bottom: 24px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-subtle);
  background: #fbfdfc;
}

.panel-header h2 {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--color-ink);
  margin: 0;
}

.sub-text {
  font-size: 12px;
  color: var(--color-muted);
}

.tenant-code-text {
  font-weight: 700;
  color: var(--color-brand);
}

.form-row-two {
  display: flex;
  gap: 16px;
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
  padding: 14px 0 2px;
}

.drawer-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-header-card {
  background: #edf6f1;
  border: 1px solid #cce5d7;
  border-radius: 6px;
  padding: 14px;
}

.tenant-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-brand);
}

.tenant-meta {
  font-size: 12px;
  color: var(--color-muted);
  margin-top: 4px;
}

.detail-sec h4 {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-ink);
  margin: 0 0 8px;
}

.kv-list {
  background: #f8faf9;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px 12px;
}

.kv-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #edf0ee;
  font-size: 12.5px;
}

.kv-item:last-child {
  border-bottom: none;
}

.kv-item span {
  color: var(--color-muted);
}

.desc-box {
  background: #f8faf9;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text);
}
</style>
