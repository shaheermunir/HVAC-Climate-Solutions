import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Download,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
} from 'lucide-react';

export const BookingModal: React.FC = () => {
  const {
    services,
    serviceAreas,
    isBookingModalOpen,
    closeBookingModal,
    preselectedServiceId,
    submitAppointment,
    openEmergencyModal,
    checkZipCoverage,
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<any>(null);
  const [zipCoverageStatus, setZipCoverageStatus] = useState<any>(null);

  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string>(preselectedServiceId || 'ac-repair');
  const [isEmergency, setIsEmergency] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');

  // Date & Slot
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(tomorrow);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('08:00 AM - 10:00 AM');

  // Customer & Property
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Metro Area');
  const [zipCode, setZipCode] = useState('10001');

  const handleZipBlur = async () => {
    if (zipCode.length === 5) {
      const res = await checkZipCoverage(zipCode);
      setZipCoverageStatus(res);
      if (res.cityName && res.cityName !== 'Greater Metro Area') {
        setCity(res.cityName);
      }
    }
  };

  const isSelectedDateSunday = () => {
    if (!selectedDate) return false;
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d).getDay() === 0;
  };

  if (!isBookingModalOpen) return null;

  const timeSlots = [
    '08:00 AM - 10:00 AM (Morning Priority)',
    '10:00 AM - 12:00 PM (Late Morning)',
    '01:00 PM - 03:00 PM (Early Afternoon)',
    '03:00 PM - 05:00 PM (Late Afternoon)',
  ];

  const handleNext = () => {
    if (step === 1) {
      if (isEmergency) {
        closeBookingModal();
        openEmergencyModal();
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !address || !zipCode) {
      return;
    }

    setIsSubmitting(true);
    const serviceObj = services.find((s) => s.id === selectedServiceId);

    const res = await submitAppointment({
      customerName,
      customerEmail,
      customerPhone,
      address,
      city,
      zipCode,
      serviceId: selectedServiceId,
      serviceName: serviceObj ? serviceObj.name : 'HVAC Service',
      issueDescription,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      isEmergency,
    });

    setIsSubmitting(false);
    if (res.success && res.appointment) {
      setCreatedAppointment(res.appointment);
      setStep(4);
    }
  };

  // Generate downloadable .ics calendar invite
  const downloadCalendarInvite = () => {
    if (!createdAppointment) return;
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Airflow Climate Solutions//HVAC Booking Engine//EN
BEGIN:VEVENT
SUMMARY:Climate Service Visit: ${createdAppointment.serviceName}
DESCRIPTION:Technician appointment #${createdAppointment.appointmentNumber} with Airflow Climate Solutions. Issue: ${createdAppointment.issueDescription}
LOCATION:${createdAppointment.address}, ${createdAppointment.city} ${createdAppointment.zipCode}
DTSTART:${createdAppointment.date.replace(/-/g, '')}T140000Z
DTEND:${createdAppointment.date.replace(/-/g, '')}T160000Z
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `apex-service-${createdAppointment.appointmentNumber}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Online Scheduling Engine</span>
            <h3 className="text-lg font-bold font-heading">
              {step === 4 ? 'Booking Confirmed' : 'Schedule HVAC Service'}
            </h3>
          </div>
          <button
            onClick={closeBookingModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Step Indicator */}
        {step < 4 && (
          <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span className={step >= 1 ? 'text-blue-700 font-bold' : ''}>1. Select Service</span>
            <span>→</span>
            <span className={step >= 2 ? 'text-blue-700 font-bold' : ''}>2. Date & Window</span>
            <span>→</span>
            <span className={step >= 3 ? 'text-blue-700 font-bold' : ''}>3. Address & Details</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Select Requested Service
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {services.map((srv) => (
                    <button
                      type="button"
                      key={srv.id}
                      onClick={() => setSelectedServiceId(srv.id)}
                      className={`text-left p-3 rounded-xl border text-xs transition-all ${
                        selectedServiceId === srv.id
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-slate-900">{srv.name}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{srv.shortDescription}</div>
                      {srv.priceStartingAt && (
                        <div className="text-[10px] text-blue-700 font-semibold mt-1">
                          From ${srv.priceStartingAt}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emergency Switcher Notice */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <span className="font-bold block">Need immediate emergency assistance?</span>
                  If your cooling is completely down during extreme heat or water is flooding through ceilings, use our
                  emergency triage workflow for dispatch in under 2 hours.
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        closeBookingModal();
                        openEmergencyModal();
                      }}
                      className="font-bold underline text-amber-950 hover:text-amber-800"
                    >
                      Switch to 24/7 Emergency Triage →
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Describe the Issue (Optional)
                </label>
                <textarea
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="e.g. AC unit is blowing warm air, outdoor fan is making humming noises, or need routine spring tune-up..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden"
                  rows={2}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <span>Select Date & Window</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Select Preferred Date</span>
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Same-day routine slots may be limited. For immediate service, select our emergency triage.
                </span>
                {isSelectedDateSunday() && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block">Sunday Routine Closure:</strong>
                      Our office is closed on Sundays for routine maintenance. Please select Monday–Saturday, or switch to emergency triage if you are experiencing a cooling/heating outage.
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Select Arrival Window</span>
                </label>
                <div className="space-y-2">
                  {timeSlots.map((slot) => (
                    <label
                      key={slot}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        selectedTimeSlot === slot
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="timeSlot"
                        checked={selectedTimeSlot === slot}
                        onChange={() => setSelectedTimeSlot(slot)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>{slot}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSelectedDateSunday()}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                >
                  <span>Customer Details</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleBookingSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(800) 555-0199"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Email Address (for calendar confirmation & invoices)
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Property Service Street Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="1234 Live Oak Lane"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    City / Service Territory *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden bg-white"
                  >
                    {serviceAreas.map((area) => (
                      <option key={area.id} value={area.name}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="78701"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    onBlur={handleZipBlur}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden font-mono"
                  />
                </div>
              </div>

              {/* Live ZIP Coverage Status */}
              {zipCoverageStatus && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  zipCoverageStatus.isServiced
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}>
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{zipCoverageStatus.message}</span>
                </div>
              )}

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Confirming Appointment...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          )}

          {step === 4 && createdAppointment && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-slate-500">Booking Reference</span>
                <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                  {createdAppointment.appointmentNumber}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Service:</span>
                  <span className="font-semibold text-slate-900">{createdAppointment.serviceName}</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Date & Window:</span>
                  <span className="font-semibold text-slate-900">
                    {createdAppointment.date} ({createdAppointment.timeSlot.split(' ')[0]} - {createdAppointment.timeSlot.split(' ')[2]} {createdAppointment.timeSlot.split(' ')[3]})
                  </span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Service Address:</span>
                  <span className="font-semibold text-slate-900">
                    {createdAppointment.address}, {createdAppointment.city}
                  </span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Assigned Technician:</span>
                  <span className="font-semibold text-blue-700">{createdAppointment.technicianName}</span>
                </div>
                {createdAppointment.dispatchStatusNotice && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 font-medium">
                    {createdAppointment.dispatchStatusNotice}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={downloadCalendarInvite}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Download .ICS Calendar Event</span>
                </button>
                <button
                  type="button"
                  onClick={closeBookingModal}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
