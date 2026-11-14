import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  Phone,
  AlertTriangle,
  Menu,
  X,
  ChevronDown,
  Calendar,
  ShieldCheck,
  User,
  LogOut,
  Lock,
  Sparkles,
  Clock,
} from 'lucide-react';
import { ROLE_LABELS, getDashboardRouteForRole, normalizeStaffRole } from '../shared/rbac';

export const Navbar: React.FC = () => {
  const {
    settings,
    services,
    currentRoute,
    setCurrentRoute,
    openBookingModal,
    openEmergencyModal,
    openEstimateModal,
    openMaintenanceModal,
    openCommercialModal,
    adminUser,
    logoutAdmin,
    setIsAiChatOpen,
    navigationConfig,
    featureFlags,
    themeConfig,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const staffDashboardRoute = adminUser ? getDashboardRouteForRole(adminUser.role) : '/admin';
  const staffRoleLabel = adminUser
    ? ROLE_LABELS[normalizeStaffRole(adminUser.role) as keyof typeof ROLE_LABELS] || adminUser.role
    : '';

  const phone = settings?.primaryPhone || '(800) 555-0199';
  const emergencyPhone = settings?.emergencyPhone || '(800) 555-0911';
  const businessName = settings?.businessName || 'Airflow Climate Solutions';
  const logoUrl = themeConfig?.logoUrl || settings?.logo;
  const brandInitial = (settings?.businessName || 'Airflow').charAt(0).toUpperCase();

  const isEmergencyEnabled = featureFlags?.emergencyService !== false;
  const isAnnouncementEnabled = navigationConfig?.announcement?.enabled !== false && isEmergencyEnabled;
  const announcementText =
    navigationConfig?.announcement?.text || '24/7 Live Emergency Dispatch Active · On-Site ETA < 90 Mins';
  const announcementLinkText =
    navigationConfig?.announcement?.linkText || 'Request Emergency Dispatch →';
  const announcementLinkUrl = navigationConfig?.announcement?.linkUrl || '/emergency';
  const headerCtaLabel = navigationConfig?.headerCta?.label || 'Book Online';
  const headerCtaPhone = navigationConfig?.headerCta?.phoneDisplay || phone;

  const navigateTo = (route: string) => {
    setCurrentRoute(route);
    setMobileMenuOpen(false);
    setServicesDropdownOpen(false);
    setAccountMenuOpen(false);
  };

  const configuredNavItems =
    navigationConfig?.menuItems && navigationConfig.menuItems.length > 0
      ? navigationConfig.menuItems
          .filter((i) => i.enabled !== false)
          .sort((a, b) => a.order - b.order)
      : [
          { id: 'nav-home', label: 'Home', path: '/', order: 1, enabled: true },
          { id: 'nav-services', label: 'Services', path: '/services', order: 2, enabled: true },
          { id: 'nav-areas', label: 'Service Areas', path: '/service-areas', order: 3, enabled: true },
          { id: 'nav-club', label: 'Comfort Club', path: '/memberships', order: 4, enabled: true },
          { id: 'nav-financing', label: 'Financing', path: '/financing', order: 5, enabled: true },
          { id: 'nav-reviews', label: 'Reviews', path: '/reviews', order: 6, enabled: true },
          { id: 'nav-resources', label: 'Resources', path: '/blog', order: 7, enabled: true },
          { id: 'nav-about', label: 'About', path: '/about', order: 8, enabled: true },
        ];

  // Dynamic responsive overflow measurement so nav links NEVER collide with Call Dispatch or Brand
  const navContainerRef = useRef<HTMLElement | null>(null);
  const measureItemsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const accountRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(configuredNavItems.length);

  const recalculateNavFit = useCallback(() => {
    const navEl = navContainerRef.current;
    if (!navEl) return;
    const availableWidth = navEl.clientWidth;
    if (availableWidth <= 0) return;

    const isXl = window.innerWidth >= 1280;
    const itemGap = isXl ? 16 : 12;
    const safetyBuffer = 16;
    let usedWidth = 0;
    let fitCount = 0;

    for (let i = 0; i < configuredNavItems.length; i++) {
      const span = measureItemsRef.current[i];
      if (!span) break;
      const itemWidth = Math.ceil(span.getBoundingClientRect().width);
      const nextWidth = fitCount === 0 ? itemWidth : usedWidth + itemGap + itemWidth;
      if (nextWidth <= availableWidth - safetyBuffer) {
        usedWidth = nextWidth;
        fitCount++;
      } else {
        break;
      }
    }

    // Keep at least 1 primary link when desktop nav column exists
    const clampedCount = Math.max(fitCount, configuredNavItems.length > 0 ? 1 : 0);
    setVisibleCount((prev) => (prev !== clampedCount ? clampedCount : prev));
  }, [configuredNavItems.length]);

  useLayoutEffect(() => {
    recalculateNavFit();
  }, [recalculateNavFit, configuredNavItems]);

  useEffect(() => {
    const navEl = navContainerRef.current;
    if (!navEl) return;

    let rafId = 0;
    const scheduleRecalc = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => recalculateNavFit());
    };

    const observer = new ResizeObserver(scheduleRecalc);
    observer.observe(navEl);
    window.addEventListener('resize', scheduleRecalc);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleRecalc).catch(() => {});
    }

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', scheduleRecalc);
    };
  }, [recalculateNavFit]);

  // Close account dropdown on outside click
  useEffect(() => {
    if (!accountMenuOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [accountMenuOpen]);

  const visibleNavItems = configuredNavItems.slice(0, visibleCount);
  const overflowNavItems = configuredNavItems.slice(visibleCount);
  const hasDesktopOverflow = overflowNavItems.length > 0;

  return (
    <>
      {/* 24/7 Emergency Alert Strip (Independent layout above sticky nav) */}
      {isAnnouncementEnabled && (
        <div
          className="text-white px-3 sm:px-5 lg:px-6 xl:px-8 py-2 text-xs transition-colors w-full"
          style={{ backgroundColor: themeConfig?.secondaryColor || '#0f172a' }}
        >
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-2 sm:gap-4 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold text-slate-200 truncate">{announcementText}</span>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <button
                type="button"
                onClick={() => navigateTo(announcementLinkUrl)}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="sm:hidden">Emergency Dispatch →</span>
                <span className="hidden sm:inline">{announcementLinkText}</span>
              </button>
              <span className="text-slate-700 hidden md:inline" aria-hidden="true">
                |
              </span>
              <a
                href={`tel:${emergencyPhone.replace(/\D/g, '')}`}
                className="hidden md:flex items-center gap-1.5 font-bold text-white hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
              >
                <Phone className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="font-mono tabular-nums">{emergencyPhone}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Header */}
      <header
        className="sticky top-0 z-40 w-full backdrop-blur-md border-b border-slate-200 shadow-xs transition-colors"
        style={{ backgroundColor: themeConfig?.headerBg || 'rgba(255, 255, 255, 0.96)' }}
      >
        {/* Offscreen invisible nav measurer using identical typography */}
        <div
          aria-hidden="true"
          className="hidden lg:flex items-center gap-3 xl:gap-4 text-[13px] xl:text-sm font-semibold pointer-events-none invisible fixed -top-[9999px] left-0 whitespace-nowrap"
        >
          {configuredNavItems.map((item, idx) => (
            <span
              key={`measure-${item.id}`}
              ref={(el) => {
                measureItemsRef.current[idx] = el;
              }}
              className="inline-flex items-center gap-1 py-1 whitespace-nowrap shrink-0"
            >
              <span>{item.label}</span>
              {item.path === '/services' && <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          ))}
        </div>

        <div className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between gap-2 sm:gap-3 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-4 xl:gap-5 h-16 lg:h-[72px]">
            {/* Zone 1: Single-line Brand Wordmark & Configurable Logo */}
            <div className="flex items-center shrink-0 min-w-0">
              <button
                type="button"
                onClick={() => navigateTo('/')}
                className="text-left group flex items-center gap-2 sm:gap-2.5 focus:outline-hidden min-w-0 cursor-pointer"
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={businessName}
                    className="h-8 sm:h-9 w-auto object-contain rounded-md shadow-xs shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-sm transition-all shrink-0"
                    style={{
                      backgroundColor: themeConfig?.primaryColor || 'var(--color-primary)',
                      borderRadius: 'var(--radius-btn)',
                    }}
                  >
                    {brandInitial}
                  </div>
                )}
                <span className="block text-[15px] sm:text-base xl:text-lg font-extrabold tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors whitespace-nowrap truncate max-w-[138px] min-[375px]:max-w-[195px] sm:max-w-[240px] lg:max-w-none font-heading">
                  {businessName}
                </span>
              </button>
            </div>

            {/* Zone 2: Bounded Center Navigation Links (zero overlap with Zone 1 or Zone 3) */}
            <nav
              ref={navContainerRef}
              aria-label="Primary Navigation"
              className="hidden lg:flex items-center justify-center gap-3 xl:gap-4 text-[13px] xl:text-sm font-semibold text-slate-700 min-w-0 w-full"
            >
              {visibleNavItems.map((item) => {
                if (item.path === '/services') {
                  return (
                    <div
                      key={item.id}
                      className="relative shrink-0"
                      onMouseLeave={() => setServicesDropdownOpen(false)}
                    >
                      <button
                        type="button"
                        onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                        onMouseEnter={() => setServicesDropdownOpen(true)}
                        className={`flex items-center gap-1 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                          currentRoute.startsWith('/services')
                            ? 'text-blue-700 border-b-2 border-blue-700 font-bold'
                            : ''
                        }`}
                        style={{
                          borderColor: currentRoute.startsWith('/services')
                            ? themeConfig?.primaryColor || 'var(--color-primary)'
                            : undefined,
                          color: currentRoute.startsWith('/services')
                            ? themeConfig?.primaryColor || 'var(--color-primary)'
                            : undefined,
                        }}
                      >
                        <span>{item.label}</span>
                        <ChevronDown className="w-3.5 h-3.5 opacity-70 shrink-0" />
                      </button>

                      {servicesDropdownOpen && (
                        <div className="absolute top-full left-0 w-[min(22rem,calc(100vw-2rem))] bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                          <div className="px-5 py-2 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Services Directory
                            </span>
                            <button
                              type="button"
                              onClick={() => navigateTo('/services')}
                              className="text-xs text-blue-700 hover:underline font-bold cursor-pointer"
                            >
                              All Services ({services.length}) →
                            </button>
                          </div>
                          <div className="max-h-96 overflow-y-auto py-1">
                            {services.slice(0, 8).map((srv) => (
                              <button
                                type="button"
                                key={srv.id}
                                onClick={() => navigateTo(`/services/${srv.slug}`)}
                                className="w-full text-left px-5 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer"
                              >
                                <div className="min-w-0">
                                  <span className="font-semibold text-slate-800 group-hover:text-blue-700 text-xs block truncate">
                                    {srv.name}
                                  </span>
                                  <span className="text-[11px] text-slate-500 line-clamp-1">
                                    {srv.shortDescription}
                                  </span>
                                </div>
                                {srv.priceStartingAt && (
                                  <span className="text-[10px] font-mono tabular-nums text-slate-500 font-semibold shrink-0 ml-2">
                                    ${srv.priceStartingAt}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                          <div className="p-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl grid grid-cols-2 gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setServicesDropdownOpen(false);
                                openEstimateModal();
                              }}
                              className="p-2 rounded-lg bg-white border border-slate-200 text-left font-semibold text-slate-800 hover:border-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                            >
                              <span className="block font-bold">Free Estimate</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                HVAC Replacement
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setServicesDropdownOpen(false);
                                openMaintenanceModal();
                              }}
                              className="p-2 rounded-lg bg-white border border-slate-200 text-left font-semibold text-slate-800 hover:border-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                            >
                              <span className="block font-bold">Tune-Up ($89)</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                21-Point Precision
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setServicesDropdownOpen(false);
                                openCommercialModal();
                              }}
                              className="p-2 rounded-lg bg-white border border-slate-200 text-left font-semibold text-slate-800 hover:border-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                            >
                              <span className="block font-bold">Commercial RTU</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                Facilities & PMAs
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setServicesDropdownOpen(false);
                                openEmergencyModal();
                              }}
                              className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-left font-semibold text-rose-900 hover:bg-rose-100 transition-colors cursor-pointer"
                            >
                              <span className="block font-bold">24/7 Emergency</span>
                              <span className="text-[10px] text-rose-600 font-normal">
                                &lt; 90 Min Response
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                const isActive =
                  currentRoute === item.path || (item.path !== '/' && currentRoute.startsWith(item.path));
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => navigateTo(item.path)}
                    className={`hover:text-blue-700 transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                      isActive ? 'text-blue-700 border-b-2 border-blue-700 font-bold' : ''
                    }`}
                    style={{
                      borderColor: isActive ? themeConfig?.primaryColor || 'var(--color-primary)' : undefined,
                      color: isActive ? themeConfig?.primaryColor || 'var(--color-primary)' : undefined,
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Zone 3: Dispatch Contact & Conversion Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 xl:gap-3 shrink-0">
              {/* Mobile Quick Call Icon */}
              <a
                href={`tel:${headerCtaPhone.replace(/\D/g, '')}`}
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors shrink-0"
                title={`Call Dispatch: ${headerCtaPhone}`}
                aria-label={`Call Dispatch ${headerCtaPhone}`}
              >
                <Phone className="w-4 h-4" />
              </a>

              {/* Direct Phone CTA (Tablet & Desktop) */}
              <a
                href={`tel:${headerCtaPhone.replace(/\D/g, '')}`}
                className="hidden md:flex flex-col items-end text-right px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 focus:outline-hidden"
              >
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 leading-none mb-0.5">
                  Call Dispatch
                </span>
                <span className="text-[13px] xl:text-sm font-extrabold text-slate-900 hover:text-blue-700 transition-colors font-mono tabular-nums leading-tight whitespace-nowrap">
                  {headerCtaPhone}
                </span>
              </a>

              {/* Online Booking Button */}
              {featureFlags?.onlineBooking !== false && (
                <button
                  type="button"
                  onClick={() => openBookingModal()}
                  className="hidden sm:inline-flex items-center justify-center gap-1.5 px-3.5 xl:px-4 py-2 text-xs xl:text-sm font-bold text-white shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
                  style={{
                    backgroundColor: themeConfig?.primaryColor || 'var(--color-primary)',
                    borderRadius: 'var(--radius-btn)',
                  }}
                >
                  <Calendar className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
                  <span>{headerCtaLabel}</span>
                </button>
              )}

              {/* Account & Portal Access */}
              <div ref={accountRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(!accountMenuOpen);
                    setMobileMenuOpen(false);
                  }}
                  className="h-9 px-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 flex items-center gap-1.5 shrink-0 cursor-pointer"
                  title="Customer Portal & Staff Access"
                  aria-label="Account and portal menu"
                >
                  <User className="w-4 h-4 shrink-0" />
                  {adminUser && (
                    <span className="hidden 2xl:inline text-xs font-bold text-blue-700 whitespace-nowrap">
                      {staffRoleLabel}
                    </span>
                  )}
                </button>

                {accountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in duration-150">
                    <div className="px-4 py-1.5 border-b border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Account Access
                      </span>
                    </div>
                    {featureFlags?.customerPortal !== false && (
                      <button
                        type="button"
                        onClick={() => navigateTo('/portal')}
                        className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between cursor-pointer ${
                          currentRoute === '/portal'
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>Customer Service Portal</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      </button>
                    )}

                    <div className="border-t border-slate-100 my-1 pt-1">
                      {adminUser ? (
                        <>
                          <div className="px-4 py-1.5 text-[11px] text-slate-500">
                            <span className="font-bold text-slate-800 block truncate">{adminUser.name}</span>
                            <span className="font-mono text-[10px] text-slate-400">{staffRoleLabel}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigateTo(staffDashboardRoute)}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 flex items-center justify-between cursor-pointer"
                          >
                            <span>Open {staffRoleLabel} Dashboard</span>
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAccountMenuOpen(false);
                              logoutAdmin();
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5 shrink-0" />
                            <span>Sign Out</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigateTo('/admin')}
                          className="w-full text-left px-4 py-2.5 text-xs flex items-center justify-between text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                        >
                          <span>Staff Login</span>
                          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Assistant Quick Toggle */}
              {featureFlags?.aiAssistant !== false && (
                <button
                  type="button"
                  onClick={() => setIsAiChatOpen(true)}
                  className="hidden sm:inline-flex h-9 px-2.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200 items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  title="Ask AI Climate Assistant"
                  aria-label="Ask AI Climate Assistant"
                >
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="hidden 2xl:inline">Ask AI</span>
                </button>
              )}

              {/* Responsive Menu Toggle (Mobile/Tablet OR Desktop when secondary links overflow) */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(!mobileMenuOpen);
                  setAccountMenuOpen(false);
                }}
                className={`${
                  hasDesktopOverflow ? 'inline-flex' : 'lg:hidden inline-flex'
                } h-9 w-9 items-center justify-center text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 lg:border-transparent shrink-0 cursor-pointer`}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
                title={hasDesktopOverflow ? 'More pages and menu' : 'Toggle menu'}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Hamburger Navigation Drawer (Tablet/Mobile full nav, Desktop overflow links) */}
        {mobileMenuOpen && (
          <div className="bg-white border-t border-b border-slate-200 shadow-lg animate-in fade-in duration-150">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
              {/* Mobile/Tablet Quick Call & Emergency Bar */}
              <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100 lg:hidden">
                <a
                  href={`tel:${phone.replace(/\D/g, '')}`}
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-blue-50 text-blue-800 text-xs font-bold whitespace-nowrap"
                >
                  <Phone className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="truncate">Call {phone}</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openEmergencyModal();
                  }}
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold whitespace-nowrap cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>24/7 Emergency</span>
                </button>
              </div>

              {/* Desktop Overflow Secondary Links when screen is < ~1440px */}
              {hasDesktopOverflow && (
                <div className="hidden lg:block space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      More Navigation
                    </span>
                    <span className="text-[11px] text-slate-500">
                      All sections & customer tools
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {overflowNavItems.map((item) => {
                      const isActive =
                        currentRoute === item.path ||
                        (item.path !== '/' && currentRoute.startsWith(item.path));
                      return (
                        <button
                          type="button"
                          key={`overflow-${item.id}`}
                          onClick={() => navigateTo(item.path)}
                          className={`text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors border cursor-pointer ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                              : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-white hover:border-blue-300 hover:text-blue-700'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => navigateTo('/portal')}
                      className="text-left px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 text-slate-800 border border-slate-200 hover:bg-white hover:border-blue-300 hover:text-blue-700 transition-colors cursor-pointer"
                    >
                      Customer Portal
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo('/service-areas')}
                      className="text-left px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 text-slate-800 border border-slate-200 hover:bg-white hover:border-blue-300 hover:text-blue-700 transition-colors cursor-pointer"
                    >
                      Service Areas
                    </button>
                  </div>
                </div>
              )}

              {/* Full Mobile & Tablet Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm font-semibold text-slate-800 lg:hidden">
                {configuredNavItems.map((item) => {
                  const isActive =
                    currentRoute === item.path || (item.path !== '/' && currentRoute.startsWith(item.path));
                  return (
                    <button
                      type="button"
                      key={`mobile-${item.id}`}
                      onClick={() => navigateTo(item.path)}
                      className={`text-left px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                        isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 hover:text-blue-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => navigateTo('/service-areas')}
                  className="text-left px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-blue-700 cursor-pointer"
                >
                  Service Areas
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('/portal')}
                  className="text-left px-3 py-2 rounded-lg text-blue-700 font-bold hover:bg-blue-50 cursor-pointer"
                >
                  Customer Portal
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo(staffDashboardRoute)}
                  className="text-left px-3 py-2 rounded-lg text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  {adminUser ? `${staffRoleLabel} Dashboard` : 'Staff Login'}
                </button>
              </div>

              {/* Mobile & Tablet Action Buttons */}
              <div className="pt-3 border-t border-slate-100 space-y-2 lg:hidden">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openBookingModal();
                  }}
                  className="w-full py-3 bg-blue-700 text-white font-bold rounded-xl text-xs text-center shadow-xs cursor-pointer"
                >
                  Schedule Routine Service Online
                </button>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openEstimateModal();
                    }}
                    className="py-2.5 px-2 bg-slate-100 text-slate-800 text-[11px] font-bold rounded-xl text-center cursor-pointer"
                  >
                    Free Estimate
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openMaintenanceModal();
                    }}
                    className="py-2.5 px-2 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-xl text-center cursor-pointer"
                  >
                    Tune-Up ($89)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openCommercialModal();
                    }}
                    className="py-2.5 px-2 bg-blue-50 text-blue-800 text-[11px] font-bold rounded-xl text-center cursor-pointer"
                  >
                    Commercial
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Sticky Mobile Conversion Bar (Bottom < 15% Viewport Cap, Overflow-safe at 320px) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 shadow-lg flex items-center justify-between gap-2">
        <a
          href={`tel:${phone.replace(/\D/g, '')}`}
          className="flex-1 min-w-0 py-2.5 px-2.5 rounded-xl bg-slate-900 text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-transform whitespace-nowrap"
        >
          <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="truncate">Call {phone}</span>
        </a>
        <button
          type="button"
          onClick={() => openBookingModal()}
          className="flex-1 min-w-0 py-2.5 px-2.5 rounded-xl bg-blue-700 text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-transform shadow-xs whitespace-nowrap cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{headerCtaLabel}</span>
        </button>
      </div>
    </>
  );
};
