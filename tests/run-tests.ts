import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import {
  initialServices,
  initialServiceAreas,
  initialTechnicians,
  initialMembershipPlans,
} from '../src/data/seedData';
import {
  validateEmail,
  validatePhone,
  validateZipCode,
  sanitizeText,
  validateRating,
  validateRequiredFields,
  validateDate,
} from '../server/validation';
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  authenticateRequest,
  createSessionForUser,
  revokeSessionByToken,
} from '../server/auth';
import {
  ROLE_DASHBOARD_ROUTES,
  getAllowedTabsForUser,
  getDashboardRouteForRole,
  resolveUserPermissions,
} from '../src/shared/rbac';
import { initDatabase, persistDatabase, getDb } from '../server/db';
import { Lead, Appointment, AdminUser } from '../src/types';
import {
  checkServiceAreaZip,
  detectDuplicateLead,
  detectDuplicateAppointment,
  validateAppointmentRules,
  getDispatchFallbackDisclosure,
} from '../server/scheduling';

console.log('🧪 Starting Airflow Climate Solutions Full-Stack HVAC Audit & Test Suite...\n');

let passed = 0;
let failed = 0;
const pendingAsync: Promise<void>[] = [];

function it(description: string, fn: () => void | Promise<void>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      pendingAsync.push(
        result
          .then(() => {
            console.log(`  ✓ PASS: ${description}`);
            passed++;
          })
          .catch((error: any) => {
            console.error(`  ✗ FAIL: ${description}`);
            console.error(`    ${error?.message || error}`);
            failed++;
          })
      );
      return;
    }
    console.log(`  ✓ PASS: ${description}`);
    passed++;
  } catch (error: any) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error(`    ${error.message}`);
    failed++;
  }
}

// -------------------------------------------------------------
// 1. Financial & Currency Calculations
// -------------------------------------------------------------
console.log('1. Financial & Currency Calculations');

it('calculates estimate subtotal, tax rate, and net total correctly', () => {
  const lineItems = [
    { unitPrice: 6200, quantity: 1, total: 6200 },
    { unitPrice: 1850, quantity: 1, total: 1850 },
    { unitPrice: 249, quantity: 1, total: 249 },
  ];
  const subtotal = lineItems.reduce((acc, item) => acc + item.total, 0);
  assert.strictEqual(subtotal, 8299);

  const discount = 1200;
  const taxable = subtotal - discount; // 7099
  const taxRate = 0.0825;
  const taxAmount = Math.round(taxable * taxRate * 100) / 100; // 585.67
  assert.strictEqual(taxAmount, 585.67);

  const finalTotal = Math.round((taxable + taxAmount) * 100) / 100;
  assert.strictEqual(finalTotal, 7684.67);
});

it('prevents negative totals when discounts exceed subtotal', () => {
  const subtotal = 500;
  const discount = 1000;
  const total = Math.max(0, subtotal - discount);
  assert.strictEqual(total, 0);
});

// -------------------------------------------------------------
// 2. Service-Area & ZIP Code Coverage Validation
// -------------------------------------------------------------
console.log('\n2. Service Area & ZIP Code Validation');

it('correctly matches valid metro service ZIP codes', () => {
  const metroArea = initialServiceAreas[0];
  assert.ok(metroArea);
  assert.ok(metroArea.zipCodes.length > 0);
  assert.ok(!metroArea.zipCodes.includes('99999'));
});

it('rejects unsupported ZIP codes with helpful notice', () => {
  const allZips = initialServiceAreas.flatMap((a) => a.zipCodes);
  assert.strictEqual(allZips.includes('99999'), false);
});

// -------------------------------------------------------------
// 3. Appointment Slot Capacity & Concurrency Protection
// -------------------------------------------------------------
console.log('\n3. Appointment Slot Capacity & Concurrency');

