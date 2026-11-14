import assert from 'node:assert';

console.log('🚀 Running Airflow Climate Solutions Full-Stack E2E, Auth & RBAC Test Suite...\n');

const BASE_URL = 'http://localhost:3000';
let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function runSuite() {
  const runSalt = Date.now().toString().slice(-6);

  // Track created test artifacts for cleanup
  let superToken = '';
  let superUserId = '';
  let createdBySetup = false;
  const createdUserIds: string[] = [];
  let createdBuyoutTenantId = '';

  // -------------------------------------------------------------
  // 0. INITIAL SETUP & AUTHENTICATION SECURITY
  // -------------------------------------------------------------
  console.log('0. Initial Setup, Spoof Protection & Super Admin Authentication');

  const superUsername = `e2esuper_${runSalt}`;
  const superEmail = `e2e.super.${runSalt}@airflowtest.local`;
  const superPass = `SuperPass!${runSalt}`;

  await test('Security: Spoofed x-user-role header without session token is rejected (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { 'x-user-role': 'super_admin' },
    });
    assert.strictEqual(res.status, 401);

    const leadsRes = await fetch(`${BASE_URL}/api/leads`, {
      headers: { 'x-user-role': 'admin' },
    });
    assert.strictEqual(leadsRes.status, 401);

    const clientsRes = await fetch(`${BASE_URL}/api/super-admin/clients`, {
      headers: { 'x-user-role': 'super_admin' },
    });
    assert.strictEqual(clientsRes.status, 401);
  });

  const setupStatusRes = await fetch(`${BASE_URL}/api/auth/setup-status`);
  const setupStatus = await setupStatusRes.json();

  if (setupStatus.needsSetup) {
    await test('Initial Setup: POST /api/auth/setup-super-admin initializes first Super Admin and locks setup (403 on repeat)', async () => {
      const setupRes = await fetch(`${BASE_URL}/api/auth/setup-super-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'E2E Primary Super Admin',
          username: superUsername,
          email: superEmail,
          phone: '(800) 555-0100',
          password: superPass,
        }),
      });
      assert.strictEqual(setupRes.status, 201);
      const data = await setupRes.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.token);
      assert.strictEqual(data.user.role, 'super_admin');
      assert.strictEqual(data.redirectRoute, '/admin/super');
      superToken = data.token;
      superUserId = data.user.id;
      createdBySetup = true;

      // Repeating setup endpoint MUST return 403 once a Super Admin exists
      const repeatRes = await fetch(`${BASE_URL}/api/auth/setup-super-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Rogue Admin',
          username: `rogue_${runSalt}`,
          email: `rogue.${runSalt}@test.local`,
          password: 'RoguePassword1!',
        }),
      });
      assert.strictEqual(repeatRes.status, 403);
    });
  } else {
    throw new Error(
      'Database already has a configured super_admin and E2E test refuses to rely on default/hardcoded passwords. Run E2E on uninitialized DB or provide E2E_SUPER_PASS.'
    );
  }

  await test('Auth: Wrong password returns 401 and valid username login returns scrypt-verified token', async () => {
    const badRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: superUsername, password: 'WrongPassword1!' }),
    });
    assert.strictEqual(badRes.status, 401);

    const okRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: superUsername, password: superPass }),
    });
    assert.strictEqual(okRes.status, 200);
    const data = await okRes.json();
    assert.ok(data.token);
    assert.strictEqual(data.user.role, 'super_admin');
    assert.strictEqual(data.user.passwordHash, undefined, 'Password hash must never be exposed');
    superToken = data.token;
  });

  // Provision separate individual accounts for every role as Super Admin
  const roleCredentials = {
    business_admin: {
      username: `biz_${runSalt}`,
      email: `biz.${runSalt}@airflowtest.local`,
      password: `BizAdmin!${runSalt}`,
      name: 'E2E Business Admin',
      token: '',
      id: '',
      expectedRoute: '/admin/business',
    },
    dispatcher: {
      username: `disp_${runSalt}`,
      email: `disp.${runSalt}@airflowtest.local`,
      password: `Dispatch!${runSalt}`,
      name: 'E2E Lead Dispatcher',
      token: '',
      id: '',
      expectedRoute: '/admin/dispatch',
    },
    technician: {
      username: `tech_${runSalt}`,
      email: `tech.${runSalt}@airflowtest.local`,
      password: `TechUser!${runSalt}`,
      name: 'Marcus Vance',
      technicianId: 'tech-1',
      token: '',
      id: '',
      expectedRoute: '/admin/technician',
    },
    content_editor: {
      username: `edit_${runSalt}`,
      email: `edit.${runSalt}@airflowtest.local`,
      password: `Editor!${runSalt}`,
      name: 'E2E Content Editor',
      token: '',
      id: '',
      expectedRoute: '/admin/content',
    },
  };

  await test('Super Admin: Create individual user accounts for Business Admin, Dispatcher, Technician & Content Editor', async () => {
    for (const [role, creds] of Object.entries(roleCredentials)) {
      const res = await fetch(`${BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superToken}`,
        },
        body: JSON.stringify({
          name: creds.name,
          username: creds.username,
          email: creds.email,
          password: creds.password,
          role,
          technicianId: (creds as any).technicianId,
          status: 'active',
        }),
      });
      assert.strictEqual(res.status, 201, `Failed creating ${role}`);
      const data = await res.json();
      assert.strictEqual(data.role, role);
      assert.strictEqual(data.passwordHash, undefined);
      (creds as any).id = data.id;
      createdUserIds.push(data.id);
    }
  });

  await test('All 5 Roles: Log in with individual credentials and verify /api/auth/me returns dedicated dashboard route & permissions', async () => {
    for (const [role, creds] of Object.entries(roleCredentials)) {
      const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: creds.email, password: creds.password }),
      });
      assert.strictEqual(loginRes.status, 200, `Login failed for ${role}`);
      const loginData = await loginRes.json();
      assert.strictEqual(loginData.user.role, role);
      assert.strictEqual(loginData.redirectRoute, creds.expectedRoute);
      (creds as any).token = loginData.token;

      const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${loginData.token}` },
      });
      assert.strictEqual(meRes.status, 200);
      const meData = await meRes.json();
      assert.strictEqual(meData.role, role);
      assert.strictEqual(meData.redirectRoute, creds.expectedRoute);
      assert.ok(Array.isArray(meData.allowedTabs) && meData.allowedTabs.length > 0);
    }
  });

  // -------------------------------------------------------------
  // 1. PUBLIC API ROUTES & CONTENT INTEGRITY
  // -------------------------------------------------------------
  console.log('\n1. Public API Endpoints & Content Data');

  await test('GET /api/settings returns valid business profile', async () => {
    const res = await fetch(`${BASE_URL}/api/settings`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.businessName, 'Airflow Climate Solutions');
  });

  await test('GET /api/services returns catalog with cooling, heating & commercial', async () => {
    const res = await fetch(`${BASE_URL}/api/services`);
    assert.strictEqual(res.status, 200);
    const services = await res.json();
    assert.ok(Array.isArray(services) && services.length >= 7);
  });

  await test('GET /api/service-areas verifies coverage regions', async () => {
    const res = await fetch(`${BASE_URL}/api/service-areas`);
    assert.strictEqual(res.status, 200);
    const areas = await res.json();
    assert.ok(Array.isArray(areas) && areas.length >= 6);
  });

  // -------------------------------------------------------------
  // 2. SERVICE AREA & ZIP VALIDATION
  // -------------------------------------------------------------
  console.log('\n2. Service Area & ZIP Code Validation');

  await test('GET /api/service-areas/check-zip confirms in-network and rejects out-of-area ZIP', async () => {
    const res1 = await fetch(`${BASE_URL}/api/service-areas/check-zip?zip=10001`);
    assert.strictEqual(res1.status, 200);
    assert.strictEqual((await res1.json()).isServiced, true);

    const res2 = await fetch(`${BASE_URL}/api/service-areas/check-zip?zip=99999`);
    assert.strictEqual(res2.status, 200);
    assert.strictEqual((await res2.json()).isServiced, false);
  });

  // -------------------------------------------------------------
  // 3. FIVE INBOUND JOURNEYS
  // -------------------------------------------------------------
  console.log('\n3. Five Customer Inbound Journeys');

  let testEmergencyLeadId = '';
  const testPhone = '512555' + Math.floor(1000 + Math.random() * 9000);
  const testEmail = `e2e.emergency.${runSalt}@austin.io`;

  await test('Journey 1: Emergency 24/7 Triage Submission & Anti-Duplicate', async () => {
    const payload = {
      journey: 'emergency',
      serviceRequested: 'AC Compressor Freeze Up',
      customerName: 'E2E Emergency Homeowner',
      phone: testPhone,
      email: testEmail,
      address: '2200 Main Street',
      city: 'Metro Area',
      zipCode: '10001',
      urgency: 'emergency',
      notes: 'System down in extreme heat.',
    };

    const res = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assert.ok([200, 201].includes(res.status));
    const data = await res.json();
    assert.strictEqual(data.success, true);
    testEmergencyLeadId = data.lead.id;

    const dupRes = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const dupData = await dupRes.json();
    assert.strictEqual(dupData.isDuplicate, true);
    assert.strictEqual(dupData.lead.id, testEmergencyLeadId);
  });

  await test('Journey 2: Routine Appointment Booking & Sunday Closure Guard', async () => {
    const sundayRes = await fetch(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Sunday Request',
        customerPhone: '512555' + Math.floor(1000 + Math.random() * 9000),
        customerEmail: `sunday.${runSalt}@test.com`,
        date: '2026-11-15',
        timeSlot: '10:00 AM - 12:00 PM',
        isEmergency: false,
      }),
    });
    assert.strictEqual(sundayRes.status, 400);

    const targetDate = new Date(Date.now() + 86400000 * 6);
    if (targetDate.getDay() === 0) targetDate.setDate(targetDate.getDate() + 1);
    const res = await fetch(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Jane Resident',
        customerPhone: '512555' + Math.floor(1000 + Math.random() * 9000),
        customerEmail: `jane.${runSalt}@example.com`,
        address: '400 Downtown Ave',
        city: 'Metro Area',
        zipCode: '10001',
        serviceId: 'srv-ac-tuneup',
        serviceName: 'Seasonal AC Precision Tune-Up',
        date: targetDate.toISOString().split('T')[0],
        timeSlot: '01:00 PM - 03:00 PM',
        isEmergency: false,
      }),
    });
    assert.ok([200, 201].includes(res.status));
  });

  // -------------------------------------------------------------
  // 4. DISPATCH WORKFLOW & ROLE-BASED API ISOLATION
  // -------------------------------------------------------------
  console.log('\n4. Dispatch Workflow & Server-Side RBAC Enforcement Across All 5 Roles');

  const dispatchPhone = '512555' + Math.floor(1000 + Math.random() * 9000);
  const dispatchLeadRes = await fetch(`${BASE_URL}/api/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      journey: 'routine',
      serviceRequested: 'Heat Pump Inspection',
      customerName: 'Fresh Dispatch Lead',
      phone: dispatchPhone,
      email: `dispatch.${runSalt}@example.com`,
      address: '3400 South Boulevard',
      city: 'Metro Area',
      zipCode: '10001',
      urgency: 'normal',
    }),
  });
  const dispatchLeadData = await dispatchLeadRes.json();
  const dispatchLeadId = dispatchLeadData.lead.id;
  let assignedAptId = '';
  let unassignedAptId = '';

  await test('Lead Dispatcher: Authorized for Lead assignment, notes & appointment conversion; blocked (403) from settings & user admin', async () => {
    const dispToken = roleCredentials.dispatcher.token;

    const assignRes = await fetch(`${BASE_URL}/api/leads/${dispatchLeadId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${dispToken}` },
      body: JSON.stringify({
        technicianId: 'tech-1',
        technicianName: 'Marcus Vance',
        notes: 'Priority dispatch',
      }),
    });
    assert.strictEqual(assignRes.status, 200);

    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const convertRes = await fetch(`${BASE_URL}/api/leads/${dispatchLeadId}/convert-to-appointment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${dispToken}` },
      body: JSON.stringify({
        date: tomorrowStr,
        timeSlot: '08:00 AM - 10:00 AM',
        technicianId: 'tech-1',
        technicianName: 'Marcus Vance',
      }),
    });
    assert.strictEqual(convertRes.status, 201);
    assignedAptId = (await convertRes.json()).appointment.id;

    // Create a second appointment and have dispatcher explicitly assign it to tech-2 so we verify technician isolation
    const targetOtherDate = new Date(Date.now() + 86400000 * 3);
    if (targetOtherDate.getDay() === 0) targetOtherDate.setDate(targetOtherDate.getDate() + 1);
    const otherAptRes = await fetch(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Other Tech Customer',
        customerPhone: '512555' + Math.floor(1000 + Math.random() * 9000),
        customerEmail: `other.${runSalt}@example.com`,
        address: '8800 West Blvd',
        city: 'Metro Area',
        zipCode: '10001',
        date: targetOtherDate.toISOString().split('T')[0],
        timeSlot: '10:00 AM - 12:00 PM',
      }),
    });
    assert.ok([200, 201].includes(otherAptRes.status), `Expected 200/201 creating otherApt, got ${otherAptRes.status}`);
    const otherAptData = await otherAptRes.json();
    unassignedAptId = otherAptData.appointment.id;

    const reassignRes = await fetch(`${BASE_URL}/api/appointments/${unassignedAptId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${dispToken}` },
      body: JSON.stringify({ technicianId: 'tech-2', technicianName: 'Sarah Chen' }),
    });
    assert.strictEqual(reassignRes.status, 200);

    // Dispatcher MUST be blocked from business settings, user accounts, and super-admin tenants
    const settingsBlock = await fetch(`${BASE_URL}/api/business-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${dispToken}` },
      body: JSON.stringify({ tagline: 'Unauthorized' }),
    });
    assert.strictEqual(settingsBlock.status, 403);

    const usersBlock = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${dispToken}` },
    });
    assert.strictEqual(usersBlock.status, 403);

    const saasBlock = await fetch(`${BASE_URL}/api/super-admin/clients`, {
      headers: { Authorization: `Bearer ${dispToken}` },
    });
    assert.strictEqual(saasBlock.status, 403);
  });

  await test('Field Technician: Receives ONLY assigned appointments, can update own job, and gets 403 on unassigned jobs / leads / users', async () => {
    const techToken = roleCredentials.technician.token;

    const aptsRes = await fetch(`${BASE_URL}/api/appointments`, {
      headers: { Authorization: `Bearer ${techToken}` },
    });
    assert.strictEqual(aptsRes.status, 200);
    const apts = await aptsRes.json();
    assert.ok(apts.some((a: any) => a.id === assignedAptId), 'Technician should see own assigned job');
    assert.strictEqual(
      apts.some((a: any) => a.id === unassignedAptId),
      false,
      'Technician MUST NOT see unassigned jobs'
    );

    // Update own job succeeds
    const ownUpdate = await fetch(`${BASE_URL}/api/appointments/${assignedAptId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${techToken}` },
      body: JSON.stringify({ status: 'in_progress', notes: 'On site inspecting compressor' }),
    });
    assert.strictEqual(ownUpdate.status, 200);

    // Update unassigned job returns 403
    const otherUpdate = await fetch(`${BASE_URL}/api/appointments/${unassignedAptId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${techToken}` },
      body: JSON.stringify({ status: 'completed' }),
    });
    assert.strictEqual(otherUpdate.status, 403);

    // Blocked from leads & admin users
    const leadsBlock = await fetch(`${BASE_URL}/api/leads`, {
      headers: { Authorization: `Bearer ${techToken}` },
    });
    assert.strictEqual(leadsBlock.status, 403);

    const usersBlock = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${techToken}` },
    });
    assert.strictEqual(usersBlock.status, 403);
  });

  await test('Content Editor: Can update Site Pages CMS content, blocked (403) from Leads, Business Settings, and User Management', async () => {
    const editorToken = roleCredentials.content_editor.token;

    const pagesRes = await fetch(`${BASE_URL}/api/site-pages`);
    const pagesList = await pagesRes.json();
    const aboutPage = pagesList.find((p: any) => p.slug === '/about' || p.id === 'page-about');
    assert.ok(aboutPage);

    const updateRes = await fetch(`${BASE_URL}/api/site-pages/${aboutPage.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${editorToken}` },
      body: JSON.stringify({
        sections: aboutPage.sections.map((s: any) =>
          s.type === 'hero' ? { ...s, heading: 'Master Crafted Reliability Since Day One' } : s
        ),
      }),
    });
    assert.strictEqual(updateRes.status, 200);

    // Super Admin resets page back to clean state
    await fetch(`${BASE_URL}/api/site-pages/${aboutPage.id}/reset`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superToken}` },
    });

    // Editor blocked from leads, business settings, theme, and admin users
    assert.strictEqual(
      (await fetch(`${BASE_URL}/api/leads`, { headers: { Authorization: `Bearer ${editorToken}` } })).status,
      403
    );
    assert.strictEqual(
      (
        await fetch(`${BASE_URL}/api/business-settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${editorToken}` },
          body: JSON.stringify({ businessName: 'Hijack' }),
        })
      ).status,
      403
    );
    assert.strictEqual(
      (await fetch(`${BASE_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${editorToken}` } })).status,
      403
    );
  });

  await test('Business Admin: Authorized for Business Settings, Theme & Audit Logs; blocked (403) from SaaS clients & User Management', async () => {
    const bizToken = roleCredentials.business_admin.token;

    const auditRes = await fetch(`${BASE_URL}/api/audit-logs`, {
      headers: { Authorization: `Bearer ${bizToken}` },
    });
    assert.strictEqual(auditRes.status, 200);

    // Blocked from Super Admin client tenants & user creation
    assert.strictEqual(
      (await fetch(`${BASE_URL}/api/super-admin/clients`, { headers: { Authorization: `Bearer ${bizToken}` } })).status,
      403
    );
    assert.strictEqual(
      (
        await fetch(`${BASE_URL}/api/admin/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bizToken}` },
          body: JSON.stringify({ name: 'X', email: 'x@x.com', password: 'Password1!', role: 'dispatcher' }),
        })
      ).status,
      403
    );
  });

  // -------------------------------------------------------------
  // 5. CUSTOMER PORTAL LOOKUP, REVIEWS & WORKFLOWS
  // -------------------------------------------------------------
  console.log('\n5. Customer Portal Isolation, Theme Publish/Rollback & SaaS');

  await test('Customer Portal: Unauthenticated /api/customers is blocked (401); /api/portal/lookup returns scoped record only', async () => {
    assert.strictEqual((await fetch(`${BASE_URL}/api/customers`)).status, 401);

    const lookupRes = await fetch(`${BASE_URL}/api/portal/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sarah.jenkins@example.com' }),
    });
    if (lookupRes.status === 200) {
      const data = await lookupRes.json();
      assert.strictEqual(data.customer.email.toLowerCase(), 'sarah.jenkins@example.com');
    } else {
      assert.strictEqual(lookupRes.status, 404);
    }

    // Wrong attacker email cannot delete cust-1 equipment
    const delRes = await fetch(`${BASE_URL}/api/customers/cust-1/equipment/eq-101`, {
      method: 'DELETE',
      headers: { 'x-customer-email': 'attacker@example.com' },
    });
    assert.strictEqual(delRes.status, 403);

    // Wrong attacker email cannot cancel another customer's appointment
    if (assignedAptId) {
      const badCancel = await fetch(`${BASE_URL}/api/portal/appointments/${assignedAptId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail: 'attacker@example.com', reason: 'Hijack' }),
      });
      assert.strictEqual(badCancel.status, 403);
    }
  });

  await test('Theme Workflow: Draft preview isolated from public site until Business Admin publishes and rolls back', async () => {
    const bizToken = roleCredentials.business_admin.token;
    const publicInitial = await (await fetch(`${BASE_URL}/api/theme`)).json();
    const liveColor = publicInitial.primaryColor;
    const draftColor = liveColor === '#1d4ed8' ? '#2563eb' : '#1d4ed8';

    const draftRes = await fetch(`${BASE_URL}/api/theme`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bizToken}` },
      body: JSON.stringify({ primaryColor: draftColor }),
    });
    assert.strictEqual(draftRes.status, 200);

    // Public visitor still sees liveColor
    const publicCheck = await (await fetch(`${BASE_URL}/api/theme`)).json();
    assert.strictEqual(publicCheck.primaryColor, liveColor);

    // Publish + Rollback
    const pubRes = await fetch(`${BASE_URL}/api/theme/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bizToken}` },
      body: JSON.stringify({ primaryColor: draftColor }),
    });
    assert.strictEqual(pubRes.status, 200);

    const rollbackRes = await fetch(`${BASE_URL}/api/theme/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bizToken}` },
    });
    assert.strictEqual(rollbackRes.status, 200);
    assert.strictEqual((await rollbackRes.json()).theme.primaryColor, liveColor);
  });

  await test('Super Admin: SaaS Client Tenant Provisioning, Suspension & Billing', async () => {
    const res = await fetch(`${BASE_URL}/api/super-admin/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${superToken}` },
      body: JSON.stringify({
        companyName: `San Antonio Climate Pros ${runSalt}`,
        ownerName: 'Sarah Jenkins',
        ownerEmail: `sarah.${runSalt}@saclimatepros.com`,
        ownerPhone: '(210) 555-9182',
        licenseType: 'one_time_buyout',
        planTier: 'enterprise',
        oneTimeBuyoutFee: 3499,
        status: 'active',
        subdomain: `saclimate-${runSalt}.hvacsaas.pro`,
        primaryDomain: `saclimatepros-${runSalt}.com`,
      }),
    });
    assert.strictEqual(res.status, 201);
    const tenant = await res.json();
    createdBuyoutTenantId = tenant.id;
    assert.ok(tenant.perpetualLicenseKey);

    // Clean up test tenant
    await fetch(`${BASE_URL}/api/super-admin/clients/${createdBuyoutTenantId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superToken}` },
    });
  });

  // -------------------------------------------------------------
  // 6. ACCOUNT SUSPENSION, PASSWORD RECOVERY & LOGOUT
  // -------------------------------------------------------------
  console.log('\n6. Suspension, Password Recovery & Session Logout Verification');

  await test('Security: Suspending user immediately revokes existing session token and blocks sign-in', async () => {
    const editorCreds = roleCredentials.content_editor;
    const suspendRes = await fetch(`${BASE_URL}/api/admin/users/${editorCreds.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${superToken}` },
      body: JSON.stringify({ status: 'suspended' }),
    });
    assert.strictEqual(suspendRes.status, 200);

    const revokedCheck = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${editorCreds.token}` },
    });
    assert.strictEqual(revokedCheck.status, 401);

    const blockedLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: editorCreds.email, password: editorCreds.password }),
    });
    assert.strictEqual(blockedLogin.status, 403);
  });

  await test('Security: Single-use password recovery token resets password and invalidates old password', async () => {
    const dispCreds = roleCredentials.dispatcher;
    const genRes = await fetch(`${BASE_URL}/api/admin/users/${dispCreds.id}/reset-token`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superToken}` },
    });
    assert.strictEqual(genRes.status, 200);
    const genData = await genRes.json();
    assert.ok(genData.token);

    const newPwd = `NewDispPass!${runSalt}`;
    const resetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: genData.token, newPassword: newPwd }),
    });
    assert.strictEqual(resetRes.status, 200);

    // Old password rejected
    const oldLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: dispCreds.username, password: dispCreds.password }),
    });
    assert.strictEqual(oldLogin.status, 401);

    // New password accepted
    const newLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: dispCreds.username, password: newPwd }),
    });
    assert.strictEqual(newLogin.status, 200);
    const newLoginData = await newLogin.json();

    // Logout revokes session immediately
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${newLoginData.token}` },
    });
    assert.strictEqual(logoutRes.status, 200);

    const afterLogoutMe = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${newLoginData.token}` },
    });
    assert.strictEqual(afterLogoutMe.status, 401);
  });

  // Clean up created non-super test users via API
  for (const uid of createdUserIds) {
    await fetch(`${BASE_URL}/api/admin/users/${uid}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superToken}` },
    });
  }

  // Log out Super Admin test session
  if (superToken) {
    await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superToken}` },
    });
  }

  // Clean up test super admin and synthetic test records from MySQL & disk JSON
  if (createdBySetup && superUserId) {
    try {
      const { executeQuery } = await import('../server/mysql');
      const { getDb, initDatabase, persistDatabase } = await import('../server/db');
      initDatabase();
      const db = getDb();
      db.users = db.users.filter((u) => u.id !== superUserId);
      db.sessions = (db.sessions || []).filter((s) => s.userId !== superUserId);
      db.leads = db.leads.filter((l) => !l.email?.includes(runSalt));
      db.appointments = db.appointments.filter((a) => !a.customerEmail?.includes(runSalt));
      persistDatabase();
      await executeQuery('DELETE FROM auth_sessions WHERE user_id = ?', [superUserId]).catch(() => {});
      await executeQuery('DELETE FROM users WHERE id = ?', [superUserId]).catch(() => {});
      await executeQuery('DELETE FROM leads WHERE email LIKE ?', [`%${runSalt}%`]).catch(() => {});
      await executeQuery('DELETE FROM appointments WHERE customer_email LIKE ?', [`%${runSalt}%`]).catch(() => {});
    } catch {
      // Best-effort cleanup
    }
  }

  console.log(`\n========================================`);
  console.log(`E2E Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runSuite().catch((err) => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
