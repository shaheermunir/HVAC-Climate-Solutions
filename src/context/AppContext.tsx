import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  BusinessSettings,
  ServiceRecord,
  ServiceArea,
  Technician,
  MembershipPlan,
  Promotion,
  Review,
  Article,
  Project,
  Lead,
  Appointment,
  Estimate,
  CustomerProfile,
  EquipmentItem,
  IntegrationConfig,
  AuditLog,
  ThemeConfig,
  HomepageSection,
  NavigationConfig,
  FeatureFlags,
  MarketSettings,
  CustomFormDefinition,
  PageDefinition,
  SitePage,
  PageSection,
  PageSectionItem,
  AdminUser,
  ClientTenant,
  SaasPlatformConfig,
  SaasInvoiceRecord,
} from '../types';
import { defaultSitePages } from '../data/defaultSitePages';
import {
  AdminTabKey,
  PermissionKey,
  getAllowedTabsForUser,
  getDashboardRouteForRole,
  hasPermission,
  resolveUserPermissions,
} from '../shared/rbac';

const AUTH_TOKEN_STORAGE_KEY = 'hvac_auth_token';

function getStoredAuthToken(): string | null {
  try {
    return window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredAuthToken(token: string | null): void {
  try {
    if (token) {
      window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface AppContextType {
  settings: BusinessSettings | null;
  services: ServiceRecord[];
  serviceAreas: ServiceArea[];
  technicians: Technician[];
  membershipPlans: MembershipPlan[];
  promotions: Promotion[];
  reviews: Review[];
  articles: Article[];
  projects: Project[];
  leads: Lead[];
  appointments: Appointment[];
  estimates: Estimate[];
  customers: CustomerProfile[];
  integrations: IntegrationConfig[];
  auditLogs: AuditLog[];
  loading: boolean;
  // Administration & Dynamic Platform State
  themeConfig: ThemeConfig | null;
  homepageSections: HomepageSection[];
  navigationConfig: NavigationConfig | null;
  featureFlags: FeatureFlags | null;
  marketSettings: MarketSettings | null;
  forms: CustomFormDefinition[];
  pages: PageDefinition[];
  sitePages: SitePage[];
  getPage: (slugOrId: string) => SitePage | undefined;
  getPageSection: (pageSlug: string, sectionTypeOrId: string) => PageSection | undefined;
  updateSitePage: (id: string, updates: Partial<SitePage>) => Promise<boolean>;
  updatePageSection: (pageId: string, sectionId: string, sectionUpdates: Partial<PageSection>) => Promise<boolean>;
  addPageSection: (pageId: string, section: PageSection) => Promise<boolean>;
  deletePageSection: (pageId: string, sectionId: string) => Promise<boolean>;
  resetSitePage: (id: string) => Promise<boolean>;
  isPageEditorOpen: boolean;
  setIsPageEditorOpen: (open: boolean) => void;
  editingPageId: string | null;
  setEditingPageId: (id: string | null) => void;
  adminUsers: AdminUser[];
  adminUser: AdminUser | null;
  needsInitialSetup: boolean;
  userPermissions: PermissionKey[];
  allowedTabs: AdminTabKey[];
  hasUserPermission: (required: PermissionKey | PermissionKey[]) => boolean;
  // SaaS Subscription & Super Admin Client Management
  saasConfig: SaasPlatformConfig | null;
  currentTenant: ClientTenant | null;
  clientTenants: ClientTenant[];
  saasMetrics: any;
  isSaasPricingModalOpen: boolean;
  setIsSaasPricingModalOpen: (open: boolean) => void;
  // Current customer profile
  currentCustomer: CustomerProfile | null;
  // Navigation
  currentRoute: string;
  setCurrentRoute: (route: string) => void;
  // Modal states
  isBookingModalOpen: boolean;
  openBookingModal: (preselectedServiceId?: string) => void;
  closeBookingModal: () => void;
  isEmergencyModalOpen: boolean;
  openEmergencyModal: () => void;
  closeEmergencyModal: () => void;
  isEstimateModalOpen: boolean;
  openEstimateModal: () => void;
  closeEstimateModal: () => void;
  isMaintenanceModalOpen: boolean;
  openMaintenanceModal: () => void;
  closeMaintenanceModal: () => void;
  isCommercialModalOpen: boolean;
  openCommercialModal: () => void;
  closeCommercialModal: () => void;
  isAiChatOpen: boolean;
  setIsAiChatOpen: (open: boolean) => void;
  isSetupWizardOpen: boolean;
  setIsSetupWizardOpen: (open: boolean) => void;
  preselectedServiceId?: string;
  // Actions
  submitLead: (leadData: Partial<Lead>) => Promise<{ success: boolean; lead?: Lead; message?: string; isDuplicate?: boolean }>;
  submitAppointment: (aptData: Partial<Appointment>) => Promise<{ success: boolean; appointment?: Appointment; message?: string }>;
  updateAppointmentStatus: (id: string, status: string, notes?: string) => Promise<boolean>;
  updateLeadStatus: (id: string, status: string, notes?: string) => Promise<boolean>;
  assignTechnicianToLead: (leadId: string, technicianId: string, technicianName: string, notes?: string) => Promise<boolean>;
  convertLeadToAppointment: (leadId: string, details: { date: string; timeSlot: string; technicianId?: string; technicianName?: string; notes?: string }) => Promise<{ success: boolean; appointment?: Appointment; message?: string }>;
  addDispatcherNote: (leadId: string, note: string) => Promise<boolean>;
  checkZipCoverage: (zip: string) => Promise<{ isServiced: boolean; cityName?: string; message: string }>;
  approveEstimate: (id: string, signatureName: string) => Promise<{ success: boolean; message?: string }>;
  rejectEstimate: (id: string, reason?: string) => Promise<{ success: boolean; message?: string }>;
  submitReview: (reviewData: Partial<Review>) => Promise<{ success: boolean; message?: string }>;
  updateBusinessSettings: (newSettings: Partial<BusinessSettings>) => Promise<boolean>;
  saveServiceRecord: (service: Partial<ServiceRecord>) => Promise<boolean>;
  deleteServiceRecord: (id: string) => Promise<boolean>;
  saveServiceArea: (area: Partial<ServiceArea>) => Promise<boolean>;
  deleteServiceArea: (id: string) => Promise<boolean>;
  saveTechnician: (tech: Partial<Technician>) => Promise<boolean>;
  deleteTechnician: (id: string) => Promise<boolean>;
  savePromotion: (promo: Partial<Promotion>) => Promise<boolean>;
  deletePromotion: (id: string) => Promise<boolean>;
  saveArticle: (article: Partial<Article>) => Promise<boolean>;
  deleteArticle: (id: string) => Promise<boolean>;
  createEstimate: (estimate: Partial<Estimate>) => Promise<boolean>;
  updateEstimateStatus: (id: string, status: string) => Promise<boolean>;
  deleteEstimate: (id: string) => Promise<boolean>;
  addCustomerEquipment: (customerId: string, equipment: Partial<EquipmentItem>, customerEmail?: string) => Promise<boolean>;
  deleteCustomerEquipment: (customerId: string, equipmentId: string, customerEmail?: string) => Promise<boolean>;
  cancelPortalAppointment: (id: string, customerEmail: string, reason?: string) => Promise<boolean>;
  portalLookup: (params: { email?: string; appointmentNumber?: string }) => Promise<{
    success: boolean;
    customer?: CustomerProfile;
    appointments?: Appointment[];
    estimates?: Estimate[];
    error?: string;
  }>;
  updateTechnician: (id: string, updates: Partial<Technician>) => Promise<boolean>;
  enrollMembership: (enrollment: any) => Promise<{ success: boolean; subscription?: any; message?: string }>;
  testIntegration: (id: string) => Promise<string>;
  updateIntegration: (id: string, updates: Partial<IntegrationConfig>) => Promise<boolean>;
  // Administration Platform Specific Actions
  themeHistoryCount: number;
  updateTheme: (updates: Partial<ThemeConfig>) => Promise<boolean>;
  publishTheme: () => Promise<boolean>;
  rollbackTheme: () => Promise<boolean>;
  discardDraftTheme: () => Promise<boolean>;
  resetTheme: () => Promise<boolean>;
  updateHomepageSections: (sections: HomepageSection[]) => Promise<boolean>;
  updateNavigationConfig: (config: NavigationConfig) => Promise<boolean>;
  updateFeatureFlags: (flags: Partial<FeatureFlags>) => Promise<boolean>;
  updateMarketSettings: (settings: Partial<MarketSettings>) => Promise<boolean>;
  saveForm: (form: Partial<CustomFormDefinition>) => Promise<boolean>;
  submitCustomForm: (slug: string, data: Record<string, any>) => Promise<{ success: boolean; message?: string }>;
  savePage: (page: Partial<PageDefinition>) => Promise<boolean>;
  deletePage: (id: string) => Promise<boolean>;
  saveAdminUser: (user: Partial<AdminUser> & { password?: string }) => Promise<boolean>;
  deleteAdminUser: (id: string) => Promise<boolean>;
  adminResetUserPassword: (userId: string, newPassword: string, mustChangePassword?: boolean) => Promise<boolean>;
  adminGenerateResetToken: (userId: string) => Promise<{ success: boolean; token?: string; expiresAt?: string; error?: string }>;
  setupSuperAdmin: (payload: {
    name: string;
    email: string;
    username?: string;
    password: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string; redirectRoute?: string }>;
  loginWithCredentials: (
    identifier: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; redirectRoute?: string }>;
  loginAdmin: (email: string, _role?: string, password?: string) => Promise<boolean>;
  logoutAdmin: () => Promise<void>;
  changeOwnPassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (identifier: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  resetPasswordWithToken: (token: string, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  searchContent: (query: string) => Promise<{ totalMatches: number; matches: any[] }>;
  replaceContent: (searchStr: string, replaceStr: string, selectedIds?: string[]) => Promise<{ replacedCount: number; message: string }>;
  // SaaS & Super Admin Actions
  fetchSuperAdminClients: () => Promise<void>;
  createClientTenant: (tenantData: Partial<ClientTenant>) => Promise<{ success: boolean; tenant?: ClientTenant; message?: string }>;
  updateClientTenant: (id: string, updates: Partial<ClientTenant>) => Promise<boolean>;
  toggleClientStatus: (id: string, status?: string) => Promise<boolean>;
  recordClientInvoice: (id: string, invoiceData: Partial<SaasInvoiceRecord>) => Promise<boolean>;
  deleteClientTenant: (id: string) => Promise<boolean>;
  submitSaasInquiry: (data: any) => Promise<{ success: boolean; message?: string }>;
  updateSaasConfig: (newConfig: Partial<SaasPlatformConfig>) => Promise<boolean>;
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  removeToast: (id: string) => void;
  formatCurrency: (amount: number) => string;
  // Refresh
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [authToken, setAuthToken] = useState<string | null>(() => getStoredAuthToken());
  const [needsInitialSetup, setNeedsInitialSetup] = useState<boolean>(false);
  const [saasConfig, setSaasConfig] = useState<SaasPlatformConfig | null>(null);
  const [currentTenant, setCurrentTenant] = useState<ClientTenant | null>(null);
  const [clientTenants, setClientTenants] = useState<ClientTenant[]>([]);
  const [saasMetrics, setSaasMetrics] = useState<any>(null);
  const [isSaasPricingModalOpen, setIsSaasPricingModalOpen] = useState(false);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(null);
  const [themeHistoryCount, setThemeHistoryCount] = useState<number>(0);
  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>([]);
  const [navigationConfig, setNavigationConfig] = useState<NavigationConfig | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null);
  const [marketSettings, setMarketSettings] = useState<MarketSettings | null>(null);
  const [forms, setForms] = useState<CustomFormDefinition[]>([]);
  const [pages, setPages] = useState<PageDefinition[]>([]);
  const [sitePages, setSitePages] = useState<SitePage[]>(defaultSitePages);
  const [isPageEditorOpen, setIsPageEditorOpen] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  const userPermissions = resolveUserPermissions(adminUser);
  const allowedTabs = getAllowedTabsForUser(adminUser);
  const hasUserPermission = (required: PermissionKey | PermissionKey[]) => hasPermission(userPermissions, required);

  const [currentRoute, setCurrentRouteState] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isCommercialModalOpen, setIsCommercialModalOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | undefined>(undefined);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Dynamic CSS variables and Google Fonts injection to skin the website in real time
  useEffect(() => {
    if (!themeConfig) return;
    const root = document.documentElement;
    if (themeConfig.primaryColor) {
      root.style.setProperty('--color-primary', themeConfig.primaryColor);
    }
    if (themeConfig.secondaryColor) {
      root.style.setProperty('--color-secondary', themeConfig.secondaryColor);
    }
    if (themeConfig.accentColor) {
      root.style.setProperty('--color-accent', themeConfig.accentColor);
    }
    if (themeConfig.backgroundColor) {
      root.style.setProperty('--color-bg', themeConfig.backgroundColor);
    }
    if (themeConfig.surfaceColor) {
      root.style.setProperty('--color-surface', themeConfig.surfaceColor);
    }
    if (themeConfig.primaryTextColor) {
      root.style.setProperty('--color-text-primary', themeConfig.primaryTextColor);
    }
    if (themeConfig.secondaryTextColor) {
      root.style.setProperty('--color-text-secondary', themeConfig.secondaryTextColor);
    }
    if (themeConfig.borderColor) {
      root.style.setProperty('--color-border', themeConfig.borderColor);
    }
    if (themeConfig.headerBg) {
      root.style.setProperty('--header-bg', themeConfig.headerBg);
    }
    if (themeConfig.footerBg) {
      root.style.setProperty('--footer-bg', themeConfig.footerBg);
    }
    if (themeConfig.heroBg) {
      root.style.setProperty('--hero-bg', themeConfig.heroBg);
    }

    // Dynamic Corner Radius math
    if (themeConfig.buttonRadius) {
      const radiusMap: Record<string, string> = {
        'none': '0px',
        'sharp': '0px',
        'rounded-md': '0.375rem',
        'rounded-lg': '0.5rem',
        'rounded-xl': '0.75rem',
        'rounded-2xl': '1rem',
        'rounded-full': '9999px',
        'pill': '9999px',
      };
      const val = radiusMap[themeConfig.buttonRadius] || themeConfig.buttonRadius;
      root.style.setProperty('--radius-btn', val);
    }
    if (themeConfig.cardRadius) {
      const cardRadiusMap: Record<string, string> = {
        'none': '0px',
        'sharp': '0px',
        'rounded-lg': '0.5rem',
        'rounded-xl': '0.75rem',
        'rounded-2xl': '1rem',
        'rounded-3xl': '1.5rem',
      };
      const val = cardRadiusMap[themeConfig.cardRadius] || themeConfig.cardRadius;
      root.style.setProperty('--radius-card', val);
    }

    // Dynamic Typography & Google Font Family injection
    if (themeConfig.headingFont) {
      root.style.setProperty('--font-heading', `"${themeConfig.headingFont}", sans-serif`);
    }
    if (themeConfig.bodyFont) {
      root.style.setProperty('--font-body', `"${themeConfig.bodyFont}", sans-serif`);
    }

    const requestedFonts = [themeConfig.headingFont, themeConfig.bodyFont].filter(Boolean);
    if (requestedFonts.length > 0) {
      try {
        const fontQueries = requestedFonts
          .map((f) => `family=${encodeURIComponent(f)}:wght@300;400;500;600;700;800`)
          .join('&');
        const href = `https://fonts.googleapis.com/css2?${fontQueries}&display=swap`;
        let linkEl = document.getElementById('dynamic-theme-fonts') as HTMLLinkElement | null;
        if (!linkEl) {
          linkEl = document.createElement('link');
          linkEl.id = 'dynamic-theme-fonts';
          linkEl.rel = 'stylesheet';
          document.head.appendChild(linkEl);
        }
        if (linkEl.href !== href) {
          linkEl.href = href;
        }
      } catch (err) {
        console.warn('[Theme] Could not load dynamic Google Fonts:', err);
      }
    }
  }, [themeConfig]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const setCurrentRoute = (route: string) => {
    window.history.pushState({}, '', route);
    setCurrentRouteState(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync back/forward button navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRouteState(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openBookingModal = (serviceId?: string) => {
    setPreselectedServiceId(serviceId);
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setPreselectedServiceId(undefined);
  };

  const openEmergencyModal = () => setIsEmergencyModalOpen(true);
  const closeEmergencyModal = () => setIsEmergencyModalOpen(false);

  const openEstimateModal = () => setIsEstimateModalOpen(true);
  const closeEstimateModal = () => setIsEstimateModalOpen(false);

  const openMaintenanceModal = () => setIsMaintenanceModalOpen(true);
  const closeMaintenanceModal = () => setIsMaintenanceModalOpen(false);

  const openCommercialModal = () => setIsCommercialModalOpen(true);
  const closeCommercialModal = () => setIsCommercialModalOpen(false);

  // Common authenticated request headers using real session bearer token
  const getAuthHeaders = (tokenOverride?: string | null): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const activeToken = tokenOverride !== undefined ? tokenOverride : authToken || getStoredAuthToken();
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }
    return headers;
  };

  // Fetch initial data + permission-scoped staff data
  const refreshData = async (tokenOverride?: string | null) => {
    try {
      const effectiveToken = tokenOverride !== undefined ? tokenOverride : authToken || getStoredAuthToken();
      const authHeaders: Record<string, string> = effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {};

      const [
        settingsRes,
        servicesRes,
        areasRes,
        techsRes,
        plansRes,
        promosRes,
        reviewsRes,
        articlesRes,
        projectsRes,
        themeRes,
        sectionsRes,
        navRes,
        flagsRes,
        marketRes,
        formsRes,
        pagesRes,
        sitePagesRes,
        saasConfigRes,
        currentTenantRes,
        setupStatusRes,
        meRes,
      ] = await Promise.all([
        fetch('/api/business-settings').then((r) => r.json()).catch(() => null),
        fetch('/api/services').then((r) => r.json()).catch(() => []),
        fetch('/api/service-areas').then((r) => r.json()).catch(() => []),
        fetch('/api/technicians', { headers: authHeaders, credentials: 'include' }).then((r) => r.json()).catch(() => []),
        fetch('/api/memberships').then((r) => r.json()).catch(() => []),
        fetch('/api/promotions').then((r) => r.json()).catch(() => []),
        fetch('/api/reviews').then((r) => r.json()).catch(() => []),
        fetch('/api/articles').then((r) => r.json()).catch(() => []),
        fetch('/api/projects').then((r) => r.json()).catch(() => []),
        fetch('/api/theme', { headers: authHeaders, credentials: 'include' }).then((r) => r.json()).catch(() => null),
        fetch('/api/homepage-sections').then((r) => r.json()).catch(() => []),
        fetch('/api/navigation-config').then((r) => r.json()).catch(() => null),
        fetch('/api/feature-flags').then((r) => r.json()).catch(() => null),
        fetch('/api/market-settings').then((r) => r.json()).catch(() => null),
        fetch('/api/forms').then((r) => r.json()).catch(() => []),
        fetch('/api/pages').then((r) => r.json()).catch(() => []),
        fetch('/api/site-pages').then((r) => r.json()).catch(() => defaultSitePages),
        fetch('/api/saas/config').then((r) => r.json()).catch(() => null),
        fetch('/api/saas/tenant-current').then((r) => r.json()).catch(() => null),
        fetch('/api/auth/setup-status').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/auth/me', { headers: authHeaders, credentials: 'include' })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);

      if (settingsRes) setSettings(settingsRes);
      if (Array.isArray(servicesRes)) setServices(servicesRes);
      if (Array.isArray(areasRes)) setServiceAreas(areasRes);
      if (Array.isArray(techsRes)) setTechnicians(techsRes);
      if (Array.isArray(plansRes)) setMembershipPlans(plansRes);
      if (Array.isArray(promosRes)) setPromotions(promosRes);
      if (Array.isArray(reviewsRes)) setReviews(reviewsRes);
      if (Array.isArray(articlesRes)) setArticles(articlesRes);
      if (Array.isArray(projectsRes)) setProjects(projectsRes);
      if (themeRes) {
        setThemeConfig(themeRes);
        if (themeRes.historyCount !== undefined) setThemeHistoryCount(themeRes.historyCount);
      }
      if (Array.isArray(sectionsRes)) setHomepageSections(sectionsRes);
      if (navRes) setNavigationConfig(navRes);
      if (flagsRes) setFeatureFlags(flagsRes);
      if (marketRes) setMarketSettings(marketRes);
      if (Array.isArray(formsRes)) setForms(formsRes);
      if (Array.isArray(pagesRes)) setPages(pagesRes);
      if (Array.isArray(sitePagesRes) && sitePagesRes.length > 0) setSitePages(sitePagesRes);
      if (saasConfigRes) setSaasConfig(saasConfigRes);
      if (currentTenantRes) setCurrentTenant(currentTenantRes);
      if (setupStatusRes && typeof setupStatusRes.needsSetup === 'boolean') {
        setNeedsInitialSetup(setupStatusRes.needsSetup);
      }

      if (meRes) {
        setAdminUser(meRes);
        const perms = resolveUserPermissions(meRes);
        const [
          leadsRes,
          aptsRes,
          estimatesRes,
          customersRes,
          integrationsRes,
          auditLogsRes,
          usersRes,
          superAdminClientsRes,
          allArticlesRes,
          allReviewsRes,
        ] = await Promise.all([
          perms.includes('manage_leads')
            ? fetch('/api/leads', { headers: authHeaders, credentials: 'include' }).then((r) => (r.ok ? r.json() : [])).catch(() => [])
            : Promise.resolve([]),
          perms.includes('manage_appointments') || perms.includes('view_assigned_jobs')
            ? fetch('/api/appointments', { headers: authHeaders, credentials: 'include' }).then((r) => (r.ok ? r.json() : [])).catch(() => [])
            : Promise.resolve([]),
          perms.includes('manage_estimates')
            ? fetch('/api/estimates', { headers: authHeaders, credentials: 'include' }).then((r) => (r.ok ? r.json() : [])).catch(() => [])
            : Promise.resolve([]),
          perms.includes('manage_leads') || perms.includes('manage_appointments')
            ? fetch('/api/customers', { headers: authHeaders, credentials: 'include' }).then((r) => (r.ok ? r.json() : [])).catch(() => [])
            : Promise.resolve([]),
          perms.includes('manage_integrations')
            ? fetch('/api/integrations', { headers: authHeaders, credentials: 'include' }).then((r) => (r.ok ? r.json() : [])).catch(() => [])
            : Promise.resolve([]),
          perms.includes('view_audit_logs')
            ? fetch('/api/audit-logs', { headers: authHeaders, credentials: 'include' }).then((r) => (r.ok ? r.json() : [])).catch(() => [])
            : Promise.resolve([]),
          perms.includes('manage_users')
            ? fetch('/api/admin/users', { headers: authHeaders, credentials: 'include' }).then((r) => (r.ok ? r.json() : [])).catch(() => [])
            : Promise.resolve([]),
          perms.includes('manage_saas')
            ? fetch('/api/super-admin/clients', { headers: authHeaders, credentials: 'include' }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
            : Promise.resolve(null),
          perms.includes('manage_content')
            ? fetch('/api/articles/all', { headers: authHeaders, credentials: 'include' }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
            : Promise.resolve(null),
          perms.includes('manage_promotions')
            ? fetch('/api/reviews/all', { headers: authHeaders, credentials: 'include' }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
            : Promise.resolve(null),
        ]);

        setLeads(Array.isArray(leadsRes) ? leadsRes : []);
        setAppointments(Array.isArray(aptsRes) ? aptsRes : []);
        setEstimates(Array.isArray(estimatesRes) ? estimatesRes : []);
        setCustomers(Array.isArray(customersRes) ? customersRes : []);
        setIntegrations(Array.isArray(integrationsRes) ? integrationsRes : []);
        setAuditLogs(Array.isArray(auditLogsRes) ? auditLogsRes : []);
        setAdminUsers(Array.isArray(usersRes) ? usersRes : []);
        if (Array.isArray(allArticlesRes)) setArticles(allArticlesRes);
        if (Array.isArray(allReviewsRes)) setReviews(allReviewsRes);
        if (superAdminClientsRes) {
          if (Array.isArray(superAdminClientsRes.clients)) setClientTenants(superAdminClientsRes.clients);
          if (superAdminClientsRes.metrics) setSaasMetrics(superAdminClientsRes.metrics);
        } else {
          setClientTenants([]);
          setSaasMetrics(null);
        }
      } else {
        setAdminUser(null);
        if (effectiveToken) {
          setStoredAuthToken(null);
          setAuthToken(null);
        }
        setLeads([]);
        setAppointments([]);
        setEstimates([]);
        setCustomers([]);
        setIntegrations([]);
        setAuditLogs([]);
        setAdminUsers([]);
        setClientTenants([]);
        setSaasMetrics(null);
      }
    } catch (err) {
      console.error('Failed to fetch initial application data:', err);
      addToast('error', 'Connection Error', 'Could not sync latest records with server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const currentCustomer = customers.length > 0 ? customers[0] : null;

  const submitLead = async (leadData: Partial<Lead>) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(leadData),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast('error', 'Request Failed', data.error || 'Submission failed');
        return { success: false, message: data.error };
      }

      await refreshData();
      addToast('success', 'Lead Registered', data.message);
      return { success: true, lead: data.lead, message: data.message };
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return { success: false, message: err.message };
    }
  };

  const submitAppointment = async (aptData: Partial<Appointment>) => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(aptData),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast('error', 'Booking Conflict', data.error || 'Could not complete appointment');
        return { success: false, message: data.error };
      }

      await refreshData();
      addToast('success', 'Appointment Scheduled', data.message);
      return { success: true, appointment: data.appointment, message: data.message };
    } catch (err: any) {
      addToast('error', 'Booking Failed', err.message);
      return { success: false, message: err.message };
    }
  };

  const updateAppointmentStatus = async (id: string, status: string, notes?: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, notes }),
      });
      if (res.ok) {
        await refreshData();
        addToast('success', 'Appointment Updated', `Status changed to ${status}`);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const updateLeadStatus = async (id: string, status: string, notes?: string) => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, notes }),
      });
      if (res.ok) {
        await refreshData();
        addToast('success', 'Lead Updated', `Status changed to ${status}`);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const assignTechnicianToLead = async (leadId: string, technicianId: string, technicianName: string, notes?: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/assign`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ technicianId, technicianName, notes }),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshData();
        addToast('success', 'Technician Assigned', `Assigned ${technicianName} to lead`);
        return true;
      }
      addToast('error', 'Assignment Failed', data.error || 'Could not assign technician');
      return false;
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return false;
    }
  };

  const convertLeadToAppointment = async (leadId: string, details: { date: string; timeSlot: string; technicianId?: string; technicianName?: string; notes?: string }) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/convert-to-appointment`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(details),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshData();
        addToast('success', 'Appointment Created', `Scheduled #${data.appointment?.appointmentNumber}`);
        return { success: true, appointment: data.appointment, message: 'Lead converted to booked appointment' };
      }
      addToast('error', 'Conversion Failed', data.error || 'Could not convert lead');
      return { success: false, message: data.error };
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return { success: false, message: err.message };
    }
  };

  const addDispatcherNote = async (leadId: string, note: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ note, author: adminUser?.name || 'Dispatch Console' }),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshData();
        addToast('success', 'Note Added', 'Dispatcher note appended to lead record');
        return true;
      }
      addToast('error', 'Note Failed', data.error || 'Could not add note');
      return false;
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return false;
    }
  };

  const checkZipCoverage = async (zip: string) => {
    try {
      const res = await fetch(`/api/service-areas/check-zip?zip=${encodeURIComponent(zip)}`);
      return await res.json();
    } catch {
      return { isServiced: false, message: 'Could not verify service area.' };
    }
  };

  const approveEstimate = async (id: string, signatureName: string) => {
    try {
      const res = await fetch(`/api/estimates/${id}/approve`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ customerSignatureName: signatureName }),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshData();
        addToast('success', 'Estimate Approved', data.message);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const rejectEstimate = async (id: string, reason?: string) => {
    try {
      const res = await fetch(`/api/estimates/${id}/reject`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshData();
        addToast('info', 'Estimate Declined', data.message);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const createEstimate = async (estimateData: Partial<Estimate>) => {
    try {
      const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(estimateData),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshData();
        addToast('success', 'Estimate Drafted', `Estimate #${data.estimateNumber} created.`);
        return true;
      }
      addToast('error', 'Creation Failed', data.error);
      return false;
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return false;
    }
  };

  const updateEstimateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/estimates/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await refreshData();
        addToast('success', 'Status Updated', `Estimate marked as ${status}.`);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const deleteEstimate = async (id: string) => {
    try {
      const res = await fetch(`/api/estimates/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await refreshData();
        addToast('info', 'Estimate Removed', 'Quote record deleted.');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const submitReview = async (reviewData: Partial<Review>) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(reviewData),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshData();
        addToast('success', 'Review Published', data.message);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const updateBusinessSettings = async (newSettings: Partial<BusinessSettings>) => {
    try {
      const res = await fetch('/api/business-settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(newSettings),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshData();
        addToast('success', 'Settings Saved', 'Business configuration updated successfully.');
        return true;
      }
      addToast('error', 'Update Failed', data.error || 'Permission denied.');
      return false;
    } catch {
      return false;
    }
  };

  const saveServiceRecord = async (service: Partial<ServiceRecord>) => {
    try {
      const url = service.id && services.some((s) => s.id === service.id) ? `/api/services/${service.id}` : '/api/services';
      const method = service.id && services.some((s) => s.id === service.id) ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(service),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshData();
        addToast('success', 'Service Saved', 'Service catalog has been updated.');
        return true;
      }
      addToast('error', 'Failed to Save Service', data.error || 'Check authorization permissions.');
      return false;
    } catch {
      return false;
    }
  };

  const deleteServiceRecord = async (id: string) => {
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshData();
        addToast('info', 'Service Removed', 'The service has been removed from catalog.');
        return true;
      }
      addToast('error', 'Delete Failed', data.error || 'Forbidden.');
      return false;
    } catch {
      return false;
    }
  };

  const savePromotion = async (promo: Partial<Promotion>) => {
    try {
      const url = promo.id && promotions.some((p) => p.id === promo.id) ? `/api/promotions/${promo.id}` : '/api/promotions';
      const method = promo.id && promotions.some((p) => p.id === promo.id) ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(promo),
      });
      if (res.ok) {
        await refreshData();
        addToast('success', 'Promotion Saved', 'Promotions have been updated.');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const deletePromotion = async (id: string) => {
    try {
      const res = await fetch(`/api/promotions/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await refreshData();
        addToast('info', 'Promotion Removed', 'Offer removed.');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const saveArticle = async (article: Partial<Article>) => {
    try {
      const isEdit = Boolean(article.id && articles.some((a) => a.id === article.id));
      const url = isEdit ? `/api/articles/${article.id}` : '/api/articles';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(article),
      });
      if (res.ok) {
        await refreshData();
        addToast('success', isEdit ? 'Article Updated' : 'Article Published', 'Educational resource saved.');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const deleteArticle = async (id: string) => {
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await refreshData();
        addToast('info', 'Article Deleted', 'Educational article removed.');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const addCustomerEquipment = async (customerId: string, equipment: Partial<EquipmentItem>, customerEmail?: string) => {
    try {
      const headers: Record<string, string> = { ...getAuthHeaders() };
      if (customerEmail) headers['x-customer-email'] = customerEmail;
      const res = await fetch(`/api/customers/${customerId}/equipment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...equipment, customerEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshData();
        addToast('success', 'Equipment Registered', data.message);
        return true;
      }
      addToast('error', 'Registration Failed', data.error);
      return false;
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return false;
    }
  };

  const deleteCustomerEquipment = async (customerId: string, equipmentId: string, customerEmail?: string) => {
    try {
      const headers: Record<string, string> = { ...getAuthHeaders() };
      if (customerEmail) headers['x-customer-email'] = customerEmail;
      const res = await fetch(`/api/customers/${customerId}/equipment/${equipmentId}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        await refreshData();
        addToast('info', 'Equipment Removed', 'Unit removed from inventory.');
        return true;
      }
      const data = await res.json().catch(() => ({}));
      addToast('error', 'Remove Failed', data.error || 'Could not remove unit.');
      return false;
    } catch {
      return false;
    }
  };

  const cancelPortalAppointment = async (id: string, customerEmail: string, reason?: string) => {
    try {
      const res = await fetch(`/api/portal/appointments/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        addToast('info', 'Appointment Cancelled', 'Your appointment has been cancelled.');
        return true;
      }
      addToast('error', 'Cancel Failed', data.error || 'Unable to cancel appointment.');
      return false;
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return false;
    }
  };

  const updateTechnician = async (id: string, updates: Partial<Technician>) => {
    try {
      const res = await fetch(`/api/technicians/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await refreshData();
        addToast('success', 'Technician Updated', 'Staff roster updated.');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const enrollMembership = async (enrollment: any) => {
    try {
      const res = await fetch('/api/memberships/enroll', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(enrollment),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshData();
        addToast('success', 'Membership Active', data.message);
        return { success: true, subscription: data.subscription, message: data.message };
      }
      addToast('error', 'Enrollment Failed', data.error);
      return { success: false, message: data.error };
    } catch (err: any) {
      addToast('error', 'Enrollment Error', err.message);
      return { success: false, message: err.message };
    }
  };

  const testIntegration = async (id: string) => {
    try {
      const res = await fetch(`/api/integrations/${id}/test`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      await refreshData();
      addToast('success', 'Integration Verified', data.message);
      return data.message;
    } catch (err: any) {
      addToast('error', 'Test Failed', err.message);
      return 'Test failed: could not reach integration endpoint.';
    }
  };

  const updateIntegration = async (id: string, updates: Partial<IntegrationConfig>) => {
    try {
      const res = await fetch(`/api/integrations/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await refreshData();
        addToast('success', 'Integration Saved', 'Credentials and configuration updated.');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Administration Platform Actions
  const updateTheme = async (updates: Partial<ThemeConfig>) => {
    try {
      const res = await fetch('/api/theme', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok) {
        setThemeConfig(data.theme);
        if (data.historyCount !== undefined) setThemeHistoryCount(data.historyCount);
        addToast('info', 'Draft Theme Updated', 'Visual tokens updated in live preview mode. Click "Publish Live" to make it public.');
        return true;
      }
      addToast('error', 'Theme Update Failed', data.error);
      return false;
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return false;
    }
  };

  const publishTheme = async () => {
    try {
      const res = await fetch('/api/theme/publish', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setThemeConfig(data.theme);
        if (data.historyCount !== undefined) setThemeHistoryCount(data.historyCount);
        addToast('success', 'Theme Published Live', 'Visual theme is now live and published for all visitors.');
        return true;
      }
      addToast('error', 'Publish Failed', data.error);
      return false;
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return false;
    }
  };

  const rollbackTheme = async () => {
    try {
      const res = await fetch('/api/theme/rollback', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setThemeConfig(data.theme);
        if (data.historyCount !== undefined) setThemeHistoryCount(data.historyCount);
        addToast('success', 'Theme Rolled Back', data.message || 'Previous published theme restored.');
        return true;
      }
      addToast('error', 'Rollback Failed', data.error);
      return false;
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return false;
    }
  };

  const discardDraftTheme = async () => {
    try {
      const res = await fetch('/api/theme/discard', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setThemeConfig(data.theme);
        if (data.historyCount !== undefined) setThemeHistoryCount(data.historyCount);
        addToast('info', 'Draft Discarded', 'Active published theme restored.');
        return true;
      }
      addToast('error', 'Discard Failed', data.error);
      return false;
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return false;
    }
  };

  const resetTheme = async () => {
    try {
      const res = await fetch('/api/theme/reset', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setThemeConfig(data.theme);
        if (data.historyCount !== undefined) setThemeHistoryCount(data.historyCount);
        addToast('info', 'Theme Reset', 'Theme reverted to default clean palette.');
        return true;
      }
      return false;
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return false;
    }
  };

  const updateHomepageSections = async (sections: HomepageSection[]) => {
    try {
      const res = await fetch('/api/homepage-sections', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(sections),
      });
      const data = await res.json();
      if (res.ok) {
        setHomepageSections(data.sections);
        addToast('success', 'Layout Updated', 'Homepage section arrangement saved.');
        return true;
      }
      addToast('error', 'Save Failed', data.error);
      return false;
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return false;
    }
  };

  const updateNavigationConfig = async (config: NavigationConfig) => {
    try {
      const res = await fetch('/api/navigation-config', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (res.ok) {
        setNavigationConfig(data.navigationConfig);
        addToast('success', 'Navigation Saved', 'Header, footer, and announcement bar updated.');
        return true;
      }
      addToast('error', 'Save Failed', data.error);
      return false;
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return false;
    }
  };

  const updateFeatureFlags = async (flags: Partial<FeatureFlags>) => {
    try {
      const res = await fetch('/api/feature-flags', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(flags),
      });
      const data = await res.json();
      if (res.ok) {
        setFeatureFlags(data.featureFlags);
        addToast('success', 'Feature Flags Saved', 'System modules and routing updated.');
        return true;
      }
      addToast('error', 'Flags Update Failed', data.error);
      return false;
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return false;
    }
  };

  const updateMarketSettings = async (newMarketSettings: Partial<MarketSettings>) => {
    try {
      const res = await fetch('/api/market-settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(newMarketSettings),
      });
      const data = await res.json();
      if (res.ok) {
        setMarketSettings(data.marketSettings);
        addToast('success', 'Market Identity Saved', `Set location identity to ${data.marketSettings.primaryCity}, ${data.marketSettings.regionOrState}`);
        return true;
      }
      addToast('error', 'Market Update Failed', data.error);
      return false;
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return false;
    }
  };

  const saveForm = async (form: Partial<CustomFormDefinition>) => {
    try {
      const isEdit = form.id && forms.some((f) => f.id === form.id);
      const url = isEdit ? `/api/forms/${form.id}` : '/api/forms';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshData();
        addToast('success', 'Form Saved', `Custom form ${data.name || ''} updated.`);
        return true;
      }
      addToast('error', 'Save Form Failed', data.error);
      return false;
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return false;
    }
  };

  const submitCustomForm = async (slug: string, data: Record<string, any>) => {
    try {
      const res = await fetch(`/api/forms/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        await refreshData();
        addToast('success', 'Form Submitted', result.message);
        return { success: true, message: result.message };
      }
      addToast('error', 'Submission Failed', result.error);
      return { success: false, message: result.error };
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return { success: false, message: err.message };
    }
  };

  const savePage = async (page: Partial<PageDefinition>) => {
    try {
      const isEdit = page.id && pages.some((p) => p.id === page.id);
      const url = isEdit ? `/api/pages/${page.id}` : '/api/pages';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(page),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshData();
        addToast('success', 'Page Saved', `Page ${data.title || ''} published.`);
        return true;
      }
      addToast('error', 'Save Page Failed', data.error);
      return false;
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return false;
    }
  };

  const deletePage = async (id: string) => {
    try {
      const res = await fetch(`/api/pages/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await refreshData();
        addToast('info', 'Page Removed', 'Custom landing page deleted.');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const getPage = (slugOrId: string): SitePage | undefined => {
    const clean = slugOrId.startsWith('/') ? slugOrId : `/${slugOrId}`;
    return sitePages.find(
      (p) => p.id === slugOrId || p.slug === slugOrId || p.slug === clean || p.id === `page-${slugOrId}`
    );
  };

  const getPageSection = (pageSlug: string, sectionTypeOrId: string): PageSection | undefined => {
    const page = getPage(pageSlug);
    if (!page) return undefined;
    return page.sections.find((s) => s.id === sectionTypeOrId || s.type === sectionTypeOrId);
  };

  const updateSitePage = async (id: string, updates: Partial<SitePage>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/site-pages/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated: SitePage = await res.json();
        setSitePages((prev) => prev.map((p) => (p.id === id || p.slug === id ? { ...p, ...updated } : p)));
        addToast('success', 'Page Updated', `Saved changes to "${updated.title}"`);
        return true;
      }
      addToast('error', 'Update Failed', 'Server rejected page update request');
      return false;
    } catch (err: any) {
      addToast('error', 'Update Error', err.message || 'Could not save page');
      return false;
    }
  };

  const updatePageSection = async (pageId: string, sectionId: string, sectionUpdates: Partial<PageSection>): Promise<boolean> => {
    const page = sitePages.find((p) => p.id === pageId || p.slug === pageId);
    if (!page) return false;
    const updatedSections = page.sections.map((s) => (s.id === sectionId ? { ...s, ...sectionUpdates } : s));
    return updateSitePage(page.id, { sections: updatedSections });
  };

  const addPageSection = async (pageId: string, section: PageSection): Promise<boolean> => {
    const page = sitePages.find((p) => p.id === pageId || p.slug === pageId);
    if (!page) return false;
    const updatedSections = [...page.sections, section];
    return updateSitePage(page.id, { sections: updatedSections });
  };

  const deletePageSection = async (pageId: string, sectionId: string): Promise<boolean> => {
    const page = sitePages.find((p) => p.id === pageId || p.slug === pageId);
    if (!page) return false;
    const updatedSections = page.sections.filter((s) => s.id !== sectionId);
    return updateSitePage(page.id, { sections: updatedSections });
  };

  const resetSitePage = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/site-pages/${id}/reset`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const resetPage = await res.json();
        setSitePages((prev) => prev.map((p) => (p.id === id ? resetPage : p)));
        addToast('success', 'Page Reset', `Reset "${resetPage.title}" to default.`);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const saveServiceArea = async (area: Partial<ServiceArea>) => {
    try {
      const isEdit = area.id && serviceAreas.some((a) => a.id === area.id);
      const url = isEdit ? `/api/service-areas/${area.id}` : '/api/service-areas';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(area),
      });
      if (res.ok) {
        await refreshData();
        addToast('success', 'Service Territory Saved', 'Territory list updated.');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const deleteServiceArea = async (id: string) => {
    try {
      const res = await fetch(`/api/service-areas/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await refreshData();
        addToast('info', 'Territory Removed', 'Service area deleted.');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const saveTechnician = async (tech: Partial<Technician>) => {
    try {
      const isEdit = tech.id && technicians.some((t) => t.id === tech.id);
      const url = isEdit ? `/api/technicians/${tech.id}` : '/api/technicians';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(tech),
      });
      if (res.ok) {
        await refreshData();
        addToast('success', 'Technician Saved', 'Staff list updated.');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const deleteTechnician = async (id: string) => {
    try {
      const res = await fetch(`/api/technicians/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await refreshData();
        addToast('info', 'Technician Removed', 'Technician profile deleted.');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const portalLookup = async (params: { email?: string; appointmentNumber?: string }) => {
    try {
      const res = await fetch('/api/portal/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Customer record not found.' };
      }
      return {
        success: true,
        customer: data.customer,
        appointments: data.appointments || [],
        estimates: data.estimates || [],
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lookup failed.' };
    }
  };

  const saveAdminUser = async (user: Partial<AdminUser> & { password?: string }) => {
    try {
      const isEdit = user.id && adminUsers.some((u) => u.id === user.id);
      const url = isEdit ? `/api/admin/users/${user.id}` : '/api/admin/users';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(user),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await refreshData();
        addToast('success', 'User Saved', isEdit ? 'User account and permissions updated.' : 'New staff account created.');
        return true;
      }
      addToast('error', 'Save Failed', data.error || 'Could not save user account.');
      return false;
    } catch {
      return false;
    }
  };

  const deleteAdminUser = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await refreshData();
        addToast('info', 'Team Member Removed', 'User access revoked.');
        return true;
      }
      addToast('error', 'Remove Failed', data.error || 'Could not remove user.');
      return false;
    } catch {
      return false;
    }
  };

  const adminResetUserPassword = async (userId: string, newPassword: string, mustChangePassword = true) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ newPassword, mustChangePassword }),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshData();
        addToast('success', 'Password Reset', data.message || 'User password updated.');
        return true;
      }
      addToast('error', 'Reset Failed', data.error || 'Could not reset password.');
      return false;
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return false;
    }
  };

  const adminGenerateResetToken = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-token`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        addToast('success', 'Recovery Token Issued', 'Single-use password recovery token ready.');
        return { success: true, token: data.token, expiresAt: data.expiresAt };
      }
      addToast('error', 'Failed', data.error || 'Could not issue recovery token.');
      return { success: false, error: data.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const setupSuperAdmin = async (payload: {
    name: string;
    email: string;
    username?: string;
    password: string;
    phone?: string;
  }) => {
    try {
      const res = await fetch('/api/auth/setup-super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast('error', 'Setup Failed', data.error || 'Could not initialize Super Admin.');
        return { success: false, error: data.error };
      }
      setStoredAuthToken(data.token);
      setAuthToken(data.token);
      setAdminUser(data.user);
      setNeedsInitialSetup(false);
      await refreshData(data.token);
      const targetRoute = data.redirectRoute || getDashboardRouteForRole(data.user?.role);
      setCurrentRoute(targetRoute);
      addToast('success', 'Super Admin Ready', data.message);
      return { success: true, redirectRoute: targetRoute };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const loginWithCredentials = async (identifier: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid credentials.' };
      }
      setStoredAuthToken(data.token);
      setAuthToken(data.token);
      setAdminUser(data.user);
      await refreshData(data.token);
      const targetRoute = data.redirectRoute || getDashboardRouteForRole(data.user?.role);
      setCurrentRoute(targetRoute);
      addToast('success', 'Signed In', data.message);
      return { success: true, redirectRoute: targetRoute };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  };

  const loginAdmin = async (email: string, _role?: string, password?: string) => {
    const res = await loginWithCredentials(email, password || '');
    if (!res.success && res.error) {
      addToast('error', 'Login Failed', res.error);
    }
    return res.success;
  };

  const logoutAdmin = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
    } catch {
      // Ignore network errors during cleanup
    } finally {
      setStoredAuthToken(null);
      setAuthToken(null);
      setAdminUser(null);
      setLeads([]);
      setAppointments([]);
      setEstimates([]);
      setCustomers([]);
      setIntegrations([]);
      setAuditLogs([]);
      setAdminUsers([]);
      setClientTenants([]);
      setSaasMetrics(null);
      setCurrentRoute('/admin');
      addToast('info', 'Signed Out', 'Your staff session has been terminated.');
    }
  };

  const changeOwnPassword = async (currentPassword: string, newPassword: string) => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Could not update password.' };
      }
      if (data.user) setAdminUser(data.user);
      addToast('success', 'Password Updated', data.message);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const requestPasswordReset = async (identifier: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error };
      }
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const resetPasswordWithToken = async (token: string, newPassword: string) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error };
      }
      addToast('success', 'Password Reset', data.message);
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const searchContent = async (query: string) => {
    try {
      const res = await fetch('/api/admin/search-content', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (res.ok) {
        return { totalMatches: data.totalMatches, matches: data.matches };
      }
      addToast('error', 'Search Failed', data.error);
      return { totalMatches: 0, matches: [] };
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return { totalMatches: 0, matches: [] };
    }
  };

  const replaceContent = async (searchStr: string, replaceStr: string, selectedIds?: string[]) => {
    try {
      const res = await fetch('/api/admin/replace-content', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ searchStr, replaceStr, selectedIds }),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshData();
        addToast('success', 'Replacements Applied', data.message);
        return { replacedCount: data.replacedCount, message: data.message };
      }
      addToast('error', 'Replace Failed', data.error);
      return { replacedCount: 0, message: data.error };
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return { replacedCount: 0, message: err.message };
    }
  };

  // -------------------------------------------------------------
  // SAAS & SUPER ADMIN ACTIONS
  // -------------------------------------------------------------
  const fetchSuperAdminClients = async () => {
    try {
      const res = await fetch('/api/super-admin/clients', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setClientTenants(data.clients || []);
        setSaasMetrics(data.metrics || null);
      }
    } catch (err: any) {
      console.error('Failed to fetch super admin client roster:', err);
    }
  };

  const createClientTenant = async (tenantData: Partial<ClientTenant>) => {
    try {
      const res = await fetch('/api/super-admin/clients', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(tenantData),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchSuperAdminClients();
        addToast('success', 'Client Provisioned', `Tenant ${data.companyName} created successfully.`);
        return { success: true, tenant: data };
      }
      addToast('error', 'Provisioning Failed', data.error);
      return { success: false, message: data.error };
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return { success: false, message: err.message };
    }
  };

  const updateClientTenant = async (id: string, updates: Partial<ClientTenant>) => {
    try {
      const res = await fetch(`/api/super-admin/clients/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchSuperAdminClients();
        addToast('success', 'Subscription Updated', `Client details updated.`);
        return true;
      }
      addToast('error', 'Update Failed', data.error);
      return false;
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return false;
    }
  };

  const toggleClientStatus = async (id: string, status?: string) => {
    try {
      const res = await fetch(`/api/super-admin/clients/${id}/toggle-status`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchSuperAdminClients();
        addToast('info', 'Status Updated', `Client is now ${data.status}.`);
        return true;
      }
      addToast('error', 'Action Failed', data.error);
      return false;
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return false;
    }
  };

  const recordClientInvoice = async (id: string, invoiceData: Partial<SaasInvoiceRecord>) => {
    try {
      const res = await fetch(`/api/super-admin/clients/${id}/invoices`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(invoiceData),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchSuperAdminClients();
        addToast('success', 'Payment Recorded', `Invoice payment of $${data.invoice.amount} confirmed.`);
        return true;
      }
      addToast('error', 'Invoice Failed', data.error);
      return false;
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return false;
    }
  };

  const deleteClientTenant = async (id: string) => {
    try {
      const res = await fetch(`/api/super-admin/clients/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        await fetchSuperAdminClients();
        addToast('success', 'Client Removed', data.message);
        return true;
      }
      addToast('error', 'Delete Failed', data.error);
      return false;
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return false;
    }
  };

  const submitSaasInquiry = async (data: any) => {
    try {
      const res = await fetch('/api/saas/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        addToast('success', 'Inquiry Received', result.message);
        return { success: true, message: result.message };
      }
      addToast('error', 'Submission Failed', result.error);
      return { success: false, message: result.error };
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return { success: false, message: err.message };
    }
  };

  const updateSaasConfig = async (newConfig: Partial<SaasPlatformConfig>) => {
    try {
      const res = await fetch('/api/saas/config', {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(newConfig),
      });
      const data = await res.json();
      if (res.ok) {
        setSaasConfig(data);
        addToast('success', 'SaaS Settings Saved', 'Pricing tiers and configurations updated.');
        return true;
      }
      addToast('error', 'Save Failed', data.error);
      return false;
    } catch (err: any) {
      addToast('error', 'Network Error', err.message);
      return false;
    }
  };

  const formatCurrency = (amount: number): string => {
    const curr = settings?.currency || 'USD';
    const symbolMap: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'CA$',
      AUD: 'A$',
      NZD: 'NZ$',
      JPY: '¥',
      CHF: 'CHF ',
    };
    const symbol = symbolMap[curr.toUpperCase()] || (curr.length <= 3 && !/^[A-Z]{3}$/.test(curr) ? curr : `${curr} `);
    return `${symbol}${amount.toLocaleString()}`;
  };

  return (
    <AppContext.Provider
      value={{
        formatCurrency,
        settings,
        services,
        serviceAreas,
        technicians,
        membershipPlans,
        promotions,
        reviews,
        articles,
        projects,
        leads,
        appointments,
        estimates,
        customers,
        integrations,
        auditLogs,
        loading,
        themeConfig,
        homepageSections,
        navigationConfig,
        featureFlags,
        marketSettings,
        forms,
        pages,
        adminUsers,
        adminUser,
        needsInitialSetup,
        userPermissions,
        allowedTabs,
        hasUserPermission,
        saasConfig,
        currentTenant,
        clientTenants,
        saasMetrics,
        isSaasPricingModalOpen,
        setIsSaasPricingModalOpen,
        currentCustomer,
        currentRoute,
        setCurrentRoute,
        isBookingModalOpen,
        openBookingModal,
        closeBookingModal,
        isEmergencyModalOpen,
        openEmergencyModal,
        closeEmergencyModal,
        isEstimateModalOpen,
        openEstimateModal,
        closeEstimateModal,
        isMaintenanceModalOpen,
        openMaintenanceModal,
        closeMaintenanceModal,
        isCommercialModalOpen,
        openCommercialModal,
        closeCommercialModal,
        isAiChatOpen,
        setIsAiChatOpen,
        isSetupWizardOpen,
        setIsSetupWizardOpen,
        preselectedServiceId,
        submitLead,
        submitAppointment,
        updateAppointmentStatus,
        updateLeadStatus,
        assignTechnicianToLead,
        convertLeadToAppointment,
        addDispatcherNote,
        checkZipCoverage,
        approveEstimate,
        rejectEstimate,
        createEstimate,
        updateEstimateStatus,
        deleteEstimate,
        submitReview,
        updateBusinessSettings,
        saveServiceRecord,
        deleteServiceRecord,
        saveServiceArea,
        deleteServiceArea,
        saveTechnician,
        deleteTechnician,
        savePromotion,
        deletePromotion,
        saveArticle,
        deleteArticle,
        addCustomerEquipment,
        deleteCustomerEquipment,
        cancelPortalAppointment,
        updateTechnician,
        enrollMembership,
        testIntegration,
        updateIntegration,
        themeHistoryCount,
        updateTheme,
        publishTheme,
        rollbackTheme,
        discardDraftTheme,
        resetTheme,
        updateHomepageSections,
        updateNavigationConfig,
        updateFeatureFlags,
        updateMarketSettings,
        saveForm,
        submitCustomForm,
        savePage,
        deletePage,
        sitePages,
        getPage,
        getPageSection,
        updateSitePage,
        updatePageSection,
        addPageSection,
        deletePageSection,
        resetSitePage,
        isPageEditorOpen,
        setIsPageEditorOpen,
        editingPageId,
        setEditingPageId,
        saveAdminUser,
        deleteAdminUser,
        adminResetUserPassword,
        adminGenerateResetToken,
        setupSuperAdmin,
        loginWithCredentials,
        loginAdmin,
        logoutAdmin,
        changeOwnPassword,
        requestPasswordReset,
        resetPasswordWithToken,
        portalLookup,
        searchContent,
        replaceContent,
        fetchSuperAdminClients,
        createClientTenant,
        updateClientTenant,
        toggleClientStatus,
        recordClientInvoice,
        deleteClientTenant,
        submitSaasInquiry,
        updateSaasConfig,
        toasts,
        addToast,
        removeToast,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
