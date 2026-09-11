import { createRouter, createWebHistory } from 'vue-router';
import AppLayout from '@/components/layout/AppLayout.vue';
import Login from '@/pages/auth/Login.vue';
import Workspace from '@/pages/workspace/Workspace.vue';
import { useAuthStore } from '@/stores/authStore';

const router = createRouter({
  history: createWebHistory(),
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
          path: 'master-data/objects',
          name: 'MasterObjects',
          component: () => import('@/pages/masterdata/Objects.vue')
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
        {
          path: 'exchange/profiles',
          name: 'ExchangeProfiles',
          component: () => import('@/pages/exchange/Profiles.vue')
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

// Auto-recovery for dynamic module import errors (e.g., during network hiccup or container reload)
router.onError((error, to) => {
  const isChunkError =
    error?.message?.includes('Failed to fetch dynamically imported module') ||
    error?.message?.includes('Importing a module script failed') ||
    error?.message?.includes('error loading dynamically imported module');

  if (isChunkError && to?.fullPath) {
    const key = `chunk_reload_${to.fullPath}`;
    const alreadyReloaded = sessionStorage.getItem(key);
    if (!alreadyReloaded) {
      sessionStorage.setItem(key, '1');
      console.warn('Recovering from dynamic chunk import failure, reloading to:', to.fullPath);
      window.location.href = to.fullPath;
    } else {
      console.error('Repeated dynamic import failure detected for:', to.fullPath, error);
      sessionStorage.removeItem(key);
    }
  }
});

export default router;
