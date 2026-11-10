import { createRouter, createWebHistory } from 'vue-router';
import AppLayout from '@/components/layout/AppLayout.vue';
import Login from '@/pages/auth/Login.vue';
import Workspace from '@/pages/workspace/Workspace.vue';
import PageLoadError from '@/pages/PageLoadError.vue';
import { useAuthStore } from '@/stores/authStore';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      redirect: '/workspace',
      children: [
        {
          path: 'workspace',
          name: 'Workspace',
          component: Workspace
        },
        {
          path: 'page-load-error',
          name: 'PageLoadError',
          component: PageLoadError
        },
        // Business Scenarios
        {
          path: 'business/field',
          name: 'FieldWorkbench',
          component: () => import('@/pages/business/FieldWorkbench.vue')
        },
        {
          path: 'business/process-quality',
          name: 'ProcessQualityWorkbench',
          component: () => import('@/pages/business/ProcessQualityWorkbench.vue')
        },
        {
          path: 'business/coding',
          name: 'CodingWorkbench',
          component: () => import('@/pages/business/CodingWorkbench.vue')
        },
        {
          path: 'business/supply',
          name: 'SupplyWorkbench',
          component: () => import('@/pages/business/SupplyWorkbench.vue')
        },
        {
          path: 'business/decoction',
          name: 'DecoctionWorkbench',
          component: () => import('@/pages/business/DecoctionWorkbench.vue')
        },
        {
          path: 'business/events/new/:eventType?',
          name: 'EventEntry',
          component: () => import('@/pages/business/EventEntry.vue')
        },
        // Governance
        { path: 'governance/data-elements', name: 'GovernanceDataElements', component: () => import('@/pages/governance/DataElements.vue') },
        { path: 'governance/value-sets', name: 'GovernanceValueSets', component: () => import('@/pages/governance/ValueSets.vue') },
        { path: 'governance/value-set-mappings', name: 'GovernanceValueSetMappings', component: () => import('@/pages/governance/ValueSetMappings.vue') },
        { path: 'governance/raw-records', name: 'GovernanceRawRecords', component: () => import('@/pages/governance/RawRecords.vue') },
        { path: 'governance/encrypted-ingestion', name: 'GovernanceEncryptedIngestion', component: () => import('@/pages/governance/EncryptedIngestion.vue') },
        { path: 'governance/event-types', name: 'GovernanceEventTypes', component: () => import('@/pages/governance/EventTypes.vue') },
        { path: 'governance/schemas', name: 'GovernanceSchemas', component: () => import('@/pages/governance/Schemas.vue') },
        { path: 'settings/permissions', name: 'SettingsPermissions', component: () => import('@/pages/settings/Permissions.vue') },
        { path: 'settings/uploaded-files', name: 'SettingsUploadedFiles', component: () => import('@/pages/settings/UploadedFiles.vue') },
        { path: 'master-data/trace-codes', name: 'MasterTraceCodes', component: () => import('@/pages/masterdata/TraceCodes.vue') },
        { path: 'exchange/profile-bindings', name: 'ExchangeProfileBindings', component: () => import('@/pages/exchange/ProfileBindings.vue') },
        { path: 'exchange/integration-assistant', name: 'ExchangeIntegrationAssistant', component: () => import('@/pages/exchange/IntegrationAssistant.vue') },
        { path: 'exchange/encrypted-query', name: 'ExchangeEncryptedQuery', component: () => import('@/pages/exchange/EncryptedQuery.vue') },
        { path: 'governance/source-keys', name: 'GovernanceSourceKeys', component: () => import('@/pages/governance/SourceKeys.vue') },
        { path: 'governance/event-authorizations', name: 'GovernanceEventAuthorizations', component: () => import('@/pages/governance/EventAuthorizations.vue') },
        { path: 'governance/integration-assistant', name: 'GovernanceIntegrationAssistant', component: () => import('@/pages/governance/IntegrationAssistant.vue') },
        {
          path: 'governance/sources',
          name: 'GovernanceSources',
          component: () => import('@/pages/governance/Sources.vue')
        },
        {
          path: 'governance/batches',
          name: 'GovernanceBatches',
          component: () => import('@/pages/governance/Batches.vue')
        },
        {
          path: 'governance/mappings',
          name: 'GovernanceMappings',
          component: () => import('@/pages/governance/Mappings.vue')
        },
        {
          path: 'governance/cases',
          name: 'GovernanceCases',
          component: () => import('@/pages/governance/Cases.vue')
        },
        {
          path: 'governance/standards',
          name: 'GovernanceStandards',
          component: () => import('@/pages/governance/Standards.vue')
        },
        {
          path: 'governance/events',
          name: 'GovernanceEventConfig',
          component: () => import('@/pages/governance/EventConfig.vue')
        },
        // Master Data
        {
          path: 'master-data/parties',
          name: 'MasterParties',
          component: () => import('@/pages/masterdata/Parties.vue')
        },
        {
          path: 'master-data/identifier-namespaces',
          name: 'MasterIdentifierNamespaces',
          component: () => import('@/pages/masterdata/IdentifierNamespaces.vue')
        },
        {
          path: 'master-data/objects',
          name: 'MasterObjects',
          component: () => import('@/pages/masterdata/Objects.vue')
        },
        {
          path: 'master-data/identifier-bindings',
          name: 'MasterIdentifierBindings',
          component: () => import('@/pages/masterdata/IdentifierBindings.vue')
        },
        {
          path: 'master-data/code-schemes',
          name: 'MasterCodeSchemes',
          component: () => import('@/pages/masterdata/CodeSchemes.vue')
        },
        {
          path: 'master-data/decoction-pieces',
          name: 'MasterDecoctionPieces',
          component: () => import('@/pages/masterdata/DecoctionPieces.vue')
        },
        // Trust Data Engine
        {
          path: 'trust/events',
          name: 'TrustEventsQuery',
          component: () => import('@/pages/trust/EventsQuery.vue')
        },
        {
          path: 'trust/events/:eventId',
          name: 'TrustEventDetail',
          component: () => import('@/pages/trust/EventDetail.vue')
        },
        {
          path: 'trust/lineage',
          name: 'TrustLineageQuery',
          component: () => import('@/pages/trust/LineageQuery.vue')
        },
        {
          path: 'trust/evidence',
          name: 'TrustEvidence',
          component: () => import('@/pages/trust/Evidence.vue')
        },
        {
          path: 'trust/proofs',
          name: 'TrustProofs',
          component: () => import('@/pages/trust/Proofs.vue')
        },
        // Exchange
        { path: 'exchange/legacy-config', name: 'ExchangeLegacyConfig', component: () => import('@/pages/exchange/ProfileConfig.vue') },
        { path: 'trust/files-credentials', name: 'TrustFilesCredentials', component: () => import('@/pages/trust/FilesCredentials.vue') },
        { path: 'exchange/profile-config', name: 'ExchangeProfileConfig', component: () => import('@/pages/exchange/QueryProfileConfig.vue') },
        { path: 'exchange/queries', name: 'ExchangeQueries', component: () => import('@/pages/exchange/Queries.vue') },
        {
          path: 'exchange/profiles',
          name: 'ExchangeProfiles',
          component: () => import('@/pages/exchange/QueryProfiles.vue')
        },
        {
          path: 'exchange/projections',
          name: 'ExchangeProjections',
          component: () => import('@/pages/exchange/Projections.vue')
        },
        // Settings & Operations
        {
          path: 'settings/tenant-project',
          name: 'SettingsTenantProject',
          component: () => import('@/pages/settings/TenantProject.vue')
        },
        {
          path: 'settings/tenants',
          name: 'SettingsTenants',
          component: () => import('@/pages/settings/Tenants.vue')
        },
        {
          path: 'settings/users',
          name: 'SettingsUsers',
          component: () => import('@/pages/settings/Users.vue')
        },
        {
          path: 'settings/roles',
          name: 'SettingsRoles',
          component: () => import('@/pages/settings/Roles.vue')
        },
        {
          path: 'settings/dictionaries',
          name: 'SettingsDictionaries',
          component: () => import('@/pages/settings/Dictionaries.vue')
        },
        {
          path: 'settings/deployments-edge',
          name: 'SettingsDeploymentsEdge',
          component: () => import('@/pages/settings/DeploymentsEdge.vue')
        },
        {
          path: 'operations/subscriptions-jobs',
          name: 'OperationsSubscriptionsJobs',
          component: () => import('@/pages/operations/SubscriptionsJobs.vue')
        },
        {
          path: 'operations/audit-alerts',
          name: 'OperationsAuditAlerts',
          component: () => import('@/pages/operations/AuditAlerts.vue')
        }
      ]
    }
  ]
});

// Require a restored token before entering the application shell.
router.beforeEach((to) => {
  const authStore = useAuthStore();
  // Re-read persisted session data so stale HMR/runtime state cannot bypass login.
  authStore.initSession();
  const isLoginRoute = to.path === '/login';
  const hasSession = Boolean(authStore.token && authStore.isLoggedIn);

  if (isLoginRoute) {
    return hasSession ? { path: '/workspace' } : true;
  }

  if (to.matched.some(record => record.meta.requiresAuth) && !hasSession) {
    return {
      path: '/login',
      query: { redirect: to.fullPath }
    };
  }

  return true;
});

// A failed lazy import must not leave the router view blank.
router.onError((error, to) => {
  const isChunkError =
    error?.message?.includes('Failed to fetch dynamically imported module') ||
    error?.message?.includes('Importing a module script failed') ||
    error?.message?.includes('error loading dynamically imported module');

  if (isChunkError && to?.fullPath) {
    console.error('Page module failed to load:', to.fullPath, error);
    if (to.name !== 'PageLoadError') {
      void router.replace({ name: 'PageLoadError', query: { redirect: to.fullPath } });
    }
  }
});

export default router;
