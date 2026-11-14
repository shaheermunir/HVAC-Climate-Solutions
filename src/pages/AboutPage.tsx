import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Award,
  Users,
  CheckCircle2,
  Calendar,
  Phone,
  Wrench,
  HelpCircle,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { technicians, settings, openBookingModal, formatCurrency, getPage } = useApp();

  const phone = settings?.primaryPhone || '(800) 555-0199';
  const aboutPageData = getPage('about') || getPage('/about');

  // Dynamic sections with fallback to initial standards
  const heroSec = aboutPageData?.sections?.find((s) => s.type === 'hero' || s.id === 'sec-about-hero');
  const pillarsSec = aboutPageData?.sections?.find((s) => s.type === 'cards' || s.id === 'sec-about-pillars');
  const teamSec = aboutPageData?.sections?.find((s) => s.type === 'team_roster' || s.id === 'sec-about-team');
  const ctaSec = aboutPageData?.sections?.find((s) => s.type === 'callout' || s.id === 'sec-about-cta');

  const defaultPillars = [
    {
      id: 'pillar-1',
      title: 'Technical Rigor, Not Sales Pitches',
      description: `Our technicians are paid for diagnostic precision and craftsmanship—never on commission or sales quotas. If an affordable capacitor or quick coil clean restores your system, that is what we recommend.`,
      icon: 'Award',
    },
    {
      id: 'pillar-2',
      title: 'State Licensing & Universal EPA 608',
      description: 'Fully licensed and insured contractor. Every lead technician holds Universal EPA Section 608 certification and undergoes continuous factory technical training.',
      icon: 'ShieldCheck',
    },
    {
      id: 'pillar-3',
      title: 'Rolling Warehouses on Wheels',
      description: 'Every service truck carries universal dual-run capacitors, ECM blower modules, contactors, reversing valve solenoids, and recovery machinery to achieve 94% same-visit completion.',
      icon: 'Wrench',
    },
  ];

  const pillarsToRender = pillarsSec?.items && pillarsSec.items.length > 0 ? pillarsSec.items : defaultPillars;

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case 'Wrench':
        return <Wrench className="w-5 h-5 text-blue-600" />;
      case 'Users':
        return <Users className="w-5 h-5 text-amber-600" />;
      case 'Award':
      default:
        return <Award className="w-5 h-5 text-blue-700" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* 1. Header / Hero Section */}
      {heroSec?.enabled !== false && (
        <div className="max-w-3xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">
            {heroSec?.kicker || 'Our Company & Values'}
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-heading">
            {heroSec?.heading || 'Engineering Comfort, Built on Uncompromising Integrity'}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {heroSec?.subheading ||
              'Airflow Climate Solutions was founded on a simple premise: homeowners deserve transparent pricing, master-level diagnostic competence, and service guarantees with real teeth.'}
          </p>
        </div>
      )}

      {/* 2. Core Pillars */}
      {pillarsSec?.enabled !== false && (
        <div className="space-y-6">
          {pillarsSec?.heading && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 font-heading">{pillarsSec.heading}</h2>
              {pillarsSec.subheading && <p className="text-xs text-slate-500 mt-1">{pillarsSec.subheading}</p>}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillarsToRender.map((pillar) => (
              <div key={pillar.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  {renderIcon(pillar.icon)}
                </div>
                <h3 className="font-bold text-slate-900 text-base font-heading">{pillar.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Master Technicians Team */}
      {teamSec?.enabled !== false && (
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-1">
              {teamSec?.kicker || 'Certified Team Roster'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-heading">
              {teamSec?.heading || 'Meet Our Master Technicians'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {teamSec?.subheading ||
                'Experienced field engineers dedicated to safe, code-compliant, and durable climate solutions.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {technicians.map((t) => (
              <div key={t.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-700 text-white font-extrabold flex items-center justify-center text-lg font-heading shadow-xs">
                  {t.name.split(' ').map((n) => n[0]).join('')}
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-heading">{t.name}</h3>
                  <span className="text-xs text-blue-700 font-semibold block">{t.role}</span>
                  <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">{t.completedJobsCount}+ Jobs Completed</span>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px]">
                  <span className="font-bold text-slate-700 block">Core Certifications:</span>
                  <ul className="space-y-0.5 text-slate-600">
                    {(t.skills || []).map((s, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CTA Strip */}
      {ctaSec?.enabled !== false && (
        <div className="bg-slate-900 text-white p-8 sm:p-12 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold font-heading">
              {ctaSec?.heading || 'Experience the Climate Care Standard'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {ctaSec?.subheading || 'Schedule service online in seconds or call our friendly local dispatch center.'}
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => openBookingModal()}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              {ctaSec?.buttonText || 'Book Appointment'}
            </button>
            <a
              href={`tel:${phone.replace(/\D/g, '')}`}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700"
            >
              Call {phone}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
