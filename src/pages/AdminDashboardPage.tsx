import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart3,
  Users,
  Calendar,
  AlertTriangle,
  FileText,
  Wrench,
  Sliders,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  ExternalLink,
  Shield,
  Layers,
  Send,
  Zap,
  UserCheck,
  CalendarPlus,
  MessageSquare,
  AlertCircle,
  MapPin,
  Building2,
  Flame,
  Wind,
  Palette,
  Layout,
  Compass,
  ToggleLeft,
  ToggleRight,
  Globe,
  Replace,
  FormInput,
  FolderOpen,
  UserCog,
  LogOut,
  Save,
  RotateCcw,
  Undo2,
  History,
  Image as ImageIcon,
  Eye,
  Star,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Trash2,
  Edit,
  ArrowUp,
  ArrowDown,
  Lock,
  CreditCard,
  Receipt,
  TrendingUp,
  Key,
  Award,
  DollarSign,
  Ban,
  Copy,
  Sparkles,
} from 'lucide-react';
import {
  Lead,
  Appointment,
  Estimate,
  ServiceRecord,
  HomepageSection,
  NavMenuItem,
  FeatureFlags,
  MarketSettings,
  ThemeConfig,
  CustomFormDefinition,
  PageDefinition,
  AdminUser,
  ServiceArea,
  Technician,
  Promotion,
  Review,
  Article,
  ClientTenant,
  SaasLicenseType,
  SaasPlanTier,
  SaasSubscriptionStatus,
  SaasInvoiceRecord,
} from '../types';
import { EstimatesTab } from '../components/admin/EstimatesTab';
import { TechniciansTab } from '../components/admin/TechniciansTab';
import { ArticlesTab } from '../components/admin/ArticlesTab';
import { PromotionsTab } from '../components/admin/PromotionsTab';
import { TeamRolesTab } from '../components/admin/TeamRolesTab';
import { IntegrationsTab } from '../components/admin/IntegrationsTab';
import { AuditLogTab } from '../components/admin/AuditLogTab';
import { NavigationTab } from '../components/admin/NavigationTab';
import { PageContentStudioTab } from '../components/admin/PageContentStudioTab';
import { AdminLoginGate } from '../components/admin/AdminLoginGate';
import {
  AdminTabKey,
  ROLE_DASHBOARD_ROUTES,
  ROLE_DEFAULT_TAB,
  ROLE_LABELS,
  getDashboardRouteForRole,
  normalizeStaffRole,
} from '../shared/rbac';

