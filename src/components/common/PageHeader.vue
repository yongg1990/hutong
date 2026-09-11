<template>
  <div class="page-header">
    <div class="header-titles">
      <div class="title-wrap">
        <span class="title-accent-bar"></span>
        <h1>{{ title }}</h1>

        <!-- Page API Integration Badge -->
        <div v-if="showApiBadge && effectiveApiInfo?.hasApi" class="api-status-badge">
          <el-popover
            placement="bottom-start"
            :width="460"
            trigger="hover"
            popper-class="api-header-popover"
            :show-after="100"
          >
            <template #reference>
              <div class="api-badge-pill" :title="`页面已对接接口: ${effectiveApiInfo.apiPath}`">
                <span class="api-pulse-dot"></span>
                <span class="api-badge-label">已对接接口</span>
                <span class="api-path-chip mono">{{ effectiveApiInfo.apiPath }}</span>
                <el-icon class="api-arrow-icon"><ArrowRight /></el-icon>
              </div>
            </template>

            <div class="api-popover-card">
              <div class="popover-header">
                <div class="popover-title-row">
                  <span class="popover-pulse-dot"></span>
                  <span class="popover-title">{{ effectiveApiInfo.moduleName }}</span>
                  <span class="popover-status-badge">已联调对接</span>
                </div>
                <span class="popover-spec-badge">OpenAPI v3</span>
              </div>

              <div class="popover-meta-box">
                <div class="meta-row">
                  <span class="meta-k">接口规范路径:</span>
                  <span class="meta-v mono">{{ effectiveApiInfo.apiPath }}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-k">调用规范协议:</span>
                  <span class="meta-v">{{ effectiveApiInfo.protocol }} ({{ effectiveApiInfo.specDoc }})</span>
                </div>
                <div class="meta-row">
                  <span class="meta-k">网关运行模式:</span>
                  <span class="meta-v highlight">真实 Swagger API 网关优先 + 降级容灾保障</span>
                </div>
              </div>

              <div class="popover-endpoints-section">
                <div class="endpoints-heading">
                  <span>页面核心交互端点</span>
                  <span class="endpoint-count">共 {{ effectiveApiInfo.endpoints.length }} 个接口</span>
                </div>
                <div class="endpoints-list">
                  <div
                    v-for="ep in effectiveApiInfo.endpoints"
                    :key="ep.method + ep.path"
                    class="endpoint-row"
                  >
                    <span class="method-tag" :class="'method-' + ep.method.toLowerCase()">
                      {{ ep.method }}
                    </span>
                    <span class="endpoint-path mono">{{ ep.path }}</span>
                    <span class="endpoint-desc">{{ ep.desc }}</span>
                  </div>
                </div>
              </div>

              <div class="popover-footer-tip">
                <el-icon style="margin-right: 4px;"><InfoFilled /></el-icon>
                <span>数据交互已对接实际后端控制器，支持动态数据提交与区块链存证溯源。</span>
              </div>
            </div>
          </el-popover>
        </div>
      </div>
      <div class="subtitle" v-if="subtitle">{{ subtitle }}</div>
    </div>
    <div class="header-actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowRight, InfoFilled } from '@element-plus/icons-vue';
import { getPageApiInfo, type PageApiInfo } from '@/config/pageApiRegistry';

const props = withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    showApiBadge?: boolean;
    apiInfo?: PageApiInfo | null;
  }>(),
  {
    showApiBadge: false,
    apiInfo: undefined
  }
);

const route = useRoute();

const effectiveApiInfo = computed(() => {
  if (props.apiInfo !== undefined) {
    return props.apiInfo;
  }
  return getPageApiInfo(route.path);
});
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
  padding-bottom: 4px;
}

.header-titles {
  display: flex;
  flex-direction: column;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.title-accent-bar {
  width: 4px;
  height: 22px;
  background: var(--color-brand);
  border-radius: 2px;
  flex-shrink: 0;
}

.header-titles h1 {
  font-size: 20px;
  line-height: 26px;
  margin: 0;
  font-weight: 700;
  color: var(--color-ink);
  letter-spacing: -0.2px;
}

/* API Status Badge on Page */
.api-status-badge {
  display: inline-flex;
  align-items: center;
  user-select: none;
}

.api-badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 16px;
  padding: 3px 10px 3px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.api-badge-pill:hover {
  background-color: #d1fae5;
  border-color: #6ee7b7;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(19, 115, 78, 0.12);
}

.api-pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
  animation: pulse 2s infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5);
  }
  70% {
    box-shadow: 0 0 0 5px rgba(16, 185, 129, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.api-badge-label {
  font-size: 11.5px;
  font-weight: 600;
  color: #065f46;
}

.api-path-chip {
  font-size: 11px;
  color: #047857;
  background-color: #ffffff;
  padding: 1px 6px;
  border-radius: 10px;
  border: 1px solid #a7f3d0;
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.api-arrow-icon {
  font-size: 11px;
  color: #059669;
  margin-left: -2px;
}

.subtitle {
  color: var(--color-muted);
  font-size: 12.5px;
  margin-top: 5px;
  padding-left: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>

<style>
/* Global styling for the API popover card */
.api-header-popover {
  padding: 14px 16px !important;
  border-radius: 8px !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05) !important;
  border: 1px solid #d1fae5 !important;
}

.api-popover-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0fdf4;
}

.popover-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.popover-pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #10b981;
}

.popover-title {
  font-size: 13.5px;
  font-weight: 700;
  color: #065f46;
}

.popover-status-badge {
  font-size: 10.5px;
  font-weight: 600;
  background-color: #d1fae5;
  color: #047857;
  padding: 1px 6px;
  border-radius: 4px;
}

.popover-spec-badge {
  font-size: 10.5px;
  background-color: #f1f5f9;
  color: #475569;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.popover-meta-box {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.meta-row {
  display: flex;
  font-size: 11.5px;
  line-height: 1.4;
}

.meta-k {
  width: 90px;
  color: #64748b;
  flex-shrink: 0;
}

.meta-v {
  color: #1e293b;
  word-break: break-all;
}

.meta-v.highlight {
  color: #047857;
  font-weight: 600;
}

.popover-endpoints-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.endpoints-heading {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}

.endpoint-count {
  font-size: 11px;
  color: #94a3b8;
  font-weight: normal;
}

.endpoints-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 160px;
  overflow-y: auto;
  border: 1px solid #f1f5f9;
  border-radius: 6px;
  background-color: #fafbfc;
  padding: 4px;
}

.endpoint-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  background: #ffffff;
  border-radius: 4px;
  border: 1px solid #f1f5f9;
  font-size: 11px;
}

.method-tag {
  font-size: 9.5px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
  width: 42px;
  text-align: center;
  flex-shrink: 0;
}

.method-get {
  background-color: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.method-post {
  background-color: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.method-put {
  background-color: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}

.method-delete {
  background-color: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.endpoint-path {
  color: #334155;
  font-size: 10.5px;
  flex-shrink: 0;
}

.endpoint-desc {
  color: #64748b;
  font-size: 10.5px;
  margin-left: auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.popover-footer-tip {
  display: flex;
  align-items: center;
  font-size: 10.5px;
  color: #059669;
  background-color: #f0fdf4;
  padding: 5px 8px;
  border-radius: 4px;
}
</style>
