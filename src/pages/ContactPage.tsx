import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Send, CheckCircle2 } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { settings, submitLead, getPage } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [service, setService] = useState('General Enquiry');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const businessPhone = settings?.primaryPhone || '(800) 555-0199';
  const emergencyPhone = settings?.emergencyPhone || '(800) 555-0911';
  const address = settings?.physicalAddress || '100 Enterprise Parkway, Suite 400, Metro Area, State 10001';
  const emailAddr = settings?.businessEmail || 'service@airflowclimate.com';
  const hours = settings?.businessHours || 'Mon - Sat: 7:00 AM - 8:00 PM | Sun: 8:00 AM - 6:00 PM';

  const contactPageData = getPage('contact') || getPage('/contact');
  const heroSec = contactPageData?.sections?.find((s) => s.type === 'hero' || s.id === 'sec-contact-hero');
  const channelsSec = contactPageData?.sections?.find((s) => s.type === 'cards' || s.id === 'sec-contact-channels');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setIsSubmitting(true);
    await submitLead({
      customerName: name,
      phone,
      email,
      serviceRequested: service,
      source: 'website_form',
      urgency: 'normal',
      propertyType: 'residential',
      notes: message,
    });
    setIsSubmitting(false);
    setSent(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* 1. Header / Hero */}
      {heroSec?.enabled !== false && (
        <div className="max-w-3xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">
            {heroSec?.kicker || 'Get in Touch'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-heading">
            {heroSec?.heading || `Contact ${settings?.businessName || 'Airflow Climate Solutions'}`}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {heroSec?.subheading ||
              'Whether you need a routine seasonal tune-up, an engineering quote for equipment replacement, or immediate emergency service, we are here to help.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Contact Info (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-8 rounded-3xl space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-lg font-bold font-heading">
              {channelsSec?.heading || 'Central Office & Dispatch'}
            </h3>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white">Physical Location:</strong>
                  <span>{address}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white">Standard Service Line:</strong>
                  <a href={`tel:${businessPhone.replace(/\D/g, '')}`} className="hover:text-blue-300">
                    {businessPhone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 text-amber-300">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-amber-200">24/7 Emergency Dispatch:</strong>
                  <a href={`tel:${emergencyPhone.replace(/\D/g, '')}`} className="font-bold hover:underline">
                    {emergencyPhone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white">Customer Support Email:</strong>
                  <a href={`mailto:${emailAddr}`} className="hover:text-blue-300">
                    {emailAddr}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs text-slate-400 space-y-1">
            <span className="font-bold text-slate-200 block">Operating Hours:</span>
            <span>{hours}</span>
            <span className="block text-[11px] text-emerald-400 font-semibold pt-1">
              On-Call Emergency Technicians Available 24/7/365
            </span>
          </div>
        </div>

        {/* Contact Form (7 cols) */}
        <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 font-heading mb-2">Send Us an Enquiry</h3>
          <p className="text-xs text-slate-500 mb-6">
            Fill out the form below and an HVAC specialist will respond within 1 business hour.
          </p>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="(800) 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Service Needed</label>
                  <select
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden bg-white"
                  >
                    <option value="General Enquiry">General Enquiry</option>
                    <option value="AC Repair Request">AC Repair Request</option>
                    <option value="System Replacement Quote">System Replacement Quote</option>
                    <option value="Commercial HVAC RFP">Commercial HVAC RFP</option>
                    <option value="Maintenance Club Question">Maintenance Club Question</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Your Message</label>
                <textarea
                  rows={4}
                  placeholder="How can our technical team assist your home or facility?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Sending Message...' : 'Submit Message'}</span>
              </button>
            </form>
          ) : (
            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Message Received!</span>
              </div>
              <p>
                Thank you, <strong>{name}</strong>. A certified climate specialist will review your request and contact you at {phone} promptly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
