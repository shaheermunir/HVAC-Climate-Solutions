export type UrgencyLevel = 'emergency' | 'high' | 'normal' | 'low';
export type PropertyType = 'residential' | 'commercial';
export type ContactMethod = 'phone' | 'text' | 'email';
export type ServiceCategoryKey = 'cooling' | 'heating' | 'iaq' | 'ducts' | 'commercial' | 'controls' | 'maintenance';

export interface BusinessSettings {
  businessName: string;
  tagline: string;
  country: string;
  primaryCity: string;
  state: string;
  serviceAreasSummary: string;
  primaryPhone: string;
  emergencyPhone: string;
  businessEmail: string;
  physicalAddress: string;
  businessHours: string;
  emergencyAvailability: string;
  bookingTimezone: string;
  currency: string;
  licenseNumber: string;
  satisfactionGuarantee: string;
  workmanshipWarranty: string;
  financingPartners: string[];
  googleRating: number;
  reviewCount: number;
  logo?: string;
}

export interface ServiceFAQ {
  question: string;
  answer: string;
}

export interface ServiceRecord {
  id: string;
  slug: string;
  name: string;
  category: ServiceCategoryKey;
  shortDescription: string;
  fullDescription: string;
  benefits: string[];
  problemsAddressed: string[];
  symptoms: string[];
  process: string[];
  options: string[];
  supportedEquipment: string[];
  supportedBrands: string[];
  warrantyInfo: string;
  pricingApproach: string;
  priceStartingAt?: number;
  isFinancingAvailable: boolean;
  faqs: ServiceFAQ[];
  relatedServices: string[];
  isBookingEligible: boolean;
  isEmergencyEligible: boolean;
  seoTitle: string;
  seoDescription: string;
  isPublished: boolean;
  badge?: string;
  imageUrl?: string;
}

export interface ServiceArea {
  id: string;
  slug: string;
  name: string;
  type: 'city' | 'county' | 'region';
  zipCodes: string[];
  phone: string;
  emergencyAvailable: boolean;
  description: string;
  popularServices: string[];
  active: boolean;
  coordinates?: { lat: number; lng: number };
}

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'assigned'
  | 'appointment_requested'
  | 'appointment_confirmed'
  | 'estimate_pending'
  | 'estimate_sent'
  | 'won'
  | 'lost'
  | 'closed';

export interface DispatcherNote {
  id: string;
  author: string;
  timestamp: string;
  note: string;
}

export interface Lead {
  id: string;
  leadNumber: string;
  source: 'website_form' | 'emergency_call' | 'estimate_tool' | 'online_booking' | 'chat_assistant' | 'commercial_rfp' | 'maintenance_request' | 'installation_estimate' | 'emergency_triage' | string;
  journey?: 'emergency' | 'routine' | 'estimate' | 'maintenance' | 'commercial';
  campaign?: string;
  serviceRequested: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  urgency: UrgencyLevel;
  preferredContactMethod: ContactMethod;
  status: LeadStatus;
  notes?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  followUpDate?: string;
  propertyType: PropertyType;
  estimatedSystemAge?: string;
  homeSquareFootage?: number;
  photoUrl?: string;
  isDuplicate?: boolean;
  duplicateOfLeadNumber?: string;
  outOfServiceArea?: boolean;
  dispatchStatusNotice?: string;
  commercialDetails?: {
    companyName?: string;
    facilityType?: string;
    rtuCount?: number;
    squareFootage?: number;
    approxSqFt?: number;
    pmaInterest?: boolean;
  };
  dispatcherNotes?: DispatcherNote[];
}

export type AppointmentStatus =
  | 'requested'
  | 'pending_confirmation'
  | 'confirmed'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rescheduled'
  | 'no_show';

