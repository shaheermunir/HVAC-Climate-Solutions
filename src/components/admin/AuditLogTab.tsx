import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  Clock, 
  User, 
  Activity, 
  AlertCircle,
  CheckCircle2,
  Database
} from 'lucide-react';

export const AuditLogTab: React.FC = () => {
  const { auditLogs, refreshData, addToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      addToast('success', 'Audit Trail Refreshed', 'Latest administrative system logs synchronized');
    } catch {
      addToast('error', 'Sync Failed', 'Could not fetch latest audit events');
    } finally {
      setIsRefreshing(false);
    }
  };

  const entityTypes = useMemo(() => {
    const types = new Set<string>();
    auditLogs.forEach(log => {
      if (log.entityType) types.add(log.entityType);
    });
    return Array.from(types).sort();
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = 
        log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.entityId && log.entityId.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesEntity = selectedEntity === 'all' || log.entityType === selectedEntity;
      return matchesSearch && matchesEntity;
    });
  }, [auditLogs, searchTerm, selectedEntity]);

  const uniqueActorsCount = useMemo(() => {
    return new Set(auditLogs.map(l => l.actor)).size;
  }, [auditLogs]);

  const criticalEventsCount = useMemo(() => {
    return auditLogs.filter(l => 
      l.action.includes('delete') || 
      l.action.includes('publish') || 
      l.action.includes('rollback') ||
      l.action.includes('role') ||
      l.action.includes('integration')
    ).length;
  }, [auditLogs]);

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) {
      addToast('info', 'No Logs to Export', 'There are no log entries matching current criteria');
      return;
    }

    const headers = ['Timestamp', 'Actor', 'Action', 'Entity Type', 'Entity ID', 'Details'];
    const rows = filteredLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.actor.replace(/"/g, '""')}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${(l.entityType || '').replace(/"/g, '""')}"`,
      `"${(l.entityId || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `airflow_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Export Ready', `Exported ${filteredLogs.length} audit log entries`);
  };

  const getActionColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('delete') || act.includes('reject')) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (act.includes('create') || act.includes('accept') || act.includes('approved') || act.includes('publish')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (act.includes('update') || act.includes('edit') || act.includes('toggle')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (act.includes('test') || act.includes('ping')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Audit Log & Compliance Trail
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Tamper-evident record of all administrative actions, data modifications, and security events.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            Refresh Trail
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Records</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{auditLogs.length}</span>
            <span className="text-xs text-slate-500">events logged</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unique Actors</span>
            <User className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{uniqueActorsCount}</span>
            <span className="text-xs text-slate-500">accounts & services</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Critical Actions</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{criticalEventsCount}</span>
            <span className="text-xs text-slate-500">deletions / releases</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Storage Sync</span>
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 inline" />
              Synced
            </span>
            <span className="text-xs text-slate-500">MySQL / JSON DB</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by actor, action, details, entity ID..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="border border-slate-200 py-2 px-3 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Entity Types ({auditLogs.length})</option>
            {entityTypes.map(type => (
              <option key={type} value={type}>
                {type} ({auditLogs.filter(l => l.entityType === type).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Log Feed / Table */}
      <div className="bg-white border border-slate-200 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No audit events found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm || selectedEntity !== 'all'
                ? 'Try clearing search filters or selecting all entity types.'
                : 'No administrative actions have been recorded in this environment yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Details & Parameters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-sans">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-sans font-medium text-slate-900">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-800 text-xs font-normal border border-slate-200">
                        <User className="w-3 h-3 text-slate-500" />
                        {log.actor}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      <span className="font-sans font-medium text-slate-700">{log.entityType || 'system'}</span>
                      {log.entityId && (
                        <span className="ml-1 text-slate-400 text-[11px]">#{log.entityId.slice(0, 8)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-md break-words font-sans text-xs">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>Showing {filteredLogs.length} of {auditLogs.length} logged events</span>
          <span>Security Retention: Indefinite (MySQL audit_logs)</span>
        </div>
      </div>
    </div>
  );
};
