import React from 'react';
import { useApp } from '../context/AppContext';
import { ServiceRecord } from '../types';
import { CheckCircle2, ArrowRight, Calendar, AlertTriangle } from 'lucide-react';

interface ServiceCardProps {
  service: ServiceRecord;
  featured?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, featured = false }) => {
  const { setCurrentRoute, openBookingModal } = useApp();

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between group ${
        featured
          ? 'border-blue-200 shadow-md ring-1 ring-blue-500/20 p-6 sm:p-8'
          : 'border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 p-6'
      }`}
    >
      <div className="space-y-4">
        {/* Top Metadata Strip */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-bold uppercase tracking-wider text-blue-700 text-[10px]">
            {service.category}
          </span>
          {service.priceStartingAt ? (
            <span className="font-mono font-bold text-slate-900 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200/60 text-[11px]">
              From ${service.priceStartingAt}
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-slate-500">
              Custom Engineering Quote
            </span>
          )}
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors font-heading leading-snug">
            {service.name}
          </h3>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">
            {service.shortDescription}
          </p>
        </div>

        {/* Symptoms / Key Features */}
        <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
          {(service.benefits || []).slice(0, 3).map((benefit, i) => (
            <div key={i} className="flex items-start gap-2 text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-snug">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Controls */}
      <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setCurrentRoute(`/services/${service.slug}`)}
          className="text-xs font-bold text-slate-700 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          <span>View Specs</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => openBookingModal(service.id)}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Book Now</span>
        </button>
      </div>
    </div>
  );
};
