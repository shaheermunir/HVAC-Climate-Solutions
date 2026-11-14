import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  DollarSign,
  Calendar,
} from 'lucide-react';

export const InstallationEstimateModal: React.FC = () => {
  const {
    isEstimateModalOpen,
    closeEstimateModal,
    submitLead,
    checkZipCoverage,
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<any>(null);

  // System selection
  const [systemType, setSystemType] = useState('heat_pump');
  const [seerTarget, setSeerTarget] = useState('18');

  // Home specifics
  const [squareFootage, setSquareFootage] = useState(2200);
  const [stories, setStories] = useState('2');
  const [ductCondition, setDuctCondition] = useState('good');
  const [currentSystemAge, setCurrentSystemAge] = useState('12-15 years');
  const [needsFinancing, setNeedsFinancing] = useState(false);

  // Contact details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Metro Area');
  const [zipCode, setZipCode] = useState('10001');
  const [zipCoverageStatus, setZipCoverageStatus] = useState<any>(null);
  const [preferredDay, setPreferredDay] = useState('Weekday Morning');

  if (!isEstimateModalOpen) return null;

  // ACCA Manual J approximation based on regional cooling and heating design standards
  const calculateTonnage = (sqFt: number): number => {
    const rawTons = sqFt / 550; // Standard design rule: ~500-600 sq ft / ton
    return Math.round(rawTons * 2) / 2; // round to nearest 0.5 ton
  };

  const tons = calculateTonnage(squareFootage);

  // Price estimate range
  const baseCostPerTon = systemType === 'heat_pump' ? 2400 : systemType === 'mini_split' ? 2800 : 2100;
  const estimatedMin = Math.round(tons * baseCostPerTon + (ductCondition === 'replace' ? 2500 : 800));
  const estimatedMax = Math.round(estimatedMin * 1.25);
  const federalTaxCredit = systemType === 'heat_pump' || parseInt(seerTarget, 10) >= 16 ? 2000 : 600;
  const utilityRebate = parseInt(seerTarget, 10) >= 18 ? 1050 : 650;
  const netEstimatedMin = Math.max(2500, estimatedMin - federalTaxCredit - utilityRebate);
  const netEstimatedMax = Math.max(3000, estimatedMax - federalTaxCredit - utilityRebate);

  const handleZipBlur = async () => {
    if (zipCode.length === 5) {
      const res = await checkZipCoverage(zipCode);
      setZipCoverageStatus(res);
      if (res.cityName && res.cityName !== 'Greater Metro Area') {
        setCity(res.cityName);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !address || !zipCode) return;

    setIsSubmitting(true);
    const systemLabels: Record<string, string> = {
      heat_pump: 'Inverter Cold-Climate Heat Pump (Ultra High Efficiency)',
      central_ac: 'High-Efficiency Central AC & 80%+ Gas Furnace',
      mini_split: 'Multi-Zone Ductless Inverter System',
      commercial_rtu: 'Commercial Packaged Rooftop Unit (RTU)',
    };

    const notesSummary = `INSTALLATION & SYSTEM REPLACEMENT CONSULTATION:
System Type: ${systemLabels[systemType] || systemType}
Target Efficiency: ${seerTarget} SEER2
Home Area: ${squareFootage} sq ft (${stories} stories)
Duct Condition: ${ductCondition}
Current System Age: ${currentSystemAge}
Calculated Sizing: ${tons} Tons
Gross Estimate Range: $${estimatedMin.toLocaleString()} - $${estimatedMax.toLocaleString()}
Net After Rebates: $${netEstimatedMin.toLocaleString()} - $${netEstimatedMax.toLocaleString()}
Financing Interest: ${needsFinancing ? 'Yes (0% APR options requested)' : 'No'}
Preferred Inspection Time: ${preferredDay}`;

    const res = await submitLead({
      customerName,
      phone: customerPhone,
      email: customerEmail,
      address,
      city,
      zipCode,
      urgency: 'normal',
      serviceRequested: `Installation Estimate: ${tons}-Ton ${systemLabels[systemType] || 'HVAC System'}`,
      source: 'installation_estimate',
      journey: 'estimate',
      homeSquareFootage: squareFootage,
      estimatedSystemAge: currentSystemAge,
      propertyType: systemType === 'commercial_rtu' ? 'commercial' : 'residential',
      notes: notesSummary,
    });

    setIsSubmitting(false);
    if (res.success && res.lead) {
      setSubmittedLead(res.lead);
      setStep(4);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Engineering Consultation Journey</span>
              <h3 className="text-lg font-bold font-heading">HVAC Replacement & Installation Estimate</h3>
            </div>
          </div>
          <button
            onClick={closeEstimateModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Breadcrumbs */}
        {step < 4 && (
          <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span className={step >= 1 ? 'text-blue-700 font-bold' : ''}>1. System Choice</span>
            <span>→</span>
            <span className={step >= 2 ? 'text-blue-700 font-bold' : ''}>2. Home Specs</span>
            <span>→</span>
            <span className={step >= 3 ? 'text-blue-700 font-bold' : ''}>3. Review & Schedule</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  What HVAC configuration are you replacing or designing?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'heat_pump',
                      title: 'All-Electric Inverter Heat Pump',
                      desc: 'Quiet, 300% efficient cooling & heating. Qualifies for up to $2,000 IRA tax credits.',
                      seer: 'Up to 20.5 SEER2',
                    },
                    {
                      id: 'central_ac',
                      title: 'Central AC & Gas Furnace',
                      desc: 'High-output dual-fuel system. Dependable gas heating with ultra-high SEER2 cooling.',
                      seer: '16 to 19 SEER2',
                    },
                    {
                      id: 'mini_split',
                      title: 'Ductless Multi-Zone Inverter',
                      desc: 'Individual temperature control per room without ductwork losses. Ideal for additions & retrofits.',
                      seer: 'Up to 25 SEER2',
                    },
                    {
                      id: 'commercial_rtu',
                      title: 'Commercial Packaged Rooftop Unit',
                      desc: 'Turnkey replacement for retail spaces, offices, and restaurants (3 to 25 tons).',
                      seer: 'ASHRAE 90.1 Compliant',
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSystemType(item.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        systemType === item.id
                          ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900">{item.title}</div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                      <span className="inline-block mt-2 text-[10px] font-bold text-blue-700 font-mono">
                        {item.seer}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Target Energy Efficiency Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: '15', label: '15.2 SEER2 Standard', desc: 'Meets 2026 Energy Codes' },
                    { val: '18', label: '18.0 SEER2 High-Eff', desc: 'Best value + rebates' },
                    { val: '20', label: '20.5+ Variable Speed', desc: 'Maximum energy savings' },
                  ].map((t) => (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => setSeerTarget(t.val)}
                      className={`p-2.5 rounded-xl border text-center text-xs transition-colors ${
                        seerTarget === t.val
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-bold">{t.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <span>Next: Home Specifications</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Conditioned Space Size: <span className="text-blue-700 font-mono text-sm">{squareFootage.toLocaleString()} sq ft</span>
                  </label>
                  <span className="text-xs font-bold text-slate-500 font-mono">
                    Estimated Load: {tons} Tons ({Math.round(tons * 12000).toLocaleString()} BTU)
                  </span>
                </div>
                <input
                  type="range"
                  min={800}
                  max={5000}
                  step={100}
                  value={squareFootage}
                  onChange={(e) => setSquareFootage(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>800 sq ft</span>
                  <span>2,000 sq ft</span>
                  <span>3,500 sq ft</span>
                  <span>5,000+ sq ft</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Number of Stories
                  </label>
                  <select
                    value={stories}
                    onChange={(e) => setStories(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden bg-white"
                  >
                    <option value="1">1 Story (Single Level)</option>
                    <option value="2">2 Stories (Zoning Recommended)</option>
                    <option value="3">3 Stories / Townhome</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Existing System Age
                  </label>
                  <select
                    value={currentSystemAge}
                    onChange={(e) => setCurrentSystemAge(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden bg-white"
                  >
                    <option value="under 8 years">Under 8 years</option>
                    <option value="8-12 years">8 to 12 years</option>
                    <option value="12-15 years">12 to 15 years (End of Life)</option>
                    <option value="15+ years">15+ years (High Urgency)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Existing Air Duct Condition
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'good', label: 'Good / Reusable', desc: 'Static pressure check' },
                    { val: 'sealing', label: 'Needs Aeroseal / Tuning', desc: 'Seal leaky attic joints' },
                    { val: 'replace', label: 'Full Duct Replacement', desc: 'R-8 flex duct design' },
                  ].map((d) => (
                    <button
                      key={d.val}
                      type="button"
                      onClick={() => setDuctCondition(d.val)}
                      className={`p-2 rounded-xl border text-center text-xs transition-colors ${
                        ductCondition === d.val
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-[11px]">{d.label}</div>
                      <div className="text-[9px] text-slate-500">{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Instant Calculation Preview Card */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Preliminary Equipment Tonnage:</span>
                  <span className="font-mono font-bold text-white">{tons} Ton Inverter</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Estimated Gross Project Range:</span>
                  <span className="font-mono font-bold text-white">${estimatedMin.toLocaleString()} – ${estimatedMax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-400 font-semibold border-t border-slate-800 pt-2">
                  <span>Estimated Tax Credits & Local Utility Rebates:</span>
                  <span className="font-mono font-bold">-${(federalTaxCredit + utilityRebate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-blue-400 font-bold text-sm border-t border-slate-800 pt-2">
                  <span>Net Estimated Turnkey Out-of-Pocket:</span>
                  <span className="font-mono text-white">${netEstimatedMin.toLocaleString()} – ${netEstimatedMax.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <span>Next: Lock in On-Site Consultation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(800) 555-0199"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address (for detailed engineering proposal)
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Preferred Consultation Window
                  </label>
                  <select
                    value={preferredDay}
                    onChange={(e) => setPreferredDay(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden bg-white"
                  >
                    <option value="Weekday Morning (8am-12pm)">Weekday Morning (8am-12pm)</option>
                    <option value="Weekday Afternoon (1pm-5pm)">Weekday Afternoon (1pm-5pm)</option>
                    <option value="Saturday Morning">Saturday Morning</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Installation Property Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Street Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    onBlur={handleZipBlur}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden font-mono"
                  />
                </div>
              </div>

              {/* Service area status message */}
              {zipCoverageStatus && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  zipCoverageStatus.isServiced
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}>
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{zipCoverageStatus.message}</span>
                </div>
              )}

              <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={needsFinancing}
                  onChange={(e) => setNeedsFinancing(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-700">
                  Include 0% APR financing options and low monthly payment plans with my estimate.
                </span>
              </label>

              {/* Transparent Request-Based Status Disclosure */}
              <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600 leading-relaxed border border-slate-200">
                <span className="font-bold text-slate-800 block mb-0.5">Free Engineering Load Calculation Guarantee:</span>
                Our certified mechanical engineers conduct room-by-room ACCA Manual J calculations. We guarantee equipment is never undersized or oversized. Free written estimate valid for 30 days.
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>{isSubmitting ? 'Transmitting Request...' : 'Submit Installation Estimate Request'}</span>
                </button>
              </div>
            </form>
          )}

          {step === 4 && submittedLead && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-slate-500">Estimate Reference ID</span>
                <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                  {submittedLead.leadNumber}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                <p className="font-bold text-slate-900">
                  Your HVAC installation inquiry has been logged with our regional design team.
                </p>
                <p className="text-slate-600">
                  A senior design consultant will contact you at <strong>{submittedLead.phone}</strong> to confirm your on-site Manual J load calculation visit.
                </p>
                {submittedLead.dispatchStatusNotice && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 font-medium">
                    {submittedLead.dispatchStatusNotice}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={closeEstimateModal}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
