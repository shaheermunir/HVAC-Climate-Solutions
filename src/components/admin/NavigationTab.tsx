import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { NavigationConfig, NavMenuItem } from '../../types';
import { 
  Compass, 
  Save, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  ExternalLink, 
  Bell, 
  Phone, 
  Layout, 
  Globe 
} from 'lucide-react';

export const NavigationTab: React.FC = () => {
  const { navigationConfig, updateNavigationConfig, addToast } = useApp();
  const [formData, setFormData] = useState<NavigationConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newPath, setNewPath] = useState('');

  useEffect(() => {
    if (navigationConfig) {
      setFormData(JSON.parse(JSON.stringify(navigationConfig)));
    }
  }, [navigationConfig]);

  if (!formData) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading navigation configuration...
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const ok = await updateNavigationConfig(formData);
      if (ok) {
        addToast('success', 'Navigation Saved', 'Header, footer, and menu items updated successfully');
      } else {
        addToast('error', 'Save Failed', 'Could not persist navigation configuration');
      }
    } catch {
      addToast('error', 'Save Failed', 'Unexpected error saving navigation configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleItem = (index: number) => {
    const updated = [...formData.menuItems];
    updated[index] = { ...updated[index], enabled: !updated[index].enabled };
    setFormData({ ...formData, menuItems: updated });
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formData.menuItems.length) return;
    const updated = [...formData.menuItems];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    // recalculate orders
    const reordered = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
    setFormData({ ...formData, menuItems: reordered });
  };

  const handleRemoveItem = (index: number) => {
    const updated = formData.menuItems.filter((_, idx) => idx !== index);
    const reordered = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
    setFormData({ ...formData, menuItems: reordered });
  };

  const handleAddMenuItem = () => {
    if (!newLabel.trim() || !newPath.trim()) {
      addToast('error', 'Missing Information', 'Please provide both label and path');
      return;
    }
    const newItem: NavMenuItem = {
      id: 'nav_' + Date.now(),
      label: newLabel.trim(),
      path: newPath.trim().startsWith('/') ? newPath.trim() : '/' + newPath.trim(),
      order: formData.menuItems.length + 1,
      enabled: true,
      isButton: false,
    };
    setFormData({
      ...formData,
      menuItems: [...formData.menuItems, newItem],
    });
    setNewLabel('');
    setNewPath('');
    addToast('success', 'Menu Item Added', `Added "${newItem.label}" to navigation menu`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600" />
            Navigation & Header/Footer Settings
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Configure announcement banners, main navbar links, CTA buttons, and global footer text.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Navigation'}
        </button>
      </div>

      {/* Announcement Bar Section */}
      <div className="bg-white border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-base font-semibold text-slate-900">Announcement Banner</h3>
              <p className="text-xs text-slate-500">Notice ribbon at the very top of the website</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.announcement?.enabled || false}
              onChange={(e) => setFormData({
                ...formData,
                announcement: {
                  ...formData.announcement,
                  enabled: e.target.checked
                }
              })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Banner Message
            </label>
            <input
              type="text"
              value={formData.announcement?.text || ''}
              onChange={(e) => setFormData({
                ...formData,
                announcement: { ...formData.announcement, text: e.target.value }
              })}
              placeholder="e.g. 24/7 Emergency HVAC Service available throughout our service territory"
              className="w-full px-3 py-2 border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Action Link Text
            </label>
            <input
              type="text"
              value={formData.announcement?.linkText || ''}
              onChange={(e) => setFormData({
                ...formData,
                announcement: { ...formData.announcement, linkText: e.target.value }
              })}
              placeholder="e.g. Call (800) 555-0199"
              className="w-full px-3 py-2 border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Header CTA & Phone */}
      <div className="bg-white border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Phone className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-base font-semibold text-slate-900">Header Call-To-Action & Phone</h3>
            <p className="text-xs text-slate-500">Quick contact information shown in the top navigation bar</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Button Label
            </label>
            <input
              type="text"
              value={formData.headerCta?.label || ''}
              onChange={(e) => setFormData({
                ...formData,
                headerCta: { ...formData.headerCta, label: e.target.value }
              })}
              placeholder="e.g. Book Service"
              className="w-full px-3 py-2 border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Button Action / Trigger
            </label>
            <input
              type="text"
              value={formData.headerCta?.action || ''}
              onChange={(e) => setFormData({
                ...formData,
                headerCta: { ...formData.headerCta, action: e.target.value }
              })}
              placeholder="e.g. open_booking"
              className="w-full px-3 py-2 border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Display
            </label>
            <input
              type="text"
              value={formData.headerCta?.phoneDisplay || ''}
              onChange={(e) => setFormData({
                ...formData,
                headerCta: { ...formData.headerCta, phoneDisplay: e.target.value }
              })}
              placeholder="e.g. (800) 555-0199"
              className="w-full px-3 py-2 border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Navigation Menu Items */}
      <div className="bg-white border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Layout className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-semibold text-slate-900">Main Menu Items</h3>
              <p className="text-xs text-slate-500">Links rendered in the desktop and mobile header navigation</p>
            </div>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1">
            {formData.menuItems.length} Links
          </span>
        </div>

        {/* Existing Items Table */}
        <div className="border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {formData.menuItems.map((item, idx) => (
            <div key={item.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xs font-mono text-slate-400 w-5 text-right">{idx + 1}</span>
                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => {
                      const updated = [...formData.menuItems];
                      updated[idx] = { ...updated[idx], label: e.target.value };
                      setFormData({ ...formData, menuItems: updated });
                    }}
                    className="px-2 py-1 border border-slate-200 text-sm font-medium text-slate-800"
                  />
                  <input
                    type="text"
                    value={item.path}
                    onChange={(e) => {
                      const updated = [...formData.menuItems];
                      updated[idx] = { ...updated[idx], path: e.target.value };
                      setFormData({ ...formData, menuItems: updated });
                    }}
                    className="px-2 py-1 border border-slate-200 text-xs font-mono text-slate-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleItem(idx)}
                  className={`px-2 py-1 text-xs font-medium border cursor-pointer ${
                    item.enabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}
                >
                  {item.enabled ? 'Enabled' : 'Disabled'}
                </button>
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMoveItem(idx, 'up')}
                  className="p-1 border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === formData.menuItems.length - 1}
                  onClick={() => handleMoveItem(idx, 'down')}
                  className="p-1 border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="p-1 border border-slate-200 text-slate-400 hover:text-red-600 cursor-pointer"
                  title="Remove Item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Item */}
        <div className="bg-slate-50 border border-slate-200 p-3 flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            placeholder="Link Label (e.g. Commercial)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="w-full sm:w-1/3 px-3 py-1.5 bg-white border border-slate-200 text-sm focus:outline-none"
          />
          <input
            type="text"
            placeholder="Route Path (e.g. /commercial)"
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            className="w-full sm:w-1/2 px-3 py-1.5 bg-white border border-slate-200 text-sm font-mono focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddMenuItem}
            className="w-full sm:w-auto px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Footer Text & Legal */}
      <div className="bg-white border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Globe className="w-5 h-5 text-slate-700" />
          <div>
            <h3 className="text-base font-semibold text-slate-900">Footer Information & Legal</h3>
            <p className="text-xs text-slate-500">Copyright, licensing, and descriptive text rendered in the footer</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              About Text
            </label>
            <textarea
              rows={2}
              value={formData.footer?.aboutText || ''}
              onChange={(e) => setFormData({
                ...formData,
                footer: { ...formData.footer, aboutText: e.target.value }
              })}
              className="w-full px-3 py-2 border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              License / Regulatory Text
            </label>
            <input
              type="text"
              value={formData.footer?.licenseText || ''}
              onChange={(e) => setFormData({
                ...formData,
                footer: { ...formData.footer, licenseText: e.target.value }
              })}
              className="w-full px-3 py-2 border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Copyright Text
            </label>
            <input
              type="text"
              value={formData.footer?.copyrightText || ''}
              onChange={(e) => setFormData({
                ...formData,
                footer: { ...formData.footer, copyrightText: e.target.value }
              })}
              className="w-full px-3 py-2 border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