export interface Appointment {
  id: string;
  appointmentNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  state?: string;
  zipCode: string;
  serviceId: string;
  serviceName: string;
  issueDescription: string;
  date: string;
  timeSlot: string;
  durationMinutes: number;
  estimatedDurationMinutes?: number;
  price?: number;
  technicianId?: string;
  technicianName?: string;
  status: AppointmentStatus;
  isEmergency: boolean;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Technician {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  photo?: string;
  skills: string[];
  specialties?: string[];
  certifications?: string[];
  serviceAreas: string[];
  rating: number;
  completedJobsCount: number;
  active: boolean;
  workingHours: string;
}

export interface EstimateLineItem {
  id: string;
  description: string;
  category: 'equipment' | 'labor' | 'permit' | 'materials';
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  zipCode: string;
  serviceCategory: string;
  projectDescription: string;
  lineItems: EstimateLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  expirationDate: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  customerNotes?: string;
  internalNotes?: string;
  signedAt?: string;
  customerSignatureName?: string;
  createdAt: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  priceMonthly: number;
  priceAnnual: number;
  visitsPerYear: number;
  discountPercent: number;
  benefits: string[];
  isPopular?: boolean;
  active: boolean;
}

export interface MembershipSubscription {
  id: string;
  subscriptionNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  planId: string;
  planName: string;
  status: 'active' | 'pending' | 'cancelled';
  billingCycle: 'monthly' | 'annual';
  nextServiceDue: string;
  renewalDate: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountAmount: number;
  eligibleServices: string[];
  validUntil: string;
  terms: string;
  active: boolean;
  isFeatured?: boolean;
}

export interface Review {
  id: string;
  authorName: string;
  city: string;
  rating: number;
  date: string;
  text: string;
  serviceCategory: string;
  verifiedCustomer: boolean;
  source: 'Google Verified' | 'Direct Website' | 'Angi' | 'BBB';
  status: 'approved' | 'pending' | 'rejected';
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  publishDate: string;
  readTime: string;
  coverImage?: string;
  tags: string[];
  relatedServiceSlugs: string[];
  isPublished: boolean;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  category: string;
  city: string;
  date: string;
  equipmentInstalled: string;
  problem: string;
  solution: string;
  outcome: string;
  beforeImage?: string;
  afterImage?: string;
  customerQuote?: string;
  customerName?: string;
  isFeatured: boolean;
}

export interface EquipmentItem {
  id: string;
  type: string;
  manufacturer: string;
  modelNumber: string;
  serialNumber: string;
  installDate: string;
  lastServicedDate: string;
  filterSize: string;
  condition: 'Optimal' | 'Fair' | 'Requires Attention' | 'Critical';
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  role: 'customer' | 'admin' | 'dispatcher' | 'technician';
  membershipTier?: string;
  equipment: EquipmentItem[];
  createdAt: string;
}

export interface IntegrationConfig {
  id: string;
  name: string;
  provider: string;
  category: 'ai' | 'crm' | 'email' | 'sms' | 'maps' | 'payments' | 'analytics';
  status: 'connected' | 'configured' | 'awaiting_credentials' | 'testing';
  lastSync?: string;
  details: string;
  credentialsSet: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  borderColor: string;
  buttonRadius: string;
  cardRadius: string;
  headingFont: string;
  bodyFont: string;
  headerBg: string;
  footerBg: string;
  heroBg: string;
  logoUrl?: string;
  status: 'draft' | 'published';
  updatedAt: string;
  publishedAt?: string;
}

export interface HomepageSection {
  id: string;
  type:
    | 'hero'
    | 'announcement'
    | 'journeys'
    | 'services'
    | 'why_choose_us'
    | 'emergency_callout'
    | 'reviews'
    | 'promotions'
    | 'membership_plans'
    | 'commercial_callout'
    | 'calculator'
    | 'service_areas'
    | 'faq'
    | 'contact_booking';
  name: string;
  enabled: boolean;
  order: number;
  heading?: string;
  subheading?: string;
  badge?: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundStyle?: 'default' | 'subtle' | 'dark' | 'brand';
}

export interface NavMenuItem {
  id: string;
  label: string;
  path: string;
  order: number;
  enabled: boolean;
  isButton?: boolean;
}

export interface NavigationConfig {
  announcement: {
    enabled: boolean;
    text: string;
    linkText?: string;
    linkUrl?: string;
  };
  menuItems: NavMenuItem[];
  headerCta: {
    label: string;
    action: string;
    phoneDisplay: string;
  };
  footer: {
    aboutText: string;
    copyrightText: string;
    licenseText: string;
    socialLinks: { platform: string; url: string }[];
  };
}

export interface FeatureFlags {
  onlineBooking: boolean;
  emergencyService: boolean;
  estimateCalculator: boolean;
  maintenanceMemberships: boolean;
  commercialEnquiries: boolean;
  customerPortal: boolean;
  reviews: boolean;
  blog: boolean;
  aiAssistant: boolean;
  financing: boolean;
}

export interface MarketSettings {
  country: string;
  regionOrState: string;
  primaryCity: string;
  serviceRadiusMiles: number;
  currency: string;
  temperatureUnit: 'F' | 'C';
  postalCodeLabel: string;
  taxRate: number;
  emergencyDispatchSlaMinutes: number;
  businessHoursText: string;
  closedSundaysForRoutine: boolean;
}

export interface FormFieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface CustomFormDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  enabled: boolean;
  fields: FormFieldDefinition[];
  notificationEmail: string;
  successMessage: string;
  createdAt: string;
}

