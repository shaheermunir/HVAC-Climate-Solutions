import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Phone,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  DollarSign,
  Award,
  ChevronLeft,
} from 'lucide-react';

interface ServiceDetailPageProps {
  slug: string;
}

export const ServiceDetailPage: React.FC<ServiceDetailPageProps> = ({ slug }) => {
  const {
    services,
    settings,
    openBookingModal,
    openEmergencyModal,
    setCurrentRoute,
    serviceAreas,
  } = useApp();

  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const service = services.find((s) => s.slug === slug) || services[0];
  const phone = settings?.primaryPhone || '(800) 555-0199';

  if (!service) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Service Not Found</h2>
        <button
          onClick={() => setCurrentRoute('/services')}
          className="text-blue-700 hover:underline text-sm font-semibold"
        >
          Return to All Services
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* 1. Service Hero */}
      <section className="bg-slate-900 text-white py-12 lg:py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <button
              onClick={() => setCurrentRoute('/services')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to All Services</span>
            </button>

            <div className="flex items-center gap-2 text-xs text-blue-400 font-bold uppercase tracking-wider">
              <span>{service.category}</span>
              <span aria-hidden="true">·</span>
              <span>Professional HVAC Solutions</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-heading text-balance">
              {service.name}
            </h1>

            <p className="text-base text-slate-300 leading-relaxed">{service.shortDescription}</p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => openBookingModal(service.id)}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Book This Service</span>
              </button>

              <a
                href={`tel:${phone.replace(/\D/g, '')}`}
                className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl border border-slate-700 transition-colors flex items-center gap-2"
              >
                <Phone className="w-4 h-4 text-blue-400" />
                <span>Call {phone}</span>
              </a>

              {service.isEmergencyEligible && (
                <button
                  onClick={openEmergencyModal}
                  className="px-4 py-3 bg-rose-950 text-rose-300 hover:text-white border border-rose-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>24/7 Emergency Dispatch</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Content Split */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Body (8 Cols) */}
        <div className="lg:col-span-8 space-y-10">
          {/* Detailed Overview */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 font-heading">Overview & Technical Approach</h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {service.fullDescription}
            </p>
          </div>

          {/* Common Symptoms / Reasons to Request */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Common Symptoms Indicating This Service Is Needed</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
              {(service.symptoms || []).map((s, i) => (
                <div key={i} className="flex items-start gap-2 bg-white p-3 rounded-xl border border-slate-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step-by-Step Diagnostic & Service Process */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-heading">What the Service Visit Involves</h3>
            <div className="space-y-3">
              {(service.process || []).map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-xs sm:text-sm">Phase {idx + 1}</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supported Equipment & Brands */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Supported Equipment Types
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {(service.supportedEquipment || []).map((eq, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{eq}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Factory OEM Brands Handled
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {(service.supportedBrands || []).map((b, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Factors & Warranty */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Pricing & Warranty Information</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">{service.pricingApproach}</p>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 text-xs space-y-1">
              <span className="font-bold block">Warranty Coverage:</span>
              <span>{service.warrantyInfo}</span>
            </div>
          </div>

          {/* Service-Specific FAQs */}
          {(service.faqs || []).length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 font-heading">Frequently Asked Questions</h3>
              <div className="space-y-2">
                {(service.faqs || []).map((faq, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                      className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-900 hover:text-blue-700"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          activeFaq === i ? 'rotate-180 text-blue-600' : ''
                        }`}
                      />
                    </button>
                    {activeFaq === i && (
                      <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Conversion Card (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-24 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Upfront Pricing Standard
              </span>
              {service.priceStartingAt ? (
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xs text-slate-500">Starting at</span>
                  <span className="text-2xl font-black text-slate-900 font-mono">${service.priceStartingAt}</span>
                </div>
              ) : (
                <div className="text-base font-bold text-slate-900 mt-1">Free In-Home Estimate</div>
              )}
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>NATE-Certified Diagnostic Techs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{settings?.workmanshipWarranty?.split('+')[0]?.trim() || 'Written Craftsmanship Warranty'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Diagnostic fee credited to repair</span>
              </div>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                onClick={() => openBookingModal(service.id)}
                className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule This Service</span>
              </button>

              <a
                href={`tel:${phone.replace(/\D/g, '')}`}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>Direct Dispatch: {phone}</span>
              </a>
            </div>

            {/* Service Area Availability */}
            <div className="pt-4 border-t border-slate-100 text-xs">
              <span className="font-bold text-slate-800 block mb-1">Local Service Areas:</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Available throughout our primary metro service territory and surrounding communities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
