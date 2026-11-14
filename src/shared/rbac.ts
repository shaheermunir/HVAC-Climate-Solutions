export type CanonicalStaffRole =
  | 'super_admin'
  | 'business_admin'
  | 'dispatcher'
  | 'technician'
  | 'content_editor';

export type UserRole = CanonicalStaffRole | 'customer';

export type PermissionKey =
  | 'manage_saas'
  | 'manage_users'
  | 'manage_settings'
  | 'manage_integrations'
  | 'view_audit_logs'
  | 'manage_leads'
  | 'manage_appointments'
  | 'view_assigned_jobs'
  | 'update_assigned_jobs'
  | 'manage_estimates'
  | 'manage_technicians'
  | 'manage_services'
  | 'manage_theme'
  | 'manage_content'
  | 'manage_promotions';

export type AdminTabKey =
  | 'overview'
  | 'my_jobs'
  | 'leads'
  | 'appointments'
  | 'saas_clients'
  | 'saas_plans'
  | 'my_subscription'
  | 'theme'
  | 'page_studio'
  | 'homepage'
  | 'navigation'
  | 'flags'
  | 'market'
  | 'services'
  | 'areas'
  | 'reviews'
  | 'articles'
  | 'forms'
  | 'pages'
  | 'search_replace'
  | 'estimates'
  | 'promotions'
  | 'technicians'
  | 'users'
  | 'integrations'
  | 'audit';

export const ALL_PERMISSIONS: { key: PermissionKey; label: string; description: string }[] = [
  { key: 'manage_saas', label: 'SaaS Platform & Tenants', description: 'Manage client tenants, SaaS pricing & licenses' },
  { key: 'manage_users', label: 'Users & Permissions', description: 'Create accounts, assign roles, suspend users & reset passwords' },
  { key: 'manage_settings', label: 'Business & System Settings', description: 'Edit business identity, feature flags & market settings' },
  { key: 'manage_integrations', label: 'Integrations Hub', description: 'Configure and test third-party APIs & webhooks' },
  { key: 'view_audit_logs', label: 'Security Audit Logs', description: 'Inspect administrative and authentication event logs' },
  { key: 'manage_leads', label: 'Leads & CRM Pipeline', description: 'View, update, assign and export customer leads' },
  { key: 'manage_appointments', label: 'Full Dispatch Calendar', description: 'View, schedule and modify all field appointments' },
  { key: 'view_assigned_jobs', label: 'View Assigned Work Orders', description: 'View service appointments assigned to own technician profile' },
  { key: 'update_assigned_jobs', label: 'Update Assigned Work Orders', description: 'Update job status and completion notes on own jobs' },
  { key: 'manage_estimates', label: 'Estimates & Quotes', description: 'Draft, send, update and delete customer quotes' },
  { key: 'manage_technicians', label: 'Technician Roster', description: 'Manage field technician profiles and duty status' },
  { key: 'manage_services', label: 'Services & Territories', description: 'Edit HVAC services catalog and service areas' },
  { key: 'manage_theme', label: 'Visual Theme & Branding', description: 'Edit, preview, publish and rollback site theme' },
  { key: 'manage_content', label: 'CMS Pages, Blog & Forms', description: 'Edit site pages, blog articles, navigation and forms' },
  { key: 'manage_promotions', label: 'Promotions & Reviews', description: 'Manage promotional offers and moderate reviews' },
];

export const ROLE_DEFAULT_PERMISSIONS: Record<CanonicalStaffRole, PermissionKey[]> = {
  super_admin: ALL_PERMISSIONS.map((p) => p.key),
  business_admin: [
    'manage_settings',
    'manage_integrations',
    'view_audit_logs',
    'manage_leads',
    'manage_appointments',
    'manage_estimates',
    'manage_technicians',
    'manage_services',
    'manage_theme',
    'manage_content',
    'manage_promotions',
  ],
  dispatcher: [
    'manage_leads',
    'manage_appointments',
    'manage_estimates',
    'manage_technicians',
  ],
  technician: [
    'view_assigned_jobs',
    'update_assigned_jobs',
  ],
  content_editor: [
    'manage_content',
    'manage_services',
    'manage_promotions',
  ],
};

export const ROLE_LABELS: Record<CanonicalStaffRole, string> = {
  super_admin: 'Super Admin',
  business_admin: 'Business Admin',
  dispatcher: 'Lead Dispatcher',
  technician: 'Field Technician',
  content_editor: 'Content Editor',
};

