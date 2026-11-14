import mysql, { RowDataPacket } from 'mysql2/promise';
import { dbConfig } from '../server/mysql';
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
  initialIntegrations,
} from '../src/data/seedData';

export async function seedDatabase(): Promise<void> {
  console.log(`[Seed] Connecting to MySQL at ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}...`);
  const conn = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    connectTimeout: 10000,
  });

  try {
    // 1. Business Settings
    const [settingsRows] = await conn.query<RowDataPacket[]>('SELECT id FROM business_settings WHERE id = "default"');
    if (settingsRows.length === 0) {
      console.log('[Seed] Inserting default business_settings...');
      await conn.query(
        `INSERT INTO business_settings 
          (id, business_name, legal_name, tagline, license_number, primary_phone, emergency_phone, 
           business_email, physical_address, business_hours, service_radius_miles, primary_city, state, zip_code, google_rating, review_count, years_in_business)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'default',
          initialBusinessSettings.businessName,
          initialBusinessSettings.businessName,
          initialBusinessSettings.tagline,
          initialBusinessSettings.licenseNumber,
          initialBusinessSettings.primaryPhone,
          initialBusinessSettings.emergencyPhone,
          initialBusinessSettings.businessEmail,
          initialBusinessSettings.physicalAddress,
          initialBusinessSettings.businessHours,
          45,
          initialBusinessSettings.primaryCity,
          initialBusinessSettings.state,
          '10001',
          initialBusinessSettings.googleRating || 4.9,
          initialBusinessSettings.reviewCount || 384,
          18,
        ]
      );
    }

    // 2. Services
    const [servicesRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM services');
    if (servicesRows[0].count === 0) {
      console.log(`[Seed] Inserting ${initialServices.length} services...`);
      for (const s of initialServices as any[]) {
        await conn.query(
          `INSERT INTO services 
            (id, name, slug, category, short_description, full_description, price_starting_at, 
             price_range_text, duration_minutes, is_emergency_eligible, icon_name, image_url, key_benefits, symptoms_fixed, process_phases, equipment_options, faqs, sort_order, active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            s.id,
            s.name,
            s.slug,
            s.category,
            s.shortDescription,
            s.fullDescription,
            s.priceStartingAt || 89.0,
            s.priceRangeText || '$89 - $289',
            s.durationMinutes || 90,
            s.isEmergencyEligible ? 1 : 0,
            s.iconName || 'Wrench',
            s.imageUrl || null,
            JSON.stringify(s.benefits || []),
            JSON.stringify(s.symptomsFixed || []),
            JSON.stringify(s.processPhases || []),
            JSON.stringify(s.equipmentOptions || []),
            JSON.stringify(s.faqs || []),
            s.sortOrder || 0,
            s.active !== false ? 1 : 0,
          ]
        );
      }
    }

    // 3. Service Areas
    const [areasRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM service_areas');
    if (areasRows[0].count === 0) {
      console.log(`[Seed] Inserting ${initialServiceAreas.length} service_areas...`);
      for (const a of initialServiceAreas as any[]) {
        await conn.query(
          `INSERT INTO service_areas 
            (id, name, slug, zip_codes, primary_phone, eta_minutes, emergency_available, popular_services, description, active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            a.id,
            a.name,
            a.slug,
            JSON.stringify(a.zipCodes),
            a.primaryPhone || null,
            a.etaMinutes || '15-45 min',
            a.emergencyAvailable ? 1 : 0,
            JSON.stringify(a.popularServices || []),
            a.description,
            a.active !== false ? 1 : 0,
          ]
        );
      }
    }

    // 4. Technicians
    const [techRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM technicians');
    if (techRows[0].count === 0) {
      console.log(`[Seed] Inserting ${initialTechnicians.length} technicians...`);
      for (const t of initialTechnicians as any[]) {
        await conn.query(
          `INSERT INTO technicians 
            (id, name, role, photo_url, phone, rating, completed_jobs_count, skills, years_experience, active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            t.id,
            t.name,
            t.role,
            t.photoUrl || null,
            t.phone || null,
            t.rating || 5.0,
            t.completedJobsCount || 0,
            JSON.stringify(t.skills || []),
            t.yearsExperience || 5,
            t.active !== false ? 1 : 0,
          ]
        );
      }
    }

    // 5. Membership Plans
    const [planRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM membership_plans');
    if (planRows[0].count === 0) {
      console.log(`[Seed] Inserting ${initialMembershipPlans.length} membership_plans...`);
      for (const p of initialMembershipPlans as any[]) {
        await conn.query(
          `INSERT INTO membership_plans 
            (id, name, tier, visits_per_year, price_monthly, price_annual, discount_percent, diagnostic_fee_waived, emergency_priority, filter_replacements_included, warranty_extension_years, benefits, is_popular, active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            p.id,
            p.name,
            p.tier,
            p.visitsPerYear,
            p.priceMonthly,
            p.priceAnnual,
            p.discountPercent,
            p.diagnosticFeeWaived ? 1 : 0,
            p.emergencyPriority,
            p.filterReplacementsIncluded,
            p.warrantyExtensionYears,
            JSON.stringify(p.benefits || []),
            p.isPopular ? 1 : 0,
            1,
          ]
        );
      }
    }

    // 6. Promotions
    const [promoRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM promotions');
    if (promoRows[0].count === 0) {
      console.log(`[Seed] Inserting ${initialPromotions.length} promotions...`);
      for (const pr of initialPromotions as any[]) {
        await conn.query(
          `INSERT INTO promotions 
            (id, title, description, code, discount_amount, discount_type, expires_at, minimum_spend, disclaimer, active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            pr.id,
            pr.title,
            pr.description,
            pr.code,
            pr.discountAmount,
            pr.discountType,
            pr.expiresAt || null,
            pr.minimumSpend || 0,
            pr.disclaimer || null,
            pr.active ? 1 : 0,
          ]
        );
      }
    }

    // 7. Reviews
    const [revRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM reviews');
    if (revRows[0].count === 0) {
      console.log(`[Seed] Inserting ${initialReviews.length} reviews...`);
      for (const r of initialReviews as any[]) {
        await conn.query(
          `INSERT INTO reviews 
            (id, author_name, city, rating, service_category, text, source, verified, date, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            r.id,
            r.authorName,
            r.city,
            r.rating,
            r.serviceCategory,
            r.text,
            r.source || 'Google Verified',
            r.verified ? 1 : 0,
            r.date,
            r.status || 'approved',
          ]
        );
      }
    }

    // 8. Articles
    const [artRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM articles');
    if (artRows[0].count === 0) {
      console.log(`[Seed] Inserting ${initialArticles.length} articles...`);
      for (const art of initialArticles) {
        await conn.query(
          `INSERT INTO articles 
            (id, title, slug, excerpt, content, author, category, published_at, read_time_minutes, image_url, tags, is_featured)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            art.id,
            art.title,
            art.slug,
            art.excerpt,
            art.content,
            art.author,
            art.category,
            (art as any).publishDate || (art as any).publishedAt || new Date().toISOString().split('T')[0],
            parseInt(String((art as any).readTime || (art as any).readTimeMinutes || '5'), 10) || 5,
            (art as any).coverImage || (art as any).imageUrl || null,
            JSON.stringify(art.tags || []),
            (art as any).isFeatured ? 1 : 0,
          ]
        );
      }
    }

    // 9. Projects
    const [projRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM projects');
    if (projRows[0].count === 0) {
      console.log(`[Seed] Inserting ${initialProjects.length} projects...`);
      for (const pj of initialProjects) {
        await conn.query(
          `INSERT INTO projects 
            (id, title, category, city, completion_date, equipment_installed, before_image, after_image, problem, solution, outcome, customer_quote, customer_name, is_featured)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            pj.id,
            pj.title,
            pj.category,
            pj.city,
            (pj as any).date || (pj as any).completionDate || new Date().toISOString().split('T')[0],
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
    }

    // 10. Leads
    const [leadRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM leads');
    if (leadRows[0].count === 0) {
      console.log(`[Seed] Inserting ${initialLeads.length} leads...`);
      for (const ld of initialLeads as any[]) {
        await conn.query(
          `INSERT INTO leads 
            (id, lead_number, source, journey, service_requested, customer_name, email, phone, address, city, state, zip_code, urgency, preferred_contact_method, status, priority, notes, property_type, preferred_date, preferred_time_slot, assigned_technician_id, assigned_technician_name, dispatch_status_notice)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            ld.id,
            ld.leadNumber,
            ld.source || 'website_form',
            ld.journey || 'routine',
            ld.serviceRequested,
            ld.customerName,
            ld.email || null,
            ld.phone,
            ld.address || null,
            ld.city || 'Metro Area',
            ld.state || 'State',
            ld.zipCode || '10001',
            ld.urgency || 'normal',
            ld.preferredContactMethod || 'phone',
            ld.status || 'new',
            ld.priority || 'medium',
            ld.notes || null,
            ld.propertyType || 'residential',
            ld.preferredDate || null,
            ld.preferredTimeSlot || null,
            ld.assignedTechnicianId || null,
            ld.assignedTechnicianName || null,
            ld.dispatchStatusNotice || null,
          ]
        );
      }
    }

    // 11. Appointments
    const [aptRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM appointments');
    if (aptRows[0].count === 0) {
      console.log(`[Seed] Inserting ${initialAppointments.length} appointments...`);
      for (const ap of initialAppointments) {
        await conn.query(
          `INSERT INTO appointments 
            (id, appointment_number, service_id, service_name, customer_name, customer_email, customer_phone, address, city, state, zip_code, appointment_date, time_slot, status, duration_minutes, estimated_duration_minutes, is_emergency, issue_description, price, technician_id, technician_name)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            ap.id,
            ap.appointmentNumber,
            ap.serviceId,
            ap.serviceName,
            ap.customerName,
            ap.customerEmail,
            ap.customerPhone,
            ap.address,
            ap.city || 'Metro Area',
            ap.state || 'State',
            ap.zipCode || '10001',
            ap.date,
            ap.timeSlot,
            ap.status || 'confirmed',
            ap.durationMinutes || 90,
            ap.estimatedDurationMinutes || 90,
            ap.isEmergency ? 1 : 0,
            ap.issueDescription || null,
            ap.price || 89.0,
            ap.technicianId || null,
            ap.technicianName || null,
          ]
        );
      }
    }

    // 12. Estimates
    const [estRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM estimates');
    if (estRows[0].count === 0) {
      console.log(`[Seed] Inserting ${initialEstimates.length} estimates...`);
      for (const es of initialEstimates) {
        const estTotal = (es as any).totalAmount || (es as any).total || (es.subtotal + ((es as any).taxAmount || 0) - ((es as any).discountAmount || 0));
        await conn.query(
          `INSERT INTO estimates 
            (id, estimate_number, lead_id, customer_name, customer_email, customer_phone, address, city, state, zip_code, status, subtotal, discount, tax_amount, total, line_items, notes, valid_until, accepted_at, rejected_at, signature_name, financing_requested)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            es.id,
            es.estimateNumber,
            (es as any).leadId || null,
            es.customerName,
            es.customerEmail,
            es.customerPhone,
            es.address,
            es.city || 'Metro Area',
            (es as any).state || 'State',
            es.zipCode || '10001',
            es.status || 'sent',
            es.subtotal,
            (es as any).discountAmount || (es as any).discount || 0,
            (es as any).taxAmount || 0,
            estTotal,
            JSON.stringify(es.lineItems || []),
            (es as any).customerNotes || (es as any).notes || null,
            (es as any).expirationDate || (es as any).validUntil || new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
            (es as any).acceptedAt || null,
            (es as any).rejectedAt || null,
            (es as any).signatureName || null,
            (es as any).financingRequested ? 1 : 0,
          ]
        );
      }
    }

    // 13. Customers & Customer Equipment
    const [custRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM customers');
    if (custRows[0].count === 0) {
      console.log(`[Seed] Inserting ${initialCustomers.length} customers and their equipment...`);
      for (const cu of initialCustomers) {
        const nameParts = ((cu as any).name || '').split(' ');
        const firstName = (cu as any).firstName || nameParts[0] || 'Customer';
        const lastName = (cu as any).lastName || nameParts.slice(1).join(' ') || 'User';

        await conn.query(
          `INSERT INTO customers 
            (id, first_name, last_name, email, phone, address, city, state, zip_code, membership_tier, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            cu.id,
            firstName,
            lastName,
            cu.email,
            cu.phone,
            cu.address,
            cu.city || 'Metro Area',
            (cu as any).state || 'State',
            cu.zipCode || '10001',
            cu.membershipTier || 'none',
            (cu as any).notes || null,
          ]
        );

        if (cu.equipment && cu.equipment.length > 0) {
          for (const eq of cu.equipment) {
            await conn.query(
              `INSERT INTO customer_equipment 
                (id, customer_id, type, manufacturer, model, serial_number, install_date, last_service_date, filter_size, condition_status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                eq.id,
                cu.id,
                eq.type,
                eq.manufacturer,
                (eq as any).modelNumber || (eq as any).model || null,
                eq.serialNumber || null,
                eq.installDate || null,
                (eq as any).lastServicedDate || (eq as any).lastServiceDate || null,
                eq.filterSize || null,
                (eq as any).conditionStatus || 'Optimal',
              ]
            );
          }
        }
      }
    }

    // 14. Theme Settings
    const [themeRows] = await conn.query<RowDataPacket[]>('SELECT id FROM theme_settings WHERE id = "default"');
    if (themeRows.length === 0) {
      console.log('[Seed] Inserting theme_settings...');
      await conn.query(
        `INSERT INTO theme_settings 
          (id, primary_color, secondary_color, accent_color, background_color, text_color, heading_font, body_font, border_radius, button_style, custom_css)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'default',
          (initialThemeConfig as any).primaryColor,
          (initialThemeConfig as any).secondaryColor,
          (initialThemeConfig as any).accentColor,
          (initialThemeConfig as any).backgroundColor,
          (initialThemeConfig as any).textColor || '#0f172a',
          (initialThemeConfig as any).headingFont,
          (initialThemeConfig as any).bodyFont,
          (initialThemeConfig as any).borderRadius,
          (initialThemeConfig as any).buttonStyle,
          (initialThemeConfig as any).customCss || null,
        ]
      );
    }

    // 15. Homepage Sections
    const [sectionRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM homepage_sections');
    if (sectionRows[0].count === 0) {
      console.log(`[Seed] Inserting ${initialHomepageSections.length} homepage_sections...`);
      for (const sec of initialHomepageSections as any[]) {
        await conn.query(
          `INSERT INTO homepage_sections (id, name, enabled, order_index, config_json)
           VALUES (?, ?, ?, ?, ?)`,
          [
            sec.id,
            sec.name,
            sec.enabled ? 1 : 0,
            sec.order,
            JSON.stringify({
              type: sec.type,
              heading: sec.heading,
              subheading: sec.subheading,
              ...(sec.config || sec.config_json || {}),
            }),
          ]
        );
      }
    }

    // 16. Navigation Items
    const [navRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM navigation_items');
    if (navRows[0].count === 0) {
      const navItems = (initialNavigationConfig as any).menuItems || (initialNavigationConfig as any).mainNav || [];
      console.log(`[Seed] Inserting ${navItems.length} navigation_items...`);
      let orderIdx = 0;
      for (const nav of navItems) {
        await conn.query(
          `INSERT INTO navigation_items (id, label, path, order_index, is_external, is_cta, parent_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            nav.id || `nav-${orderIdx + 1}`,
            nav.label,
            nav.path,
            nav.order !== undefined ? nav.order : orderIdx++,
            nav.isExternal ? 1 : 0,
            nav.isCta ? 1 : 0,
            null,
          ]
        );
      }
    }

    // 17. Feature Flags
    const [flagRows] = await conn.query<RowDataPacket[]>('SELECT id FROM feature_flags WHERE id = "default"');
    if (flagRows.length === 0) {
      console.log('[Seed] Inserting feature_flags...');
      const fAny = initialFeatureFlags as any;
      await conn.query(
        `INSERT INTO feature_flags 
          (id, online_booking, emergency_triage, sizing_calculator, membership_club, live_chat, financing_calculator, review_submission, blog_enabled, custom_forms)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'default',
          fAny.onlineBooking ? 1 : 0,
          fAny.emergencyService ?? fAny.emergencyTriage ? 1 : 0,
          fAny.estimateCalculator ?? fAny.sizingCalculator ? 1 : 0,
          fAny.maintenanceMemberships ?? fAny.membershipClub ? 1 : 0,
          fAny.liveChat ? 1 : 0,
          fAny.financingCalculator ? 1 : 0,
          fAny.customerReviews ?? fAny.reviewSubmission ? 1 : 0,
          fAny.knowledgeBase ?? fAny.blogEnabled ? 1 : 0,
          fAny.customForms ? 1 : 0,
        ]
      );
    }

    // 18. Market Settings
    const [marketRows] = await conn.query<RowDataPacket[]>('SELECT id FROM market_settings WHERE id = "default"');
    if (marketRows.length === 0) {
      console.log('[Seed] Inserting market_settings...');
      await conn.query(
        `INSERT INTO market_settings 
          (id, country, region_or_state, primary_city, service_radius_miles, currency, temperature_unit, postal_code_label, tax_rate, emergency_dispatch_sla_minutes, business_hours_text, closed_sundays_for_routine)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'default',
          initialMarketSettings.country,
          initialMarketSettings.regionOrState,
          initialMarketSettings.primaryCity,
          initialMarketSettings.serviceRadiusMiles,
          initialMarketSettings.currency,
          initialMarketSettings.temperatureUnit,
          initialMarketSettings.postalCodeLabel,
          initialMarketSettings.taxRate,
          initialMarketSettings.emergencyDispatchSlaMinutes,
          initialMarketSettings.businessHoursText,
          initialMarketSettings.closedSundaysForRoutine ? 1 : 0,
        ]
      );
    }

    // 19. Forms
    const [formsRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM forms');
    if (formsRows[0].count === 0) {
      console.log(`[Seed] Inserting ${initialForms.length} custom forms...`);
      for (const fm of initialForms as any[]) {
        await conn.query(
          `INSERT INTO forms (id, name, slug, description, fields, notification_email, submit_button_text, success_message, active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            fm.id,
            fm.name,
            fm.slug,
            fm.description || null,
            JSON.stringify(fm.fields || []),
            fm.notificationEmail || null,
            fm.submitButtonText || 'Submit',
            fm.successMessage || 'Form submitted successfully.',
            fm.active !== false ? 1 : 0,
          ]
        );
      }
    }

    // 20. Pages
    const [pageRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM pages');
    if (pageRows[0].count === 0) {
      console.log(`[Seed] Inserting ${initialPages.length} landing pages...`);
      for (const pg of initialPages as any[]) {
        await conn.query(
          `INSERT INTO pages (id, title, slug, meta_description, published, blocks)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            pg.id,
            pg.title,
            pg.slug,
            pg.metaDescription || null,
            pg.published ?? pg.isPublished ? 1 : 0,
            JSON.stringify(pg.blocks || []),
          ]
        );
      }
    }

    // 21. Users (seeded records start locked until Super Admin sets real credentials via setup or User Management)
    const [userRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM users');
    if (userRows[0].count === 0) {
      console.log(`[Seed] Inserting ${initialAdminUsers.length} uninitialized user placeholders...`);
      for (const u of initialAdminUsers) {
        await conn.query(
          `INSERT INTO users (id, email, password_hash, role, name, phone, active)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            u.id,
            u.email,
            '!UNINITIALIZED_REQUIRES_SCRYPT_PASSWORD',
            u.role,
            u.name,
            u.phone || null,
            1,
          ]
        );
      }
    }

    // 22. Client Tenants & SaaS Config
    const [tenantRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM client_tenants');
    if (tenantRows[0].count === 0) {
      console.log(`[Seed] Inserting ${initialClientTenants.length} client_tenants...`);
      for (const ct of initialClientTenants) {
        const contactName = (ct as any).ownerName || (ct as any).contactName || 'Owner';
        const contactEmail = (ct as any).ownerEmail || (ct as any).contactEmail || 'admin@example.com';
        const contactPhone = (ct as any).ownerPhone || (ct as any).contactPhone || null;
        const domain = (ct as any).primaryDomain || (ct as any).domain || (ct as any).subdomain || null;
        const monthlyRate = (ct as any).monthlyRentalFee || (ct as any).monthlyRentalRate || 0;
        const buyoutRate = (ct as any).oneTimeBuyoutFee || (ct as any).buyoutPrice || 0;
        const billingStatus = (ct as any).status || (ct as any).billingStatus || 'active';
        const isActive = (ct as any).status === 'active' || (ct as any).active ? 1 : 0;
        const startDate = (ct as any).billingCycleStartDate || (ct as any).licenseStartDate || null;
        const maxLeads = (ct as any).leadQuotaMonthly || (ct as any).maxMonthlyLeads || 500;

        await conn.query(
          `INSERT INTO client_tenants 
            (id, company_name, slug, domain, contact_name, contact_email, contact_phone, city, state, license_type, plan_tier, monthly_rental_rate, buyout_price, billing_status, active, license_start_date, perpetual_license_key, max_monthly_leads, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            ct.id,
            ct.companyName,
            ct.slug,
            domain,
            contactName,
            contactEmail,
            contactPhone,
            (ct as any).city || 'Metro Area',
            (ct as any).state || 'State',
            ct.licenseType || 'monthly_rental',
            ct.planTier || 'professional',
            monthlyRate,
            buyoutRate,
            billingStatus,
            isActive,
            startDate,
            (ct as any).perpetualLicenseKey || null,
            maxLeads,
            ct.notes || null,
          ]
        );

        // Invoices for tenant
        if ((ct as any).invoices && Array.isArray((ct as any).invoices)) {
          for (const inv of (ct as any).invoices) {
            await conn.query(
              `INSERT INTO saas_invoices 
                (id, client_id, invoice_number, amount, status, invoice_date, due_date, paid_at, plan_tier, license_type, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                inv.id,
                ct.id,
                inv.invoiceNumber,
                inv.amount,
                inv.status || 'paid',
                inv.date || new Date().toISOString().split('T')[0],
                inv.dueDate || inv.date || new Date().toISOString().split('T')[0],
                inv.status === 'paid' ? (inv.date || new Date().toISOString().split('T')[0]) : null,
                ct.planTier || 'professional',
                ct.licenseType || 'monthly_rental',
                inv.paymentMethod ? `Payment: ${inv.paymentMethod} (Ref: ${inv.transactionRef || 'N/A'})` : null,
              ]
            );
          }
        }
      }
    }

    const [saasRows] = await conn.query<RowDataPacket[]>('SELECT id FROM saas_config WHERE id = "default"');
    if (saasRows.length === 0) {
      console.log('[Seed] Inserting saas_config...');
      await conn.query(
        `INSERT INTO saas_config (id, platform_name, allow_public_onboarding, payment_gateway_mode, plans)
         VALUES (?, ?, ?, ?, ?)`,
        [
          'default',
          initialSaasPlatformConfig.platformName,
          (initialSaasPlatformConfig as any).allowPublicOnboarding ? 1 : 0,
          (initialSaasPlatformConfig as any).paymentGatewayMode || (initialSaasPlatformConfig as any).stripeConnected ? 'live' : 'test',
          JSON.stringify(initialSaasPlatformConfig.plans || []),
        ]
      );
    }

    // 23. Integrations
    const [intRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM integrations');
    if (intRows[0].count === 0) {
      console.log(`[Seed] Inserting ${initialIntegrations.length} integrations...`);
      for (const it of initialIntegrations) {
        const intType = (it as any).category || (it as any).provider || (it as any).type || 'service';
        const isEnabled = (it as any).credentialsSet || (it as any).enabled || (it as any).status === 'connected' ? 1 : 0;
        await conn.query(
          `INSERT INTO integrations (id, name, type, enabled, config, last_sync_at, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            it.id,
            it.name,
            intType,
            isEnabled,
            JSON.stringify((it as any).config || { details: (it as any).details, provider: (it as any).provider }),
            (it as any).lastSync || (it as any).lastSyncAt || null,
            it.status || 'disconnected',
          ]
        );
      }
    }

    console.log('[Seed] All database seed operations completed successfully.');
  } catch (error: any) {
    console.error('[Seed Error]:', error.message || error);
    throw error;
  } finally {
    await conn.end();
  }
}

// If run directly from CLI (e.g. `npm run seed`)
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => {
      console.log('Database seeding finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Database seeding failed:', err);
      process.exit(1);
    });
}
