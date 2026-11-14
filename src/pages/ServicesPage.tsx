import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ThermometerSnowflake,
  Flame,
  Wind,
  Layers,
  Building,
  Sliders,
  Wrench,
  Search,
  CheckCircle2,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { ServiceCategoryKey } from '../types';
import { ServiceCard } from '../components/ServiceCard';

export const ServicesPage: React.FC = () => {
  const { services, setCurrentRoute, openBookingModal, settings, getPage, getPageSection } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const servicesPage = getPage('services') || getPage('/services');
  const heroSec = getPageSection('/services', 'hero') || servicesPage?.sections[0];

  const warrantyText = settings?.workmanshipWarranty?.split('+')[0]?.trim() || settings?.workmanshipWarranty || 'Comprehensive Craftsmanship Guarantee';

  const categories = [
    { key: 'all', label: 'All Services', icon: Wrench },
    { key: 'cooling', label: 'Air Conditioning', icon: ThermometerSnowflake },
    { key: 'heating', label: 'Heating & Heat Pumps', icon: Flame },
    { key: 'iaq', label: 'Indoor Air Quality', icon: Wind },
    { key: 'ducts', label: 'Ductwork Services', icon: Layers },
    { key: 'controls', label: 'Smart Thermostats', icon: Sliders },
    { key: 'commercial', label: 'Commercial HVAC', icon: Building },
  ];

  const filteredServices = services.filter((srv) => {
    if (!srv.isPublished) return false;
    const matchesCategory = selectedCategory === 'all' || srv.category === selectedCategory;
    const matchesSearch =
      srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (srv.problemsAddressed || []).some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">
          {heroSec?.kicker || 'Service Catalog'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-heading">
          {heroSec?.heading || 'Certified HVAC Services & Engineering'}
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
          {heroSec?.subheading || `Explore our complete range of residential and commercial climate services. Every service is backed by certified technicians, transparent upfront pricing, and our ${warrantyText}.`}
        </p>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        {/* Interactive Segmented Filter Control */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 rounded-xl">
          {categories.map((c) => {
            const Icon = c.icon;
            const isActive = selectedCategory === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setSelectedCategory(c.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  isActive ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symptoms or services..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden bg-white"
          />
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <p className="text-sm font-semibold text-slate-700">No services match your search or filter.</p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="text-xs text-blue-700 hover:underline font-bold"
          >
            Clear Filters & View All Services
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((srv) => (
            <ServiceCard key={srv.id} service={srv} />
          ))}
        </div>
      )}
    </div>
  );
};
