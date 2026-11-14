import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Layers,
  Edit3,
  Settings,
  X,
  Save,
  Eye,
  EyeOff,
  ChevronRight,
  Crown,
} from 'lucide-react';
import { SitePage } from '../types';
import { ROLE_LABELS, getDashboardRouteForRole, normalizeStaffRole } from '../shared/rbac';

export const LiveEditorToolbar: React.FC = () => {
  const {
    adminUser,
    hasUserPermission,
    currentRoute,
    setCurrentRoute,
    sitePages,
    updateSitePage,
    addToast,
    isPageEditorOpen,
    setIsPageEditorOpen,
  } = useApp();

  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Only show CMS toolbar to authenticated staff members with content management permission
  const canEditContent = Boolean(adminUser && hasUserPermission('manage_content'));

  // Do not render floating toolbar inside any dedicated /admin dashboard view
  if (!canEditContent || currentRoute === '/admin' || currentRoute.startsWith('/admin/')) {
    return null;
  }

  const normalizedRole = normalizeStaffRole(adminUser?.role);
  const roleLabel = normalizedRole !== 'customer' ? ROLE_LABELS[normalizedRole] : 'Staff';
  const dashboardRoute = getDashboardRouteForRole(adminUser?.role);

  // Find the SitePage corresponding to the current route
  const currentPage =
    sitePages.find((p) => p.slug === currentRoute || (currentRoute === '' && p.slug === '/')) ||
    sitePages[0];

  const handleSave = async (updatedPage: SitePage) => {
    setIsSaving(true);
    try {
      const ok = await updateSitePage(updatedPage.id, updatedPage);
      if (ok) {
        addToast('success', 'Page Published', `Live changes saved to "${updatedPage.title}"`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Floating Bottom-Right Toolbar Bar */}
      <div className="fixed bottom-20 lg:bottom-4 right-4 z-40 bg-slate-900 text-white border border-slate-700 shadow-2xl p-1.5 flex items-center gap-2 max-w-[calc(100vw-2rem)]">
        <div className="flex items-center gap-2 pl-2 pr-1">
          <Crown className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-200 hidden sm:inline">
            CMS Studio
          </span>
          <span className="text-[11px] font-mono text-amber-300 uppercase px-1.5 py-0.5 bg-slate-800 border border-slate-700 whitespace-nowrap">
            {adminUser?.name} · {roleLabel}
          </span>
        </div>

        <div className="h-4 w-px bg-slate-700" />

        <button
          onClick={() => setIsPageEditorOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit This Page</span>
        </button>

        <button
          onClick={() => setCurrentRoute(dashboardRoute)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
          title="Open Authorized Dashboard"
        >
          <Settings className="w-3.5 h-3.5" />
          <span className="hidden md:inline">My Dashboard</span>
        </button>
      </div>

      {/* Slide-Over Drawer for In-Page Editing */}
      {isPageEditorOpen && currentPage && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsPageEditorOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 overflow-hidden">
            {/* Drawer Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Live Page Editor: {currentPage.navLabel || currentPage.title}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    Route: {currentPage.slug}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSave(currentPage)}
                  disabled={isSaving}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? 'Saving...' : 'Apply Live'}
                </button>
                <button
                  onClick={() => setIsPageEditorOpen(false)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body (Scrollable Sections) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Page Title & Meta */}
              <div className="p-4 bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Page SEO & Navigation
                </h4>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Browser Title
                  </label>
                  <input
                    type="text"
                    value={currentPage.title}
                    onChange={(e) => {
                      const updated = { ...currentPage, title: e.target.value };
                      updateSitePage(currentPage.id, updated);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Meta Description
                  </label>
                  <textarea
                    rows={2}
                    value={currentPage.metaDescription}
                    onChange={(e) => {
                      const updated = { ...currentPage, metaDescription: e.target.value };
                      updateSitePage(currentPage.id, updated);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs text-slate-700"
                  />
                </div>
              </div>

              {/* Sections List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Page Sections ({currentPage.sections.length})
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Edits apply immediately
                  </span>
                </div>

                {currentPage.sections.map((sec, secIdx) => {
                  const isExpanded = expandedSectionId === sec.id;
                  return (
                    <div
                      key={sec.id}
                      className={`border transition-all ${
                        sec.enabled ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'
                      }`}
                    >
                      <div className="p-3 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedSectionId(isExpanded ? null : sec.id)}
                          className="flex items-center gap-2 text-left cursor-pointer flex-1 min-w-0"
                        >
                          <ChevronRight
                            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                              isExpanded ? 'rotate-90 text-blue-600' : ''
                            }`}
                          />
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {sec.name || sec.heading}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const updatedSecs = currentPage.sections.map((s) =>
                              s.id === sec.id ? { ...s, enabled: !s.enabled } : s
                            );
                            updateSitePage(currentPage.id, { sections: updatedSecs });
                          }}
                          className={`p-1 text-xs border cursor-pointer ${
                            sec.enabled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                          title={sec.enabled ? 'Disable section' : 'Enable section'}
                        >
                          {sec.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Expanded Section Editor */}
                      {isExpanded && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                              Heading
                            </label>
                            <input
                              type="text"
                              value={sec.heading}
                              onChange={(e) => {
                                const copy = [...currentPage.sections];
                                copy[secIdx].heading = e.target.value;
                                updateSitePage(currentPage.id, { sections: copy });
                              }}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-semibold text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                              Subheading / Explanation
                            </label>
                            <textarea
                              rows={2}
                              value={sec.subheading || ''}
                              onChange={(e) => {
                                const copy = [...currentPage.sections];
                                copy[secIdx].subheading = e.target.value;
                                updateSitePage(currentPage.id, { sections: copy });
                              }}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs text-slate-700"
                            />
                          </div>

                          {/* CTA Button */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                                Button Text
                              </label>
                              <input
                                type="text"
                                value={sec.buttonText || ''}
                                placeholder="e.g. Book Service"
                                onChange={(e) => {
                                  const copy = [...currentPage.sections];
                                  copy[secIdx].buttonText = e.target.value;
                                  updateSitePage(currentPage.id, { sections: copy });
                                }}
                                className="w-full px-2 py-1 bg-white border border-slate-200 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                                Action
                              </label>
                              <select
                                value={sec.buttonAction || sec.buttonLink || ''}
                                onChange={(e) => {
                                  const copy = [...currentPage.sections];
                                  const val = e.target.value;
                                  if (val.startsWith('open_')) {
                                    copy[secIdx].buttonAction = val;
                                    copy[secIdx].buttonLink = undefined;
                                  } else {
                                    copy[secIdx].buttonLink = val;
                                    copy[secIdx].buttonAction = undefined;
                                  }
                                  updateSitePage(currentPage.id, { sections: copy });
                                }}
                                className="w-full px-2 py-1 bg-white border border-slate-200 text-xs"
                              >
                                <option value="">None</option>
                                <option value="open_booking">Open Booking</option>
                                <option value="open_emergency">Open Emergency</option>
                                <option value="open_estimate">Open Estimate</option>
                                <option value="open_maintenance">Open Maintenance</option>
                                <option value="/services">/services</option>
                                <option value="/emergency">/emergency</option>
                                <option value="/contact">/contact</option>
                              </select>
                            </div>
                          </div>

                          {/* Items / Cards in section */}
                          {sec.items && (
                            <div className="pt-2 border-t border-slate-200 space-y-2">
                              <span className="text-[11px] font-bold text-slate-700 uppercase block">
                                Items / Cards ({sec.items.length})
                              </span>
                              {sec.items.map((item, itemIdx) => (
                                <div key={item.id} className="p-2.5 bg-white border border-slate-200 space-y-1.5">
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => {
                                      const copy = [...currentPage.sections];
                                      const items = [...(copy[secIdx].items || [])];
                                      items[itemIdx].title = e.target.value;
                                      copy[secIdx].items = items;
                                      updateSitePage(currentPage.id, { sections: copy });
                                    }}
                                    className="w-full px-2 py-1 border border-slate-200 text-xs font-semibold"
                                  />
                                  <textarea
                                    rows={2}
                                    value={item.description}
                                    onChange={(e) => {
                                      const copy = [...currentPage.sections];
                                      const items = [...(copy[secIdx].items || [])];
                                      items[itemIdx].description = e.target.value;
                                      copy[secIdx].items = items;
                                      updateSitePage(currentPage.id, { sections: copy });
                                    }}
                                    className="w-full px-2 py-1 border border-slate-200 text-xs text-slate-600"
                                  />
                                </div>
                              ))}
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
      )}
    </>
  );
};
