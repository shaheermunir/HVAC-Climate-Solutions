import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wrench,
  Plus,
  Search,
  Star,
  CheckCircle2,
  Trash2,
  Edit,
  Phone,
  Mail,
  Clock,
  Award,
  X,
  UserCheck,
} from 'lucide-react';
import { Technician } from '../../types';

export const TechniciansTab: React.FC = () => {
  const { technicians, saveTechnician, deleteTechnician } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'offduty'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('Senior Diagnostic Mechanic');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('Inverter Diagnostics, Dual-Run Capacitors, ECM Blowers');
  const [certifications, setCertifications] = useState('NATE Certified, EPA 608 Universal');
  const [workingHours, setWorkingHours] = useState('Mon - Fri: 7:00 AM - 5:00 PM');
  const [photo, setPhoto] = useState('/images/hero_hvac_technician_1794171516085.jpg');
  const [active, setActive] = useState(true);

  const openNewModal = () => {
    setEditingTech(null);
    setName('');
    setRole('Senior Field Technician');
    setEmail('');
    setPhone('(800) 555-0199');
    setSkills('Inverter Diagnostics, RTU Maintenance, Refrigerant Superheat');
    setCertifications('NATE Certified, EPA Section 608 Universal');
    setWorkingHours('Mon - Fri: 8:00 AM - 5:00 PM');
    setPhoto('/images/hero_hvac_technician_1794171516085.jpg');
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (tech: Technician) => {
    setEditingTech(tech);
    setName(tech.name);
    setRole(tech.role);
    setEmail(tech.email);
    setPhone(tech.phone);
    setSkills(Array.isArray(tech.skills) ? tech.skills.join(', ') : '');
    setCertifications(Array.isArray(tech.certifications) ? tech.certifications.join(', ') : '');
    setWorkingHours(tech.workingHours || 'Mon - Fri: 8:00 AM - 5:00 PM');
    setPhoto(tech.photo || '/images/hero_hvac_technician_1794171516085.jpg');
    setActive(tech.active);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const parsedSkills = skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedCerts = certifications
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const payload: Partial<Technician> = {
      ...(editingTech ? { id: editingTech.id } : {}),
      name: name.trim(),
      role: role.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      skills: parsedSkills,
      certifications: parsedCerts,
      workingHours: workingHours.trim(),
      photo: photo.trim(),
      active,
      rating: editingTech?.rating || 5.0,
      completedJobsCount: editingTech?.completedJobsCount || 0,
      serviceAreas: editingTech?.serviceAreas || ['Metro Area'],
    };

    const success = await saveTechnician(payload);
    if (success) {
      setIsModalOpen(false);
    }
  };

  const filteredTechs = technicians.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.role.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      t.phone.includes(search);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && t.active) ||
      (statusFilter === 'offduty' && !t.active);

    return matchesSearch && matchesStatus;
  });

  const totalTechs = technicians.length;
  const onDutyCount = technicians.filter((t) => t.active).length;
  const avgRating =
    technicians.length > 0
      ? (technicians.reduce((acc, curr) => acc + (curr.rating || 5), 0) / technicians.length).toFixed(1)
      : '5.0';
  const totalCompleted = technicians.reduce((acc, curr) => acc + (curr.completedJobsCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-heading">Field Technicians & Fleet</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage certified service mechanics, on-call duty status, and rolling warehouse dispatch.</p>
        </div>
        <button
          onClick={openNewModal}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Technician</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Fleet Staff</span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1 block">{totalTechs}</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">NATE / EPA Certified</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Active On-Duty</span>
          <span className="text-2xl font-extrabold text-emerald-800 font-mono mt-1 block">{onDutyCount}</span>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Ready for Live Dispatch</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">Fleet Satisfaction</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">{avgRating}</span>
            <Star className="w-4 h-4 fill-amber-500 text-amber-500 inline" />
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Homeowner Feedback</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">Completed Calls</span>
          <span className="text-2xl font-extrabold text-blue-900 font-mono mt-1 block">{totalCompleted}</span>
          <span className="text-[10px] text-blue-600 mt-0.5 block">All-time work orders</span>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
          {[
            { id: 'all', label: `All Staff (${totalTechs})` },
            { id: 'active', label: `On-Duty (${onDutyCount})` },
            { id: 'offduty', label: `Off-Duty (${totalTechs - onDutyCount})` },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search mechanics by name or skill..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Technicians Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTechs.map((tech) => (
          <div
            key={tech.id}
            className={`bg-white rounded-2xl border p-5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all ${
              tech.active ? 'border-slate-200' : 'border-slate-200 opacity-75 bg-slate-50/50'
            }`}
          >
            <div className="space-y-4">
              {/* Header with Avatar & Status Toggle */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
                    <img
                      src={tech.photo || '/images/hero_hvac_technician_1794171516085.jpg'}
                      alt={tech.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-heading">{tech.name}</h3>
                    <span className="text-xs text-slate-500 font-medium block">{tech.role}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => saveTechnician({ id: tech.id, active: !tech.active })}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                    tech.active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                  }`}
                  title="Click to toggle on-duty / off-duty status"
                >
                  {tech.active ? '● On-Duty' : '○ Off-Duty'}
                </button>
              </div>

              {/* Contact & Hours */}
              <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{tech.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono truncate">{tech.email}</span>
                </div>
                {tech.workingHours && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{tech.workingHours}</span>
                  </div>
                )}
              </div>

              {/* Skills & Certifications */}
              <div className="space-y-2">
                {tech.certifications && tech.certifications.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Certifications
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {tech.certifications.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {tech.skills && tech.skills.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Core Specialties
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {tech.skills.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with Performance & Actions */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-amber-600 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{tech.rating || 5.0}</span>
                </div>
                <span className="text-slate-400 text-[11px]">
                  {tech.completedJobsCount || 0} jobs
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEditModal(tech)}
                  className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit Technician"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Remove technician ${tech.name} from the fleet directory?`)) {
                      deleteTechnician(tech.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Profile"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredTechs.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <Wrench className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">No technicians found</p>
            <p className="text-xs text-slate-400 mt-0.5">Add a new mechanic or adjust your search filter.</p>
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT TECHNICIAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight">
                  {editingTech ? `Edit ${editingTech.name}` : 'Register Field Technician'}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">Staff details for appointment dispatching and customer notifications.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Marcus Vance"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Title / Role</label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Master Inverter Diagnostic Mechanic"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(800) 555-0199"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tech@company.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Working Hours / Dispatch Window</label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  placeholder="Mon - Fri: 8:00 AM - 5:00 PM"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Certifications (comma separated)</label>
                <input
                  type="text"
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  placeholder="NATE Certified, EPA 608 Universal, Bosch IDS Specialist"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Skills & Specialties (comma separated)</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Inverter Diagnostics, Dual-Run Capacitors, ECM Blowers, RTU Rebuilds"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Profile Photo Asset URL</label>
                <input
                  type="text"
                  value={photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  placeholder="/images/hero_hvac_technician_1794171516085.jpg"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
                <label htmlFor="activeCheck" className="font-semibold text-slate-800">
                  Technician is currently On-Duty and available for lead assignment
                </label>
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
                  {editingTech ? 'Save Changes' : 'Create Technician'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