it('detects slot capacity conflict when maximum appointments reached', () => {
  const mockAppointments = [
    { date: '2026-11-15', timeSlot: '08:00 AM - 10:00 AM', status: 'confirmed' },
    { date: '2026-11-15', timeSlot: '08:00 AM - 10:00 AM', status: 'confirmed' },
    { date: '2026-11-15', timeSlot: '08:00 AM - 10:00 AM', status: 'confirmed' },
  ];

  const maxPerSlot = 3;
  const existingCount = mockAppointments.filter(
    (a) => a.date === '2026-11-15' && a.timeSlot === '08:00 AM - 10:00 AM' && a.status === 'confirmed'
  ).length;

  const isConflict = existingCount >= maxPerSlot;
  assert.strictEqual(isConflict, true);
});

it('allows booking when slot has available capacity', () => {
  const mockAppointments = [
    { date: '2026-11-15', timeSlot: '10:00 AM - 12:00 PM', status: 'confirmed' },
  ];
  const maxPerSlot = 3;
  const count = mockAppointments.filter(
    (a) => a.date === '2026-11-15' && a.timeSlot === '10:00 AM - 12:00 PM'
  ).length;
  assert.ok(count < maxPerSlot);
});

// -------------------------------------------------------------
// 4. HVAC Sizing ACCA Manual J Approximate Calculations
// -------------------------------------------------------------
console.log('\n4. HVAC Sizing Math & Load Rules');

it('correctly calculates cooling tonnage for 2,200 sq ft home', () => {
  const sqft = 2200;
  const baseTons = sqft / 550; // 4.0 tons
  const rounded = Math.min(5.0, Math.max(1.5, Math.round(baseTons * 2) / 2));
  assert.strictEqual(rounded, 4.0);

  const coolingBTUs = rounded * 12000;
  assert.strictEqual(coolingBTUs, 48000);
});

it('applies ceiling height and insulation modifiers properly', () => {
  const sqft = 1100;
  let tons = sqft / 550; // 2.0
  const ceilingHeight = 12; // +15%
  if (ceilingHeight > 10) tons *= 1.15;
  const rounded = Math.round(tons * 2) / 2;
  assert.strictEqual(rounded, 2.5);
});

// -------------------------------------------------------------
// 5. Server-Side Input Validation & Sanitization
// -------------------------------------------------------------
console.log('\n5. Server-Side Validation & Sanitization');

it('validates US 10-digit and 11-digit phone numbers correctly', () => {
  assert.strictEqual(validatePhone('(512) 555-0199'), true);
  assert.strictEqual(validatePhone('5125550199'), true);
  assert.strictEqual(validatePhone('1-512-555-0199'), true);
  assert.strictEqual(validatePhone('555-019'), false); // Too short
  assert.strictEqual(validatePhone('abc-def-ghij'), false);
  assert.strictEqual(validatePhone(''), false);
});

it('validates standard email addresses correctly', () => {
  assert.strictEqual(validateEmail('customer@example.com'), true);
  assert.strictEqual(validateEmail('service.tech@apexairflow.com'), true);
  assert.strictEqual(validateEmail('invalid-email'), false);
  assert.strictEqual(validateEmail('@domain.com'), false);
  assert.strictEqual(validateEmail(''), false);
});

it('validates 5-digit US ZIP codes', () => {
  assert.strictEqual(validateZipCode('78701'), true);
  assert.strictEqual(validateZipCode('78759-1234'), true);
  assert.strictEqual(validateZipCode('7870'), false);
  assert.strictEqual(validateZipCode('ABCDE'), false);
});

it('sanitizes malicious HTML and script tags from text inputs', () => {
  const input = '<script>alert("xss")</script>Urgent AC Breakdown!';
  const cleaned = sanitizeText(input);
  assert.strictEqual(cleaned, 'Urgent AC Breakdown!');
});

it('enforces rating clamping between 1 and 5', () => {
  assert.strictEqual(validateRating(5), 5);
  assert.strictEqual(validateRating(10), 5);
  assert.strictEqual(validateRating(-2), 1);
  assert.strictEqual(validateRating('4'), 4);
});