export const ROLE_DASHBOARD_ROUTES: Record<CanonicalStaffRole, string> = {
  super_admin: '/admin/super',
  business_admin: '/admin/business',
  dispatcher: '/admin/dispatch',
  technician: '/admin/technician',
  content_editor: '/admin/content',
};

export const ROLE_DEFAULT_TAB: Record<CanonicalStaffRole, AdminTabKey> = {
  super_admin: 'saas_clients',
  business_admin: 'overview',
  dispatcher: 'leads',
  technician: 'my_jobs',
  content_editor: 'page_studio',
};

export const TAB_REQUIRED_PERMISSIONS: Record<AdminTabKey, PermissionKey[]> = {
  overview: ['manage_leads', 'manage_appointments', 'manage_settings'],
  my_jobs: ['view_assigned_jobs', 'manage_appointments'],
  leads: ['manage_leads'],
  appointments: ['manage_appointments'],
  saas_clients: ['manage_saas'],
  saas_plans: ['manage_saas'],
  my_subscription: ['manage_settings', 'manage_saas'],
  theme: ['manage_theme'],
  page_studio: ['manage_content'],
  homepage: ['manage_content'],
  navigation: ['manage_content'],
  flags: ['manage_settings'],
  market: ['manage_settings'],
  services: ['manage_services'],
  areas: ['manage_services'],
  reviews: ['manage_promotions'],
  articles: ['manage_content'],
  forms: ['manage_content'],
  pages: ['manage_content'],
  search_replace: ['manage_content'],
  estimates: ['manage_estimates'],
  promotions: ['manage_promotions'],
  technicians: ['manage_technicians'],
  users: ['manage_users'],
  integrations: ['manage_integrations'],
  audit: ['view_audit_logs'],
};

export function normalizeStaffRole(role?: string | null): UserRole {
  const clean = (role || '').toLowerCase().trim();
  if (clean === 'super_admin') return 'super_admin';
  if (clean === 'business_admin' || clean === 'admin') return 'business_admin';
  if (clean === 'dispatcher') return 'dispatcher';
  if (clean === 'technician') return 'technician';
  if (clean === 'content_editor' || clean === 'editor' || clean === 'marketing_manager') return 'content_editor';
  return 'customer';
}

export function isStaffRole(role?: string | null): role is CanonicalStaffRole {
  const norm = normalizeStaffRole(role);
  return norm !== 'customer';
}

export function resolveUserPermissions(user?: { role?: string; permissions?: string[] | null } | null): PermissionKey[] {
  if (!user) return [];
  const normalized = normalizeStaffRole(user.role);
  if (normalized === 'customer') return [];
  if (normalized === 'super_admin') {
    return [...ROLE_DEFAULT_PERMISSIONS.super_admin];
  }
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    const validKeys = new Set(ALL_PERMISSIONS.map((p) => p.key));
    return user.permissions.filter((p): p is PermissionKey => validKeys.has(p as PermissionKey));
  }
  return [...ROLE_DEFAULT_PERMISSIONS[normalized]];
}

export function hasPermission(userPermissions: string[], required: PermissionKey | PermissionKey[]): boolean {
  if (!Array.isArray(userPermissions) || userPermissions.length === 0) return false;
  const reqList = Array.isArray(required) ? required : [required];
  return reqList.some((perm) => userPermissions.includes(perm));
}

export function getAllowedTabsForUser(user?: { role?: string; permissions?: string[] | null } | null): AdminTabKey[] {
  const perms = resolveUserPermissions(user);
  if (perms.length === 0) return [];
  const normalized = normalizeStaffRole(user?.role);
  return (Object.keys(TAB_REQUIRED_PERMISSIONS) as AdminTabKey[]).filter((tab) => {
    // Technicians should see 'my_jobs' instead of full 'overview' unless explicitly given full leads/appointments
    if (tab === 'my_jobs' && normalized !== 'technician' && !perms.includes('view_assigned_jobs')) {
      return false;
    }
    const reqs = TAB_REQUIRED_PERMISSIONS[tab];
    return reqs.some((r) => perms.includes(r));
  });
}

export function getDashboardRouteForRole(role?: string | null): string {
  const norm = normalizeStaffRole(role);
  if (norm === 'customer') return '/portal';
  return ROLE_DASHBOARD_ROUTES[norm];
}
