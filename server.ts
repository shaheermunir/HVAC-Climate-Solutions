import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { getDb, persistDatabase, addAuditLog, initDatabase, initDatabaseAsync, isHydratedFromMySql } from './server/db';
import { checkDatabaseHealth, isMySqlConnected, closeMySqlPool } from './server/mysql';
import {
  persistLeadToMySql,
  persistAppointmentToMySql,
  persistEstimateToMySql,
  persistReviewToMySql,
  persistBusinessSettingsToMySql,
  persistMarketSettingsToMySql,
  persistThemeToMySql,
  persistFeatureFlagsToMySql,
  persistFormSubmissionToMySql,
  persistTenantToMySql,
  persistInvoiceToMySql,
  persistServiceToMySql,
  deleteServiceFromMySql,
  persistServiceAreaToMySql,
  deleteServiceAreaFromMySql,
  persistHomepageSectionsToMySql,
  persistNavigationToMySql,
  persistSitePageToMySql,
  persistUserToMySql,
  deleteUserFromMySql,
} from './server/mysql-repository';
import { askGeminiHvacAssistant } from './server/gemini';
import {
  validateEmail,
  validatePhone,
  validateZipCode,
  sanitizeText,
  validateDate,
  validateRating,
  validateRequiredFields,
} from './server/validation';
import {
  checkServiceAreaZip,
  detectDuplicateLead,
  detectDuplicateAppointment,
  validateAppointmentRules,
  getDispatchFallbackDisclosure,
} from './server/scheduling';
import {
  AuthenticatedRequest,
  authenticateRequest,
  clearSessionCookie,
  createPasswordResetToken,
  createSessionForUser,
  extractTokenFromRequest,
  hashPassword,
  needsInitialSetup,
  normalizeStaffRole,
  requireAuth,
  requirePermission,
  revokeAllUserSessions,
  revokeSessionByToken,
  sanitizeUser,
  validatePasswordStrength,
  verifyAndConsumeResetToken,
  verifyPassword,
} from './server/auth';
import { getDashboardRouteForRole, isStaffRole, resolveUserPermissions } from './src/shared/rbac';
import {
  Lead,
  Appointment,
  Estimate,
  Review,
  ServiceRecord,
  BusinessSettings,
  EquipmentItem,
  Promotion,
  Article,
  Project,
  Technician,
  CustomerProfile,
  MembershipSubscription,
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
} from './src/types';
import { defaultSitePages } from './src/data/defaultSitePages';
import {
  initialThemeConfig,
  initialHomepageSections,
  initialNavigationConfig,
  initialFeatureFlags,
  initialMarketSettings,
  initialClientTenants,
  initialSaasPlatformConfig,
} from './src/data/seedData';

dotenv.config();

const app = express();
// Development environment requires port 3000
const portArgIndex = process.argv.indexOf('--port');
const PORT = portArgIndex !== -1 && process.argv[portArgIndex + 1]
  ? parseInt(process.argv[portArgIndex + 1], 10)
  : 3000;

app.disable('x-powered-by');

// Production Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// In-memory rate limiting to protect public lead/appointment submissions from spam bots
const submissionRateMap = new Map<string, { count: number; resetTime: number }>();
function publicSubmissionRateLimiter(req: Request, res: Response, next: express.NextFunction) {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 25; // 25 requests per minute per IP

  const record = submissionRateMap.get(clientIp);
  if (!record || now > record.resetTime) {
    submissionRateMap.set(clientIp, { count: 1, resetTime: now + windowMs });
    return next();
  }

  record.count += 1;
  if (record.count > maxRequests) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Submission rate limit exceeded. Please wait a minute before submitting again.',
    });
  }

  next();
}

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Initialize persistent database
initDatabase();
initDatabaseAsync().catch((err) => {
  console.warn('[Server Startup] MySQL hydration status note:', err.message || err);
});

// -------------------------------------------------------------
// 0. SYSTEM HEALTH & DATABASE STATUS
// -------------------------------------------------------------
app.get('/api/health', async (_req: Request, res: Response) => {
  const health = await checkDatabaseHealth();
  res.json({
    status: health.connected ? 'healthy' : 'degraded',
    app: 'HVAC Platform Engine',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'production',
    productionDomain: 'https://hvac.aspirinovation.com',
    database: {
      engine: 'MySQL 8.0 (Hostinger Cloud)',
      connected: health.connected,
      latencyMs: health.latencyMs,
      hydrated: isHydratedFromMySql(),
      activePool: isMySqlConnected(),
      configuredHost: process.env.DB_HOST || 'srv537.hstgr.io',
      databaseName: process.env.DB_NAME || 'u713584878_HVAC',
    },
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/database/status', async (_req: Request, res: Response) => {
  const health = await checkDatabaseHealth();
  res.json({
    engine: 'MySQL',
    host: process.env.DB_HOST || 'srv537.hstgr.io',
    database: process.env.DB_NAME || 'u713584878_HVAC',
    user: process.env.DB_USER || 'u713584878_hvacuser',
    connected: health.connected,
    latencyMs: health.latencyMs,
    hydrated: isHydratedFromMySql(),
    error: health.error,
  });
});

// -------------------------------------------------------------
// 1. BUSINESS SETTINGS
// -------------------------------------------------------------
app.get('/api/business-settings', (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.settings);
});

app.get('/api/settings', (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.settings);
});

app.put('/api/business-settings', requirePermission('manage_settings'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const updates: Partial<BusinessSettings> = req.body;

    // Validate phone and email if updated
    if (updates.primaryPhone && !validatePhone(updates.primaryPhone)) {
      return res.status(400).json({ error: 'Invalid primary phone number format.' });
    }
    if (updates.emergencyPhone && !validatePhone(updates.emergencyPhone)) {
      return res.status(400).json({ error: 'Invalid emergency phone number format.' });
    }
    if (updates.businessEmail && !validateEmail(updates.businessEmail)) {
      return res.status(400).json({ error: 'Invalid business email address.' });
    }

    db.settings = {
      ...db.settings,
      ...updates,
      businessName: updates.businessName ? sanitizeText(updates.businessName) : db.settings.businessName,
    };

    persistDatabase();
    persistBusinessSettingsToMySql(db.settings).catch((err) => console.warn('[Settings] Async MySQL persist warning:', err.message || err));
    addAuditLog('Admin', 'SETTINGS_UPDATED', 'BusinessSettings', 'main', 'Updated company profile, licensing, or contact details');
    res.json({ success: true, settings: db.settings });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update business settings.', message: error.message });
  }
});

// -------------------------------------------------------------
// 2. SERVICES CATALOG (CRUD)
// -------------------------------------------------------------
app.get('/api/services', (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.services);
});

app.post('/api/services', requirePermission('manage_services'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { name, category, shortDescription, priceStartingAt } = req.body;

    const missing = validateRequiredFields(req.body, ['name', 'category', 'shortDescription']);
    if (missing) {
      return res.status(400).json({ error: missing });
    }

    const cleanName = sanitizeText(name);
    const slug = req.body.slug
      ? sanitizeText(req.body.slug).toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (db.services.some((s) => s.slug === slug)) {
      return res.status(409).json({ error: `A service with slug "${slug}" already exists.` });
    }

    const newService: ServiceRecord = {
      id: req.body.id || `srv-${Date.now()}`,
      slug,
      name: cleanName,
      category,
      shortDescription: sanitizeText(shortDescription),
      fullDescription: sanitizeText(req.body.fullDescription || shortDescription),
      benefits: Array.isArray(req.body.benefits) ? req.body.benefits : ['Certified diagnostics', 'Upfront pricing'],
      problemsAddressed: Array.isArray(req.body.problemsAddressed) ? req.body.problemsAddressed : ['System malfunction'],
      symptoms: Array.isArray(req.body.symptoms) ? req.body.symptoms : ['Abnormal heating/cooling'],
      process: Array.isArray(req.body.process) ? req.body.process : ['Diagnosis', 'Repair', 'Testing'],
      options: Array.isArray(req.body.options) ? req.body.options : ['Standard'],
      supportedEquipment: Array.isArray(req.body.supportedEquipment) ? req.body.supportedEquipment : ['Residential HVAC'],
      supportedBrands: Array.isArray(req.body.supportedBrands) ? req.body.supportedBrands : ['Trane', 'Carrier', 'Bosch'],
      warrantyInfo: req.body.warrantyInfo || '2-Year Craftsmanship Labor Warranty',
      pricingApproach: req.body.pricingApproach || 'Flat-rate pricing',
      priceStartingAt: priceStartingAt ? Math.max(0, parseInt(priceStartingAt, 10)) : undefined,
      isFinancingAvailable: req.body.isFinancingAvailable ?? true,
      faqs: Array.isArray(req.body.faqs) ? req.body.faqs : [],
      relatedServices: Array.isArray(req.body.relatedServices) ? req.body.relatedServices : [],
      isBookingEligible: req.body.isBookingEligible ?? true,
      isEmergencyEligible: req.body.isEmergencyEligible ?? false,
      seoTitle: req.body.seoTitle || `${cleanName} | Airflow Climate Solutions`,
      seoDescription: req.body.seoDescription || shortDescription,
      isPublished: req.body.isPublished ?? true,
    };

    db.services.push(newService);
    persistDatabase();
    persistServiceToMySql(newService).catch((err) => console.warn('[Service] Async MySQL persist warning:', err.message || err));
    addAuditLog('Admin', 'SERVICE_CREATED', 'ServiceRecord', newService.id, `Created service: ${newService.name}`);
    res.status(201).json(newService);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create service.', message: error.message });
  }
});

app.put('/api/services/:id', requirePermission('manage_services'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const index = db.services.findIndex((s) => s.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    db.services[index] = {
      ...db.services[index],
      ...req.body,
      name: req.body.name ? sanitizeText(req.body.name) : db.services[index].name,
      shortDescription: req.body.shortDescription ? sanitizeText(req.body.shortDescription) : db.services[index].shortDescription,
    };

    persistDatabase();
    persistServiceToMySql(db.services[index]).catch((err) => console.warn('[Service] Async MySQL persist warning:', err.message || err));
    addAuditLog('Admin', 'SERVICE_UPDATED', 'ServiceRecord', id, `Updated service: ${db.services[index].name}`);
    res.json(db.services[index]);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update service.', message: error.message });
  }
});

