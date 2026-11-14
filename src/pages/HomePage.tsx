import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Phone,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronDown,
  MapPin,
  Flame,
  Wind,
  Layers,
  ThermometerSnowflake,
  Star,
  Zap,
  Award,
  Check,
  Building2,
  Wrench,
  Calculator,
  Tag,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { HvacSizingCalculator } from '../components/HvacSizingCalculator';
import { initialHomepageSections } from '../data/seedData';
import { HomepageSection } from '../types';

export const HomePage: React.FC = () => {
  const {
    settings,
    services,
    serviceAreas,
    reviews,
    projects,
    membershipPlans,
    promotions,
    homepageSections,
    themeConfig,
    openBookingModal,
    openEmergencyModal,
    openEstimateModal,
    openMaintenanceModal,
    openCommercialModal,
    setCurrentRoute,
  } = useApp();

  const [zipInput, setZipInput] = useState('');
  const [zipResult, setZipResult] = useState<{ checked: boolean; covered: boolean; areaName?: string } | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [copiedPromo, setCopiedPromo] = useState<string | null>(null);

  const isDarkHex = (hex?: string): boolean => {
    if (!hex || hex === 'transparent') return false;
    const clean = hex.trim().replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(clean)) return false;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.45;
  };

  const phone = settings?.primaryPhone || '(800) 555-0199';
  const emergencyPhone = settings?.emergencyPhone || '(800) 555-0911';
  const primaryCity = settings?.primaryCity || 'Metro Area';

  const handleZipCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanZip = zipInput.trim();
    if (!cleanZip) return;

    const matchedArea = serviceAreas.find((a) => a.zipCodes.includes(cleanZip) && a.active);
    if (matchedArea) {
      setZipResult({ checked: true, covered: true, areaName: matchedArea.name });
    } else {
      setZipResult({ checked: true, covered: false });
    }
  };

  const copyPromoCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedPromo(code);
    setTimeout(() => setCopiedPromo(null), 2500);
  };

  const faqs = [
    {
      q: 'How fast can an emergency technician arrive at my home?',
      a: 'For verified heating or cooling emergencies in our primary service areas, our live dispatch team targets on-site arrival within 2 hours. Our rolling warehouse trucks carry universal dual-run capacitors, heavy-duty contactors, condenser fan motors, ECM modules, and digital leak-isolation equipment for 94% first-visit mechanical resolution.',
    },
    {
      q: 'Do you offer upfront flat-rate pricing?',
      a: 'Yes. You will always receive a written, straightforward diagnosis and fixed repair quote before any technician turns a wrench. Diagnostic fees ($89 standard) are credited 100% toward your repair once approved, with zero surprise travel surcharges or hidden fees.',
    },
    {
      q: 'What warranties and guarantees back your work?',
      a: 'All repairs are backed by our 2-Year Comprehensive Craftsmanship & Labor Guarantee. New system installations include up to a 10-Year Manufacturer Equipment Warranty plus our 100% Satisfaction Guarantee: if you are not fully satisfied within the first year, we adjust, repair, or remove the equipment and refund 100% of your investment.',
    },
    {
      q: 'Are heat pumps effective during extreme winter freezes and summer heat waves?',
      a: 'Modern variable-speed inverter heat pumps (such as Bosch IDS and Trane XV systems) are engineered specifically for extreme climates. They deliver full cooling performance in 115°F ambient heat and maintain reliable heating down to single digits without relying on expensive electric heat strips.',
    },
    {
      q: 'What is an ACCA Manual J load calculation, and why is it essential?',
      a: 'Manual J is the industry-standard engineering calculation published by the Air Conditioning Contractors of America (ACCA). It evaluates home square footage, window orientation, insulation R-values, and ceiling heights to determine exact cooling tonnage. Oversized systems short-cycle and leave air humid, while undersized systems run nonstop.',
    },
  ];

  const brandPartners = [
    { name: 'Trane', badge: 'Comfort Specialist' },
    { name: 'Carrier', badge: 'Factory Authorized' },
    { name: 'Bosch', badge: 'IDS Inverter Pro' },
    { name: 'Mitsubishi Electric', badge: 'Diamond Contractor' },
    { name: 'Lennox', badge: 'Premier Dealer' },
    { name: 'Daikin', badge: 'Elite Comfort Pro' },
  ];

  // -------------------------------------------------------------
  // 1. ANNOUNCEMENT / SEVERE WEATHER DISPATCH BANNER
  // -------------------------------------------------------------
  const renderAnnouncementBanner = (sec?: HomepageSection) => {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="p-3.5 sm:px-5 sm:py-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <Clock className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-semibold text-amber-950">
              {sec?.heading || 'Live Dispatch Active: Technicians On Call 24/7/365 Across All Serviced Communities'}
            </span>
          </div>
          <button
            type="button"
            onClick={openEmergencyModal}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-lg transition-colors shrink-0 text-center whitespace-nowrap"
          >
            Emergency Dispatch
          </button>
        </div>
      </section>
    );
  };

  // -------------------------------------------------------------
  // 2. HERO & VALUE PROPOSITION
  // -------------------------------------------------------------
  const renderHero = (sec?: HomepageSection) => {
    const heading = sec?.heading || 'Precision Climate Control. Engineered for Peak Demands.';
    const subheading =
      sec?.subheading ||
      'From emergency AC triage in peak summer heat waves to whisper-quiet inverter heat pumps, our master technicians deliver upfront flat-rate pricing, 2-hour dispatch windows, and guarantees that protect your family’s comfort.';
    const heroBg = themeConfig?.heroBg && themeConfig.heroBg !== 'transparent' ? themeConfig.heroBg : '#f8fafc';
    const heroIsDark = isDarkHex(heroBg);

    return (
      <section
        className="relative pt-8 sm:pt-12 pb-8 sm:pb-14 overflow-hidden transition-colors"
        style={{ backgroundColor: heroBg }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Left Content Column (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
              {/* Trust & Location Kicker - Zero Pill Discipline */}
              <div
                className={`flex flex-wrap items-center gap-2 text-xs font-semibold ${
                  heroIsDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                <span className={heroIsDark ? 'text-sky-300 font-bold' : 'text-blue-700 font-bold'}>
                  {primaryCity} & Regional Coverage
                </span>
                <span aria-hidden="true" className={heroIsDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                <span className={heroIsDark ? 'text-slate-200' : 'text-slate-800'}>Licensed & Insured</span>
                <span aria-hidden="true" className={heroIsDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                <span>NATE & EPA 608 Certified</span>
                <span aria-hidden="true" className={heroIsDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                <span className={`flex items-center gap-1 font-bold tabular-nums ${heroIsDark ? 'text-amber-300' : 'text-amber-600'}`}>
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                  <span>4.9 ({settings?.reviewCount || 384} Reviews)</span>
                </span>
              </div>

              {/* Dominant Value-Proposition Headline */}
              <h1
                className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] font-heading text-balance ${
                  heroIsDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {heading}
              </h1>

              {/* Subtitle / Value Proposition */}
              <p
                className={`text-base sm:text-lg leading-relaxed max-w-2xl ${
                  heroIsDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {subheading}
              </p>

              {/* CTA Button Block */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <a
                  href={`tel:${phone.replace(/\D/g, '')}`}
                  className="px-6 py-3.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 group whitespace-nowrap min-h-[44px] tabular-nums"
                  style={{
                    backgroundColor: themeConfig?.primaryColor || 'var(--color-primary)',
                    borderRadius: 'var(--radius-btn)',
                  }}
                >
                  <Phone className="w-4 h-4 text-blue-200 group-hover:scale-110 transition-transform shrink-0" />
                  <span>Call {phone}</span>
                </a>

                <button
                  type="button"
                  onClick={() => openBookingModal()}
                  className={`px-6 py-3.5 font-bold text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
                    heroIsDark
                      ? 'bg-white hover:bg-slate-100 text-slate-900'
                      : 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white'
                  }`}
                  style={{ borderRadius: 'var(--radius-btn)' }}
                >
                  <Calendar className={`w-4 h-4 shrink-0 ${heroIsDark ? 'text-slate-700' : 'text-slate-300'}`} />
                  <span>Schedule Service</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentRoute('/calculator')}
                  className={`px-4 py-3 text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap min-h-[44px] ${
                    heroIsDark ? 'text-sky-300 hover:text-white' : 'text-slate-700 hover:text-blue-700'
                  }`}
                >
                  <span>Sizing Calculator</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </div>

            {/* Right Media Column (5 cols) with Technician Image */}
            <div className="lg:col-span-5 relative flex">
              <div
                className={`relative w-full rounded-2xl overflow-hidden shadow-2xl border group bg-slate-950 ${
                  heroIsDark ? 'border-slate-700' : 'border-slate-200'
                }`}
              >
                <img
                  src="/images/hero_hvac_technician_1794171516085.jpg"
                  alt="Certified HVAC master technician servicing a residential heat pump condenser"
                  className="w-full h-80 sm:h-96 lg:h-full lg:min-h-[440px] object-cover object-center group-hover:scale-102 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />

                {/* Bottom Caption Card Over Scrim */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg text-slate-900 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-blue-700 block">
                      Certified Master Service
                    </span>
                    <span className="text-xs font-extrabold block text-slate-900">
                      NATE-Certified & Rolling Warehouse Stock
                    </span>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      94% First-Visit Diagnostic Resolution
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[11px] font-semibold text-slate-500 block">Guarantee</span>
                    <span className="text-xs font-bold text-emerald-700 whitespace-nowrap">2-Year Labor Warranty</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Equipment Partners & Manufacturer Trust Strip */}
        <div
          className={`border-t py-6 mt-12 ${
            heroIsDark
              ? 'border-slate-800 bg-slate-900/60'
              : 'border-slate-200/80 bg-white/80'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left shrink-0">
                <span
                  className={`text-[11px] font-semibold block ${
                    heroIsDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Factory Authorized & Certified Partner
                </span>
                <span
                  className={`text-xs font-bold ${
                    heroIsDark ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  Supported Industry Manufacturers
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 w-full md:w-auto items-center">
                {brandPartners.map((b, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl px-3 py-2 text-center border transition-colors ${
                      heroIsDark
                        ? 'bg-slate-800/80 border-slate-700 text-white'
                        : 'bg-white border-slate-200/90 text-slate-900 shadow-2xs hover:border-slate-300'
                    }`}
                  >
                    <span className="font-extrabold text-xs block font-heading">{b.name}</span>
                    <span
                      className={`text-[10px] block ${
                        heroIsDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {b.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // -------------------------------------------------------------
  // 3. 5-JOURNEY INTERACTIVE LAUNCHPAD
  // -------------------------------------------------------------
  const renderJourneysLaunchpad = (sec?: HomepageSection) => {
    const heading = sec?.heading || 'Choose Your Service Priority';
    const subheading =
      sec?.subheading ||
      'Direct triage pathways tailored for homeowners, facility managers, and urgent climate emergencies.';

    const journeys = [
      {
        id: 'journey-emergency',
        title: 'Emergency 24/7 Triage',
        subtitle: 'AC Outage or Freeze Risk',
        desc: 'Live on-call dispatcher triage. Rolling warehouse arrival in under 2 hours.',
        badge: 'Priority Dispatch',
        badgeColor: 'text-rose-700',
        borderColor: 'hover:border-rose-500',
        icon: AlertTriangle,
        iconBg: 'bg-rose-600 text-white',
        actionLabel: 'Emergency Dispatch',
        action: openEmergencyModal,
      },
      {
        id: 'journey-repair',
        title: 'Book Diagnostic Repair',
        subtitle: 'Upfront Flat-Rate Pricing',
        desc: 'Pick your preferred date and arrival window. Diagnostic fee credited 100% with repair.',
        badge: '$89 Diagnostic Waived',
        badgeColor: 'text-blue-700',
        borderColor: 'hover:border-blue-500',
        icon: Calendar,
        iconBg: 'bg-blue-600 text-white',
        actionLabel: 'Schedule Repair',
        action: () => openBookingModal(),
      },
      {
        id: 'journey-estimate',
        title: 'Free In-Home Estimate',
        subtitle: 'System Replacement & Rebates',
        desc: 'ACCA Manual J calculation. Qualifying for up to $2,000 in federal clean energy credits.',
        badge: 'Zero-Pressure Quote',
        badgeColor: 'text-indigo-700',
        borderColor: 'hover:border-indigo-500',
        icon: Calculator,
        iconBg: 'bg-indigo-600 text-white',
        actionLabel: 'Calculate Sizing',
        action: openEstimateModal,
      },
      {
        id: 'journey-tuneup',
        title: 'Precision Seasonal Tune-Up',
        subtitle: '21-Point System Rejuvenation',
        desc: 'Chemical coil wash, electrical torque testing, and refrigerant calibration to prevent breakdowns.',
        badge: 'Save $60 · $89',
        badgeColor: 'text-emerald-700',
        borderColor: 'hover:border-emerald-500',
        icon: Wrench,
        iconBg: 'bg-emerald-600 text-white',
        actionLabel: 'Book Tune-Up ($89)',
        action: openMaintenanceModal,
      },
      {
        id: 'journey-commercial',
        title: 'Commercial Facilities',
        subtitle: 'RTUs & Maintenance Plans',
        desc: 'Packaged rooftop units, economizers, 3-phase power balancing, and dedicated account manager.',
        badge: 'Commercial PMAs',
        badgeColor: 'text-slate-700',
        borderColor: 'hover:border-slate-800',
        icon: Building2,
        iconBg: 'bg-slate-900 text-white',
        actionLabel: 'Commercial Quote',
        action: openCommercialModal,
      },
    ];

    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <span className="text-xs font-bold text-blue-700 block mb-1">
            Streamlined Service Pathways
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-heading">
            {heading}
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl">
            {subheading}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {journeys.map((j, idx) => {
            const Icon = j.icon;
            return (
              <div
                key={j.id}
                className={`bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between transition-all shadow-xs hover:shadow-md ${j.borderColor} group`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-xs shrink-0 ${j.iconBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[11px] font-bold text-right ${j.badgeColor}`}>
                      0{idx + 1} · {j.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 font-heading group-hover:text-blue-700 transition-colors">
                    {j.title}
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                    {j.subtitle}
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {j.desc}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={j.action}
                  className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors text-center shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                  style={{ borderRadius: 'var(--radius-btn)' }}
                >
                  <span>{j.actionLabel}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  // -------------------------------------------------------------
  // 4. CRAFTSMANSHIP & TRUST PROOF STRIP
  // -------------------------------------------------------------
  const renderProofStrip = (_sec?: HomepageSection) => {
    return (
      <section
        className="text-white py-10 border-y border-slate-800 transition-colors"
        style={{ backgroundColor: themeConfig?.secondaryColor || '#0f172a' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/40 space-y-1.5">
              <span className="text-blue-300 font-bold block text-sm font-heading">01. Certified Craftsmanship</span>
              <p className="text-slate-300 text-xs leading-relaxed">
                NATE-certified, EPA 608 Universal mechanics with ongoing factory training on variable-speed inverter protocols.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/40 space-y-1.5">
              <span className="text-blue-300 font-bold block text-sm font-heading">02. Upfront Flat-Rate Pricing</span>
              <p className="text-slate-300 text-xs leading-relaxed">
                Transparent written quotes before any work begins. Diagnostic fee credited 100% upon repair approval.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/40 space-y-1.5">
              <span className="text-blue-300 font-bold block text-sm font-heading">03. 24/7 Rapid Triage</span>
              <p className="text-slate-300 text-xs leading-relaxed">
                Dedicated on-call dispatch team with guaranteed 2-hour arrival window for hazardous heat or freeze outages.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/40 space-y-1.5">
              <span className="text-blue-300 font-bold block text-sm font-heading">04. Written Comfort Guarantee</span>
              <p className="text-slate-300 text-xs leading-relaxed">
                {settings?.satisfactionGuarantee?.split(':')[0] || '100% Comfort Guarantee'} — backed by written craftsmanship protection.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // -------------------------------------------------------------
  // 5. FEATURED SERVICES BENTO GRID
  // -------------------------------------------------------------
  const renderServices = (sec?: HomepageSection) => {
    const heading = sec?.heading || 'Engineered Heating, Cooling & Air Quality';
    const subheading = sec?.subheading || 'Transparent service options backed by certified diagnostic protocols and genuine OEM parts.';

    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">
              <span>Comprehensive Climate Solutions</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-heading">
              {heading}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl">
              {subheading}
            </p>
          </div>
          <button
            onClick={() => setCurrentRoute('/services')}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 shrink-0"
          >
            <span>View All {services.length}+ Service Categories</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: AC Repair (Marquee Col-Span 2 on Desktop) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                <span className="font-bold text-blue-700">01. Cooling Emergency & Repair</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="font-medium text-slate-500">Primary Service</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 font-heading mb-3">
                Precision AC Diagnostics & Component Restoration
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 max-w-2xl">
                When your condenser hums without blowing cold or circuit breakers repeatedly trip during extreme summer heat,
                our technicians test motor windings, check dual-run microfarad tolerances, and use electronic sniffer probes
                to identify micro-leaks before recommending any component replacements.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Dual-Run Capacitors</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>ECM Blower Motors</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Contactor Replacement</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Subcooling Optimization</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Nitrogen Isolation Testing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Hard Start Kits</span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-500 tabular-nums">Diagnostic Fee: $89 (Waived with repair)</span>
              <button
                type="button"
                onClick={() => openBookingModal('srv-cooling-repair')}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
                style={{
                  backgroundColor: themeConfig?.primaryColor || 'var(--color-primary)',
                  borderRadius: 'var(--radius-btn)',
                }}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>Book AC Diagnostic</span>
              </button>
            </div>
          </div>

          {/* Card 2: Inverter Heat Pumps */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                <span className="font-bold text-emerald-700">02. Clean Energy & Efficiency</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-heading mb-2">
                Variable-Speed Inverter Heat Pumps
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed mb-4">
                Up to 20+ SEER2 variable-capacity compressors that ramp smoothly between 25% and 100%, delivering whisper-quiet
                cooling and non-stop humidity extraction.
              </p>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 mb-4 text-xs text-emerald-900">
                <span className="font-bold block mb-0.5">Federal 25C Tax Credit</span>
                <span>Qualify for up to $2,000 in immediate federal clean energy tax credits.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={openEstimateModal}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors text-center whitespace-nowrap"
              style={{ borderRadius: 'var(--radius-btn)' }}
            >
              Calculate System Rebates
            </button>
          </div>

          {/* Card 3: 21-Point Precision Tune-Up */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                <span className="font-bold text-blue-700">03. Preventative Care</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-heading mb-2">
                21-Point Precision Tune-Up & Rejuvenation
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed mb-4">
                Includes chemical coil wash, static pressure audit, refrigerant superheat calibration, electrical terminal
                torque testing, and condensate drain vacuuming.
              </p>
              <div className="flex items-baseline gap-2 mb-4 tabular-nums">
                <span className="text-2xl font-extrabold text-slate-900 font-mono">$89</span>
                <span className="text-xs text-slate-500 line-through">$149</span>
                <span className="text-xs font-bold text-emerald-700">Save $60 Today</span>
              </div>
            </div>
            <button
              type="button"
              onClick={openMaintenanceModal}
              className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors text-center whitespace-nowrap"
              style={{
                backgroundColor: themeConfig?.primaryColor || 'var(--color-primary)',
                borderRadius: 'var(--radius-btn)',
              }}
            >
              Schedule Seasonal Tune-Up
            </button>
          </div>

          {/* Card 4: Commercial Packaged RTU Solutions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                <span className="font-bold text-slate-700">04. Commercial & Facility</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-heading mb-2">
                Commercial RTUs & Facility PMAs
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed mb-4">
                Economizer calibration, 3-phase compressor rebuilding, automated belt tensioning, and planned maintenance
                agreements engineered to protect commercial tenant comfort.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600 mb-4">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>3-Phase Voltage Balance Checks</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Dedicated Commercial Account Manager</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={openCommercialModal}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors text-center whitespace-nowrap"
              style={{ borderRadius: 'var(--radius-btn)' }}
            >
              Request Commercial Proposal
            </button>
          </div>

          {/* Card 5: Indoor Air Quality & Filtration */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                <span className="font-bold text-blue-700">05. Wellness & Filtration</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-heading mb-2">
                Hospital-Grade Whole-Home Air Purification
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed mb-4">
                MERV 13-16 media filters, bipolar needlepoint ionization, and germicidal UVC coils that destroy allergens,
                mold spores, and VOCs without producing harmful ozone.
              </p>
              <span className="text-[11px] font-bold text-slate-500 block mb-4 tabular-nums">
                Captures 99.7% of Airborne Micro-Particulates
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 tabular-nums">From $650 Installed</span>
              <button
                type="button"
                onClick={() => openBookingModal('srv-iaq-filter')}
                className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg min-h-[36px] whitespace-nowrap"
                style={{
                  backgroundColor: themeConfig?.primaryColor || 'var(--color-primary)',
                  borderRadius: 'var(--radius-btn)',
                }}
              >
                Book Air Audit
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // -------------------------------------------------------------
  // 6. DEDICATED 24/7 EMERGENCY TRIAGE CALLOUT
  // -------------------------------------------------------------
  const renderEmergencyCallout = (sec?: HomepageSection) => {
    const heading = sec?.heading || 'Heating or Cooling Emergency? We Are On The Road.';
    const subheading =
      sec?.subheading ||
      'When outdoor temperatures reach extremes, climate outages can compromise safety. Our on-call master technicians are dispatched 24/7/365 with fully stocked mobile warehouses for 94% first-visit resolution.';

    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-linear-to-r from-rose-900 via-rose-950 to-slate-950 text-white p-8 sm:p-12 border border-rose-800/60 shadow-xl relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-2 text-rose-200 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
                <span>24/7 Emergency Response Active · On-Site Arrival &lt; 2 Hours</span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading text-white text-balance">
                {heading}
              </h2>

              <p className="text-rose-100/90 text-xs sm:text-sm leading-relaxed max-w-2xl">
                {subheading}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-rose-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-300 shrink-0" />
                  <span>No After-Hours Surcharges</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-300 shrink-0" />
                  <span>Universal In-Truck Parts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-300 shrink-0" />
                  <span className="tabular-nums">94% First-Visit Resolution</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3 shrink-0">
              <a
                href={`tel:${emergencyPhone.replace(/\D/g, '')}`}
                className="px-6 py-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold text-sm rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 text-center min-h-[48px] whitespace-nowrap tabular-nums"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span>Call Emergency: {emergencyPhone}</span>
              </a>

              <button
                type="button"
                onClick={openEmergencyModal}
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-colors text-center min-h-[44px] whitespace-nowrap"
              >
                Submit Emergency Intake Form
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // -------------------------------------------------------------
  // 7. ACCA MANUAL J LOAD SIZING CALCULATOR
  // -------------------------------------------------------------
  const renderCalculator = (sec?: HomepageSection) => {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HvacSizingCalculator />
      </section>
    );
  };

  // -------------------------------------------------------------
  // 8. PROMOTIONS & UTILITY REBATES SPECIALS
  // -------------------------------------------------------------
  const renderPromotions = (sec?: HomepageSection) => {
    const heading = sec?.heading || 'Exclusive Seasonal Specials & Clean Energy Rebates';
    const subheading =
      sec?.subheading ||
      'Take advantage of current manufacturer incentives, utility rebates, and limited-time precision tune-up specials.';

    const activePromos = promotions && promotions.length > 0
      ? promotions.filter((p) => p.active !== false)
      : [
          {
            id: 'promo-tuneup',
            title: '$89 Comprehensive AC Precision Tune-Up',
            description: 'Restore efficiency and prevent peak summer breakdowns with our 21-point chemical coil wash, electrical torque testing, and safety check.',
            code: 'TUNE89',
            discountType: 'fixed',
            discountAmount: 60,
            validUntil: 'Limited Time',
            terms: 'Valid for residential single-family systems. Cannot be combined with other offers.',
          },
          {
            id: 'promo-taxcredit',
            title: 'Federal 25C Heat Pump Tax Credit (Up to $2,000)',
            description: 'Claim up to 30% of project cost (max $2,000) on qualifying high-efficiency variable-speed inverter heat pumps installed this year.',
            code: 'CLEAN25C',
            discountType: 'fixed',
            discountAmount: 2000,
            validUntil: 'Annual Cap',
            terms: 'Consult your tax advisor. Qualifying equipment SEER2/EER2 standards apply.',
          },
          {
            id: 'promo-diagnostic',
            title: '$0 Diagnostic Fee With Any Completed Repair',
            description: 'When our technician diagnoses the issue and you approve the repair, the $89 diagnostic fee is credited 100% toward your repair bill.',
            code: 'DIAGFREE',
            discountType: 'fixed',
            discountAmount: 89,
            validUntil: 'Active Promo',
            terms: 'Credit applied at invoice upon repair authorization.',
          },
        ];

    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-1">
              Verified Rebates & Discounts
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-heading">
              {heading}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl">
              {subheading}
            </p>
          </div>
          <button
            onClick={() => openBookingModal()}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 shrink-0"
          >
            <span>Book With Any Promo Code</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activePromos.slice(0, 3).map((promo: any) => (
            <div
              key={promo.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-emerald-700 tabular-nums">
                    {promo.discountAmount ? `Save $${promo.discountAmount}` : 'Special Offer'}
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="text-slate-500 text-xs tabular-nums">
                    {promo.validUntil ? `Expires: ${promo.validUntil}` : 'Limited Time'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 font-heading">
                  {promo.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {promo.description}
                </p>

                {promo.terms && (
                  <p className="text-xs text-slate-500">
                    {promo.terms}
                  </p>
                )}
              </div>

              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => copyPromoCode(promo.code)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <Tag className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{promo.code}</span>
                  {copiedPromo === promo.code ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => openBookingModal()}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors whitespace-nowrap"
                  style={{
                    backgroundColor: themeConfig?.primaryColor || 'var(--color-primary)',
                    borderRadius: 'var(--radius-btn)',
                  }}
                >
                  Claim Offer
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  // -------------------------------------------------------------
  // 9. COMMERCIAL FACILITY RTU CALLOUT
  // -------------------------------------------------------------
  const renderCommercialCallout = (sec?: HomepageSection) => {
    const heading = sec?.heading || 'Commercial Facility HVAC & Packaged Unit Solutions';
    const subheading =
      sec?.subheading ||
      'Custom planned maintenance agreements, 3-phase compressor restoration, and rapid emergency dispatch for property managers and business owners.';

    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white border border-slate-800 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
                Industrial & Commercial Services
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading text-white">
                {heading}
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
                {subheading}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 text-xs">
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <span className="font-bold text-blue-300 block mb-1">Rooftop Packaged Units</span>
                  <span className="text-slate-400">Economizer setup, belt replacement, and refrigerant balancing for 3-phase RTUs.</span>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <span className="font-bold text-blue-300 block mb-1">Custom PMAs</span>
                  <span className="text-slate-400">Quarterly coil cleaning, filter rotation, and priority dispatch agreements.</span>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <span className="font-bold text-blue-300 block mb-1">Dedicated Account Team</span>
                  <span className="text-slate-400">Direct account manager with commercial dispatch priority.</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3 shrink-0">
              <button
                type="button"
                onClick={openCommercialModal}
                className="w-full px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-md text-center min-h-[44px]"
                style={{ borderRadius: 'var(--radius-btn)' }}
              >
                Request Commercial Facility Proposal
              </button>
              <a
                href={`tel:${phone.replace(/\D/g, '')}`}
                className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors text-center min-h-[44px] flex items-center justify-center gap-2"
                style={{ borderRadius: 'var(--radius-btn)' }}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Commercial Team: {phone}</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // -------------------------------------------------------------
  // 10. REAL WORK & CASE STUDIES (BEFORE / AFTER)
  // -------------------------------------------------------------
  const renderProjects = (sec?: HomepageSection) => {
    const heading = sec?.heading || 'Featured Replacement Projects';
    const subheading = sec?.subheading || 'Real installations, measured energy savings, and documented customer outcomes.';

    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-1">
              Documented Craftsmanship
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-heading">
              {heading}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              {subheading}
            </p>
          </div>
          <button
            onClick={() => setCurrentRoute('/portfolio')}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All Project Case Studies</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {(projects || []).slice(0, 2).map((proj) => {
            const imgSrc = (proj.afterImage || '/images/hvac_installation_ac_1794171517489.jpg').replace(
              /^\/src\/assets\/images\//,
              '/images/'
            );
            return (
              <div key={proj.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
                <div>
                  <div className="relative h-64 bg-slate-900 overflow-hidden">
                    <img
                      src={imgSrc}
                      alt={proj.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                      <span className="text-blue-700">{proj.category}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>{proj.city}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 font-heading">{proj.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{proj.solution || proj.problem}</p>
                    <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-lg">
                        <span className="text-[11px] font-bold text-slate-500 block">Challenge</span>
                        <span className="font-medium text-slate-800 line-clamp-1">{proj.problem}</span>
                      </div>
                      <div className="p-2.5 bg-emerald-50 rounded-lg">
                        <span className="text-[11px] font-bold text-emerald-700 block">Equipment Installed</span>
                        <span className="font-bold text-emerald-900 line-clamp-1">{proj.equipmentInstalled || proj.outcome}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {proj.customerQuote && (
                  <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs italic text-slate-600 flex items-center justify-between gap-2">
                    <span>"{proj.customerQuote}"</span>
                    <span className="font-semibold text-slate-800 not-italic shrink-0">— {proj.customerName}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  // -------------------------------------------------------------
  // 11. CLIMATE CARE CLUB MEMBERSHIP TIERS
  // -------------------------------------------------------------
  const renderMemberships = (sec?: HomepageSection) => {
    const heading = sec?.heading || 'The Climate Care Club™';
    const subheading =
      sec?.subheading ||
      'Routine semi-annual maintenance prevents 95% of unexpected summer breakdowns, extends system lifespan by up to 7 years, and guarantees VIP priority dispatch.';

    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold text-blue-700 block">
            Preventative Peace of Mind
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-heading text-balance">
            {heading}
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            {subheading}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {(membershipPlans || []).map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                plan.isPopular
                  ? 'bg-white border-blue-600 shadow-lg'
                  : 'bg-white border-slate-200 hover:shadow-md'
              }`}
            >
              <div className="space-y-4">
                <div>
                  {plan.isPopular && (
                    <span className="text-xs font-bold text-blue-700 block mb-1">
                      Most Popular Plan
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-slate-900 font-heading">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2 tabular-nums">
                    <span className="text-3xl font-extrabold text-slate-900 font-mono">${plan.priceMonthly}</span>
                    <span className="text-xs text-slate-500 font-medium">/ month</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5 tabular-nums">
                    or ${plan.priceAnnual} billed annually
                  </span>
                </div>

                <ul className="space-y-2 pt-4 border-t border-slate-100 text-xs text-slate-600">
                  {(plan.benefits || []).map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentRoute('/memberships')}
                  className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl transition-colors text-center whitespace-nowrap ${
                    plan.isPopular
                      ? 'bg-blue-700 hover:bg-blue-800 text-white shadow-xs'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                  style={{
                    backgroundColor: plan.isPopular ? (themeConfig?.primaryColor || 'var(--color-primary)') : undefined,
                    borderRadius: 'var(--radius-btn)',
                  }}
                >
                  Join Climate Care Club
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  // -------------------------------------------------------------
  // 12. VERIFIED REVIEWS & SOCIAL PROOF
  // -------------------------------------------------------------
  const renderReviews = (sec?: HomepageSection) => {
    const heading = sec?.heading || 'What Our Valued Customers Say';
    const subheading = sec?.subheading || 'Independent reviews collected from verified residential and commercial HVAC service calls across our territory.';

    return (
      <section className="bg-slate-100 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <span className="text-xs font-bold text-blue-700 block mb-1">
                Customer Trust & Verification
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-heading text-balance">
                {heading}
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl">
                {subheading}
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-center pr-4 border-r border-slate-200">
                <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums block">4.9</span>
                <div className="flex items-center justify-center gap-0.5 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
              </div>
              <div className="text-xs text-slate-600">
                <span className="font-bold text-slate-900 block tabular-nums">{settings?.reviewCount || 384} Verified Reviews</span>
                <span>Google & ACCA Master Certified</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(reviews || []).slice(0, 3).map((rev) => {
              const starCount = Math.max(1, Math.min(5, Math.round(Number(rev.rating) || 5)));
              return (
                <div key={rev.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[...Array(starCount)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500 font-medium tabular-nums">{rev.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                      <span>{rev.source || 'Verified Customer'}</span>
                      {rev.verifiedCustomer && (
                        <>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="text-emerald-700">Verified</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed italic">"{rev.text}"</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                    <div>
                      <span className="font-bold text-slate-900 block">{rev.authorName}</span>
                      <span className="text-slate-500 text-[11px]">{rev.city}</span>
                    </div>
                    <span className="text-[11px] text-blue-700 font-semibold">{rev.serviceCategory}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  // -------------------------------------------------------------
  // 13. SERVICE AREA & LOCAL ZIP CODE CHECKER
  // -------------------------------------------------------------
  const renderServiceAreas = (sec?: HomepageSection) => {
    const heading = sec?.heading || 'Serving Greater Metro & Surrounding Communities';
    const subheading = sec?.subheading || 'We maintain strategically placed service vehicles across the territory. Check instant availability for your specific ZIP code below.';

    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">
                Local Territory Coverage
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-heading">
                {heading}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {subheading}
              </p>

              <form onSubmit={handleZipCheck} className="flex flex-col sm:flex-row gap-3 pt-2">
                <input
                  type="text"
                  maxLength={5}
                  value={zipInput}
                  onChange={(e) => setZipInput(e.target.value)}
                  placeholder="Enter 5-Digit ZIP (e.g. 10001)"
                  className="px-4 py-3 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono w-full sm:w-64"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors whitespace-nowrap min-h-[44px]"
                  style={{
                    backgroundColor: themeConfig?.primaryColor || 'var(--color-primary)',
                    borderRadius: 'var(--radius-btn)',
                  }}
                >
                  Verify Service Area
                </button>
              </form>

              {zipResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 mt-2 ${
                    zipResult.covered
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                  }`}
                >
                  {zipResult.covered ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Great news!</strong> {zipInput} is in our active {zipResult.areaName} priority dispatch network.
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        ZIP code {zipInput} is outside standard radius. Emergency dispatch may be arranged upon request.
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Serviced Communities & Municipalities
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                {(serviceAreas || []).map((area) => (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => setCurrentRoute(`/service-areas/${area.slug}`)}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-500 rounded-lg text-slate-700 font-medium transition-colors"
                  >
                    {area.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // -------------------------------------------------------------
  // 14. SEARCHABLE FREQUENTLY ASKED QUESTIONS
  // -------------------------------------------------------------
  const renderFaq = (sec?: HomepageSection) => {
    const heading = sec?.heading || 'Frequently Asked Questions';
    const subheading = sec?.subheading || 'Common questions regarding warranties, emergency dispatch, and equipment options.';

    return (
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-1">
            Answers & Clarity
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-heading">
            {heading}
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            {subheading}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-900 hover:text-blue-700 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${activeFaq === idx ? 'rotate-180 text-blue-600' : ''}`}
                />
              </button>
              {activeFaq === idx && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  // -------------------------------------------------------------
  // 15. CONVERSION CLOSING STRIP
  // -------------------------------------------------------------
  const renderClosing = (sec?: HomepageSection) => {
    const heading = sec?.heading || 'Experience the Climate Care Standard Today.';
    const subheading = sec?.subheading || 'Book a precision tune-up, schedule emergency diagnostics, or request a free in-home load calculation with zero pressure.';

    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 transition-colors"
          style={{
            backgroundColor: themeConfig?.primaryColor || 'var(--color-primary)',
            borderRadius: 'var(--radius-card)',
          }}
        >
          <div className="space-y-2 max-w-xl">
            <span className="text-blue-200 text-xs font-bold uppercase tracking-wider">
              Ready for Uncompromising Comfort?
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading text-white">
              {heading}
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
              {subheading}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={() => openBookingModal()}
              className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-colors whitespace-nowrap min-h-[44px]"
              style={{ borderRadius: 'var(--radius-btn)' }}
            >
              Book Service Online
            </button>
            <a
              href={`tel:${phone.replace(/\D/g, '')}`}
              className="px-6 py-3.5 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs sm:text-sm rounded-xl border border-slate-700 transition-colors whitespace-nowrap min-h-[44px]"
              style={{ borderRadius: 'var(--radius-btn)' }}
            >
              Call {phone}
            </a>
          </div>
        </div>
      </section>
    );
  };

  // -------------------------------------------------------------
  // DYNAMIC SECTION RENDERER ACCORDING TO HOMEPAGE SECTIONS CONFIG
  // -------------------------------------------------------------
  const activeSections = (homepageSections && homepageSections.length > 0 ? homepageSections : initialHomepageSections)
    .slice()
    .sort((a, b) => a.order - b.order)
    .filter((sec) => sec.enabled !== false);

  return (
    <div className="space-y-16 lg:space-y-24 pb-20">
      {activeSections.map((sec) => {
        const rawType = (sec.type || sec.id.replace(/^sec-/, '')).replace(/-/g, '_').toLowerCase();
        switch (rawType) {
          case 'announcement':
            return <React.Fragment key={sec.id}>{renderAnnouncementBanner(sec)}</React.Fragment>;
          case 'hero':
            return <React.Fragment key={sec.id}>{renderHero(sec)}</React.Fragment>;
          case 'journeys':
            return <React.Fragment key={sec.id}>{renderJourneysLaunchpad(sec)}</React.Fragment>;
          case 'services':
            return <React.Fragment key={sec.id}>{renderServices(sec)}</React.Fragment>;
          case 'why_choose_us':
            return <React.Fragment key={sec.id}>{renderProofStrip(sec)}</React.Fragment>;
          case 'emergency_callout':
            return <React.Fragment key={sec.id}>{renderEmergencyCallout(sec)}</React.Fragment>;
          case 'calculator':
            return <React.Fragment key={sec.id}>{renderCalculator(sec)}</React.Fragment>;
          case 'promotions':
            return <React.Fragment key={sec.id}>{renderPromotions(sec)}</React.Fragment>;
          case 'commercial':
          case 'commercial_callout':
            return <React.Fragment key={sec.id}>{renderCommercialCallout(sec)}</React.Fragment>;
          case 'projects':
          case 'portfolio':
          case 'case_studies':
            return <React.Fragment key={sec.id}>{renderProjects(sec)}</React.Fragment>;
          case 'memberships':
          case 'membership_plans':
            return <React.Fragment key={sec.id}>{renderMemberships(sec)}</React.Fragment>;
          case 'reviews':
            return <React.Fragment key={sec.id}>{renderReviews(sec)}</React.Fragment>;
          case 'service_areas':
            return <React.Fragment key={sec.id}>{renderServiceAreas(sec)}</React.Fragment>;
          case 'faq':
            return <React.Fragment key={sec.id}>{renderFaq(sec)}</React.Fragment>;
          case 'contact':
          case 'contact_booking':
          case 'closing':
            return <React.Fragment key={sec.id}>{renderClosing(sec)}</React.Fragment>;
          default:
            return null;
        }
      })}
    </div>
  );
};