export const AdminDashboardPage: React.FC = () => {
  const {
    leads,
    appointments,
    estimates,
    services,
    technicians,
    promotions,
    reviews,
    articles,
    serviceAreas,
    integrations,
    auditLogs,
    settings,
    themeConfig,
    homepageSections,
    featureFlags,
    marketSettings,
    forms,
    pages,
    adminUsers,
    adminUser,
    allowedTabs,
    hasUserPermission,
    saasConfig,
    currentTenant,
    clientTenants,
    saasMetrics,
    updateLeadStatus,
    updateAppointmentStatus,
    assignTechnicianToLead,
    convertLeadToAppointment,
    addDispatcherNote,
    saveServiceRecord,
    deleteServiceRecord,
    savePromotion,
    updateBusinessSettings,
    updateTheme,
    publishTheme,
    rollbackTheme,
    discardDraftTheme,
    resetTheme,
    themeHistoryCount,
    updateHomepageSections,
    updateFeatureFlags,
    updateMarketSettings,
    saveForm,
    savePage,
    deletePage,
    logoutAdmin,
    changeOwnPassword,
    searchContent,
    replaceContent,
    createClientTenant,
    updateClientTenant,
    toggleClientStatus,
    recordClientInvoice,
    deleteClientTenant,
    updateSaasConfig,
    refreshData,
    addToast,
    currentRoute,
    setCurrentRoute,
  } = useApp();

  // Tab State
  type AdminTab = AdminTabKey;

  const normalizedRole = adminUser ? normalizeStaffRole(adminUser.role) : 'customer';
  const expectedDashboardRoute = adminUser ? getDashboardRouteForRole(adminUser.role) : '/admin';
  const roleLabel = normalizedRole !== 'customer' ? ROLE_LABELS[normalizedRole] : 'Staff';
  const defaultTabForRole: AdminTab =
    normalizedRole !== 'customer' ? ROLE_DEFAULT_TAB[normalizedRole] : allowedTabs[0] || 'overview';

  const [activeTab, setActiveTab] = useState<AdminTab>(defaultTabForRole);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sync default tab when authenticated user changes & redirect /admin to dedicated role route
  React.useEffect(() => {
    if (!adminUser) return;
    if (currentRoute === '/admin') {
      setCurrentRoute(expectedDashboardRoute);
    }
    const nextDefault =
      normalizedRole !== 'customer' && allowedTabs.includes(ROLE_DEFAULT_TAB[normalizedRole])
        ? ROLE_DEFAULT_TAB[normalizedRole]
        : allowedTabs[0] || 'overview';
    setActiveTab((prev) => (allowedTabs.includes(prev) ? prev : nextDefault));
  }, [adminUser?.id, normalizedRole, expectedDashboardRoute]);

  React.useEffect(() => {
    if (adminUser && allowedTabs.length > 0 && !allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0]);
    }
  }, [adminUser, allowedTabs, activeTab]);

  // Technician work-order local state & Change Password modal state
  const [techJobFilter, setTechJobFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [techJobNotes, setTechJobNotes] = useState<Record<string, string>>({});
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPwdInput, setCurrentPwdInput] = useState('');
  const [newPwdInput, setNewPwdInput] = useState('');
  const [confirmPwdInput, setConfirmPwdInput] = useState('');
  const [pwdChangeError, setPwdChangeError] = useState<string | null>(null);
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  // Leads CRM State
  const [leadFilterStatus, setLeadFilterStatus] = useState<string>('all');
  const [leadJourneyFilter, setLeadJourneyFilter] = useState<string>('all');
  const [leadSearch, setLeadSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Administrative Lead Workflow Actions State
  const [assignTechId, setAssignTechId] = useState<string>('');
  const [assignNotes, setAssignNotes] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  const [convertDate, setConvertDate] = useState<string>(() => new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [convertTimeSlot, setConvertTimeSlot] = useState<string>('08:00 AM - 10:00 AM');
  const [isConverting, setIsConverting] = useState<boolean>(false);

  const [newDispatcherNoteText, setNewDispatcherNoteText] = useState<string>('');
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);

  // Modals & Sub-form States
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [serviceCategory, setServiceCategory] = useState<any>('cooling');
  const [servicePrice, setServicePrice] = useState(89);
  const [serviceDesc, setServiceDesc] = useState('');

  const [isNewPromoOpen, setIsNewPromoOpen] = useState(false);
  const [promoTitle, setPromoTitle] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(50);
  const [promoDesc, setPromoDesc] = useState('');
  const [promoValidUntil, setPromoValidUntil] = useState('2026-12-31');

  // Theme Editing Local State
  const [localTheme, setLocalTheme] = useState<ThemeConfig>(
    themeConfig || {
      primaryColor: '#1d4ed8',
      secondaryColor: '#0f172a',
      accentColor: '#f59e0b',
      backgroundColor: '#f8fafc',
      surfaceColor: '#ffffff',
      primaryTextColor: '#0f172a',
      secondaryTextColor: '#475569',
      borderColor: '#e2e8f0',
      buttonRadius: 'rounded-xl',
      cardRadius: 'rounded-2xl',
      headingFont: 'Outfit',
      bodyFont: 'Plus Jakarta Sans',
      headerBg: '#ffffff',
      footerBg: '#090d16',
      heroBg: '#f8fafc',
      logoUrl: '',
      status: 'published',
      updatedAt: new Date().toISOString(),
    }
  );

  // Sync local theme when remote changes
  React.useEffect(() => {
    if (themeConfig) setLocalTheme(themeConfig);
  }, [themeConfig]);

  // Authentication and role access are strictly verified via credentials and session

  // Global Search & Replace State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchTotal, setSearchTotal] = useState<number | null>(null);
  const [replaceTarget, setReplaceTarget] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);

  // Form Builder State
  const [isNewFormOpen, setIsNewFormOpen] = useState(false);
  const [newFormName, setNewFormName] = useState('');
  const [newFormEmail, setNewFormEmail] = useState('dispatch@apexairflow.com');
  const [newFormFields, setNewFormFields] = useState<Array<{ id: string; label: string; type: any; required: boolean }>>([
    { id: 'f-1', label: 'Full Name', type: 'text', required: true },
    { id: 'f-2', label: 'Phone Number', type: 'tel', required: true },
    { id: 'f-3', label: 'Email Address', type: 'email', required: false },
    { id: 'f-4', label: 'Service Inquiry', type: 'textarea', required: true },
  ]);

  // Page Builder State
  const [isNewPageOpen, setIsNewPageOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [pageMeta, setPageMeta] = useState('');
  const [pageHeroTitle, setPageHeroTitle] = useState('');
  const [pageHeroContent, setPageHeroContent] = useState('');

  // Market Settings Local State
  const [localMarket, setLocalMarket] = useState<MarketSettings>(
    marketSettings || {
      country: 'United States',
      regionOrState: 'State',
      primaryCity: 'Metro Area',
      serviceRadiusMiles: 45,
      currency: '$',
      temperatureUnit: 'F',
      postalCodeLabel: 'ZIP Code',
      taxRate: 0.0825,
      emergencyDispatchSlaMinutes: 15,
      businessHoursText: 'Mon - Sat: 7:00 AM - 8:00 PM | Sun: Emergency Dispatch Only',
      closedSundaysForRoutine: true,
    }
  );

  React.useEffect(() => {
    if (marketSettings) setLocalMarket(marketSettings);
  }, [marketSettings]);

  // -------------------------------------------------------------
  // SAAS & CLIENT TENANT MANAGEMENT LOCAL STATE
  // -------------------------------------------------------------
  const [clientSearch, setClientSearch] = useState('');
  const [clientModelFilter, setClientModelFilter] = useState<'all' | 'monthly_rental' | 'one_time_buyout'>('all');
  const [clientStatusFilter, setClientStatusFilter] = useState<string>('all');
  const [selectedClientForAction, setSelectedClientForAction] = useState<ClientTenant | null>(null);

  // Modals for SaaS
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isInvoicesDrawerOpen, setIsInvoicesDrawerOpen] = useState(false);

  // New Client Form
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientOwner, setNewClientOwner] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientSubdomain, setNewClientSubdomain] = useState('');
  const [newClientPrimaryDomain, setNewClientPrimaryDomain] = useState('');
  const [newClientModel, setNewClientModel] = useState<SaasLicenseType>('monthly_rental');
  const [newClientTier, setNewClientTier] = useState<SaasPlanTier>('professional');
  const [newClientMonthlyFee, setNewClientMonthlyFee] = useState<number>(299);
  const [newClientBuyoutFee, setNewClientBuyoutFee] = useState<number>(2999);
  const [newClientStatus, setNewClientStatus] = useState<SaasSubscriptionStatus>('active');
  const [newClientNotes, setNewClientNotes] = useState('');

  // Edit Client Form
  const [editClientModel, setEditClientModel] = useState<SaasLicenseType>('monthly_rental');
  const [editClientTier, setEditClientTier] = useState<SaasPlanTier>('professional');
  const [editClientMonthlyFee, setEditClientMonthlyFee] = useState<number>(299);
  const [editClientBuyoutFee, setEditClientBuyoutFee] = useState<number>(2999);
  const [editClientStatus, setEditClientStatus] = useState<SaasSubscriptionStatus>('active');
  const [editClientRenewal, setEditClientRenewal] = useState('');
  const [editClientNotes, setEditClientNotes] = useState('');

  // Record Invoice Form
  const [invoiceAmount, setInvoiceAmount] = useState<number>(299);
  const [invoiceType, setInvoiceType] = useState<'rental_charge' | 'one_time_buyout' | 'addon_setup'>('rental_charge');
  const [invoicePaymentMethod, setInvoicePaymentMethod] = useState('Credit Card / Stripe');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState<'paid' | 'pending'>('paid');

  // SaaS Plans Pricing Local State
  const [localSaasPlans, setLocalSaasPlans] = useState(saasConfig?.plans || []);
  React.useEffect(() => {
    if (saasConfig?.plans) setLocalSaasPlans(saasConfig.plans);
  }, [saasConfig]);

  // Sizing of KPI metrics
  const emergencyLeadsCount = leads.filter((l) => l.urgency === 'emergency').length;
  const activeAppointmentsCount = appointments.filter((a) => ['confirmed', 'in_progress'].includes(a.status)).length;
  const totalEstimatesValue = estimates.reduce((acc, curr) => acc + curr.totalAmount, 0);

  const filteredLeads = leads.filter((l) => {
    const matchesStatus = leadFilterStatus === 'all' || l.status === leadFilterStatus;
    const matchesJourney =
      leadJourneyFilter === 'all' ||
      (leadJourneyFilter === 'emergency' && (l.urgency === 'emergency' || l.journey === 'emergency')) ||
      (leadJourneyFilter === 'commercial' && (l.propertyType === 'commercial' || l.journey === 'commercial')) ||
      (leadJourneyFilter === 'estimate' && (l.journey === 'estimate' || l.source === 'installation_estimate' || l.source === 'estimate_tool')) ||
      (leadJourneyFilter === 'maintenance' && (l.journey === 'maintenance' || l.source === 'maintenance_request')) ||
      (leadJourneyFilter === 'routine' && (l.journey === 'routine' || l.source === 'online_booking'));

    const matchesSearch =
      l.customerName.toLowerCase().includes(leadSearch.toLowerCase()) ||
      l.phone.includes(leadSearch) ||
      l.leadNumber.toLowerCase().includes(leadSearch.toLowerCase()) ||
      l.serviceRequested.toLowerCase().includes(leadSearch.toLowerCase()) ||
      (l.assignedTechnicianName && l.assignedTechnicianName.toLowerCase().includes(leadSearch.toLowerCase()));

    return matchesStatus && matchesJourney && matchesSearch;
  });

  // Search & Replace Handlers
  const handlePerformSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      addToast('error', 'Search Error', 'Query must be at least 2 characters');
      return;
    }
    setIsSearching(true);
    const res = await searchContent(searchQuery.trim());
    setSearchResults(res.matches);
    setSearchTotal(res.totalMatches);
    setSelectedMatchIds(res.matches.map((m: any) => m.id));
    setIsSearching(false);
  };

  const handlePerformReplace = async () => {
    if (!searchQuery.trim() || !replaceTarget) {
      addToast('error', 'Replace Error', 'Both search and replace terms are required');
      return;
    }
    setIsReplacing(true);
    const res = await replaceContent(searchQuery.trim(), replaceTarget, selectedMatchIds);
    setIsReplacing(false);
    if (res.replacedCount > 0) {
      // Re-run search to show fresh state
      const refreshed = await searchContent(replaceTarget);
      setSearchResults(refreshed.matches);
      setSearchTotal(refreshed.totalMatches);
    }
  };

  // Secure Login Gate: Require authenticated user credentials
  if (!adminUser) {
    return <AdminLoginGate />;
  }

  // Enforce URL isolation: block users from manually navigating to another role's dedicated dashboard
  const isKnownRoleRoute = Object.values(ROLE_DASHBOARD_ROUTES).includes(currentRoute);
  if ((isKnownRoleRoute && currentRoute !== expectedDashboardRoute) || allowedTabs.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-bold">
              403 Access Restricted
            </span>
            <h2 className="text-xl font-extrabold font-heading">Unauthorized Dashboard Route</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your account (<strong>{adminUser.name}</strong> · {roleLabel}) is not authorized to open{' '}
              <span className="font-mono text-slate-200">{currentRoute}</span>.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setCurrentRoute(expectedDashboardRoute)}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
            >
              Return to {roleLabel} Dashboard
            </button>
            <button
              type="button"
              onClick={logoutAdmin}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl cursor-pointer transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const effectiveTab: AdminTab = allowedTabs.includes(activeTab) ? activeTab : allowedTabs[0];

  const saasMenuItems = [
    { key: 'saas_clients', label: `Client Tenants (${clientTenants.length})`, icon: Building2 },
    { key: 'saas_plans', label: 'SaaS Pricing & Plans', icon: CreditCard },
    {
      key: 'my_subscription',
      label: normalizedRole === 'super_admin' ? 'Client Billing View' : 'Account & Subscription',
      icon: Receipt,
    },
  ].filter((item) => allowedTabs.includes(item.key as AdminTab));

  const operationsMenuItems = [
    { key: 'overview', label: 'Executive Dashboard', icon: BarChart3 },
    { key: 'my_jobs', label: `My Work Orders (${appointments.length})`, icon: Wrench },
    { key: 'leads', label: `Leads & CRM (${leads.length})`, icon: Users },
    { key: 'appointments', label: `Dispatch Calendar (${appointments.length})`, icon: Calendar },
    { key: 'estimates', label: `Estimates (${estimates.length})`, icon: FileText },
    { key: 'technicians', label: `Technicians (${technicians.length})`, icon: Wrench },
  ].filter((item) => allowedTabs.includes(item.key as AdminTab));

  const platformMenuItems = [
    { key: 'theme', label: 'Visual Theme & Colors', icon: Palette },
    { key: 'page_studio', label: 'All Pages Content Studio', icon: Layers },
    { key: 'homepage', label: 'Homepage Builder', icon: Layout },
    { key: 'navigation', label: 'Navigation & Header/Footer', icon: Compass },
    { key: 'flags', label: 'Feature Flags Matrix', icon: ToggleRight },
    { key: 'market', label: 'Business & Market Identity', icon: Globe },
  ].filter((item) => allowedTabs.includes(item.key as AdminTab));

  const contentMenuItems = [
    { key: 'services', label: `Services Catalog (${services.length})`, icon: Layers },
    { key: 'areas', label: `Service Territories (${serviceAreas.length})`, icon: MapPin },
    { key: 'reviews', label: `Reviews & Ratings (${reviews.length})`, icon: MessageSquare },
    { key: 'articles', label: `Blog & Articles (${articles.length})`, icon: FileText },
    { key: 'promotions', label: `Promotions & Rebates (${promotions.length})`, icon: Sliders },
  ].filter((item) => allowedTabs.includes(item.key as AdminTab));

  const securityMenuItems = [
    { key: 'search_replace', label: 'Global Search & Replace', icon: Replace },
    { key: 'forms', label: `Form Builder (${forms.length})`, icon: FormInput },
    { key: 'pages', label: `Custom Pages (${pages.length})`, icon: FolderOpen },
    { key: 'users', label: `User Accounts & Roles (${adminUsers.length})`, icon: UserCog },
    { key: 'integrations', label: `Integrations (${integrations.length})`, icon: Zap },
    { key: 'audit', label: `Audit Log (${auditLogs.length})`, icon: Clock },
  ].filter((item) => allowedTabs.includes(item.key as AdminTab));

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Bar for Admin Header */}
      <header className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between border-b border-slate-800 shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentRoute('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-base text-white">
              A
            </div>
            <div className="text-left">
              <span className="font-extrabold text-sm tracking-tight text-white block">
                {settings?.businessName || 'Airflow Climate Solutions'}{' '}
                <span className="text-blue-400 font-mono text-xs">{roleLabel} Workspace</span>
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                {expectedDashboardRoute} · {localMarket.primaryCity}, {localMarket.regionOrState}
              </span>
            </div>
          </button>

          {/* Draft Theme Warning if Unsaved Theme */}
          {themeConfig?.status === 'draft' && hasUserPermission('manage_theme') && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-300 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Theme draft active</span>
              <button
                onClick={publishTheme}
                className="ml-2 px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[11px] transition-colors cursor-pointer"
              >
                Publish Now
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refreshData()}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Refresh Authorized Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentRoute('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View Live Site</span>
          </button>

          <div className="h-6 w-px bg-slate-800" />

          {/* Authenticated User Identity Badge (Zero Role Switching) */}
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl">
            <div className="text-right leading-tight">
              <span className="text-xs font-bold text-white block">{adminUser.name}</span>
              <span className="text-[10px] font-mono text-blue-300 block">
                {roleLabel} · @{adminUser.username || adminUser.email.split('@')[0]}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setPwdChangeError(null);
              setIsChangePasswordOpen(true);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              adminUser.mustChangePassword
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="Update My Password"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Password</span>
          </button>

          <button
            onClick={logoutAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-300 hover:text-rose-300 hover:bg-slate-800 rounded-lg transition-colors text-xs font-semibold whitespace-nowrap cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Admin Workspace Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Collapsible Sidebar (Filtered Strictly by Permissions) */}
        <aside
          className={`${
            sidebarCollapsed ? 'w-16' : 'w-64'
          } bg-white border-r border-slate-200 transition-all duration-200 flex flex-col shrink-0 overflow-y-auto`}
        >
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <span className={`text-[10px] font-bold text-slate-400 uppercase tracking-wider ${sidebarCollapsed ? 'hidden' : 'block'}`}>
              {roleLabel} Modules
            </span>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sidebar Menu Groups */}
          <div className="p-2 space-y-6 flex-1 text-xs font-semibold">
            {saasMenuItems.length > 0 && (
              <div>
                {!sidebarCollapsed && (
                  <div className="px-2.5 pb-1.5 text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center justify-between">
                    <span>SaaS & Subscriptions</span>
                    {normalizedRole === 'super_admin' && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-mono font-bold">SUPER</span>
                    )}
                  </div>
                )}
                <div className="space-y-1">
                  {saasMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = effectiveTab === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setActiveTab(item.key as AdminTab)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-amber-50 text-amber-800 font-bold border border-amber-200'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                        title={item.label}
                      >
                        <Icon className="w-4 h-4 shrink-0 text-amber-600" />
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {operationsMenuItems.length > 0 && (
              <div>
                {!sidebarCollapsed && (
                  <div className="px-2.5 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Operations & Dispatch
                  </div>
                )}
                <div className="space-y-1">
                  {operationsMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = effectiveTab === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setActiveTab(item.key as AdminTab)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                        title={item.label}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {platformMenuItems.length > 0 && (
              <div>
                {!sidebarCollapsed && (
                  <div className="px-2.5 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Platform & Design
                  </div>
                )}
                <div className="space-y-1">
                  {platformMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = effectiveTab === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setActiveTab(item.key as AdminTab)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                        title={item.label}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {contentMenuItems.length > 0 && (
              <div>
                {!sidebarCollapsed && (
                  <div className="px-2.5 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Content Management
                  </div>
                )}
                <div className="space-y-1">
                  {contentMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = effectiveTab === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setActiveTab(item.key as AdminTab)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                        title={item.label}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {securityMenuItems.length > 0 && (
              <div>
                {!sidebarCollapsed && (
                  <div className="px-2.5 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Utilities & Security
                  </div>
                )}
                <div className="space-y-1">
                  {securityMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = effectiveTab === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setActiveTab(item.key as AdminTab)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                        title={item.label}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          {adminUser.mustChangePassword && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Security Notice:</strong> Your account uses a temporary or administrator-reset password. Please set a new personal password now.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(true)}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg whitespace-nowrap cursor-pointer"
              >
                Change Password
              </button>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB: EXECUTIVE OVERVIEW                                        */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'overview' && (
            <div className="space-y-8">
              {/* KPI Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Pipeline Leads</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-black text-slate-900 font-mono">{leads.length}</span>
                    <span className="text-xs font-semibold text-emerald-600">Active</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">Emergency Requests</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-black text-rose-700 font-mono">{emergencyLeadsCount}</span>
                    <span className="text-xs font-semibold text-rose-600">24/7 Priority</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Dispatches</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-black text-blue-700 font-mono">{activeAppointmentsCount}</span>
                    <span className="text-xs font-semibold text-slate-500">{appointments.length} Total</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Estimates Pipeline</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {localMarket.currency}{Math.round(totalEstimatesValue).toLocaleString()}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600">{estimates.length} Quotes</span>
                  </div>
                </div>
              </div>

              {/* Quick Launchpad to Authorized Administration Functions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {allowedTabs.includes('theme') && (
                  <button
                    onClick={() => setActiveTab('theme')}
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all text-left flex items-center gap-3.5 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">Visual Theme</span>
                      <span className="text-[11px] text-slate-500">Colors, typography, palettes</span>
                    </div>
                  </button>
                )}

                {allowedTabs.includes('homepage') && (
                  <button
                    onClick={() => setActiveTab('homepage')}
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all text-left flex items-center gap-3.5 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <Layout className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">Homepage Builder</span>
                      <span className="text-[11px] text-slate-500">Reorder & customize blocks</span>
                    </div>
                  </button>
                )}

                {allowedTabs.includes('flags') && (
                  <button
                    onClick={() => setActiveTab('flags')}
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all text-left flex items-center gap-3.5 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <ToggleRight className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">Feature Flags</span>
                      <span className="text-[11px] text-slate-500">Toggle site modules on/off</span>
                    </div>
                  </button>
                )}

                {allowedTabs.includes('search_replace') && (
                  <button
                    onClick={() => setActiveTab('search_replace')}
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all text-left flex items-center gap-3.5 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      <Replace className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">Search & Replace</span>
                      <span className="text-[11px] text-slate-500">Global safe text replacement</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Dual Column Feeds */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Recent Leads Feed (7 cols) */}
                <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-sm font-heading">Recent Inbound Leads & Emergencies</h3>
                    <button
                      onClick={() => setActiveTab('leads')}
                      className="text-xs text-blue-700 hover:underline font-semibold"
                    >
                      View CRM Board →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {leads.slice(0, 5).map((l) => (
                      <div
                        key={l.id}
                        onClick={() => {
                          setSelectedLead(l);
                          setActiveTab('leads');
                        }}
                        className="p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 bg-slate-50/50 hover:bg-white transition-all cursor-pointer flex items-center justify-between gap-4 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{l.customerName}</span>
                            <span className="text-slate-400 font-mono">({l.leadNumber})</span>
                            {l.urgency === 'emergency' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800 uppercase animate-pulse">
                                Emergency
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">{l.serviceRequested} · {l.city}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                            {l.status.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Technician Roster (5 cols) */}
                <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-sm font-heading">Technician Dispatch Status</h3>
                    <span className="text-xs text-emerald-700 font-semibold">{technicians.filter((t) => t.active).length} On-Duty</span>
                  </div>

                  <div className="space-y-3">
                    {technicians.map((t) => (
                      <div key={t.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{t.name}</div>
                          <div className="text-[11px] text-slate-500">{t.role}</div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Active
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">{t.completedJobsCount} jobs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB: SAAS CLIENT TENANTS & SUBSCRIPTIONS (SUPER ADMIN)         */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'saas_clients' && (
            <div className="space-y-8">
              {/* Header & Quick Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-900 font-heading">
                      Client Tenants & Subscription Engine
                    </h2>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-100 text-amber-800 rounded">
                      SUPER ADMIN ACCESS
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage client HVAC companies using your platform under monthly rental agreements or one-off outright buyouts.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsNewClientModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Provision New Client</span>
                  </button>
                </div>
              </div>

              {/* SaaS Financial Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Recurring (MRR)</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-black text-blue-700 font-mono">
                      ${(saasMetrics?.monthlyRecurringRevenue || 0).toLocaleString()}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">/ month</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                    ARR: ${((saasMetrics?.monthlyRecurringRevenue || 0) * 12).toLocaleString()} / yr
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Lifetime Value</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-black text-emerald-700 font-mono">
                      ${(saasMetrics?.totalContractValue || 0).toLocaleString()}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600">Collected</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 font-mono">All paid invoices</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Client Tenants</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {clientTenants.length}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Total</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {clientTenants.filter((c) => c.licenseType === 'monthly_rental').length} Rentals · {clientTenants.filter((c) => c.licenseType === 'one_time_buyout').length} Buyouts
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Rentals Active</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {clientTenants.filter((c) => c.licenseType === 'monthly_rental' && c.status === 'active').length}
                    </span>
                    <span className="text-xs font-semibold text-blue-600">Subscribed</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">Auto-renewing accounts</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">Action Required</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-black text-rose-700 font-mono">
                      {(saasMetrics?.pastDueCount || 0) + (saasMetrics?.trialCount || 0)}
                    </span>
                    <span className="text-xs font-semibold text-rose-600">Review</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {saasMetrics?.pastDueCount || 0} Past Due · {saasMetrics?.trialCount || 0} Trial
                  </span>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Search clients by company, owner name, domain, or email..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Model & Status Filters */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-medium">
                      {(['all', 'monthly_rental', 'one_time_buyout'] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setClientModelFilter(m)}
                          className={`px-3 py-1.5 rounded-lg transition-colors capitalize ${
                            clientModelFilter === m
                              ? 'bg-white text-slate-900 shadow-xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {m === 'all' ? 'All Models' : m === 'monthly_rental' ? 'Monthly Rental' : 'One-Time Buyout'}
                        </button>
                      ))}
                    </div>

                    <select
                      value={clientStatusFilter}
                      onChange={(e) => setClientStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="trial">Trial</option>
                      <option value="past_due">Past Due</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Client Tenants Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Client Company & Domains</th>
                        <th className="py-3 px-4">Contact Owner</th>
                        <th className="py-3 px-4">Licensing Model</th>
                        <th className="py-3 px-4">Subscription Status</th>
                        <th className="py-3 px-4">Renewal / License Key</th>
                        <th className="py-3 px-4">Revenue</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clientTenants
                        .filter((c) => {
                          const matchesModel = clientModelFilter === 'all' || c.licenseType === clientModelFilter;
                          const matchesStatus = clientStatusFilter === 'all' || c.status === clientStatusFilter;
                          const q = clientSearch.toLowerCase();
                          const matchesSearch =
                            c.companyName.toLowerCase().includes(q) ||
                            c.ownerName.toLowerCase().includes(q) ||
                            c.ownerEmail.toLowerCase().includes(q) ||
                            c.primaryDomain.toLowerCase().includes(q) ||
                            c.subdomain.toLowerCase().includes(q);
                          return matchesModel && matchesStatus && matchesSearch;
                        })
                        .map((client) => {
                          const totalPaid = (client.invoices || [])
                            .filter((i) => i.status === 'paid')
                            .reduce((sum, i) => sum + i.amount, 0);

                          return (
                            <tr key={client.id} className="hover:bg-slate-50/75 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900 text-xs">{client.companyName}</div>
                                <div className="text-[11px] text-blue-600 font-mono mt-0.5">{client.primaryDomain}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{client.subdomain}</div>
                              </td>

                              <td className="py-3 px-4">
                                <div className="font-medium text-slate-800">{client.ownerName}</div>
                                <div className="text-[11px] text-slate-500">{client.ownerEmail}</div>
                                <div className="text-[10px] text-slate-400">{client.ownerPhone}</div>
                              </td>

                              <td className="py-3 px-4">
                                {client.licenseType === 'monthly_rental' ? (
                                  <div>
                                    <div className="font-bold text-slate-900 font-mono">
                                      ${client.monthlyRentalFee}/mo
                                    </div>
                                    <div className="text-[11px] text-slate-500 capitalize">
                                      Rental · {client.planTier} tier
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="font-bold text-emerald-800 font-mono">
                                      ${client.oneTimeBuyoutFee ? client.oneTimeBuyoutFee.toLocaleString() : '2,999'}
                                    </div>
                                    <div className="text-[11px] text-emerald-700 font-semibold">
                                      Outright Perpetual Buyout
                                    </div>
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-4">
                                <span
                                  className={`font-semibold capitalize text-xs ${
                                    client.status === 'active'
                                      ? 'text-emerald-700'
                                      : client.status === 'trial'
                                      ? 'text-blue-700'
                                      : client.status === 'past_due'
                                      ? 'text-rose-700 font-bold'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  {client.status.replace('_', ' ')}
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                {client.licenseType === 'monthly_rental' ? (
                                  <div className="text-slate-600 font-mono text-[11px]">
                                    Next: {client.nextRenewalDate ? new Date(client.nextRenewalDate).toLocaleDateString() : 'Active'}
                                  </div>
                                ) : (
                                  <div>
                                    <div className="font-mono text-[10px] text-slate-600 truncate max-w-[140px]" title={client.perpetualLicenseKey}>
                                      {client.perpetualLicenseKey || 'PERPETUAL-OWNERSHIP'}
                                    </div>
                                    <span className="text-[10px] text-emerald-600 block">Lifetime validity</span>
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-4">
                                <span className="font-mono font-bold text-slate-900">${totalPaid.toLocaleString()}</span>
                                <span className="text-[10px] text-slate-400 block font-mono">{(client.invoices || []).length} receipts</span>
                              </td>

                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedClientForAction(client);
                                      setEditClientModel(client.licenseType);
                                      setEditClientTier(client.planTier);
                                      setEditClientMonthlyFee(client.monthlyRentalFee);
                                      setEditClientBuyoutFee(client.oneTimeBuyoutFee || 2999);
                                      setEditClientStatus(client.status);
                                      setEditClientRenewal(client.nextRenewalDate ? client.nextRenewalDate.split('T')[0] : '');
                                      setEditClientNotes(client.notes || '');
                                      setIsEditClientModalOpen(true);
                                    }}
                                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Edit Subscription & Licensing Details"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedClientForAction(client);
                                      setInvoiceAmount(client.licenseType === 'monthly_rental' ? client.monthlyRentalFee : (client.oneTimeBuyoutFee || 2999));
                                      setInvoiceType(client.licenseType === 'monthly_rental' ? 'rental_charge' : 'one_time_buyout');
                                      setInvoiceRef(`tx_${Date.now().toString().slice(-6)}`);
                                      setIsInvoiceModalOpen(true);
                                    }}
                                    className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Record Payment / Invoice"
                                  >
                                    <DollarSign className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedClientForAction(client);
                                      setIsInvoicesDrawerOpen(true);
                                    }}
                                    className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="View Invoices History"
                                  >
                                    <Receipt className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => toggleClientStatus(client.id)}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      client.status === 'active'
                                        ? 'text-slate-400 hover:text-amber-600 hover:bg-slate-100'
                                        : 'text-amber-600 hover:text-emerald-600 hover:bg-slate-100'
                                    }`}
                                    title={client.status === 'active' ? 'Suspend Tenant Access' : 'Activate Tenant Access'}
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete client ${client.companyName}?`)) {
                                        deleteClientTenant(client.id);
                                      }
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Delete Client Tenant"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB: SAAS PRICING & PACKAGING CONFIGURATION (SUPER ADMIN)       */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'saas_plans' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 font-heading">
                    SaaS Pricing & Packaging Architecture
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Configure the public subscription plans for HVAC companies: Monthly Rental models and One-Off Outright Buyout tiers.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      updateSaasConfig({ plans: localSaasPlans });
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Packaging Configuration</span>
                  </button>
                </div>
              </div>

              {/* Stripe Payment Gateway Status */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">Automated Recurring Billing Engine</span>
                    <span className="text-xs text-slate-500">
                      Stripe Subscriptions & PCI-DSS Tokenization Active · Auto-renewal & Dunning Notifications
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
                  Gateway Connected
                </span>
              </div>

              {/* Plan Tiers Configuration Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {localSaasPlans.map((plan, idx) => (
                  <div key={plan.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                        {plan.licenseType === 'monthly_rental' ? 'Monthly Rental' : 'Perpetual Buyout'}
                      </span>
                      <span className="text-xs font-bold capitalize text-blue-700">{plan.tier} Tier</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Plan Display Name</label>
                      <input
                        type="text"
                        value={plan.name}
                        onChange={(e) => {
                          const updated = [...localSaasPlans];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setLocalSaasPlans(updated);
                        }}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                        Price {plan.billingPeriod === 'monthly' ? '($ / Month)' : '($ One-Time)'}
                      </label>
                      <input
                        type="number"
                        value={plan.price}
                        onChange={(e) => {
                          const updated = [...localSaasPlans];
                          updated[idx] = { ...updated[idx], price: Number(e.target.value) };
                          setLocalSaasPlans(updated);
                        }}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={plan.description}
                        onChange={(e) => {
                          const updated = [...localSaasPlans];
                          updated[idx] = { ...updated[idx], description: e.target.value };
                          setLocalSaasPlans(updated);
                        }}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl text-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Included Features</label>
                      <div className="space-y-1.5">
                        {plan.features.map((feat, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB: MY SUBSCRIPTION & LICENSE (CLIENT TENANT VIEW)             */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'my_subscription' && (
            <div className="space-y-8 max-w-5xl">
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-xl font-extrabold text-slate-900 font-heading">
                  Account Subscription & Software License
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  View and manage your platform agreement for <strong className="text-slate-800">{currentTenant?.companyName || settings?.businessName}</strong>.
                </p>
              </div>

              {currentTenant?.licenseType === 'monthly_rental' ? (
                /* MONTHLY RENTAL VIEW */
                <div className="space-y-6">
                  {/* Current Rental Summary */}
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700">
                          MONTHLY RENTAL
                        </span>
                        <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Active Subscription</span>
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {currentTenant.planTier === 'enterprise' ? 'Enterprise' : 'Professional'} Managed Website Rental
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-xl">
                        Your website is fully hosted, managed, and monitored with daily automatic backups and lead synchronization.
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-3xl font-black text-slate-900 font-mono">
                        ${currentTenant.monthlyRentalFee || 299}
                        <span className="text-xs font-semibold text-slate-500"> / month</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Next Auto-Renewal: <strong className="text-slate-800">{currentTenant.nextRenewalDate ? new Date(currentTenant.nextRenewalDate).toLocaleDateString() : 'Dec 1, 2026'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Switch to One-Off Buyout Upgrade Offer */}
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 sm:p-8 rounded-3xl shadow-md space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                      <Award className="w-4 h-4" />
                      <span>PERPETUAL OWNERSHIP UPGRADE</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <h4 className="text-xl font-black">Buy Outright & Eliminate Software Rent Forever</h4>
                        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                          Tired of recurring monthly fees? Convert to an outright one-off purchase for <strong className="text-white">$2,999</strong> one-time. Receive an official certificate of perpetual ownership, perpetual license key, and unlimited leads with zero monthly bills forever.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          addToast('success', 'Buyout Inquiry Sent', 'Our team will contact you to generate your perpetual certificate.');
                        }}
                        className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold rounded-xl shrink-0 transition-colors shadow-sm"
                      >
                        Request Buyout Conversion
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* OUTRIGHT PERPETUAL BUYOUT CERTIFICATE VIEW */
                <div className="space-y-6">
                  <div className="bg-white p-8 rounded-3xl border-2 border-slate-900 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full pointer-events-none" />

                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-600 mb-1">
                          <Award className="w-5 h-5" />
                          <span>OFFICIAL PERPETUAL SOFTWARE CERTIFICATE</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">Certificate of Software Ownership</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Issued to: <strong className="text-slate-800">{currentTenant?.companyName || 'Airflow Climate Solutions'}</strong>
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
                        Paid in Full · Perpetual
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-6 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Perpetual License Key</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono font-bold text-slate-900">{currentTenant?.perpetualLicenseKey || 'HVAC-BUYOUT-PRO-8849-0128-KEY'}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(currentTenant?.perpetualLicenseKey || 'HVAC-BUYOUT-PRO-8849-0128-KEY');
                              addToast('info', 'Copied', 'License key copied to clipboard');
                            }}
                            className="p-1 hover:text-blue-600"
                            title="Copy License Key"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[11px] block">Monthly Software Rent</span>
                        <span className="text-lg font-black text-emerald-700 font-mono mt-1 block">$0.00 / mo</span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[11px] block">Entitlements</span>
                        <span className="font-semibold text-slate-800 mt-1 block">Full Source Code & Unlimited Leads</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      This certificate affirms that the licensee holds perpetual, unrevocable software rights for the HVAC platform codebase, custom styling tokens, and lead routing algorithms.
                    </p>
                  </div>
                </div>
              )}

              {/* Payment & Invoice Receipts History */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-6">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm font-heading">Payment History & Receipts</h3>
                  <span className="text-xs font-mono text-slate-400">{(currentTenant?.invoices || []).length} Payments</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Invoice #</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Payment Method</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(currentTenant?.invoices || []).map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/75">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{inv.date}</td>
                          <td className="py-2.5 px-3 capitalize text-slate-700">
                            {inv.type === 'one_time_buyout' ? 'Outright Buyout' : 'Monthly Rental'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{inv.paymentMethod}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">${inv.amount.toLocaleString()}</td>
                          <td className="py-2.5 px-3">
                            <span className="text-emerald-700 font-semibold capitalize">{inv.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB: VISUAL THEME & PALETTES                                   */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'theme' && (
            <div className="space-y-8">
              {/* Header & Status Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-extrabold text-slate-900 font-heading">Visual Theme & Branding Tokens</h2>
                    {themeConfig?.status === 'draft' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Draft / Live Preview</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Live Published Version</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage colors, typography, logo, corner geometry, and header/footer backgrounds. Changes can be drafted, tested in live preview, published, or rolled back.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={resetTheme}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                    title="Reset to factory default theme"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                  </button>

                  {themeConfig?.status === 'draft' && (
                    <button
                      onClick={discardDraftTheme}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors border border-rose-200"
                      title="Discard uncommitted draft and restore active published theme"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Discard Draft</span>
                    </button>
                  )}

                  <button
                    onClick={() => updateTheme(localTheme)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                    title="Save changes to draft preview"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Draft</span>
                  </button>

                  <button
                    onClick={rollbackTheme}
                    disabled={themeHistoryCount === 0}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors border ${
                      themeHistoryCount > 0
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 cursor-pointer'
                        : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    }`}
                    title={themeHistoryCount > 0 ? `Rollback to previous published version (${themeHistoryCount} in history)` : 'No previous versions available to rollback'}
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Rollback ({themeHistoryCount})</span>
                  </button>

                  <button
                    onClick={publishTheme}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                    title="Publish current theme live to all visitors"
                    style={{
                      backgroundColor: localTheme.primaryColor || undefined,
                      borderRadius: 'var(--radius-btn)',
                    }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Publish Live</span>
                  </button>
                </div>
              </div>

              {/* Preset Palettes Quick Chooser */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">One-Click Industry Palettes</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                  {[
                    { name: 'Airflow Sapphire', primary: '#1d4ed8', secondary: '#0f172a', accent: '#f59e0b' },
                    { name: 'Arctic Cool Cyan', primary: '#0284c7', secondary: '#0f172a', accent: '#38bdf8' },
                    { name: 'Industrial Safety Gold', primary: '#b45309', secondary: '#18181b', accent: '#f59e0b' },
                    { name: 'Eco-Green High Efficiency', primary: '#059669', secondary: '#064e3b', accent: '#10b981' },
                    { name: 'Slate Executive Modern', primary: '#334155', secondary: '#020617', accent: '#38bdf8' },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const updated = {
                          ...localTheme,
                          primaryColor: p.primary,
                          secondaryColor: p.secondary,
                          accentColor: p.accent,
                        };
                        setLocalTheme(updated);
                        updateTheme(updated);
                      }}
                      className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 text-left transition-all hover:shadow-xs group"
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-5 h-5 rounded-full shadow-2xs" style={{ backgroundColor: p.primary }} />
                        <span className="w-5 h-5 rounded-full shadow-2xs" style={{ backgroundColor: p.secondary }} />
                        <span className="w-5 h-5 rounded-full shadow-2xs" style={{ backgroundColor: p.accent }} />
                      </div>
                      <span className="font-bold text-slate-800 group-hover:text-blue-700 block">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand Logo & Asset Configuration */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-heading">Brand Logo & Header Mark</h3>
                    <p className="text-xs text-slate-500">Provide a hosted image URL or asset path for the header and footer logo.</p>
                  </div>
                  {localTheme.logoUrl && (
                    <button
                      onClick={() => {
                        const updated = { ...localTheme, logoUrl: '' };
                        setLocalTheme(updated);
                        updateTheme(updated);
                      }}
                      className="text-xs text-rose-600 hover:underline font-semibold"
                    >
                      Remove Logo (Use Initial)
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-8 flex items-center gap-3">
                    <div className="relative flex-1">
                      <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. /src/assets/images/brand_logo.png or https://..."
                        value={localTheme.logoUrl || ''}
                        onChange={(e) => {
                          const updated = { ...localTheme, logoUrl: e.target.value };
                          setLocalTheme(updated);
                        }}
                        onBlur={() => updateTheme(localTheme)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 font-mono"
                      />
                    </div>
                    <button
                      onClick={() => updateTheme(localTheme)}
                      className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl whitespace-nowrap"
                    >
                      Update Logo
                    </button>
                  </div>

                  <div className="md:col-span-4 flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Preview:</span>
                    {localTheme.logoUrl ? (
                      <img
                        src={localTheme.logoUrl}
                        alt="Logo preview"
                        className="h-9 w-auto object-contain rounded-md border border-slate-200 bg-white p-1"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-xs"
                        style={{ backgroundColor: localTheme.primaryColor || '#1d4ed8' }}
                      >
                        {(settings?.businessName || 'A').charAt(0)}
                      </div>
                    )}
                    <span className="text-xs text-slate-600 font-medium truncate">
                      {localTheme.logoUrl ? 'Custom Image Active' : 'Fallback Lettermark'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Color Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Primary Color */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">Primary Action Color</label>
                  <p className="text-[11px] text-slate-400">Buttons, active links, accents, and brand focal points.</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={localTheme.primaryColor}
                      onChange={(e) => {
                        const updated = { ...localTheme, primaryColor: e.target.value };
                        setLocalTheme(updated);
                        updateTheme(updated);
                      }}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                    />
                    <input
                      type="text"
                      value={localTheme.primaryColor}
                      onChange={(e) => {
                        const updated = { ...localTheme, primaryColor: e.target.value };
                        setLocalTheme(updated);
                      }}
                      onBlur={() => updateTheme(localTheme)}
                      className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 uppercase"
                    />
                  </div>
                </div>

                {/* Secondary Color */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">Secondary Background / Header</label>
                  <p className="text-[11px] text-slate-400">Emergency alert bar, dark benchmark strip, secondary panels.</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={localTheme.secondaryColor}
                      onChange={(e) => {
                        const updated = { ...localTheme, secondaryColor: e.target.value };
                        setLocalTheme(updated);
                        updateTheme(updated);
                      }}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                    />
                    <input
                      type="text"
                      value={localTheme.secondaryColor}
                      onChange={(e) => {
                        const updated = { ...localTheme, secondaryColor: e.target.value };
                        setLocalTheme(updated);
                      }}
                      onBlur={() => updateTheme(localTheme)}
                      className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 uppercase"
                    />
                  </div>
                </div>

                {/* Accent Color */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">Accent / Highlight Color</label>
                  <p className="text-[11px] text-slate-400">Review stars, promotional callouts, badges, savings tags.</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={localTheme.accentColor}
                      onChange={(e) => {
                        const updated = { ...localTheme, accentColor: e.target.value };
                        setLocalTheme(updated);
                        updateTheme(updated);
                      }}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                    />
                    <input
                      type="text"
                      value={localTheme.accentColor}
                      onChange={(e) => {
                        const updated = { ...localTheme, accentColor: e.target.value };
                        setLocalTheme(updated);
                      }}
                      onBlur={() => updateTheme(localTheme)}
                      className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 uppercase"
                    />
                  </div>
                </div>

                {/* Page Canvas Background */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">Page Canvas Background</label>
                  <p className="text-[11px] text-slate-400">Root page background field (default #f8fafc).</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={localTheme.backgroundColor || '#f8fafc'}
                      onChange={(e) => {
                        const updated = { ...localTheme, backgroundColor: e.target.value };
                        setLocalTheme(updated);
                        updateTheme(updated);
                      }}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                    />
                    <input
                      type="text"
                      value={localTheme.backgroundColor || '#f8fafc'}
                      onChange={(e) => setLocalTheme({ ...localTheme, backgroundColor: e.target.value })}
                      onBlur={() => updateTheme(localTheme)}
                      className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 uppercase"
                    />
                  </div>
                </div>

                {/* Footer Background */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">Footer Background</label>
                  <p className="text-[11px] text-slate-400">Full-width bottom footer tone (default #020617).</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={localTheme.footerBg || '#020617'}
                      onChange={(e) => {
                        const updated = { ...localTheme, footerBg: e.target.value };
                        setLocalTheme(updated);
                        updateTheme(updated);
                      }}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                    />
                    <input
                      type="text"
                      value={localTheme.footerBg || '#020617'}
                      onChange={(e) => setLocalTheme({ ...localTheme, footerBg: e.target.value })}
                      onBlur={() => updateTheme(localTheme)}
                      className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 uppercase"
                    />
                  </div>
                </div>

                {/* Card Surface Color */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">Card Surface Color</label>
                  <p className="text-[11px] text-slate-400">Service cards, forms, and dialog surfaces.</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={localTheme.surfaceColor || '#ffffff'}
                      onChange={(e) => {
                        const updated = { ...localTheme, surfaceColor: e.target.value };
                        setLocalTheme(updated);
                        updateTheme(updated);
                      }}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                    />
                    <input
                      type="text"
                      value={localTheme.surfaceColor || '#ffffff'}
                      onChange={(e) => setLocalTheme({ ...localTheme, surfaceColor: e.target.value })}
                      onBlur={() => updateTheme(localTheme)}
                      className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Typography & Geometry Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Headline Font */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">Headline Font Family</label>
                  <select
                    value={localTheme.headingFont}
                    onChange={(e) => {
                      const updated = { ...localTheme, headingFont: e.target.value };
                      setLocalTheme(updated);
                      updateTheme(updated);
                    }}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Outfit">Outfit (Clean Architectural)</option>
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans (Modern Geometric)</option>
                    <option value="Inter">Inter (Functional System)</option>
                    <option value="Manrope">Manrope (Modern Technical)</option>
                    <option value="DM Sans">DM Sans (Humanist Clean)</option>
                    <option value="Montserrat">Montserrat (Bold Industrial)</option>
                    <option value="Roboto">Roboto (Classic Technical)</option>
                    <option value="Oswald">Oswald (Athletic Condensed)</option>
                    <option value="Barlow Condensed">Barlow Condensed (Industrial)</option>
                    <option value="Playfair Display">Playfair Display (Editorial)</option>
                  </select>
                </div>

                {/* Body Font */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">Body Prose Font Family</label>
                  <select
                    value={localTheme.bodyFont}
                    onChange={(e) => {
                      const updated = { ...localTheme, bodyFont: e.target.value };
                      setLocalTheme(updated);
                      updateTheme(updated);
                    }}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans (High Readability)</option>
                    <option value="DM Sans">DM Sans (Humanist Body)</option>
                    <option value="Manrope">Manrope (Clean Geometric)</option>
                    <option value="Inter">Inter (System Standard)</option>
                    <option value="Public Sans">Public Sans (Government/Corporate)</option>
                  </select>
                </div>

                {/* Button Radius */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">Button Corner Radius</label>
                  <select
                    value={localTheme.buttonRadius}
                    onChange={(e) => {
                      const updated = { ...localTheme, buttonRadius: e.target.value };
                      setLocalTheme(updated);
                      updateTheme(updated);
                    }}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="sharp">Sharp Rectangular (0px)</option>
                    <option value="rounded-md">Subtle (rounded-md / 6px)</option>
                    <option value="rounded-lg">Standard (rounded-lg / 8px)</option>
                    <option value="rounded-xl">Curved (rounded-xl / 12px - Default)</option>
                    <option value="rounded-2xl">Pill-Soft (rounded-2xl / 16px)</option>
                    <option value="pill">Full Capsule Pill (9999px)</option>
                  </select>
                </div>

                {/* Card Radius */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">Card Corner Radius</label>
                  <select
                    value={localTheme.cardRadius}
                    onChange={(e) => {
                      const updated = { ...localTheme, cardRadius: e.target.value };
                      setLocalTheme(updated);
                      updateTheme(updated);
                    }}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="sharp">Sharp (0px)</option>
                    <option value="rounded-lg">Compact (rounded-lg / 8px)</option>
                    <option value="rounded-xl">Standard (rounded-xl / 12px)</option>
                    <option value="rounded-2xl">Modern (rounded-2xl / 16px - Default)</option>
                    <option value="rounded-3xl">Substantial (rounded-3xl / 24px)</option>
                  </select>
                </div>
              </div>

              {/* Live Interactive Token Preview Box */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Live Component Preview (Active Design Tokens)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Heading: {localTheme.headingFont} · Body: {localTheme.bodyFont} · Primary: {localTheme.primaryColor}
                  </span>
                </div>

                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-3">
                    <h4
                      className="text-xl font-bold text-slate-900"
                      style={{ fontFamily: `"${localTheme.headingFont}", sans-serif` }}
                    >
                      Precision Indoor Climate Engineering
                    </h4>
                    <p
                      className="text-xs text-slate-600 leading-relaxed"
                      style={{ fontFamily: `"${localTheme.bodyFont}", sans-serif` }}
                    >
                      Our NATE-certified master mechanics provide upfront pricing, 2-hour emergency dispatch windows, and guarantees backed by 2-year craftsmanship protection.
                    </p>
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <Star className="w-4 h-4 fill-amber-400" style={{ color: localTheme.accentColor || '#f59e0b', fill: localTheme.accentColor || '#f59e0b' }} />
                      <span className="text-slate-800">4.9 Star Verified Service</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 justify-start md:justify-end">
                    <button
                      type="button"
                      className="px-5 py-2.5 text-white font-bold text-xs shadow-sm transition-all"
                      style={{
                        backgroundColor: localTheme.primaryColor || '#1d4ed8',
                        borderRadius: localTheme.buttonRadius === 'pill' ? '9999px' : localTheme.buttonRadius === 'sharp' ? '0px' : '0.75rem',
                      }}
                    >
                      Primary Action Button
                    </button>
                    <button
                      type="button"
                      className="px-5 py-2.5 text-white font-bold text-xs shadow-sm transition-all"
                      style={{
                        backgroundColor: localTheme.secondaryColor || '#0f172a',
                        borderRadius: localTheme.buttonRadius === 'pill' ? '9999px' : localTheme.buttonRadius === 'sharp' ? '0px' : '0.75rem',
                      }}
                    >
                      Secondary Button
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 font-bold text-xs transition-all border"
                      style={{
                        borderColor: localTheme.primaryColor || '#1d4ed8',
                        color: localTheme.primaryColor || '#1d4ed8',
                        borderRadius: localTheme.buttonRadius === 'pill' ? '9999px' : localTheme.buttonRadius === 'sharp' ? '0px' : '0.75rem',
                      }}
                    >
                      Outline Button
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB: ALL PAGES CONTENT STUDIO                                  */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'page_studio' && (
            <PageContentStudioTab />
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB: HOMEPAGE BUILDER                                          */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'homepage' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 font-heading">Homepage Sections Builder</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Toggle visibility, reorder display order, and configure custom headings for each homepage component.
                  </p>
                </div>
                <button
                  onClick={() => updateHomepageSections(homepageSections)}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Layout Order</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 grid grid-cols-12 gap-4">
                  <span className="col-span-1">Order</span>
                  <span className="col-span-4">Section Name</span>
                  <span className="col-span-4">Custom Heading</span>
                  <span className="col-span-3 text-right">Actions</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {homepageSections.map((sec, idx) => (
                    <div key={sec.id} className="p-4 flex items-center grid grid-cols-12 gap-4 text-xs">
                      <div className="col-span-1 flex items-center gap-1">
                        <span className="font-mono font-bold text-slate-700">{sec.order}</span>
                        <div className="flex flex-col">
                          <button
                            disabled={idx === 0}
                            onClick={() => {
                              if (idx === 0) return;
                              const copy = [...homepageSections];
                              const temp = copy[idx - 1];
                              copy[idx - 1] = copy[idx];
                              copy[idx] = temp;
                              copy.forEach((s, i) => (s.order = i + 1));
                              updateHomepageSections(copy);
                            }}
                            className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            disabled={idx === homepageSections.length - 1}
                            onClick={() => {
                              if (idx === homepageSections.length - 1) return;
                              const copy = [...homepageSections];
                              const temp = copy[idx + 1];
                              copy[idx + 1] = copy[idx];
                              copy[idx] = temp;
                              copy.forEach((s, i) => (s.order = i + 1));
                              updateHomepageSections(copy);
                            }}
                            className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="col-span-4 font-bold text-slate-900 flex items-center gap-2">
                        <span>{sec.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">({sec.type})</span>
                      </div>

                      <div className="col-span-4">
                        <input
                          type="text"
                          value={sec.heading || ''}
                          onChange={(e) => {
                            const copy = [...homepageSections];
                            copy[idx].heading = e.target.value;
                            updateHomepageSections(copy);
                          }}
                          placeholder="Default section title"
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                        />
                      </div>

                      <div className="col-span-3 flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            const copy = [...homepageSections];
                            copy[idx].enabled = !copy[idx].enabled;
                            updateHomepageSections(copy);
                          }}
                          className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 ${
                            sec.enabled
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {sec.enabled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          <span>{sec.enabled ? 'Visible' : 'Hidden'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB: FEATURE FLAGS MATRIX                                      */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'flags' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-xl font-extrabold text-slate-900 font-heading">Feature Flags & System Modules</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enabling or disabling a feature updates public navigation, removes homepage callouts, and protects backend APIs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'onlineBooking', name: 'Online Routine Booking', desc: 'Allows customers to select calendar date/time windows and book appointments.' },
                  { key: 'emergencyService', name: '24/7 Emergency Dispatch', desc: 'Enables 24/7 emergency dispatch alert banner, emergency triage modal, and instant phone routing.' },
                  { key: 'estimateCalculator', name: 'HVAC Sizing Calculator', desc: 'Provides the ACCA Manual J sizing & energy savings calculator tool.' },
                  { key: 'maintenanceMemberships', name: 'Comfort Club Memberships', desc: 'Enables annual tune-up club subscription signups and member discounting.' },
                  { key: 'commercialEnquiries', name: 'Commercial RTU & Facilities', desc: 'Enables commercial repair, crane rigging, and facility maintenance proposals.' },
                  { key: 'customerPortal', name: 'Customer Self-Service Portal', desc: 'Enables customer account dashboard, equipment registration, and e-signatures.' },
                  { key: 'reviews', name: 'Verified Customer Reviews', desc: 'Displays social proof, customer ratings, and direct review submission form.' },
                  { key: 'blog', name: 'Educational Resources & Blog', desc: 'Publishes articles, SEER2 energy guides, and troubleshooting resources.' },
                  { key: 'aiAssistant', name: 'AI Climate Assistant', desc: 'Server-side Gemini assistant answering customer heating/cooling questions.' },
                  { key: 'financing', name: 'Financing Programs', desc: 'Highlights 0% APR financing terms, monthly payment tiers, and pre-qualification.' },
                ].map((item) => {
                  const isEnabled = featureFlags ? (featureFlags as any)[item.key] !== false : true;
                  return (
                    <div
                      key={item.key}
                      className="bg-white p-5 rounded-2xl border border-slate-200 flex items-start justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isEnabled ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{item.desc}</p>
                      </div>

                      <button
                        onClick={() => {
                          updateFeatureFlags({ [item.key]: !isEnabled });
                        }}
                        className={`p-2 rounded-xl border transition-colors shrink-0 ${
                          isEnabled
                            ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                        }`}
                        title={isEnabled ? 'Click to disable' : 'Click to enable'}
                      >
                        {isEnabled ? <ToggleRight className="w-6 h-6 text-blue-700" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB: GLOBAL SEARCH & REPLACE                                   */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'search_replace' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-xl font-extrabold text-slate-900 font-heading">Universal Global Search & Replace</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Safely search across all database collections (services, territories, articles, projects, settings, reviews) and perform bulk updates.
                </p>
              </div>

              {/* Search Query Input */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <form onSubmit={handlePerformSearch} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter word or phrase to find across all website content (e.g. Maintenance, Warranty, 10-Year)..."
                      className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-colors shrink-0 flex items-center justify-center gap-2"
                  >
                    {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>Search Content</span>
                  </button>
                </form>

                {/* Replacement Action Form if matches found */}
                {searchTotal !== null && searchTotal > 0 && (
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <div className="text-xs font-bold text-slate-800 whitespace-nowrap">
                      Found {searchTotal} occurrence{searchTotal > 1 ? 's' : ''}. Replace with:
                    </div>
                    <input
                      type="text"
                      value={replaceTarget}
                      onChange={(e) => setReplaceTarget(e.target.value)}
                      placeholder="Replacement text..."
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handlePerformReplace}
                      disabled={isReplacing || !replaceTarget}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isReplacing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Replace className="w-3.5 h-3.5" />}
                      <span>Replace All Selected</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Matches Results List */}
              {searchResults.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden space-y-2 p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                    <span className="font-bold text-slate-700">Preview Matches ({searchResults.length})</span>
                    <button
                      onClick={() => {
                        if (selectedMatchIds.length === searchResults.length) setSelectedMatchIds([]);
                        else setSelectedMatchIds(searchResults.map((m) => m.id));
                      }}
                      className="text-blue-700 hover:underline font-semibold"
                    >
                      {selectedMatchIds.length === searchResults.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {searchResults.map((match) => (
                      <div
                        key={match.id}
                        className="p-3 rounded-xl border border-slate-100 hover:border-slate-300 bg-slate-50 flex items-start gap-3 text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMatchIds.includes(match.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedMatchIds([...selectedMatchIds, match.id]);
                            else setSelectedMatchIds(selectedMatchIds.filter((id) => id !== match.id));
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800 font-mono">
                              {match.entityType}
                            </span>
                            <span className="font-bold text-slate-900">{match.title}</span>
                            <span className="text-slate-400 font-mono text-[10px]">({match.field})</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 font-mono bg-white p-2 rounded-lg border border-slate-200">
                            {match.preview}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB: BUSINESS & MULTI-MARKET IDENTITY                          */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'market' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 font-heading">Multi-Market & Business Identity</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Universal settings allowing this HVAC application to operate seamlessly in any city, state, or currency.
                  </p>
                </div>
                <button
                  onClick={() => updateMarketSettings(localMarket)}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Market Settings</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Primary City</label>
                  <input
                    type="text"
                    value={localMarket.primaryCity}
                    onChange={(e) => setLocalMarket({ ...localMarket, primaryCity: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                  <span className="text-[10px] text-slate-400">Used for city-specific titles & landing pages</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">State / Province / Region</label>
                  <input
                    type="text"
                    value={localMarket.regionOrState}
                    onChange={(e) => setLocalMarket({ ...localMarket, regionOrState: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                  <span className="text-[10px] text-slate-400">e.g. California, Ontario, State</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Country</label>
                  <input
                    type="text"
                    value={localMarket.country}
                    onChange={(e) => setLocalMarket({ ...localMarket, country: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Currency Symbol</label>
                  <input
                    type="text"
                    value={localMarket.currency}
                    onChange={(e) => setLocalMarket({ ...localMarket, currency: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                  <span className="text-[10px] text-slate-400">e.g. $, £, €, CA$</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Temperature Units</label>
                  <select
                    value={localMarket.temperatureUnit}
                    onChange={(e) => setLocalMarket({ ...localMarket, temperatureUnit: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="F">Fahrenheit (°F)</option>
                    <option value="C">Celsius (°C)</option>
                  </select>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Emergency Dispatch SLA</label>
                  <input
                    type="number"
                    value={localMarket.emergencyDispatchSlaMinutes}
                    onChange={(e) => setLocalMarket({ ...localMarket, emergencyDispatchSlaMinutes: parseInt(e.target.value, 10) || 15 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                  <span className="text-[10px] text-slate-400">Minutes to dispatcher callback</span>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB: LEADS & CRM MANAGEMENT (PRESERVED FULL WORKFLOW)         */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'leads' && (
            <div className="space-y-6">
              {/* Journey Filter Bar */}
              <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1 border-b border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 mr-2 shrink-0">Filter Journey:</span>
                {[
                  { id: 'all', label: `All Inquiries (${leads.length})` },
                  { id: 'emergency', label: `🚨 Emergency (${leads.filter((l) => l.urgency === 'emergency' || l.journey === 'emergency').length})` },
                  { id: 'routine', label: `📅 Routine (${leads.filter((l) => l.journey === 'routine' || l.source === 'online_booking').length})` },
                  { id: 'estimate', label: `📐 Estimates (${leads.filter((l) => l.journey === 'estimate' || l.source === 'installation_estimate' || l.source === 'estimate_tool').length})` },
                  { id: 'maintenance', label: `🔧 Maintenance (${leads.filter((l) => l.journey === 'maintenance' || l.source === 'maintenance_request').length})` },
                  { id: 'commercial', label: `🏢 Commercial (${leads.filter((l) => l.propertyType === 'commercial' || l.journey === 'commercial').length})` },
                ].map((j) => (
                  <button
                    key={j.id}
                    onClick={() => setLeadJourneyFilter(j.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-colors ${
                      leadJourneyFilter === j.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {j.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto text-xs">
                  {['all', 'new', 'appointment_requested', 'appointment_confirmed', 'estimate_pending', 'won', 'lost'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setLeadFilterStatus(st)}
                      className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                        leadFilterStatus === st
                          ? 'bg-blue-700 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {st === 'all' ? 'All Statuses' : st.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search customer, phone, tech..."
                      value={leadSearch}
                      onChange={(e) => setLeadSearch(e.target.value)}
                      className="text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden bg-white"
                    />
                  </div>

                  <a
                    href="/api/export/leads"
                    download
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV Export</span>
                  </a>
                </div>
              </div>

              {/* Leads Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Ticket</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Service</th>
                        <th className="py-3 px-4">Urgency</th>
                        <th className="py-3 px-4">Assigned Tech</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLeads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{lead.leadNumber}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">{lead.customerName}</span>
                            <span className="text-[11px] text-slate-500 font-mono">{lead.phone}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800 block">{lead.serviceRequested}</span>
                            <span className="text-[10px] text-slate-400">{lead.city}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                lead.urgency === 'emergency'
                                  ? 'bg-rose-100 text-rose-800 animate-pulse'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {lead.urgency}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {lead.assignedTechnicianName || (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                              {lead.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedLead(lead)}
                              className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              Triage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Triage Detail Drawer */}
              {selectedLead && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
                  <div className="w-full max-w-xl bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200">
                    <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-slate-900 font-heading">
                            {selectedLead.customerName}
                          </span>
                          <span className="font-mono text-xs text-slate-400">({selectedLead.leadNumber})</span>
                        </div>
                        <span className="text-xs text-slate-500 block mt-0.5">
                          {selectedLead.serviceRequested} · {selectedLead.city}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedLead(null)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Contact & Service Info */}
                    <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Phone Number</span>
                        <a href={`tel:${selectedLead.phone}`} className="font-bold text-blue-700 font-mono">
                          {selectedLead.phone}
                        </a>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Email Address</span>
                        <span className="font-semibold text-slate-800">{selectedLead.email || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Physical Address</span>
                        <span className="font-semibold text-slate-800">{selectedLead.address || 'Metro Area'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Assigned Tech</span>
                        <span className="font-bold text-slate-900">{selectedLead.assignedTechnicianName || 'None'}</span>
                      </div>
                    </div>

                    {/* Dispatcher Workflow 1: Assign Technician */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-blue-700" />
                        <span>Assign Certified Technician</span>
                      </span>
                      <div className="flex gap-2">
                        <select
                          value={assignTechId}
                          onChange={(e) => setAssignTechId(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                        >
                          <option value="">Select On-Duty Tech...</option>
                          {technicians.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.role})
                            </option>
                          ))}
                        </select>
                        <button
                          disabled={!assignTechId || isAssigning}
                          onClick={async () => {
                            const tech = technicians.find((t) => t.id === assignTechId);
                            if (!tech) return;
                            setIsAssigning(true);
                            await assignTechnicianToLead(selectedLead.id, tech.id, tech.name, assignNotes);
                            setIsAssigning(false);
                            setSelectedLead({ ...selectedLead, assignedTechnicianId: tech.id, assignedTechnicianName: tech.name });
                          }}
                          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-colors"
                        >
                          Assign
                        </button>
                      </div>
                    </div>

                    {/* Dispatcher Workflow 2: Convert to Appointment */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <CalendarPlus className="w-4 h-4 text-emerald-700" />
                        <span>Convert Lead to Scheduled Appointment</span>
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <input
                          type="date"
                          value={convertDate}
                          onChange={(e) => setConvertDate(e.target.value)}
                          className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                        />
                        <select
                          value={convertTimeSlot}
                          onChange={(e) => setConvertTimeSlot(e.target.value)}
                          className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                        >
                          <option value="08:00 AM - 10:00 AM">08:00 AM - 10:00 AM</option>
                          <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                          <option value="01:00 PM - 03:00 PM">01:00 PM - 03:00 PM</option>
                          <option value="03:00 PM - 05:00 PM">03:00 PM - 05:00 PM</option>
                        </select>
                      </div>
                      <button
                        disabled={isConverting}
                        onClick={async () => {
                          setIsConverting(true);
                          await convertLeadToAppointment(selectedLead.id, {
                            date: convertDate,
                            timeSlot: convertTimeSlot,
                            technicianId: selectedLead.assignedTechnicianId,
                            technicianName: selectedLead.assignedTechnicianName,
                          });
                          setIsConverting(false);
                          setSelectedLead(null);
                        }}
                        className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
                      >
                        Confirm Booking & Dispatch Truck
                      </button>
                    </div>

                    {/* Dispatcher Notes Log */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-900 block">Dispatch Audit History</span>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {(selectedLead.dispatcherNotes || []).map((dn) => (
                          <div key={dn.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span className="font-bold text-slate-600">{dn.author}</span>
                              <span>{new Date(dn.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="mt-1 text-slate-700">{dn.note}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add internal dispatcher note..."
                          value={newDispatcherNoteText}
                          onChange={(e) => setNewDispatcherNoteText(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                        />
                        <button
                          disabled={!newDispatcherNoteText.trim() || isAddingNote}
                          onClick={async () => {
                            setIsAddingNote(true);
                            await addDispatcherNote(selectedLead.id, newDispatcherNoteText);
                            setIsAddingNote(false);
                            setNewDispatcherNoteText('');
                          }}
                          className="px-3 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl disabled:opacity-50"
                        >
                          Add Note
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB: DISPATCH APPOINTMENTS                                     */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'appointments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <h2 className="text-xl font-extrabold text-slate-900 font-heading">Dispatch & Service Calendar</h2>
                <span className="text-xs text-slate-500 font-mono">{appointments.length} Total Appointments</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {appointments.map((apt) => (
                  <div key={apt.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{apt.customerName}</span>
                        <span className="font-mono text-xs text-slate-400">{apt.appointmentNumber}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          apt.isEmergency ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {apt.isEmergency ? 'Emergency' : 'Routine'}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold">{apt.date}</span> · {apt.timeSlot}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-slate-400" />
                        <span>Tech: {apt.technicianName || 'Pending'}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 uppercase text-[10px]">{apt.status}</span>
                      <select
                        value={apt.status}
                        onChange={(e) => updateAppointmentStatus(apt.id, e.target.value)}
                        className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="pending_confirmation">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB: SERVICES CATALOG (CMS)                                    */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'services' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <h2 className="text-xl font-extrabold text-slate-900 font-heading">HVAC Services Catalog</h2>
                <button
                  onClick={() => setIsNewServiceModalOpen(true)}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Service</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {services.map((srv) => (
                  <div key={srv.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{srv.name}</span>
                        <span className="text-[10px] text-blue-700 font-mono font-bold uppercase">{srv.category}</span>
                      </div>
                      {srv.priceStartingAt && (
                        <span className="font-mono font-extrabold text-slate-900 text-sm">
                          ${srv.priceStartingAt}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{srv.shortDescription}</p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        Published
                      </span>
                      <button
                        onClick={() => deleteServiceRecord(srv.id)}
                        className="text-rose-600 hover:text-rose-800 font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB: SERVICE AREAS & TERRITORIES                              */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'areas' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 font-heading">Service Areas & ZIP Coverage</h2>
                  <p className="text-xs text-slate-500 mt-1">Manage dispatched cities, counties, and allowed ZIP code validation lists.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviceAreas.map((area) => (
                  <div key={area.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{area.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono capitalize">{area.type}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Serviced
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">{area.description}</p>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                        Covered Postal Codes ({area.zipCodes.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {area.zipCodes.slice(0, 6).map((z) => (
                          <span key={z} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono">
                            {z}
                          </span>
                        ))}
                        {area.zipCodes.length > 6 && (
                          <span className="text-[10px] text-slate-400 font-mono">+{area.zipCodes.length - 6} more</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB: REVIEWS MODERATION                                        */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <h2 className="text-xl font-extrabold text-slate-900 font-heading">Customer Reviews Moderation</h2>
                <span className="text-xs text-slate-500 font-mono">{reviews.length} Total Verified Reviews</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{rev.authorName}</span>
                        <span className="text-[10px] text-slate-400">{rev.city} · {rev.date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                        <span>★</span>
                        <span>{rev.rating}.0</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 italic">"{rev.text}"</p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold text-blue-700 uppercase">{rev.serviceCategory}</span>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
                        Approved
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB: FORM BUILDER                                              */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'forms' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 font-heading">Form Builder & Lead Ingestion</h2>
                  <p className="text-xs text-slate-500 mt-1">Configure customized inquiry forms, custom fields, and email destinations.</p>
                </div>
                <button
                  onClick={() => setIsNewFormOpen(true)}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Custom Form</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {forms.map((f) => (
                  <div key={f.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{f.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">slug: /forms/{f.slug}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          f.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {f.enabled ? 'Enabled' : 'Paused'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">{f.description || 'Customer callback inquiry form'}</p>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Form Fields ({f.fields.length})</span>
                      {f.fields.map((field) => (
                        <div key={field.id} className="flex justify-between text-slate-700">
                          <span>{field.label}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {field.type} {field.required ? '(req)' : ''}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono">
                      Target Email: {f.notificationEmail || 'dispatch@apexairflow.com'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB: CUSTOM PAGES (PAGE BUILDER)                               */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'pages' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 font-heading">Custom Landing Pages</h2>
                  <p className="text-xs text-slate-500 mt-1">Create dedicated landing pages with custom block components.</p>
                </div>
                <button
                  onClick={() => setIsNewPageOpen(true)}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Page</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pages.map((p) => (
                  <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{p.title}</span>
                        <span className="font-mono text-xs text-blue-700">/p/{p.slug}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800">
                        Live
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">{p.metaDescription}</p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[10px]">{p.blocks.length} Content Blocks</span>
                      <button
                        onClick={() => deletePage(p.id)}
                        className="text-rose-600 hover:text-rose-800 font-bold"
                      >
                        Delete Page
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB: ESTIMATES                                                  */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'estimates' && <EstimatesTab />}

          {/* ------------------------------------------------------------- */}
          {/* TAB: TECHNICIANS                                                */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'technicians' && <TechniciansTab />}

          {/* ------------------------------------------------------------- */}
          {/* TAB: NAVIGATION & HEADER/FOOTER                                */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'navigation' && <NavigationTab />}

          {/* ------------------------------------------------------------- */}
          {/* TAB: ARTICLES & BLOG                                            */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'articles' && <ArticlesTab />}

          {/* ------------------------------------------------------------- */}
          {/* TAB: PROMOTIONS & REBATES                                       */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'promotions' && <PromotionsTab />}

          {/* ------------------------------------------------------------- */}
          {/* TAB: TEAM & ROLES                                              */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'users' && <TeamRolesTab />}

          {/* ------------------------------------------------------------- */}
          {/* TAB: INTEGRATIONS                                              */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'integrations' && <IntegrationsTab />}

          {/* ------------------------------------------------------------- */}
          {/* TAB: SYSTEM AUDIT LOGS                                         */}
          {/* ------------------------------------------------------------- */}
          {effectiveTab === 'audit' && <AuditLogTab />}
        </main>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: PROVISION NEW CLIENT TENANT                            */}
      {/* ------------------------------------------------------------- */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight">Provision New HVAC Client Tenant</h3>
                <p className="text-xs text-slate-300 mt-0.5">Deploy a dedicated website instance under Monthly Rental or Outright Buyout.</p>
              </div>
              <button
                onClick={() => setIsNewClientModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newClientCompany || !newClientOwner || !newClientEmail) {
                  addToast('error', 'Validation Error', 'Company name, owner name, and email are required.');
                  return;
                }

                const res = await createClientTenant({
                  companyName: newClientCompany,
                  ownerName: newClientOwner,
                  ownerEmail: newClientEmail,
                  ownerPhone: newClientPhone,
                  subdomain: newClientSubdomain,
                  primaryDomain: newClientPrimaryDomain,
                  licenseType: newClientModel,
                  planTier: newClientTier,
                  monthlyRentalFee: newClientModel === 'monthly_rental' ? newClientMonthlyFee : 0,
                  oneTimeBuyoutFee: newClientModel === 'one_time_buyout' ? newClientBuyoutFee : 0,
                  status: newClientStatus,
                  notes: newClientNotes,
                });

                if (res.success) {
                  setIsNewClientModalOpen(false);
                  setNewClientCompany('');
                  setNewClientOwner('');
                  setNewClientEmail('');
                  setNewClientPhone('');
                  setNewClientSubdomain('');
                  setNewClientPrimaryDomain('');
                  setNewClientNotes('');
                }
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company / Business Name *</label>
                  <input
                    type="text"
                    required
                    value={newClientCompany}
                    onChange={(e) => {
                      setNewClientCompany(e.target.value);
                      const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                      if (!newClientSubdomain) setNewClientSubdomain(`${slug}.hvacsaas.pro`);
                      if (!newClientPrimaryDomain) setNewClientPrimaryDomain(`${slug}.com`);
                    }}
                    placeholder="e.g. Dallas High-Efficiency HVAC"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Owner / Primary Contact *</label>
                  <input
                    type="text"
                    required
                    value={newClientOwner}
                    onChange={(e) => setNewClientOwner(e.target.value)}
                    placeholder="e.g. David Henderson"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Owner Email *</label>
                  <input
                    type="email"
                    required
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="david@dallashvac.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="(214) 555-0144"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Platform Subdomain</label>
                  <input
                    type="text"
                    value={newClientSubdomain}
                    onChange={(e) => setNewClientSubdomain(e.target.value)}
                    placeholder="dallas.hvacsaas.pro"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Custom Domain</label>
                  <input
                    type="text"
                    value={newClientPrimaryDomain}
                    onChange={(e) => setNewClientPrimaryDomain(e.target.value)}
                    placeholder="dallashvac.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* License Model Selection */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-900 block">Licensing Model Selection</span>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    onClick={() => setNewClientModel('monthly_rental')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      newClientModel === 'monthly_rental'
                        ? 'bg-blue-50/60 border-blue-500 font-bold text-blue-900'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Monthly Rental</span>
                      <input
                        type="radio"
                        checked={newClientModel === 'monthly_rental'}
                        onChange={() => setNewClientModel('monthly_rental')}
                        className="text-blue-600"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 font-normal mt-1">
                      Recurring monthly software rent, automated hosting & support
                    </span>
                  </label>

                  <label
                    onClick={() => setNewClientModel('one_time_buyout')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      newClientModel === 'one_time_buyout'
                        ? 'bg-slate-900 text-white font-bold border-slate-900'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Outright Buyout</span>
                      <input
                        type="radio"
                        checked={newClientModel === 'one_time_buyout'}
                        onChange={() => setNewClientModel('one_time_buyout')}
                        className="text-slate-900"
                      />
                    </div>
                    <span className="text-[11px] text-slate-300 font-normal mt-1">
                      One-time payment, perpetual software license key, $0/mo forever
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Plan Tier</label>
                    <select
                      value={newClientTier}
                      onChange={(e) => {
                        const tier = e.target.value as SaasPlanTier;
                        setNewClientTier(tier);
                        if (newClientModel === 'monthly_rental') {
                          setNewClientMonthlyFee(tier === 'starter' ? 199 : tier === 'enterprise' ? 499 : 299);
                        } else {
                          setNewClientBuyoutFee(tier === 'enterprise' ? 4999 : 2999);
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    >
                      <option value="starter">Starter</option>
                      <option value="professional">Professional</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {newClientModel === 'monthly_rental' ? 'Monthly Fee ($)' : 'Buyout Fee ($)'}
                    </label>
                    <input
                      type="number"
                      value={newClientModel === 'monthly_rental' ? newClientMonthlyFee : newClientBuyoutFee}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (newClientModel === 'monthly_rental') setNewClientMonthlyFee(val);
                        else setNewClientBuyoutFee(val);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Initial Status</label>
                    <select
                      value={newClientStatus}
                      onChange={(e) => setNewClientStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    >
                      <option value="active">Active (Paid)</option>
                      <option value="trial">14-Day Free Trial</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Administrative Notes</label>
                <textarea
                  rows={2}
                  value={newClientNotes}
                  onChange={(e) => setNewClientNotes(e.target.value)}
                  placeholder="Contract terms, onboarding requests, or specific market customizations..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Provision Client Instance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT CLIENT TENANT SUBSCRIPTION                        */}
      {/* ------------------------------------------------------------- */}
      {isEditClientModalOpen && selectedClientForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight">Edit Client Subscription</h3>
                <p className="text-xs text-slate-300 mt-0.5">{selectedClientForAction.companyName}</p>
              </div>
              <button
                onClick={() => setIsEditClientModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const res = await updateClientTenant(selectedClientForAction.id, {
                  licenseType: editClientModel,
                  planTier: editClientTier,
                  monthlyRentalFee: editClientModel === 'monthly_rental' ? editClientMonthlyFee : 0,
                  oneTimeBuyoutFee: editClientModel === 'one_time_buyout' ? editClientBuyoutFee : 0,
                  status: editClientStatus,
                  nextRenewalDate: editClientRenewal ? `${editClientRenewal}T00:00:00Z` : undefined,
                  notes: editClientNotes,
                });
                if (res) {
                  setIsEditClientModalOpen(false);
                }
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Licensing Model</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    onClick={() => setEditClientModel('monthly_rental')}
                    className={`p-3 rounded-xl border cursor-pointer ${
                      editClientModel === 'monthly_rental'
                        ? 'bg-blue-50/60 border-blue-500 font-bold text-blue-900'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>Monthly Rental</span>
                  </label>
                  <label
                    onClick={() => setEditClientModel('one_time_buyout')}
                    className={`p-3 rounded-xl border cursor-pointer ${
                      editClientModel === 'one_time_buyout'
                        ? 'bg-slate-900 text-white font-bold border-slate-900'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>Outright Buyout</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Plan Tier</label>
                  <select
                    value={editClientTier}
                    onChange={(e) => setEditClientTier(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {editClientModel === 'monthly_rental' ? 'Monthly Rental Fee ($)' : 'Outright Buyout Fee ($)'}
                  </label>
                  <input
                    type="number"
                    value={editClientModel === 'monthly_rental' ? editClientMonthlyFee : editClientBuyoutFee}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (editClientModel === 'monthly_rental') setEditClientMonthlyFee(val);
                      else setEditClientBuyoutFee(val);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subscription Status</label>
                  <select
                    value={editClientStatus}
                    onChange={(e) => setEditClientStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="past_due">Past Due (Payment Failed)</option>
                    <option value="suspended">Suspended</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Next Renewal Date</label>
                  <input
                    type="date"
                    value={editClientRenewal}
                    onChange={(e) => setEditClientRenewal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subscription Notes</label>
                <textarea
                  rows={2}
                  value={editClientNotes}
                  onChange={(e) => setEditClientNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditClientModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: RECORD INVOICE / PAYMENT                                */}
      {/* ------------------------------------------------------------- */}
      {isInvoiceModalOpen && selectedClientForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight">Record Invoice Payment</h3>
                <p className="text-xs text-slate-300 mt-0.5">{selectedClientForAction.companyName}</p>
              </div>
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const res = await recordClientInvoice(selectedClientForAction.id, {
                  amount: invoiceAmount,
                  type: invoiceType,
                  status: invoiceStatus,
                  paymentMethod: invoicePaymentMethod,
                  transactionRef: invoiceRef,
                });
                if (res) {
                  setIsInvoiceModalOpen(false);
                }
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Amount ($) *</label>
                  <input
                    type="number"
                    required
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Type</label>
                  <select
                    value={invoiceType}
                    onChange={(e) => setInvoiceType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="rental_charge">Monthly Rental Charge</option>
                    <option value="one_time_buyout">One-Time Buyout Payment</option>
                    <option value="addon_setup">Add-on / Setup Fee</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                  <input
                    type="text"
                    value={invoicePaymentMethod}
                    onChange={(e) => setInvoicePaymentMethod(e.target.value)}
                    placeholder="Stripe, ACH Bank Wire, Check"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transaction Ref #</label>
                  <input
                    type="text"
                    value={invoiceRef}
                    onChange={(e) => setInvoiceRef(e.target.value)}
                    placeholder="ch_3N..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Confirm & Post Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DRAWER: CLIENT INVOICES HISTORY                               */}
      {/* ------------------------------------------------------------- */}
      {isInvoicesDrawerOpen && selectedClientForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight">Invoice Receipts History</h3>
                <p className="text-xs text-slate-300 mt-0.5">{selectedClientForAction.companyName}</p>
              </div>
              <button
                onClick={() => setIsInvoicesDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Payment Method</th>
                      <th className="py-2.5 px-3">Reference</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedClientForAction.invoices || []).map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{inv.date}</td>
                        <td className="py-2.5 px-3 capitalize text-slate-700">{inv.type.replace('_', ' ')}</td>
                        <td className="py-2.5 px-3 text-slate-500">{inv.paymentMethod}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{inv.transactionRef}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">${inv.amount.toLocaleString()}</td>
                        <td className="py-2.5 px-3">
                          <span className="text-emerald-700 font-semibold capitalize">{inv.status}</span>
                        </td>
                      </tr>
                    ))}
                    {(selectedClientForAction.invoices || []).length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No invoice records yet for this client tenant.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-200">
                <button
                  onClick={() => setIsInvoicesDrawerOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ------------------------------------------------------------- */}
      {/* MODAL: SELF CHANGE PASSWORD                                    */}
      {/* ------------------------------------------------------------- */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black tracking-tight">Update Account Password</h3>
                <p className="text-xs text-slate-300 mt-0.5">{adminUser.name} ({roleLabel})</p>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setPwdChangeError(null);
                if (newPwdInput !== confirmPwdInput) {
                  setPwdChangeError('New password and confirmation do not match.');
                  return;
                }
                setIsChangingPwd(true);
                const res = await changeOwnPassword(currentPwdInput, newPwdInput);
                setIsChangingPwd(false);
                if (res.success) {
                  setCurrentPwdInput('');
                  setNewPwdInput('');
                  setConfirmPwdInput('');
                  setIsChangePasswordOpen(false);
                } else {
                  setPwdChangeError(res.error || 'Could not update password.');
                }
              }}
              className="p-6 space-y-4 text-xs"
            >
              {pwdChangeError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{pwdChangeError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  value={currentPwdInput}
                  onChange={(e) => setCurrentPwdInput(e.target.value)}
                  autoComplete="current-password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  value={newPwdInput}
                  onChange={(e) => setNewPwdInput(e.target.value)}
                  placeholder="Min 8 chars, upper/lower & number"
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={confirmPwdInput}
                  onChange={(e) => setConfirmPwdInput(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPwd}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isChangingPwd ? 'Updating...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