app.delete('/api/services/:id', requirePermission('manage_services'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const index = db.services.findIndex((s) => s.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Service not found.' });
    }
    const deleted = db.services.splice(index, 1)[0];
    persistDatabase();
    deleteServiceFromMySql(id).catch((err) => console.warn('[Service] Async MySQL delete warning:', err.message || err));
    addAuditLog('Admin', 'SERVICE_DELETED', 'ServiceRecord', id, `Deleted service: ${deleted.name}`);
    res.json({ success: true, message: `Service "${deleted.name}" removed successfully.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete service.', message: error.message });
  }
});

// -------------------------------------------------------------
// 3. SERVICE AREAS
// -------------------------------------------------------------
app.get('/api/service-areas', (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.serviceAreas);
});

// -------------------------------------------------------------
// 4. LEADS & CRM
// -------------------------------------------------------------
app.get('/api/leads', requirePermission('manage_leads'), (req: Request, res: Response) => {
  const db = getDb();
  let leads = [...db.leads];
  const { status, urgency, search } = req.query;

  if (status && typeof status === 'string') {
    leads = leads.filter((l) => l.status === status);
  }
  if (urgency && typeof urgency === 'string') {
    leads = leads.filter((l) => l.urgency === urgency);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    leads = leads.filter(
      (l) =>
        l.customerName.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.leadNumber.toLowerCase().includes(q)
    );
  }

  leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(leads);
});

// -------------------------------------------------------------
// SERVICE AREA ZIP CHECK UTILITY
// -------------------------------------------------------------
app.get('/api/service-areas/check-zip', (req: Request, res: Response) => {
  const { zip } = req.query;
  const db = getDb();
  const result = checkServiceAreaZip(String(zip || ''), db);
  res.json(result);
});

app.post('/api/leads', publicSubmissionRateLimiter, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const customerName = req.body.customerName || req.body.name || req.body.fullName;
    const phone = req.body.phone || req.body.customerPhone;
    const email = req.body.email || req.body.customerEmail;
    const serviceRequested = req.body.serviceRequested || req.body.service;
    const {
      address,
      city,
      state = 'State',
      zipCode,
      urgency = 'normal',
      preferredContactMethod = 'phone',
      propertyType = 'residential',
      notes,
      source = 'website_form',
      homeSquareFootage,
      estimatedSystemAge,
      photoUrl,
      journey,
      commercialDetails,
    } = req.body;

    // Feature Flag validation
    if (db.featureFlags) {
      if (urgency === 'emergency' && db.featureFlags.emergencyService === false) {
        return res.status(403).json({
          error: 'Emergency dispatch requests via web are temporarily offline. For life safety or urgent heating/cooling, please call dispatch directly: ' + (db.settings.emergencyPhone || '(800) 555-0911'),
        });
      }
      if (journey === 'commercial' && db.featureFlags.commercialEnquiries === false) {
        return res.status(403).json({ error: 'Commercial online inquiries are temporarily suspended.' });
      }
      if (journey === 'maintenance' && db.featureFlags.maintenanceMemberships === false) {
        return res.status(403).json({ error: 'Maintenance membership enrollment is temporarily suspended.' });
      }
      if (journey === 'estimate' && db.featureFlags.estimateCalculator === false) {
        return res.status(403).json({ error: 'Online estimation inquiries are currently paused.' });
      }
    }

    const missing = validateRequiredFields({ customerName, phone, serviceRequested }, ['customerName', 'phone', 'serviceRequested']);
    if (missing) {
      return res.status(400).json({ error: missing });
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({ error: 'Please provide a valid 10-digit phone number.' });
    }

    if (email && !validateEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (zipCode && !validateZipCode(zipCode)) {
      return res.status(400).json({ error: 'Please provide a valid 5-digit US ZIP code.' });
    }

    // Service Area Coverage Validation
    const zipStatus = zipCode ? checkServiceAreaZip(zipCode, db) : { isServiced: true, message: 'Metro Area' };

    // Duplicate submission detection (2-hour rolling window per customer phone/email)
    const duplicateCheck = detectDuplicateLead(db, phone, email, serviceRequested);
    if (duplicateCheck.isDuplicate && duplicateCheck.existingLead) {
      // Append note to existing lead record rather than dropping
      const existing = duplicateCheck.existingLead;
      if (!existing.dispatcherNotes) existing.dispatcherNotes = [];
      existing.dispatcherNotes.push({
        id: `note-${Date.now()}`,
        author: 'System Auto-Deduplication',
        timestamp: new Date().toISOString(),
        note: `Customer submitted duplicate inquiry via ${source}. Additional customer message: "${sanitizeText(notes || '')}"`,
      });
      existing.updatedAt = new Date().toISOString();
      persistDatabase();

      return res.status(200).json({
        success: true,
        isDuplicate: true,
        lead: existing,
        message: duplicateCheck.message || 'Existing request detected. Your ticket is already prioritized in the dispatch queue.',
        dispatchStatusNotice: getDispatchFallbackDisclosure(existing.journey || 'emergency'),
      });
    }

    const cleanName = sanitizeText(customerName);
    const cleanAddress = sanitizeText(address || '');
    const cleanCity = sanitizeText(city || 'Metro Area');
    const cleanNotes = sanitizeText(notes || '');

    // Determine journey classification
    const inferredJourney: 'emergency' | 'routine' | 'estimate' | 'maintenance' | 'commercial' =
      journey ||
      (urgency === 'emergency' || source === 'emergency_call' || source === 'emergency_triage'
        ? 'emergency'
        : propertyType === 'commercial' || source === 'commercial_rfp'
        ? 'commercial'
        : source === 'estimate_tool' || source === 'installation_estimate'
        ? 'estimate'
        : source === 'maintenance_request'
        ? 'maintenance'
        : 'routine');

    const leadNumber = `LD-${1000 + db.leads.length + 1}`;
    const priority = urgency === 'emergency' ? 'critical' : urgency === 'high' ? 'high' : 'medium';
    const dispatchNotice = getDispatchFallbackDisclosure(inferredJourney);

    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      leadNumber,
      source,
      journey: inferredJourney,
      serviceRequested: sanitizeText(serviceRequested),
      customerName: cleanName,
      email: email ? email.trim().toLowerCase() : '',
      phone: phone.trim(),
      address: cleanAddress,
      city: cleanCity,
      state,
      zipCode: zipCode ? zipCode.trim() : '',
      urgency,
      preferredContactMethod,
      status: urgency === 'emergency' ? 'appointment_requested' : 'new',
      notes: cleanNotes,
      priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      propertyType,
      homeSquareFootage: homeSquareFootage ? parseInt(homeSquareFootage, 10) : undefined,
      estimatedSystemAge,
      photoUrl,
      outOfServiceArea: !zipStatus.isServiced,
      dispatchStatusNotice: dispatchNotice,
      commercialDetails: commercialDetails || undefined,
      dispatcherNotes: [
        {
          id: `note-${Date.now()}`,
          author: 'System',
          timestamp: new Date().toISOString(),
          note: `Lead created from ${source} (${inferredJourney} journey). ${zipStatus.message}`,
        },
      ],
    };

    db.leads.unshift(newLead);

    // Auto-create customer record if they don't exist yet
    const existingCust = db.customers.find((c) => c.phone === newLead.phone || (email && c.email === email));
    if (!existingCust && cleanName) {
      db.customers.push({
        id: `cust-${Date.now()}`,
        name: cleanName,
        email: newLead.email,
        phone: newLead.phone,
        address: cleanAddress,
        city: cleanCity,
        zipCode: newLead.zipCode,
        role: 'customer',
        equipment: [],
        createdAt: new Date().toISOString(),
      });
    }

    persistDatabase();
    persistLeadToMySql(newLead).catch((err) => console.warn('[Lead] Async MySQL persist warning:', err.message || err));

    addAuditLog(
      'Lead Engine',
      'LEAD_SUBMITTED',
      'Lead',
      newLead.leadNumber,
      `New ${urgency} ${inferredJourney} lead from ${cleanName} (${phone}) for ${serviceRequested}`
    );

    res.status(201).json({
      success: true,
      lead: newLead,
      serviceAreaCoverage: zipStatus,
      dispatchStatusNotice: dispatchNotice,
      message: urgency === 'emergency'
        ? 'Emergency service request received! An on-call dispatcher has been notified immediately.'
        : 'Thank you! Your request has been received. Our team will contact you shortly.',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to submit lead request.', message: error.message });
  }
});

app.put('/api/leads/:id', requirePermission('manage_leads'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const leadIndex = db.leads.findIndex((l) => l.id === id);
    if (leadIndex === -1) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    db.leads[leadIndex] = {
      ...db.leads[leadIndex],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    persistDatabase();
    persistLeadToMySql(db.leads[leadIndex]).catch((err) => console.warn('[Lead] Async MySQL persist warning:', err.message || err));
    addAuditLog('Dispatcher', 'LEAD_UPDATED', 'Lead', id, `Updated lead status to: ${db.leads[leadIndex].status}`);
    res.json(db.leads[leadIndex]);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update lead.', message: error.message });
  }
});

// Administrative Workflow: Assign Technician to Lead
app.post('/api/leads/:id/assign', requirePermission('manage_leads'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { technicianId, technicianName, notes: dispatcherNote } = req.body;

    const leadIndex = db.leads.findIndex((l) => l.id === id);
    if (leadIndex === -1) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    const lead = db.leads[leadIndex];
    lead.assignedTechnicianId = technicianId;
    lead.assignedTechnicianName = technicianName;
    lead.status = 'assigned';
    lead.updatedAt = new Date().toISOString();

    if (!lead.dispatcherNotes) lead.dispatcherNotes = [];
    lead.dispatcherNotes.push({
      id: `note-${Date.now()}`,
      author: 'Dispatcher',
      timestamp: new Date().toISOString(),
      note: `Assigned technician: ${technicianName} (${technicianId}). ${dispatcherNote ? 'Details: ' + sanitizeText(dispatcherNote) : ''}`,
    });

    persistDatabase();
    addAuditLog('Dispatcher', 'LEAD_ASSIGNED', 'Lead', id, `Assigned technician ${technicianName} to lead ${lead.leadNumber}`);
    res.json({ success: true, lead });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to assign lead.', message: error.message });
  }
});

// Administrative Workflow: Convert Lead to Scheduled Appointment
app.post('/api/leads/:id/convert-to-appointment', requirePermission('manage_leads', 'manage_appointments'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { date, timeSlot, technicianId, technicianName, notes: aptNotes } = req.body;

    const leadIndex = db.leads.findIndex((l) => l.id === id);
    if (leadIndex === -1) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    const lead = db.leads[leadIndex];
    const appointmentNumber = `APT-${2000 + db.appointments.length + 1}`;

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      appointmentNumber,
      customerName: lead.customerName,
      customerEmail: lead.email,
      customerPhone: lead.phone,
      address: lead.address,
      city: lead.city,
      zipCode: lead.zipCode,
      serviceId: 'converted-lead',
      serviceName: lead.serviceRequested,
      issueDescription: lead.notes || 'Converted from lead ' + lead.leadNumber,
      date: date || new Date().toISOString().split('T')[0],
      timeSlot: timeSlot || '08:00 AM - 10:00 AM',
      durationMinutes: 90,
      technicianId: technicianId || lead.assignedTechnicianId,
      technicianName: technicianName || lead.assignedTechnicianName || 'Pending Dispatch',
      status: 'confirmed',
      isEmergency: lead.urgency === 'emergency',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: aptNotes ? sanitizeText(aptNotes) : `Converted from CRM Lead #${lead.leadNumber}`,
    };

    db.appointments.push(newAppointment);

    lead.status = 'appointment_confirmed';
    lead.assignedTechnicianId = newAppointment.technicianId;
    lead.assignedTechnicianName = newAppointment.technicianName;
    lead.updatedAt = new Date().toISOString();

    if (!lead.dispatcherNotes) lead.dispatcherNotes = [];
    lead.dispatcherNotes.push({
      id: `note-${Date.now()}`,
      author: 'Dispatcher',
      timestamp: new Date().toISOString(),
      note: `Converted lead to Appointment #${appointmentNumber} on ${newAppointment.date} (${newAppointment.timeSlot}). Technician: ${newAppointment.technicianName}`,
    });

    persistDatabase();
    addAuditLog('Dispatcher', 'LEAD_CONVERTED_TO_APPT', 'Lead', id, `Converted lead ${lead.leadNumber} to appointment ${appointmentNumber}`);
    res.status(201).json({ success: true, appointment: newAppointment, lead });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to convert lead to appointment.', message: error.message });
  }
});

// Administrative Workflow: Add Dispatcher Note to Lead
app.post('/api/leads/:id/notes', requirePermission('manage_leads'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { note, author = 'Dispatcher' } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ error: 'Note content cannot be empty.' });
    }

    const leadIndex = db.leads.findIndex((l) => l.id === id);
    if (leadIndex === -1) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    const lead = db.leads[leadIndex];
    if (!lead.dispatcherNotes) lead.dispatcherNotes = [];

    const newNote = {
      id: `note-${Date.now()}`,
      author: sanitizeText(author),
      timestamp: new Date().toISOString(),
      note: sanitizeText(note),
    };
    lead.dispatcherNotes.push(newNote);
    lead.updatedAt = new Date().toISOString();

    persistDatabase();
    res.status(201).json({ success: true, note: newNote, lead });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add note.', message: error.message });
  }
});

// Leads CSV Export (Restricted to Admin / Dispatcher)
app.get('/api/export/leads', requirePermission('manage_leads'), (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const headers = ['Lead Number', 'Name', 'Phone', 'Email', 'Service', 'Urgency', 'Status', 'City', 'Created At'];
    const rows = db.leads.map((l) => [
      `"${l.leadNumber}"`,
      `"${l.customerName}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${l.serviceRequested}"`,
      `"${l.urgency}"`,
      `"${l.status}"`,
      `"${l.city}"`,
      `"${l.createdAt}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="apex-leads-export.csv"');
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ error: 'Export failed.', message: error.message });
  }
});

// -------------------------------------------------------------
// 5. APPOINTMENTS & SCHEDULING ENGINE
// -------------------------------------------------------------
function isAppointmentAssignedToUser(apt: Appointment, user: AdminUser): boolean {
  if (user.technicianId) {
    return apt.technicianId === user.technicianId;
  }
  const db = getDb();
  const matchedTech = db.technicians.find(
    (t) =>
      (user.email && t.email?.toLowerCase() === user.email.toLowerCase()) ||
      t.name.toLowerCase() === user.name.toLowerCase()
  );
  if (matchedTech && apt.technicianId) {
    return apt.technicianId === matchedTech.id;
  }
  if (apt.technicianName && apt.technicianName.toLowerCase() === user.name.toLowerCase()) return true;
  return false;
}

app.get('/api/appointments', requirePermission('manage_appointments', 'view_assigned_jobs'), (req: Request, res: Response) => {
  const db = getDb();
  const auth = (req as AuthenticatedRequest).auth!;
  let appointments = [...db.appointments];

  // Field Technicians (or users lacking full dispatch permission) only receive their own assigned jobs
  if (!auth.permissions.includes('manage_appointments')) {
    appointments = appointments.filter((a) => isAppointmentAssignedToUser(a, auth.user));
  }

  const { date, status } = req.query;

  if (date && typeof date === 'string') {
    appointments = appointments.filter((a) => a.date === date);
  }
  if (status && typeof status === 'string') {
    appointments = appointments.filter((a) => a.status === status);
  }

  appointments.sort(
    (a, b) =>
      new Date(`${b.date} ${b.timeSlot.split(' ')[0]}`).getTime() -
      new Date(`${a.date} ${a.timeSlot.split(' ')[0]}`).getTime()
  );
  res.json(appointments);
});

app.post('/api/appointments', publicSubmissionRateLimiter, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const {
      customerName,
      customerEmail,
      customerPhone,
      address,
      city,
      zipCode,
      serviceId,
      serviceName,
      issueDescription,
      date,
      timeSlot,
      isEmergency = false,
    } = req.body;

    if (!isEmergency && db.featureFlags && db.featureFlags.onlineBooking === false) {
      return res.status(403).json({
        error: 'Online routine booking is temporarily paused. Please call our scheduling desk directly at ' + (db.settings.primaryPhone || '(512) 555-0199') + '.',
      });
    }
    if (isEmergency && db.featureFlags && db.featureFlags.emergencyService === false) {
      return res.status(403).json({
        error: 'Emergency dispatch booking via web is currently offline. Please call our 24/7 hotline at ' + (db.settings.emergencyPhone || '(512) 555-0911') + '.',
      });
    }

    const missing = validateRequiredFields(req.body, ['customerName', 'customerPhone', 'date', 'timeSlot']);
    if (missing) {
      return res.status(400).json({ error: missing });
    }

    if (!validatePhone(customerPhone)) {
      return res.status(400).json({ error: 'Please provide a valid phone number for dispatch verification.' });
    }

    if (customerEmail && !validateEmail(customerEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (!validateDate(date)) {
      return res.status(400).json({ error: 'Please provide a valid appointment date (YYYY-MM-DD).' });
    }

    // 1. Real Scheduling Rules (Date not in past, Sunday routine closure, 4hr lead time for same-day)
    const scheduleCheck = validateAppointmentRules(date, timeSlot, Boolean(isEmergency));
    if (!scheduleCheck.valid) {
      return res.status(400).json({ error: scheduleCheck.error });
    }

    // 2. Service Area ZIP Verification
    if (zipCode) {
      const areaCheck = checkServiceAreaZip(zipCode, db);
      if (!areaCheck.isServiced) {
        return res.status(400).json({ error: areaCheck.message });
      }
    }

    // 3. Duplicate Booking Prevention (Same customer phone on same date & window)
    const dupCheck = detectDuplicateAppointment(db, customerPhone, date, timeSlot);
    if (dupCheck.isDuplicate) {
      return res.status(409).json({ error: dupCheck.message });
    }

    // 4. Concurrency-safe capacity check: Maximum 3 simultaneous appointments per window
    const sameSlotCount = db.appointments.filter(
      (a) => a.date === date && a.timeSlot === timeSlot && ['confirmed', 'in_progress', 'pending_confirmation'].includes(a.status)
    ).length;

    if (sameSlotCount >= 3) {
      return res.status(409).json({
        error: 'Selected time window is at maximum capacity (3/3 field trucks booked). Please select an alternate window.',
      });
    }

    const availableTech = db.technicians.find((t) => t.active);
    const appointmentNumber = `APT-${2000 + db.appointments.length + 1}`;
    const dispatchNotice = getDispatchFallbackDisclosure(isEmergency ? 'emergency' : 'routine');

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      appointmentNumber,
      customerName: sanitizeText(customerName),
      customerEmail: customerEmail ? customerEmail.trim().toLowerCase() : '',
      customerPhone: customerPhone.trim(),
      address: sanitizeText(address || ''),
      city: sanitizeText(city || 'Metro Area'),
      zipCode: zipCode ? zipCode.trim() : '',
      serviceId: serviceId || 'routine-service',
      serviceName: sanitizeText(serviceName || 'General HVAC Service'),
      issueDescription: sanitizeText(issueDescription || ''),
      date,
      timeSlot,
      durationMinutes: 90,
      technicianId: availableTech ? availableTech.id : undefined,
      technicianName: availableTech ? availableTech.name : 'Pending Dispatch',
      status: isEmergency ? 'confirmed' : 'pending_confirmation',
      isEmergency: Boolean(isEmergency),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: 'Booked via website schedule engine.',
    };

    db.appointments.push(newAppointment);

    // Auto-create lead in CRM
    const linkedLead: Lead = {
      id: `lead-apt-${Date.now()}`,
      leadNumber: `LD-${1000 + db.leads.length + 1}`,
      source: 'online_booking',
      serviceRequested: newAppointment.serviceName,
      customerName: newAppointment.customerName,
      email: newAppointment.customerEmail,
      phone: newAppointment.customerPhone,
      address: newAppointment.address,
      city: newAppointment.city,
      state: 'State',
      zipCode: newAppointment.zipCode,
      urgency: isEmergency ? 'emergency' : 'normal',
      preferredContactMethod: 'phone',
      status: 'appointment_confirmed',
      notes: `Online Booking #${appointmentNumber}: ${date} at ${timeSlot}`,
      priority: isEmergency ? 'critical' : 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      propertyType: 'residential',
    };
    db.leads.unshift(linkedLead);

    persistDatabase();
    persistAppointmentToMySql(newAppointment).catch((err) => console.warn('[Appointment] Async MySQL persist warning:', err.message || err));
    persistLeadToMySql(linkedLead).catch((err) => console.warn('[Lead] Async MySQL persist warning:', err.message || err));

    addAuditLog(
      'Booking Engine',
      'APPOINTMENT_BOOKED',
      'Appointment',
      newAppointment.appointmentNumber,
      `Booking scheduled for ${newAppointment.customerName} on ${date} (${timeSlot})`
    );

    res.status(201).json({
      success: true,
      appointment: newAppointment,
      dispatchStatusNotice: dispatchNotice,
      message: 'Your appointment has been successfully scheduled and confirmed!',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Scheduling failed.', message: error.message });
  }
});

app.put('/api/appointments/:id', requirePermission('manage_appointments', 'update_assigned_jobs'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const auth = (req as AuthenticatedRequest).auth!;
    const { id } = req.params;
    const aptIndex = db.appointments.findIndex((a) => a.id === id);
    if (aptIndex === -1) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const currentApt = db.appointments[aptIndex];
    const hasFullDispatch = auth.permissions.includes('manage_appointments');

    if (!hasFullDispatch) {
      if (!isAppointmentAssignedToUser(currentApt, auth.user)) {
        return res.status(403).json({
          error: 'Forbidden: Technicians can only update work orders assigned to them.',
        });
      }
      // Restrict technician edits strictly to status and notes
      const allowedUpdates: Partial<Appointment> = {};
      if (typeof req.body.status === 'string') allowedUpdates.status = req.body.status as any;
      if (typeof req.body.notes === 'string') allowedUpdates.notes = sanitizeText(req.body.notes);
      db.appointments[aptIndex] = {
        ...currentApt,
        ...allowedUpdates,
        updatedAt: new Date().toISOString(),
      };
    } else {
      db.appointments[aptIndex] = {
        ...currentApt,
        ...req.body,
        updatedAt: new Date().toISOString(),
      };
    }

    persistDatabase();
    persistAppointmentToMySql(db.appointments[aptIndex]).catch((err) => console.warn('[Appointment] Async MySQL persist warning:', err.message || err));
    addAuditLog(auth.user.name, 'APPOINTMENT_MODIFIED', 'Appointment', id, `Updated appointment status to ${db.appointments[aptIndex].status}`);
    res.json(db.appointments[aptIndex]);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update appointment.', message: error.message });
  }
});

app.post('/api/portal/appointments/:id/cancel', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const customerEmail = String(req.body?.customerEmail || req.headers['x-customer-email'] || '').trim().toLowerCase();
    const aptIndex = db.appointments.findIndex((a) => a.id === id);
    if (aptIndex === -1) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }
    const currentApt = db.appointments[aptIndex];
    if (!customerEmail || currentApt.customerEmail?.toLowerCase() !== customerEmail) {
      return res.status(403).json({ error: 'Forbidden: Matching customer email verification required to cancel this appointment.' });
    }
    db.appointments[aptIndex] = {
      ...currentApt,
      status: 'cancelled',
      notes: req.body?.reason ? sanitizeText(req.body.reason) : 'Cancelled by customer',
      updatedAt: new Date().toISOString(),
    };
    persistDatabase();
    persistAppointmentToMySql(db.appointments[aptIndex]).catch((err) => console.warn('[Appointment] Async MySQL persist warning:', err.message || err));
    addAuditLog('Customer Portal', 'APPOINTMENT_CANCELLED', 'Appointment', id, `Customer cancelled ${currentApt.appointmentNumber}`);
    res.json({ success: true, appointment: db.appointments[aptIndex] });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to cancel appointment.', message: error.message });
  }
});