export interface PageBlock {
  id: string;
  type: 'rich_text' | 'hero' | 'cards' | 'cta' | 'faq' | 'form';
  title?: string;
  content?: string;
  items?: { title: string; description: string; icon?: string }[];
}

export interface PageSectionItem {
  id: string;
  title: string;
  description: string;
  badge?: string;
  icon?: string;
  linkText?: string;
  linkUrl?: string;
  metadata?: Record<string, any>;
}

export interface PageSection {
  id: string;
  type: string;
  name: string;
  heading: string;
  subheading?: string;
  kicker?: string;
  badge?: string;
  content?: string;
  buttonText?: string;
  buttonLink?: string;
  buttonAction?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  secondaryButtonAction?: string;
  enabled: boolean;
  order: number;
  backgroundStyle?: 'default' | 'subtle' | 'dark' | 'brand';
  items?: PageSectionItem[];
  settings?: Record<string, any>;
}

export interface SitePage {
  id: string;
  slug: string;
  title: string;
  navLabel: string;
  metaDescription: string;
  isPublished: boolean;
  sections: PageSection[];
  updatedAt?: string;
}

export interface PageDefinition {
  id: string;
  slug: string;
  title: string;
  metaDescription: string;
  blocks: PageBlock[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  passwordHash?: string;
  phone?: string;
  role: 'super_admin' | 'business_admin' | 'content_editor' | 'marketing_manager' | 'dispatcher' | 'technician';
  permissions?: string[];
  technicianId?: string;
  mustChangePassword?: boolean;
  status: 'active' | 'suspended';
  lastLogin?: string;
  createdAt: string;
}

// -------------------------------------------------------------
// SAAS PLATFORM & CLIENT TENANT SUBSCRIPTION TYPES
// -------------------------------------------------------------
export type SaasLicenseType = 'monthly_rental' | 'one_time_buyout';

export type SaasSubscriptionStatus =
  | 'active'
  | 'trial'
  | 'past_due'
  | 'suspended'
  | 'cancelled';

export type SaasPlanTier = 'starter' | 'professional' | 'enterprise';

export interface SaasInvoiceRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  type: 'rental_charge' | 'one_time_buyout' | 'addon_setup';
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  transactionRef: string;
  pdfUrl?: string;
}

export interface ClientTenantFeatures {
  customDomain: boolean;
  onlineBooking: boolean;
  emergencyDispatch: boolean;
  manualJEstimates: boolean;
  maintenanceClub: boolean;
  commercialRfp: boolean;
  seoBlog: boolean;
  aiAssistant: boolean;
  whiteLabel: boolean;
  prioritySupport: boolean;
}

export interface ClientTenant {
  id: string;
  companyName: string;
  slug: string;
  primaryDomain: string;
  subdomain: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  licenseType: SaasLicenseType;
  planTier: SaasPlanTier;
  status: SaasSubscriptionStatus;
  monthlyRentalFee: number;
  oneTimeBuyoutFee?: number;
  billingCycleStartDate: string;
  nextRenewalDate?: string;
  trialEndsDate?: string;
  perpetualLicenseKey?: string;
  leadQuotaMonthly: number;
  maxUsers: number;
  featuresEnabled: ClientTenantFeatures;
  invoices: SaasInvoiceRecord[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaasPlanOption {
  id: string;
  name: string;
  tier: SaasPlanTier;
  licenseType: SaasLicenseType;
  price: number;
  billingPeriod: 'monthly' | 'one_time';
  description: string;
  features: string[];
  isPopular?: boolean;
}

export interface SaasPlatformConfig {
  platformName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  stripeConnected: boolean;
  plans: SaasPlanOption[];
}

