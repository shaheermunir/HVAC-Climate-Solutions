import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Edit,
  ExternalLink,
  ShieldCheck,
  Lock,
  Key,
  Server,
  X,
  Send,
} from 'lucide-react';
import { IntegrationConfig } from '../../types';

export const IntegrationsTab: React.FC = () => {
  const { integrations, testIntegration, updateIntegration } = useApp();

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [editingIntegration, setEditingIntegration] = useState<IntegrationConfig | null>(null);

  // Form State
  const [intName, setIntName] = useState('');
  const [intProvider, setIntProvider] = useState('');
  const [intCategory, setIntCategory] = useState<any>('crm');
  const [intStatus, setIntStatus] = useState<any>('connected');
  const [intDetails, setIntDetails] = useState('');
  const [apiKey, setApiKey] = useState('••••••••••••••••••••••••••••••••');
  const [webhookUrl, setWebhookUrl] = useState('https://hvac.aspirinovation.com/api/webhooks/ingress');

  const handleTest = async (id: string) => {
    setTestingId(id);
    const msg = await testIntegration(id);
    setTestResults((prev) => ({ ...prev, [id]: msg }));
    setTestingId(null);
  };

  const openConfigModal = (i: IntegrationConfig) => {
    setEditingIntegration(i);
    setIntName(i.name);
    setIntProvider(i.provider);
    setIntCategory(i.category);
    setIntStatus(i.status);
    setIntDetails(i.details);
    setIsModalOpen(true);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIntegration) return;

    const success = await updateIntegration(editingIntegration.id, {
      name: intName,
      status: intStatus,
      details: intDetails,
      credentialsSet: true,
      lastSync: `Updated at ${new Date().toLocaleTimeString()}`,
    });

    if (success) {
      setIsModalOpen(false);
    }
  };

  const totalIntegrations = integrations.length;
  const connectedCount = integrations.filter((i) => i.status === 'connected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-heading">Integrations & External Hubs</h2>
          <p className="text-xs text-slate-500 mt-0.5">Connect your HVAC CRM, dispatch telematics, payment processors, and SMS gateways.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Connectors</span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1 block">{totalIntegrations}</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Supported Industry APIs</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Live & Connected</span>
          <span className="text-2xl font-extrabold text-emerald-800 font-mono mt-1 block">{connectedCount}</span>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Passing Health Check 200 OK</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">Sync Engine Status</span>
          <span className="text-2xl font-extrabold text-blue-900 font-mono mt-1 block">Active</span>
          <span className="text-[10px] text-blue-600 mt-0.5 block">Automatic Webhook Ingress</span>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {integrations.map((i) => {
          const isTesting = testingId === i.id;
          const resultMsg = testResults[i.id];

          return (
            <div
              key={i.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shadow-xs">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 font-heading">{i.name}</h3>
                      <span className="text-[11px] text-slate-500 font-medium capitalize">{i.category} Connector</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      i.status === 'connected'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : i.status === 'testing'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {i.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {i.details}
                </p>

                {i.lastSync && (
                  <div className="text-[10px] text-slate-400 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                    Last activity: {i.lastSync}
                  </div>
                )}

                {resultMsg && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-[11px] font-medium">{resultMsg}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={() => handleTest(i.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-blue-600' : ''}`} />
                  <span>{isTesting ? 'Pinging...' : 'Test Ping'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => openConfigModal(i)}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Configure</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: CONFIGURE INTEGRATION */}
      {isModalOpen && editingIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight">Configure {editingIntegration.name}</h3>
                <p className="text-xs text-slate-300 mt-0.5">Manage API endpoints, webhook ingress, and environment credentials.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfigSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Connector Name</label>
                <input
                  type="text"
                  required
                  value={intName}
                  onChange={(e) => setIntName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">API Key / Secret Token</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste private API key..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Webhook Ingress URL</label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Connection State</label>
                <select
                  value={intStatus}
                  onChange={(e) => setIntStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold capitalize"
                >
                  <option value="connected">Connected & Syncing</option>
                  <option value="configured">Configured (Idle)</option>
                  <option value="awaiting_credentials">Awaiting Credentials</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scope Description</label>
                <textarea
                  rows={2}
                  value={intDetails}
                  onChange={(e) => setIntDetails(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Integration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
