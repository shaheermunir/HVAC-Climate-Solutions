import { RowDataPacket } from 'mysql2/promise';
import { executeQuery, isMySqlConnected } from './mysql';
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
  SaasInvoiceRecord,
} from '../src/types';
import {
  initialServices,
  initialServiceAreas,
  initialTechnicians,
  initialPromotions,
  initialArticles,
  initialNavigationConfig,
  initialThemeConfig,
} from '../src/data/seedData';
import { DatabaseSchema } from './db';

// Helper to safely parse JSON columns
function parseJson<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

// Helper to format ISO strings or Dates into MySQL TIMESTAMP format ('YYYY-MM-DD HH:MM:SS')
function toMySqlTimestamp(val?: string | Date | null): string {
  const d = val ? new Date(val) : new Date();
  const safeDate = Number.isNaN(d.getTime()) ? new Date() : d;
  return safeDate.toISOString().slice(0, 19).replace('T', ' ');
}

function normalizeAssetUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  return url.replace(/^\/src\/assets\/images\//, '/images/');
}

/**
 * Loads the complete database schema from MySQL tables.
 */
export async function loadAllFromMySql(): Promise<DatabaseSchema | null> {
  try {
    // 1. Settings
    const [settingsRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM business_settings LIMIT 1');
    const s = settingsRows[0] || {};
    const settings: BusinessSettings = {
      businessName: s.business_name || 'Airflow Climate Solutions',
      tagline: s.tagline || 'Precision Climate Control, Uncompromising Reliability',
      country: 'United States',
      primaryCity: s.primary_city || 'Metro Area',
      state: s.state || 'State',
      serviceAreasSummary: 'Metropolitan Area, Regional Districts, and Surrounding Communities',
      primaryPhone: s.primary_phone || '(800) 555-0199',
      emergencyPhone: s.emergency_phone || '(800) 555-0911',
      businessEmail: s.business_email || 'service@airflowclimate.com',
      physicalAddress: s.physical_address || '100 Enterprise Parkway, Suite 400',
      businessHours: s.business_hours || 'Mon - Sat: 7:00 AM - 8:00 PM | Sun: 8:00 AM - 6:00 PM',
      emergencyAvailability: '24/7/365 On-Call Emergency Dispatch with Live Operator Response',
      bookingTimezone: 'America/New_York (EST)',
      currency: 'USD',
      licenseNumber: s.license_number || 'Master Mechanical Contractor · EPA Section 608 Universal Certified',
      satisfactionGuarantee: '100% Comfort Guarantee: If you are not completely satisfied within the first year of installation, we will adjust, repair, or remove the equipment and refund 100% of your investment.',
      workmanshipWarranty: '10-Year Parts & Equipment Manufacturer Warranty + 2-Year Comprehensive Labor & Craftsmanship Guarantee.',
      financingPartners: ['Wells Fargo HVAC Advantage', 'Synchrony Financial', 'GoodLeap Clean Energy'],
      googleRating: Number(s.google_rating) || 4.9,
      reviewCount: Number(s.review_count) || 384,
    };

    // 2. Services
    const [servicesRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM services ORDER BY sort_order ASC');
    const services: ServiceRecord[] = servicesRows.map((r) => {
      const seed = initialServices.find((s) => s.id === r.id || s.slug === r.slug);
      const benefits = parseJson<string[]>(r.key_benefits, []);
      const symptoms = parseJson<string[]>(r.symptoms_fixed, []);
      const process = parseJson<string[]>(r.process_phases, []);
      const options = parseJson<string[]>(r.equipment_options, []);
      const faqs = parseJson<any[]>(r.faqs, []);
      return {
        ...(seed || {}),
        id: r.id,
        name: r.name,
        slug: r.slug,
        category: r.category,
        shortDescription: r.short_description,
        fullDescription: r.full_description || seed?.fullDescription || r.short_description,
        priceStartingAt: r.price_starting_at !== null && r.price_starting_at !== undefined ? Number(r.price_starting_at) : seed?.priceStartingAt,
        priceRangeText: r.price_range_text,
        durationMinutes: Number(r.duration_minutes) || 90,
        isEmergencyEligible: Boolean(r.is_emergency_eligible),
        iconName: r.icon_name || 'Wrench',
        imageUrl: normalizeAssetUrl(r.image_url) || seed?.imageUrl,
        benefits: benefits.length > 0 ? benefits : (seed?.benefits || []),
        problemsAddressed: seed?.problemsAddressed || [],
        symptoms: symptoms.length > 0 ? symptoms : (seed?.symptoms || []),
        process: process.length > 0 ? process : (seed?.process || []),
        options: options.length > 0 ? options : (seed?.options || []),
        supportedEquipment: seed?.supportedEquipment || ['Central AC & Heat Pumps', 'Gas & Electric Furnaces', 'Ductless Mini-Splits'],
        supportedBrands: seed?.supportedBrands || ['Trane', 'Carrier', 'Lennox', 'Bosch', 'Daikin'],
        warrantyInfo: seed?.warrantyInfo || '10-Year Manufacturer Parts + 2-Year Craftsmanship Labor Warranty',
        pricingApproach: seed?.pricingApproach || 'Upfront flat-rate diagnostic and repair pricing before work begins.',
        isFinancingAvailable: seed?.isFinancingAvailable ?? true,
        faqs: faqs.length > 0 ? faqs : (seed?.faqs || []),
        relatedServices: seed?.relatedServices || [],
        isBookingEligible: seed?.isBookingEligible ?? true,
        seoTitle: seed?.seoTitle || `${r.name} | Airflow Climate Solutions`,
        seoDescription: seed?.seoDescription || r.short_description,
        isPublished: Boolean(r.active),
        sortOrder: Number(r.sort_order) || 0,
        active: Boolean(r.active),
      };
    }) as any;

    // 3. Service Areas
    const [areaRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM service_areas ORDER BY id ASC');
    const serviceAreas: ServiceArea[] = areaRows.map((r) => {
      const seed = initialServiceAreas.find((a) => a.id === r.id || a.slug === r.slug);
      const zips = parseJson<string[]>(r.zip_codes, []);
      const popServices = parseJson<string[]>(r.popular_services, []);
      return {
        ...(seed || {}),
        id: r.id,
        name: r.name,
        slug: r.slug,
        zipCodes: zips.length > 0 ? zips : (seed?.zipCodes || []),
        phone: r.phone || r.primary_phone || seed?.phone || '(800) 555-0199',
        primaryPhone: r.phone || r.primary_phone || seed?.phone || '(800) 555-0199',
        type: r.type || seed?.type || 'city',
        etaMinutes: r.eta_minutes || '15-45 min',
        emergencyAvailable: Boolean(r.emergency_available),
        popularServices: popServices.length > 0 ? popServices : (seed?.popularServices || []),
        description: r.description || seed?.description || '',
        active: Boolean(r.active),
      };
    }) as any;

    // 4. Technicians
    const [techRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM technicians ORDER BY id ASC');
    const technicians: Technician[] = techRows.map((r) => {
      const seed = initialTechnicians.find((t) => t.id === r.id || t.name === r.name);
      const parsedSkills = parseJson<string[]>(r.specialties || r.skills, []);
      const photo = normalizeAssetUrl(r.avatar_url || r.photo_url) || seed?.photo || '/images/hero_hvac_technician_1794171516085.jpg';
      return {
        ...(seed || {}),
        id: r.id,
        name: r.name,
        role: r.role || seed?.role || 'Certified HVAC Technician',
        email: seed?.email || 'dispatch@airflowclimate.com',
        photo,
        photoUrl: photo,
        phone: r.phone || seed?.phone || '(800) 555-0199',
        rating: Number(r.rating) || 5.0,
        completedJobsCount: Number(r.completed_jobs_count) || 120,
        skills: parsedSkills.length > 0 ? parsedSkills : (seed?.skills || ['NATE Certified', 'EPA 608 Universal']),
        serviceAreas: seed?.serviceAreas || [],
        workingHours: seed?.workingHours || 'Mon - Sat: 7:00 AM - 7:00 PM',
        yearsExperience: Number(r.experience_years || r.years_experience) || 5,
        active: Boolean(r.active),
      };
    }) as any;

    // 5. Membership Plans
    const [planRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM membership_plans ORDER BY id ASC');
    const membershipPlans: MembershipPlan[] = planRows.map((r) => ({
      id: r.id,
      name: r.name,
      tier: r.tier,
      visitsPerYear: Number(r.visits_per_year) || 2,
      priceMonthly: Number(r.monthly_price || r.price_monthly) || 0,
      priceAnnual: Number(r.annual_price || r.price_annual) || 0,
      discountPercent: Number(r.discount_percentage || r.discount_percent) || 10,
      diagnosticFeeWaived: Boolean(r.diagnostic_fee_waived),
      emergencyPriority: Boolean(r.emergency_priority),
      filterReplacementsIncluded: Number(r.filter_replacements_included) || 2,
      warrantyExtensionYears: Number(r.warranty_extension_years) || 1,
      benefits: parseJson(r.features || r.benefits, []),
      isPopular: Boolean(r.is_popular),
      active: Boolean(r.active),
    })) as any;

    // 6. Subscriptions
    const [subRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM membership_subscriptions ORDER BY created_at DESC');
    const subscriptions: MembershipSubscription[] = subRows.map((r) => ({
      id: r.id,
      subscriptionNumber: r.subscription_number,
      customerName: r.customer_name,
      customerEmail: r.customer_email,
      customerPhone: r.customer_phone,
      address: r.address,
      planId: r.plan_id,
      planName: r.plan_name,
      status: r.status,
      billingCycle: r.billing_cycle,
      nextServiceDue: r.next_service_due,
      renewalDate: r.renewal_date,
      createdAt: r.created_at,
    }));

    // 7. Promotions
    const [promoRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM promotions WHERE active = 1');
    const promotions: Promotion[] = promoRows.map((r) => {
      const seed = initialPromotions.find((p) => p.id === r.id || p.code === r.code);
      return {
        ...(seed || {}),
        id: r.id,
        title: r.title,
        description: r.description,
        code: r.code,
        discountAmount: Number(r.discount_amount),
        discountType: r.discount_type,
        validUntil: r.expires_at || seed?.validUntil || '2026-12-31',
        expiresAt: r.expires_at || seed?.validUntil || '2026-12-31',
        minimumSpend: Number(r.minimum_spend || 0),
        terms: r.disclaimer || seed?.terms || 'Cannot be combined with other offers.',
        disclaimer: r.disclaimer || seed?.terms || '',
        eligibleServices: seed?.eligibleServices || [],
        active: Boolean(r.active),
      };
    }) as any;

    // 8. Reviews
    const [revRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM reviews ORDER BY id ASC');
    const reviews: Review[] = revRows.map((r) => ({
      id: r.id,
      authorName: r.author_name,
      city: r.city,
      rating: Number(r.rating),
      serviceCategory: r.service_category,
      text: r.text,
      source: r.source,
      verified: Boolean(r.verified),
      verifiedCustomer: Boolean(r.verified),
      date: r.date,
      status: r.status,
    })) as any;

    // 9. Articles
    const [artRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM articles ORDER BY published_at DESC');
    const articles: Article[] = artRows.map((r) => {
      const seed = initialArticles.find((a) => a.id === r.id || a.slug === r.slug);
      return {
        ...(seed || {}),
        id: r.id,
        title: r.title,
        slug: r.slug,
        excerpt: r.excerpt,
        content: r.content,
        author: r.author,
        category: r.category,
        publishedAt: r.published_at,
        publishDate: r.published_at || seed?.publishDate || '2026-01-01',
        readTime: `${r.read_time_minutes || 5} min read`,
        readTimeMinutes: Number(r.read_time_minutes || 5),
        imageUrl: normalizeAssetUrl(r.image_url) || seed?.coverImage,
        coverImage: normalizeAssetUrl(r.image_url) || seed?.coverImage,
        tags: parseJson(r.tags, seed?.tags || []),
        relatedServiceSlugs: seed?.relatedServiceSlugs || [],
        isFeatured: Boolean(r.is_featured),
        isPublished: true,
      };
    }) as any;

    // 10. Projects
    const [projRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM projects ORDER BY completion_date DESC');
    const projects: Project[] = projRows.map((r) => ({
      id: r.id,
      slug: r.id,
      title: r.title,
      category: r.category,
      city: r.city,
      date: r.completion_date,
      completionDate: r.completion_date,
      equipmentInstalled: r.equipment_installed,
      beforeImage: normalizeAssetUrl(r.before_image) || '/images/hero_hvac_technician_1794171516085.jpg',
      afterImage: normalizeAssetUrl(r.after_image) || '/images/hvac_installation_ac_1794171517489.jpg',
      problem: r.problem,
      solution: r.solution,
      outcome: r.outcome,
      customerQuote: r.customer_quote,
      customerName: r.customer_name,
      isFeatured: Boolean(r.is_featured),
    })) as any;

    // 11. Leads
    const [leadRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM leads ORDER BY created_at DESC');
    const leads: Lead[] = leadRows.map((r) => ({
      id: r.id,
      leadNumber: r.lead_number,
      source: r.source,
      journey: r.journey,
      serviceRequested: r.service_requested,
      customerName: r.customer_name,
      email: r.email || '',
      phone: r.phone,
      address: r.address || '',
      city: r.city || 'Metro Area',
      state: r.state || 'State',
      zipCode: r.zip_code,
      urgency: r.urgency,
      preferredContactMethod: r.preferred_contact_method,
      status: r.status,
      priority: r.priority,
      notes: r.notes || '',
      propertyType: r.property_type,
      preferredDate: r.preferred_date,
      preferredTimeSlot: r.preferred_time_slot,
      photoUrl: r.photo_url,
      commercialDetails: parseJson(r.commercial_details, undefined),
      systemSizingDetails: parseJson(r.system_sizing_details, undefined),
      maintenanceDetails: parseJson(r.maintenance_details, undefined),
      assignedTechnicianId: r.assigned_technician_id,
      assignedTechnicianName: r.assigned_technician_name,
      dispatchStatusNotice: r.dispatch_status_notice,
      internalNotes: parseJson(r.internal_notes, []),
      dispatcherNotes: parseJson(r.internal_notes, []),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    // 12. Appointments
    const [aptRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM appointments ORDER BY appointment_date ASC');
    const appointments: Appointment[] = aptRows.map((r) => ({
      id: r.id,
      appointmentNumber: r.appointment_number,
      serviceId: r.service_id,
      serviceName: r.service_name,
      customerName: r.customer_name,
      customerEmail: r.customer_email,
      customerPhone: r.customer_phone,
      address: r.address,
      city: r.city || 'Metro Area',
      state: r.state || 'State',
      zipCode: r.zip_code,
      date: r.appointment_date,
      timeSlot: r.time_slot,
      status: r.status,
      durationMinutes: Number(r.duration_minutes),
      estimatedDurationMinutes: Number(r.estimated_duration_minutes),
      isEmergency: Boolean(r.is_emergency),
      issueDescription: r.issue_description,
      price: Number(r.price),
      technicianId: r.technician_id,
      technicianName: r.technician_name,
      photoUrl: r.photo_url,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    // 13. Estimates
    const [estRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM estimates ORDER BY created_at DESC');
    const estimates: Estimate[] = estRows.map((r) => ({
      id: r.id,
      estimateNumber: r.estimate_number,
      leadId: r.lead_id,
      customerName: r.customer_name,
      customerEmail: r.customer_email,
      customerPhone: r.customer_phone,
      address: r.address,
      city: r.city || 'Metro Area',
      state: r.state || 'State',
      zipCode: r.zip_code,
      status: r.status,
      subtotal: Number(r.subtotal),
      discount: Number(r.discount),
      discountAmount: Number(r.discount),
      taxAmount: Number(r.tax_amount),
      taxRate: 0.0825,
      total: Number(r.total),
      totalAmount: Number(r.total),
      serviceCategory: 'HVAC Services',
      projectDescription: r.notes || 'HVAC equipment upgrade & installation',
      lineItems: parseJson(r.line_items, []),
      notes: r.notes,
      customerNotes: r.notes,
      validUntil: r.valid_until,
      expirationDate: r.valid_until,
      acceptedAt: r.accepted_at,
      signedAt: r.accepted_at,
      rejectedAt: r.rejected_at,
      signatureName: r.signature_name,
      customerSignatureName: r.signature_name,
      financingRequested: Boolean(r.financing_requested),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })) as any;

    // 14. Customers & Equipment
    const [custRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM customers ORDER BY first_name ASC');
    const [eqRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM customer_equipment');
    const equipmentByCust = new Map<string, EquipmentItem[]>();
    for (const eq of eqRows) {
      const list = equipmentByCust.get(eq.customer_id) || [];
      list.push({
        id: eq.id,
        type: eq.type,
        manufacturer: eq.manufacturer,
        model: eq.model,
        modelNumber: eq.model,
        serialNumber: eq.serial_number,
        installDate: eq.install_date,
        lastServiceDate: eq.last_service_date,
        lastServicedDate: eq.last_service_date,
        filterSize: eq.filter_size,
        condition: eq.condition_status || 'Optimal',
        conditionStatus: eq.condition_status || 'Optimal',
      } as any);
      equipmentByCust.set(eq.customer_id, list);
    }

    const customers: CustomerProfile[] = custRows.map((r) => ({
      id: r.id,
      name: `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Valued Customer',
      firstName: r.first_name,
      lastName: r.last_name,
      email: r.email,
      phone: r.phone,
      address: r.address,
      city: r.city || 'Metro Area',
      state: r.state || 'State',
      zipCode: r.zip_code,
      role: 'customer',
      membershipTier: r.membership_tier,
      notes: r.notes,
      equipment: equipmentByCust.get(r.id) || [],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })) as any;

    // 15. Theme Settings
    const [themeRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM theme_settings WHERE id = "default" LIMIT 1');
    const t = themeRows[0] || {};
    const theme: ThemeConfig = {
      ...initialThemeConfig,
      primaryColor: t.primary_color || initialThemeConfig.primaryColor,
      secondaryColor: t.secondary_color || initialThemeConfig.secondaryColor,
      accentColor: t.accent_color || initialThemeConfig.accentColor,
      backgroundColor: t.background_color || initialThemeConfig.backgroundColor,
      primaryTextColor: t.text_color || initialThemeConfig.primaryTextColor,
      headingFont: t.heading_font || initialThemeConfig.headingFont,
      bodyFont: t.body_font || initialThemeConfig.bodyFont,
      buttonRadius: t.border_radius && t.border_radius !== 'rounded-lg' ? t.border_radius : initialThemeConfig.buttonRadius,
      cardRadius: t.border_radius && t.border_radius !== 'rounded-lg' ? t.border_radius : initialThemeConfig.cardRadius,
    };

    // 16. Homepage Sections
    const [sectionRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM homepage_sections ORDER BY order_index ASC');
    const homepageSections: HomepageSection[] = sectionRows.map((r) => {
      const cfg = parseJson(r.config_json, {}) as any;
      const rawType = cfg.type || r.type || r.id.replace('sec-', '');
      const normalizedType = String(rawType).replace(/-/g, '_');
      return {
        id: r.id,
        type: normalizedType,
        name: r.name,
        enabled: Boolean(r.enabled),
        order: Number(r.order_index),
        heading: cfg.heading,
        subheading: cfg.subheading,
        config: cfg,
      };
    }) as any;

    // 17. Navigation Items
    const [navRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM navigation_items ORDER BY order_index ASC');
    const navigationConfig: NavigationConfig = {
      ...initialNavigationConfig,
      menuItems: navRows.length > 0
        ? navRows.map((r) => ({
            id: r.id,
            label: r.label,
            path: r.path,
            order: Number(r.order_index),
            enabled: true,
          }))
        : initialNavigationConfig.menuItems,
      mainNav: navRows.map((r) => ({
        label: r.label,
        path: r.path,
        isExternal: Boolean(r.is_external),
        isCta: Boolean(r.is_cta),
      })),
      footerNav: [],
    } as any;

    // 18. Feature Flags
    const [flagRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM feature_flags WHERE id = "default" LIMIT 1');
    const fl = flagRows[0] || {};
    const featureFlags: FeatureFlags = {
      onlineBooking: fl.online_booking !== undefined ? Boolean(fl.online_booking) : true,
      emergencyService: fl.emergency_triage !== undefined ? Boolean(fl.emergency_triage) : true,
      estimateCalculator: fl.sizing_calculator !== undefined ? Boolean(fl.sizing_calculator) : true,
      maintenanceMemberships: fl.membership_club !== undefined ? Boolean(fl.membership_club) : true,
      commercialEnquiries: true,
      customerReviews: fl.review_submission !== undefined ? Boolean(fl.review_submission) : true,
      knowledgeBase: fl.blog_enabled !== undefined ? Boolean(fl.blog_enabled) : true,
      emergencyTriage: fl.emergency_triage !== undefined ? Boolean(fl.emergency_triage) : true,
      sizingCalculator: fl.sizing_calculator !== undefined ? Boolean(fl.sizing_calculator) : true,
      membershipClub: fl.membership_club !== undefined ? Boolean(fl.membership_club) : true,
      liveChat: fl.live_chat !== undefined ? Boolean(fl.live_chat) : true,
      financingCalculator: fl.financing_calculator !== undefined ? Boolean(fl.financing_calculator) : true,
      reviewSubmission: fl.review_submission !== undefined ? Boolean(fl.review_submission) : true,
      blogEnabled: fl.blog_enabled !== undefined ? Boolean(fl.blog_enabled) : true,
      customForms: fl.custom_forms !== undefined ? Boolean(fl.custom_forms) : true,
    } as any;

    // 19. Market Settings
    const [mktRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM market_settings WHERE id = "default" LIMIT 1');
    const m = mktRows[0] || {};
    const marketSettings: MarketSettings = {
      country: m.country || 'United States',
      regionOrState: m.region_or_state || 'State',
      primaryCity: m.primary_city || 'Metro Area',
      serviceRadiusMiles: Number(m.service_radius_miles) || 45,
      currency: m.currency || '$',
      temperatureUnit: m.temperature_unit || 'F',
      postalCodeLabel: m.postal_code_label || 'ZIP Code',
      taxRate: Number(m.tax_rate) || 0.0825,
      emergencyDispatchSlaMinutes: Number(m.emergency_dispatch_sla_minutes) || 15,
      businessHoursText: m.business_hours_text || 'Mon - Sat: 7:00 AM - 8:00 PM | Sun: Emergency Dispatch Only',
      closedSundaysForRoutine: m.closed_sundays_for_routine !== undefined ? Boolean(m.closed_sundays_for_routine) : true,
    };

    // 20. Forms
    const [formRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM forms ORDER BY id ASC');
    const forms: CustomFormDefinition[] = formRows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      fields: parseJson(r.fields, []),
      notificationEmail: r.notification_email,
      submitButtonText: r.submit_button_text,
      successMessage: r.success_message,
      active: Boolean(r.active),
      enabled: Boolean(r.active),
      createdAt: new Date().toISOString(),
    })) as any;

    // 21. Pages
    const [pageRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM pages ORDER BY id ASC');
    const pages: PageDefinition[] = pageRows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      metaDescription: r.meta_description,
      published: Boolean(r.published),
      isPublished: Boolean(r.published),
      blocks: parseJson(r.blocks, []),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })) as any;

    // 22. Users (with RBAC schema migration ensure)
    await ensureAuthTables();
    const [userRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM users ORDER BY created_at ASC, id ASC');
    const users: AdminUser[] = userRows.map((r) => ({
      id: r.id,
      username: r.username || undefined,
      email: r.email,
      passwordHash: r.password_hash || undefined,
      role: r.role,
      name: r.name,
      phone: r.phone || undefined,
      permissions: parseJson(r.permissions, undefined),
      technicianId: r.technician_id || undefined,
      mustChangePassword: Boolean(r.must_change_password),
      status: r.active !== undefined ? (Boolean(r.active) ? 'active' : 'suspended') : 'active',
      lastLogin: r.last_login || undefined,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    })) as any;

    // 23. SaaS Client Tenants
    const [tenantRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM client_tenants ORDER BY created_at DESC');
    const clientTenants: ClientTenant[] = tenantRows.map((r) => ({
      id: r.id,
      companyName: r.company_name,
      slug: r.slug,
      domain: r.domain,
      primaryDomain: r.domain || `${r.slug}.com`,
      subdomain: `${r.slug}.hvacsaas.pro`,
      ownerName: r.contact_name,
      ownerEmail: r.contact_email,
      ownerPhone: r.contact_phone,
      contactName: r.contact_name,
      contactEmail: r.contact_email,
      contactPhone: r.contact_phone,
      city: r.city,
      state: r.state,
      licenseType: r.license_type,
      planTier: r.plan_tier,
      monthlyRentalFee: Number(r.monthly_rental_rate),
      monthlyRentalRate: Number(r.monthly_rental_rate),
      oneTimeBuyoutFee: Number(r.buyout_price),
      buyoutPrice: Number(r.buyout_price),
      status: r.billing_status || (r.active ? 'active' : 'suspended'),
      billingStatus: r.billing_status,
      active: Boolean(r.active),
      billingCycleStartDate: r.license_start_date,
      licenseStartDate: r.license_start_date,
      perpetualLicenseKey: r.perpetual_license_key,
      leadQuotaMonthly: Number(r.max_monthly_leads),
      maxMonthlyLeads: Number(r.max_monthly_leads),
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })) as any;

    // 24. SaaS Config
    const [saasRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM saas_config WHERE id = "default" LIMIT 1');
    const sc = saasRows[0] || {};
    const saasConfig: SaasPlatformConfig = {
      platformName: sc.platform_name || 'HVAC SaaS Engine',
      tagline: 'Turnkey HVAC Platform',
      supportEmail: 'support@hvacplatform.com',
      supportPhone: '+1 (800) 555-HVAC',
      stripeConnected: true,
      allowPublicOnboarding: Boolean(sc.allow_public_onboarding),
      paymentGatewayMode: sc.payment_gateway_mode || 'test',
      plans: parseJson(sc.plans, []),
    } as any;

    // 25. Integrations
    const [intRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM integrations ORDER BY id ASC');
    const integrations: IntegrationConfig[] = intRows.map((r) => ({
      id: r.id,
      name: r.name,
      provider: r.type || 'Custom Service',
      category: r.type || 'system',
      details: r.name,
      credentialsSet: Boolean(r.enabled),
      type: r.type,
      enabled: Boolean(r.enabled),
      config: parseJson(r.config, {}),
      lastSyncAt: r.last_sync_at,
      status: r.status,
    })) as any;

    // 26. Audit Logs
    const [auditRows] = await executeQuery<RowDataPacket[]>('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500');
    const auditLogs: AuditLog[] = auditRows.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      actor: r.actor,
      action: r.action,
      entityType: r.entity_type,
      entityId: r.entity_id,
      details: r.details,
    }));

    // 27. Site Pages (Content CMS)
    let sitePages: SitePage[] | undefined = undefined;
    try {
      await ensureSitePagesTable();
      const [sitePageRows] = await executeQuery<RowDataPacket[]>(
        'SELECT * FROM site_pages',
        [],
        { silentErrors: ['ER_NO_SUCH_TABLE'] }
      );
      if (sitePageRows && sitePageRows.length > 0) {
        sitePages = sitePageRows.map((r) => ({
          id: r.id,
          slug: r.slug,
          title: r.title,
          navLabel: r.nav_label || r.title,
          metaDescription: r.meta_description || '',
          isPublished: r.is_published !== undefined ? Boolean(r.is_published) : true,
          sections: parseJson(r.sections, []),
        }));
      }
    } catch {
      // Table may not yet be migrated
    }

    return {
      settings,
      services,
      serviceAreas,
      technicians,
      membershipPlans,
      subscriptions,
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
      theme,
      homepageSections,
      navigationConfig,
      featureFlags,
      marketSettings,
      forms,
      pages,
      users,
      clientTenants,
      saasConfig,
      sitePages,
    };
  } catch (error: any) {
    console.error('[MySQL Repository Error]: Failed to load database from MySQL:', error.code || error.message);
    return null;
  }
}

// ========================================================
// PERSISTENT SQL MUTATIONS (Parameterized Statements)
// ========================================================

export async function persistLeadToMySql(lead: any): Promise<void> {
  await executeQuery(
    `INSERT INTO leads 
      (id, lead_number, source, journey, service_requested, customer_name, email, phone, 
       address, city, state, zip_code, urgency, preferred_contact_method, status, priority, 
       notes, property_type, preferred_date, preferred_time_slot, photo_url, commercial_details, 
       system_sizing_details, maintenance_details, assigned_technician_id, assigned_technician_name, 
       dispatch_status_notice, internal_notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       status = VALUES(status),
       priority = VALUES(priority),
       assigned_technician_id = VALUES(assigned_technician_id),
       assigned_technician_name = VALUES(assigned_technician_name),
       dispatch_status_notice = VALUES(dispatch_status_notice),
       internal_notes = VALUES(internal_notes),
       notes = VALUES(notes),
       updated_at = VALUES(updated_at)`,
    [
      lead.id,
      lead.leadNumber,
      lead.source || 'website_form',
      lead.journey || 'routine',
      lead.serviceRequested,
      lead.customerName,
      lead.email || null,
      lead.phone,
      lead.address || null,
      lead.city || 'Metro Area',
      lead.state || 'State',
      lead.zipCode || '10001',
      lead.urgency || 'normal',
      lead.preferredContactMethod || 'phone',
      lead.status || 'new',
      lead.priority || 'medium',
      lead.notes || null,
      lead.propertyType || 'residential',
      lead.preferredDate || null,
      lead.preferredTimeSlot || null,
      lead.photoUrl || null,
      JSON.stringify(lead.commercialDetails || null),
      JSON.stringify(lead.systemSizingDetails || null),
      JSON.stringify(lead.maintenanceDetails || null),
      lead.assignedTechnicianId || null,
      lead.assignedTechnicianName || null,
      lead.dispatchStatusNotice || null,
      JSON.stringify(lead.internalNotes || lead.dispatcherNotes || []),
      toMySqlTimestamp(lead.createdAt),
      toMySqlTimestamp(),
    ]
  );
}

export async function persistAppointmentToMySql(apt: any): Promise<void> {
  await executeQuery(
    `INSERT INTO appointments 
      (id, appointment_number, service_id, service_name, customer_name, customer_email, customer_phone, 
       address, city, state, zip_code, appointment_date, time_slot, status, duration_minutes, 
       estimated_duration_minutes, is_emergency, issue_description, price, technician_id, technician_name, photo_url, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       status = VALUES(status),
       technician_id = VALUES(technician_id),
       technician_name = VALUES(technician_name),
       appointment_date = VALUES(appointment_date),
       time_slot = VALUES(time_slot),
       notes = VALUES(notes),
       updated_at = VALUES(updated_at)`,
    [
      apt.id,
      apt.appointmentNumber,
      apt.serviceId || 'routine-service',
      apt.serviceName || 'General HVAC Service',
      apt.customerName,
      apt.customerEmail || null,
      apt.customerPhone,
      apt.address || null,
      apt.city || 'Metro Area',
      apt.state || 'State',
      apt.zipCode || '10001',
      apt.date,
      apt.timeSlot,
      apt.status || 'confirmed',
      apt.durationMinutes || 90,
      apt.estimatedDurationMinutes || 90,
      apt.isEmergency ? 1 : 0,
      apt.issueDescription || null,
      apt.price || 89.0,
      apt.technicianId || null,
      apt.technicianName || null,
      apt.photoUrl || null,
      apt.notes || null,
      toMySqlTimestamp(apt.createdAt),
      toMySqlTimestamp(),
    ]
  );
}

export async function persistEstimateToMySql(est: any): Promise<void> {
  const estTotal = est.totalAmount ?? est.total ?? est.subtotal ?? 0;
  const estDiscount = est.discountAmount ?? est.discount ?? 0;
  const validDate = est.expirationDate ?? est.validUntil ?? new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0];
  const acceptedDate = est.signedAt ?? est.acceptedAt ?? null;
  const signature = est.customerSignatureName ?? est.signatureName ?? null;
  const notesText = est.customerNotes ?? est.notes ?? null;

  await executeQuery(
    `INSERT INTO estimates 
      (id, estimate_number, lead_id, customer_name, customer_email, customer_phone, address, 
       city, state, zip_code, status, subtotal, discount, tax_amount, total, line_items, notes, 
       valid_until, accepted_at, rejected_at, signature_name, financing_requested, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       status = VALUES(status),
       subtotal = VALUES(subtotal),
       discount = VALUES(discount),
       tax_amount = VALUES(tax_amount),
       total = VALUES(total),
       line_items = VALUES(line_items),
       notes = VALUES(notes),
       accepted_at = VALUES(accepted_at),
       rejected_at = VALUES(rejected_at),
       signature_name = VALUES(signature_name),
       updated_at = VALUES(updated_at)`,
    [
      est.id,
      est.estimateNumber,
      est.leadId || null,
      est.customerName,
      est.customerEmail || null,
      est.customerPhone || null,
      est.address || null,
      est.city || 'Metro Area',
      est.state || 'State',
      est.zipCode || '10001',
      est.status || 'sent',
      est.subtotal ?? 0,
      estDiscount,
      est.taxAmount || 0,
      estTotal,
      JSON.stringify(est.lineItems || []),
      notesText,
      validDate,
      acceptedDate,
      est.rejectedAt || null,
      signature,
      est.financingRequested ? 1 : 0,
      toMySqlTimestamp(est.createdAt),
      toMySqlTimestamp(),
    ]
  );
}

export async function persistReviewToMySql(r: any): Promise<void> {
  await executeQuery(
    `INSERT INTO reviews (id, author_name, city, rating, service_category, text, source, verified, date, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status), rating = VALUES(rating)`,
    [
      r.id,
      r.authorName,
      r.city,
      r.rating,
      r.serviceCategory,
      r.text,
      r.source || 'Google Verified',
      r.verified || r.verifiedCustomer ? 1 : 0,
      r.date,
      r.status || 'approved',
    ]
  );
}

export async function persistBusinessSettingsToMySql(s: BusinessSettings): Promise<void> {
  await executeQuery(
    `INSERT INTO business_settings 
      (id, business_name, legal_name, tagline, license_number, primary_phone, emergency_phone, 
       business_email, physical_address, business_hours, primary_city, state)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       business_name = VALUES(business_name),
       legal_name = VALUES(legal_name),
       tagline = VALUES(tagline),
       license_number = VALUES(license_number),
       primary_phone = VALUES(primary_phone),
       emergency_phone = VALUES(emergency_phone),
       business_email = VALUES(business_email),
       physical_address = VALUES(physical_address),
       business_hours = VALUES(business_hours),
       primary_city = VALUES(primary_city),
       state = VALUES(state),
       updated_at = CURRENT_TIMESTAMP`,
    [
      'default',
      s.businessName,
      s.businessName,
      s.tagline,
      s.licenseNumber,
      s.primaryPhone,
      s.emergencyPhone,
      s.businessEmail,
      s.physicalAddress,
      s.businessHours,
      s.primaryCity || 'Metro Area',
      s.state || 'State',
    ]
  );
}

export async function persistMarketSettingsToMySql(m: MarketSettings): Promise<void> {
  await executeQuery(
    `INSERT INTO market_settings 
      (id, country, region_or_state, primary_city, service_radius_miles, currency, temperature_unit, postal_code_label, tax_rate, emergency_dispatch_sla_minutes, business_hours_text, closed_sundays_for_routine)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       country = VALUES(country),
       region_or_state = VALUES(region_or_state),
       primary_city = VALUES(primary_city),
       service_radius_miles = VALUES(service_radius_miles),
       currency = VALUES(currency),
       temperature_unit = VALUES(temperature_unit),
       postal_code_label = VALUES(postal_code_label),
       tax_rate = VALUES(tax_rate),
       emergency_dispatch_sla_minutes = VALUES(emergency_dispatch_sla_minutes),
       business_hours_text = VALUES(business_hours_text),
       closed_sundays_for_routine = VALUES(closed_sundays_for_routine),
       updated_at = CURRENT_TIMESTAMP`,
    [
      'default',
      m.country,
      m.regionOrState,
      m.primaryCity,
      m.serviceRadiusMiles,
      m.currency,
      m.temperatureUnit,
      m.postalCodeLabel,
      m.taxRate,
      m.emergencyDispatchSlaMinutes,
      m.businessHoursText,
      m.closedSundaysForRoutine ? 1 : 0,
    ]
  );
}

export async function persistThemeToMySql(t: any): Promise<void> {
  await executeQuery(
    `INSERT INTO theme_settings 
      (id, primary_color, secondary_color, accent_color, background_color, text_color, heading_font, body_font, border_radius, button_style, custom_css)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       primary_color = VALUES(primary_color),
       secondary_color = VALUES(secondary_color),
       accent_color = VALUES(accent_color),
       background_color = VALUES(background_color),
       text_color = VALUES(text_color),
       heading_font = VALUES(heading_font),
       body_font = VALUES(body_font),
       border_radius = VALUES(border_radius),
       button_style = VALUES(button_style),
       custom_css = VALUES(custom_css),
       updated_at = CURRENT_TIMESTAMP`,
    [
      'default',
      t.primaryColor || '#0284c7',
      t.secondaryColor || '#0f172a',
      t.accentColor || '#f97316',
      t.backgroundColor || '#ffffff',
      t.primaryTextColor || t.textColor || '#0f172a',
      t.headingFont || 'Inter, sans-serif',
      t.bodyFont || 'Inter, sans-serif',
      String(t.buttonRadius || t.borderRadius || 'rounded-lg').slice(0, 20),
      t.buttonStyle || 'solid',
      t.customCss || null,
    ]
  );
}

export async function persistFeatureFlagsToMySql(f: any): Promise<void> {
  await executeQuery(
    `INSERT INTO feature_flags 
      (id, online_booking, emergency_triage, sizing_calculator, membership_club, live_chat, financing_calculator, review_submission, blog_enabled, custom_forms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       online_booking = VALUES(online_booking),
       emergency_triage = VALUES(emergency_triage),
       sizing_calculator = VALUES(sizing_calculator),
       membership_club = VALUES(membership_club),
       live_chat = VALUES(live_chat),
       financing_calculator = VALUES(financing_calculator),
       review_submission = VALUES(review_submission),
       blog_enabled = VALUES(blog_enabled),
       custom_forms = VALUES(custom_forms),
       updated_at = CURRENT_TIMESTAMP`,
    [
      'default',
      f.onlineBooking ? 1 : 0,
      f.emergencyService ?? f.emergencyTriage ? 1 : 0,
      f.estimateCalculator ?? f.sizingCalculator ? 1 : 0,
      f.maintenanceMemberships ?? f.membershipClub ? 1 : 0,
      f.liveChat ? 1 : 0,
      f.financingCalculator ? 1 : 0,
      f.customerReviews ?? f.reviewSubmission ? 1 : 0,
      f.knowledgeBase ?? f.blogEnabled ? 1 : 0,
      f.customForms ? 1 : 0,
    ]
  );
}

export async function persistFormSubmissionToMySql(
  formId: string,
  dataOrSlug: any,
  maybeData?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const subId = `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const actualData = maybeData !== undefined ? maybeData : dataOrSlug;
  const formSlug = maybeData !== undefined ? String(dataOrSlug) : formId;
  await executeQuery(
    `INSERT INTO form_submissions (id, form_id, form_slug, data, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      subId,
      formId,
      formSlug,
      JSON.stringify(actualData),
      ipAddress || null,
      userAgent || null,
    ]
  );
}

export async function persistAuditLogToMySql(log: AuditLog): Promise<void> {
  await executeQuery(
    `INSERT INTO audit_logs (id, timestamp, actor, action, entity_type, entity_id, details)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      log.id,
      log.timestamp,
      log.actor,
      log.action,
      log.entityType,
      log.entityId,
      log.details,
    ]
  );
}

export async function persistTenantToMySql(ct: any): Promise<void> {
  await executeQuery(
    `INSERT INTO client_tenants 
      (id, company_name, slug, domain, contact_name, contact_email, contact_phone, city, state, 
       license_type, plan_tier, monthly_rental_rate, buyout_price, billing_status, active, 
       license_start_date, perpetual_license_key, max_monthly_leads, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       company_name = VALUES(company_name),
       contact_name = VALUES(contact_name),
       contact_email = VALUES(contact_email),
       contact_phone = VALUES(contact_phone),
       monthly_rental_rate = VALUES(monthly_rental_rate),
       buyout_price = VALUES(buyout_price),
       billing_status = VALUES(billing_status),
       active = VALUES(active),
       notes = VALUES(notes),
       updated_at = CURRENT_TIMESTAMP`,
    [
      ct.id,
      ct.companyName,
      ct.slug,
      ct.primaryDomain || ct.domain || ct.subdomain || null,
      ct.ownerName || ct.contactName || 'Owner',
      ct.ownerEmail || ct.contactEmail || 'admin@example.com',
      ct.ownerPhone || ct.contactPhone || null,
      ct.city || 'Metro City',
      ct.state || 'State',
      ct.licenseType || 'monthly_rental',
      ct.planTier || 'professional',
      ct.monthlyRentalFee ?? ct.monthlyRentalRate ?? 0,
      ct.oneTimeBuyoutFee ?? ct.buyoutPrice ?? 0,
      ct.status || ct.billingStatus || 'active',
      ct.status === 'active' || ct.active ? 1 : 0,
      ct.billingCycleStartDate || ct.licenseStartDate || null,
      ct.perpetualLicenseKey || null,
      ct.leadQuotaMonthly ?? ct.maxMonthlyLeads ?? 500,
      ct.notes || null,
      toMySqlTimestamp(ct.createdAt),
      toMySqlTimestamp(),
    ]
  );
}

export async function persistInvoiceToMySql(inv: any): Promise<void> {
  await executeQuery(
    `INSERT INTO saas_invoices 
      (id, client_id, invoice_number, amount, status, invoice_date, due_date, paid_at, plan_tier, license_type, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status), paid_at = VALUES(paid_at)`,
    [
      inv.id,
      inv.clientId || inv.tenantId || 'tenant-metro-pro',
      inv.invoiceNumber,
      inv.amount,
      inv.status || 'paid',
      inv.date || inv.invoiceDate || new Date().toISOString().split('T')[0],
      inv.dueDate || inv.date || new Date().toISOString().split('T')[0],
      inv.status === 'paid' ? (inv.date || new Date().toISOString().split('T')[0]) : null,
      inv.planTier || 'professional',
      inv.licenseType || 'monthly_rental',
      inv.notes || (inv.paymentMethod ? `Paid via ${inv.paymentMethod}` : null),
    ]
  );
}

export async function persistServiceToMySql(s: any): Promise<void> {
  await executeQuery(
    `INSERT INTO services 
      (id, name, slug, category, short_description, full_description, price_starting_at, price_range_text, duration_minutes, is_emergency_eligible, icon_name, image_url, key_benefits, symptoms_fixed, process_phases, equipment_options, faqs, sort_order, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
      name = VALUES(name), slug = VALUES(slug), category = VALUES(category),
      short_description = VALUES(short_description), full_description = VALUES(full_description),
      price_starting_at = VALUES(price_starting_at), price_range_text = VALUES(price_range_text),
      duration_minutes = VALUES(duration_minutes), is_emergency_eligible = VALUES(is_emergency_eligible),
      icon_name = VALUES(icon_name), image_url = VALUES(image_url),
      key_benefits = VALUES(key_benefits), symptoms_fixed = VALUES(symptoms_fixed),
      process_phases = VALUES(process_phases), equipment_options = VALUES(equipment_options),
      faqs = VALUES(faqs), sort_order = VALUES(sort_order), active = VALUES(active)`,
    [
      s.id,
      s.name,
      s.slug,
      s.category,
      s.shortDescription,
      s.fullDescription || s.shortDescription || '',
      s.priceStartingAt ?? s.startingPrice ?? 89.0,
      s.priceRangeText || null,
      s.durationMinutes || 90,
      s.isEmergencyEligible ?? s.emergencyEligible ? 1 : 0,
      s.iconName || 'Wrench',
      s.imageUrl || null,
      JSON.stringify(s.benefits || s.keyBenefits || []),
      JSON.stringify(s.symptoms || s.symptomsFixed || []),
      JSON.stringify(s.process || s.processPhases || []),
      JSON.stringify(s.options || s.equipmentOptions || []),
      JSON.stringify(s.faqs || []),
      s.sortOrder || 0,
      (s.isPublished ?? s.active ?? true) ? 1 : 0,
    ]
  );
}

export async function deleteServiceFromMySql(id: string): Promise<void> {
  await executeQuery('DELETE FROM services WHERE id = ?', [id]);
}

export async function persistServiceAreaToMySql(a: any): Promise<void> {
  await executeQuery(
    `INSERT INTO service_areas 
      (id, name, slug, zip_codes, primary_phone, eta_minutes, emergency_available, popular_services, description, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
      name = VALUES(name), slug = VALUES(slug), zip_codes = VALUES(zip_codes),
      primary_phone = VALUES(primary_phone), eta_minutes = VALUES(eta_minutes),
      emergency_available = VALUES(emergency_available), popular_services = VALUES(popular_services),
      description = VALUES(description), active = VALUES(active)`,
    [
      a.id,
      a.name,
      a.slug,
      JSON.stringify(a.zipCodes || []),
      a.phone || a.primaryPhone || null,
      String(a.etaMinutes || '15-45 min'),
      a.emergencyAvailable ? 1 : 0,
      JSON.stringify(a.popularServices || []),
      a.description || '',
      a.active !== false ? 1 : 0,
    ]
  );
}

export async function deleteServiceAreaFromMySql(id: string): Promise<void> {
  await executeQuery('DELETE FROM service_areas WHERE id = ?', [id]);
}

export async function persistTechnicianToMySql(t: any): Promise<void> {
  await executeQuery(
    `INSERT INTO technicians 
      (id, name, role, photo_url, phone, rating, completed_jobs_count, skills, years_experience, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
      name = VALUES(name), role = VALUES(role), photo_url = VALUES(photo_url),
      phone = VALUES(phone), rating = VALUES(rating),
      completed_jobs_count = VALUES(completed_jobs_count), skills = VALUES(skills),
      years_experience = VALUES(years_experience), active = VALUES(active)`,
    [
      t.id,
      t.name,
      t.role || t.title || 'Master HVAC Technician',
      t.photo || t.photoUrl || t.avatar_url || null,
      t.phone || null,
      t.rating || 5.0,
      t.completedJobsCount || 0,
      JSON.stringify(t.skills || t.specialties || []),
      t.yearsExperience || t.experience_years || 5,
      t.active !== false ? 1 : 0,
    ]
  );
}

export async function persistPromotionToMySql(p: any): Promise<void> {
  await executeQuery(
    `INSERT INTO promotions 
      (id, title, description, code, discount_amount, discount_type, expires_at, minimum_spend, disclaimer, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
      title = VALUES(title), description = VALUES(description), discount_amount = VALUES(discount_amount),
      discount_type = VALUES(discount_type), expires_at = VALUES(expires_at), minimum_spend = VALUES(minimum_spend),
      disclaimer = VALUES(disclaimer), active = VALUES(active)`,
    [
      p.id,
      p.title,
      p.description,
      p.code,
      p.discountAmount,
      p.discountType || 'fixed',
      p.expiresAt || p.expirationDate || null,
      p.minimumSpend || 0,
      p.disclaimer || null,
      p.active !== false ? 1 : 0,
    ]
  );
}

export async function persistArticleToMySql(art: any): Promise<void> {
  await executeQuery(
    `INSERT INTO articles 
      (id, title, slug, excerpt, content, author, category, published_at, read_time_minutes, image_url, tags, is_featured)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
      title = VALUES(title), slug = VALUES(slug), excerpt = VALUES(excerpt), content = VALUES(content),
      author = VALUES(author), category = VALUES(category), published_at = VALUES(published_at),
      read_time_minutes = VALUES(read_time_minutes), image_url = VALUES(image_url), tags = VALUES(tags),
      is_featured = VALUES(is_featured)`,
    [
      art.id,
      art.title,
      art.slug,
      art.excerpt,
      art.content,
      art.author,
      art.category,
      art.publishDate || art.publishedAt || new Date().toISOString().split('T')[0],
      parseInt(String(art.readTime || art.readTimeMinutes || '5'), 10) || 5,
      art.coverImage || art.imageUrl || null,
      JSON.stringify(art.tags || []),
      art.isFeatured ? 1 : 0,
    ]
  );
}

export async function persistProjectToMySql(pj: any): Promise<void> {
  await executeQuery(
    `INSERT INTO projects 
      (id, title, category, city, completion_date, equipment_installed, before_image, after_image, problem, solution, outcome, customer_quote, customer_name, is_featured)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
      title = VALUES(title), category = VALUES(category), city = VALUES(city), completion_date = VALUES(completion_date),
      equipment_installed = VALUES(equipment_installed), before_image = VALUES(before_image), after_image = VALUES(after_image),
      problem = VALUES(problem), solution = VALUES(solution), outcome = VALUES(outcome),
      customer_quote = VALUES(customer_quote), customer_name = VALUES(customer_name), is_featured = VALUES(is_featured)`,
    [
      pj.id,
      pj.title,
      pj.category,
      pj.city,
      pj.date || pj.completionDate || new Date().toISOString().split('T')[0],
      pj.equipmentInstalled,
      pj.beforeImage || null,
      pj.afterImage || null,
      pj.problem,
      pj.solution,
      pj.outcome,
      pj.customerQuote || null,
      pj.customerName || null,
      pj.isFeatured ? 1 : 0,
    ]
  );
}

export async function persistMembershipPlanToMySql(plan: any): Promise<void> {
  await executeQuery(
    `INSERT INTO membership_plans 
      (id, name, tier, visits_per_year, price_monthly, price_annual, discount_percent, diagnostic_fee_waived, emergency_priority, filter_replacements_included, warranty_extension_years, benefits, is_popular, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
      name = VALUES(name), tier = VALUES(tier), visits_per_year = VALUES(visits_per_year),
      price_monthly = VALUES(price_monthly), price_annual = VALUES(price_annual),
      discount_percent = VALUES(discount_percent), diagnostic_fee_waived = VALUES(diagnostic_fee_waived),
      emergency_priority = VALUES(emergency_priority), filter_replacements_included = VALUES(filter_replacements_included),
      warranty_extension_years = VALUES(warranty_extension_years), benefits = VALUES(benefits),
      is_popular = VALUES(is_popular), active = VALUES(active)`,
    [
      plan.id,
      plan.name,
      plan.tier || 'silver',
      plan.visitsPerYear || 2,
      plan.priceMonthly ?? plan.monthlyPrice ?? plan.price ?? 0,
      plan.priceAnnual ?? plan.annualPrice ?? 0,
      plan.discountPercent ?? plan.discountPercentage ?? 10,
      plan.diagnosticFeeWaived ? 1 : 0,
      plan.emergencyPriority ? 1 : 0,
      plan.filterReplacementsIncluded ?? 2,
      plan.warrantyExtensionYears ?? 1,
      JSON.stringify(plan.benefits || plan.features || plan.perks || []),
      plan.isPopular ? 1 : 0,
      plan.active !== false ? 1 : 0,
    ]
  );
}

export async function persistSubscriptionToMySql(sub: any): Promise<void> {
  await executeQuery(
    `INSERT INTO membership_subscriptions 
      (id, subscription_number, customer_name, customer_email, customer_phone, address, plan_id, plan_name, status, billing_cycle, next_service_due, renewal_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
      status = VALUES(status), next_service_due = VALUES(next_service_due), renewal_date = VALUES(renewal_date)`,
    [
      sub.id,
      sub.subscriptionNumber,
      sub.customerName,
      sub.customerEmail,
      sub.customerPhone,
      sub.address,
      sub.planId,
      sub.planName,
      sub.status,
      sub.billingCycle,
      sub.nextServiceDue,
      sub.renewalDate,
    ]
  );
}

export async function persistFormDefinitionToMySql(form: any): Promise<void> {
  await executeQuery(
    `INSERT INTO forms (id, name, slug, description, fields, notification_email, submit_button_text, success_message, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
      name = VALUES(name), slug = VALUES(slug), description = VALUES(description),
      fields = VALUES(fields), notification_email = VALUES(notification_email),
      submit_button_text = VALUES(submit_button_text), success_message = VALUES(success_message), active = VALUES(active)`,
    [
      form.id,
      form.name,
      form.slug,
      form.description || null,
      JSON.stringify(form.fields || []),
      form.notificationEmail || null,
      form.submitButtonText || 'Submit',
      form.successMessage || 'Form submitted successfully.',
      form.active ?? form.enabled ?? 1,
    ]
  );
}

export async function persistPageDefinitionToMySql(page: any): Promise<void> {
  await executeQuery(
    `INSERT INTO pages (id, title, slug, meta_description, published, blocks)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
      title = VALUES(title), slug = VALUES(slug), meta_description = VALUES(meta_description),
      published = VALUES(published), blocks = VALUES(blocks)`,
    [
      page.id,
      page.title,
      page.slug,
      page.metaDescription || null,
      page.published ?? page.isPublished ?? 1,
      JSON.stringify(page.blocks || []),
    ]
  );
}

export async function persistHomepageSectionsToMySql(sections: any[]): Promise<void> {
  for (const sec of sections) {
    const configPayload = {
      ...(sec.config || sec.config_json || {}),
      type: sec.type,
      heading: sec.heading,
      subheading: sec.subheading,
    };
    await executeQuery(
      `INSERT INTO homepage_sections (id, name, enabled, order_index, config_json)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), enabled = VALUES(enabled), order_index = VALUES(order_index), config_json = VALUES(config_json)`,
      [
        sec.id,
        sec.name,
        sec.enabled ? 1 : 0,
        sec.order,
        JSON.stringify(configPayload),
      ]
    );
  }
}

export async function persistNavigationToMySql(nav: any): Promise<void> {
  const items = (nav as any).menuItems || (nav as any).mainNav || [];
  let order = 0;
  for (const item of items) {
    await executeQuery(
      `INSERT INTO navigation_items (id, label, path, order_index, is_external, is_cta, parent_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE label = VALUES(label), path = VALUES(path), order_index = VALUES(order_index)`,
      [
        item.id || `nav-${order + 1}`,
        item.label,
        item.path,
        item.order !== undefined ? item.order : order++,
        item.isExternal ? 1 : 0,
        item.isCta ? 1 : 0,
        null,
      ]
    );
  }
}

let sitePagesTableReady = false;
export async function ensureSitePagesTable(): Promise<void> {
  if (sitePagesTableReady) return;
  try {
    await executeQuery(
      `CREATE TABLE IF NOT EXISTS site_pages (
        id VARCHAR(100) PRIMARY KEY,
        slug VARCHAR(255) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        meta_description TEXT NULL,
        nav_label VARCHAR(100) NULL,
        sections JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_site_pages_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
      [],
      { silentErrors: true }
    );
    sitePagesTableReady = true;
  } catch {
    // Graceful fallback if caller lacks DDL permissions
  }
}

export async function persistSitePageToMySql(page: SitePage): Promise<void> {
  await ensureSitePagesTable();
  await executeQuery(
    `INSERT INTO site_pages (id, slug, title, meta_description, nav_label, sections)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       slug = VALUES(slug),
       title = VALUES(title),
       meta_description = VALUES(meta_description),
       nav_label = VALUES(nav_label),
       sections = VALUES(sections),
       updated_at = NOW()`,
    [
      page.id,
      page.slug,
      page.title,
      page.metaDescription || null,
      page.navLabel || null,
      JSON.stringify(page.sections),
    ],
    { silentErrors: ['ER_NO_SUCH_TABLE'] }
  );
}

// ========================================================
// AUTH, USERS, SESSIONS & PASSWORD RESET PERSISTENCE
// ========================================================

let authTablesReady = false;
export async function ensureAuthTables(): Promise<void> {
  if (authTablesReady) return;
  try {
    const [cols] = await executeQuery<RowDataPacket[]>('SHOW COLUMNS FROM users', [], { silentErrors: true });
    if (Array.isArray(cols)) {
      const colNames = new Set(cols.map((c) => String(c.Field).toLowerCase()));
      if (!colNames.has('username')) {
        await executeQuery('ALTER TABLE users ADD COLUMN username VARCHAR(100) NULL UNIQUE AFTER id', [], { silentErrors: true });
      }
      if (!colNames.has('permissions')) {
        await executeQuery('ALTER TABLE users ADD COLUMN permissions JSON NULL AFTER role', [], { silentErrors: true });
      }
      if (!colNames.has('must_change_password')) {
        await executeQuery('ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0 AFTER active', [], { silentErrors: true });
      }
      if (!colNames.has('technician_id')) {
        await executeQuery('ALTER TABLE users ADD COLUMN technician_id VARCHAR(100) NULL AFTER permissions', [], { silentErrors: true });
      }
    }

    await executeQuery(
      `CREATE TABLE IF NOT EXISTS auth_sessions (
        token_hash VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        expires_at DATETIME NOT NULL,
        user_agent VARCHAR(255) NULL,
        ip_address VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_auth_sessions_user (user_id),
        INDEX idx_auth_sessions_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
      [],
      { silentErrors: true }
    );

    await executeQuery(
      `CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        token_hash VARCHAR(128) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        used_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pwd_reset_user (user_id),
        INDEX idx_pwd_reset_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
      [],
      { silentErrors: true }
    );

    authTablesReady = true;
  } catch {
    // Graceful fallback if offline/missing DDL rights
  }
}

export async function persistUserToMySql(user: AdminUser): Promise<void> {
  await ensureAuthTables();
  await executeQuery(
    `INSERT INTO users
      (id, username, email, password_hash, role, permissions, technician_id, name, phone, active, must_change_password, last_login)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      username = VALUES(username),
      email = VALUES(email),
      password_hash = COALESCE(VALUES(password_hash), password_hash),
      role = VALUES(role),
      permissions = VALUES(permissions),
      technician_id = VALUES(technician_id),
      name = VALUES(name),
      phone = VALUES(phone),
      active = VALUES(active),
      must_change_password = VALUES(must_change_password),
      last_login = VALUES(last_login),
      updated_at = NOW()`,
    [
      user.id,
      user.username ? user.username.trim().toLowerCase() : null,
      user.email.trim().toLowerCase(),
      user.passwordHash || null,
      user.role,
      user.permissions ? JSON.stringify(user.permissions) : null,
      user.technicianId || null,
      user.name,
      user.phone || null,
      user.status === 'suspended' ? 0 : 1,
      user.mustChangePassword ? 1 : 0,
      user.lastLogin || null,
    ],
    { silentErrors: true }
  );
}

export async function deleteUserFromMySql(userId: string): Promise<void> {
  await ensureAuthTables();
  await executeQuery('DELETE FROM auth_sessions WHERE user_id = ?', [userId], { silentErrors: true });
  await executeQuery('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId], { silentErrors: true });
  await executeQuery('DELETE FROM users WHERE id = ?', [userId], { silentErrors: true });
}

export interface PersistedSession {
  tokenHash: string;
  userId: string;
  expiresAt: string;
  userAgent?: string;
  ipAddress?: string;
}

export async function persistSessionToMySql(session: PersistedSession): Promise<void> {
  await ensureAuthTables();
  await executeQuery(
    `INSERT INTO auth_sessions (token_hash, user_id, expires_at, user_agent, ip_address)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       user_id = VALUES(user_id),
       expires_at = VALUES(expires_at)`,
    [
      session.tokenHash,
      session.userId,
      toMySqlTimestamp(session.expiresAt),
      session.userAgent || null,
      session.ipAddress || null,
    ],
    { silentErrors: true }
  );
}

export async function getSessionByTokenHashFromMySql(tokenHash: string): Promise<PersistedSession | null> {
  await ensureAuthTables();
  const [rows] = await executeQuery<RowDataPacket[]>(
    'SELECT token_hash, user_id, expires_at, user_agent, ip_address FROM auth_sessions WHERE token_hash = ? LIMIT 1',
    [tokenHash],
    { silentErrors: true }
  );
  if (!rows || rows.length === 0) return null;
  const r = rows[0];
  return {
    tokenHash: r.token_hash,
    userId: r.user_id,
    expiresAt: new Date(r.expires_at).toISOString(),
    userAgent: r.user_agent || undefined,
    ipAddress: r.ip_address || undefined,
  };
}

export async function deleteSessionByTokenHashFromMySql(tokenHash: string): Promise<void> {
  await ensureAuthTables();
  await executeQuery('DELETE FROM auth_sessions WHERE token_hash = ?', [tokenHash], { silentErrors: true });
}

export async function deleteUserSessionsFromMySql(userId: string): Promise<void> {
  await ensureAuthTables();
  await executeQuery('DELETE FROM auth_sessions WHERE user_id = ?', [userId], { silentErrors: true });
}

export interface PersistedResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt?: string | null;
}

export async function persistResetTokenToMySql(record: PersistedResetToken): Promise<void> {
  await ensureAuthTables();
  await executeQuery(
    `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, used_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      record.id,
      record.userId,
      record.tokenHash,
      toMySqlTimestamp(record.expiresAt),
      record.usedAt ? toMySqlTimestamp(record.usedAt) : null,
    ],
    { silentErrors: true }
  );
}

export async function getResetTokenByHashFromMySql(tokenHash: string): Promise<PersistedResetToken | null> {
  await ensureAuthTables();
  const [rows] = await executeQuery<RowDataPacket[]>(
    'SELECT id, user_id, token_hash, expires_at, used_at FROM password_reset_tokens WHERE token_hash = ? LIMIT 1',
    [tokenHash],
    { silentErrors: true }
  );
  if (!rows || rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    userId: r.user_id,
    tokenHash: r.token_hash,
    expiresAt: new Date(r.expires_at).toISOString(),
    usedAt: r.used_at ? new Date(r.used_at).toISOString() : null,
  };
}

export async function markResetTokenUsedInMySql(id: string): Promise<void> {
  await ensureAuthTables();
  await executeQuery(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?',
    [id],
    { silentErrors: true }
  );
}

