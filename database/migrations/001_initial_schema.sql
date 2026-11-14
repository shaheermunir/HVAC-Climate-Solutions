-- ========================================================
-- AIRFLOW CLIMATE SOLUTIONS - HOSTINGER MYSQL PRODUCTION SCHEMA
-- Migration: 001_initial_schema.sql
-- Normalized schema for HVAC Website & SaaS Administrative Platform
-- ========================================================

-- Schema migrations tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  version VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1. Business Settings
CREATE TABLE IF NOT EXISTS business_settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  business_name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255) NULL,
  tagline VARCHAR(255) NULL,
  license_number VARCHAR(100) NULL,
  primary_phone VARCHAR(50) NOT NULL,
  emergency_phone VARCHAR(50) NOT NULL,
  business_email VARCHAR(150) NOT NULL,
  physical_address TEXT NULL,
  business_hours VARCHAR(255) NULL,
  service_radius_miles INT DEFAULT 45,
  primary_city VARCHAR(100) DEFAULT 'Metro Area',
  state VARCHAR(50) DEFAULT 'State',
  zip_code VARCHAR(20) DEFAULT '10001',
  google_rating DECIMAL(3, 2) DEFAULT 4.90,
  review_count INT DEFAULT 384,
  years_in_business INT DEFAULT 18,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Services Catalog
