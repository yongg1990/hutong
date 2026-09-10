<template>
  <div class="h-full flex flex-col gap-4">
    <PageHeader
      title="互通规范包"
      subtitle="定义不同业务场景与外部系统的交换数据标准、一致性映射与脱敏规则"
    >
      <template #actions>
        <el-button type="primary">
          <el-icon class="mr-1"><Plus /></el-icon>
          新建规范包
        </el-button>
      </template>
    </PageHeader>

    <!-- Top Panel: Profile List -->
    <div class="bg-white border border-gray-200 rounded-md shadow-sm flex-none overflow-hidden">
      <div class="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div class="font-medium text-gray-700">规范包列表</div>
      </div>
      <el-table 
        :data="profiles" 
        highlight-current-row
        @current-change="handleProfileSelect"
        style="width: 100%"
        stripe
      >
        <el-table-column prop="profileCode" label="规范包编号" width="160" class-name="mono text-gray-600" />
        <el-table-column prop="name" label="规范包名称" min-width="240" class-name="font-medium text-gray-800" />
        <el-table-column prop="version" label="版本信息" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="info">v{{ row.version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dataset" label="关联数据集" min-width="220" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :code="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link>编辑</el-button>
            <el-button size="small" type="primary" link>版本历史</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Bottom Panel: Field Rules Table (Consistency Mapping) -->
    <div v-if="selectedProfile" class="bg-white border border-gray-200 rounded-md shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
      <div class="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 flex-none">
        <div class="flex items-center gap-3">
          <span class="font-medium text-gray-700">字段规则表 (一致性映射)</span>
          <span class="text-sm text-gray-500">当前选择: <span class="font-semibold text-gray-700">{{ selectedProfile.name }}</span></span>
        </div>
        <el-button size="small">导入规则...</el-button>
      </div>
      
      <div class="flex-1 overflow-auto p-4">
        <el-table :data="selectedProfile.rules" style="width: 100%" border size="small">
          <el-table-column prop="targetPath" label="目标字段 (targetPath)" width="180" class-name="mono font-semibold text-gray-700" />
          <el-table-column prop="dataElement" label="数据元" width="160" />
          <el-table-column prop="sourceSelector" label="源选择器 (sourceSelector)" width="220" class-name="mono text-gray-500 text-xs" />
          
          <el-table-column prop="transform" label="转换规则" width="150">
            <template #default="{ row }">
              <span v-if="row.transform === 'None'" class="text-gray-400">无 (直传)</span>
              <span v-else class="text-blue-600 font-medium">{{ row.transform }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="required" label="必选" width="70" align="center">
            <template #default="{ row }">
              <el-icon v-if="row.required" class="text-red-500 font-bold"><Check /></el-icon>
              <span v-else class="text-gray-300">-</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="missingStrategy" label="缺失策略" width="120">
            <template #default="{ row }">
              <el-tag size="small" :type="row.missingStrategy === 'REJECT' ? 'danger' : 'info'">
                {{ row.missingStrategy }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="valueDomain" label="值域" min-width="160" class-name="text-gray-600 text-sm" />
          
          <el-table-column prop="securityLevel" label="安全级别" width="120" fixed="right">
            <template #default="{ row }">
              <span :class="{
                'text-green-600 font-medium': (row.securityLevel || '').includes('L1'),
                'text-orange-500 font-medium': (row.securityLevel || '').includes('L2'),
                'text-red-600 font-semibold': (row.securityLevel || '').includes('L3') || (row.securityLevel || '').includes('L4'),
              }">
                {{ row.securityLevel || 'L1 (公开)' }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    
    <div v-else class="bg-gray-50 border border-dashed border-gray-300 rounded-md flex-1 flex items-center justify-center min-h-[200px] text-gray-400">
      <div class="text-center">
        <el-icon class="text-3xl mb-2"><Pointer /></el-icon>
        <p>点击上方列表中的规范包，查看详细字段映射规则</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus, Check, Pointer } from '@element-plus/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { exchangeApi } from '@/api/exchange';

interface FieldRule {
  targetPath: string;
  dataElement: string;
  sourceSelector: string;
  transform: string;
  required: boolean;
  missingStrategy: string;
  valueDomain: string;
  securityLevel: string;
}

interface Profile {
  id: string;
  profileCode: string;
  name: string;
  version: string;
  dataset: string;
  status: string;
  rules: FieldRule[];
}

const profiles = ref<Profile[]>([]);
const loading = ref(false);

const loadProfiles = async () => {
  loading.value = true;
  try {
    const res = await exchangeApi.getProfiles();
    profiles.value = res as Profile[];
    if (res.length > 0 && !selectedProfile.value) {
      selectedProfile.value = res[0] as Profile;
    }
  } catch (err) {
    console.error('Failed to load profiles', err);
  } finally {
    loading.value = false;
  }
};

const selectedProfile = ref<Profile | null>(null);

const handleProfileSelect = (val: Profile | undefined) => {
  selectedProfile.value = val || null;
};

onMounted(() => {
  loadProfiles();
});
</script>

<style scoped>
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>
