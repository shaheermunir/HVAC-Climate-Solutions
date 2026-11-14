import React from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';

export const PortfolioPage: React.FC = () => {
  const { projects, openBookingModal, getPage, getPageSection } = useApp();

  const portfolioPage = getPage('portfolio') || getPage('/portfolio');
  const heroSec = getPageSection('/portfolio', 'hero') || portfolioPage?.sections[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">
          {heroSec?.kicker || 'Documented Workmanship'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-heading">
          {heroSec?.heading || 'Project Portfolio & Case Studies'}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          {heroSec?.subheading || 'Explore real residential and commercial heating, cooling, and air quality projects completed across our service territory. Every case study highlights the initial homeowner challenge, our engineering approach, and verified energy outcomes.'}
        </p>
      </div>

      {/* Projects Grid */}
      <div className="space-y-12">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12"
          >
            {/* Image Side (5 cols) */}
            <div className="lg:col-span-5 relative bg-slate-900 min-h-[300px]">
              <img
                src={proj.afterImage || '/images/hvac_installation_ac_1794171517489.jpg'}
                alt={proj.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4 px-3 py-1 bg-slate-900/90 text-white rounded-lg text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>{proj.city}</span>
              </div>
            </div>

            {/* Content Side (7 cols) */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                    {proj.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{proj.date}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                  {proj.title}
                </h3>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
                  <span className="font-bold text-slate-900 block font-sans">Installed Specification:</span>
                  {proj.equipmentInstalled}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800">Initial Problem:</span>
                    <p className="text-slate-600 leading-relaxed">{proj.problem}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800">Engineered Solution:</span>
                    <p className="text-slate-600 leading-relaxed">{proj.solution}</p>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 text-xs leading-relaxed">
                  <strong className="text-emerald-900">Measured Outcome: </strong>
                  {proj.outcome}
                </div>
              </div>

              {proj.customerQuote && (
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs italic text-slate-600">
                  <span>"{proj.customerQuote}"</span>
                  <span className="font-semibold text-slate-800 not-italic shrink-0 ml-2">
                    — {proj.customerName}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Callout */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center max-w-4xl mx-auto space-y-4">
        <h2 className="text-2xl font-bold font-heading">Plan Your Custom System Upgrade</h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Every home is unique. Schedule an on-site ACCA Manual J load calculation to discover the right equipment and efficiency rating for your family.
        </p>
        <button
          onClick={() => openBookingModal('ac-installation')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
        >
          Request In-Home Consultation
        </button>
      </div>
    </div>
  );
};
