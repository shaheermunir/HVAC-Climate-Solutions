import React from 'react';
import { useApp } from '../context/AppContext';
import {
  MapPin,
  Phone,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';

interface ServiceAreaDetailPageProps {
  slug: string;
}

export const ServiceAreaDetailPage: React.FC<ServiceAreaDetailPageProps> = ({ slug }) => {
  const { serviceAreas, services, settings, openBookingModal, openEmergencyModal, setCurrentRoute } = useApp();

  const area = serviceAreas.find((a) => a.slug === slug) || serviceAreas[0];
  const phone = area?.phone || settings?.primaryPhone || '(800) 555-0199';

  if (!area) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Service Area Not Found</h2>
        <button
          onClick={() => setCurrentRoute('/service-areas')}
          className="text-blue-700 hover:underline text-sm font-semibold"
        >
          Return to All Service Areas
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Hero */}
      <section className="bg-slate-900 text-white py-12 lg:py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <button
              onClick={() => setCurrentRoute('/service-areas')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Service Areas Directory</span>
            </button>

            <div className="flex items-center gap-2 text-xs text-blue-400 font-bold uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              <span>Dedicated Local Dispatch Hub</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-heading">
              HVAC Services in {area.name}
            </h1>

            <p className="text-base text-slate-300 leading-relaxed">{area.description}</p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => openBookingModal()}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Service in {area.name}</span>
              </button>

              <a
                href={`tel:${phone.replace(/\D/g, '')}`}
                className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl border border-slate-700 transition-colors flex items-center gap-2"
              >
                <Phone className="w-4 h-4 text-blue-400" />
                <span>Call {phone}</span>
              </a>

              {area.emergencyAvailable && (
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

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              HVAC Engineering Engineered for {area.name} Homes
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Every neighborhood experiences specific micro-climates, from older historic homes requiring custom duct balancing, to expansive multi-story residences requiring multi-zone inverter zoning.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-heading">
              Popular Services Requested in {area.name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.slice(0, 4).map((srv) => (
                <div key={srv.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm font-heading">{srv.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{srv.shortDescription}</p>
                  <button
                    onClick={() => setCurrentRoute(`/services/${srv.slug}`)}
                    className="text-xs font-bold text-blue-700 hover:underline pt-1 flex items-center gap-1"
                  >
                    <span>View Service Specifications</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              ZIP Codes Serviced Directly in {area.name}
            </h3>
            <div className="flex flex-wrap gap-2">
              {(area.zipCodes || []).map((z) => (
                <span
                  key={z}
                  className="px-3 py-1 bg-white rounded-lg border border-slate-200 text-xs font-mono font-semibold text-slate-700"
                >
                  {z}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm font-heading">Fast Local Dispatch</h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Rolling warehouse trucks stocked with OEM parts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>NATE-Certified master technicians</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{settings?.workmanshipWarranty?.split('+')[0]?.trim() || 'Written Craftsmanship Warranty'}</span>
              </div>
            </div>

            <button
              onClick={() => openBookingModal()}
              className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Schedule Service Visit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
