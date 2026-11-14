import fs from 'fs';
import path from 'path';
import {
  BusinessSettings,
  ServiceRecord,
  ServiceArea,
  Technician,
  MembershipPlan,
  MembershipSubscription,
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
  AdminUser,
  ClientTenant,
  SaasPlatformConfig,
} from '../src/types';
import type { PersistedSession, PersistedResetToken } from './mysql-repository';
import { defaultSitePages } from '../src/data/defaultSitePages';
import {
  initialBusinessSettings,
  initialServices,
  initialServiceAreas,
  initialTechnicians,
  initialMembershipPlans,
  initialPromotions,
  initialReviews,
  initialArticles,
  initialProjects,
  initialLeads,
  initialAppointments,
  initialEstimates,
  initialCustomers,
  initialIntegrations,
  initialAuditLogs,
  initialThemeConfig,
  initialHomepageSections,
  initialNavigationConfig,
  initialFeatureFlags,
  initialMarketSettings,
  initialForms,
  initialPages,
  initialAdminUsers,
  initialClientTenants,
  initialSaasPlatformConfig,
} from '../src/data/seedData';

export interface DatabaseSchema {
  settings: BusinessSettings;
  services: ServiceRecord[];
  serviceAreas: ServiceArea[];
  technicians: Technician[];
  membershipPlans: MembershipPlan[];
  subscriptions: MembershipSubscription[];
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
  theme: ThemeConfig;
  publishedTheme?: ThemeConfig;
  themeHistory?: ThemeConfig[];
  homepageSections: HomepageSection[];
  navigationConfig: NavigationConfig;
  featureFlags: FeatureFlags;
  marketSettings: MarketSettings;
  forms: CustomFormDefinition[];
  pages: PageDefinition[];
  sitePages?: SitePage[];
  users: AdminUser[];
  sessions?: PersistedSession[];
  resetTokens?: PersistedResetToken[];
  clientTenants: ClientTenant[];
  saasConfig: SaasPlatformConfig;
}

export type HvacDatabase = DatabaseSchema;

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'hvac-db.json');

import { loadAllFromMySql, persistAuditLogToMySql } from './mysql-repository';

// Memory cache
let dbCache: DatabaseSchema | null = null;
let isMySqlHydrated = false;

function getInitialDatabase(): DatabaseSchema {
  return {
    settings: initialBusinessSettings,
    services: initialServices,
    serviceAreas: initialServiceAreas,
    technicians: initialTechnicians,
    membershipPlans: initialMembershipPlans,
    subscriptions: [
      {
        id: 'sub-1',
        subscriptionNumber: 'MEM-108422',
        customerName: 'Robert Sterling',
        customerEmail: 'r.sterling@westlaketx.net',
        customerPhone: '(512) 555-0144',
        address: '4208 Westlake Drive',
        planId: 'plan-gold',
        planName: 'Gold Comfort Club (Recommended)',
        status: 'active',
        billingCycle: 'annual',
        nextServiceDue: '2027-03-15',
        renewalDate: '2027-09-14',
        createdAt: '2026-09-14T10:00:00Z',
      },
    ],
    promotions: initialPromotions,
    reviews: initialReviews,
    articles: initialArticles,
    projects: initialProjects,
    leads: initialLeads,
    appointments: initialAppointments,
    estimates: initialEstimates,
    customers: initialCustomers,
    integrations: initialIntegrations,
    auditLogs: initialAuditLogs,
    theme: initialThemeConfig,
    publishedTheme: initialThemeConfig,
    themeHistory: [],
    homepageSections: initialHomepageSections,
    navigationConfig: initialNavigationConfig,
    featureFlags: initialFeatureFlags,
    marketSettings: initialMarketSettings,
    forms: initialForms,
    pages: initialPages,
    sitePages: defaultSitePages,
    users: initialAdminUsers,
    clientTenants: initialClientTenants,
    saasConfig: initialSaasPlatformConfig,
  };
}

