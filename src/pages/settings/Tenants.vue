<template>
  <div class="settings-page">
    <PageHeader
      title="多租户管理"
      subtitle="中药产业链各参与方（种植基地、加工药企、质检机构、商贸中心）多租户隔离与资源配额管控"
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
          <strong class="mono">{{ tenants.length }}</strong>
          <span class="unit">家</span>
        </div>
        <span class="sub">均通过企业统一信用代码实名验真</span>
      </div>

      <div class="kpi-card">
        <span class="label">正常运行租户</span>
        <div class="value">
          <strong class="mono brand-color">{{ activeTenantsCount }}</strong>
          <span class="unit">家活跃</span>
        </div>
        <span class="sub">数据隔离级别：逻辑集群与SCHEMA隔离</span>
      </div>

      <div class="kpi-card">
        <span class="label">已下发账号配额总数</span>
        <div class="value">
          <strong class="mono">{{ totalUserQuota }}</strong>
          <span class="unit">个席位</span>
        </div>
        <span class="sub">支持动态扩容与多级分发</span>
      </div>

      <div class="kpi-card">
        <span class="label">全域存储配额</span>
        <div class="value">
          <strong class="mono">{{ totalStorageQuota }}</strong>
          <span class="unit">GB</span>
        </div>
        <span class="sub">含电子存证、附件与质检大文件</span>
      </div>
    </div>

    <!-- Filter Bar -->
    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-input
        v-model="keyword"
        placeholder="租户编码 / 机构全称 / 联系人"
        style="width: 260px"
        clearable
      />
      <el-select v-model="statusFilter" placeholder="运行状态" style="width: 140px" clearable>
        <el-option label="全部状态" value="" />
        <el-option label="正常 (ACTIVE)" value="ACTIVE" />
        <el-option label="冻结 (SUSPENDED)" value="SUSPENDED" />
      </el-select>
    </FilterBar>

    <!-- Tenants Table Panel -->
    <div class="panel">
      <div class="panel-header">
        <h2>协同租户列表 ({{ filteredTenants.length }})</h2>
        <span class="sub-text">支持对租户进行生命周期启停、配额分配及管理员重置</span>
      </div>
      <div class="panel-body">
        <el-table :data="filteredTenants" v-loading="loading" style="width: 100%" empty-text="暂无匹配的租户记录">
          <el-table-column prop="tenantCode" label="租户编码" min-width="140" class-name="mono">
            <template #default="{ row }">
              <span class="tenant-code-text">{{ row.tenantCode }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="tenantName" label="机构/企业全称" min-width="220" show-overflow-tooltip />
          <el-table-column prop="creditCode" label="统一社会信用代码" min-width="190" class-name="mono" />
          <el-table-column label="联系人 / 电话" min-width="160">
            <template #default="{ row }">
              <span>{{ row.contactName }} ({{ row.contactPhone }})</span>
            </template>
          </el-table-column>
          <el-table-column prop="adminAccount" label="主管理员" width="130" class-name="mono" />
          <el-table-column label="配额分配" width="140">
            <template #default="{ row }">
              <span class="mono">{{ row.quotaUsers }}人 / {{ row.quotaStorageGb }}GB</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <StatusTag :code="row.status" />
            </template>
          </el-table-column>
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
                {{ row.status === 'ACTIVE' ? '冻结' : '启用' }}
              </el-button>
              <el-button size="small" type="danger" link @click="confirmDelete(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
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
          <el-input v-model="form.tenantCode" placeholder="如 YN_TCM_COOP (唯一大写标识)" :disabled="isEditing" />
        </el-form-item>
        <el-form-item label="机构/企业全称" prop="tenantName">
          <el-input v-model="form.tenantName" placeholder="如 云南中药产业发展有限公司" />
        </el-form-item>
        <div class="form-row-two">
          <el-form-item label="机构类型" prop="tenantType" style="flex: 1">
            <el-select v-model="form.tenantType" placeholder="请选择机构业务类型">
              <el-option label="示范联盟/平台 (PLATFORM)" value="PLATFORM" />
              <el-option label="中药材种植加工生产方 (PRODUCER)" value="PRODUCER" />
              <el-option label="中药饮片交割商贸方 (EXCHANGE)" value="EXCHANGE" />
              <el-option label="第三方检验检测中心 (INSPECTION)" value="INSPECTION" />
              <el-option label="医疗机构/处方调剂方 (HOSPITAL)" value="HOSPITAL" />
            </el-select>
          </el-form-item>
          <el-form-item label="统一社会信用代码" prop="creditCode" style="flex: 1">
            <el-input v-model="form.creditCode" placeholder="18位企业法人代码" maxlength="18" />
          </el-form-item>
        </div>
        <div class="form-row-two">
          <el-form-item label="联系人姓名" prop="contactName" style="flex: 1">
            <el-input v-model="form.contactName" placeholder="负责人姓名" />
          </el-form-item>
          <el-form-item label="联系人电话" prop="contactPhone" style="flex: 1">
            <el-input v-model="form.contactPhone" placeholder="手机号码" />
          </el-form-item>
        </div>
        <div class="form-row-two">
          <el-form-item label="主管理员账号" prop="adminAccount" style="flex: 1">
            <el-input v-model="form.adminAccount" placeholder="初始管理登录账号" :disabled="isEditing" />
          </el-form-item>
          <el-form-item label="初始运行状态" style="flex: 1">
            <el-select v-model="form.status">
              <el-option label="正常运行 (ACTIVE)" value="ACTIVE" />
              <el-option label="暂停冻结 (SUSPENDED)" value="SUSPENDED" />
            </el-select>
          </el-form-item>
        </div>
        <div class="form-row-two">
          <el-form-item label="账号上限 (人)" prop="quotaUsers" style="flex: 1">
            <el-input-number v-model="form.quotaUsers" :min="1" :max="5000" style="width: 100%" />
          </el-form-item>
          <el-form-item label="存储空间 (GB)" prop="quotaStorageGb" style="flex: 1">
            <el-input-number v-model="form.quotaStorageGb" :min="10" :max="50000" style="width: 100%" />
          </el-form-item>
        </div>
        <el-form-item label="机构简介与备注">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="涵盖业务职能（如GAP种植、饮片炮制、第三方质检、仓储冷链物流等）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">保存提交</el-button>
      </template>
    </el-dialog>

    <!-- Detail Drawer -->
    <el-drawer v-model="drawerVisible" title="租户详细信息与资源配额" size="520px">
      <div v-if="activeTenant" class="drawer-detail">
        <div class="detail-header-card">
          <div class="tenant-title">{{ activeTenant.tenantName }}</div>
          <div class="tenant-meta mono">ID: {{ activeTenant.id }} | 编码: {{ activeTenant.tenantCode }}</div>
        </div>

        <div class="detail-sec">
          <h4>企业资质与负责人</h4>
          <div class="kv-list">
            <div class="kv-item"><span>统一社会信用代码:</span> <strong class="mono">{{ activeTenant.creditCode }}</strong></div>
            <div class="kv-item"><span>负责人姓名:</span> <strong>{{ activeTenant.contactName }}</strong></div>
            <div class="kv-item"><span>联系方式:</span> <strong>{{ activeTenant.contactPhone }}</strong></div>
            <div class="kv-item"><span>主管理员账号:</span> <strong class="mono">{{ activeTenant.adminAccount }}</strong></div>
          </div>
        </div>

        <div class="detail-sec">
          <h4>资源配额与服务状态</h4>
          <div class="kv-list">
            <div class="kv-item"><span>当前运行状态:</span> <StatusTag :code="activeTenant.status" /></div>
            <div class="kv-item"><span>用户席位配额:</span> <strong>{{ activeTenant.quotaUsers }} 人</strong></div>
            <div class="kv-item"><span>专属文件存储空间:</span> <strong>{{ activeTenant.quotaStorageGb }} GB</strong></div>
            <div class="kv-item"><span>入驻接入时间:</span> <span class="mono">{{ activeTenant.createdAt }}</span></div>
          </div>
        </div>

        <div class="detail-sec">
          <h4>机构业务描述</h4>
          <div class="desc-box">{{ activeTenant.description || '暂无详细描述' }}</div>
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

const tenants = ref<TenantItem[]>([]);
const loading = ref(false);
const submitting = ref(false);
const keyword = ref('');
const statusFilter = ref('');

const dialogVisible = ref(false);
const drawerVisible = ref(false);
const isEditing = ref(false);
const activeTenant = ref<TenantItem | null>(null);

const formRef = ref<FormInstance>();
const form = ref<Partial<TenantItem>>({
  tenantCode: '',
  tenantName: '',
  creditCode: '',
  contactName: '',
  contactPhone: '',
  adminAccount: '',
  quotaUsers: 50,
  quotaStorageGb: 500,
  status: 'ACTIVE',
  description: ''
});

const rules = {
  tenantCode: [{ required: true, message: '请输入租户编码', trigger: 'blur' }],
  tenantName: [{ required: true, message: '请输入机构/企业全称', trigger: 'blur' }],
  creditCode: [{ required: true, message: '请输入统一社会信用代码', trigger: 'blur' }],
  contactName: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  adminAccount: [{ required: true, message: '请输入主管理员账号', trigger: 'blur' }]
};

const activeTenantsCount = computed(() => tenants.value.filter(t => t.status === 'ACTIVE').length);
const totalUserQuota = computed(() => tenants.value.reduce((acc, cur) => acc + (cur.quotaUsers || 0), 0));
const totalStorageQuota = computed(() => tenants.value.reduce((acc, cur) => acc + (cur.quotaStorageGb || 0), 0));

const filteredTenants = computed(() => {
  return tenants.value.filter(item => {
    if (keyword.value) {
      const q = keyword.value.trim().toLowerCase();
      const m1 = (item.tenantCode || '').toLowerCase().includes(q);
      const m2 = (item.tenantName || '').toLowerCase().includes(q);
      const m3 = (item.contactName || '').toLowerCase().includes(q);
      if (!m1 && !m2 && !m3) return false;
    }
    if (statusFilter.value && item.status !== statusFilter.value) {
      return false;
    }
    return true;
  });
});

const loadTenants = async () => {
  loading.value = true;
  try {
    tenants.value = await rbacApi.getTenants({
      tenantName: keyword.value,
      status: statusFilter.value,
      page: 1,
      size: 100
    });
  } catch (err) {
    console.error('Failed to load tenants', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadTenants();
});

const handleSearch = () => {
  loadTenants();
};

const handleReset = () => {
  keyword.value = '';
  statusFilter.value = '';
  loadTenants();
};

const openCreateDialog = () => {
  isEditing.value = false;
  form.value = {
    tenantCode: '',
    tenantName: '',
    tenantType: 'PRODUCER',
    creditCode: '',
    contactName: '',
    contactPhone: '',
    adminAccount: '',
    quotaUsers: 50,
    quotaStorageGb: 500,
    status: 'ACTIVE',
    description: ''
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
    console.warn('Fallback to local detail', e);
  }
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      if (isEditing.value && form.value.id) {
        await rbacApi.updateTenant(form.value.id, form.value);
        ElMessage.success(`租户 [${form.value.tenantName}] 信息更新成功！`);
      } else {
        await rbacApi.createTenant(form.value as any);
        ElMessage.success(`新租户 [${form.value.tenantName}] 创建成功并已分配独立空间！`);
      }
      dialogVisible.value = false;
      await loadTenants();
    } catch (err) {
      ElMessage.error('保存失败，请检查填写内容');
    } finally {
      submitting.value = false;
    }
  });
};

const toggleStatus = async (row: TenantItem) => {
  const nextStatus = row.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
  const label = nextStatus === 'ACTIVE' ? '启用' : '冻结';
  await rbacApi.updateTenant(row.id, { status: nextStatus });
  row.status = nextStatus;
  ElMessage.success(`租户 [${row.tenantName}] 状态已调整为: ${label}`);
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
    await rbacApi.deleteTenant(row.id);
    ElMessage.success(`租户 [${row.tenantName}] 已彻底删除`);
    await loadTenants();
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
