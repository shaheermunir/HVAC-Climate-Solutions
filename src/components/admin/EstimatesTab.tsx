import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Eye,
  DollarSign,
  Send,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Estimate, EstimateLineItem } from '../../types';

export const EstimatesTab: React.FC = () => {
  const {
    estimates,
    createEstimate,
    updateEstimateStatus,
    deleteEstimate,
    services,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New Estimate Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Metro Area');
  const [zipCode, setZipCode] = useState('');
  const [serviceCategory, setServiceCategory] = useState('cooling');
  const [projectDescription, setProjectDescription] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [taxRate] = useState(0.0825);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [expirationDays, setExpirationDays] = useState<number>(30);

  const [lineItems, setLineItems] = useState<EstimateLineItem[]>([
    {
      id: 'li-1',
      description: 'Variable-Speed Inverter Heat Pump Condenser (18 SEER2)',
      category: 'equipment',
      quantity: 1,
      unitPrice: 5800,
      total: 5800,
    },
    {
      id: 'li-2',
      description: 'Certified Mechanical Installation, Line Set Flush & Vacuum Test',
      category: 'labor',
      quantity: 1,
      unitPrice: 1650,
      total: 1650,
    },
    {
      id: 'li-3',
      description: 'Municipal Permit, Inspection Coordination & HERS Verification',
      category: 'permit',
      quantity: 1,
      unitPrice: 350,
      total: 350,
    },
  ]);

  const addLineItem = () => {
    const newItem: EstimateLineItem = {
      id: `li-${Date.now()}`,
      description: '',
      category: 'equipment',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (index: number, updates: Partial<EstimateLineItem>) => {
    const updated = [...lineItems];
    const item = { ...updated[index], ...updates };
    item.total = Math.round(item.quantity * item.unitPrice * 100) / 100;
    updated[index] = item;
    setLineItems(updated);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedSubtotal = lineItems.reduce((acc, curr) => acc + curr.total, 0);
  const calculatedDiscount = Math.max(0, Math.min(calculatedSubtotal, Number(discountAmount) || 0));
  const calculatedTaxable = calculatedSubtotal - calculatedDiscount;
  const calculatedTax = Math.round(calculatedTaxable * taxRate * 100) / 100;
  const calculatedTotal = Math.round((calculatedTaxable + calculatedTax) * 100) / 100;

  // Filtered Estimates
  const filteredEstimates = estimates.filter((e) => {
    const matchesSearch =
      e.estimateNumber.toLowerCase().includes(search.toLowerCase()) ||
      e.customerName.toLowerCase().includes(search.toLowerCase()) ||
      e.customerPhone.includes(search) ||
      (e.customerEmail && e.customerEmail.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Metrics
  const totalPipeline = estimates.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const acceptedValue = estimates.filter((e) => e.status === 'accepted').reduce((acc, curr) => acc + curr.totalAmount, 0);
  const acceptedCount = estimates.filter((e) => e.status === 'accepted').length;
  const pendingCount = estimates.filter((e) => e.status === 'sent' || e.status === 'draft').length;
  const winRate = estimates.length > 0 ? Math.round((acceptedCount / estimates.length) * 100) : 0;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      return;
    }

    const success = await createEstimate({
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      address: address.trim(),
      city: city.trim(),
      zipCode: zipCode.trim(),
      serviceCategory,
      projectDescription: projectDescription.trim(),
      customerNotes: customerNotes.trim(),
      internalNotes: internalNotes.trim(),
      lineItems,
      discountAmount: calculatedDiscount,
      expirationDate: new Date(Date.now() + expirationDays * 86400000).toISOString().split('T')[0],
    });

    if (success) {
      setIsNewModalOpen(false);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setAddress('');
      setProjectDescription('');
      setCustomerNotes('');
      setInternalNotes('');
      setDiscountAmount(0);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">✓ Accepted</span>;
      case 'sent':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">✉ Sent to Client</span>;
      case 'draft':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Draft</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Declined</span>;
      case 'expired':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Expired</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & New Quote Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-heading">Estimates & Project Quotes</h2>
          <p className="text-xs text-slate-500 mt-0.5">Draft, dispatch, and track itemized quotes, equipment replacements, and digital approvals.</p>
        </div>
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Draft New Estimate</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Quoted Pipeline</span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1 block">
            ${totalPipeline.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{estimates.length} Total Quotes</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Accepted & Closed</span>
          <span className="text-2xl font-extrabold text-emerald-800 font-mono mt-1 block">
            ${acceptedValue.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">{acceptedCount} Closed Contracts</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">Pending Customer Review</span>
          <span className="text-2xl font-extrabold text-blue-900 font-mono mt-1 block">
            {pendingCount}
          </span>
          <span className="text-[10px] text-blue-600 mt-0.5 block">Sent or Draft Status</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Quote Win Rate</span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1 block">
            {winRate}%
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Approved vs Quoted</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
          {['all', 'draft', 'sent', 'accepted', 'rejected', 'expired'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors capitalize ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {st === 'all' ? 'All Estimates' : st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by quote # or customer..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Estimates Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Quote #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Service Category</th>
                <th className="py-3 px-4">Line Items</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEstimates.map((est) => (
                <tr key={est.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                    {est.estimateNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{est.customerName}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{est.customerPhone}</span>
                  </td>
                  <td className="py-3.5 px-4 capitalize text-slate-700">
                    {est.serviceCategory.replace('-', ' ')}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <span className="font-semibold">{est.lineItems.length} items</span>
                    <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">
                      {est.lineItems.map((li) => li.description).join(', ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-extrabold text-slate-900 text-sm block">
                      ${est.totalAmount.toLocaleString()}
                    </span>
                    {est.discountAmount > 0 && (
                      <span className="text-[10px] text-emerald-700 font-semibold block">
                        -${est.discountAmount} promo applied
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getStatusBadge(est.status)}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                    {est.expirationDate}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedEstimate(est)}
                        className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Estimate Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {est.status !== 'accepted' && (
                        <button
                          onClick={() => updateEstimateStatus(est.id, 'accepted')}
                          className="px-2 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                          title="Mark as Accepted"
                        >
                          Accept
                        </button>
                      )}

                      {est.status === 'draft' && (
                        <button
                          onClick={() => updateEstimateStatus(est.id, 'sent')}
                          className="px-2 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Mark as Sent"
                        >
                          Send
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (confirm(`Delete estimate ${est.estimateNumber}?`)) {
                            deleteEstimate(est.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Quote"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredEstimates.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No estimates found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search query or status filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: VIEW ESTIMATE DETAILS */}
      {selectedEstimate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-400 text-sm">{selectedEstimate.estimateNumber}</span>
                  {getStatusBadge(selectedEstimate.status)}
                </div>
                <h3 className="text-lg font-black tracking-tight mt-1">{selectedEstimate.customerName}</h3>
                <span className="text-xs text-slate-300 font-mono">{selectedEstimate.customerPhone} · {selectedEstimate.customerEmail}</span>
              </div>
              <button
                onClick={() => setSelectedEstimate(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Service Address</span>
                  <span className="font-semibold text-slate-800">{selectedEstimate.address || 'Standard Service Area'}, {selectedEstimate.city} {selectedEstimate.zipCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Service Category</span>
                  <span className="font-semibold text-slate-800 capitalize">{selectedEstimate.serviceCategory.replace('-', ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Expiration Date</span>
                  <span className="font-semibold text-slate-800 font-mono">{selectedEstimate.expirationDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Customer Approval</span>
                  <span className="font-semibold text-slate-800">
                    {selectedEstimate.customerSignatureName ? `E-Signed: ${selectedEstimate.customerSignatureName}` : 'Awaiting Approval'}
                  </span>
                </div>
              </div>

              {/* Line Items Breakdown */}
              <div>
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2">Itemized Equipment & Scope</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <tr>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5 text-center">Category</th>
                        <th className="p-2.5 text-right">Qty</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedEstimate.lineItems.map((li) => (
                        <tr key={li.id}>
                          <td className="p-2.5 font-medium text-slate-800">{li.description}</td>
                          <td className="p-2.5 text-center capitalize text-slate-500">{li.category}</td>
                          <td className="p-2.5 text-right font-mono">{li.quantity}</td>
                          <td className="p-2.5 text-right font-mono">${li.unitPrice.toLocaleString()}</td>
                          <td className="p-2.5 text-right font-mono font-bold">${li.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-1.5 text-xs border border-slate-200 max-w-xs ml-auto">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">${selectedEstimate.subtotal.toLocaleString()}</span>
                </div>
                {selectedEstimate.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount / Promotion:</span>
                    <span className="font-mono">-${selectedEstimate.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Sales Tax ({Math.round(selectedEstimate.taxRate * 1000) / 10}%):</span>
                  <span className="font-mono font-semibold">${selectedEstimate.taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span className="font-mono text-base text-blue-700">${selectedEstimate.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {selectedEstimate.customerNotes && (
                <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 border border-amber-200">
                  <span className="font-bold block mb-0.5">Customer Special Instructions:</span>
                  <p>{selectedEstimate.customerNotes}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedEstimate(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DRAFT NEW ESTIMATE */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight">Draft New HVAC Estimate</h3>
                <p className="text-xs text-slate-300 mt-0.5">Itemize equipment, labor, warranty permits, and apply utility discounts.</p>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
              {/* Customer Contact Details */}
              <div className="space-y-3">
                <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider block">1. Customer & Property Information</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Eleanor Vance"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(800) 555-0199"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="customer@domain.com"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="100 Enterprise Parkway"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Service Category</label>
                    <select
                      value={serviceCategory}
                      onChange={(e) => setServiceCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl capitalize"
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.category}>
                          {s.category.replace('-', ' ')}
                        </option>
                      ))}
                      <option value="cooling">Cooling</option>
                      <option value="heating">Heating</option>
                      <option value="heat-pumps">Heat Pumps</option>
                      <option value="commercial">Commercial</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dynamic Line Items */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider block">2. Itemized Equipment & Scope</span>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {lineItems.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="col-span-6">
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => updateLineItem(idx, { description: e.target.value })}
                          placeholder="Line item description..."
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={item.category}
                          onChange={(e) => updateLineItem(idx, { category: e.target.value as any })}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs capitalize"
                        >
                          <option value="equipment">Equipment</option>
                          <option value="labor">Labor</option>
                          <option value="permit">Permit</option>
                          <option value="materials">Materials</option>
                        </select>
                      </div>
                      <div className="col-span-1">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(idx, { quantity: Number(e.target.value) || 1 })}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(idx, { unitPrice: Number(e.target.value) || 0 })}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                          placeholder="$ Price"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          disabled={lineItems.length <= 1}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discounts & Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Promotional Discount ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                      placeholder="e.g. 500"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Quote Validity (Days)</label>
                    <input
                      type="number"
                      min="7"
                      max="90"
                      value={expirationDays}
                      onChange={(e) => setExpirationDays(Number(e.target.value) || 30)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Notes for Customer</label>
                    <textarea
                      rows={2}
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="Includes 10-year manufacturer warranty and first year complimentary maintenance..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                {/* Calculation Summary Box */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider block mb-2">Quote Summary</span>
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-mono font-semibold">${calculatedSubtotal.toLocaleString()}</span>
                    </div>
                    {calculatedDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Discount:</span>
                        <span className="font-mono">-${calculatedDiscount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Tax (8.25%):</span>
                      <span className="font-mono font-semibold">${calculatedTax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total Quote:</span>
                      <span className="font-mono text-blue-700 text-lg">${calculatedTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Save & Dispatch Estimate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