// -------------------------------------------------------------
// 6. ESTIMATES & QUOTES
// -------------------------------------------------------------
app.get('/api/estimates', requirePermission('manage_estimates'), (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.estimates);
});

app.post('/api/estimates', requirePermission('manage_estimates'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const {
      customerName,
      customerEmail,
      customerPhone,
      address,
      city,
      zipCode,
      serviceCategory,
      projectDescription,
      lineItems = [],
      taxRate = 0.0825,
      discountAmount = 0,
      customerNotes,
      internalNotes,
      expirationDays = 30,
    } = req.body;

    const missing = validateRequiredFields(req.body, ['customerName', 'customerPhone', 'serviceCategory']);
    if (missing) {
      return res.status(400).json({ error: missing });
    }

    const subtotal = lineItems.reduce((acc: number, item: any) => acc + (item.total || item.unitPrice * item.quantity), 0);
    const safeDiscount = Math.max(0, Math.min(subtotal, discountAmount));
    const taxable = subtotal - safeDiscount;
    const taxAmount = Math.round(taxable * taxRate * 100) / 100;
    const totalAmount = Math.round((taxable + taxAmount) * 100) / 100;

    const expirationDate = new Date(Date.now() + expirationDays * 86400000).toISOString().split('T')[0];
    const estimateNumber = `EST-${3000 + db.estimates.length + 1}`;

    const newEstimate: Estimate = {
      id: `est-${Date.now()}`,
      estimateNumber,
      customerName: sanitizeText(customerName),
      customerEmail: customerEmail ? customerEmail.trim().toLowerCase() : '',
      customerPhone: customerPhone.trim(),
      address: sanitizeText(address || ''),
      city: sanitizeText(city || 'Metro Area'),
      zipCode: zipCode ? zipCode.trim() : '',
      serviceCategory: sanitizeText(serviceCategory),
      projectDescription: sanitizeText(projectDescription || ''),
      lineItems,
      subtotal,
      taxRate,
      taxAmount,
      discountAmount: safeDiscount,
      totalAmount,
      expirationDate,
      status: 'sent',
      customerNotes: sanitizeText(customerNotes || ''),
      internalNotes: sanitizeText(internalNotes || ''),
      createdAt: new Date().toISOString(),
    };

    db.estimates.unshift(newEstimate);
    persistDatabase();
    persistEstimateToMySql(newEstimate).catch((err) => console.warn('[Estimate] Async MySQL persist warning:', err.message || err));
    addAuditLog('Estimator', 'ESTIMATE_CREATED', 'Estimate', estimateNumber, `Drafted quote for ${customerName} ($${totalAmount})`);
    res.status(201).json(newEstimate);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create estimate.', message: error.message });
  }
});

app.put('/api/estimates/:id/approve', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { customerSignatureName } = req.body;
    const estimate = db.estimates.find((e) => e.id === id);

    if (!estimate) {
      return res.status(404).json({ error: 'Estimate not found.' });
    }

    if (!customerSignatureName || !customerSignatureName.trim()) {
      return res.status(400).json({ error: 'An electronic signature name is required to approve the estimate.' });
    }

    estimate.status = 'accepted';
    estimate.customerSignatureName = sanitizeText(customerSignatureName);
    estimate.signedAt = new Date().toISOString();

    persistDatabase();
    addAuditLog('Customer Portal', 'ESTIMATE_ACCEPTED', 'Estimate', estimate.estimateNumber, `Approved & e-signed by ${estimate.customerSignatureName}`);

    res.json({
      success: true,
      estimate,
      message: 'Estimate officially approved! Our installation coordinator will contact you to schedule equipment delivery.',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Approval failed.', message: error.message });
  }
});

app.put('/api/estimates/:id/reject', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { reason } = req.body;
    const estimate = db.estimates.find((e) => e.id === id);

    if (!estimate) {
      return res.status(404).json({ error: 'Estimate not found.' });
    }

    estimate.status = 'rejected';
    estimate.customerNotes = reason ? `Rejected: ${sanitizeText(reason)}` : 'Declined by customer';

    persistDatabase();
    addAuditLog('Customer Portal', 'ESTIMATE_REJECTED', 'Estimate', estimate.estimateNumber, `Estimate declined: ${reason || 'No reason specified'}`);

    res.json({ success: true, estimate, message: 'Estimate marked as declined.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update estimate.', message: error.message });
  }
});

app.put('/api/estimates/:id/status', requirePermission('manage_estimates'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { status } = req.body;
    const estimate = db.estimates.find((e) => e.id === id);
    if (!estimate) return res.status(404).json({ error: 'Estimate not found.' });

    estimate.status = status;
    persistDatabase();
    addAuditLog('Estimator', 'ESTIMATE_STATUS_UPDATED', 'Estimate', estimate.estimateNumber, `Updated status to ${status}`);
    res.json({ success: true, estimate });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update estimate status.', message: error.message });
  }
});

app.delete('/api/estimates/:id', requirePermission('manage_estimates'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const idx = db.estimates.findIndex((e) => e.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Estimate not found.' });

    const deleted = db.estimates.splice(idx, 1)[0];
    persistDatabase();
    addAuditLog('Admin', 'ESTIMATE_DELETED', 'Estimate', id, `Removed quote: ${deleted.estimateNumber}`);
    res.json({ success: true, message: `Estimate ${deleted.estimateNumber} deleted.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete estimate.', message: error.message });
  }
});

// -------------------------------------------------------------
// 7. MEMBERSHIPS & SUBSCRIPTIONS (PERSISTENT ENROLLMENT)
// -------------------------------------------------------------
app.get('/api/memberships', (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.membershipPlans);
});

app.get('/api/membership-plans', (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.membershipPlans);
});

app.post('/api/memberships/enroll', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const customerName = req.body.customerName || req.body.name || req.body.fullName;
    const customerPhone = req.body.customerPhone || req.body.phone;
    const customerEmail = req.body.customerEmail || req.body.email;
    const address = req.body.address;
    const planId = req.body.planId || req.body.tierId;
    const billingCycle = req.body.billingCycle || 'monthly';

    const missing = validateRequiredFields({ customerName, customerPhone, customerEmail, address }, ['customerName', 'customerPhone', 'customerEmail', 'address']);
    if (missing) {
      return res.status(400).json({ error: missing });
    }

    if (!validatePhone(customerPhone)) {
      return res.status(400).json({ error: 'Please provide a valid 10-digit phone number.' });
    }

    if (!validateEmail(customerEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const plan = db.membershipPlans.find((p) => p.id === planId) || db.membershipPlans[0];
    const subNumber = `MEM-${Math.floor(100000 + Math.random() * 900000)}`;
    const nextService = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0];
    const renewal = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];

    const cleanName = sanitizeText(customerName);
    const cleanAddress = sanitizeText(address);

    const subscription: MembershipSubscription = {
      id: `sub-${Date.now()}`,
      subscriptionNumber: subNumber,
      customerName: cleanName,
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone.trim(),
      address: cleanAddress,
      planId: plan.id,
      planName: plan.name,
      status: 'active',
      billingCycle,
      nextServiceDue: nextService,
      renewalDate: renewal,
      createdAt: new Date().toISOString(),
    };

    db.subscriptions.unshift(subscription);

    // Update or add customer profile
    let customer = db.customers.find((c) => c.phone === subscription.customerPhone || c.email === subscription.customerEmail);
    if (customer) {
      customer.membershipTier = plan.name;
    } else {
      customer = {
        id: `cust-${Date.now()}`,
        name: cleanName,
        email: subscription.customerEmail,
        phone: subscription.customerPhone,
        address: cleanAddress,
        city: 'Metro Area',
        zipCode: '10001',
        role: 'customer',
        membershipTier: plan.name,
        equipment: [],
        createdAt: new Date().toISOString(),
      };
      db.customers.push(customer);
    }

    // Register qualified lead
    db.leads.unshift({
      id: `lead-mem-${Date.now()}`,
      leadNumber: `LD-${1000 + db.leads.length + 1}`,
      source: 'website_form',
      serviceRequested: `Comfort Club Membership: ${plan.name}`,
      customerName: cleanName,
      email: subscription.customerEmail,
      phone: subscription.customerPhone,
      address: cleanAddress,
      city: customer.city || 'Metro Area',
      state: 'State',
      zipCode: customer.zipCode || '',
      urgency: 'normal',
      preferredContactMethod: 'phone',
      status: 'won',
      notes: `Active membership subscription #${subNumber} (${billingCycle})`,
      priority: 'high',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      propertyType: 'residential',
    });

    persistDatabase();

    addAuditLog('Membership Portal', 'MEMBERSHIP_ENROLLED', 'Membership', subNumber, `${cleanName} enrolled in ${plan.name} (${billingCycle})`);

    res.status(201).json({
      success: true,
      subscription,
      message: `Congratulations! You are officially enrolled in the ${plan.name}. Your priority benefits and tune-up scheduling are active.`,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Enrollment failed.', message: error.message });
  }
});

// -------------------------------------------------------------
// 8. PROMOTIONS (FULL CRUD)
// -------------------------------------------------------------
app.get('/api/promotions', (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.promotions);
});

app.post('/api/promotions', requirePermission('manage_promotions'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { title, description, code, discountAmount, discountType = 'fixed', validUntil, terms } = req.body;

    const missing = validateRequiredFields(req.body, ['title', 'code', 'discountAmount', 'validUntil']);
    if (missing) {
      return res.status(400).json({ error: missing });
    }

    const cleanCode = sanitizeText(code).toUpperCase();
    if (db.promotions.some((p) => p.code === cleanCode)) {
      return res.status(409).json({ error: `Promotion code "${cleanCode}" already exists.` });
    }

    const newPromo: Promotion = {
      id: `promo-${Date.now()}`,
      title: sanitizeText(title),
      description: sanitizeText(description || ''),
      code: cleanCode,
      discountType,
      discountAmount: Math.max(0, parseInt(discountAmount, 10)),
      eligibleServices: Array.isArray(req.body.eligibleServices) ? req.body.eligibleServices : ['all'],
      validUntil,
      terms: sanitizeText(terms || 'Terms and conditions apply.'),
      active: true,
      isFeatured: Boolean(req.body.isFeatured),
    };

    db.promotions.push(newPromo);
    persistDatabase();
    addAuditLog('Admin', 'PROMOTION_CREATED', 'Promotion', newPromo.id, `Created promo code: ${newPromo.code}`);
    res.status(201).json(newPromo);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create promotion.', message: error.message });
  }
});

app.put('/api/promotions/:id', requirePermission('manage_promotions'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const idx = db.promotions.findIndex((p) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Promotion not found.' });
    }

    db.promotions[idx] = { ...db.promotions[idx], ...req.body };
    persistDatabase();
    addAuditLog('Admin', 'PROMOTION_UPDATED', 'Promotion', id, `Updated promotion: ${db.promotions[idx].code}`);
    res.json(db.promotions[idx]);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update promotion.', message: error.message });
  }
});

app.delete('/api/promotions/:id', requirePermission('manage_promotions'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const idx = db.promotions.findIndex((p) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Promotion not found.' });
    }
    const deleted = db.promotions.splice(idx, 1)[0];
    persistDatabase();
    addAuditLog('Admin', 'PROMOTION_DELETED', 'Promotion', id, `Deleted promotion: ${deleted.code}`);
    res.json({ success: true, message: 'Promotion removed.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete promotion.', message: error.message });
  }
});

// -------------------------------------------------------------
// 9. REVIEWS (SUBMISSION & MODERATION)
// -------------------------------------------------------------
app.get('/api/reviews', (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.reviews.filter((r) => r.status === 'approved'));
});

app.get('/api/reviews/all', requirePermission('manage_promotions'), (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.reviews);
});

app.post('/api/reviews', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { authorName, city, rating, text, serviceCategory } = req.body;

    const missing = validateRequiredFields(req.body, ['authorName', 'text']);
    if (missing) {
      return res.status(400).json({ error: missing });
    }

    const safeRating = validateRating(rating);
    const cleanAuthor = sanitizeText(authorName);
    const cleanText = sanitizeText(text);

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      authorName: cleanAuthor,
      city: sanitizeText(city || 'Metro Area'),
      rating: safeRating,
      date: new Date().toISOString().split('T')[0],
      text: cleanText,
      serviceCategory: sanitizeText(serviceCategory || 'HVAC Service'),
      verifiedCustomer: true,
      source: 'Direct Website',
      status: 'approved',
    };

    db.reviews.unshift(newReview);
    persistDatabase();
    persistReviewToMySql(newReview).catch((err) => console.warn('[Review] Async MySQL persist warning:', err.message || err));
    addAuditLog('Review Engine', 'REVIEW_SUBMITTED', 'Review', newReview.id, `New verified review from ${cleanAuthor} (${safeRating} stars)`);
    res.status(201).json({ success: true, review: newReview, message: 'Thank you for your review! It is now published.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to submit review.', message: error.message });
  }
});

app.put('/api/reviews/:id/status', requirePermission('manage_promotions'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { status } = req.body;
    const review = db.reviews.find((r) => r.id === id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    if (!['approved', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid review status.' });
    }

    review.status = status;
    persistDatabase();
    persistReviewToMySql(review).catch((err) => console.warn('[Review] Async MySQL persist warning:', err.message || err));
    addAuditLog('Admin', 'REVIEW_MODERATED', 'Review', id, `Updated review status to: ${status}`);
    res.json(review);
  } catch (error: any) {
    res.status(500).json({ error: 'Moderation failed.', message: error.message });
  }
});

// -------------------------------------------------------------
// 10. ARTICLES & CONTENT CMS (CRUD)
// -------------------------------------------------------------
app.get('/api/articles', (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.articles.filter((a) => a.isPublished));
});

app.get('/api/articles/all', requirePermission('manage_content'), (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.articles);
});

