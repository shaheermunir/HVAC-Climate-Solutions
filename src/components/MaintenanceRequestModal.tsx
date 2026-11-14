import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Wrench,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

export const MaintenanceRequestModal: React.FC = () => {
  const {
    isMaintenanceModalOpen,
    closeMaintenanceModal,
    submitLead,
    checkZipCoverage,
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<any>(null);

  // Package
  const [packageType, setPackageType] = useState('spring_tuneup');
  const [unitCount, setUnitCount] = useState('1');

  // Equipment info
  const [systemBrand, setSystemBrand] = useState('Trane');
  const [filterSize, setFilterSize] = useState('16x25x1');
  const [specialConcerns, setSpecialConcerns] = useState('');

  // Contact
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Metro Area');
  const [zipCode, setZipCode] = useState('10001');
  const [preferredWindow, setPreferredWindow] = useState('Morning (8am - 12pm)');
  const [zipCoverageStatus, setZipCoverageStatus] = useState<any>(null);

  if (!isMaintenanceModalOpen) return null;

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
    if (!customerName || !phone || !address || !zipCode) return;

    setIsSubmitting(true);
    const packageLabels: Record<string, string> = {
      spring_tuneup: 'Spring 21-Point AC Precision Tune-Up ($89)',
      fall_furnace: 'Fall Heating Safety & Carbon Monoxide Check ($89)',
      full_revival: 'Complete System Chemical Coil Cleaning & Revival ($149)',
      comfort_club_member: 'Climate Care Club Annual Service Dispatch ($0 copay)',
    };

    const notesSummary = `MAINTENANCE & TUNE-UP REQUEST:
Package: ${packageLabels[packageType] || packageType}
System Units: ${unitCount} System(s)
Brand: ${systemBrand}
Air Filter Size: ${filterSize}
Preferred Timing: ${preferredWindow}
Customer Notes / Symptoms: ${specialConcerns || 'None reported'}`;

    const res = await submitLead({
      customerName,
      phone,
      email,
      address,
      city,
      zipCode,
      urgency: 'normal',
      serviceRequested: `Maintenance: ${packageLabels[packageType] || 'Tune-Up'}`,
      source: 'maintenance_request',
      journey: 'maintenance',
      propertyType: 'residential',
      notes: notesSummary,
    });

    setIsSubmitting(false);
    if (res.success && res.lead) {
      setSubmittedLead(res.lead);
      setStep(3);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Preventative Care Journey</span>
              <h3 className="text-lg font-bold font-heading">Schedule HVAC Maintenance & Tune-Up</h3>
            </div>
          </div>
          <button
            onClick={closeMaintenanceModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        {step < 3 && (
          <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span className={step >= 1 ? 'text-emerald-700 font-bold' : ''}>1. Service Package & Equipment</span>
            <span>→</span>
            <span className={step >= 2 ? 'text-emerald-700 font-bold' : ''}>2. Property & Dispatch Timing</span>
          </div>
        )}

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Select Tune-Up Protocol
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'spring_tuneup',
                      title: 'Spring 21-Point AC Precision Tune-Up ($89)',
                      desc: 'Full refrigerant subcool test, dual run capacitor micro-farad check, condensate line flush, electrical contactor scrub, outdoor coil rinse.',
                    },
                    {
                      id: 'fall_furnace',
                      title: 'Fall Heating Safety & CO Inspection ($89)',
                      desc: 'Digital heat exchanger camera inspection, draft motor verify, electronic igniter cleaning, flame sensor amp test, flue gas CO analysis.',
                    },
                    {
                      id: 'full_revival',
                      title: 'Full Coil Chemical Rejuvenation ($149)',
                      desc: 'Deep self-rinsing evaporator and condenser foaming chemical wash, static pressure balance check, blower wheel clean.',
                    },
                    {
                      id: 'comfort_club_member',
                      title: 'Climate Care Club Annual Dispatch (Included)',
                      desc: 'Routine biannual visit for active Comfort Club membership holders with priority VIP scheduling and zero copay.',
                    },
                  ].map((pkg) => (
                    <label
                      key={pkg.id}
                      className={`p-3 rounded-xl border text-xs flex items-start gap-3 cursor-pointer transition-colors ${
                        packageType === pkg.id
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-medium ring-1 ring-emerald-500/30'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="maintenancePackage"
                        checked={packageType === pkg.id}
                        onChange={() => setPackageType(pkg.id)}
                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{pkg.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{pkg.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    HVAC Units
                  </label>
                  <select
                    value={unitCount}
                    onChange={(e) => setUnitCount(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-hidden bg-white"
                  >
                    <option value="1">1 System</option>
                    <option value="2">2 Systems</option>
                    <option value="3">3+ Systems</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Primary Brand
                  </label>
                  <select
                    value={systemBrand}
                    onChange={(e) => setSystemBrand(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-hidden bg-white"
                  >
                    <option value="Trane">Trane</option>
                    <option value="Carrier">Carrier</option>
                    <option value="Lennox">Lennox</option>
                    <option value="Bosch">Bosch</option>
                    <option value="Goodman">Goodman</option>
                    <option value="Rheem">Rheem</option>
                    <option value="Mitsubishi">Mitsubishi</option>
                    <option value="Other">Other / Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Filter Size
                  </label>
                  <select
                    value={filterSize}
                    onChange={(e) => setFilterSize(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-hidden bg-white font-mono"
                  >
                    <option value="16x25x1">16x25x1</option>
                    <option value="20x25x1">20x25x1</option>
                    <option value="20x20x1">20x20x1</option>
                    <option value="16x20x1">16x20x1</option>
                    <option value="4-inch Media">4" Media Cabinet</option>
                    <option value="Unsure">Bring Various</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Specific Concerns / Symptoms to Inspect (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Master bedroom runs 4 degrees warmer, or faint whistling sound from return grille"
                  value={specialConcerns}
                  onChange={(e) => setSpecialConcerns(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-hidden"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <span>Next: Property Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
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
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-hidden"
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Preferred Scheduling Window
                  </label>
                  <select
                    value={preferredWindow}
                    onChange={(e) => setPreferredWindow(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-hidden bg-white"
                  >
                    <option value="Morning (8:00 AM - 12:00 PM)">Morning (8:00 AM - 12:00 PM)</option>
                    <option value="Afternoon (1:00 PM - 5:00 PM)">Afternoon (1:00 PM - 5:00 PM)</option>
                    <option value="First Call of Day (7:30 AM)">First Call of Day (7:30 AM)</option>
                    <option value="Saturday Morning">Saturday Morning Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Property Street Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Street Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-hidden"
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
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-hidden"
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
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-hidden font-mono"
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

              {/* Transparent Request-Based Status Disclosure */}
              <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600 leading-relaxed border border-slate-200">
                <span className="font-bold text-slate-800 block mb-0.5">Rolling Warehouse Guarantee:</span>
                Our certified technicians arrive in fully equipped warehouse vans carrying universal capacitors, contactors, motors, and OEM filters. All work backed by our 100% Satisfaction Guarantee.
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
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Transmitting Request...' : 'Confirm Maintenance Booking'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && submittedLead && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-slate-500">Maintenance Ticket Reference</span>
                <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                  {submittedLead.leadNumber}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                <p className="font-bold text-slate-900">
                  Your maintenance request is logged with the dispatch coordination desk.
                </p>
                <p className="text-slate-600">
                  Our dispatch coordinator will contact you at <strong>{submittedLead.phone}</strong> to confirm your technician route arrival time.
                </p>
                {submittedLead.dispatchStatusNotice && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-medium">
                    {submittedLead.dispatchStatusNotice}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={closeMaintenanceModal}
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
