import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Sliders, CheckCircle2 } from 'lucide-react';
import { BusinessSettings } from '../types';

export const SetupWizardModal: React.FC = () => {
  const { settings, updateBusinessSettings, isSetupWizardOpen, setIsSetupWizardOpen } = useApp();

  const [form, setForm] = useState<BusinessSettings>(() => {
    return (
      settings || {
        businessName: 'Airflow Climate Solutions',
        tagline: 'Precision Climate Control, Uncompromising Reliability',
        country: 'United States',
        primaryCity: 'Metro Area',
        state: 'State',
        serviceAreasSummary: 'Metropolitan Area, Regional Districts, and Surrounding Communities',
        primaryPhone: '(800) 555-0199',
        emergencyPhone: '(800) 555-0911',
        businessEmail: 'service@airflowclimate.com',
        physicalAddress: '100 Enterprise Parkway, Suite 400',
        businessHours: 'Mon - Sat: 7:00 AM - 8:00 PM | Sun: 8:00 AM - 6:00 PM',
        emergencyAvailability: '24/7/365 On-Call Emergency Dispatch',
        bookingTimezone: 'America/New_York (EST)',
        currency: 'USD',
        licenseNumber: 'Master Mechanical Contractor · EPA 608 Universal Certified',
        satisfactionGuarantee: '100% Comfort Guarantee or Money Back',
        workmanshipWarranty: '10-Year Parts & 2-Year Craftsmanship Labor Warranty',
        financingPartners: ['Wells Fargo HVAC Advantage', 'Synchrony Financial', 'GoodLeap Clean Energy'],
        googleRating: 4.9,
        reviewCount: 384,
      }
    );
  });

  const [isSaving, setIsSaving] = useState(false);

  if (!isSetupWizardOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateBusinessSettings(form);
    setIsSaving(false);
    setIsSetupWizardOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-blue-400" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Administration Console</span>
              <h3 className="text-lg font-bold font-heading">Business Configuration Wizard</h3>
            </div>
          </div>
          <button
            onClick={() => setIsSetupWizardOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          <p className="text-slate-600 leading-relaxed text-[11px] pb-2 border-b border-slate-100">
            Customize your company identity, phone numbers, state licensing, service regions, and warranties without touching source code. All changes instantly persist to the platform database.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Business Name *</label>
              <input
                type="text"
                required
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Brand Tagline</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Primary City *</label>
              <input
                type="text"
                required
                value={form.primaryCity}
                onChange={(e) => setForm({ ...form, primaryCity: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">State *</label>
              <input
                type="text"
                required
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Timezone</label>
              <input
                type="text"
                value={form.bookingTimezone}
                onChange={(e) => setForm({ ...form, bookingTimezone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Standard Phone *</label>
              <input
                type="tel"
                required
                value={form.primaryPhone}
                onChange={(e) => setForm({ ...form, primaryPhone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-rose-700 uppercase tracking-wider mb-1">
                24/7 Emergency Phone *
              </label>
              <input
                type="tel"
                required
                value={form.emergencyPhone}
                onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-rose-300 focus:border-rose-600 outline-hidden font-mono bg-rose-50/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Business Email *</label>
              <input
                type="email"
                required
                value={form.businessEmail}
                onChange={(e) => setForm({ ...form, businessEmail: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">State License & Certifications</label>
              <input
                type="text"
                value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Physical Business Address</label>
            <input
              type="text"
              value={form.physicalAddress}
              onChange={(e) => setForm({ ...form, physicalAddress: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Standard Business Hours</label>
            <input
              type="text"
              value={form.businessHours}
              onChange={(e) => setForm({ ...form, businessHours: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Customer Satisfaction Guarantee</label>
            <textarea
              rows={2}
              value={form.satisfactionGuarantee}
              onChange={(e) => setForm({ ...form, satisfactionGuarantee: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
            />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSetupWizardOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'Saving Configuration...' : 'Save & Apply Live Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