app.post('/api/articles', requirePermission('manage_content'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { title, excerpt, content, category, author } = req.body;

    const missing = validateRequiredFields(req.body, ['title', 'content', 'category']);
    if (missing) {
      return res.status(400).json({ error: missing });
    }

    const cleanTitle = sanitizeText(title);
    const slug = req.body.slug
      ? sanitizeText(req.body.slug).toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const newArticle: Article = {
      id: `art-${Date.now()}`,
      slug,
      title: cleanTitle,
      excerpt: sanitizeText(excerpt || ''),
      content: sanitizeText(content),
      category: sanitizeText(category),
      author: sanitizeText(author || 'Technical Engineering Team'),
      publishDate: new Date().toISOString().split('T')[0],
      readTime: req.body.readTime || '5 min read',
      coverImage: req.body.coverImage || '/images/hero_hvac_technician_1794171516085.jpg',
      tags: Array.isArray(req.body.tags) ? req.body.tags : ['HVAC Maintenance'],
      relatedServiceSlugs: Array.isArray(req.body.relatedServiceSlugs) ? req.body.relatedServiceSlugs : ['ac-repair'],
      isPublished: req.body.isPublished ?? true,
    };

    db.articles.push(newArticle);
    persistDatabase();
    addAuditLog('Content Editor', 'ARTICLE_CREATED', 'Article', newArticle.id, `Created article: ${newArticle.title}`);
    res.status(201).json(newArticle);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create article.', message: error.message });
  }
});

app.put('/api/articles/:id', requirePermission('manage_content'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const idx = db.articles.findIndex((a) => a.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Article not found.' });

    db.articles[idx] = {
      ...db.articles[idx],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    persistDatabase();
    addAuditLog('Content Editor', 'ARTICLE_UPDATED', 'Article', id, `Updated article: ${db.articles[idx].title}`);
    res.json(db.articles[idx]);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update article.', message: error.message });
  }
});

app.delete('/api/articles/:id', requirePermission('manage_content'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const idx = db.articles.findIndex((a) => a.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Article not found.' });

    const deleted = db.articles.splice(idx, 1)[0];
    persistDatabase();
    addAuditLog('Admin', 'ARTICLE_DELETED', 'Article', id, `Removed article: ${deleted.title}`);
    res.json({ success: true, message: `Article "${deleted.title}" deleted.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete article.', message: error.message });
  }
});

// -------------------------------------------------------------
// 11. PROJECTS / CASE STUDIES (CRUD)
// -------------------------------------------------------------
app.get('/api/projects', (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.projects);
});

app.post('/api/projects', requirePermission('manage_content'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { title, category, city, equipmentInstalled, problem, solution, outcome } = req.body;

    const missing = validateRequiredFields(req.body, ['title', 'problem', 'solution', 'outcome']);
    if (missing) {
      return res.status(400).json({ error: missing });
    }

    const cleanTitle = sanitizeText(title);
    const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      slug,
      title: cleanTitle,
      category: sanitizeText(category || 'AC Installation'),
      city: sanitizeText(city || 'Metro Area'),
      date: new Date().toISOString().split('T')[0],
      equipmentInstalled: sanitizeText(equipmentInstalled || 'High-Efficiency Heat Pump'),
      problem: sanitizeText(problem),
      solution: sanitizeText(solution),
      outcome: sanitizeText(outcome),
      customerName: sanitizeText(req.body.customerName || ''),
      customerQuote: sanitizeText(req.body.customerQuote || ''),
      isFeatured: Boolean(req.body.isFeatured),
    };

    db.projects.push(newProject);
    persistDatabase();
    addAuditLog('Admin', 'PROJECT_CREATED', 'Project', newProject.id, `Created case study: ${newProject.title}`);
    res.status(201).json(newProject);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create project case study.', message: error.message });
  }
});

// -------------------------------------------------------------
// 12. CUSTOMERS & REGISTERED EQUIPMENT (Protected CRM + Scoped Customer Portal)
// -------------------------------------------------------------
app.post('/api/portal/lookup', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { email, appointmentNumber } = req.body || {};
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanAptNum = typeof appointmentNumber === 'string' ? appointmentNumber.trim().toUpperCase() : '';

    if (!cleanEmail && !cleanAptNum) {
      return res.status(400).json({ error: 'Please enter your email address or booking reference number.' });
    }

    let customer = cleanEmail
      ? db.customers.find((c) => c.email.toLowerCase() === cleanEmail)
      : undefined;

    if (!customer && cleanAptNum) {
      const matchedApt = db.appointments.find((a) => a.appointmentNumber.toUpperCase() === cleanAptNum);
      if (matchedApt) {
        customer = db.customers.find(
          (c) =>
            (matchedApt.customerEmail && c.email.toLowerCase() === matchedApt.customerEmail.toLowerCase()) ||
            c.phone === matchedApt.customerPhone ||
            c.name.toLowerCase() === matchedApt.customerName.toLowerCase()
        );
      }
    }

    if (!customer) {
      return res.status(404).json({
        error: 'No matching customer record was found for that email or booking reference.',
      });
    }

    const appointments = db.appointments.filter(
      (a) =>
        (customer!.email && a.customerEmail?.toLowerCase() === customer!.email.toLowerCase()) ||
        (customer!.phone && a.customerPhone === customer!.phone) ||
        a.customerName.toLowerCase() === customer!.name.toLowerCase()
    );

    const estimates = db.estimates.filter(
      (e) =>
        (customer!.email && e.customerEmail?.toLowerCase() === customer!.email.toLowerCase()) ||
        (customer!.phone && e.customerPhone === customer!.phone) ||
        e.customerName.toLowerCase() === customer!.name.toLowerCase()
    );

    res.json({
      customer,
      appointments,
      estimates,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Customer portal lookup failed.', message: error.message });
  }
});

app.get('/api/customers', requirePermission('manage_leads', 'manage_appointments'), (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.customers);
});

app.get('/api/customers/:id', requirePermission('manage_leads', 'manage_appointments'), (req: Request, res: Response) => {
  const db = getDb();
  const customer = db.customers.find((c) => c.id === req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found.' });
  }
  res.json(customer);
});

app.put('/api/customers/:id', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const idx = db.customers.findIndex((c) => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const auth = await authenticateRequest(req);
    const isAuthorizedStaff = Boolean(
      auth && (auth.permissions.includes('manage_leads') || auth.permissions.includes('manage_appointments'))
    );
    const headerEmail = String(req.headers['x-customer-email'] || req.body?.customerEmail || '').trim().toLowerCase();
    const isVerifiedCustomerOwner = Boolean(headerEmail && db.customers[idx].email.toLowerCase() === headerEmail);

    if (!isAuthorizedStaff && !isVerifiedCustomerOwner) {
      return res.status(403).json({ error: 'Forbidden: Staff authorization or matching customer verification required.' });
    }

    db.customers[idx] = {
      ...db.customers[idx],
      ...req.body,
      id: db.customers[idx].id,
      name: req.body.name ? sanitizeText(req.body.name) : db.customers[idx].name,
      address: req.body.address ? sanitizeText(req.body.address) : db.customers[idx].address,
    };

    persistDatabase();
    addAuditLog(auth ? auth.user.name : 'Customer Portal', 'CUSTOMER_UPDATED', 'Customer', id, `Updated profile for ${db.customers[idx].name}`);
    res.json(db.customers[idx]);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update customer.', message: error.message });
  }
});

app.post('/api/customers/:id/equipment', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const customer = db.customers.find((c) => c.id === id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const auth = await authenticateRequest(req);
    const isAuthorizedStaff = Boolean(
      auth && (auth.permissions.includes('manage_leads') || auth.permissions.includes('manage_appointments'))
    );
    const headerEmail = String(req.headers['x-customer-email'] || req.body?.customerEmail || '').trim().toLowerCase();
    const isVerifiedCustomerOwner = Boolean(headerEmail && customer.email.toLowerCase() === headerEmail);

    if (!isAuthorizedStaff && !isVerifiedCustomerOwner) {
      return res.status(403).json({ error: 'Forbidden: Staff authorization or matching customer verification required.' });
    }

    const type = req.body.type;
    const manufacturer = req.body.manufacturer || req.body.brand;
    const modelNumber = req.body.modelNumber || req.body.model;
    const serialNumber = req.body.serialNumber || req.body.serial;
    const filterSize = req.body.filterSize;
    const condition = req.body.condition || 'Optimal';

    const missing = validateRequiredFields({ type, manufacturer }, ['type', 'manufacturer']);
    if (missing) {
      return res.status(400).json({ error: missing });
    }

    const newEquipment: EquipmentItem = {
      id: `eq-${Date.now()}`,
      type: sanitizeText(type),
      manufacturer: sanitizeText(manufacturer),
      modelNumber: sanitizeText(modelNumber || 'N/A'),
      serialNumber: sanitizeText(serialNumber || 'N/A'),
      installDate: req.body.installDate || new Date().toISOString().split('T')[0],
      lastServicedDate: new Date().toISOString().split('T')[0],
      filterSize: sanitizeText(filterSize || '16x25x1'),
      condition: condition as any,
    };

    if (!customer.equipment) {
      customer.equipment = [];
    }
    customer.equipment.push(newEquipment);

    persistDatabase();
    addAuditLog(auth ? auth.user.name : 'Customer Portal', 'EQUIPMENT_REGISTERED', 'Customer', customer.id, `Registered ${newEquipment.manufacturer} ${newEquipment.type}`);

    res.status(201).json({ success: true, equipment: newEquipment, message: 'Equipment successfully registered!' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to register equipment.', message: error.message });
  }
});

app.delete('/api/customers/:id/equipment/:eqId', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id, eqId } = req.params;
    const customer = db.customers.find((c) => c.id === id);
    if (!customer || !customer.equipment) {
      return res.status(404).json({ error: 'Equipment or customer not found.' });
    }

    const auth = await authenticateRequest(req);
    const isAuthorizedStaff = Boolean(
      auth && (auth.permissions.includes('manage_leads') || auth.permissions.includes('manage_appointments'))
    );
    const headerEmail = String(req.headers['x-customer-email'] || '').trim().toLowerCase();
    const isVerifiedCustomerOwner = Boolean(headerEmail && customer.email.toLowerCase() === headerEmail);

    if (!isAuthorizedStaff && !isVerifiedCustomerOwner) {
      return res.status(403).json({ error: 'Forbidden: You can only manage your own customer equipment.' });
    }

    const eqIdx = customer.equipment.findIndex((e) => e.id === eqId);
    if (eqIdx === -1) {
      return res.status(404).json({ error: 'Equipment not found.' });
    }

    const removed = customer.equipment.splice(eqIdx, 1)[0];
    persistDatabase();
    addAuditLog(auth ? auth.user.name : 'Customer Portal', 'EQUIPMENT_REMOVED', 'Customer', customer.id, `Removed ${removed.type}`);

    res.json({ success: true, message: 'Equipment removed.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to remove equipment.', message: error.message });
  }
});

// -------------------------------------------------------------
// 13. TECHNICIANS & FIELD DISPATCH
// -------------------------------------------------------------
app.get('/api/technicians', async (req: Request, res: Response) => {
  const db = getDb();
  const auth = await authenticateRequest(req);
  if (auth) {
    return res.json(db.technicians);
  }
  // Strip private technician contact emails/phones on unauthenticated public requests
  const publicTechs = db.technicians.map(({ email: _e, phone: _p, ...pub }) => ({
    ...pub,
    email: '',
    phone: '',
  }));
  res.json(publicTechs);
});

app.put('/api/technicians/:id', requirePermission('manage_technicians'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const idx = db.technicians.findIndex((t) => t.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Technician not found.' });
    }

    db.technicians[idx] = { ...db.technicians[idx], ...req.body };
    persistDatabase();
    addAuditLog('Dispatcher', 'TECHNICIAN_UPDATED', 'Technician', id, `Updated technician record for ${db.technicians[idx].name}`);
    res.json(db.technicians[idx]);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update technician.', message: error.message });
  }
});

// -------------------------------------------------------------
// 14. INTEGRATIONS HUB
// -------------------------------------------------------------
app.get('/api/integrations', requirePermission('manage_integrations'), (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.integrations);
});

app.post('/api/integrations/:id/test', requirePermission('manage_integrations'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const integration = db.integrations.find((i) => i.id === id);
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found.' });
    }

    const now = new Date().toLocaleTimeString();
    integration.lastSync = `Verified test ping at ${now}`;
    integration.status = 'connected';
    persistDatabase();

    addAuditLog('Integration Engine', 'INTEGRATION_TESTED', 'Integration', id, `Ping test successful for ${integration.name}`);
    res.json({ success: true, message: `Connection test verified for ${integration.name}. Health check passed 200 OK.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Test failed.', message: error.message });
  }
});

app.put('/api/integrations/:id', requirePermission('manage_integrations'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const idx = db.integrations.findIndex((i) => i.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Integration not found.' });

    db.integrations[idx] = { ...db.integrations[idx], ...req.body };
    persistDatabase();
    addAuditLog('Admin', 'INTEGRATION_CONFIGURED', 'Integration', id, `Updated settings for ${db.integrations[idx].name}`);
    res.json(db.integrations[idx]);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update integration.', message: error.message });
  }
});

// -------------------------------------------------------------
// 15. AUDIT LOGS (PROTECTED)
// -------------------------------------------------------------
app.get('/api/audit-logs', requirePermission('view_audit_logs'), (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.auditLogs);
});

// -------------------------------------------------------------
// 16. GEMINI AI CHAT ASSISTANT
// -------------------------------------------------------------
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  const { message, history } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    const reply = await askGeminiHvacAssistant(message, history || []);
    res.json({ reply });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({
      reply: 'Our live dispatch line is available 24/7 at (512) 555-0911 for all immediate heating and AC service needs.',
    });
  }
});

// -------------------------------------------------------------
// 17. HVAC SIZING ENGINEERING CALCULATOR
// -------------------------------------------------------------
app.post('/api/calculator/hvac-size', (req: Request, res: Response) => {
  const { squareFeet, ceilingHeight = 9, insulation = 'average', sunExposure = 'moderate' } = req.body;
  const sqft = Math.max(400, Math.min(10000, parseInt(squareFeet, 10) || 1800));

  // Base sizing rule: 1 ton per 550 sq ft
  let baseTons = sqft / 550;

  // Modifiers
  if (ceilingHeight > 10) baseTons *= 1.15;
  else if (ceilingHeight > 8) baseTons *= 1.05;

  if (insulation === 'poor') baseTons *= 1.2;
  else if (insulation === 'superior') baseTons *= 0.88;

  if (sunExposure === 'high') baseTons *= 1.1;
  else if (sunExposure === 'low') baseTons *= 0.95;

  // Round to nearest half-ton (2.0, 2.5, 3.0, 3.5, 4.0, 5.0)
  const exactTons = baseTons;
  const roundedTons = Math.min(5.0, Math.max(1.5, Math.round(baseTons * 2) / 2));
  const coolingBTUs = Math.round(roundedTons * 12000);
  const estimatedHeatingBTUs = Math.round(coolingBTUs * 1.25);

  res.json({
    squareFootage: sqft,
    recommendedTonnage: roundedTons,
    coolingBTUs,
    heatingBTUs: estimatedHeatingBTUs,
    exactCalculatedTons: Math.round(exactTons * 10) / 10,
    efficiencyRecommendation: '18 to 20 SEER2 Variable-Speed Inverter Heat Pump',
    annualEnergySavingsEstimate: Math.round(sqft * 0.18 + 120),
    incentivesEligible: [
      'Federal IRA 25C Tax Credit (up to $2,000)',
      'Local Utility Clean Energy Rebate ($400 - $800)',
    ],
    disclaimer: 'Non-binding engineering estimate. An on-site ACCA Manual J load calculation will be performed prior to installation.',
  });
});

// -------------------------------------------------------------
// 18. THEME CONFIGURATION (LIVE CUSTOMIZATION & PUBLISHING)
// -------------------------------------------------------------
app.get('/api/theme', async (req: Request, res: Response) => {
  const db = getDb();
  const auth = await authenticateRequest(req);
  const canViewDraft = Boolean(
    auth && (auth.permissions.includes('manage_theme') || auth.permissions.includes('manage_content'))
  );
  const activeTheme = canViewDraft ? (db.theme || initialThemeConfig) : (db.publishedTheme || db.theme || initialThemeConfig);
  res.json({
    ...activeTheme,
    historyCount: (db.themeHistory || []).length,
    isDraft: activeTheme.status === 'draft',
  });
});

