import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calculator,
  Zap,
  DollarSign,
  Award,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

export const HvacSizingCalculator: React.FC = () => {
  const { openBookingModal, submitLead } = useApp();

  const [squareFeet, setSquareFeet] = useState<number>(2200);
  const [ceilingHeight, setCeilingHeight] = useState<number>(9);
  const [insulation, setInsulation] = useState<'poor' | 'average' | 'superior'>('average');
  const [sunExposure, setSunExposure] = useState<'low' | 'moderate' | 'high'>('high');
  const [leadSent, setLeadSent] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sizing Calculation Formula (ACCA Manual J approximation)
  const calculateEstimate = () => {
    let baseTons = squareFeet / 550;
    if (ceilingHeight > 10) baseTons *= 1.15;
    else if (ceilingHeight > 8) baseTons *= 1.05;

    if (insulation === 'poor') baseTons *= 1.2;
    else if (insulation === 'superior') baseTons *= 0.88;

    if (sunExposure === 'high') baseTons *= 1.1;
    else if (sunExposure === 'low') baseTons *= 0.95;

    const roundedTons = Math.min(5.0, Math.max(1.5, Math.round(baseTons * 2) / 2));
    const coolingBTUs = Math.round(roundedTons * 12000);
    const estimatedHeatingBTUs = Math.round(coolingBTUs * 1.25);
    const annualSavings = Math.round(squareFeet * 0.18 + 120);

    return {
      tonnage: roundedTons,
      coolingBTUs,
      heatingBTUs: estimatedHeatingBTUs,
      annualSavings,
    };
  };

  const results = calculateEstimate();

  const handleRequestFormalQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactPhone) return;

    setIsSubmitting(true);
    const res = await submitLead({
      customerName: contactName,
      phone: contactPhone,
      homeSquareFootage: squareFeet,
      serviceRequested: `In-Home Manual J Sizing Consultation (${results.tonnage} Tons)`,
      source: 'estimate_tool',
      urgency: 'normal',
      propertyType: 'residential',
      notes: `Online Sizing Calculation: ${squareFeet} sq ft, ${ceilingHeight}ft ceilings, ${insulation} insulation, ${sunExposure} sun exposure. Estimated: ${results.tonnage} Tons / ${results.coolingBTUs} BTUs.`,
    });
    setIsSubmitting(false);
    if (res?.success) {
      setLeadSent(true);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 md:p-8 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Calculator className="w-4 h-4" />
            <span>Interactive Home Climate Planner</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold font-heading">
            HVAC System Sizing & Energy Savings Calculator
          </h3>
          <p className="text-slate-400 text-xs mt-1 max-w-xl">
            Estimate cooling capacity (tonnage), heating BTUs, and annual electric savings based on regional climate heat loads.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="text-[11px] text-slate-400 hidden lg:inline">ACCA Manual J Compliant Standards</span>
        </div>
      </div>

      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Square Footage Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Home Conditioned Living Space
              </label>
              <span className="text-base font-extrabold text-blue-700 font-mono">
                {squareFeet.toLocaleString()} sq ft
              </span>
            </div>
            <input
              type="range"
              min={600}
              max={5000}
              step={50}
              value={squareFeet}
              onChange={(e) => setSquareFeet(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>600 sq ft (Condo)</span>
              <span>2,500 sq ft</span>
              <span>5,000+ sq ft (Estate)</span>
            </div>
          </div>

          {/* Grid of Other Characteristics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Ceiling Height
              </label>
              <select
                value={ceilingHeight}
                onChange={(e) => setCeilingHeight(parseInt(e.target.value, 10))}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden bg-white"
              >
                <option value={8}>Standard 8 ft</option>
                <option value={9}>9 ft Ceilings</option>
                <option value={10}>10 ft High Ceilings</option>
                <option value={12}>12+ ft Vaulted</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Attic Insulation
              </label>
              <select
                value={insulation}
                onChange={(e) => setInsulation(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden bg-white"
              >
                <option value="poor">Poor (Older &lt; R-19)</option>
                <option value="average">Average (R-30 Standard)</option>
                <option value="superior">Superior (Spray Foam / R-49)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Sun & Window Exposure
              </label>
              <select
                value={sunExposure}
                onChange={(e) => setSunExposure(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden bg-white"
              >
                <option value="low">Heavy Shade / Low Sun</option>
                <option value="moderate">Moderate Sun</option>
                <option value="high">Direct Afternoon West Sun</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
            <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span className="text-[11px] leading-relaxed">
              <strong>Engineering Note:</strong> Oversized systems short-cycle and leave air clammy and humid.
              Undersized systems run 24/7 without cooling. We always perform an in-person room-by-room ACCA Manual J
              calculation before installation.
            </span>
          </div>
        </div>

        {/* Results Column (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Estimated Sizing Profile</span>
            <div className="mt-3 grid grid-cols-2 gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="text-[11px] text-slate-500 block">Recommended Capacity</span>
                <span className="text-3xl font-black text-slate-900 font-mono">{results.tonnage} Tons</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">({results.coolingBTUs.toLocaleString()} BTUs Cooling)</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Heating Output</span>
                <span className="text-2xl font-bold text-slate-800 font-mono mt-1">
                  ~{results.heatingBTUs.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">BTUs / Hr</span>
              </div>
            </div>

            <div className="space-y-2.5 py-4 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong>Est. Annual Energy Savings:</strong> ~${results.annualSavings}/year
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Award className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Federal IRA 25C Tax Credit:</strong> Up to $2,000
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>0% Financing Available:</strong> Starting at $89/month
                </span>
              </div>
            </div>
          </div>

          {/* Lead Capture Form or Success */}
          <div className="pt-2">
            {!leadSent ? (
              <form onSubmit={handleRequestFormalQuote} className="space-y-2">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Lock in Free In-Home Load Calculation:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:border-blue-600 outline-hidden bg-white"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="(800) 555-0199"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:border-blue-600 outline-hidden bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Submitting...' : 'Request Precision In-Home Quote'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Thank you, {contactName}! An HVAC sizing specialist will reach out to schedule your free in-home load verification.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
