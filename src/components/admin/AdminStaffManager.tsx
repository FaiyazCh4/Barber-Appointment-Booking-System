import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Scissors,
  Calendar,
  X,
  Sparkles,
  Shield,
} from 'lucide-react';
import { authFetch } from '../../api/client';
import type { Service } from '../../types';

interface Props {
  services: Service[];
  onRefreshGlobalData: () => void;
}

export const AdminStaffManager: React.FC<Props> = ({ services, onRefreshGlobalData }) => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState<any | null>(null);

  // Form State
  const [formName, setFormName] = useState<string>('');
  const [formRoleTitle, setFormRoleTitle] = useState<string>('');
  const [formBio, setFormBio] = useState<string>('');
  const [formSpecialties, setFormSpecialties] = useState<string>('');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formActive, setFormActive] = useState<boolean>(true);
  const [formConsultationOnly, setFormConsultationOnly] = useState<boolean>(false);
  const [formServiceIds, setFormServiceIds] = useState<string[]>([]);
  const [formWorkingDays, setFormWorkingDays] = useState<number[]>([2, 3, 4, 5, 6]); // Tue-Sat default
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/admin/staff');
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.staff || []);
      }
    } catch (err) {
      console.error('Failed to load staff roster', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingStaffId(null);
    setFormName('');
    setFormRoleTitle('Senior Stylist & Colour Specialist');
    setFormBio('');
    setFormSpecialties('Curly Hair Specialist, Balayage, Precision Cutting');
    setFormImageUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80');
    setFormActive(true);
    setFormConsultationOnly(false);
    setFormServiceIds(services.map((s) => s.id)); // Assign to all by default
    setFormWorkingDays([2, 3, 4, 5, 6]); // Tuesday through Saturday
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (st: any) => {
    setEditingStaffId(st.id);
    setFormName(st.name);
    setFormRoleTitle(st.role_title);
    setFormBio(st.bio_text || '');
    setFormSpecialties(Array.isArray(st.specialties) ? st.specialties.join(', ') : st.specialties || '');
    setFormImageUrl(st.image_url || '');
    setFormActive(Boolean(st.active));
    setFormConsultationOnly(Boolean(st.consultation_only));
    setFormServiceIds(st.service_ids || []);
    setFormWorkingDays(
      st.working_hours ? st.working_hours.filter((h: any) => h.is_working).map((h: any) => h.day_of_week) : [2, 3, 4, 5, 6]
    );
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Stylist name is required.');
      return;
    }
    if (!formRoleTitle.trim()) {
      setFormError('Role title is required.');
      return;
    }

    setFormSubmitting(true);
    try {
      const specsArray = formSpecialties
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      // Generate 7-day schedule array from working days
      const workingHours = [0, 1, 2, 3, 4, 5, 6].map((dow) => {
        const isWorking = formWorkingDays.includes(dow);
        let start = '09:00';
        let end = '17:30';
        if (dow === 4) end = '20:00'; // Thursday late night
        if (dow === 5) end = '18:00'; // Friday
        if (dow === 6) {
          start = '08:30';
          end = '16:30';
        }
        return {
          day_of_week: dow,
          start_time: start,
          end_time: end,
          is_working: isWorking ? 1 : 0,
        };
      });

      const payload = {
        name: formName.trim(),
        roleTitle: formRoleTitle.trim(),
        bio: formBio.trim(),
        specialties: specsArray,
        imageUrl: formImageUrl.trim(),
        active: formActive,
        consultationOnly: formConsultationOnly,
        serviceIds: formServiceIds,
        workingHours,
      };

      if (editingStaffId) {
        const res = await authFetch(`/api/admin/staff/${editingStaffId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to update stylist');
        }
        setNotification({ type: 'success', text: `Stylist "${formName}" updated successfully!` });
      } else {
        const res = await authFetch('/api/admin/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to add stylist');
        }
        setNotification({ type: 'success', text: `Stylist "${formName}" added successfully!` });
      }

      setIsModalOpen(false);
      await loadStaff();
      onRefreshGlobalData();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deleteConfirmStaff) return;
    setFormSubmitting(true);
    try {
      const res = await authFetch(`/api/admin/staff/${deleteConfirmStaff.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete stylist');
      }
      setNotification({
        type: 'success',
        text: `Stylist "${deleteConfirmStaff.name}" has been removed.`,
      });
      setDeleteConfirmStaff(null);
      await loadStaff();
      onRefreshGlobalData();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setFormSubmitting(false);
    }
  };

  const toggleServiceAssignment = (srvId: string) => {
    if (formServiceIds.includes(srvId)) {
      setFormServiceIds(formServiceIds.filter((id) => id !== srvId));
    } else {
      setFormServiceIds([...formServiceIds, srvId]);
    }
  };

  const toggleWorkingDay = (day: number) => {
    if (formWorkingDays.includes(day)) {
      setFormWorkingDays(formWorkingDays.filter((d) => d !== day));
    } else {
      setFormWorkingDays([...formWorkingDays, day].sort());
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181818] border border-[#2B2925] p-5 rounded-sm">
        <div>
          <h3 className="font-serif-heading text-2xl text-[#F5F1EA] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#BFA57D]" />
            Salon Stylists & Colour Specialists
          </h3>
          <p className="text-xs text-[#8C8273] mt-1">
            Manage your salon team, assigned treatments, certified specialties, and active statuses.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#9B8058] hover:bg-[#856C47] text-[#141414] rounded-sm transition-colors uppercase tracking-wider self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Stylist</span>
        </button>
      </div>

      {notification && (
        <div
          className={`p-3 text-xs rounded-sm flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-200'
              : 'bg-red-950/80 border border-red-800 text-red-200'
          }`}
        >
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Staff Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-[#8C8273]">Loading team roster...</div>
      ) : staffList.length === 0 ? (
        <div className="text-center py-12 bg-[#181818] border border-[#2B2925] rounded-sm text-xs text-[#8C8273]">
          No stylists found. Click "Add Stylist" to create a team profile.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {staffList.map((st) => (
            <div
              key={st.id}
              className={`bg-[#181818] border rounded-sm p-6 space-y-4 transition-colors ${
                st.active ? 'border-[#2B2925]' : 'border-red-950/40 opacity-70 bg-[#141414]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#24211D] border border-[#3E382E] flex items-center justify-center font-serif-heading text-xl text-[#F5F1EA] overflow-hidden shrink-0">
                    {st.image_url ? (
                      <img src={st.image_url} alt={st.name} className="w-full h-full object-cover" />
                    ) : (
                      st.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h4 className="font-serif-heading text-xl text-[#F5F1EA]">{st.name}</h4>
                    <span className="text-xs text-[#BFA57D] font-medium">{st.role_title}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(st)}
                    className="p-1.5 text-xs text-[#D9D1C5] hover:text-white bg-[#222] hover:bg-[#2c2c2c] border border-[#3A3A3A] rounded-sm transition-colors flex items-center gap-1"
                    title="Edit Stylist"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#BFA57D]" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirmStaff(st)}
                    className="p-1.5 text-xs text-red-400 hover:text-red-200 bg-red-950/20 hover:bg-red-950/50 border border-red-900/40 rounded-sm transition-colors flex items-center gap-1"
                    title="Delete Stylist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {st.bio_text && (
                <p className="text-xs text-[#A69B8D] leading-relaxed line-clamp-3">{st.bio_text}</p>
              )}

              {/* Verified Specialties */}
              <div className="space-y-1.5 pt-2 border-t border-[#262626]">
                <span className="text-[10px] text-[#8C8273] uppercase font-semibold tracking-wider">
                  Verified Specialties
                </span>
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(st.specialties) ? st.specialties : []).map((sp: string, i: number) => (
                    <span
                      key={i}
                      className="text-[11px] bg-[#222] border border-[#333] text-[#D9D1C5] px-2 py-0.5 rounded-xs"
                    >
                      {sp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer info: services & working days */}
              <div className="pt-2 border-t border-[#242424] flex items-center justify-between text-xs text-[#8C8273]">
                <span>Assigned to {st.service_ids?.length || 0} treatments</span>
                <div className="flex items-center gap-1.5">
                  {!st.active && (
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-xs bg-red-950 text-red-300">
                      Inactive
                    </span>
                  )}
                  {st.consultation_only && (
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-xs bg-blue-950 text-blue-300">
                      Consultation Only
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT STYLIST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#181818] border border-[#3E382E] w-full max-w-xl rounded-sm p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-[#2B2925] pb-3">
              <h4 className="font-serif-heading text-xl text-[#F5F1EA]">
                {editingStaffId ? 'Edit Stylist Profile' : 'Add New Stylist'}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8C8273] hover:text-[#F5F1EA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-red-950/80 border border-red-800 text-xs text-red-200 rounded-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveStaff} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-[#D9D1C5] font-medium">Stylist Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya Lin"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2B2925] px-3 py-2 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#D9D1C5] font-medium">Role Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Colourist & Curly Specialist"
                    value={formRoleTitle}
                    onChange={(e) => setFormRoleTitle(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2B2925] px-3 py-2 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-[#D9D1C5] font-medium">Specialties (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="Curly Hair Specialist, Balayage, Precision Cutting, Extensions"
                    value={formSpecialties}
                    onChange={(e) => setFormSpecialties(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2B2925] px-3 py-2 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-[#D9D1C5] font-medium">Profile Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2B2925] px-3 py-2 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-[#D9D1C5] font-medium">Bio & Philosophy</label>
                  <textarea
                    rows={3}
                    placeholder="10+ years dedicated to natural texture, dimensional colour..."
                    value={formBio}
                    onChange={(e) => setFormBio(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2B2925] px-3 py-2 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                  />
                </div>
              </div>

              {/* Status Toggles */}
              <div className="flex items-center gap-6 pt-2 border-t border-[#262626]">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#D9D1C5]">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="rounded-xs border-[#3E382E] accent-[#9B8058]"
                  />
                  <span>Active Stylist</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#D9D1C5]">
                  <input
                    type="checkbox"
                    checked={formConsultationOnly}
                    onChange={(e) => setFormConsultationOnly(e.target.checked)}
                    className="rounded-xs border-[#3E382E] accent-[#9B8058]"
                  />
                  <span>Consultation Only</span>
                </label>
              </div>

              {/* Working Days */}
              <div className="space-y-2 pt-2 border-t border-[#262626]">
                <label className="text-xs text-[#D9D1C5] font-medium block">
                  Weekly Working Days Roster
                </label>
                <div className="flex flex-wrap gap-2">
                  {dayNames.map((dName, idx) => {
                    const isWorking = formWorkingDays.includes(idx);
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => toggleWorkingDay(idx)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-sm border transition-colors ${
                          isWorking
                            ? 'bg-[#9B8058] text-[#141414] font-bold border-[#9B8058]'
                            : 'bg-[#141414] text-[#8C8273] border-[#2B2925] hover:text-[#D9D1C5]'
                        }`}
                      >
                        {dName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assigned Services */}
              <div className="space-y-2 pt-2 border-t border-[#262626]">
                <label className="text-xs text-[#D9D1C5] font-medium flex items-center justify-between">
                  <span>Assigned Treatments ({formServiceIds.length} selected)</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormServiceIds(services.map((s) => s.id))}
                      className="text-[11px] text-[#BFA57D] hover:underline"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormServiceIds([])}
                      className="text-[11px] text-[#8C8273] hover:underline"
                    >
                      Deselect All
                    </button>
                  </div>
                </label>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border border-[#2B2925] p-2 rounded-sm bg-[#141414]">
                  {services.map((srv) => {
                    const isChecked = formServiceIds.includes(srv.id);
                    return (
                      <label
                        key={srv.id}
                        className={`flex items-center justify-between p-1.5 text-xs rounded-sm cursor-pointer transition-colors ${
                          isChecked ? 'bg-[#24211D] text-[#F5F1EA]' : 'text-[#8C8273] hover:text-[#D9D1C5]'
                        }`}
                      >
                        <span className="truncate pr-2">{srv.name}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleServiceAssignment(srv.id)}
                          className="rounded-xs border-[#3E382E] accent-[#9B8058]"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#2B2925]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#D9D1C5] hover:text-white bg-[#222] border border-[#3A3A3A] rounded-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-[#9B8058] hover:bg-[#856C47] text-[#141414] rounded-sm transition-colors"
                >
                  {formSubmitting ? 'Saving...' : editingStaffId ? 'Update Stylist' : 'Add Stylist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmStaff && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-red-900/60 w-full max-w-md rounded-sm p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="font-serif-heading text-xl text-[#F5F1EA]">Remove Stylist</h4>
            </div>

            <p className="text-xs text-[#D9D1C5] leading-relaxed">
              Are you sure you want to permanently remove{' '}
              <strong className="text-white">"{deleteConfirmStaff.name}"</strong> from the salon team?
              Their working schedule and service mappings will be removed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262626]">
              <button
                type="button"
                onClick={() => setDeleteConfirmStaff(null)}
                className="px-4 py-2 text-xs text-[#D9D1C5] hover:text-white bg-[#222] border border-[#3A3A3A] rounded-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={formSubmitting}
                onClick={handleDeleteStaff}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white rounded-sm transition-colors"
              >
                {formSubmitting ? 'Removing...' : 'Remove Stylist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
