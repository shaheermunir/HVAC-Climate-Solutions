import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SitePage, PageSection, PageSectionItem } from '../../types';
import {
  Layers,
  Save,
  RotateCcw,
  ExternalLink,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Globe,
  FileText,
  Sliders,
  Sparkles,
  Check,
  Layout,
  Tag,
  AlertCircle,
  HelpCircle,
  Phone,
  ShieldCheck,
  DollarSign,
  Award,
} from 'lucide-react';

export const PageContentStudioTab: React.FC = () => {
  const {
    sitePages,
    updateSitePage,
    resetSitePage,
    refreshData,
    addToast,
    setCurrentRoute,
  } = useApp();

  const [selectedPageId, setSelectedPageId] = useState<string>(sitePages[0]?.id || 'page-home');
  const [activePage, setActivePage] = useState<SitePage | null>(null);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Sync active page when selection or remote pages change
  useEffect(() => {
    const found = sitePages.find((p) => p.id === selectedPageId);
    if (found) {
      setActivePage(JSON.parse(JSON.stringify(found)));
    } else if (sitePages.length > 0) {
      setSelectedPageId(sitePages[0].id);
      setActivePage(JSON.parse(JSON.stringify(sitePages[0])));
    }
  }, [selectedPageId, sitePages]);

  if (!activePage) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading site page definitions...
      </div>
    );
  }

  const handleSavePage = async () => {
    setIsSaving(true);
    try {
      const ok = await updateSitePage(activePage.id, activePage);
      if (ok) {
        addToast('success', 'Page Published', `All sections and elements for "${activePage.title}" saved.`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!window.confirm(`Reset "${activePage.title}" to its factory default content and layout?`)) return;
    setIsResetting(true);
    try {
      const ok = await resetSitePage(activePage.id);
      if (ok) {
        await refreshData();
      }
    } finally {
      setIsResetting(false);
    }
  };

  const handleToggleSection = (sectionId: string) => {
    const updated = activePage.sections.map((s) =>
      s.id === sectionId ? { ...s, enabled: !s.enabled } : s
    );
    setActivePage({ ...activePage, sections: updated });
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= activePage.sections.length) return;
    const copy = [...activePage.sections];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    const reordered = copy.map((sec, i) => ({ ...sec, order: i + 1 }));
    setActivePage({ ...activePage, sections: reordered });
  };

  const handleRemoveSection = (sectionId: string) => {
    if (!window.confirm('Remove this section from the page?')) return;
    const updated = activePage.sections
      .filter((s) => s.id !== sectionId)
      .map((sec, i) => ({ ...sec, order: i + 1 }));
    setActivePage({ ...activePage, sections: updated });
  };

  const handleAddSection = (type: string) => {
    const newSec: PageSection = {
      id: `sec-${Date.now()}`,
      type,
      name: `New ${type.toUpperCase().replace('_', ' ')} Section`,
      heading: 'Custom Section Heading',
      subheading: 'Descriptive subtitle explaining this section’s core purpose and customer benefit.',
      kicker: 'Airflow Standard',
      enabled: true,
      order: activePage.sections.length + 1,
      backgroundStyle: 'default',
      buttonText: 'Learn More',
      buttonLink: '/contact',
      items:
        type === 'cards' || type === 'features'
          ? [
              {
                id: `item-${Date.now()}-1`,
                title: 'Feature Item 1',
                description: 'Detailed explanation of this specific service or engineering capability.',
                icon: 'CheckCircle2',
              },
              {
                id: `item-${Date.now()}-2`,
                title: 'Feature Item 2',
                description: 'Transparent disclosure and guaranteed standard of craftsmanship.',
                icon: 'ShieldCheck',
              },
            ]
          : undefined,
    };
    setActivePage({
      ...activePage,
      sections: [...activePage.sections, newSec],
    });
    setExpandedSectionId(newSec.id);
    addToast('info', 'Section Added', 'Configured new section at the bottom of the page.');
  };

  // Section item handlers
  const handleAddItem = (sectionIndex: number) => {
    const sec = activePage.sections[sectionIndex];
    const items = sec.items || [];
    const newItem: PageSectionItem = {
      id: `item-${Date.now()}`,
      title: 'New Highlight Item',
      description: 'Itemized description, guarantee term, or diagnostic detail.',
      icon: 'Award',
      badge: 'Certified',
    };
    const updatedSec = { ...sec, items: [...items, newItem] };
    const updatedSections = [...activePage.sections];
    updatedSections[sectionIndex] = updatedSec;
    setActivePage({ ...activePage, sections: updatedSections });
  };

  const handleRemoveItem = (sectionIndex: number, itemIndex: number) => {
    const sec = activePage.sections[sectionIndex];
    const items = (sec.items || []).filter((_, idx) => idx !== itemIndex);
    const updatedSec = { ...sec, items };
    const updatedSections = [...activePage.sections];
    updatedSections[sectionIndex] = updatedSec;
    setActivePage({ ...activePage, sections: updatedSections });
  };

  const handleUpdateItem = (sectionIndex: number, itemIndex: number, field: keyof PageSectionItem, value: any) => {
    const sec = activePage.sections[sectionIndex];
    const items = [...(sec.items || [])];
    items[itemIndex] = { ...items[itemIndex], [field]: value };
    const updatedSec = { ...sec, items };
    const updatedSections = [...activePage.sections];
    updatedSections[sectionIndex] = updatedSec;
    setActivePage({ ...activePage, sections: updatedSections });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              All Pages & Sections Content Studio
            </h2>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
              Super Admin & Business Admin
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Complete editorial control over every public page, section, heading, card, button, and value proposition across the entire website.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetToDefault}
            disabled={isResetting}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            title="Reset this page to factory default"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            Reset Page
          </button>

          <button
            onClick={() => setCurrentRoute(activePage.slug)}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Preview Live
          </button>

          <button
            onClick={handleSavePage}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Publishing...' : 'Save & Publish Page'}
          </button>
        </div>
      </div>

      {/* Main Layout: Page Selector Sidebar + Section Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Page Directory (3 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 divide-y divide-slate-100">
          <div className="p-3 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
              Website Pages ({sitePages.length})
            </span>
          </div>
          <div className="max-h-[700px] overflow-y-auto divide-y divide-slate-100">
            {sitePages.map((page) => {
              const isSelected = page.id === selectedPageId;
              return (
                <button
                  key={page.id}
                  onClick={() => {
                    setSelectedPageId(page.id);
                    setExpandedSectionId(null);
                  }}
                  className={`w-full text-left p-3.5 transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected ? 'bg-blue-50/80 border-l-4 border-l-blue-600 font-semibold' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-slate-900 block truncate">
                      {page.navLabel || page.title}
                    </span>
                    <span className="text-xs text-slate-500 font-mono block mt-0.5 truncate">
                      {page.slug}
                    </span>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5">
                      {page.sections.length} Sec
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Page Sections & Elements Editor (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Page Meta Bar */}
          <div className="bg-white border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  Editing Page
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {activePage.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1">
                  Route: {activePage.slug}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activePage.isPublished}
                    onChange={(e) => setActivePage({ ...activePage, isPublished: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Page Browser Title
                </label>
                <input
                  type="text"
                  value={activePage.title}
                  onChange={(e) => setActivePage({ ...activePage, title: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Menu Navigation Label
                </label>
                <input
                  type="text"
                  value={activePage.navLabel}
                  onChange={(e) => setActivePage({ ...activePage, navLabel: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  SEO Meta Description
                </label>
                <textarea
                  rows={2}
                  value={activePage.metaDescription}
                  onChange={(e) => setActivePage({ ...activePage, metaDescription: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section Stack Manager */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Page Sections & Layout ({activePage.sections.length})
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Add New Section:</span>
                <button
                  type="button"
                  onClick={() => handleAddSection('cards')}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
                >
                  + Cards
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSection('callout')}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
                >
                  + Callout
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSection('faq')}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
                >
                  + FAQ
                </button>
              </div>
            </div>

            {/* Render Each Section */}
            <div className="space-y-3">
              {activePage.sections.map((section, secIdx) => {
                const isExpanded = expandedSectionId === section.id;
                return (
                  <div
                    key={section.id}
                    className={`bg-white border transition-all ${
                      section.enabled ? 'border-slate-200' : 'border-slate-200 bg-slate-50/60 opacity-60'
                    }`}
                  >
                    {/* Section Header Accordion Bar */}
                    <div className="p-3.5 flex items-center justify-between gap-3 bg-white">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono font-bold text-slate-400 w-5 text-center">
                          {secIdx + 1}
                        </span>

                        <button
                          type="button"
                          onClick={() => setExpandedSectionId(isExpanded ? null : section.id)}
                          className="flex items-center gap-2 text-left cursor-pointer hover:text-blue-600 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="text-sm font-semibold text-slate-900">
                            {section.name || section.heading}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5">
                            {section.type}
                          </span>
                        </button>
                      </div>

                      {/* Section Quick Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleSection(section.id)}
                          className={`p-1.5 border text-xs cursor-pointer ${
                            section.enabled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                          title={section.enabled ? 'Disable section' : 'Enable section'}
                        >
                          {section.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          disabled={secIdx === 0}
                          onClick={() => handleMoveSection(secIdx, 'up')}
                          className="p-1.5 border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                          title="Move section up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={secIdx === activePage.sections.length - 1}
                          onClick={() => handleMoveSection(secIdx, 'down')}
                          className="p-1.5 border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                          title="Move section down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveSection(section.id)}
                          className="p-1.5 border border-slate-200 text-slate-400 hover:text-red-600 cursor-pointer"
                          title="Remove section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Section Details Editor */}
                    {isExpanded && (
                      <div className="p-5 border-t border-slate-100 bg-slate-50/40 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                              Section Administrative Name
                            </label>
                            <input
                              type="text"
                              value={section.name}
                              onChange={(e) => {
                                const copy = [...activePage.sections];
                                copy[secIdx].name = e.target.value;
                                setActivePage({ ...activePage, sections: copy });
                              }}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                              Kicker / Eyebrow Tag
                            </label>
                            <input
                              type="text"
                              value={section.kicker || ''}
                              placeholder="e.g. Our Guarantee, Certified Team"
                              onChange={(e) => {
                                const copy = [...activePage.sections];
                                copy[secIdx].kicker = e.target.value;
                                setActivePage({ ...activePage, sections: copy });
                              }}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                              Primary Section Heading
                            </label>
                            <input
                              type="text"
                              value={section.heading}
                              onChange={(e) => {
                                const copy = [...activePage.sections];
                                copy[secIdx].heading = e.target.value;
                                setActivePage({ ...activePage, sections: copy });
                              }}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                              Subheading / Descriptive Copy
                            </label>
                            <textarea
                              rows={2}
                              value={section.subheading || ''}
                              onChange={(e) => {
                                const copy = [...activePage.sections];
                                copy[secIdx].subheading = e.target.value;
                                setActivePage({ ...activePage, sections: copy });
                              }}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          {/* CTA Buttons */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                              Primary Button Text
                            </label>
                            <input
                              type="text"
                              value={section.buttonText || ''}
                              placeholder="e.g. Book Service Online"
                              onChange={(e) => {
                                const copy = [...activePage.sections];
                                copy[secIdx].buttonText = e.target.value;
                                setActivePage({ ...activePage, sections: copy });
                              }}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                              Primary Button Action / Trigger
                            </label>
                            <select
                              value={section.buttonAction || section.buttonLink || ''}
                              onChange={(e) => {
                                const copy = [...activePage.sections];
                                const val = e.target.value;
                                if (val.startsWith('open_')) {
                                  copy[secIdx].buttonAction = val;
                                  copy[secIdx].buttonLink = undefined;
                                } else {
                                  copy[secIdx].buttonLink = val;
                                  copy[secIdx].buttonAction = undefined;
                                }
                                setActivePage({ ...activePage, sections: copy });
                              }}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none"
                            >
                              <option value="">None / Hide Button</option>
                              <option value="open_booking">Open Booking Modal</option>
                              <option value="open_emergency">Open Emergency Triage Modal</option>
                              <option value="open_estimate">Open Sizing & Estimate Modal</option>
                              <option value="open_maintenance">Open Maintenance Club Modal</option>
                              <option value="open_commercial">Open Commercial RFP Modal</option>
                              <option value="/services">Navigate to /services</option>
                              <option value="/emergency">Navigate to /emergency</option>
                              <option value="/financing">Navigate to /financing</option>
                              <option value="/memberships">Navigate to /memberships</option>
                              <option value="/calculator">Navigate to /calculator</option>
                              <option value="/contact">Navigate to /contact</option>
                            </select>
                          </div>
                        </div>

                        {/* Section Items Manager (for cards, steps, criteria, FAQs, guarantees) */}
                        {section.items && (
                          <div className="pt-4 border-t border-slate-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Section Highlight Items / Cards ({section.items.length})
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddItem(secIdx)}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add Item
                              </button>
                            </div>

                            <div className="space-y-2.5">
                              {section.items.map((item, itemIdx) => (
                                <div
                                  key={item.id}
                                  className="p-3 bg-white border border-slate-200 space-y-2"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <input
                                      type="text"
                                      value={item.title}
                                      onChange={(e) =>
                                        handleUpdateItem(secIdx, itemIdx, 'title', e.target.value)
                                      }
                                      placeholder="Item Title"
                                      className="px-2 py-1 border border-slate-200 text-xs font-semibold text-slate-900 flex-1"
                                    />
                                    <input
                                      type="text"
                                      value={item.badge || ''}
                                      onChange={(e) =>
                                        handleUpdateItem(secIdx, itemIdx, 'badge', e.target.value)
                                      }
                                      placeholder="Badge (optional)"
                                      className="px-2 py-1 border border-slate-200 text-xs text-slate-600 w-28"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveItem(secIdx, itemIdx)}
                                      className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                                      title="Delete item"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <textarea
                                    rows={2}
                                    value={item.description}
                                    onChange={(e) =>
                                      handleUpdateItem(secIdx, itemIdx, 'description', e.target.value)
                                    }
                                    placeholder="Item description or answer text..."
                                    className="w-full px-2 py-1 border border-slate-200 text-xs text-slate-700"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
