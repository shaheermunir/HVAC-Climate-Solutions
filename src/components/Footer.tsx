import React from 'react';
import { useApp } from '../context/AppContext';
import { Phone, Mail, MapPin, Shield, Clock } from 'lucide-react';

export const Footer: React.FC = () => {
  const { settings, services, serviceAreas, setCurrentRoute, navigationConfig, marketSettings, setIsSaasPricingModalOpen, themeConfig } = useApp();

  const businessName = settings?.businessName || 'Airflow Climate Solutions';
  const phone = settings?.primaryPhone || '(800) 555-0199';
  const emergencyPhone = settings?.emergencyPhone || '(800) 555-0911';
  const address = settings?.physicalAddress || '100 Enterprise Parkway, Suite 400';
  const email = settings?.businessEmail || 'service@airflowclimate.com';
  const license = navigationConfig?.footer?.licenseText || settings?.licenseNumber || 'Licensed Master Mechanical Contractor · EPA 608 Universal Certified';
  const aboutText = navigationConfig?.footer?.aboutText || `Engineered residential and commercial heating, ventilation, and air conditioning across ${marketSettings?.primaryCity || 'Metro Area'} and ${marketSettings?.regionOrState || 'Regional Territory'}. Committed to transparent upfront pricing, certified craftsmanship, and 24/7 emergency climate protection.`;
  const copyrightText = navigationConfig?.footer?.copyrightText || `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`;
  const logoUrl = themeConfig?.logoUrl || settings?.logo;
  const brandInitial = (settings?.businessName || 'Airflow').charAt(0).toUpperCase();

  const navigateTo = (route: string) => {
    setCurrentRoute(route);
  };

  return (
    <footer
      className="text-slate-300 pt-16 pb-12 border-t border-slate-800 transition-colors"
      style={{ backgroundColor: themeConfig?.footerBg || '#020617' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800 text-sm">
          {/* Col 1: Brand & Credentials */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={businessName}
                  className="h-8 w-auto object-contain rounded-md shadow-xs"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm transition-all"
                  style={{
                    backgroundColor: themeConfig?.primaryColor || 'var(--color-primary)',
                    borderRadius: 'var(--radius-btn)',
                  }}
                >
                  {brandInitial}
                </div>
              )}
              <span className="text-xl font-bold tracking-tight text-white font-heading">{businessName}</span>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              {aboutText}
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{address}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Standard Office: {phone}</span>
              </div>
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>24/7 Emergency Line: {emergencyPhone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{email}</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>{license}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Services Directory */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white uppercase tracking-wider text-xs">Primary Services</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              {services.slice(0, 7).map((srv) => (
                <li key={srv.id}>
                  <button
                    onClick={() => navigateTo(`/services/${srv.slug}`)}
                    className="hover:text-white transition-colors text-left"
                  >
                    {srv.name}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => navigateTo('/services')}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  View All Services →
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Service Areas */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white uppercase tracking-wider text-xs">Service Coverage</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              {serviceAreas.map((area) => (
                <li key={area.id}>
                  <button
                    onClick={() => navigateTo(`/service-areas/${area.slug}`)}
                    className="hover:text-white transition-colors text-left"
                  >
                    {area.name}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => navigateTo('/service-areas')}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  ZIP Code Directory →
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Customer Programs & Tools */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white uppercase tracking-wider text-xs">Programs & Tools</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => navigateTo('/memberships')} className="hover:text-white transition-colors">
                  Comfort Club Maintenance
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('/financing')} className="hover:text-white transition-colors">
                  0% APR Financing Plans
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('/calculator')} className="hover:text-white transition-colors">
                  HVAC Sizing Calculator
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('/warranties')} className="hover:text-white transition-colors">
                  {settings?.satisfactionGuarantee?.split(':')[0]?.trim() || 'Service Guarantees & Warranties'}
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('/reviews')} className="hover:text-white transition-colors">
                  Verified Customer Reviews
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('/portfolio')} className="hover:text-white transition-colors">
                  Case Studies & Projects
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('/promotions')} className="hover:text-white transition-colors">
                  Seasonal Rebates & Coupons
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('/faq')} className="hover:text-white transition-colors">
                  Frequently Asked Questions
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Legal, XML Sitemap */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {businessName}. All rights reserved. Licensed Master HVAC Contractor.</p>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <button onClick={() => navigateTo('/privacy-policy')} className="hover:text-slate-300">Privacy Policy</button>
            <span>·</span>
            <button onClick={() => navigateTo('/terms')} className="hover:text-slate-300">Terms of Service</button>
            <span>·</span>
            <button onClick={() => navigateTo('/accessibility')} className="hover:text-slate-300">Accessibility Statement</button>
            <span>·</span>
            <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="hover:text-slate-300">XML Sitemap</a>
            <span>·</span>
            <a href="/robots.txt" target="_blank" rel="noreferrer" className="hover:text-slate-300">Robots.txt</a>
            <span>·</span>
            <button
              onClick={() => setIsSaasPricingModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
            >
              HVAC SaaS Platform (Rental / Buyout)
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
