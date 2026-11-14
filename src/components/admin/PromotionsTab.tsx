import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sliders,
  Plus,
  Tag,
  Copy,
  Check,
  Edit,
  Trash2,
  Calendar,
  Percent,
  DollarSign,
  X,
  Send,
} from 'lucide-react';
import { Promotion } from '../../types';

export const PromotionsTab: React.FC = () => {
  const { promotions, savePromotion, deletePromotion } = useApp();

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountAmount, setDiscountAmount] = useState<number>(60);
  const [validUntil, setValidUntil] = useState('2026-12-31');
  const [description, setDescription] = useState('');
  const [terms, setTerms] = useState('Valid for residential systems. Cannot be combined with other offers.');
  const [active, setActive] = useState(true);

  const copyCode = (c: string) => {
    navigator.clipboard?.writeText(c);
    setCopiedCode(c);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const openNewModal = () => {
    setEditingPromo(null);
    setTitle('$89 Comprehensive AC Precision Tune-Up');
    setCode('COOL89');
    setDiscountType('fixed');
    setDiscountAmount(60);
    setValidUntil('2026-12-31');
    setDescription('Includes 21-point chemical coil wash, electrical torque testing, and refrigerant calibration.');
    setTerms('Valid for residential single-family systems. Cannot be combined with other offers.');
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (promo: Promotion) => {
    setEditingPromo(promo);
    setTitle(promo.title);
    setCode(promo.code);
    setDiscountType(promo.discountType || 'fixed');
    setDiscountAmount(promo.discountAmount);
    setValidUntil(promo.validUntil || '2026-12-31');
    setDescription(promo.description);
    setTerms(promo.terms || '');
    setActive(promo.active);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) return;

    const payload: Partial<Promotion> = {
      ...(editingPromo ? { id: editingPromo.id } : {}),
      title: title.trim(),
      code: code.trim().toUpperCase(),
      discountType,
      discountAmount: Number(discountAmount) || 0,
      validUntil: validUntil.trim(),
      description: description.trim(),
      terms: terms.trim(),
      active,
      eligibleServices: editingPromo?.eligibleServices || ['preventive-maintenance'],
    };

    const success = await savePromotion(payload);
    if (success) {
      setIsModalOpen(false);
    }
  };

  const totalPromos = promotions.length;
  const activeCount = promotions.filter((p) => p.active).length;
  const totalValue = promotions.reduce((acc, curr) => acc + (curr.discountAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-heading">Promotions, Coupons & Utility Rebates</h2>
          <p className="text-xs text-slate-500 mt-0.5">Configure customer discount codes, seasonal specials, and clean energy rebate highlights.</p>
        </div>
        <button
          onClick={openNewModal}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Promotion</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Specials</span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1 block">{totalPromos}</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Configured promotional offers</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Active Online</span>
          <span className="text-2xl font-extrabold text-emerald-800 font-mono mt-1 block">{activeCount}</span>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Live on homepage & booking form</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">Cumulative Max Savings</span>
          <span className="text-2xl font-extrabold text-blue-900 font-mono mt-1 block">${totalValue.toLocaleString()}</span>
          <span className="text-[10px] text-blue-600 mt-0.5 block">Sum of active incentives</span>
        </div>
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {promotions.map((promo) => (
          <div
            key={promo.id}
            className={`bg-white rounded-2xl border p-5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all ${
              promo.active ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {promo.discountType === 'percent' ? `${promo.discountAmount}% OFF` : `$${promo.discountAmount} OFF`}
                </span>

                <button
                  type="button"
                  onClick={() => savePromotion({ id: promo.id, active: !promo.active })}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                    promo.active
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                  title="Click to toggle active status"
                >
                  {promo.active ? 'Active' : 'Paused'}
                </button>
              </div>

              <h3 className="text-base font-bold text-slate-900 font-heading leading-snug">
                {promo.title}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                {promo.description}
              </p>

              {promo.terms && (
                <p className="text-[10px] text-slate-400 italic">
                  *{promo.terms}
                </p>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => copyCode(promo.code)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg font-mono font-bold text-xs text-slate-800 flex items-center gap-1.5 transition-colors"
                  title="Copy Coupon Code"
                >
                  <Tag className="w-3 h-3 text-blue-600" />
                  <span>{promo.code}</span>
                  {copiedCode === promo.code ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400" />
                  )}
                </button>
                <span className="text-[10px] text-slate-400 font-mono">
                  {promo.validUntil ? `Exp: ${promo.validUntil}` : 'No expiry'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(promo)}
                  className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit Special"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete promotion "${promo.title}"?`)) {
                      deletePromotion(promo.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Special"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {promotions.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <Sliders className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">No promotions configured</p>
            <p className="text-xs text-slate-400 mt-0.5">Click "Add New Promotion" to post limited-time discounts.</p>
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT PROMOTION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight">
                  {editingPromo ? 'Edit Promotion' : 'Add Seasonal Special'}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">Discounts appear on the homepage, booking form, and calculator.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Promotion Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. $89 Precision AC Tune-Up Special"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Coupon Promo Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. COOL89"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount Amount ($) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Valid Until Date</label>
                <input
                  type="text"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  placeholder="e.g. 2026-12-31 or Limited Time"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Public Description</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Includes 21-point chemical coil wash, electrical torque testing, and refrigerant calibration..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Terms & Conditions</label>
                <input
                  type="text"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Valid for residential single-family systems only. Cannot be combined."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="promoActiveCheck"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
                <label htmlFor="promoActiveCheck" className="font-semibold text-slate-800">
                  Offer is currently active and selectable by visitors
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs"
                >
                  {editingPromo ? 'Save Changes' : 'Create Special'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
