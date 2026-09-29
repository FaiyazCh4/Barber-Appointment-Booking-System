import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Users,
  Sun,
  X,
  Save,
  Check,
} from 'lucide-react';
import { authFetch } from '../../api/client';
import type { Staff } from '../../types';

interface Props {
  staffList: Staff[];
  onRefreshGlobalData: () => void;
}

export const AdminSchedulesManager: React.FC<Props> = ({ staffList, onRefreshGlobalData }) => {
  const [subTab, setSubTab] = useState<'salon_hours' | 'staff_roster' | 'closures'>('salon_hours');
  const [loading, setLoading] = useState<boolean>(true);

  // Salon Hours Data
  const [salonHours, setSalonHours] = useState<any[]>([]);
  const [savingHours, setSavingHours] = useState<boolean>(false);

  // Closures Data
  const [closures, setClosures] = useState<any[]>([]);
  const [newClosureDate, setNewClosureDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newClosureReason, setNewClosureReason] = useState<string>('');
  const [newClosureAllDay, setNewClosureAllDay] = useState<boolean>(true);
  const [savingClosure, setSavingClosure] = useState<boolean>(false);

  // Staff Schedules Data
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [allStaffWorkingHours, setAllStaffWorkingHours] = useState<any[]>([]);
  const [currentStaffRoster, setCurrentStaffRoster] = useState<any[]>([]);
  const [savingStaffRoster, setSavingStaffRoster] = useState<boolean>(false);

  // Staff Time Off Data
  const [staffTimeOff, setStaffTimeOff] = useState<any[]>([]);
  const [leaveStaffId, setLeaveStaffId] = useState<string>('');
  const [leaveStartDate, setLeaveStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [leaveEndDate, setLeaveEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState<string>('Annual Leave');
  const [savingLeave, setSavingLeave] = useState<boolean>(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSchedulesData();
  }, []);

  const loadSchedulesData = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/admin/schedules');
      if (res.ok) {
        const data = await res.json();
        setSalonHours(data.salonHours || []);
        setClosures(data.closures || []);
        setAllStaffWorkingHours(data.staffWorkingHours || []);
        setStaffTimeOff(data.staffTimeOff || []);

        const initialStaffId = staffList[0]?.id || data.staffList?.[0]?.id || '';
        setSelectedStaffId((prev) => prev || initialStaffId);
        setLeaveStaffId((prev) => prev || initialStaffId);
      }
    } catch (err) {
      console.error('Failed to load schedules', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync selected staff member's working hours
  useEffect(() => {
    if (!selectedStaffId) return;
    const staffHours = allStaffWorkingHours.filter((h) => h.staff_id === selectedStaffId);
    if (staffHours.length === 7) {
      setCurrentStaffRoster(staffHours);
    } else {
      // Default 7-day template if none set
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const template = [0, 1, 2, 3, 4, 5, 6].map((dow) => {
        const existing = staffHours.find((h) => h.day_of_week === dow);
        if (existing) return existing;
        const isWorking = dow >= 2 && dow <= 6;
        let start = '09:00';
        let end = '17:30';
        if (dow === 4) end = '20:00';
        if (dow === 5) end = '18:00';
        if (dow === 6) {
          start = '08:30';
          end = '16:30';
        }
        return {
          day_of_week: dow,
          day_name: dayNames[dow],
          start_time: start,
          end_time: end,
          is_working: isWorking,
        };
      });
      setCurrentStaffRoster(template);
    }
  }, [selectedStaffId, allStaffWorkingHours]);

  const handleUpdateSalonHour = (dow: number, field: string, value: any) => {
    setSalonHours((prev) =>
      prev.map((h) => (h.day_of_week === dow ? { ...h, [field]: value } : h))
    );
  };

  const handleSaveSalonHours = async () => {
    setSavingHours(true);
    try {
      const res = await authFetch('/api/admin/schedules/salon-hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: salonHours }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save salon hours');
      }
      setNotification({ type: 'success', text: 'Salon operating hours updated and confirmed!' });
      onRefreshGlobalData();
      await loadSchedulesData();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setSavingHours(false);
    }
  };

  const handleUpdateStaffRosterItem = (dow: number, field: string, value: any) => {
    setCurrentStaffRoster((prev) =>
      prev.map((item) => (item.day_of_week === dow ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveStaffRoster = async () => {
    if (!selectedStaffId) return;
    setSavingStaffRoster(true);
    try {
      const res = await authFetch(`/api/admin/schedules/staff/${selectedStaffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workingHours: currentStaffRoster }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update stylist roster');
      }
      const stName = staffList.find((s) => s.id === selectedStaffId)?.name || 'Stylist';
      setNotification({ type: 'success', text: `Weekly schedule for ${stName} saved successfully!` });
      await loadSchedulesData();
      onRefreshGlobalData();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setSavingStaffRoster(false);
    }
  };

  const handleAddClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClosureDate || !newClosureReason.trim()) return;
    setSavingClosure(true);
    try {
      const res = await authFetch('/api/admin/closures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newClosureDate,
          reason: newClosureReason.trim(),
          allDay: newClosureAllDay,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add closure');
      }
      setNewClosureReason('');
      setNotification({ type: 'success', text: 'Salon closure date added!' });
      await loadSchedulesData();
      onRefreshGlobalData();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setSavingClosure(false);
    }
  };

  const handleDeleteClosure = async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/closures/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete closure');
      setNotification({ type: 'success', text: 'Closure removed.' });
      await loadSchedulesData();
      onRefreshGlobalData();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleAddStaffTimeOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStaffId || !leaveStartDate || !leaveEndDate || !leaveReason.trim()) return;
    setSavingLeave(true);
    try {
      const res = await authFetch(`/api/admin/schedules/staff/${leaveStaffId}/time-off`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDatetime: `${leaveStartDate}T00:00:00Z`,
          endDatetime: `${leaveEndDate}T23:59:59Z`,
          reason: leaveReason.trim(),
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to register leave');
      }
      setNotification({ type: 'success', text: 'Staff absence / leave registered.' });
      await loadSchedulesData();
      onRefreshGlobalData();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setSavingLeave(false);
    }
  };

  const handleDeleteStaffTimeOff = async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/schedules/staff-time-off/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove time off');
      setNotification({ type: 'success', text: 'Leave record removed.' });
      await loadSchedulesData();
      onRefreshGlobalData();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#181818] border border-[#2B2925] p-5 rounded-sm">
        <h3 className="font-serif-heading text-2xl text-[#F5F1EA] flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#BFA57D]" />
          Salon & Stylist Schedules
        </h3>
        <p className="text-xs text-[#8C8273] mt-1">
          Configure weekly opening hours, staff shifts, bank holidays, and annual leave.
        </p>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#262626]">
          <button
            onClick={() => setSubTab('salon_hours')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-sm transition-colors ${
              subTab === 'salon_hours'
                ? 'bg-[#9B8058] text-[#141414] font-bold'
                : 'bg-[#222] text-[#D9D1C5] hover:text-white'
            }`}
          >
            Salon Operating Hours
          </button>
          <button
            onClick={() => setSubTab('staff_roster')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-sm transition-colors ${
              subTab === 'staff_roster'
                ? 'bg-[#9B8058] text-[#141414] font-bold'
                : 'bg-[#222] text-[#D9D1C5] hover:text-white'
            }`}
          >
            Stylist Shifts & Roster
          </button>
          <button
            onClick={() => setSubTab('closures')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-sm transition-colors ${
              subTab === 'closures'
                ? 'bg-[#9B8058] text-[#141414] font-bold'
                : 'bg-[#222] text-[#D9D1C5] hover:text-white'
            }`}
          >
            Closures, Holidays & Leave
          </button>
        </div>
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

      {/* SUB-TAB 1: SALON OPERATING HOURS */}
      {subTab === 'salon_hours' && (
        <div className="bg-[#181818] border border-[#2B2925] p-6 rounded-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-serif-heading text-xl text-[#F5F1EA]">
                Authoritative Salon Operating Hours
              </h4>
              <p className="text-xs text-[#8C8273]">
                These hours govern public booking slot generation and website display.
              </p>
            </div>
            <button
              onClick={handleSaveSalonHours}
              disabled={savingHours}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#9B8058] hover:bg-[#856C47] text-[#141414] rounded-sm transition-colors uppercase tracking-wider self-start sm:self-auto"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingHours ? 'Saving...' : 'Save Salon Hours'}</span>
            </button>
          </div>

          <div className="divide-y divide-[#262626]">
            {salonHours.map((h) => {
              const dow = h.day_of_week;
              return (
                <div
                  key={dow}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 w-40">
                    <input
                      type="checkbox"
                      checked={h.is_open}
                      onChange={(e) => handleUpdateSalonHour(dow, 'is_open', e.target.checked)}
                      className="rounded-xs border-[#3E382E] accent-[#9B8058]"
                    />
                    <span
                      className={`text-sm font-medium ${
                        h.is_open ? 'text-[#F5F1EA]' : 'text-[#8C8273] line-through'
                      }`}
                    >
                      {h.day_name || dayLabels[dow]}
                    </span>
                  </div>

                  {h.is_open ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[#8C8273]">Opens:</span>
                        <input
                          type="time"
                          value={h.open_time}
                          onChange={(e) => handleUpdateSalonHour(dow, 'open_time', e.target.value)}
                          className="bg-[#141414] border border-[#2B2925] px-2.5 py-1 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                        />
                      </div>
                      <span className="text-xs text-[#8C8273]">to</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[#8C8273]">Closes:</span>
                        <input
                          type="time"
                          value={h.close_time}
                          onChange={(e) => handleUpdateSalonHour(dow, 'close_time', e.target.value)}
                          className="bg-[#141414] border border-[#2B2925] px-2.5 py-1 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                        />
                      </div>
                      {dow === 4 && (
                        <span className="text-[10px] text-[#BFA57D] font-mono bg-[#24211D] border border-[#3E382E] px-1.5 py-0.5 rounded-xs">
                          Late Night
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-[#8C8273] italic">Closed for appointments</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: STYLIST SHIFTS & ROSTER */}
      {subTab === 'staff_roster' && (
        <div className="bg-[#181818] border border-[#2B2925] p-6 rounded-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-serif-heading text-xl text-[#F5F1EA]">
                Stylist Weekly Roster & Shifts
              </h4>
              <p className="text-xs text-[#8C8273]">
                Customize individual working days and shift times for each stylist.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="bg-[#141414] border border-[#2B2925] px-3 py-2 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
              >
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.role_title})
                  </option>
                ))}
              </select>

              <button
                onClick={handleSaveStaffRoster}
                disabled={savingStaffRoster}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#9B8058] hover:bg-[#856C47] text-[#141414] rounded-sm transition-colors uppercase tracking-wider"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingStaffRoster ? 'Saving...' : 'Save Shift Roster'}</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#262626]">
            {currentStaffRoster.map((item) => {
              const dow = item.day_of_week;
              return (
                <div
                  key={dow}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 w-40">
                    <input
                      type="checkbox"
                      checked={item.is_working}
                      onChange={(e) =>
                        handleUpdateStaffRosterItem(dow, 'is_working', e.target.checked)
                      }
                      className="rounded-xs border-[#3E382E] accent-[#9B8058]"
                    />
                    <span
                      className={`text-sm font-medium ${
                        item.is_working ? 'text-[#F5F1EA]' : 'text-[#8C8273] line-through'
                      }`}
                    >
                      {item.day_name || dayLabels[dow]}
                    </span>
                  </div>

                  {item.is_working ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[#8C8273]">Shift Start:</span>
                        <input
                          type="time"
                          value={item.start_time || '09:00'}
                          onChange={(e) =>
                            handleUpdateStaffRosterItem(dow, 'start_time', e.target.value)
                          }
                          className="bg-[#141414] border border-[#2B2925] px-2.5 py-1 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                        />
                      </div>
                      <span className="text-xs text-[#8C8273]">to</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[#8C8273]">Shift End:</span>
                        <input
                          type="time"
                          value={item.end_time || '17:30'}
                          onChange={(e) =>
                            handleUpdateStaffRosterItem(dow, 'end_time', e.target.value)
                          }
                          className="bg-[#141414] border border-[#2B2925] px-2.5 py-1 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-[#8C8273] italic">Scheduled Day Off</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CLOSURES & STYLIST LEAVE */}
      {subTab === 'closures' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Salon Closures & Bank Holidays */}
          <div className="bg-[#181818] border border-[#2B2925] p-6 rounded-sm space-y-5">
            <div>
              <h4 className="font-serif-heading text-xl text-[#F5F1EA] flex items-center gap-2">
                <Sun className="w-5 h-5 text-[#BFA57D]" />
                Salon Closures & Holidays
              </h4>
              <p className="text-xs text-[#8C8273] mt-1">
                Entire salon closure dates (e.g. Christmas, Bank Holidays, Refurbishment).
              </p>
            </div>

            {/* Add Closure Form */}
            <form onSubmit={handleAddClosure} className="p-4 bg-[#141414] border border-[#2B2925] rounded-sm space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-[#D9D1C5]">Closure Date</label>
                  <input
                    type="date"
                    required
                    value={newClosureDate}
                    onChange={(e) => setNewClosureDate(e.target.value)}
                    className="w-full bg-[#181818] border border-[#2B2925] px-2.5 py-1.5 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-[#D9D1C5]">Reason</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Christmas Bank Holiday"
                    value={newClosureReason}
                    onChange={(e) => setNewClosureReason(e.target.value)}
                    className="w-full bg-[#181818] border border-[#2B2925] px-2.5 py-1.5 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#8C8273]">
                  <input
                    type="checkbox"
                    checked={newClosureAllDay}
                    onChange={(e) => setNewClosureAllDay(e.target.checked)}
                    className="rounded-xs border-[#3E382E] accent-[#9B8058]"
                  />
                  <span>All Day Closure</span>
                </label>
                <button
                  type="submit"
                  disabled={savingClosure}
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#9B8058] hover:bg-[#856C47] text-[#141414] rounded-sm transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{savingClosure ? 'Adding...' : 'Add Closure'}</span>
                </button>
              </div>
            </form>

            {/* List of Closures */}
            <div className="space-y-2">
              <span className="text-[11px] text-[#8C8273] uppercase font-semibold">Scheduled Closures</span>
              {closures.length === 0 ? (
                <div className="text-xs text-[#8C8273] italic py-3">No closures currently configured.</div>
              ) : (
                <div className="divide-y divide-[#262626]">
                  {closures.map((c) => (
                    <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono text-[#F5F1EA] font-medium mr-2">{c.date}</span>
                        <span className="text-[#A69B8D]">{c.reason}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteClosure(c.id)}
                        className="text-red-400 hover:text-red-200 p-1 hover:bg-red-950/40 rounded-xs transition-colors"
                        title="Delete Closure"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stylist Annual Leave & Absences */}
          <div className="bg-[#181818] border border-[#2B2925] p-6 rounded-sm space-y-5">
            <div>
              <h4 className="font-serif-heading text-xl text-[#F5F1EA] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#BFA57D]" />
                Stylist Leave & Absences
              </h4>
              <p className="text-xs text-[#8C8273] mt-1">
                Record holidays, training courses, and sick leave for individual stylists.
              </p>
            </div>

            {/* Add Leave Form */}
            <form onSubmit={handleAddStaffTimeOff} className="p-4 bg-[#141414] border border-[#2B2925] rounded-sm space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] text-[#D9D1C5]">Stylist</label>
                <select
                  value={leaveStaffId}
                  onChange={(e) => setLeaveStaffId(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2B2925] px-2.5 py-1.5 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                >
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-[#D9D1C5]">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full bg-[#181818] border border-[#2B2925] px-2.5 py-1.5 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-[#D9D1C5]">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full bg-[#181818] border border-[#2B2925] px-2.5 py-1.5 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#D9D1C5]">Reason</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Holiday, London Hair Academy Training"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2B2925] px-2.5 py-1.5 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={savingLeave}
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#9B8058] hover:bg-[#856C47] text-[#141414] rounded-sm transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{savingLeave ? 'Registering...' : 'Register Leave'}</span>
                </button>
              </div>
            </form>

            {/* List of Staff Absences */}
            <div className="space-y-2">
              <span className="text-[11px] text-[#8C8273] uppercase font-semibold">Registered Absences</span>
              {staffTimeOff.length === 0 ? (
                <div className="text-xs text-[#8C8273] italic py-3">No staff leaves currently registered.</div>
              ) : (
                <div className="divide-y divide-[#262626]">
                  {staffTimeOff.map((to) => {
                    const start = to.start_datetime?.split('T')[0];
                    const end = to.end_datetime?.split('T')[0];
                    return (
                      <div key={to.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-[#F5F1EA] mr-2">{to.staff_name}:</strong>
                          <span className="text-[#BFA57D] font-mono mr-2">
                            {start} to {end}
                          </span>
                          <span className="text-[#8C8273]">({to.reason})</span>
                        </div>
                        <button
                          onClick={() => handleDeleteStaffTimeOff(to.id)}
                          className="text-red-400 hover:text-red-200 p-1 hover:bg-red-950/40 rounded-xs transition-colors"
                          title="Remove Leave Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
