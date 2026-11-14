import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  DollarSign,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Calculator,
  Award,
} from 'lucide-react';

export const FinancingPage: React.FC = () => {
  const { openBookingModal, settings, formatCurrency, getPage } = useApp();
  const businessName = settings?.businessName || 'Airflow Climate Solutions';
  const [systemCost, setSystemCost] = useState(8500);
  const [termMonths, setTermMonths] = useState(24);

  const finPageData = getPage('financing') || getPage('/financing');
  const heroSec = finPageData?.sections?.find((s) => s.type === 'hero' || s.id === 'sec-fin-hero');
  const plansSec = finPageData?.sections?.find((s) => s.type === 'cards' || s.id === 'sec-fin-plans');
  const stepsSec = finPageData?.sections?.find((s) => s.type === 'steps' || s.id === 'sec-fin-steps');

  // Approximate payment calculation
  const isZeroApr = termMonths <= 24;
  const apr = isZeroApr ? 0 : 0.0999;

  const calculateMonthly = () => {
    if (apr === 0) {
      return Math.round(systemCost / termMonths);
    }
    const r = apr / 12;
    const payment = (systemCost * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
    return Math.round(payment);
  };

  const monthlyPayment = calculateMonthly();

  const defaultPlans = [
    {
      id: 'fin-plan-1',
      title: 'Wells Fargo HVAC Advantage',
      description: 'Special promotional terms, convenient monthly payments, and revolving lines of credit for complete heating and cooling replacements.',
      badge: 'Subject to Credit Approval',
    },
    {
      id: 'fin-plan-2',
      title: 'Synchrony Climate Solutions',
      description: 'Fast paperless online application with instant credit decisions. Multiple deferred-interest and reduced APR plans.',
      badge: 'Fast Pre-Qualification',
    },
    {
      id: 'fin-plan-3',
      title: 'GoodLeap Clean Energy Loans',
      description: 'Specialized sustainable home financing designed specifically for variable-speed heat pumps, ductless systems, and whole-home electrification.',
      badge: 'Terms up to 10 Years',
    },
  ];

  const plansToRender = plansSec?.items && plansSec.items.length > 0 ? plansSec.items : defaultPlans;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* 1. Header / Hero */}
      {heroSec?.enabled !== false && (
        <div className="max-w-3xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">
            {heroSec?.kicker || 'Affordable Climate Investment'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-heading">
            {heroSec?.heading || 'Flexible HVAC Financing & Energy Rebates'}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {heroSec?.subheading ||
              'Don’t let an unexpected AC or heating breakdown strain your family’s budget. We partner with premier national lenders to offer 0% APR promotional financing and low monthly payment options on qualifying systems.'}
          </p>
        </div>
      )}

      {/* 2. Interactive Monthly Payment Estimator */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
              <Calculator className="w-4 h-4" />
              <span>Financing Payment Estimator</span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider">Estimated System Investment</span>
                <span className="text-xl font-black text-slate-900 font-mono">{formatCurrency(systemCost)}</span>
              </div>
              <input
                type="range"
                min={4000}
                max={18000}
                step={250}
                value={systemCost}
                onChange={(e) => setSystemCost(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>{formatCurrency(4000)} (Components/Ducts)</span>
                <span>{formatCurrency(10000)} (Average System)</span>
                <span>{formatCurrency(18000)} (High-End VRF)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Financing Term
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { months: 12, label: '12 Months (0% APR)' },
                  { months: 24, label: '24 Months (0% APR)' },
                  { months: 60, label: '60 Months (Low Monthly)' },
                ].map((t) => (
                  <button
                    key={t.months}
                    onClick={() => setTermMonths(t.months)}
                    className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                      termMonths === t.months
                        ? 'border-blue-700 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Card */}
          <div className="lg:col-span-5 bg-slate-900 text-white p-8 rounded-2xl flex flex-col justify-between space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Estimated Monthly Payment
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl sm:text-5xl font-black font-mono text-white">{formatCurrency(monthlyPayment)}</span>
                <span className="text-xs text-slate-400 font-normal">/ month</span>
              </div>
              <span className="text-[11px] text-emerald-400 block mt-2 font-semibold">
                {isZeroApr ? '0% APR Promotional Financing with Equal Payments' : 'Standard Fixed Rate Term'}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-300 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Down Payment Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Soft Credit Check Pre-Qualification Available</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>No Prepayment Penalties</span>
              </div>
            </div>

            <button
              onClick={() => openBookingModal('ac-installation')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Apply via In-Home Estimate
            </button>
          </div>
        </div>
      </div>

      {/* 3. Authorized Financing Providers */}
      {plansSec?.enabled !== false && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            {plansSec?.heading || 'Authorized Financing Providers'}
          </h2>
          {plansSec?.subheading && <p className="text-xs text-slate-500">{plansSec.subheading}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plansToRender.map((plan) => (
              <div key={plan.id} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                <h3 className="font-bold text-slate-900 text-base">{plan.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{plan.description}</p>
                {plan.badge && (
                  <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-medium">
                    {plan.badge}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mandatory Regulatory Disclaimers */}
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 leading-relaxed space-y-2">
        <span className="font-bold text-slate-800 block">Financing Terms & Disclaimers:</span>
        <p>
          Financing is provided through third-party authorized financial institutions and is subject to approved credit.
          Estimated payments shown on this calculator are illustrative and non-binding. Exact interest rates, APR,
          minimum monthly payment amounts, and fees vary based on creditworthiness, loan amount, and selected promotion.
          {businessName} does not act as a lender or credit broker.
        </p>
      </div>
    </div>
  );
};