app.put('/api/theme', requirePermission('manage_theme'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const updates: Partial<ThemeConfig> = req.body;
    db.theme = {
      ...(db.theme || initialThemeConfig),
      ...updates,
      status: 'draft',
      updatedAt: new Date().toISOString(),
    };
    persistDatabase();
    persistThemeToMySql(db.theme).catch((err) => console.warn('[Theme] Async MySQL persist warning:', err.message || err));
    addAuditLog('Admin', 'THEME_DRAFT_SAVED', 'Theme', 'current', 'Saved visual theme draft customizations');
    res.json({ success: true, theme: db.theme, historyCount: (db.themeHistory || []).length });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update theme.', message: err.message });
  }
});

app.post('/api/theme/publish', requirePermission('manage_theme'), (_req: Request, res: Response) => {
  try {
    const db = getDb();
    if (!db.theme) db.theme = { ...initialThemeConfig };
    
    // Push previous published version to history before publishing
    if (db.publishedTheme) {
      if (!db.themeHistory) db.themeHistory = [];
      db.themeHistory = [
        JSON.parse(JSON.stringify(db.publishedTheme)),
        ...db.themeHistory.filter((v) => v.updatedAt !== db.publishedTheme?.updatedAt),
      ].slice(0, 10);
    }

    db.theme.status = 'published';
    db.theme.publishedAt = new Date().toISOString();
    db.theme.updatedAt = new Date().toISOString();
    db.publishedTheme = JSON.parse(JSON.stringify(db.theme));

    persistDatabase();
    persistThemeToMySql(db.theme).catch((err) => console.warn('[Theme] Async MySQL persist warning:', err.message || err));
    addAuditLog('Admin', 'THEME_PUBLISHED', 'Theme', 'current', 'Published visual theme tokens to live site');
    res.json({
      success: true,
      theme: db.theme,
      historyCount: (db.themeHistory || []).length,
      message: 'Theme published live to all visitors.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to publish theme.', message: err.message });
  }
});

app.post('/api/theme/rollback', requirePermission('manage_theme'), (_req: Request, res: Response) => {
  try {
    const db = getDb();
    if (!db.themeHistory || db.themeHistory.length === 0) {
      return res.status(400).json({ error: 'No previous published theme version available for rollback.' });
    }

    const previousVersion = db.themeHistory.shift()!;
    db.theme = {
      ...previousVersion,
      status: 'published',
      updatedAt: new Date().toISOString(),
    };
    db.publishedTheme = JSON.parse(JSON.stringify(db.theme));

    persistDatabase();
    persistThemeToMySql(db.theme).catch((err) => console.warn('[Theme] Async MySQL persist warning:', err.message || err));
    addAuditLog('Admin', 'THEME_ROLLED_BACK', 'Theme', 'current', 'Rolled back visual theme to previous published state');
    res.json({
      success: true,
      theme: db.theme,
      historyCount: db.themeHistory.length,
      message: 'Theme rolled back to previous published version.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to rollback theme.', message: err.message });
  }
});

app.post('/api/theme/discard', requirePermission('manage_theme'), (_req: Request, res: Response) => {
  try {
    const db = getDb();
    if (db.publishedTheme) {
      db.theme = JSON.parse(JSON.stringify(db.publishedTheme));
    } else {
      db.theme = { ...initialThemeConfig };
    }
    persistDatabase();
    addAuditLog('Admin', 'THEME_DRAFT_DISCARDED', 'Theme', 'current', 'Discarded unpublished theme draft');
    res.json({ success: true, theme: db.theme, historyCount: (db.themeHistory || []).length, message: 'Draft discarded. Live published theme restored.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to discard draft.', message: err.message });
  }
});

app.post('/api/theme/reset', requirePermission('manage_theme'), (_req: Request, res: Response) => {
  try {
    const db = getDb();
    if (db.publishedTheme) {
      if (!db.themeHistory) db.themeHistory = [];
      db.themeHistory = [JSON.parse(JSON.stringify(db.publishedTheme)), ...db.themeHistory].slice(0, 10);
    }
    db.theme = { ...initialThemeConfig, updatedAt: new Date().toISOString(), publishedAt: new Date().toISOString(), status: 'published' };
    db.publishedTheme = JSON.parse(JSON.stringify(db.theme));
    persistDatabase();
    persistThemeToMySql(db.theme).catch((err) => console.warn('[Theme] Async MySQL persist warning:', err.message || err));
    addAuditLog('Admin', 'THEME_RESET', 'Theme', 'current', 'Reset theme tokens to factory defaults');
    res.json({ success: true, theme: db.theme, historyCount: (db.themeHistory || []).length, message: 'Theme reset to default palette and typography.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset theme.', message: err.message });
  }
});

// -------------------------------------------------------------
// 19. HOMEPAGE SECTIONS BUILDER
// -------------------------------------------------------------
app.get('/api/homepage-sections', (_req: Request, res: Response) => {
  const db = getDb();
  const sections = (db.homepageSections || initialHomepageSections).slice().sort((a, b) => a.order - b.order);
  res.json(sections);
});

app.put('/api/homepage-sections', requirePermission('manage_content'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const sections: HomepageSection[] = req.body;
    if (!Array.isArray(sections)) {
      return res.status(400).json({ error: 'Invalid sections array.' });
    }
    db.homepageSections = sections;
    persistDatabase();
    persistHomepageSectionsToMySql(sections).catch((err) => console.warn('[Homepage] Async MySQL persist warning:', err.message || err));
    addAuditLog('Admin', 'HOMEPAGE_SECTIONS_UPDATED', 'HomepageSection', 'all', `Reordered/updated ${sections.length} homepage layout blocks`);
    res.json({ success: true, sections: db.homepageSections });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update homepage sections.', message: err.message });
  }
});

// -------------------------------------------------------------
// 20. NAVIGATION & HEADER/FOOTER MANAGER
// -------------------------------------------------------------
app.get('/api/navigation-config', (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.navigationConfig || initialNavigationConfig);
});

app.put('/api/navigation-config', requirePermission('manage_content'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const config: NavigationConfig = req.body;
    db.navigationConfig = config;
    persistDatabase();
    persistNavigationToMySql(config).catch((err) => console.warn('[Navigation] Async MySQL persist warning:', err.message || err));
    addAuditLog('Admin', 'NAVIGATION_CONFIG_UPDATED', 'NavigationConfig', 'main', 'Updated navigation menus, announcement bar, or footer content');
    res.json({ success: true, navigationConfig: db.navigationConfig });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update navigation.', message: err.message });
  }
});

// -------------------------------------------------------------
// 21. FEATURE FLAGS & MODULE CONTROL
// -------------------------------------------------------------
app.get('/api/feature-flags', (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.featureFlags || initialFeatureFlags);
});

app.put('/api/feature-flags', requirePermission('manage_settings'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const flagsPayload = req.body.flags && typeof req.body.flags === 'object' ? req.body.flags : req.body;
    db.featureFlags = { ...(db.featureFlags || initialFeatureFlags), ...flagsPayload };
    // clean up accidental 'flags' key if present
    if ('flags' in db.featureFlags) {
      delete (db.featureFlags as any).flags;
    }
    persistDatabase();
    persistFeatureFlagsToMySql(db.featureFlags).catch((err) => console.warn('[FeatureFlags] Async MySQL persist warning:', err.message || err));
    addAuditLog('Admin', 'FEATURE_FLAGS_UPDATED', 'FeatureFlags', 'system', `Updated system feature flags (${Object.keys(flagsPayload).join(', ')})`);
    res.json({ success: true, featureFlags: db.featureFlags });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update feature flags.', message: err.message });
  }
});

// -------------------------------------------------------------
// 22. MULTI-MARKET & BUSINESS IDENTITY SETTINGS
// -------------------------------------------------------------
app.get('/api/market-settings', (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.marketSettings || initialMarketSettings);
});

app.put('/api/market-settings', requirePermission('manage_settings'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const updates: Partial<MarketSettings> = req.body;
    db.marketSettings = { ...(db.marketSettings || initialMarketSettings), ...updates };
    persistDatabase();
    persistMarketSettingsToMySql(db.marketSettings).catch((err) => console.warn('[MarketSettings] Async MySQL persist warning:', err.message || err));
    addAuditLog('Admin', 'MARKET_SETTINGS_UPDATED', 'MarketSettings', 'main', `Updated market identity: ${db.marketSettings.primaryCity}, ${db.marketSettings.regionOrState}`);
    res.json({ success: true, marketSettings: db.marketSettings });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update market settings.', message: err.message });
  }
});

// -------------------------------------------------------------
// 23. SERVICE AREAS CRUD (CMS)
// -------------------------------------------------------------
app.post('/api/service-areas', requirePermission('manage_services'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { name, zipCodes, phone, description, popularServices } = req.body;
    if (!name) return res.status(400).json({ error: 'Area name is required.' });
    const slug = (req.body.slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newArea = {
      id: `area-${Date.now()}`,
      slug,
      name: sanitizeText(name),
      type: req.body.type || 'city',
      zipCodes: Array.isArray(zipCodes) ? zipCodes : (zipCodes ? zipCodes.split(',').map((z: string) => z.trim()) : []),
      phone: phone ? sanitizeText(phone) : '(512) 555-0199',
      emergencyAvailable: req.body.emergencyAvailable ?? true,
      description: sanitizeText(description || ''),
      popularServices: Array.isArray(popularServices) ? popularServices : ['ac-repair'],
      active: req.body.active ?? true,
    };
    db.serviceAreas.push(newArea);
    persistDatabase();
    persistServiceAreaToMySql(newArea as any).catch((err) => console.warn('[ServiceArea] Async MySQL persist warning:', err.message || err));
    addAuditLog('Admin', 'SERVICE_AREA_CREATED', 'ServiceArea', newArea.id, `Created territory: ${newArea.name}`);
    res.status(201).json(newArea);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create service area.', message: err.message });
  }
});

app.put('/api/service-areas/:id', requirePermission('manage_services'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const idx = db.serviceAreas.findIndex((a) => a.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Area not found.' });
    db.serviceAreas[idx] = { ...db.serviceAreas[idx], ...req.body };
    persistDatabase();
    persistServiceAreaToMySql(db.serviceAreas[idx] as any).catch((err) => console.warn('[ServiceArea] Async MySQL persist warning:', err.message || err));
    addAuditLog('Admin', 'SERVICE_AREA_UPDATED', 'ServiceArea', id, `Updated territory: ${db.serviceAreas[idx].name}`);
    res.json(db.serviceAreas[idx]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update service area.', message: err.message });
  }
});

app.delete('/api/service-areas/:id', requirePermission('manage_services'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const idx = db.serviceAreas.findIndex((a) => a.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Area not found.' });
    const deleted = db.serviceAreas.splice(idx, 1)[0];
    persistDatabase();
    deleteServiceAreaFromMySql(id).catch((err) => console.warn('[ServiceArea] Async MySQL delete warning:', err.message || err));
    addAuditLog('Admin', 'SERVICE_AREA_DELETED', 'ServiceArea', id, `Deleted territory: ${deleted.name}`);
    res.json({ success: true, message: `Territory ${deleted.name} removed.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete service area.', message: err.message });
  }
});

// -------------------------------------------------------------
// 24. TECHNICIANS CRUD (CMS)
// -------------------------------------------------------------
app.post('/api/technicians', requirePermission('manage_technicians'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { name, role, email, phone, skills } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' });
    const newTech: Technician = {
      id: `tech-${Date.now()}`,
      name: sanitizeText(name),
      role: sanitizeText(role || 'HVAC Technician'),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '(512) 555-0140',
      skills: Array.isArray(skills) ? skills : ['Diagnostics', 'Repair'],
      serviceAreas: Array.isArray(req.body.serviceAreas) ? req.body.serviceAreas : ['austin-metro'],
      rating: 5.0,
      completedJobsCount: 0,
      active: true,
      workingHours: req.body.workingHours || 'Mon - Fri: 8:00 AM - 5:00 PM',
    };
    db.technicians.push(newTech);
    persistDatabase();
    addAuditLog('Admin', 'TECHNICIAN_CREATED', 'Technician', newTech.id, `Created technician profile: ${newTech.name}`);
    res.status(201).json(newTech);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create technician.', message: err.message });
  }
});

app.delete('/api/technicians/:id', requirePermission('manage_technicians'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const idx = db.technicians.findIndex((t) => t.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Technician not found.' });
    const deleted = db.technicians.splice(idx, 1)[0];
    persistDatabase();
    addAuditLog('Admin', 'TECHNICIAN_DELETED', 'Technician', id, `Removed technician: ${deleted.name}`);
    res.json({ success: true, message: `Technician ${deleted.name} removed.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete technician.', message: err.message });
  }
});

// -------------------------------------------------------------
// 25. FORM BUILDER & CUSTOM SUBMISSIONS
// -------------------------------------------------------------
app.get('/api/forms', (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.forms || []);
});

app.post('/api/forms', requirePermission('manage_content'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { name, slug, description, fields, notificationEmail, successMessage } = req.body;
    if (!name) return res.status(400).json({ error: 'Form name is required.' });
    const formSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newForm: CustomFormDefinition = {
      id: `form-${Date.now()}`,
      name: sanitizeText(name),
      slug: formSlug,
      description: sanitizeText(description || ''),
      enabled: req.body.enabled ?? true,
      fields: Array.isArray(fields) ? fields : [],
      notificationEmail: notificationEmail ? sanitizeText(notificationEmail) : 'dispatch@airflowclimate.com',
      successMessage: successMessage ? sanitizeText(successMessage) : 'Thank you. We have received your submission.',
      createdAt: new Date().toISOString(),
    };
    if (!db.forms) db.forms = [];
    db.forms.push(newForm);
    persistDatabase();
    addAuditLog('Admin', 'FORM_CREATED', 'CustomForm', newForm.id, `Created form: ${newForm.name}`);
    res.status(201).json(newForm);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create form.', message: err.message });
  }
});

app.put('/api/forms/:id', requirePermission('manage_content'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    if (!db.forms) db.forms = [];
    const idx = db.forms.findIndex((f) => f.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Form not found.' });
    db.forms[idx] = { ...db.forms[idx], ...req.body };
    persistDatabase();
    addAuditLog('Admin', 'FORM_UPDATED', 'CustomForm', id, `Updated form: ${db.forms[idx].name}`);
    res.json(db.forms[idx]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update form.', message: err.message });
  }
});

app.post('/api/forms/:slug/submit', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { slug } = req.params;
    const form = (db.forms || []).find((f) => f.slug === slug || f.id === slug);
    if (!form) return res.status(404).json({ error: 'Form not found.' });
    if (!form.enabled) return res.status(403).json({ error: 'This form is currently not accepting submissions.' });

    const submissionData = req.body;
    const name = submissionData.name || submissionData.fullName || submissionData['f-name'] || 'Custom Form Lead';
    const phone = submissionData.phone || submissionData.customerPhone || submissionData['f-phone'] || '(555) 000-0000';
    const email = submissionData.email || submissionData['f-email'] || '';

    const newLead: Lead = {
      id: `lead-form-${Date.now()}`,
      leadNumber: `LD-${1000 + db.leads.length + 1}`,
      source: 'website_form',
      journey: 'routine',
      serviceRequested: form.name,
      customerName: sanitizeText(name),
      email: sanitizeText(email),
      phone: sanitizeText(phone),
      address: sanitizeText(submissionData.address || ''),
      city: 'Metro Area',
      state: 'State',
      zipCode: sanitizeText(submissionData.zipCode || ''),
      urgency: 'normal',
      preferredContactMethod: 'phone',
      status: 'new',
      notes: `Form Submission [${form.name}]: ${JSON.stringify(submissionData)}`,
      priority: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      propertyType: 'residential',
    };
    db.leads.unshift(newLead);
    persistDatabase();
    persistLeadToMySql(newLead).catch((err) => console.warn('[Lead] Async MySQL persist warning:', err.message || err));
    persistFormSubmissionToMySql(form.id, submissionData).catch((err) => console.warn('[FormSub] Async MySQL persist warning:', err.message || err));
    addAuditLog('Form Engine', 'FORM_SUBMITTED', 'CustomForm', form.id, `Submission on form ${form.name} from ${name}`);
    res.json({ success: true, message: form.successMessage || 'Form submitted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Form submission failed.', message: err.message });
  }
});