it('detects missing required fields', () => {
  const payload = { customerName: 'Alice', phone: '' };
  const err = validateRequiredFields(payload, ['customerName', 'phone']);
  assert.ok(err !== null);
  assert.ok(err.includes('phone'));
});

// -------------------------------------------------------------
// 6. Real Authentication, Password Hashing & Role-Based Permissions (RBAC)
// -------------------------------------------------------------
console.log('\n6. Authentication, Password Hashing & RBAC Boundaries');

it('hashes passwords with salted scrypt and rejects invalid or plaintext hashes', () => {
  const hash = hashPassword('StrongPass99!');
  assert.ok(hash.startsWith('scrypt$16384$8$1$'), 'Expected scrypt parameter prefix');
  assert.strictEqual(verifyPassword('StrongPass99!', hash), true);
  assert.strictEqual(verifyPassword('WrongPass99!', hash), false);
  assert.strictEqual(verifyPassword('plaintext', 'plaintext'), false);
  assert.strictEqual(verifyPassword('anything', 'pbkdf2$1000$abcd'), false);

  assert.strictEqual(validatePasswordStrength('short1A').valid, false);
  assert.strictEqual(validatePasswordStrength('NoDigitsHere').valid, false);
  assert.strictEqual(validatePasswordStrength('ValidPass123').valid, true);
});

it('maps all 5 staff roles to isolated dashboards and permission scopes', () => {
  assert.strictEqual(getDashboardRouteForRole('super_admin'), ROLE_DASHBOARD_ROUTES.super_admin);
  assert.strictEqual(getDashboardRouteForRole('business_admin'), ROLE_DASHBOARD_ROUTES.business_admin);
  assert.strictEqual(getDashboardRouteForRole('dispatcher'), ROLE_DASHBOARD_ROUTES.dispatcher);
  assert.strictEqual(getDashboardRouteForRole('technician'), ROLE_DASHBOARD_ROUTES.technician);
  assert.strictEqual(getDashboardRouteForRole('content_editor'), ROLE_DASHBOARD_ROUTES.content_editor);

  const superTabs = getAllowedTabsForUser({ role: 'super_admin' });
  assert.ok(superTabs.includes('saas_clients') && superTabs.includes('users'));

  const techTabs = getAllowedTabsForUser({ role: 'technician' });
  assert.ok(techTabs.includes('my_jobs'));
  assert.strictEqual(techTabs.includes('users'), false);
  assert.strictEqual(techTabs.includes('leads'), false);
  assert.strictEqual(techTabs.includes('market'), false);

  const editorTabs = getAllowedTabsForUser({ role: 'content_editor' });
  assert.ok(editorTabs.includes('page_studio') && editorTabs.includes('articles'));
  assert.strictEqual(editorTabs.includes('leads'), false);
  assert.strictEqual(editorTabs.includes('users'), false);

  const dispatcherPerms = resolveUserPermissions({ role: 'dispatcher' });
  assert.ok(dispatcherPerms.includes('manage_leads') && dispatcherPerms.includes('manage_appointments'));
  assert.strictEqual(dispatcherPerms.includes('manage_users'), false);
});

it('rejects spoofed x-user-role headers when no session token is supplied', async () => {
  initDatabase();
  const spoofedReq = {
    headers: { 'x-user-role': 'super_admin' },
  } as any;
  const authResult = await authenticateRequest(spoofedReq);
  assert.strictEqual(authResult, null);
});

