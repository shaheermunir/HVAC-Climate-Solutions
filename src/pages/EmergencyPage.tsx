import React from 'react';
import { useApp } from '../context/AppContext';
import {
  AlertTriangle,
  Phone,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Wrench,
  ThermometerSnowflake,
  Flame,
} from 'lucide-react';

export const EmergencyPage: React.FC = () => {
  const { settings, openEmergencyModal, getPage } = useApp();

  const phone = settings?.emergencyPhone || '(800) 555-0911';
  const emergPageData = getPage('emergency') || getPage('/emergency');

  const heroSec = emergPageData?.sections?.find((s) => s.type === 'hero' || s.id === 'sec-emerg-hero');
  const condSec = emergPageData?.sections?.find((s) => s.type === 'cards' || s.id === 'sec-emerg-conditions');
  const stepsSec = emergPageData?.sections?.find((s) => s.type === 'steps' || s.id === 'sec-emerg-steps');

  const defaultConditions = [
    {
      id: 'cond-1',
      title: 'Complete Cooling Failure',
      description: 'Outdoor temperatures exceed 90°F with infants, seniors, or pets in the home.',
    },
    {
      id: 'cond-2',
      title: 'Total Heating Outage',
      description: 'Temperatures below 40°F with interior freeze and pipe burst risk.',
    },
    {
      id: 'cond-3',
      title: 'Condensate Line Flooding',
      description: 'Active water overflowing ceiling drywall or equipment closets.',
    },
    {
      id: 'cond-4',
      title: 'Burning Odor or Sparks',
      description: 'Electrical contactor failure or wire overheating.',
    },
  ];

  const defaultSteps = [
    {
      id: 'step-1',
      title: 'Turn the Thermostat to OFF',
      description: 'If the unit is buzzing or the indoor coil is frozen, shut it down to prevent compressor burnout.',
    },
    {
      id: 'step-2',
      title: 'If Burning Smell is Present',
      description: 'Shut off the dedicated HVAC circuit breaker in your electrical service panel immediately.',
    },
    {
      id: 'step-3',
      title: 'If Gas Odor is Detected',
      description: 'Evacuate the premises immediately, do not operate light switches, and call your gas utility and 911 from outside.',
    },
    {
      id: 'step-4',
      title: 'Keep Doors and Windows Closed',
      description: 'Retain remaining thermal conditioning while our mobile rolling warehouse is en route.',
    },
  ];

  const conditionsToRender = condSec?.items && condSec.items.length > 0 ? condSec.items : defaultConditions;
  const stepsToRender = stepsSec?.items && stepsSec.items.length > 0 ? stepsSec.items : defaultSteps;

  return (
    <div className="space-y-16 pb-20">
      {/* 1. Hero Section */}
      {heroSec?.enabled !== false && (
        <section className="bg-rose-950 text-white py-16 border-b border-rose-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-900/60 border border-rose-700 text-xs text-rose-200 font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>{heroSec?.kicker || 'Live Emergency Dispatch Active'}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-heading">
                {heroSec?.heading || '24/7 Emergency AC & Heating Dispatch'}
              </h1>

              <p className="text-sm sm:text-base text-rose-100 leading-relaxed max-w-2xl">
                {heroSec?.subheading ||
                  'Extreme heat and winter freezes pose real hazards. Our on-call master technicians are stationed across our primary service territory with target on-site arrival under 2 hours.'}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <a
                  href={`tel:${phone.replace(/\D/g, '')}`}
                  className="px-6 py-4 bg-white text-rose-900 hover:bg-rose-50 font-black text-sm rounded-xl shadow-lg transition-colors flex items-center gap-2"
                >
                  <Phone className="w-4 h-4 text-rose-600" />
                  <span>Call Live Operator: {phone}</span>
                </a>

                <button
                  onClick={openEmergencyModal}
                  className="px-6 py-4 bg-rose-700 hover:bg-rose-600 text-white font-bold text-sm rounded-xl border border-rose-600 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>{heroSec?.buttonText || 'Request Online Triage Dispatch'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Qualifying Conditions & Safety Checklist */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {condSec?.enabled !== false && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900 font-heading flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>{condSec?.heading || 'Qualifying Emergency Conditions'}</span>
            </h2>
            {condSec?.subheading && <p className="text-xs text-slate-500">{condSec.subheading}</p>}
            <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
              {conditionsToRender.map((cond) => (
                <li key={cond.id} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>{cond.title}:</strong> {cond.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {stepsSec?.enabled !== false && (
          <div className="bg-slate-900 text-white p-8 rounded-2xl border border-slate-800 shadow-sm space-y-4">
            <h2 className="text-xl font-bold font-heading flex items-center gap-2 text-amber-400">
              <Clock className="w-5 h-5" />
              <span>{stepsSec?.heading || 'Safety Checklist While Waiting for Technician'}</span>
            </h2>
            {stepsSec?.subheading && <p className="text-xs text-slate-400">{stepsSec.subheading}</p>}
            <ol className="space-y-3 text-xs sm:text-sm text-slate-300 list-decimal pl-4">
              {stepsToRender.map((step) => (
                <li key={step.id}>
                  <strong>{step.title}:</strong> {step.description}
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      {/* 3. Dispatch Policy Strip */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-600 space-y-2">
          <h3 className="font-bold text-slate-900 text-base">Honest Emergency Fee & Service Policy</h3>
          <p className="leading-relaxed">
            Our standard emergency diagnostic fee is $149 (disclosed upfront before any truck departs).
            When repairs are approved, 100% of this fee is credited toward the required repair.
            Technicians carry OEM components for 94% same-visit resolution.
          </p>
        </div>
      </section>
    </div>
  );
};