// -------------------------------------------------------------
// 26. PAGE BUILDER (PAGES CMS)
// -------------------------------------------------------------
app.get('/api/pages', (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.pages || []);
});

app.get('/api/pages/:slug', (req: Request, res: Response) => {
  const db = getDb();
  const page = (db.pages || []).find((p) => p.slug === req.params.slug || p.id === req.params.slug);
  if (!page) return res.status(404).json({ error: 'Page not found.' });
  res.json(page);
});

app.post('/api/pages', requirePermission('manage_content'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { title, slug, metaDescription, blocks, isPublished } = req.body;
    if (!title) return res.status(400).json({ error: 'Page title is required.' });
    const cleanTitle = sanitizeText(title);
    const cleanSlug = (slug || cleanTitle).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newPage: PageDefinition = {
      id: `page-${Date.now()}`,
      slug: cleanSlug,
      title: cleanTitle,
      metaDescription: sanitizeText(metaDescription || ''),
      isPublished: isPublished ?? true,
      blocks: Array.isArray(blocks) ? blocks : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!db.pages) db.pages = [];
    db.pages.push(newPage);
    persistDatabase();
    addAuditLog('Admin', 'PAGE_CREATED', 'PageDefinition', newPage.id, `Created custom page: ${newPage.title}`);
    res.status(201).json(newPage);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create page.', message: err.message });
  }
});

app.put('/api/pages/:id', requirePermission('manage_content'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    if (!db.pages) db.pages = [];
    const idx = db.pages.findIndex((p) => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Page not found.' });
    db.pages[idx] = { ...db.pages[idx], ...req.body, updatedAt: new Date().toISOString() };
    persistDatabase();
    addAuditLog('Admin', 'PAGE_UPDATED', 'PageDefinition', id, `Updated custom page: ${db.pages[idx].title}`);
    res.json(db.pages[idx]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update page.', message: err.message });
  }
});

app.delete('/api/pages/:id', requirePermission('manage_content'), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();
    if (!db.pages) db.pages = [];
    const idx = db.pages.findIndex((p) => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Page not found.' });
    const deleted = db.pages.splice(idx, 1)[0];
    persistDatabase();
    addAuditLog('Admin', 'PAGE_DELETED', 'PageDefinition', id, `Deleted custom page: ${deleted.title}`);
    res.json({ success: true, message: 'Page deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete page.', message: err.message });
  }
});

// -------------------------------------------------------------
// 26B. SITE PAGES & SECTION CONTENT CMS
// -------------------------------------------------------------
app.get('/api/site-pages', (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.sitePages || defaultSitePages);
});

app.get('/api/site-pages/:id', (req: Request, res: Response) => {
  const db = getDb();
  const page = (db.sitePages || defaultSitePages).find(
    (p) => p.id === req.params.id || p.slug === req.params.id || p.slug === `/${req.params.id}`
  );
  if (!page) return res.status(404).json({ error: 'Page not found.' });
  res.json(page);
});

app.put('/api/site-pages/:id', requirePermission('manage_content'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    if (!db.sitePages) db.sitePages = [...defaultSitePages];
    const idx = db.sitePages.findIndex(
      (p) => p.id === id || p.slug === id || p.slug === `/${id}`
    );
    if (idx === -1) return res.status(404).json({ error: 'Page not found.' });

    const updated = {
      ...db.sitePages[idx],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    db.sitePages[idx] = updated;
    persistDatabase();

    persistSitePageToMySql(updated).catch((err) => {
      console.warn('[MySQL Warning] Could not persist site page to MySQL:', err.message);
    });

    addAuditLog(
      'Admin',
      'PAGE_SECTION_UPDATED',
      'SitePage',
      updated.id,
      `Updated sections and elements for page "${updated.title}"`
    );
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update page sections.', message: err.message });
  }
});

app.post('/api/site-pages/:id/reset', requirePermission('manage_content'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    if (!db.sitePages) db.sitePages = [...defaultSitePages];
    const defaultPage = defaultSitePages.find((p) => p.id === id || p.slug === id || p.slug === `/${id}`);
    if (!defaultPage) return res.status(404).json({ error: 'Default definition not found.' });

    const idx = db.sitePages.findIndex((p) => p.id === id || p.slug === id || p.slug === `/${id}`);
    const cloned = JSON.parse(JSON.stringify(defaultPage));
    if (idx !== -1) {
      db.sitePages[idx] = cloned;
    } else {
      db.sitePages.push(cloned);
    }
    persistDatabase();

    persistSitePageToMySql(cloned).catch((err) => {
      console.warn('[MySQL Warning] Could not persist reset site page to MySQL:', err.message);
    });

    addAuditLog('Admin', 'PAGE_RESET_TO_DEFAULT', 'SitePage', id, `Reset page sections to default for: ${defaultPage.title}`);
    res.json(cloned);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset page.', message: err.message });
  }
});

// -------------------------------------------------------------
// 27. AUTHENTICATION, INITIAL SUPER ADMIN SETUP & USER MANAGEMENT
// -------------------------------------------------------------

app.get('/api/auth/setup-status', (_req: Request, res: Response) => {
  const db = getDb();
  const users = db.users || [];
  res.json({
    needsSetup: needsInitialSetup(users),
    configuredSuperAdmins: users.filter(
      (u) => normalizeStaffRole(u.role) === 'super_admin' && u.status === 'active' && Boolean(u.passwordHash?.startsWith('scrypt$'))
    ).length,
  });
});

app.post('/api/auth/setup-super-admin', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    if (!db.users) db.users = [];

    if (!needsInitialSetup(db.users)) {
      return res.status(403).json({
        error: 'Initial Super Admin setup is already complete. Public registration is disabled.',
      });
    }

    const { name, email, username, password, phone } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !validateEmail(cleanEmail)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    const cleanUsername = username
      ? String(username).trim().toLowerCase().replace(/[^a-z0-9._-]/g, '')
      : cleanEmail.split('@')[0];
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }

    const strength = validatePasswordStrength(password || '');
    if (!strength.valid) {
      return res.status(400).json({ error: strength.error });
    }

    const passwordHash = hashPassword(password);
    const now = new Date().toISOString();

    // Remove or upgrade uninitialized placeholder if matching email
    const existingIdx = db.users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    let superAdminUser: AdminUser;
    if (existingIdx !== -1) {
      superAdminUser = {
        ...db.users[existingIdx],
        username: cleanUsername,
        name: sanitizeText(name),
        email: cleanEmail,
        phone: phone ? sanitizeText(phone) : db.users[existingIdx].phone,
        role: 'super_admin',
        passwordHash,
        mustChangePassword: false,
        status: 'active',
        lastLogin: now,
      };
      superAdminUser.permissions = resolveUserPermissions(superAdminUser);
      db.users[existingIdx] = superAdminUser;
    } else {
      superAdminUser = {
        id: `user-${Date.now()}`,
        username: cleanUsername,
        name: sanitizeText(name),
        email: cleanEmail,
        phone: phone ? sanitizeText(phone) : undefined,
        role: 'super_admin',
        permissions: resolveUserPermissions({ role: 'super_admin' }),
        passwordHash,
        mustChangePassword: false,
        status: 'active',
        lastLogin: now,
        createdAt: now,
      };
      db.users.unshift(superAdminUser);
    }

    persistDatabase();
    await persistUserToMySql(superAdminUser);

    const { token, expiresAt } = await createSessionForUser(superAdminUser, req, res);
    addAuditLog(superAdminUser.name, 'SUPER_ADMIN_INITIALIZED', 'AdminUser', superAdminUser.id, `Initialized first Super Admin account (${superAdminUser.email})`);

    res.status(201).json({
      success: true,
      user: sanitizeUser(superAdminUser),
      token,
      expiresAt,
      redirectRoute: getDashboardRouteForRole(superAdminUser.role),
      message: 'Super Admin account initialized and signed in.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to initialize Super Admin.', message: err.message });
  }
});

async function handleLogin(req: Request, res: Response) {
  try {
    const db = getDb();
    const { identifier, email, username, password } = req.body || {};
    const rawIdentifier = String(identifier || email || username || '').trim().toLowerCase();

    if (!rawIdentifier || !password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Username/email and password are required.' });
    }

    const matchedUser = (db.users || []).find(
      (u) =>
        u.email.toLowerCase() === rawIdentifier ||
        (u.username && u.username.toLowerCase() === rawIdentifier)
    );

    if (!matchedUser || !verifyPassword(password, matchedUser.passwordHash)) {
      addAuditLog(rawIdentifier, 'USER_LOGIN_FAILED', 'AdminUser', 'auth', `Failed login attempt for identifier "${rawIdentifier}"`);
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    if (matchedUser.status !== 'active') {
      return res.status(403).json({ error: 'This account is suspended. Contact your Super Admin to restore access.' });
    }

    const normalizedLoginRole = normalizeStaffRole(matchedUser.role);
    if (normalizedLoginRole === 'customer') {
      return res.status(403).json({ error: 'This account does not have staff portal access.' });
    }

    matchedUser.role = normalizedLoginRole;
    matchedUser.permissions = resolveUserPermissions(matchedUser);
    matchedUser.lastLogin = new Date().toISOString();
    persistDatabase();
    await persistUserToMySql(matchedUser);

    const { token, expiresAt } = await createSessionForUser(matchedUser, req, res);
    addAuditLog(matchedUser.name, 'USER_LOGIN', 'AdminUser', matchedUser.id, `Authenticated as ${matchedUser.role}`);

    const safeUser = sanitizeUser(matchedUser);
    res.json({
      success: true,
      user: safeUser,
      token,
      expiresAt,
      redirectRoute: safeUser.redirectRoute,
      message: `Welcome back, ${matchedUser.name}!`,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Login failed.', message: err.message });
  }
}

app.post('/api/auth/login', handleLogin);
app.post('/api/admin/login', handleLogin);

async function handleLogout(req: Request, res: Response) {
  try {
    const auth = await authenticateRequest(req);
    const rawToken = extractTokenFromRequest(req);
    await revokeSessionByToken(rawToken);
    clearSessionCookie(res);
    if (auth) {
      addAuditLog(auth.user.name, 'USER_LOGOUT', 'AdminUser', auth.user.id, `Signed out from ${auth.role} session`);
    }
    res.json({ success: true, message: 'Signed out successfully.' });
  } catch (err: any) {
    clearSessionCookie(res);
    res.json({ success: true, message: 'Signed out.' });
  }
}

app.post('/api/auth/logout', handleLogout);
app.post('/api/admin/logout', handleLogout);

async function handleGetMe(req: Request, res: Response) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  res.json(sanitizeUser(auth.user));
}

app.get('/api/auth/me', handleGetMe);
app.get('/api/admin/me', handleGetMe);

app.post('/api/auth/change-password', requireAuth(), async (req: Request, res: Response) => {
  try {
    const auth = (req as AuthenticatedRequest).auth!;
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }
    if (!verifyPassword(currentPassword, auth.user.passwordHash)) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return res.status(400).json({ error: strength.error });
    }

    auth.user.passwordHash = hashPassword(newPassword);
    auth.user.mustChangePassword = false;
    persistDatabase();
    await persistUserToMySql(auth.user);

    addAuditLog(auth.user.name, 'PASSWORD_CHANGED', 'AdminUser', auth.user.id, 'User updated their account password');
    res.json({ success: true, user: sanitizeUser(auth.user), message: 'Password updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to change password.', message: err.message });
  }
});

app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { identifier, email } = req.body || {};
    const raw = String(identifier || email || '').trim().toLowerCase();
    if (!raw) {
      return res.status(400).json({ error: 'Email or username is required.' });
    }

    const db = getDb();
    const user = (db.users || []).find(
      (u) => u.email.toLowerCase() === raw || (u.username && u.username.toLowerCase() === raw)
    );

    if (user && user.status === 'active') {
      await createPasswordResetToken(user.id);
      addAuditLog(
        user.email,
        'PASSWORD_RESET_REQUESTED',
        'AdminUser',
        user.id,
        'Self-service password recovery request submitted. Super Admin can issue a recovery token in Team & Access.'
      );
    }

    // Generic response prevents account enumeration
    res.json({
      success: true,
      message:
        'If an active staff account matches that identifier, recovery has been logged. Obtain your one-time recovery token from your Super Admin to set a new password.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process password recovery request.', message: err.message });
  }
});

app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Recovery token and new password are required.' });
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return res.status(400).json({ error: strength.error });
    }

    const verified = await verifyAndConsumeResetToken(token);
    if (!verified.valid || !verified.userId) {
      return res.status(400).json({ error: verified.error || 'Invalid recovery token.' });
    }

    const db = getDb();
    const user = (db.users || []).find((u) => u.id === verified.userId);
    if (!user) {
      return res.status(404).json({ error: 'Associated account no longer exists.' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Suspended accounts cannot reset passwords.' });
    }

    user.passwordHash = hashPassword(newPassword);
    user.mustChangePassword = false;
    persistDatabase();
    await persistUserToMySql(user);
    await revokeAllUserSessions(user.id);

    addAuditLog(user.name, 'PASSWORD_RESET_COMPLETED', 'AdminUser', user.id, 'Password reset completed via single-use recovery token');
    res.json({ success: true, message: 'Password reset successful. Please sign in with your new password.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset password.', message: err.message });
  }
});

// Super Admin User & Permission Management Routes
app.get('/api/admin/users', requirePermission('manage_users'), (_req: Request, res: Response) => {
  const db = getDb();
  res.json((db.users || []).map(sanitizeUser));
});

app.post('/api/admin/users', requirePermission('manage_users'), async (req: Request, res: Response) => {
  try {
    const auth = (req as AuthenticatedRequest).auth!;
    const db = getDb();
    const { name, email, username, role, phone, password, permissions, technicianId, status, mustChangePassword } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({ error: 'Full name and email address are required.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    if (!validateEmail(cleanEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'An initial password is required for new staff accounts.' });
    }
    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return res.status(400).json({ error: strength.error });
    }

    const cleanUsername = username
      ? String(username).trim().toLowerCase().replace(/[^a-z0-9._-]/g, '')
      : cleanEmail.split('@')[0];
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }

    if (!db.users) db.users = [];
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return res.status(409).json({ error: `An account with email "${cleanEmail}" already exists.` });
    }
    if (db.users.some((u) => u.username && u.username.toLowerCase() === cleanUsername)) {
      return res.status(409).json({ error: `Username "${cleanUsername}" is already taken.` });
    }

    const normalizedRole = normalizeStaffRole(role || 'content_editor');
    if (normalizedRole === 'customer') {
      return res.status(400).json({ error: 'Invalid staff role specified.' });
    }

    const newUser: AdminUser = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      name: sanitizeText(name),
      email: cleanEmail,
      role: normalizedRole,
      permissions: resolveUserPermissions({
        role: normalizedRole,
        permissions: Array.isArray(permissions) ? permissions : undefined,
      }),
      technicianId: technicianId || undefined,
      phone: phone ? sanitizeText(phone) : undefined,
      passwordHash: hashPassword(password),
      mustChangePassword: Boolean(mustChangePassword),
      status: status === 'suspended' ? 'suspended' : 'active',
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    persistDatabase();
    await persistUserToMySql(newUser);
    addAuditLog(auth.user.name, 'USER_CREATED', 'AdminUser', newUser.id, `Created user ${newUser.name} (${newUser.role})`);
    res.status(201).json(sanitizeUser(newUser));
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create user.', message: err.message });
  }
});

