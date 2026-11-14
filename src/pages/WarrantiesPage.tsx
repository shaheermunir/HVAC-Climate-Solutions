import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
} from 'lucide-react';

export const WarrantiesPage: React.FC = () => {
  const { openBookingModal, settings, formatCurrency, getPage } = useApp();

  const warPageData = getPage('warranties') || getPage('/warranties');
  const heroSec = warPageData?.sections?.find((s) => s.type === 'hero' || s.id === 'sec-war-hero');
  const gridSec = warPageData?.sections?.find((s) => s.type === 'cards' || s.id === 'sec-war-grid');

  const satisfactionText =
    settings?.satisfactionGuarantee ||
    'If you are not completely satisfied with your new heating or cooling system during the first 12 months after installation, our technicians will adjust, repair, or remove the equipment and refund 100% of your investment.';

  const workmanshipText =
    settings?.workmanshipWarranty ||
    'Every electrical connection, flare joint, condensate trap, and sheet metal transition installed by our certified technicians is guaranteed against defective workmanship. If a repaired component fails within 2 years, we replace it at zero cost.';

  const defaultGuarantees = [
    {
      id: 'war-1',
      title: '100% Comfort & Satisfaction Guarantee',
      term: '1 Full Year from Installation',
      description: satisfactionText,
      badge: 'Money-Back Protection',
    },
    {
      id: 'war-2',
      title: 'Comprehensive Craftsmanship & Labor Guarantee',
      term: 'Written Workmanship Warranty',
      description: workmanshipText,
      badge: 'Workmanship Standard',
    },
    {
      id: 'war-3',
      title: 'The "No-Lemon" Replacement Guarantee',
      term: 'Major Component Protection',
      description:
        'If the compressor in your new air conditioning system or the heat exchanger in your furnace fails more than twice during the warranty period, we will replace the entire outdoor unit or furnace with a brand-new model at no charge.',
      badge: 'Zero-Lemon Promise',
    },
    {
      id: 'war-4',
      title: 'Arrival Punctuality & Respect Guarantee',
      term: 'Every Service Visit',
      description:
        `We respect your time. If our technician fails to arrive within the agreed arrival window without giving you advance notice, we automatically credit ${formatCurrency(50)} toward your service invoice. Our mechanics always wear protective shoe covers and leave your home cleaner than we found it.`,
      badge: 'Punctuality Promise',
    },
  ];

  const guaranteesToRender = gridSec?.items && gridSec.items.length > 0 ? gridSec.items : defaultGuarantees;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* 1. Hero / Header */}
      {heroSec?.enabled !== false && (
        <div className="max-w-3xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">
            {heroSec?.kicker || 'Unconditional Accountability'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-heading">
            {heroSec?.heading || 'Service Guarantees & Workmanship Warranties'}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {heroSec?.subheading ||
              'We believe high-quality heating and air conditioning begins with total accountability. Our written guarantees protect your home, equipment investment, and family comfort.'}
          </p>
        </div>
      )}

      {/* 2. Written Guarantees Grid */}
      {gridSec?.enabled !== false && (
        <div className="space-y-6">
          {gridSec?.heading && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 font-heading">{gridSec.heading}</h2>
              {gridSec.subheading && <p className="text-xs text-slate-500 mt-1">{gridSec.subheading}</p>}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {guaranteesToRender.map((g: any, i: number) => (
              <div key={g.id || i} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">{g.term || 'Protection Standard'}</span>
                    {g.badge && (
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        {g.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 font-heading">{g.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{g.description}</p>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Full written certificate issued with every completed project.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Licensing Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center max-w-4xl mx-auto space-y-4">
        <ShieldCheck className="w-12 h-12 text-blue-400 mx-auto" />
        <h2 className="text-2xl font-bold font-heading">Protected by State Licensing & Insurance</h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Fully licensed, bonded, and regulated by state mechanical licensing boards.
          Every lead technician carries EPA 608 Universal Certification, background clearance, and ongoing NATE factory credentials.
        </p>
        <div className="pt-2">
          <button
            onClick={() => openBookingModal()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
          >
            Schedule Guaranteed Service
          </button>
        </div>
      </div>
    </div>
  );
};