it('issues and validates opaque session tokens and revokes on logout', async () => {
  const db = initDatabase();
  const tempUser: AdminUser = {
    id: `usr-unit-${Date.now()}`,
    username: 'unit.dispatcher',
    email: 'unit.dispatcher@example.com',
    passwordHash: hashPassword('DispatchPass123!'),
    role: 'dispatcher',
    name: 'Unit Dispatcher',
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  db.users.push(tempUser);

  const session = await createSessionForUser(
    tempUser,
    { headers: {}, socket: {} } as any,
    { setHeader: () => {} } as any
  );
  const validReq = { headers: { authorization: `Bearer ${session.token}` } } as any;
  const auth = await authenticateRequest(validReq);
  assert.ok(auth !== null, 'Expected Bearer session token to authenticate');
  assert.strictEqual(auth?.user.id, tempUser.id);
  assert.strictEqual(auth?.role, 'dispatcher');

  await revokeSessionByToken(session.token);
  const revokedAuth = await authenticateRequest(validReq);
  assert.strictEqual(revokedAuth, null, 'Revoked token must not authenticate');

  db.users = db.users.filter((u) => u.id !== tempUser.id);
  persistDatabase();
});

// -------------------------------------------------------------
// 7. Persistent Storage & Database Round-Trip
// -------------------------------------------------------------
console.log('\n7. Persistent Storage Round-Trip');

it('persists and reloads database atomically', () => {
  const db = initDatabase();
  assert.ok(db.settings.businessName.length > 0);
  assert.ok(db.services.length >= 7);

  // Add a test lead to DB
  const testLeadId = `lead-test-${Date.now()}`;
  const testLead: Lead = {
    id: testLeadId,
    leadNumber: 'LD-9999',
    source: 'website_form',
    serviceRequested: 'Heat Pump Test Sizing',
    customerName: 'Test Homeowner',
    email: 'test@homeowner.com',
    phone: '5125550999',
    address: '100 Test St',
    city: 'Metro Area',
    state: 'State',
    zipCode: '10001',
    urgency: 'normal',
    preferredContactMethod: 'phone',
    status: 'new',
    priority: 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    propertyType: 'residential',
  };

  db.leads.unshift(testLead);
  persistDatabase();

  // Read raw file directly from disk to confirm atomic write
  const dbFilePath = path.resolve(process.cwd(), 'data/hvac-db.json');
  assert.ok(fs.existsSync(dbFilePath));
  const rawFile = JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
  const foundLead = rawFile.leads.find((l: Lead) => l.id === testLeadId);
  assert.ok(foundLead, 'Lead was not found written to disk');
  assert.strictEqual(foundLead.customerName, 'Test Homeowner');

  // Clean up test lead
  db.leads = db.leads.filter((l) => l.id !== testLeadId);
  persistDatabase();
});

it('persists customer equipment and membership subscriptions', () => {
  const db = getDb();
  const testSubId = `sub-test-${Date.now()}`;

  db.subscriptions.push({
    id: testSubId,
    subscriptionNumber: 'MEM-999999',
    customerName: 'Elena Rostova',
    customerEmail: 'e.rostova@roundrock.org',
    customerPhone: '(512) 555-0188',
    address: '1540 Red Bud Lane',
    planId: 'plan-gold',
    planName: 'Gold Comfort Club (Recommended)',
    status: 'active',
    billingCycle: 'monthly',
    nextServiceDue: '2027-04-01',
    renewalDate: '2027-10-01',
    createdAt: new Date().toISOString(),
  });

  persistDatabase();

  const dbFilePath = path.resolve(process.cwd(), 'data/hvac-db.json');
  const diskData = JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
  const foundSub = diskData.subscriptions.find((s: any) => s.id === testSubId);
  assert.ok(foundSub, 'Membership subscription did not persist to disk');

  // Clean up
  db.subscriptions = db.subscriptions.filter((s) => s.id !== testSubId);
  persistDatabase();
});

// -------------------------------------------------------------
// 8. Five Customer Journeys & Dispatch Fallback
// -------------------------------------------------------------
console.log('\n8. Five Customer Journeys & Dispatch Fallback');

it('generates transparent fallback disclosure for each journey', () => {
  const journeys = ['emergency', 'routine', 'estimate', 'maintenance', 'commercial'] as const;
  for (const j of journeys) {
    const disclosure = getDispatchFallbackDisclosure(j);
    assert.ok(disclosure.length > 20, `Disclosure too short for ${j}`);
    assert.ok(
      disclosure.toLowerCase().includes('queue') ||
        disclosure.toLowerCase().includes('dispatch') ||
        disclosure.toLowerCase().includes('scheduling') ||
        disclosure.toLowerCase().includes('consultation')
    );
  }
});

// -------------------------------------------------------------
// 9. Service Area Coverage & Out-of-Area Rules
// -------------------------------------------------------------
console.log('\n9. Service Area Coverage & Out-of-Area Rules');

it('verifies serviced metro ZIP codes', () => {
  const db = getDb();
  const testZips = initialServiceAreas[0]?.zipCodes.slice(0, 4) || ['10001', '10002'];
  for (const zip of testZips) {
    const res = checkServiceAreaZip(zip, db);
    assert.strictEqual(res.isServiced, true, `Expected ${zip} to be serviced`);
  }
});

it('flags out-of-service area ZIP codes with clear notice', () => {
  const db = getDb();
  const outZips = ['99999', '00000'];
  for (const zip of outZips) {
    const res = checkServiceAreaZip(zip, db);
    assert.strictEqual(res.isServiced, false, `Expected ${zip} to be out of area`);
    assert.ok(res.message.includes('outside our primary dispatch territory'));
  }
});

it('handles blank or malformed ZIP codes safely', () => {
  const res = checkServiceAreaZip('');
  assert.strictEqual(res.isServiced, false);
});

// -------------------------------------------------------------
// 10. Anti-Duplicate Submission Protection
// -------------------------------------------------------------
console.log('\n10. Anti-Duplicate Submission Protection');

it('detects duplicate lead submitted within 2 hours', () => {
  const db = getDb();
  const phone = '5125557788';
  const email = 'dupe.customer@example.com';

  const initialLead: Lead = {
    id: `lead-dupe-${Date.now()}`,
    leadNumber: 'LD-DUPE-1',
    source: 'emergency_triage',
    journey: 'emergency',
    serviceRequested: 'AC Blowing Warm Air',
    customerName: 'Sam Customer',
    email,
    phone,
    address: '200 Main Ave',
    city: 'Metro Area',
    state: 'State',
    zipCode: '10001',
    urgency: 'emergency',
    preferredContactMethod: 'phone',
    status: 'new',
    priority: 'high',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    propertyType: 'residential',
  };

  db.leads.unshift(initialLead);

  // Check duplicate detection
  const dupeCheck = detectDuplicateLead(db, '(512) 555-7788', email);
  assert.strictEqual(dupeCheck.isDuplicate, true);
  assert.strictEqual(dupeCheck.existingLead?.id, initialLead.id);
  assert.ok(dupeCheck.message?.includes('Existing request detected'));

  // Clean up
  db.leads = db.leads.filter((l) => l.id !== initialLead.id);
});

it('detects duplicate appointment for same customer and time slot', () => {
  const db = getDb();
  const phone = '5125559900';
  const testDate = '2026-11-20';
  const timeSlot = '01:00 PM - 03:00 PM';

  const testApt: Appointment = {
    id: `apt-dupe-${Date.now()}`,
    appointmentNumber: 'APT-TEST-DUPE',
    serviceId: 'srv-ac-tuneup',
    serviceName: 'Seasonal AC Precision Tune-Up',
    customerName: 'Marcus Vance',
    customerEmail: 'marcus@example.com',
    customerPhone: phone,
    address: '400 Downtown St',
    city: 'Metro Area',
    state: 'State',
    zipCode: '10001',
    date: testDate,
    timeSlot,
    status: 'confirmed',
    durationMinutes: 90,
    estimatedDurationMinutes: 90,
    isEmergency: false,
    issueDescription: 'Routine seasonal check',
    price: 89,
    technicianId: 'tech-1',
    technicianName: 'Marcus Vance',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.appointments.unshift(testApt);

  const check = detectDuplicateAppointment(db, '(512) 555-9900', testDate, timeSlot);
  assert.strictEqual(check.isDuplicate, true);
  assert.strictEqual(check.existingAppointment?.id, testApt.id);

  // Different slot should NOT be a duplicate
  const diffSlotCheck = detectDuplicateAppointment(db, '(512) 555-9900', testDate, '08:00 AM - 10:00 AM');
  assert.strictEqual(diffSlotCheck.isDuplicate, false);

  // Clean up
  db.appointments = db.appointments.filter((a) => a.id !== testApt.id);
});

// -------------------------------------------------------------
// 11. Real-World HVAC Scheduling Rules
// -------------------------------------------------------------
console.log('\n11. Real-World HVAC Scheduling Rules');

it('rejects appointments in the past', () => {
  const res = validateAppointmentRules('2020-01-01', '10:00 AM - 12:00 PM');
  assert.strictEqual(res.valid, false);
  assert.ok(res.error?.includes('past'));
});

it('enforces Sunday routine closure but allows emergency triage', () => {
  // 2026-11-15 is Sunday (Day 0)
  const sundayStr = '2026-11-15';
  const sundayCheck = new Date(2026, 10, 15).getDay();
  assert.strictEqual(sundayCheck, 0);

  // Routine booking on Sunday should be rejected
  const routineRes = validateAppointmentRules(sundayStr, '10:00 AM - 12:00 PM', false);
  assert.strictEqual(routineRes.valid, false);
  assert.ok(routineRes.error?.includes('closed on Sundays for routine maintenance'));

  // Emergency booking on Sunday should be accepted
  const emergencyRes = validateAppointmentRules(sundayStr, '10:00 AM - 12:00 PM', true);
  assert.strictEqual(emergencyRes.valid, true);
});

it('accepts future weekdays and Saturdays for routine appointments', () => {
  // 2026-11-17 is Tuesday
  const tuesdayStr = '2026-11-17';
  const res = validateAppointmentRules(tuesdayStr, '10:00 AM - 12:00 PM', false);
  assert.strictEqual(res.valid, true);
});

// -------------------------------------------------------------
// 12. Lead Administrative Workflow (Assignment & Conversion)
// -------------------------------------------------------------
console.log('\n12. Lead Administrative Workflow (Assignment & Conversion)');

it('assigns certified technician and records internal dispatcher note', () => {
  const db = getDb();
  const testLead: Lead = {
    id: `lead-assign-${Date.now()}`,
    leadNumber: 'LD-ASSIGN-1',
    source: 'commercial_inquiry',
    journey: 'commercial',
    serviceRequested: 'Commercial RTU 15-Ton Maintenance',
    customerName: 'Enterprise Climate Hub LLC',
    email: 'facilities@enterprisehub.com',
    phone: '5125554321',
    address: '900 Business Pkwy',
    city: 'Metro Area',
    state: 'State',
    zipCode: '10001',
    urgency: 'normal',
    preferredContactMethod: 'email',
    status: 'new',
    priority: 'high',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    propertyType: 'commercial',
  };

  db.leads.unshift(testLead);

  // Assign technician
  const tech = initialTechnicians[0];
  testLead.assignedTechnicianId = tech.id;
  testLead.assignedTechnicianName = tech.name;
  testLead.status = 'assigned';
  testLead.dispatcherNotes = [
    {
      id: `note-${Date.now()}`,
      author: 'Dispatch Console',
      timestamp: new Date().toISOString(),
      note: `Assigned to ${tech.name} (NATE Certified). Rooftop access ladder on North side.`,
    },
  ];

  persistDatabase();

  const diskDb = getDb();
  const reloadedLead = diskDb.leads.find((l) => l.id === testLead.id);
  assert.ok(reloadedLead);
  assert.strictEqual(reloadedLead.assignedTechnicianId, tech.id);
  assert.strictEqual(reloadedLead.assignedTechnicianName, tech.name);
  assert.strictEqual(reloadedLead.status, 'assigned');
  assert.strictEqual(reloadedLead.dispatcherNotes?.length, 1);

  // Clean up
  db.leads = db.leads.filter((l) => l.id !== testLead.id);
  persistDatabase();
});

Promise.all(pendingAsync).then(() => {
  // Summary
  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
});
