import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  AlertTriangle,
  Phone,
  Camera,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export const EmergencyTriageModal: React.FC = () => {
  const {
    settings,
    isEmergencyModalOpen,
    closeEmergencyModal,
    submitLead,
    checkZipCoverage,
    addToast,
  } = useApp();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<any>(null);
  const [duplicateNotice, setDuplicateNotice] = useState<string | null>(null);
  const [zipCoverageStatus, setZipCoverageStatus] = useState<any>(null);

  // Form Fields
  const [problemCategory, setProblemCategory] = useState('complete_cooling_failure');
  const [equipmentType, setEquipmentType] = useState('central_ac');
  const [indoorTemp, setIndoorTemp] = useState('86');
  const [problemDescription, setProblemDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Metro Area');
  const [zipCode, setZipCode] = useState('10001');
  const [preferredContact, setPreferredContact] = useState<'phone' | 'text'>('phone');
  const [hasVulnerableOccupants, setHasVulnerableOccupants] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  if (!isEmergencyModalOpen) return null;

  const emergencyPhone = settings?.emergencyPhone || '(800) 555-0911';

  const handleZipBlur = async () => {
    if (zipCode.length === 5) {
      const res = await checkZipCoverage(zipCode);
      setZipCoverageStatus(res);
      if (res.cityName && res.cityName !== 'Greater Metro Area') {
        setCity(res.cityName);
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('error', 'File Too Large', 'Photo snapshot exceeds 5MB limit. Please select a smaller photo.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !address || !zipCode) {
      return;
    }

    setIsSubmitting(true);
    setDuplicateNotice(null);

    const categoryLabels: Record<string, string> = {
      complete_cooling_failure: 'Complete Cooling Outage (100°F+ Heat Wave)',
      heating_failure: 'Total Heating Failure (Freeze Advisory)',
      ceiling_flood: 'Active Water Flooding Through Ceiling/Plenum',
      burning_smell: 'Electrical Sparks or Burning Odor from Air Handler',
      refrigerant_leak: 'Hissing Sound & Frozen Coil',
    };

    const notesSummary = `EMERGENCY DISPATCH TRIAGE:
Category: ${categoryLabels[problemCategory] || problemCategory}
Equipment: ${equipmentType}
Indoor Temp: ${indoorTemp}°F
High-Risk Occupants (Infants/Elderly/Pets): ${hasVulnerableOccupants ? 'YES - PRIORITY 1' : 'NO'}
Description: ${problemDescription}`;

    const res = await submitLead({
      customerName,
      phone,
      email,
      address,
      city,
      zipCode,
      urgency: 'emergency',
      serviceRequested: `EMERGENCY: ${categoryLabels[problemCategory] || '24/7 HVAC Dispatch'}`,
      source: 'emergency_call',
      journey: 'emergency',
      preferredContactMethod: preferredContact,
      propertyType: 'residential',
      notes: notesSummary,
      photoUrl: photoPreview || undefined,
    });

    setIsSubmitting(false);
    if (res.success && res.lead) {
      if ((res as any).isDuplicate) {
        setDuplicateNotice(res.message || 'Existing emergency request detected. Your ticket is already prioritized in queue.');
      }
      setSubmittedLead(res.lead);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-rose-950 text-white flex items-center justify-between border-b border-rose-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">Priority Triage Protocol</span>
              <h3 className="text-lg font-bold font-heading text-white">24/7 Emergency HVAC Dispatch</h3>
            </div>
          </div>
          <button
            onClick={closeEmergencyModal}
            className="p-1.5 rounded-lg text-rose-300 hover:text-white hover:bg-rose-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Immediate Call-to-Dispatch Strip */}
        <div className="bg-rose-50 px-6 py-2.5 border-b border-rose-100 flex items-center justify-between text-xs">
          <span className="text-rose-900 font-semibold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Target response within 15 mins · On-site &lt; 2 hrs</span>
          </span>
          <a
            href={`tel:${emergencyPhone.replace(/\D/g, '')}`}
            className="font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 underline"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Live Operator: {emergencyPhone}</span>
          </a>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {!submittedLead ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Problem Classification */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nature of Emergency Outage *
                </label>
                <select
                  value={problemCategory}
                  onChange={(e) => setProblemCategory(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-rose-200 focus:border-rose-600 outline-hidden bg-white font-semibold text-slate-800"
                >
                  <option value="complete_cooling_failure">Complete AC Failure (Indoor Temp Exceeds 80°F)</option>
                  <option value="ceiling_flood">Active Condensate Flooding Through Ceiling</option>
                  <option value="burning_smell">Electrical Sparks, Pop, or Burning Odor from Unit</option>
                  <option value="heating_failure">Total Heating Outage During Freeze Advisory</option>
                  <option value="refrigerant_leak">Severe Frozen Coil / Hissing Noise</option>
                </select>
              </div>

              {/* Equipment & Indoor Temp */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    System Type
                  </label>
                  <select
                    value={equipmentType}
                    onChange={(e) => setEquipmentType(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-rose-600 outline-hidden bg-white"
                  >
                    <option value="central_ac">Central AC & Gas Furnace</option>
                    <option value="heat_pump">Inverter Heat Pump</option>
                    <option value="mini_split">Ductless Mini-Split</option>
                    <option value="commercial_rtu">Commercial Rooftop Unit</option>
                    <option value="unknown">Not Sure / Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Current Indoor Temp (°F)
                  </label>
                  <input
                    type="number"
                    value={indoorTemp}
                    onChange={(e) => setIndoorTemp(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-rose-600 outline-hidden"
                  />
                </div>
              </div>

              {/* High-Risk Household Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasVulnerableOccupants}
                  onChange={(e) => setHasVulnerableOccupants(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="text-xs text-slate-700 leading-snug">
                  <strong>High-Risk Occupants Present:</strong> Infants, elderly individuals, or medical conditions in
                  the home requiring expedited priority triage.
                </span>
              </label>

              {/* Customer Contact */}
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
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-rose-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Callback Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(800) 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-rose-600 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Property Street Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Street Address where technician should arrive"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-rose-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    City / Area *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-rose-600 outline-hidden"
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
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-rose-600 outline-hidden font-mono"
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
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{zipCoverageStatus.message}</span>
                </div>
              )}

              {/* Optional Photo Attachment */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                  <span>Photo of Unit / Thermostat / Leak (Optional)</span>
                  <span className="text-[10px] text-slate-400">Max 5MB</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 text-xs text-slate-600">
                    <Camera className="w-4 h-4 text-slate-500" />
                    <span>Upload Snapshot</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                  {photoPreview && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoPreview(null)}
                        className="absolute top-0 right-0 bg-slate-900/80 text-white p-0.5 rounded-bl"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Transparent Disclosure Policy */}
              <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600 leading-relaxed border border-slate-200">
                <span className="font-bold text-slate-800 block mb-0.5">Emergency Dispatch Policy:</span>
                Our team operates rolling warehouses with standard OEM parts. Emergency diagnostic fee is $149,
                which is credited 100% toward any approved repair. No unauthorized charges are ever incurred.
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{isSubmitting ? 'Transmitting Emergency Alert...' : 'Dispatch Emergency Technician'}</span>
              </button>
            </form>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              {duplicateNotice && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900">
                  <span className="font-bold block mb-0.5">Duplicate Submission Handled:</span>
                  {duplicateNotice}
                </div>
              )}

              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-slate-500">Emergency Dispatch ID</span>
                <div className="text-2xl font-black text-rose-700 font-mono mt-0.5">
                  {submittedLead.leadNumber}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-left text-xs space-y-2 text-rose-950">
                <p className="font-bold text-sm text-rose-900">
                  Your emergency dispatch has been transmitted to our on-call response team.
                </p>
                <p>
                  A dispatch manager will call you at <strong>{submittedLead.phone}</strong> within 15 minutes to confirm technician ETA.
                </p>
                {submittedLead.dispatchStatusNotice && (
                  <div className="p-2.5 bg-rose-100/70 border border-rose-300 rounded-lg text-rose-950 font-medium">
                    {submittedLead.dispatchStatusNotice}
                  </div>
                )}
                <div className="pt-2 border-t border-rose-200 font-semibold text-rose-800">
                  Safety Precaution: If you detect strong natural gas or sulfur odor, immediately evacuate the property and call 911.
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={closeEmergencyModal}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                >
                  Close & Await Dispatcher Call
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