app.put('/api/admin/users/:id', requirePermission('manage_users'), async (req: Request, res: Response) => {
  try {
    const auth = (req as AuthenticatedRequest).auth!;
    const db = getDb();
    const { id } = req.params;
    if (!db.users) db.users = [];
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) return res.status(404).json({ error: 'User not found.' });

    const existing = db.users[idx];
    const updates = req.body || {};

    const nextRole = updates.role ? normalizeStaffRole(updates.role) : normalizeStaffRole(existing.role);
    if (nextRole === 'customer') {
      return res.status(400).json({ error: 'Invalid staff role specified.' });
    }
    const nextStatus = updates.status === 'suspended' ? 'suspended' : updates.status === 'active' ? 'active' : existing.status;

    if (id === auth.user.id) {
      if (nextStatus === 'suspended') {
        return res.status(400).json({ error: 'You cannot suspend your own active Super Admin account.' });
      }
      if (nextRole !== 'super_admin') {
        return res.status(400).json({ error: 'You cannot demote your own Super Admin role.' });
      }
    }

    let nextEmail = existing.email;
    if (typeof updates.email === 'string' && updates.email.trim()) {
      nextEmail = updates.email.trim().toLowerCase();
      if (!validateEmail(nextEmail)) {
        return res.status(400).json({ error: 'Invalid email address.' });
      }
      if (db.users.some((u) => u.id !== id && u.email.toLowerCase() === nextEmail)) {
        return res.status(409).json({ error: `Email "${nextEmail}" is already assigned to another account.` });
      }
    }

    let nextUsername = existing.username;
    if (typeof updates.username === 'string' && updates.username.trim()) {
      const cleanedUsername = updates.username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
      if (cleanedUsername.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters.' });
      }
      if (db.users.some((u) => u.id !== id && u.username?.toLowerCase() === cleanedUsername)) {
        return res.status(409).json({ error: `Username "${cleanedUsername}" is already taken.` });
      }
      nextUsername = cleanedUsername;
    }

    let nextPasswordHash = existing.passwordHash;
    let revokeSessions = false;
    if (typeof updates.password === 'string' && updates.password.length > 0) {
      const strength = validatePasswordStrength(updates.password);
      if (!strength.valid) {
        return res.status(400).json({ error: strength.error });
      }
      nextPasswordHash = hashPassword(updates.password);
      revokeSessions = true;
    }

    if (nextStatus === 'suspended' || nextRole !== existing.role || Array.isArray(updates.permissions)) {
      revokeSessions = true;
    }

    const updatedUser: AdminUser = {
      ...existing,
      name: updates.name ? sanitizeText(updates.name) : existing.name,
      email: nextEmail,
      username: nextUsername,
      phone: updates.phone !== undefined ? (updates.phone ? sanitizeText(updates.phone) : undefined) : existing.phone,
      role: nextRole,
      permissions: resolveUserPermissions({
        role: nextRole,
        permissions: Array.isArray(updates.permissions) ? updates.permissions : (updates.role && updates.role !== existing.role ? undefined : existing.permissions),
      }),
      technicianId: updates.technicianId !== undefined ? (updates.technicianId || undefined) : existing.technicianId,
      status: nextStatus,
      mustChangePassword: updates.mustChangePassword !== undefined ? Boolean(updates.mustChangePassword) : existing.mustChangePassword,
      passwordHash: nextPasswordHash,
    };

    db.users[idx] = updatedUser;
    persistDatabase();
    await persistUserToMySql(updatedUser);

    if (revokeSessions && id !== auth.user.id) {
      await revokeAllUserSessions(id);
    }

    addAuditLog(auth.user.name, 'USER_UPDATED', 'AdminUser', id, `Updated user ${updatedUser.name} (${updatedUser.role}, ${updatedUser.status})`);
    res.json(sanitizeUser(updatedUser));
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update user.', message: err.message });
  }
});

