import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Check,
  Shield,
  Zap,
  Building2,
  Calendar,
  Sparkles,
  Award,
  CreditCard,
  ArrowRight,
  Phone,
  Mail,
} from 'lucide-react';
import { SaasLicenseType, SaasPlanTier } from '../types';

export const SaasPricingModal: React.FC = () => {
  const {
    isSaasPricingModalOpen,
    setIsSaasPricingModalOpen,
    saasConfig,
    submitSaasInquiry,
    addToast,
  } = useApp();

  const [selectedType, setSelectedType] = useState<SaasLicenseType>('monthly_rental');
  const [selectedTier, setSelectedTier] = useState<SaasPlanTier>('professional');
  const [showOrderForm, setShowOrderForm] = useState(false);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isSaasPricingModalOpen) return null;

  const plans = saasConfig?.plans || [];
  const rentalPlans = plans.filter((p) => p.licenseType === 'monthly_rental');
  const buyoutPlans = plans.filter((p) => p.licenseType === 'one_time_buyout');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !ownerName.trim() || !ownerEmail.trim()) {
      addToast('error', 'Missing Information', 'Please complete company name, your name, and email.');
      return;
    }

    setIsSubmitting(true);
    const res = await submitSaasInquiry({
      companyName,
      ownerName,
      ownerEmail,
      ownerPhone,
      city,
      state,
      licenseType: selectedType,
      planTier: selectedTier,
      notes,
    });
    setIsSubmitting(false);

    if (res.success) {
      setShowOrderForm(false);
      setIsSaasPricingModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 flex items-start justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
              <Building2 className="w-4 h-4" />
              <span>HVAC Engine SaaS Platform</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Launch This High-Converting Website For Your HVAC Company
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Choose the model that fits your business: a flexible <strong className="text-white">monthly website rental</strong> with zero maintenance hassle, or an <strong className="text-white">outright one-off buyout</strong> with perpetual ownership.
            </p>
          </div>
          <button
            onClick={() => setIsSaasPricingModalOpen(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          {!showOrderForm ? (
            <>
              {/* License Model Switcher */}
              <div className="flex justify-center">
                <div className="inline-flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                  <button
                    onClick={() => setSelectedType('monthly_rental')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      selectedType === 'monthly_rental'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Monthly Website Rental</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/30 text-white font-mono">No Upfront</span>
                  </button>
                  <button
                    onClick={() => setSelectedType('one_time_buyout')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      selectedType === 'one_time_buyout'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>One-Off Outright Buyout</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">Perpetual</span>
                  </button>
                </div>
              </div>

              {/* Model Explanations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div className={`p-4 rounded-xl border transition-all ${selectedType === 'monthly_rental' ? 'bg-white border-blue-400 shadow-xs' : 'border-transparent text-slate-500'}`}>
                  <span className="font-bold text-slate-900 block text-sm">Monthly Rental Option</span>
                  <p className="mt-1 leading-relaxed">
                    Zero upfront capital expense. We host, monitor, update security certificates, back up leads daily, and provide turnkey technical support. Cancel anytime with zero lock-in contracts.
                  </p>
                </div>
                <div className={`p-4 rounded-xl border transition-all ${selectedType === 'one_time_buyout' ? 'bg-white border-slate-900 shadow-xs' : 'border-transparent text-slate-500'}`}>
                  <span className="font-bold text-slate-900 block text-sm">Outright One-Off Buyout</span>
                  <p className="mt-1 leading-relaxed">
                    Pay once and own the entire system outright. Perpetual license key, full source code deployment rights, unlimited leads, and no monthly software rent ever. 1 year maintenance included.
                  </p>
                </div>
              </div>

              {/* Plans Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(selectedType === 'monthly_rental' ? rentalPlans : buyoutPlans).map((plan) => {
                  const isPro = plan.tier === 'professional';
                  return (
                    <div
                      key={plan.id}
                      className={`relative flex flex-col justify-between p-6 rounded-3xl border transition-all ${
                        isPro
                          ? 'bg-blue-50/40 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {isPro && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                          Most Popular
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-slate-900 text-base">{plan.name}</h3>
                          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                            {plan.tier}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mb-4 min-h-[32px]">{plan.description}</p>

                        <div className="mb-6 flex items-baseline gap-1">
                          <span className="text-3xl font-black text-slate-900 font-mono">${plan.price.toLocaleString()}</span>
                          <span className="text-xs font-semibold text-slate-500">
                            {plan.billingPeriod === 'monthly' ? '/ month' : ' one-time payment'}
                          </span>
                        </div>

                        <div className="border-t border-slate-100 pt-4 mb-6 space-y-2.5">
                          {plan.features.map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedTier(plan.tier);
                          setShowOrderForm(true);
                        }}
                        className={`w-full py-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                          isPro
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <span>{selectedType === 'monthly_rental' ? 'Start 14-Day Free Trial' : 'Order Outright Buyout'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Registration / Order Form */
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedType === 'monthly_rental' ? 'Start Your 14-Day Monthly Rental Trial' : 'Order Outright One-Off Buyout'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Selected Tier: <strong className="text-slate-800 capitalize">{selectedTier}</strong> ({selectedType === 'monthly_rental' ? 'Monthly Rental' : 'Perpetual Buyout'})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOrderForm(false)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  ← Back to Plans
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">HVAC Company Name *</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Metro Climate Solutions"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Marcus Vance"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Business Email *</label>
                    <input
                      type="email"
                      required
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="owner@yourhvac.com"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      placeholder="(800) 555-0199"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Primary City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Metro Area, City"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">State / Province</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. State or Region"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Special Requirements / Existing Domain</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide your current website domain if migrating, number of service trucks, or specific dispatch requirements..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 text-slate-600">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>Turnkey Deployment SLA</span>
                  </div>
                  <p>
                    Your dedicated onboarding architect will set up your DNS, configure your service ZIP codes, and provision your custom branding within 2 business hours.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowOrderForm(false)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting Registration...' : selectedType === 'monthly_rental' ? 'Reserve My 14-Day Free Trial' : 'Confirm Buyout Reservation'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