export function initDatabase(): DatabaseSchema {
  if (dbCache) return dbCache;

  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      dbCache = JSON.parse(raw);
      if (!dbCache!.subscriptions) dbCache!.subscriptions = [];
      if (!dbCache!.theme) dbCache!.theme = initialThemeConfig;
      if (!dbCache!.publishedTheme) dbCache!.publishedTheme = dbCache!.theme || initialThemeConfig;
      if (!dbCache!.themeHistory) dbCache!.themeHistory = [];
      if (!dbCache!.homepageSections) dbCache!.homepageSections = initialHomepageSections;
      if (!dbCache!.navigationConfig) dbCache!.navigationConfig = initialNavigationConfig;
      if (!dbCache!.featureFlags) dbCache!.featureFlags = initialFeatureFlags;
      if (!dbCache!.marketSettings) dbCache!.marketSettings = initialMarketSettings;
      if (!dbCache!.forms) dbCache!.forms = initialForms;
      if (!dbCache!.pages) dbCache!.pages = initialPages;
      if (!dbCache!.sitePages || !Array.isArray(dbCache!.sitePages) || dbCache!.sitePages.length === 0) {
        dbCache!.sitePages = defaultSitePages;
      } else {
        // Ensure all core default pages are represented in sitePages
        for (const defPage of defaultSitePages) {
          if (!dbCache!.sitePages.some((p) => p.id === defPage.id || p.slug === defPage.slug)) {
            dbCache!.sitePages.push(defPage);
          }
        }
      }
      if (!dbCache!.users) dbCache!.users = initialAdminUsers;
      if (!dbCache!.clientTenants) dbCache!.clientTenants = initialClientTenants;
      if (!dbCache!.saasConfig) dbCache!.saasConfig = initialSaasPlatformConfig;
      persistDatabase();
    } else {
      dbCache = getInitialDatabase();
      persistDatabase();
    }
  } catch (error) {
    console.warn('Failed to load database from disk, defaulting to seed data:', error);
    dbCache = getInitialDatabase();
  }

  return dbCache!;
}

export async function initDatabaseAsync(): Promise<DatabaseSchema> {
  // First ensure synchronous baseline is ready
  initDatabase();

  try {
    console.log('[DB] Connecting and hydrating from Hostinger MySQL...');
    const mysqlData = await loadAllFromMySql();
    if (mysqlData) {
      const mergedSitePages = [...(dbCache!.sitePages || defaultSitePages)];
      if (Array.isArray(mysqlData.sitePages) && mysqlData.sitePages.length > 0) {
        for (const sp of mysqlData.sitePages) {
          const idx = mergedSitePages.findIndex((p) => p.id === sp.id || p.slug === sp.slug);
          if (idx !== -1) {
            mergedSitePages[idx] = sp;
          } else {
            mergedSitePages.push(sp);
          }
        }
      }

      dbCache = {
        ...dbCache!,
        ...mysqlData,
        publishedTheme: mysqlData.publishedTheme || dbCache!.publishedTheme || mysqlData.theme,
        themeHistory: mysqlData.themeHistory || dbCache!.themeHistory || [],
        sitePages: mergedSitePages,
      };
      isMySqlHydrated = true;
      persistDatabase();
      console.log('[DB] Successfully hydrated complete application data from Hostinger MySQL.');
    }
  } catch (error: any) {
    console.warn('[DB] MySQL hydration note:', error.message || error);
  }

  return dbCache!;
}

export function isHydratedFromMySql(): boolean {
  return isMySqlHydrated;
}

export function persistDatabase(): void {
  if (!dbCache) return;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const tempPath = `${DB_PATH}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(dbCache, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_PATH);
  } catch (error) {
    console.error('Failed to write database to disk:', error);
  }
}

export function getDb(): DatabaseSchema {
  if (!dbCache) {
    return initDatabase();
  }
  return dbCache;
}

export function addAuditLog(
  actor: string,
  action: string,
  entityType: string,
  entityId: string,
  details: string
): void {
  const db = getDb();
  const log: AuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    actor,
    action,
    entityType,
    entityId,
    details,
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500);
  }
  persistDatabase();

  // Also asynchronously persist to MySQL
  persistAuditLogToMySql(log).catch((err) => {
    console.warn('[AuditLog] Async MySQL persist warning:', err.message || err);
  });
}
