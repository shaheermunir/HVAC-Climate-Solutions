import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Tag, Copy, Check, Calendar, ArrowRight } from 'lucide-react';

export const PromotionsPage: React.FC = () => {
  const { promotions, openBookingModal } = useApp();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">
          Seasonal Savings & Rebates
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-heading">
          Current HVAC Promotions & Special Offers
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Save on precision tune-ups, equipment replacements, and smart home controls. Mention the promo code when
          scheduling online or calling our dispatch team.
        </p>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map((promo) => (
          <div
            key={promo.id}
            className="bg-white rounded-2xl border-2 border-dashed border-blue-200 p-6 flex flex-col justify-between shadow-2xs hover:border-blue-400 transition-colors"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                  Limited Time Offer
                </span>
                <span className="text-xs font-semibold text-slate-400 font-mono">
                  Exp: {promo.validUntil}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 font-heading leading-snug">
                {promo.title}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">{promo.description}</p>

              {/* Coupon Code Block */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Coupon Code</span>
                  <span className="text-sm font-black font-mono text-slate-900">{promo.code}</span>
                </div>
                <button
                  onClick={() => handleCopy(promo.code)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1 transition-colors"
                >
                  {copiedCode === promo.code ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-400 italic">{promo.terms}</p>
            </div>

            <div className="pt-6 border-t border-slate-100 mt-4">
              <button
                onClick={() => openBookingModal()}
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Claim This Offer Online</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
