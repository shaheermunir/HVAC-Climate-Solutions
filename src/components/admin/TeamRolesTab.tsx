import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserCog,
  Plus,
  Search,
  Trash2,
  Edit,
  Phone,
  Clock,
  X,
  KeyRound,
  Copy,
  Check,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { AdminUser } from '../../types';
import {
  ALL_PERMISSIONS,
  CanonicalStaffRole,
  PermissionKey,
  ROLE_DEFAULT_PERMISSIONS,
  ROLE_LABELS,
  normalizeStaffRole,
  resolveUserPermissions,
} from '../../shared/rbac';

export const TeamRolesTab: React.FC = () => {
  const {
    adminUsers,
    adminUser,
    technicians,
    saveAdminUser,
    deleteAdminUser,
    adminResetUserPassword,
    adminGenerateResetToken,
  } = useApp();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Add / Edit Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<CanonicalStaffRole>('business_admin');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');
  const [technicianId, setTechnicianId] = useState('');
  const [password, setPassword] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [permissions, setPermissions] = useState<PermissionKey[]>(ROLE_DEFAULT_PERMISSIONS.business_admin);

  // Reset Password / Recovery Token Modal State
  const [resetTargetUser, setResetTargetUser] = useState<AdminUser | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [resetMustChange, setResetMustChange] = useState(true);
  const [generatedToken, setGeneratedToken] = useState<{ token: string; expiresAt: string } | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const openNewModal = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setEmail('');
    setPhone('(800) 555-0199');
    setRole('business_admin');
    setStatus('active');
    setTechnicianId('');
    setPassword('');
    setMustChangePassword(true);
    setPermissions([...ROLE_DEFAULT_PERMISSIONS.business_admin]);
    setIsModalOpen(true);
  };

  const openEditModal = (u: AdminUser) => {
    const norm = normalizeStaffRole(u.role);
    const staffRole: CanonicalStaffRole = norm === 'customer' ? 'content_editor' : norm;
    setEditingUser(u);
    setName(u.name);
    setUsername(u.username || u.email.split('@')[0]);
    setEmail(u.email);
    setPhone(u.phone || '');
    setRole(staffRole);
    setStatus(u.status);
    setTechnicianId(u.technicianId || '');
    setPassword('');
    setMustChangePassword(Boolean(u.mustChangePassword));
    setPermissions(resolveUserPermissions(u));
    setIsModalOpen(true);
  };

  const handleRoleChange = (nextRole: CanonicalStaffRole) => {
    setRole(nextRole);
    setPermissions([...ROLE_DEFAULT_PERMISSIONS[nextRole]]);
    if (nextRole !== 'technician') {
      setTechnicianId('');
    }
  };

  const togglePermission = (key: PermissionKey) => {
    if (role === 'super_admin') return;
    setPermissions((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !username.trim()) return;
    if (!editingUser && !password) return;

    const payload: Partial<AdminUser> & { password?: string } = {
      ...(editingUser ? { id: editingUser.id } : {}),
      name: name.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      status,
      technicianId: role === 'technician' && technicianId ? technicianId : undefined,
      permissions: role === 'super_admin' ? [...ROLE_DEFAULT_PERMISSIONS.super_admin] : permissions,
      mustChangePassword,
      ...(password ? { password } : {}),
    };

    const success = await saveAdminUser(payload);
    if (success) {
      setIsModalOpen(false);
    }
  };

  const openResetModal = (u: AdminUser) => {
    setResetTargetUser(u);
    setResetPasswordInput('');
    setResetMustChange(true);
    setGeneratedToken(null);
    setCopiedToken(false);
  };

  const handleDirectResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !resetPasswordInput) return;
    const ok = await adminResetUserPassword(resetTargetUser.id, resetPasswordInput, resetMustChange);
    if (ok) {
      setResetTargetUser(null);
      setResetPasswordInput('');
    }
  };

  const handleGenerateToken = async () => {
    if (!resetTargetUser) return;
    const res = await adminGenerateResetToken(resetTargetUser.id);
    if (res.success && res.token && res.expiresAt) {
      setGeneratedToken({ token: res.token, expiresAt: res.expiresAt });
    }
  };

  const getRoleBadge = (r: string) => {
    const norm = normalizeStaffRole(r);
    switch (norm) {
      case 'super_admin':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">SUPER ADMIN</span>;
      case 'business_admin':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">BUSINESS ADMIN</span>;
      case 'dispatcher':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">LEAD DISPATCHER</span>;
      case 'technician':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">FIELD TECHNICIAN</span>;
      case 'content_editor':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">CONTENT EDITOR</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 uppercase whitespace-nowrap">{r}</span>;
    }
  };

  const filteredUsers = adminUsers.filter((u) => {
    const norm = normalizeStaffRole(u.role);
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      norm.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === 'all' || norm === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUsers = adminUsers.length;
  const adminCount = adminUsers.filter((u) => ['super_admin', 'business_admin'].includes(normalizeStaffRole(u.role))).length;
  const dispatcherCount = adminUsers.filter((u) => normalizeStaffRole(u.role) === 'dispatcher').length;
  const techCount = adminUsers.filter((u) => normalizeStaffRole(u.role) === 'technician').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-heading">User Accounts & Access Control</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create individual staff credentials, configure role-based permissions, issue password resets, and enforce account status.
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create User Account</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Staff Accounts</span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1 block">{totalUsers}</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Individual Credentials</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">Super & Business Admins</span>
          <span className="text-2xl font-extrabold text-blue-900 font-mono mt-1 block">{adminCount}</span>
          <span className="text-[10px] text-blue-600 mt-0.5 block">Administrative Operators</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">Lead Dispatchers</span>
          <span className="text-2xl font-extrabold text-amber-800 font-mono mt-1 block">{dispatcherCount}</span>
          <span className="text-[10px] text-amber-600 mt-0.5 block">CRM & Dispatch Triage</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Field Technicians</span>
          <span className="text-2xl font-extrabold text-emerald-800 font-mono mt-1 block">{techCount}</span>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Scoped Work Orders</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
          {[
            { id: 'all', label: `All Roles (${totalUsers})` },
            { id: 'super_admin', label: 'Super Admin' },
            { id: 'business_admin', label: 'Business Admin' },
            { id: 'dispatcher', label: 'Dispatchers' },
            { id: 'technician', label: 'Technicians' },
            { id: 'content_editor', label: 'Editors' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setRoleFilter(r.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                roleFilter === r.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, username or email..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredUsers.map((u) => {
          const isSelf = u.id === adminUser?.id;
          const resolvedPerms = resolveUserPermissions(u);
          const linkedTech = u.technicianId ? technicians.find((t) => t.id === u.technicianId) : undefined;

          return (
            <div
              key={u.id}
              className={`bg-white rounded-2xl border p-5 flex flex-col justify-between shadow-2xs transition-all ${
                u.status === 'active' ? 'border-slate-200' : 'border-rose-200 bg-rose-50/30 opacity-80'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0 uppercase shadow-xs">
                      {u.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-900 font-heading truncate">{u.name}</h3>
                        {isSelf && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded">YOU</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono block truncate">
                        @{u.username || u.email.split('@')[0]}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono block truncate">{u.email}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">{getRoleBadge(u.role)}</div>
                </div>

                {/* Permissions Scope */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Authorized Modules ({resolvedPerms.length})
                    </span>
                    {u.mustChangePassword && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                        Pwd Reset Pending
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">
                    {resolvedPerms.map((p) => p.replace(/_/g, ' ')).join(' · ') || 'No permissions'}
                  </p>
                  {linkedTech && (
                    <div className="text-[10px] font-mono text-emerald-700 pt-1 border-t border-slate-200/60">
                      Linked Technician: {linkedTech.name}
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-xs text-slate-500 font-mono">
                  {u.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{u.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Last sign-in: {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={isSelf}
                  onClick={() =>
                    saveAdminUser({ id: u.id, status: u.status === 'active' ? 'suspended' : 'active' })
                  }
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors whitespace-nowrap ${
                    isSelf ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } ${
                    u.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                  }`}
                  title={isSelf ? 'Cannot suspend your own account' : 'Click to activate or suspend account'}
                >
                  {u.status === 'active' ? 'Active' : 'Suspended'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openResetModal(u)}
                    className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                    title="Reset Password / Issue Recovery Token"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(u)}
                    className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit Role & Permissions"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {!isSelf && (
                    confirmDeleteId === u.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteAdminUser(u.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-md cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-1.5 py-1 bg-slate-200 text-slate-700 text-[10px] font-semibold rounded-md cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(u.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <UserCog className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">No team accounts match the filter</p>
            <p className="text-xs text-slate-400 mt-0.5">Click "Create User Account" to provision individual staff logins.</p>
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT USER ACCOUNT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight">
                  {editingUser ? `Manage Account: ${editingUser.name}` : 'Create Staff Login Account'}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Configure individual login credentials, assigned role, and granular permission scopes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rachel Hayes"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                    placeholder="rachel.hayes"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rachel@airflowclimate.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Direct Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(800) 555-0199"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Role *</label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as CanonicalStaffRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                  >
                    {(Object.keys(ROLE_LABELS) as CanonicalStaffRole[]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={status}
                    disabled={editingUser?.id === adminUser?.id}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold disabled:opacity-60"
                  >
                    <option value="active">Active (Login Enabled)</option>
                    <option value="suspended">Suspended (Access Revoked)</option>
                  </select>
                </div>
              </div>

              {role === 'technician' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Linked Field Technician Profile (Work Order Isolation)
                  </label>
                  <select
                    value={technicianId}
                    onChange={(e) => setTechnicianId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="">Match automatically by user full name</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <label className="block font-semibold text-slate-800">
                  {editingUser ? 'Set New Password (Leave blank to keep existing)' : 'Initial Account Password *'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters with uppercase, lowercase, and digit"
                  autoComplete="new-password"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono"
                />
                <label className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mustChangePassword}
                    onChange={(e) => setMustChangePassword(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span>Require password change after sign-in</span>
                </label>
              </div>

              {/* Granular Permission Checkboxes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>Fine-Grained Module Permissions ({permissions.length} enabled)</span>
                  </label>
                  {role !== 'super_admin' && (
                    <button
                      type="button"
                      onClick={() => setPermissions([...ROLE_DEFAULT_PERMISSIONS[role]])}
                      className="text-[11px] text-blue-700 hover:underline font-semibold cursor-pointer"
                    >
                      Reset to {ROLE_LABELS[role]} Defaults
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {ALL_PERMISSIONS.map((perm) => {
                    const checked = role === 'super_admin' || permissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-start gap-2 p-2 rounded-lg border text-[11px] transition-colors ${
                          checked ? 'bg-white border-blue-200' : 'bg-slate-50 border-slate-200 opacity-70'
                        } ${role === 'super_admin' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={role === 'super_admin'}
                          onChange={() => togglePermission(perm.key)}
                          className="mt-0.5 rounded border-slate-300"
                        />
                        <div>
                          <span className="font-bold text-slate-800 block">{perm.label}</span>
                          <span className="text-[10px] text-slate-500">{perm.description}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {editingUser ? 'Save Account Changes' : 'Create User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SECURE PASSWORD RESET & RECOVERY TOKEN */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black tracking-tight">Security & Password Reset</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {resetTargetUser.name} (@{resetTargetUser.username || resetTargetUser.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResetTargetUser(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs">
              {/* Direct Administrative Password Reset */}
              <form onSubmit={handleDirectResetSubmit} className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Option 1: Set Temporary Password Immediately
                </h4>
                <p className="text-slate-500 text-[11px]">
                  Setting a temporary password immediately revokes any existing active login sessions for this user.
                </p>
                <input
                  type="password"
                  required
                  value={resetPasswordInput}
                  onChange={(e) => setResetPasswordInput(e.target.value)}
                  placeholder="Enter strong temporary password"
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
                <label className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetMustChange}
                    onChange={(e) => setResetMustChange(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span>Force user to change password on next login</span>
                </label>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl cursor-pointer"
                >
                  Apply Password Reset
                </button>
              </form>

              <div className="border-t border-slate-200 pt-5 space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Option 2: Generate Single-Use Recovery Token
                </h4>
                <p className="text-slate-500 text-[11px]">
                  Generates an encrypted 1-hour single-use recovery token that the staff member can redeem on the login screen.
                </p>

                {!generatedToken ? (
                  <button
                    type="button"
                    onClick={handleGenerateToken}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Issue Single-Use Recovery Token</span>
                  </button>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Share Securely (Shown Once)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(generatedToken.token);
                          setCopiedToken(true);
                          setTimeout(() => setCopiedToken(false), 2000);
                        }}
                        className="px-2 py-0.5 bg-white border border-amber-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedToken ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-2 bg-white border border-amber-200 rounded font-mono text-[11px] break-all text-slate-900 select-all">
                      {generatedToken.token}
                    </div>
                    <div className="text-[10px] text-amber-700 font-mono">
                      Expires: {new Date(generatedToken.expiresAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
