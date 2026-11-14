import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronDown, Search, HelpCircle, Phone, Calendar } from 'lucide-react';

export const FaqPage: React.FC = () => {
  const { openBookingModal, settings, getPage } = useApp();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const phone = settings?.primaryPhone || '(800) 555-0199';
  const faqPageData = getPage('faq') || getPage('/faq');

  const heroSec = faqPageData?.sections?.find((s) => s.type === 'hero' || s.id === 'sec-faq-hero');
  const listSec = faqPageData?.sections?.find((s) => s.type === 'faq' || s.id === 'sec-faq-list');

  const defaultFaqs = [
    {
      id: 'faq-1',
      title: 'How much does a routine AC diagnostic cost?',
      description: 'Our standard diagnostic fee is $89. During this visit, a NATE-certified master technician performs a 21-point electrical, airflow, and mechanical evaluation. Crucially: when you approve any recommended repair, 100% of the $89 fee is credited toward the repair cost.',
      badge: 'General & Pricing',
    },
    {
      id: 'faq-2',
      title: 'Do you charge extra for evening or weekend emergency calls?',
      description: 'For Comfort Club members, there are zero overtime surcharges 365 days a year. For non-members, we charge a flat upfront $149 emergency dispatch fee disclosed before our rolling warehouse departs—with no hidden hourly surprises.',
      badge: 'General & Pricing',
    },
    {
      id: 'faq-3',
      title: 'Why is water dripping from my ceiling or indoor AC closet?',
      description: 'This indicates a clogged primary condensate drain line (usually algae/bacteria sludge build-up) or a cracked drain pan. If water is backing up, turn off the AC immediately to prevent drywall damage and electrical short-circuits. Our technicians use high-pressure nitrogen to clear the line and treat the pan with long-lasting biocides.',
      badge: 'Repairs & Technical',
    },
    {
      id: 'faq-4',
      title: 'How often should I change my HVAC air filter?',
      description: 'Standard 1-inch pleated filters should be inspected monthly and replaced every 30 to 60 days, especially during hot summer months and heavy pollen seasons. High-efficiency 4-inch to 5-inch media filters only need replacement every 6 to 12 months.',
      badge: 'Repairs & Technical',
    },
    {
      id: 'faq-5',
      title: 'What is the lifespan of a modern air conditioning and heating system?',
      description: 'Due to peak cooling seasons and steady summer runtime, the average lifespan of a central AC is 10 to 14 years. Well-maintained systems enrolled in annual preventive maintenance regularly reach 15 to 18 years.',
      badge: 'Equipment & Installation',
    },
    {
      id: 'faq-6',
      title: 'Can I qualify for clean energy tax credits and utility rebates?',
      description: 'Yes. Under federal energy efficiency guidelines, qualifying high-efficiency heat pumps (16+ SEER2) can earn up to a $2,000 tax credit. Additionally, local utility providers frequently provide tiered instant equipment rebates.',
      badge: 'Equipment & Installation',
    },
  ];

  const faqsToRender = listSec?.items && listSec.items.length > 0 ? listSec.items : defaultFaqs;

  const filtered = faqsToRender.filter(
    (f) =>
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase()) ||
      (f.badge && f.badge.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* 1. Header / Hero */}
      {heroSec?.enabled !== false && (
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">
            {heroSec?.kicker || 'Knowledge & Transparency'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-heading">
            {heroSec?.heading || 'Frequently Asked Questions'}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {heroSec?.subheading ||
              'Clear, straightforward answers to common questions about HVAC repairs, equipment warranties, and emergency policies.'}
          </p>

          {/* Search */}
          <div className="pt-2">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions or keywords..."
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Questions List */}
      {listSec?.enabled !== false && (
        <div className="space-y-3">
          {filtered.map((faq, idx) => (
            <div key={faq.id || idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <button
                onClick={() => setActiveIdx(activeIdx === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-900 hover:text-blue-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 pr-4">
                  {faq.badge && (
                    <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded shrink-0">
                      {faq.badge}
                    </span>
                  )}
                  <span>{faq.title}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                    activeIdx === idx ? 'rotate-180 text-blue-600' : ''
                  }`}
                />
              </button>
              {activeIdx === idx && (
                <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  {faq.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 3. Still have questions? */}
      <div className="p-8 bg-slate-900 text-white rounded-3xl text-center space-y-3">
        <h3 className="text-lg font-bold font-heading">Have a Specific Question?</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Our local team is standing by to answer your technical questions or dispatch a master technician.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => openBookingModal()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Schedule Service
          </button>
          <a
            href={`tel:${phone.replace(/\D/g, '')}`}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700"
          >
            Call {phone}
          </a>
        </div>
      </div>
    </div>
  );
};
