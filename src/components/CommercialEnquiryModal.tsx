import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Building2,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  FileSpreadsheet,
} from 'lucide-react';

export const CommercialEnquiryModal: React.FC = () => {
  const {
    isCommercialModalOpen,
    closeCommercialModal,
    submitLead,
    checkZipCoverage,
  } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<any>(null);

  // Business / Facility specs
  const [companyName, setCompanyName] = useState('');
  const [facilityType, setFacilityType] = useState('Office Building');
  const [squareFootage, setSquareFootage] = useState(12000);
  const [rtuCount, setRtuCount] = useState('4');
  const [projectScope, setProjectScope] = useState('emergency_outage');

  // Contact info
  const [contactName, setContactName] = useState('');
  const [contactTitle, setContactTitle] = useState('Facility Director');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [facilityAddress, setFacilityAddress] = useState('');
  const [city, setCity] = useState('Metro Area');
  const [zipCode, setZipCode] = useState('10001');
  const [projectNotes, setProjectNotes] = useState('');
  const [zipCoverageStatus, setZipCoverageStatus] = useState<any>(null);

  if (!isCommercialModalOpen) return null;

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
    if (!companyName || !contactName || !phone || !facilityAddress || !zipCode) return;

    setIsSubmitting(true);
    const scopeLabels: Record<string, string> = {
      emergency_outage: 'Emergency RTU Failure (Server/Kitchen/Tenant Loss of Cool)',
      planned_replacement: 'Commercial RTU Replacement / Capital Planning RFP',
      maintenance_contract: 'Commercial Planned Maintenance Agreement (PMA)',
      vrf_retrofit: 'VRF / Variable Refrigerant Flow Zoning Retrofit',
    };

    const notesSummary = `COMMERCIAL HVAC FACILITY INQUIRY:
Company / Property: ${companyName}
Facility Type: ${facilityType} (${squareFootage.toLocaleString()} sq ft)
Estimated RTU Units: ${rtuCount} Unit(s)
Project Scope: ${scopeLabels[projectScope] || projectScope}
Contact Title: ${contactTitle}
Scope Specifications: ${projectNotes || 'Standard commercial facility intake.'}`;

    const isEmergencyScope = projectScope === 'emergency_outage';

    const res = await submitLead({
      customerName: `${contactName} (${companyName})`,
      phone,
      email,
      address: facilityAddress,
      city,
      zipCode,
      urgency: isEmergencyScope ? 'emergency' : 'high',
      serviceRequested: `Commercial: ${scopeLabels[projectScope] || 'HVAC Service'}`,
      source: 'commercial_rfp',
      journey: 'commercial',
      propertyType: 'commercial',
      homeSquareFootage: squareFootage,
      commercialDetails: {
        companyName,
        facilityType,
        rtuCount: parseInt(rtuCount, 10) || 1,
        squareFootage,
      },
      notes: notesSummary,
    });

    setIsSubmitting(false);
    if (res.success && res.lead) {
      setSubmittedLead(res.lead);
      setStep(2);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Commercial Mechanical Division</span>
              <h3 className="text-lg font-bold font-heading">Commercial HVAC Consultation & RFP Triage</h3>
            </div>
          </div>
          <button
            onClick={closeCommercialModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Company / Facility Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Metro Tech Center / Corporate Plaza"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Facility Property Type
                  </label>
                  <select
                    value={facilityType}
                    onChange={(e) => setFacilityType(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden bg-white"
                  >
                    <option value="Office Building">Office Building / Business Park</option>
                    <option value="Restaurant / Food Service">Restaurant / Food Service (Kitchen Hoods)</option>
                    <option value="Retail Center / Strip Mall">Retail Store / Strip Center</option>
                    <option value="Warehouse / Distribution">Warehouse / Industrial Facility</option>
                    <option value="Medical / Healthcare Suite">Medical / Dental / Healthcare Suite</option>
                    <option value="School / Church">School / Religious Institution</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nature of Commercial Enquiry *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      id: 'emergency_outage',
                      title: '🚨 Emergency RTU Outage',
                      desc: 'Server room or occupied commercial space failure. Guaranteed <1 hr priority dispatch.',
                    },
                    {
                      id: 'planned_replacement',
                      title: '📦 RTU Replacement & Crane Lift',
                      desc: 'Turnkey engineered replacement of 3-25 ton rooftop package units with curb adapters.',
                    },
                    {
                      id: 'maintenance_contract',
                      title: '📋 Commercial Maintenance (PMA)',
                      desc: 'Quarterly belt, filter, coil, and economizer service agreements with zero trip fees.',
                    },
                    {
                      id: 'vrf_retrofit',
                      title: '❄️ VRF / Multi-Zone Retrofit',
                      desc: 'Variable refrigerant flow heat recovery systems for customized tenant climate control.',
                    },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                        projectScope === item.id
                          ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-1 ring-blue-500/20 font-medium'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="projectScope"
                        checked={projectScope === item.id}
                        onChange={() => setProjectScope(item.id)}
                        className="sr-only"
                      />
                      <div className="font-bold text-slate-900">{item.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.desc}</div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Facility Conditioned Area (Sq Ft)
                  </label>
                  <input
                    type="number"
                    value={squareFootage}
                    step={1000}
                    onChange={(e) => setSquareFootage(parseInt(e.target.value, 10) || 5000)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Number of Rooftop / Packaged Units
                  </label>
                  <select
                    value={rtuCount}
                    onChange={(e) => setRtuCount(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden bg-white"
                  >
                    <option value="1">1 Unit</option>
                    <option value="2">2 to 3 Units</option>
                    <option value="5">4 to 6 Units</option>
                    <option value="10">7 to 12 Units</option>
                    <option value="20">12+ Units (Campus)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Title / Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Property Manager"
                    value={contactTitle}
                    onChange={(e) => setContactTitle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Direct Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(800) 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Corporate Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="manager@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Facility Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Commercial Property Address"
                    value={facilityAddress}
                    onChange={(e) => setFacilityAddress(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
                  />
                </div>
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

              {/* Service area check */}
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

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Scope Details / Unit Model / Equipment Access (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Carrier 10-ton rooftop unit blowing warm air into dining room, or RFP bid documents available for annual service."
                  value={projectNotes}
                  onChange={(e) => setProjectNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
                />
              </div>

              {/* Transparent Request-Based Status Disclosure */}
              <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600 leading-relaxed border border-slate-200">
                <span className="font-bold text-slate-800 block mb-0.5">Commercial Dispatch Priority SLA:</span>
                Commercial tickets bypass residential queues and route directly to our Lead Commercial Project Manager. Emergency outages receive on-site dispatch within 2 hours. Comprehensive bid proposals delivered within 48 hours.
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>{isSubmitting ? 'Routing Commercial Ticket...' : 'Submit Commercial Service Inquiry'}</span>
                </button>
              </div>
            </form>
          )}

          {step === 2 && submittedLead && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-slate-500">Commercial Account Ticket</span>
                <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                  {submittedLead.leadNumber}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                <p className="font-bold text-slate-900">
                  Your commercial inquiry has been prioritized with our Commercial Mechanical Division.
                </p>
                <p className="text-slate-600">
                  A Commercial Mechanical Engineer will contact <strong>{contactName}</strong> at <strong>{submittedLead.phone}</strong> within 1 hour.
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
                  onClick={closeCommercialModal}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                >
                  Close & Await Commercial Engineer Call
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
