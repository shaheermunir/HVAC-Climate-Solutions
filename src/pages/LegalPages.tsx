import React from 'react';
import { useApp } from '../context/AppContext';
import { Shield, FileText, Eye } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  const { settings } = useApp();
  const businessName = settings?.businessName || 'Airflow Climate Solutions';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
      <div className="space-y-2 border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Legal Compliance</span>
        <h1 className="text-3xl font-bold text-slate-900 font-heading">Privacy Policy</h1>
        <p className="text-xs text-slate-400">Last updated: November 2026</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 font-heading">1. Information We Collect</h2>
        <p>
          {businessName} collects information you provide directly to us when you request an appointment, submit an
          emergency service triage form, enroll in a maintenance plan, or contact our customer support. This information
          includes your name, email address, physical service address, phone number, and HVAC equipment specifications.
        </p>

        <h2 className="text-base font-bold text-slate-900 font-heading">2. How We Use Your Information</h2>
        <p>
          We use your information solely to deliver requested heating and cooling services, dispatch technicians to your
          service address, transmit appointment reminders via SMS and email, process estimate authorizations, and
          maintain equipment warranty service logs. We do not sell your personal data to third-party marketing brokers.
        </p>

        <h2 className="text-base font-bold text-slate-900 font-heading">3. Security & Data Retention</h2>
        <p>
          We implement industry-standard encryption protocols and administrative safeguards to protect your personal
          information. Records are retained strictly as required by state HVAC contractor licensing regulations and
          accounting compliance.
        </p>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  const { settings } = useApp();
  const businessName = settings?.businessName || 'Airflow Climate Solutions';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
      <div className="space-y-2 border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Terms of Service</span>
        <h1 className="text-3xl font-bold text-slate-900 font-heading">Terms & Conditions</h1>
        <p className="text-xs text-slate-400">Last updated: November 2026</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 font-heading">1. Service Diagnostic Agreements</h2>
        <p>
          By booking an appointment with {businessName}, you authorize our licensed technicians to perform diagnostic
          evaluations on your heating, ventilation, and air conditioning systems. Diagnostic fees are disclosed upfront
          and credited toward approved repairs.
        </p>

        <h2 className="text-base font-bold text-slate-900 font-heading">2. Estimates and Quotes</h2>
        <p>
          Written estimates are valid for 30 calendar days from the date of issue. Approved estimates constitute an
          authorization for procurement of equipment, municipal permitting, and mechanical installation.
        </p>

        <h2 className="text-base font-bold text-slate-900 font-heading">3. Licensing & State Regulations</h2>
        <p>
          Regulated by applicable state and municipal licensing boards. Fully licensed, bonded, and insured HVAC contractor.
        </p>
      </div>
    </div>
  );
};

export const AccessibilityPage: React.FC = () => {
  const { settings } = useApp();
  const phone = settings?.primaryPhone || '(800) 555-0199';
  const businessName = settings?.businessName || 'Airflow Climate Solutions';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
      <div className="space-y-2 border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Digital Inclusion</span>
        <h1 className="text-3xl font-bold text-slate-900 font-heading">Accessibility Statement</h1>
      </div>

      <div className="space-y-4">
        <p>
          {businessName} is committed to ensuring digital accessibility for all people, including visitors with
          disabilities. We continually improve the user experience and apply relevant WCAG 2.2 AA accessibility principles.
        </p>
        <p>
          Our application implements semantic HTML, clear focus outlines for keyboard navigation, high color contrast,
          and screen-reader compatible form controls. If you encounter any accessibility barrier, please call our office
          directly at {phone} for immediate telephonic assistance.
        </p>
      </div>
    </div>
  );
};

export const NotFoundPage: React.FC = () => {
  const { setCurrentRoute } = useApp();

  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6">
      <div className="text-6xl font-black text-slate-900 font-mono">404</div>
      <h1 className="text-2xl font-bold text-slate-900 font-heading">Page Not Found</h1>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
        The page you are looking for has been moved or does not exist. Use the button below to return to the homepage or search our service directory.
      </p>
      <div className="flex justify-center gap-3 pt-2">
        <button
          onClick={() => setCurrentRoute('/')}
          className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl"
        >
          Return to Home
        </button>
        <button
          onClick={() => setCurrentRoute('/services')}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl"
        >
          View Services
        </button>
      </div>
    </div>
  );
};