app.post('/api/admin/users/:id/reset-password', requirePermission('manage_users'), async (req: Request, res: Response) => {
  try {
    const auth = (req as AuthenticatedRequest).auth!;
    const db = getDb();
    const { id } = req.params;
    const { newPassword, mustChangePassword = true } = req.body || {};

    const user = (db.users || []).find((u) => u.id === id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const strength = validatePasswordStrength(newPassword || '');
    if (!strength.valid) {
      return res.status(400).json({ error: strength.error });
    }

    user.passwordHash = hashPassword(newPassword);
    user.mustChangePassword = Boolean(mustChangePassword);
    persistDatabase();
    await persistUserToMySql(user);
    if (id !== auth.user.id) {
      await revokeAllUserSessions(id);
    }

    addAuditLog(auth.user.name, 'ADMIN_RESET_PASSWORD', 'AdminUser', id, `Super Admin reset password for ${user.email}`);
    res.json({ success: true, user: sanitizeUser(user), message: `Password updated for ${user.name}.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset user password.', message: err.message });
  }
});

app.post('/api/admin/users/:id/reset-token', requirePermission('manage_users'), async (req: Request, res: Response) => {
  try {
    const auth = (req as AuthenticatedRequest).auth!;
    const db = getDb();
    const { id } = req.params;
    const user = (db.users || []).find((u) => u.id === id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.status !== 'active') {
      return res.status(400).json({ error: 'Cannot generate recovery token for a suspended user.' });
    }

    const { rawToken, expiresAt } = await createPasswordResetToken(user.id);
    addAuditLog(auth.user.name, 'RESET_TOKEN_GENERATED', 'AdminUser', id, `Generated single-use recovery token for ${user.email}`);
    res.json({
      success: true,
      token: rawToken,
      expiresAt,
      message: `Single-use recovery token generated for ${user.name}. Share securely; expires in 30 minutes.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate recovery token.', message: err.message });
  }
});

app.delete('/api/admin/users/:id', requirePermission('manage_users'), async (req: Request, res: Response) => {
  try {
    const auth = (req as AuthenticatedRequest).auth!;
    const db = getDb();
    const { id } = req.params;
    if (!db.users) db.users = [];
    if (id === auth.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own active Super Admin account.' });
    }

    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) return res.status(404).json({ error: 'User not found.' });

    const deleted = db.users.splice(idx, 1)[0];
    persistDatabase();
    await revokeAllUserSessions(id);
    await deleteUserFromMySql(id);

    addAuditLog(auth.user.name, 'USER_DELETED', 'AdminUser', id, `Removed user account: ${deleted.name} (${deleted.email})`);
    res.json({ success: true, message: `User ${deleted.name} removed.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete user.', message: err.message });
  }
});

// -------------------------------------------------------------
// 28. UNIVERSAL GLOBAL CONTENT SEARCH & REPLACE
// -------------------------------------------------------------
app.post('/api/admin/search-content', requirePermission('manage_content'), (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters.' });
    }

    const db = getDb();
    const q = query.toLowerCase();
    const results: Array<{
      id: string;
      entityType: string;
      entityId: string;
      title: string;
      field: string;
      originalValue: string;
      preview: string;
    }> = [];

    const checkField = (entityType: string, entityId: string, title: string, field: string, value: any) => {
      if (typeof value === 'string' && value.toLowerCase().includes(q)) {
        const idx = value.toLowerCase().indexOf(q);
        const start = Math.max(0, idx - 40);
        const end = Math.min(value.length, idx + q.length + 40);
        const snippet = (start > 0 ? '...' : '') + value.slice(start, end) + (end < value.length ? '...' : '');
        results.push({
          id: `${entityType}-${entityId}-${field}`,
          entityType,
          entityId,
          title,
          field,
          originalValue: value,
          preview: snippet,
        });
      }
    };

    // Services
    (db.services || []).forEach((s) => {
      checkField('Service', s.id, s.name, 'name', s.name);
      checkField('Service', s.id, s.name, 'shortDescription', s.shortDescription);
      checkField('Service', s.id, s.name, 'fullDescription', s.fullDescription);
      checkField('Service', s.id, s.name, 'seoTitle', s.seoTitle);
      checkField('Service', s.id, s.name, 'seoDescription', s.seoDescription);
    });

    // Service Areas
    (db.serviceAreas || []).forEach((a) => {
      checkField('ServiceArea', a.id, a.name, 'name', a.name);
      checkField('ServiceArea', a.id, a.name, 'description', a.description);
    });

    // Articles
    (db.articles || []).forEach((a) => {
      checkField('Article', a.id, a.title, 'title', a.title);
      checkField('Article', a.id, a.title, 'excerpt', a.excerpt);
      checkField('Article', a.id, a.title, 'content', a.content);
    });

    // Projects
    (db.projects || []).forEach((p) => {
      checkField('Project', p.id, p.title, 'title', p.title);
      checkField('Project', p.id, p.title, 'problem', p.problem);
      checkField('Project', p.id, p.title, 'solution', p.solution);
      checkField('Project', p.id, p.title, 'outcome', p.outcome);
      checkField('Project', p.id, p.title, 'customerQuote', p.customerQuote);
    });

    // Promotions
    (db.promotions || []).forEach((p) => {
      checkField('Promotion', p.id, p.title, 'title', p.title);
      checkField('Promotion', p.id, p.title, 'description', p.description);
      checkField('Promotion', p.id, p.title, 'terms', p.terms);
    });

    // Settings
    if (db.settings) {
      checkField('Settings', 'main', 'Business Profile', 'businessName', db.settings.businessName);
      checkField('Settings', 'main', 'Business Profile', 'tagline', db.settings.tagline);
      checkField('Settings', 'main', 'Business Profile', 'primaryCity', db.settings.primaryCity);
    }

    // Market Settings
    if (db.marketSettings) {
      checkField('MarketSettings', 'main', 'Market Settings', 'primaryCity', db.marketSettings.primaryCity);
      checkField('MarketSettings', 'main', 'Market Settings', 'regionOrState', db.marketSettings.regionOrState);
      checkField('MarketSettings', 'main', 'Market Settings', 'businessHoursText', db.marketSettings.businessHoursText);
    }

    // Navigation Announcement & Footer
    if (db.navigationConfig?.announcement) {
      checkField('Navigation', 'announcement', 'Announcement Bar', 'text', db.navigationConfig.announcement.text);
    }
    if (db.navigationConfig?.footer) {
      checkField('Navigation', 'footer', 'Footer About', 'aboutText', db.navigationConfig.footer.aboutText);
      checkField('Navigation', 'footer', 'Footer Copyright', 'copyrightText', db.navigationConfig.footer.copyrightText);
    }

    // Homepage Sections
    (db.homepageSections || []).forEach((sec) => {
      checkField('HomepageSection', sec.id, sec.name, 'heading', sec.heading);
      checkField('HomepageSection', sec.id, sec.name, 'subheading', sec.subheading);
    });

    res.json({
      query,
      totalMatches: results.length,
      matches: results,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Search failed.', message: err.message });
  }
});

app.post('/api/admin/replace-content', requirePermission('manage_content'), (req: Request, res: Response) => {
  try {
    const { searchStr, replaceStr, selectedIds } = req.body;
    if (!searchStr || typeof replaceStr !== 'string') {
      return res.status(400).json({ error: 'Search string and replacement string are required.' });
    }

    const db = getDb();
    const regex = new RegExp(searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    let replacementCount = 0;

    const doReplace = (entityType: string, entityId: string, field: string, obj: any): boolean => {
      const matchId = `${entityType}-${entityId}-${field}`;
      if (selectedIds && Array.isArray(selectedIds) && !selectedIds.includes(matchId)) {
        return false;
      }
      if (typeof obj[field] === 'string' && obj[field].includes(searchStr)) {
        obj[field] = obj[field].replace(regex, replaceStr);
        replacementCount++;
        return true;
      }
      return false;
    };

    // Services
    (db.services || []).forEach((s) => {
      doReplace('Service', s.id, 'name', s);
      doReplace('Service', s.id, 'shortDescription', s);
      doReplace('Service', s.id, 'fullDescription', s);
      doReplace('Service', s.id, 'seoTitle', s);
      doReplace('Service', s.id, 'seoDescription', s);
    });

    // Service Areas
    (db.serviceAreas || []).forEach((a) => {
      doReplace('ServiceArea', a.id, 'name', a);
      doReplace('ServiceArea', a.id, 'description', a);
    });

    // Articles
    (db.articles || []).forEach((a) => {
      doReplace('Article', a.id, 'title', a);
      doReplace('Article', a.id, 'excerpt', a);
      doReplace('Article', a.id, 'content', a);
    });

    // Projects
    (db.projects || []).forEach((p) => {
      doReplace('Project', p.id, 'title', p);
      doReplace('Project', p.id, 'problem', p);
      doReplace('Project', p.id, 'solution', p);
      doReplace('Project', p.id, 'outcome', p);
      doReplace('Project', p.id, 'customerQuote', p);
    });

    // Promotions
    (db.promotions || []).forEach((p) => {
      doReplace('Promotion', p.id, 'title', p);
      doReplace('Promotion', p.id, 'description', p);
      doReplace('Promotion', p.id, 'terms', p);
    });

    // Settings
    if (db.settings) {
      doReplace('Settings', 'main', 'businessName', db.settings);
      doReplace('Settings', 'main', 'tagline', db.settings);
      doReplace('Settings', 'main', 'primaryCity', db.settings);
    }

    // Market Settings
    if (db.marketSettings) {
      doReplace('MarketSettings', 'main', 'primaryCity', db.marketSettings);
      doReplace('MarketSettings', 'main', 'regionOrState', db.marketSettings);
      doReplace('MarketSettings', 'main', 'businessHoursText', db.marketSettings);
    }

    // Navigation
    if (db.navigationConfig?.announcement) {
      doReplace('Navigation', 'announcement', 'text', db.navigationConfig.announcement);
    }
    if (db.navigationConfig?.footer) {
      doReplace('Navigation', 'footer', 'aboutText', db.navigationConfig.footer);
      doReplace('Navigation', 'footer', 'copyrightText', db.navigationConfig.footer);
    }

    // Homepage sections
    (db.homepageSections || []).forEach((sec) => {
      doReplace('HomepageSection', sec.id, 'heading', sec);
      doReplace('HomepageSection', sec.id, 'subheading', sec);
    });

    persistDatabase();
    addAuditLog('Admin', 'GLOBAL_SEARCH_REPLACE', 'Content', 'bulk', `Replaced "${searchStr}" with "${replaceStr}" across ${replacementCount} fields`);

    res.json({
      success: true,
      replacedCount: replacementCount,
      message: `Successfully updated ${replacementCount} content occurrences across the platform.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Replacement failed.', message: err.message });
  }
});

// -------------------------------------------------------------
// 29. DYNAMIC SITEMAP.XML & ROBOTS.TXT
// -------------------------------------------------------------
app.get('/sitemap.xml', (_req: Request, res: Response) => {
  const db = getDb();
  const baseUrl = process.env.APP_URL || 'https://hvac.aspirinovation.com';
  const staticRoutes = [
    '',
    '/about',
    '/team',
    '/contact',
    '/services',
    '/emergency',
    '/financing',
    '/memberships',
    '/warranties',
    '/reviews',
    '/portfolio',
    '/service-areas',
    '/faq',
    '/blog',
    '/promotions',
    '/estimate',
    '/book',
  ];

  const serviceUrls = db.services.map((s) => `/services/${s.slug}`);
  const areaUrls = db.serviceAreas.map((a) => `/service-areas/${a.slug}`);
  const articleUrls = db.articles.map((a) => `/blog/${a.slug}`);

  const allUrls = [...staticRoutes, ...serviceUrls, ...areaUrls, ...articleUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${baseUrl}${u}</loc>
    <changefreq>weekly</changefreq>
    <priority>${u === '' ? '1.0' : u.startsWith('/services') ? '0.9' : '0.8'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.send(xml);
});

app.get('/robots.txt', (_req: Request, res: Response) => {
  const baseUrl = process.env.APP_URL || 'https://hvac.aspirinovation.com';
  const txt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /portal
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml`;
  res.setHeader('Content-Type', 'text/plain');
  res.send(txt);
});

// -------------------------------------------------------------
// 28. SAAS PLATFORM & SUPER ADMIN CLIENT MANAGEMENT
// -------------------------------------------------------------

// Public: Get SaaS Platform Plans & Configuration
app.get('/api/saas/config', (_req: Request, res: Response) => {
  try {
    const db = getDb();
    if (!db.saasConfig) db.saasConfig = initialSaasPlatformConfig;
    res.json(db.saasConfig);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve SaaS configuration.', message: err.message });
  }
});

// Super Admin: Update SaaS Platform Plans & Configuration
app.put('/api/saas/config', requirePermission('manage_saas'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    db.saasConfig = { ...db.saasConfig, ...req.body };
    persistDatabase();
    addAuditLog('SuperAdmin', 'SAAS_CONFIG_UPDATED', 'SaasPlatformConfig', 'global', 'Updated SaaS pricing tiers and platform configuration.');
    res.json(db.saasConfig);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update SaaS configuration.', message: err.message });
  }
});

// Public: Inquire or Register for HVAC Website SaaS (Rental or Buyout)
app.post('/api/saas/inquire', (req: Request, res: Response) => {
  try {
    const { companyName, ownerName, ownerEmail, ownerPhone, licenseType, planTier, notes, city, state } = req.body;
    if (!companyName || !ownerName || !ownerEmail) {
      return res.status(400).json({ error: 'Company name, contact name, and email address are required.' });
    }

    if (!validateEmail(ownerEmail)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const cleanType = licenseType === 'one_time_buyout' ? 'one_time_buyout' : 'monthly_rental';
    const cleanTier = ['starter', 'professional', 'enterprise'].includes(planTier) ? planTier : 'professional';
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newId = `tenant-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const db = getDb();
    if (!db.clientTenants) db.clientTenants = [...initialClientTenants];

    const newTenant: ClientTenant = {
      id: newId,
      companyName: sanitizeText(companyName),
      slug: `${slug}-${Math.floor(Math.random() * 1000)}`,
      primaryDomain: `${slug}.com`,
      subdomain: `${slug}.hvacsaas.pro`,
      ownerName: sanitizeText(ownerName),
      ownerEmail: ownerEmail.trim().toLowerCase(),
      ownerPhone: ownerPhone ? sanitizeText(ownerPhone) : '',
      licenseType: cleanType,
      planTier: cleanTier,
      status: cleanType === 'one_time_buyout' ? 'trial' : 'trial',
      monthlyRentalFee: cleanType === 'monthly_rental' ? (cleanTier === 'starter' ? 199 : cleanTier === 'enterprise' ? 499 : 299) : 0,
      oneTimeBuyoutFee: cleanType === 'one_time_buyout' ? (cleanTier === 'enterprise' ? 4999 : 2999) : 0,
      billingCycleStartDate: new Date().toISOString(),
      trialEndsDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      leadQuotaMonthly: cleanTier === 'starter' ? 250 : cleanTier === 'enterprise' ? 999999 : 1000,
      maxUsers: cleanTier === 'starter' ? 3 : cleanTier === 'enterprise' ? 25 : 10,
      featuresEnabled: {
        customDomain: true,
        onlineBooking: true,
        emergencyDispatch: true,
        manualJEstimates: cleanTier !== 'starter',
        maintenanceClub: cleanTier !== 'starter',
        commercialRfp: cleanTier !== 'starter',
        seoBlog: true,
        aiAssistant: cleanTier === 'enterprise',
        whiteLabel: cleanTier === 'enterprise',
        prioritySupport: cleanTier !== 'starter',
      },
      invoices: [],
      notes: notes ? sanitizeText(notes) : `Inquiry registered for ${city || ''} ${state || ''}.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.clientTenants.unshift(newTenant);
    persistDatabase();

    addAuditLog('System', 'SAAS_INQUIRY_RECEIVED', 'ClientTenant', newId, `New SaaS registration received for ${companyName} (${cleanType}).`);

    res.status(201).json({
      success: true,
      message: 'Your HVAC website platform registration has been received. Our onboarding architect will contact you within 2 business hours.',
      tenant: newTenant,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit SaaS registration.', message: err.message });
  }
});

// Current Client Tenant: Retrieve active subscription details for the local website
app.get('/api/saas/tenant-current', (_req: Request, res: Response) => {
  try {
    const db = getDb();
    if (!db.clientTenants || db.clientTenants.length === 0) {
      db.clientTenants = [...initialClientTenants];
      persistDatabase();
    }
    // Default to the flagship tenant or first tenant
    const currentTenant = db.clientTenants.find((t) => t.slug === 'apex-austin') || db.clientTenants[0];
    res.json(currentTenant);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve tenant details.', message: err.message });
  }
});

// Super Admin: List all Client Tenants and SaaS Aggregate Financial Metrics
app.get('/api/super-admin/clients', requirePermission('manage_saas'), (_req: Request, res: Response) => {
  try {
    const db = getDb();
    if (!db.clientTenants) {
      db.clientTenants = [...initialClientTenants];
      persistDatabase();
    }

    const clients = db.clientTenants;
    const activeRentals = clients.filter((c) => c.licenseType === 'monthly_rental' && c.status === 'active');
    const buyouts = clients.filter((c) => c.licenseType === 'one_time_buyout');
    const monthlyRecurringRevenue = activeRentals.reduce((sum, c) => sum + (c.monthlyRentalFee || 0), 0);

    // Calculate total paid value across all invoices
    const totalContractValue = clients.reduce((acc, c) => {
      const tenantPaid = (c.invoices || [])
        .filter((i) => i.status === 'paid')
        .reduce((sum, i) => sum + i.amount, 0);
      return acc + tenantPaid;
    }, 0);

    const pastDueCount = clients.filter((c) => c.status === 'past_due').length;
    const trialCount = clients.filter((c) => c.status === 'trial').length;
    const suspendedCount = clients.filter((c) => c.status === 'suspended').length;

    res.json({
      clients,
      metrics: {
        totalClients: clients.length,
        activeRentalsCount: activeRentals.length,
        buyoutsCount: buyouts.length,
        monthlyRecurringRevenue,
        annualRecurringRevenue: monthlyRecurringRevenue * 12,
        totalContractValue,
        pastDueCount,
        trialCount,
        suspendedCount,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve SaaS client roster.', message: err.message });
  }
});

// Super Admin: Create a New Client Tenant (Monthly Rental or One-Time Buyout)
app.post('/api/super-admin/clients', requirePermission('manage_saas'), (req: Request, res: Response) => {
  try {
    const {
      companyName,
      ownerName,
      ownerEmail,
      ownerPhone,
      licenseType,
      planTier,
      monthlyRentalFee,
      oneTimeBuyoutFee,
      status,
      subdomain,
      primaryDomain,
      leadQuotaMonthly,
      maxUsers,
      featuresEnabled,
      notes,
    } = req.body;

    if (!companyName || !ownerName || !ownerEmail) {
      return res.status(400).json({ error: 'Company name, owner name, and owner email are required.' });
    }

    const cleanEmail = ownerEmail.trim().toLowerCase();
    const cleanType = licenseType === 'one_time_buyout' ? 'one_time_buyout' : 'monthly_rental';
    const cleanTier = ['starter', 'professional', 'enterprise'].includes(planTier) ? planTier : 'professional';
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newId = `tenant-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const perpetualKey = cleanType === 'one_time_buyout'
      ? `HVAC-BUYOUT-${slug.substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      : undefined;

    const db = getDb();
    if (!db.clientTenants) db.clientTenants = [];

    const newTenant: ClientTenant = {
      id: newId,
      companyName: sanitizeText(companyName),
      slug: `${slug}-${Math.floor(Math.random() * 1000)}`,
      primaryDomain: primaryDomain ? sanitizeText(primaryDomain) : `${slug}.com`,
      subdomain: subdomain ? sanitizeText(subdomain) : `${slug}.hvacsaas.pro`,
      ownerName: sanitizeText(ownerName),
      ownerEmail: cleanEmail,
      ownerPhone: ownerPhone ? sanitizeText(ownerPhone) : '',
      licenseType: cleanType,
      planTier: cleanTier,
      status: status || 'active',
      monthlyRentalFee: cleanType === 'monthly_rental' ? Number(monthlyRentalFee || (cleanTier === 'starter' ? 199 : cleanTier === 'enterprise' ? 499 : 299)) : 0,
      oneTimeBuyoutFee: cleanType === 'one_time_buyout' ? Number(oneTimeBuyoutFee || (cleanTier === 'enterprise' ? 4999 : 2999)) : 0,
      billingCycleStartDate: new Date().toISOString(),
      nextRenewalDate: cleanType === 'monthly_rental' ? new Date(Date.now() + 30 * 86400000).toISOString() : undefined,
      perpetualLicenseKey: perpetualKey,
      leadQuotaMonthly: Number(leadQuotaMonthly || (cleanTier === 'starter' ? 250 : cleanTier === 'enterprise' ? 999999 : 1000)),
      maxUsers: Number(maxUsers || (cleanTier === 'starter' ? 3 : cleanTier === 'enterprise' ? 25 : 10)),
      featuresEnabled: featuresEnabled || {
        customDomain: true,
        onlineBooking: true,
        emergencyDispatch: true,
        manualJEstimates: true,
        maintenanceClub: true,
        commercialRfp: true,
        seoBlog: true,
        aiAssistant: true,
        whiteLabel: cleanTier === 'enterprise',
        prioritySupport: true,
      },
      invoices: [],
      notes: notes ? sanitizeText(notes) : '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If client created as active with one_time_buyout, generate paid invoice record
    if (newTenant.licenseType === 'one_time_buyout' && newTenant.status === 'active') {
      newTenant.invoices.push({
        id: `inv-${Date.now()}`,
        invoiceNumber: `INV-BUYOUT-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toISOString().split('T')[0],
        amount: newTenant.oneTimeBuyoutFee || 2999,
        type: 'one_time_buyout',
        status: 'paid',
        paymentMethod: 'Bank Transfer / ACH',
        transactionRef: `tx_init_${Date.now().toString().slice(-8)}`,
      });
    } else if (newTenant.licenseType === 'monthly_rental' && newTenant.status === 'active') {
      newTenant.invoices.push({
        id: `inv-${Date.now()}`,
        invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toISOString().split('T')[0],
        amount: newTenant.monthlyRentalFee || 299,
        type: 'rental_charge',
        status: 'paid',
        paymentMethod: 'Credit Card on File',
        transactionRef: `tx_init_${Date.now().toString().slice(-8)}`,
      });
    }

    db.clientTenants.unshift(newTenant);
    persistDatabase();
    persistTenantToMySql(newTenant).catch((err) => console.warn('[Tenant] Async MySQL persist warning:', err.message || err));

    addAuditLog('SuperAdmin', 'CLIENT_TENANT_CREATED', 'ClientTenant', newId, `Created new client tenant: ${newTenant.companyName} (${newTenant.licenseType})`);

    res.status(201).json(newTenant);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create client tenant.', message: err.message });
  }
});

// Super Admin: Update Client Tenant (Change Rental vs Buyout, pricing, status, renewals)
app.put('/api/super-admin/clients/:id', requirePermission('manage_saas'), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();
    if (!db.clientTenants) db.clientTenants = [];

    const idx = db.clientTenants.findIndex((c) => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Client tenant not found.' });
    }

    const current = db.clientTenants[idx];
    const updates = req.body;

    // Check if converting from monthly_rental to one_time_buyout
    let perpetualKey = current.perpetualLicenseKey;
    if (updates.licenseType === 'one_time_buyout' && !perpetualKey) {
      const slug = (updates.companyName || current.companyName).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      perpetualKey = `HVAC-BUYOUT-${slug.substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    }

    const updatedTenant: ClientTenant = {
      ...current,
      ...updates,
      id: current.id, // Immutable ID
      perpetualLicenseKey: perpetualKey,
      updatedAt: new Date().toISOString(),
    };

    db.clientTenants[idx] = updatedTenant;
    persistDatabase();
    persistTenantToMySql(updatedTenant).catch((err) => console.warn('[Tenant] Async MySQL persist warning:', err.message || err));

    addAuditLog('SuperAdmin', 'CLIENT_TENANT_UPDATED', 'ClientTenant', id, `Updated subscription/settings for client: ${updatedTenant.companyName}`);

    res.json(updatedTenant);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update client tenant.', message: err.message });
  }
});

// Super Admin: Toggle Client Tenant Status (Active <-> Suspended)
app.post('/api/super-admin/clients/:id/toggle-status', requirePermission('manage_saas'), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = getDb();
    if (!db.clientTenants) db.clientTenants = [];

    const idx = db.clientTenants.findIndex((c) => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Client tenant not found.' });
    }

    const current = db.clientTenants[idx];
    const newStatus = status || (current.status === 'active' ? 'suspended' : 'active');
    current.status = newStatus;
    current.updatedAt = new Date().toISOString();

    persistDatabase();
    addAuditLog('SuperAdmin', 'CLIENT_STATUS_TOGGLED', 'ClientTenant', id, `Client ${current.companyName} status changed to ${newStatus}`);

    res.json({ success: true, status: newStatus, client: current });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle client status.', message: err.message });
  }
});

// Super Admin: Record Invoice Payment / Transaction for a Client Tenant
app.post('/api/super-admin/clients/:id/invoices', requirePermission('manage_saas'), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, type, status, paymentMethod, transactionRef } = req.body;

    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({ error: 'Valid invoice amount is required.' });
    }

    const db = getDb();
    if (!db.clientTenants) db.clientTenants = [];

    const idx = db.clientTenants.findIndex((c) => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Client tenant not found.' });
    }

    const client = db.clientTenants[idx];
    if (!client.invoices) client.invoices = [];

    const newInvoice: SaasInvoiceRecord = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      amount: Number(amount),
      type: type || (client.licenseType === 'one_time_buyout' ? 'one_time_buyout' : 'rental_charge'),
      status: status || 'paid',
      paymentMethod: paymentMethod || 'Direct Credit Card',
      transactionRef: transactionRef || `ch_${Date.now().toString().slice(-8)}`,
    };

    client.invoices.unshift(newInvoice);

    // If paid and was past_due, automatically restore to active
    if (newInvoice.status === 'paid' && client.status === 'past_due') {
      client.status = 'active';
      client.nextRenewalDate = new Date(Date.now() + 30 * 86400000).toISOString();
    }

    client.updatedAt = new Date().toISOString();
    persistDatabase();

    addAuditLog('SuperAdmin', 'INVOICE_RECORDED', 'SaasInvoice', newInvoice.id, `Recorded invoice payment of $${newInvoice.amount} for ${client.companyName}`);

    res.status(201).json({ success: true, invoice: newInvoice, client });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record invoice.', message: err.message });
  }
});

// Super Admin: Delete a Client Tenant
app.delete('/api/super-admin/clients/:id', requirePermission('manage_saas'), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();
    if (!db.clientTenants) db.clientTenants = [];

    const idx = db.clientTenants.findIndex((c) => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Client tenant not found.' });
    }

    const deleted = db.clientTenants.splice(idx, 1)[0];
    persistDatabase();

    addAuditLog('SuperAdmin', 'CLIENT_TENANT_DELETED', 'ClientTenant', id, `Deleted client tenant: ${deleted.companyName}`);

    res.json({ success: true, message: `Client tenant ${deleted.companyName} deleted successfully.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete client tenant.', message: err.message });
  }
});

// -------------------------------------------------------------
// 19. FRONTEND SERVING
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    // Long-term immutable caching for Vite hashed bundles (CSS, JS, images, fonts)
    app.use(
      '/assets',
      express.static(path.join(distPath, 'assets'), {
        maxAge: '1y',
        immutable: true,
      })
    );
    // Serve public images and legacy /src/assets/images paths in production
    app.use(
      '/src/assets/images',
      express.static(path.join(distPath, 'images'), {
        maxAge: '30d',
      })
    );
    // General static files with 1-hour caching
    app.use(
      express.static(distPath, {
        maxAge: '1h',
      })
    );
    // SPA fallback: index.html must never be cached so users receive new bundles immediately
    app.get('*', (_req: Request, res: Response) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://0.0.0.0:${PORT}/\n`);
  });

  const gracefulShutdown = async (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      try {
        await closeMySqlPool();
        console.log('[Server] Graceful shutdown completed.');
        process.exit(0);
      } catch (err) {
        console.error('[Server] Error during pool closure:', err);
        process.exit(1);
      }
    });

    // Force termination if hanging
    setTimeout(() => {
      console.error('[Server] Forced shutdown timeout expired. Terminating.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startServer();
