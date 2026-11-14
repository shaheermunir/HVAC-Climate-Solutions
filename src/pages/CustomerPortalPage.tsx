import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Wrench,
  Calendar,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  PenTool,
  Plus,
  Trash2,
  X,
  Search,
  RefreshCw,
} from 'lucide-react';
import { Appointment, CustomerProfile, Estimate } from '../types';

export const CustomerPortalPage: React.FC = () => {
  const {
    customers,
    appointments,
    estimates,
    approveEstimate,
    rejectEstimate,
    openBookingModal,
    addCustomerEquipment,
    deleteCustomerEquipment,
    cancelPortalAppointment,
    portalLookup,
    addToast,
    settings,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'appointments' | 'equipment' | 'estimates' | 'membership'>('appointments');
  const [lookupInput, setLookupInput] = useState('');
  const [lookupMode, setLookupMode] = useState<'email' | 'reference'>('email');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [portalCustomer, setPortalCustomer] = useState<CustomerProfile | null>(null);
  const [portalAppointments, setPortalAppointments] = useState<Appointment[]>([]);
  const [portalEstimates, setPortalEstimates] = useState<Estimate[]>([]);

  const [signatureName, setSignatureName] = useState('');

  // Equipment Modal state
  const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false);
  const [eqType, setEqType] = useState('Central Air Conditioner');
  const [eqManufacturer, setEqManufacturer] = useState('Trane');
  const [eqModel, setEqModel] = useState('');
  const [eqSerial, setEqSerial] = useState('');
  const [eqFilter, setEqFilter] = useState('16x25x1');
  const [eqCondition, setEqCondition] = useState<'Optimal' | 'Fair' | 'Requires Attention' | 'Critical'>('Optimal');
  const [isAddingEq, setIsAddingEq] = useState(false);

  // Sync if staff reloads customer list
  useEffect(() => {
    if (portalCustomer && customers.length > 0) {
      const updated = customers.find((c) => c.id === portalCustomer.id);
      if (updated) setPortalCustomer(updated);
    }
  }, [customers, portalCustomer?.id]);

  const reloadActivePortalCustomer = async (email: string) => {
    const res = await portalLookup({ email });
    if (res.success && res.customer) {
      setPortalCustomer(res.customer);
      setPortalAppointments(res.appointments || []);
      setPortalEstimates(res.estimates || []);
    }
  };

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupInput.trim()) {
      setLookupError('Please enter your email address or booking reference number.');
      return;
    }
    setIsLookingUp(true);
    setLookupError(null);

    try {
      const payload =
        lookupMode === 'email'
          ? { email: lookupInput.trim() }
          : { appointmentNumber: lookupInput.trim() };
      const res = await portalLookup(payload);
      if (res.success && res.customer) {
        setPortalCustomer(res.customer);
        setPortalAppointments(res.appointments || []);
        setPortalEstimates(res.estimates || []);
        addToast('success', 'Customer Record Loaded', `Welcome back, ${res.customer.name}.`);
      } else {
        setLookupError(res.error || 'No matching customer record found.');
      }
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleApproveEstimate = async (estimateId: string) => {
    if (!signatureName.trim()) {
      addToast('error', 'Signature Required', 'Please enter your full name as an electronic signature before approving.');
      return;
    }
    await approveEstimate(estimateId, signatureName);
    setSignatureName('');
    if (portalCustomer) {
      await reloadActivePortalCustomer(portalCustomer.email);
    }
  };

  const handleRejectEstimate = async (estimateId: string) => {
    await rejectEstimate(estimateId, 'Customer declined proposal via customer portal');
    if (portalCustomer) {
      await reloadActivePortalCustomer(portalCustomer.email);
    }
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalCustomer) return;

    setIsAddingEq(true);
    const ok = await addCustomerEquipment(
      portalCustomer.id,
      {
        type: eqType,
        manufacturer: eqManufacturer,
        modelNumber: eqModel || 'N/A',
        serialNumber: eqSerial || 'N/A',
        filterSize: eqFilter,
        condition: eqCondition,
        installDate: new Date().toISOString().split('T')[0],
        lastServicedDate: new Date().toISOString().split('T')[0],
      },
      portalCustomer.email
    );
    setIsAddingEq(false);
    if (ok) {
      setIsAddEquipmentOpen(false);
      setEqModel('');
      setEqSerial('');
      await reloadActivePortalCustomer(portalCustomer.email);
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    if (!portalCustomer) return;
    const ok = await deleteCustomerEquipment(portalCustomer.id, equipmentId, portalCustomer.email);
    if (ok) {
      await reloadActivePortalCustomer(portalCustomer.email);
    }
  };

  const handleCancelAppointment = async (aptId: string) => {
    if (!portalCustomer) return;
    const ok = await cancelPortalAppointment(aptId, portalCustomer.email, 'Cancelled by customer');
    if (ok) {
      await reloadActivePortalCustomer(portalCustomer.email);
    }
  };

  const customerAppointments = portalCustomer
    ? portalAppointments.length > 0
      ? portalAppointments
      : appointments.filter(
          (a) =>
            a.customerName.toLowerCase() === portalCustomer.name.toLowerCase() ||
            a.customerEmail.toLowerCase() === portalCustomer.email.toLowerCase()
        )
    : [];

  const customerEstimates = portalCustomer
    ? portalEstimates.length > 0
      ? portalEstimates
      : estimates.filter(
          (e) =>
            e.customerName.toLowerCase() === portalCustomer.name.toLowerCase() ||
            e.customerEmail.toLowerCase() === portalCustomer.email.toLowerCase()
        )
    : [];

  if (!portalCustomer) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="space-y-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 font-heading">
              Customer Service Portal
            </h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Access your scheduled HVAC service visits, registered equipment specs, electronic estimate approvals, and Comfort Club benefits.
            </p>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setLookupMode('email');
                setLookupError(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer ${
                lookupMode === 'email' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Look Up by Email
            </button>
            <button
              type="button"
              onClick={() => {
                setLookupMode('reference');
                setLookupError(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer ${
                lookupMode === 'reference' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Look Up by Booking Ref #
            </button>
          </div>

          {lookupError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{lookupError}</span>
            </div>
          )}

          <form onSubmit={handleLookupSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {lookupMode === 'email' ? 'Customer Email Address' : 'Booking Reference Number'}
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={lookupMode === 'email' ? 'email' : 'text'}
                  required
                  value={lookupInput}
                  onChange={(e) => setLookupInput(e.target.value)}
                  placeholder={lookupMode === 'email' ? 'name@example.com' : 'APT-2001'}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLookingUp}
              className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLookingUp ? 'Searching Records...' : 'Access My Service Record'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Need to schedule a new service visit?</span>
            <button
              type="button"
              onClick={() => openBookingModal()}
              className="text-blue-700 font-bold hover:underline cursor-pointer"
            >
              Book Online →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Customer Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-700 text-white font-extrabold text-xl flex items-center justify-center font-heading">
            {portalCustomer.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 font-heading">{portalCustomer.name}</h1>
              {portalCustomer.membershipTier && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {portalCustomer.membershipTier} Member
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {portalCustomer.address}, {portalCustomer.city} · {portalCustomer.phone} · {portalCustomer.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setPortalCustomer(null);
              setPortalAppointments([]);
              setPortalEstimates([]);
              setLookupInput('');
            }}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Look Up Another Record</span>
          </button>
          <button
            type="button"
            onClick={() => openBookingModal()}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer whitespace-nowrap"
          >
            New Booking
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'appointments'
              ? 'border-blue-700 text-blue-700 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>My Appointments ({customerAppointments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('equipment')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'equipment'
              ? 'border-blue-700 text-blue-700 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>My HVAC Equipment ({portalCustomer.equipment?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('estimates')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'estimates'
              ? 'border-blue-700 text-blue-700 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Estimates & Quotes ({customerEstimates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('membership')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'membership'
              ? 'border-blue-700 text-blue-700 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Comfort Club Membership</span>
        </button>
      </div>

      {/* Tab 1: Appointments */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {customerAppointments.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <p className="text-xs text-slate-500">No scheduled appointments for this account.</p>
              <button
                onClick={() => openBookingModal()}
                className="px-4 py-2 bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Schedule First Service Visit
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customerAppointments.map((apt) => (
                <div key={apt.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                        {apt.appointmentNumber}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 font-heading">{apt.serviceName}</h3>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        apt.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : apt.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {apt.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div>
                      <strong>Date & Window: </strong>
                      {apt.date} · {apt.timeSlot}
                    </div>
                    <div>
                      <strong>Technician Assigned: </strong>
                      {apt.technicianName || 'Pending Final Dispatch'}
                    </div>
                    {apt.issueDescription && (
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                        {apt.issueDescription}
                      </div>
                    )}
                  </div>

                  {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                    <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleCancelAppointment(apt.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-rose-700 hover:bg-rose-50 font-semibold cursor-pointer"
                      >
                        Cancel Appointment
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Registered Equipment */}
      {activeTab === 'equipment' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Track installed heating & AC equipment, serial numbers, warranty status, and exact filter sizes.
            </span>
            <button
              type="button"
              onClick={() => setIsAddEquipmentOpen(true)}
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Equipment</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portalCustomer.equipment?.map((eq) => (
              <div key={eq.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                      {eq.manufacturer}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 font-heading">{eq.type}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        eq.condition === 'Optimal'
                          ? 'bg-emerald-50 text-emerald-800'
                          : eq.condition === 'Fair'
                          ? 'bg-blue-50 text-blue-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {eq.condition}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteEquipment(eq.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                      title="Remove Unit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans block">Model Number</span>
                    {eq.modelNumber}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans block">Serial Number</span>
                    {eq.serialNumber}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans block">Installed</span>
                    {eq.installDate}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans block">Filter Size Spec</span>
                    <strong className="text-slate-900">{eq.filterSize}</strong>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-[11px] text-slate-500">
                  <span>
                    Last Precision Service: <strong>{eq.lastServicedDate}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => openBookingModal('preventive-maintenance')}
                    className="text-blue-700 font-semibold hover:underline cursor-pointer"
                  >
                    Schedule Service →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {isAddEquipmentOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 font-heading">Register HVAC Equipment</h3>
                  <button type="button" onClick={() => setIsAddEquipmentOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddEquipment} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Equipment Category</label>
                    <select
                      value={eqType}
                      onChange={(e) => setEqType(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    >
                      <option value="Central Air Conditioner">Central Air Conditioner (Condenser)</option>
                      <option value="Inverter Heat Pump">Inverter Heat Pump System</option>
                      <option value="Gas Furnace">High-Efficiency Gas Furnace</option>
                      <option value="Air Handler">Air Handler & Blower Unit</option>
                      <option value="Ductless Mini-Split">Ductless Mini-Split</option>
                      <option value="Whole-Home Dehumidifier">Whole-Home Dehumidifier</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Manufacturer</label>
                      <select
                        value={eqManufacturer}
                        onChange={(e) => setEqManufacturer(e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-200"
                      >
                        <option value="Trane">Trane</option>
                        <option value="Carrier">Carrier</option>
                        <option value="Bosch">Bosch</option>
                        <option value="Mitsubishi Electric">Mitsubishi Electric</option>
                        <option value="Lennox">Lennox</option>
                        <option value="Daikin">Daikin</option>
                        <option value="Rheem">Rheem</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Filter Spec</label>
                      <input
                        type="text"
                        placeholder="e.g. 16x25x1 or 20x25x4"
                        value={eqFilter}
                        onChange={(e) => setEqFilter(e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Model # (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 4TTR4048L"
                        value={eqModel}
                        onChange={(e) => setEqModel(e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Serial # (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 21094892C"
                        value={eqSerial}
                        onChange={(e) => setEqSerial(e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddEquipmentOpen(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAddingEq}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                    >
                      {isAddingEq ? 'Saving...' : 'Save Unit to Inventory'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Estimates & Approvals */}
      {activeTab === 'estimates' && (
        <div className="space-y-4">
          {customerEstimates.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
              No outstanding estimates found.
            </div>
          ) : (
            customerEstimates.map((est) => (
              <div key={est.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      {est.estimateNumber}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 font-heading">{est.serviceCategory}</h3>
                    <p className="text-xs text-slate-500">{est.projectDescription}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900 font-mono">${est.totalAmount.toLocaleString()}</span>
                    <span
                      className={`block text-[10px] font-bold uppercase ${
                        est.status === 'accepted'
                          ? 'text-emerald-700'
                          : est.status === 'rejected'
                          ? 'text-rose-700'
                          : 'text-blue-700'
                      }`}
                    >
                      Status: {est.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  {est.lineItems.map((item) => (
                    <div key={item.id} className="flex justify-between py-1 border-b border-slate-50 text-slate-700">
                      <span>
                        {item.quantity}x {item.description}
                      </span>
                      <span className="font-mono">${item.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {est.status === 'sent' && (
                  <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 space-y-3 text-xs">
                    <span className="font-bold text-blue-900 block flex items-center gap-1.5">
                      <PenTool className="w-4 h-4 text-blue-700" />
                      <span>Electronic Approval & Authorization</span>
                    </span>
                    <p className="text-blue-800 text-[11px]">
                      By typing your legal name below and clicking "Approve & Authorize", you authorize {settings?.businessName || 'Airflow Climate Solutions'} to schedule installation and secure qualifying manufacturer rebates.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Type Full Name as E-Signature"
                        value={signatureName}
                        onChange={(e) => setSignatureName(e.target.value)}
                        className="flex-1 p-2 rounded-lg border border-blue-300 bg-white text-xs outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => handleApproveEstimate(est.id)}
                        className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Approve & Authorize
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectEstimate(est.id)}
                        className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:text-rose-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}

                {est.status === 'accepted' && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Approved by <strong>{est.customerSignatureName}</strong> on{' '}
                      {new Date(est.signedAt || '').toLocaleDateString()}. Our installation coordinator is scheduling equipment delivery.
                    </span>
                  </div>
                )}

                {est.status === 'rejected' && (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>This quote was declined ({est.customerNotes || 'Customer opted out'}). Contact dispatch if you need a revised proposal.</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Membership Club Status */}
      {activeTab === 'membership' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-heading">
                {portalCustomer.membershipTier || 'Silver Comfort Shield'}
              </h3>
              <span className="text-xs text-emerald-700 font-semibold">Active Member Status</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
            Your Comfort Club plan entitles you to 2 annual precision tune-ups, 15% off all future repairs, and VIP priority emergency response.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => openBookingModal('preventive-maintenance')}
              className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Schedule Annual Included Tune-Up
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
