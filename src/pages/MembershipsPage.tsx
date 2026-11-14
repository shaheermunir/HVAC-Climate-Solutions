import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Zap,
  DollarSign,
  ArrowRight,
} from 'lucide-react';

export const MembershipsPage: React.FC = () => {
  const { membershipPlans, enrollMembership, getPage } = useApp();
  const [selectedPlanId, setSelectedPlanId] = useState<string>(membershipPlans[1]?.id || 'plan-gold');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const memPageData = getPage('memberships') || getPage('/memberships');
  const heroSec = memPageData?.sections?.find((s) => s.type === 'hero' || s.id === 'sec-mem-hero');

  // Enrollment Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentComplete, setEnrollmentComplete] = useState<any>(null);

  const selectedPlan = membershipPlans.find((p) => p.id === selectedPlanId) || membershipPlans[0];

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email || !address) return;

    setIsEnrolling(true);
    const res = await enrollMembership({
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      address,
      planId: selectedPlan.id,
      billingCycle,
    });
    setIsEnrolling(false);
    if (res.success && res.subscription) {
      setEnrollmentComplete(res.subscription);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        {heroSec?.enabled !== false && (
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">
              {heroSec?.kicker || 'Preventative Maintenance Club'}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-heading">
              {heroSec?.heading || 'The Climate Care Club™ Membership'}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {heroSec?.subheading ||
                'Regular HVAC maintenance saves hundreds in utility bills, doubles equipment lifespan, and guarantees front-of-the-line priority scheduling during peak seasonal weather extremes.'}
            </p>
          </div>
        )}

        {/* Segmented Monthly / Annual toggle */}
        <div className="pt-4 flex justify-center">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                billingCycle === 'annual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">Save 10%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {membershipPlans.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          const displayPrice = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceAnnual;

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`rounded-2xl p-6 sm:p-8 border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 text-white border-blue-600 shadow-xl ring-2 ring-blue-600'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`text-lg font-bold font-heading ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {plan.name}
                    </h3>
                    <span className={`text-xs ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                      {plan.visitsPerYear} Complete Tune-Ups / Year
                    </span>
                  </div>
                  {plan.isPopular && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                      Recommended
                    </span>
                  )}
                </div>

                <div className="mb-6 pb-6 border-b border-slate-200/20">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black font-mono">${displayPrice}</span>
                    <span className={`text-xs ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                      / {billingCycle === 'monthly' ? 'mo' : 'year'}
                    </span>
                  </div>
                  <span className={`text-[11px] ${isSelected ? 'text-slate-400' : 'text-slate-500'} mt-1 block`}>
                    Includes {plan.discountPercent}% off all future repairs
                  </span>
                </div>

                <ul className="space-y-3 text-xs">
                  {(plan.benefits || []).map((b, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-blue-400' : 'text-blue-600'}`}
                      />
                      <span className={isSelected ? 'text-slate-300' : 'text-slate-700'}>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors ${
                    isSelected ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  {isSelected ? 'Selected Plan' : 'Select Plan'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Instant Enrollment Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-slate-900 font-heading mb-1">
          Enroll in {selectedPlan.name}
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Selected tier: <strong>{selectedPlan.name}</strong> (${billingCycle === 'monthly' ? selectedPlan.priceMonthly : selectedPlan.priceAnnual}/{billingCycle === 'monthly' ? 'month' : 'year'}). No long-term contracts; cancel anytime.
        </p>

        {!enrollmentComplete ? (
          <form onSubmit={handleEnroll} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Michael Thompson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mobile Phone *
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Service Property Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="1234 Elm Street, Suite 100"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isEnrolling}
              className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{isEnrolling ? 'Processing Enrollment...' : 'Complete Climate Care Club Enrollment'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Membership Subscription Active!</span>
            </div>
            <p className="text-xs">
              Thank you, <strong>{enrollmentComplete.customerName}</strong>. Your subscription reference is{' '}
              <strong className="font-mono">{enrollmentComplete.subscriptionNumber}</strong>.
            </p>
            <div className="text-xs space-y-1">
              <div>Plan: {enrollmentComplete.planName}</div>
              <div>Next Routine Tune-Up Window: {enrollmentComplete.nextServiceDue}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
