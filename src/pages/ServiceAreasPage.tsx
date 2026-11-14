import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Phone, CheckCircle2, ArrowRight, Search, AlertTriangle } from 'lucide-react';

export const ServiceAreasPage: React.FC = () => {
  const { serviceAreas, setCurrentRoute, settings, getPage, getPageSection } = useApp();
  const [zipSearch, setZipSearch] = useState('');
  const [searchResult, setSearchResult] = useState<{ checked: boolean; foundArea?: any } | null>(null);

  const areasPage = getPage('service-areas') || getPage('/service-areas');
  const heroSec = getPageSection('/service-areas', 'hero') || areasPage?.sections[0];

  const phone = settings?.primaryPhone || '(800) 555-0199';

  const handleZipSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanZip = zipSearch.trim();
    if (!cleanZip) return;

    const match = serviceAreas.find((a) => a.zipCodes.includes(cleanZip));
    setSearchResult({ checked: true, foundArea: match });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">
          {heroSec?.kicker || 'Regional Territory Directory'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-heading">
          {heroSec?.heading || 'Service Areas & Local ZIP Code Coverage'}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          {heroSec?.subheading || 'We maintain rolling warehouse dispatch hubs across our regional service territory. Find your district below or enter your 5-digit ZIP code for instant service confirmation.'}
        </p>
      </div>

      {/* ZIP Code Lookup Tool */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
          Verify Local Territory Availability
        </h3>
        <form onSubmit={handleZipSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              maxLength={5}
              placeholder="Enter 5-Digit ZIP Code (e.g. 10001)"
              value={zipSearch}
              onChange={(e) => setZipSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
          >
            Check ZIP
          </button>
        </form>

        {searchResult && (
          <div className="pt-3">
            {searchResult.foundArea ? (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Covered!</strong> {zipSearch} is serviced under our{' '}
                    <strong>{searchResult.foundArea.name}</strong> territory.
                  </span>
                </div>
                <button
                  onClick={() => setCurrentRoute(`/service-areas/${searchResult.foundArea.slug}`)}
                  className="font-bold underline text-emerald-900 shrink-0 ml-2"
                >
                  View Area Page →
                </button>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  ZIP {zipSearch} is outside our automated web scheduling area. Please call our main office at {phone} for custom service dispatch.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {serviceAreas.map((area) => (
          <div
            key={area.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-slate-900 font-heading">{area.name}</h3>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                  Active Hub
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{area.description}</p>

              <div>
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  ZIP Codes Covered:
                </span>
                <div className="flex flex-wrap gap-1">
                  {(area.zipCodes || []).map((z) => (
                    <span
                      key={z}
                      className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono text-slate-600"
                    >
                      {z}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">24/7 Dispatch Eligible</span>
              <button
                onClick={() => setCurrentRoute(`/service-areas/${area.slug}`)}
                className="font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
              >
                <span>Area Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