CREATE TABLE IF NOT EXISTS services (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  short_description TEXT NOT NULL,
  full_description LONGTEXT NULL,
  price_starting_at DECIMAL(10, 2) DEFAULT 0.00,
  price_range_text VARCHAR(100) NULL,
  duration_minutes INT DEFAULT 90,
  is_emergency_eligible BOOLEAN DEFAULT FALSE,
  icon_name VARCHAR(100) DEFAULT 'Wrench',
  image_url VARCHAR(500) NULL,
  key_benefits JSON NULL,
  symptoms_fixed JSON NULL,
  process_phases JSON NULL,
  equipment_options JSON NULL,
  faqs JSON NULL,
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_services_category (category),
  INDEX idx_services_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Service Areas & Territories
CREATE TABLE IF NOT EXISTS service_areas (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  zip_codes JSON NOT NULL,
  primary_phone VARCHAR(50) NULL,
  eta_minutes VARCHAR(50) DEFAULT '15-45 min',
  emergency_available BOOLEAN DEFAULT TRUE,
  popular_services JSON NULL,
  description TEXT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_service_areas_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Technicians
CREATE TABLE IF NOT EXISTS technicians (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(150) NOT NULL,
  photo_url VARCHAR(500) NULL,
  phone VARCHAR(50) NULL,
  rating DECIMAL(3, 2) DEFAULT 5.00,
  completed_jobs_count INT DEFAULT 0,
  skills JSON NULL,
  years_experience INT DEFAULT 5,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_technicians_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Membership Plans
CREATE TABLE IF NOT EXISTS membership_plans (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tier VARCHAR(50) NOT NULL,
  visits_per_year INT DEFAULT 2,
  price_monthly DECIMAL(10, 2) NOT NULL,
  price_annual DECIMAL(10, 2) NOT NULL,
  discount_percent INT DEFAULT 15,
  diagnostic_fee_waived BOOLEAN DEFAULT TRUE,
  emergency_priority VARCHAR(50) DEFAULT 'Front-of-Line Priority',
  filter_replacements_included INT DEFAULT 2,
  warranty_extension_years INT DEFAULT 1,
  benefits JSON NOT NULL,
  is_popular BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Membership Subscriptions
CREATE TABLE IF NOT EXISTS membership_subscriptions (
  id VARCHAR(100) PRIMARY KEY,
  subscription_number VARCHAR(100) NOT NULL UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  address VARCHAR(500) NOT NULL,
  plan_id VARCHAR(100) NOT NULL,
  plan_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  billing_cycle VARCHAR(50) DEFAULT 'monthly',
  next_service_due VARCHAR(50) NULL,
  renewal_date VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_subscriptions_email (customer_email),
  INDEX idx_subscriptions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Promotions
CREATE TABLE IF NOT EXISTS promotions (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_amount DECIMAL(10, 2) NOT NULL,
  discount_type VARCHAR(50) DEFAULT 'fixed',
  expires_at VARCHAR(50) NULL,
  minimum_spend DECIMAL(10, 2) DEFAULT 0.00,
  disclaimer TEXT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_promotions_code (code),
  INDEX idx_promotions_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Customer Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(100) PRIMARY KEY,
  author_name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  rating INT NOT NULL DEFAULT 5,
  service_category VARCHAR(150) NOT NULL,
  text TEXT NOT NULL,
  source VARCHAR(50) DEFAULT 'Google Verified',
  verified BOOLEAN DEFAULT TRUE,
  date VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'approved',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reviews_status (status),
  INDEX idx_reviews_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Knowledge Base & Articles
CREATE TABLE IF NOT EXISTS articles (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content LONGTEXT NOT NULL,
  author VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL,
  published_at VARCHAR(50) NOT NULL,
  read_time_minutes INT DEFAULT 5,
  image_url VARCHAR(500) NULL,
  tags JSON NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_articles_slug (slug),
  INDEX idx_articles_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Completed Projects & Case Studies
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  completion_date VARCHAR(50) NOT NULL,
  equipment_installed VARCHAR(255) NOT NULL,
  before_image VARCHAR(500) NULL,
  after_image VARCHAR(500) NULL,
  problem TEXT NOT NULL,
  solution TEXT NOT NULL,
  outcome TEXT NOT NULL,
  customer_quote TEXT NULL,
  customer_name VARCHAR(150) NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Leads & Customer Inquiries
CREATE TABLE IF NOT EXISTS leads (
  id VARCHAR(100) PRIMARY KEY,
  lead_number VARCHAR(100) NOT NULL UNIQUE,
  source VARCHAR(50) DEFAULT 'website_form',
  journey VARCHAR(50) DEFAULT 'routine',
  service_requested VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  email VARCHAR(150) NULL,
  phone VARCHAR(50) NOT NULL,
  address VARCHAR(500) NULL,
  city VARCHAR(100) DEFAULT 'Metro Area',
  state VARCHAR(50) DEFAULT 'State',
  zip_code VARCHAR(20) NOT NULL,
  urgency VARCHAR(50) DEFAULT 'normal',
  preferred_contact_method VARCHAR(50) DEFAULT 'phone',
  status VARCHAR(50) DEFAULT 'new',
  priority VARCHAR(50) DEFAULT 'medium',
  notes LONGTEXT NULL,
  property_type VARCHAR(50) DEFAULT 'residential',
  preferred_date VARCHAR(50) NULL,
  preferred_time_slot VARCHAR(100) NULL,
  photo_url LONGTEXT NULL,
  commercial_details JSON NULL,
  system_sizing_details JSON NULL,
  maintenance_details JSON NULL,
  assigned_technician_id VARCHAR(100) NULL,
  assigned_technician_name VARCHAR(255) NULL,
  dispatch_status_notice TEXT NULL,
  internal_notes JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_leads_status (status),
  INDEX idx_leads_journey (journey),
  INDEX idx_leads_phone (phone),
  INDEX idx_leads_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Scheduled Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(100) PRIMARY KEY,
  appointment_number VARCHAR(100) NOT NULL UNIQUE,
  service_id VARCHAR(100) NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  address VARCHAR(500) NOT NULL,
  city VARCHAR(100) DEFAULT 'Metro Area',
  state VARCHAR(50) DEFAULT 'State',
  zip_code VARCHAR(20) NOT NULL,
  appointment_date VARCHAR(50) NOT NULL,
  time_slot VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'confirmed',
  duration_minutes INT DEFAULT 90,
  estimated_duration_minutes INT DEFAULT 90,
  is_emergency BOOLEAN DEFAULT FALSE,
  issue_description TEXT NULL,
  price DECIMAL(10, 2) DEFAULT 0.00,
  technician_id VARCHAR(100) NULL,
  technician_name VARCHAR(255) NULL,
  photo_url LONGTEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_appointments_date (appointment_date),
  INDEX idx_appointments_status (status),
  INDEX idx_appointments_phone (customer_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Project Estimates & Quotations
CREATE TABLE IF NOT EXISTS estimates (
  id VARCHAR(100) PRIMARY KEY,
  estimate_number VARCHAR(100) NOT NULL UNIQUE,
  lead_id VARCHAR(100) NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  address VARCHAR(500) NOT NULL,
  city VARCHAR(100) DEFAULT 'Metro Area',
  state VARCHAR(50) DEFAULT 'State',
  zip_code VARCHAR(20) NOT NULL,
  status VARCHAR(50) DEFAULT 'sent',
  subtotal DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0.00,
  tax_amount DECIMAL(10, 2) DEFAULT 0.00,
  total DECIMAL(10, 2) NOT NULL,
  line_items JSON NOT NULL,
  notes TEXT NULL,
  valid_until VARCHAR(50) NOT NULL,
  accepted_at VARCHAR(50) NULL,
  rejected_at VARCHAR(50) NULL,
  signature_name VARCHAR(255) NULL,
  financing_requested BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_estimates_status (status),
  INDEX idx_estimates_number (estimate_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Customer Profiles
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(100) PRIMARY KEY,
  first_name VARCHAR(150) NOT NULL,
  last_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  address VARCHAR(500) NOT NULL,
  city VARCHAR(100) DEFAULT 'Metro Area',
  state VARCHAR(50) DEFAULT 'State',
  zip_code VARCHAR(20) NOT NULL,
  membership_tier VARCHAR(50) DEFAULT 'none',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customers_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Customer Installed Equipment
CREATE TABLE IF NOT EXISTS customer_equipment (
  id VARCHAR(100) PRIMARY KEY,
  customer_id VARCHAR(100) NOT NULL,
  type VARCHAR(150) NOT NULL,
  manufacturer VARCHAR(150) NOT NULL,
  model VARCHAR(150) NULL,
  serial_number VARCHAR(150) NULL,
  install_date VARCHAR(50) NULL,
  last_service_date VARCHAR(50) NULL,
  filter_size VARCHAR(50) NULL,
  condition_status VARCHAR(50) DEFAULT 'Optimal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_equipment_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Theme & Visual Configuration
CREATE TABLE IF NOT EXISTS theme_settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  primary_color VARCHAR(20) DEFAULT '#1d4ed8',
  secondary_color VARCHAR(20) DEFAULT '#0f172a',
  accent_color VARCHAR(20) DEFAULT '#f59e0b',
  background_color VARCHAR(20) DEFAULT '#f8fafc',
  text_color VARCHAR(20) DEFAULT '#0f172a',
  heading_font VARCHAR(100) DEFAULT 'Plus Jakarta Sans',
  body_font VARCHAR(100) DEFAULT 'Inter',
  border_radius VARCHAR(20) DEFAULT '1rem',
  button_style VARCHAR(50) DEFAULT 'rounded',
  custom_css LONGTEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Homepage Section Ordering & Visibility
CREATE TABLE IF NOT EXISTS homepage_sections (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  order_index INT NOT NULL DEFAULT 0,
  config_json JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Navigation Menu Configuration
CREATE TABLE IF NOT EXISTS navigation_items (
  id VARCHAR(100) PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  path VARCHAR(255) NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  is_external BOOLEAN DEFAULT FALSE,
  is_cta BOOLEAN DEFAULT FALSE,
  parent_id VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Feature Flags
CREATE TABLE IF NOT EXISTS feature_flags (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  online_booking BOOLEAN DEFAULT TRUE,
  emergency_triage BOOLEAN DEFAULT TRUE,
  sizing_calculator BOOLEAN DEFAULT TRUE,
  membership_club BOOLEAN DEFAULT TRUE,
  live_chat BOOLEAN DEFAULT TRUE,
  financing_calculator BOOLEAN DEFAULT TRUE,
  review_submission BOOLEAN DEFAULT TRUE,
  blog_enabled BOOLEAN DEFAULT TRUE,
  custom_forms BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Market & Regional Localization Settings
CREATE TABLE IF NOT EXISTS market_settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  country VARCHAR(100) DEFAULT 'United States',
  region_or_state VARCHAR(100) DEFAULT 'State',
  primary_city VARCHAR(100) DEFAULT 'Metro Area',
  service_radius_miles INT DEFAULT 45,
  currency VARCHAR(10) DEFAULT '$',
  temperature_unit VARCHAR(10) DEFAULT 'F',
  postal_code_label VARCHAR(50) DEFAULT 'ZIP Code',
  tax_rate DECIMAL(6, 4) DEFAULT 0.0825,
  emergency_dispatch_sla_minutes INT DEFAULT 15,
  business_hours_text VARCHAR(255) DEFAULT 'Mon - Sat: 7:00 AM - 8:00 PM | Sun: Emergency Dispatch Only',
  closed_sundays_for_routine BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Custom Forms Builder
CREATE TABLE IF NOT EXISTS forms (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NULL,
  fields JSON NOT NULL,
  notification_email VARCHAR(150) NULL,
  submit_button_text VARCHAR(100) DEFAULT 'Submit',
  success_message TEXT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. Form Submissions
CREATE TABLE IF NOT EXISTS form_submissions (
  id VARCHAR(100) PRIMARY KEY,
  form_id VARCHAR(100) NOT NULL,
  form_slug VARCHAR(255) NOT NULL,
  data JSON NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(50) NULL,
  user_agent VARCHAR(500) NULL,
  INDEX idx_form_submissions_slug (form_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. Dynamic Landing Pages
CREATE TABLE IF NOT EXISTS pages (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  meta_description TEXT NULL,
  published BOOLEAN DEFAULT TRUE,
  blocks JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pages_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23B. Site Pages (Full-Page Section Content CMS)
CREATE TABLE IF NOT EXISTS site_pages (
  id VARCHAR(100) PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  meta_description TEXT NULL,
  nav_label VARCHAR(100) NULL,
  sections JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_site_pages_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. Admin Users & Security
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NULL,
  active BOOLEAN DEFAULT TRUE,
  last_login VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 25. SaaS Client Tenants (Multi-Tenant & Rental Management)
CREATE TABLE IF NOT EXISTS client_tenants (
  id VARCHAR(100) PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  domain VARCHAR(255) NULL,
  contact_name VARCHAR(150) NOT NULL,
  contact_email VARCHAR(150) NOT NULL,
  contact_phone VARCHAR(50) NULL,
  city VARCHAR(100) DEFAULT 'Metro City',
  state VARCHAR(50) DEFAULT 'State',
  license_type VARCHAR(50) NOT NULL, -- monthly_rental or one_time_buyout
  plan_tier VARCHAR(50) NOT NULL, -- starter, professional, enterprise
  monthly_rental_rate DECIMAL(10, 2) DEFAULT 0.00,
  buyout_price DECIMAL(10, 2) DEFAULT 0.00,
  billing_status VARCHAR(50) DEFAULT 'active',
  active BOOLEAN DEFAULT TRUE,
  license_start_date VARCHAR(50) NULL,
  perpetual_license_key VARCHAR(100) NULL,
  max_monthly_leads INT DEFAULT 500,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenants_status (billing_status),
  INDEX idx_tenants_license (license_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 26. SaaS Invoices
CREATE TABLE IF NOT EXISTS saas_invoices (
  id VARCHAR(100) PRIMARY KEY,
  client_id VARCHAR(100) NOT NULL,
  invoice_number VARCHAR(100) NOT NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'paid',
  invoice_date VARCHAR(50) NOT NULL,
  due_date VARCHAR(50) NOT NULL,
  paid_at VARCHAR(50) NULL,
  plan_tier VARCHAR(50) NOT NULL,
  license_type VARCHAR(50) NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_saas_invoices_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 27. SaaS Platform Configuration
CREATE TABLE IF NOT EXISTS saas_config (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  platform_name VARCHAR(255) DEFAULT 'HVAC SaaS Engine',
  allow_public_onboarding BOOLEAN DEFAULT TRUE,
  payment_gateway_mode VARCHAR(50) DEFAULT 'test',
  plans JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 28. Integrations Configuration
CREATE TABLE IF NOT EXISTS integrations (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  config JSON NULL,
  last_sync_at VARCHAR(50) NULL,
  status VARCHAR(50) DEFAULT 'disconnected',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 29. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(100) PRIMARY KEY,
  timestamp VARCHAR(50) NOT NULL,
  actor VARCHAR(150) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_logs_actor (actor),
  INDEX idx_audit_logs_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
