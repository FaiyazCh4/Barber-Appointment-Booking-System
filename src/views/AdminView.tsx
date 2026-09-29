import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Settings,
  Users,
  Scissors,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Plus,
  Play,
  Layers,
  ArrowRight,
  ExternalLink,
  Lock,
  LogOut,
  Mail,
  History,
  Database,
  Copy,
  Check,
  UserPlus,
  Shield,
  KeyRound,
  Sparkles,
  FileText,
  X,
} from 'lucide-react';
import {
  loginUser,
  logoutUser,
  fetchAdminSlotStatus,
  registerAdminAccount,
  claimDefaultAdmin,
  resetAdminSlot,
  authFetch,
} from '../api/client';
import type { SalonConfig, Service, Staff, UserProfile } from '../types';
import { AdminServicesManager } from '../components/admin/AdminServicesManager';
import { AdminStaffManager } from '../components/admin/AdminStaffManager';
import { AdminSchedulesManager } from '../components/admin/AdminSchedulesManager';

interface Props {
  user: UserProfile | null;
  config: SalonConfig | null;
  services: Service[];
  staff: Staff[];
  onRefreshData: () => void;
  onNavigate: (view: string) => void;
  onLogout?: () => void;
}

export const AdminView: React.FC<Props> = ({
  user,
  config,
  services,
  staff,
  onRefreshData,
  onNavigate,
  onLogout,
}) => {
  // Tabs: appointments (default), overview, services, staff, hours, saloniq, notifications, audit, qatest, supabase
  const [activeTab, setActiveTab] = useState<string>('appointments');

  // Single Slot & Auth Mode State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [slotStatus, setSlotStatus] = useState<{
    slotAvailable: boolean;
    slotClaimed: boolean;
    adminExists: boolean;
  } | null>(null);
  const [loadingSlot, setLoadingSlot] = useState<boolean>(true);

  // Admin Registration Form State (Single Slot)
  const [regFullName, setRegFullName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');

  // Auth Form State (Sign In)
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Overview Data
  const [overview, setOverview] = useState<any>(null);

  // Appointments Data
  const [appointments, setAppointments] = useState<any[]>([]);
  const [apptFilterStatus, setApptFilterStatus] = useState<string>('all');
  const [apptFilterStaff, setApptFilterStaff] = useState<string>('all');
  const [apptSearch, setApptSearch] = useState<string>('');
  const [loadingAppts, setLoadingAppts] = useState<boolean>(false);

  // Manual New Appointment Modal
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [manualServiceId, setManualServiceId] = useState<string>('');
  const [manualStaffId, setManualStaffId] = useState<string>('');
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState<string>('10:00');
  const [manualCustName, setManualCustName] = useState<string>('');
  const [manualCustEmail, setManualCustEmail] = useState<string>('');
  const [manualCustPhone, setManualCustPhone] = useState<string>('');
  const [manualNotes, setManualNotes] = useState<string>('');
  const [manualSubmitting, setManualSubmitting] = useState<boolean>(false);

  // Internal Notes Editor Modal
  const [selectedApptForNotes, setSelectedApptForNotes] = useState<any>(null);
  const [internalNotesText, setInternalNotesText] = useState<string>('');
  const [customerNotesText, setCustomerNotesText] = useState<string>('');
  const [notesSaving, setNotesSaving] = useState<boolean>(false);

  // Inline Note Editor (Fast, non-blocking editing right in table row)
  const [editingNoteApptId, setEditingNoteApptId] = useState<string | null>(null);
  const [inlineInternalNote, setInlineInternalNote] = useState<string>('');
  const [inlineSaving, setInlineSaving] = useState<boolean>(false);

  // CSV Export
  const [exportingCsv, setExportingCsv] = useState<boolean>(false);

  // Cancellation Modal State
  const [selectedApptForCancel, setSelectedApptForCancel] = useState<any>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('Client requested cancellation');
  const [cancellingLoading, setCancellingLoading] = useState<boolean>(false);

  // Hours Confirmation
  const [hoursConfirming, setHoursConfirming] = useState<boolean>(false);

  // SalonIQ
  const [saloniqData, setSaloniqData] = useState<any>(null);
  const [cutoverUpdating, setCutoverUpdating] = useState<boolean>(false);

  // Notifications Outbox & Email Provider
  const [notifications, setNotifications] = useState<any[]>([]);
  const [emailProviderStatus, setEmailProviderStatus] = useState<any>(null);
  const [testEmailAddress, setTestEmailAddress] = useState<string>('');
  const [sendingTestEmail, setSendingTestEmail] = useState<boolean>(false);
  const [selectedNotificationForDetail, setSelectedNotificationForDetail] = useState<any>(null);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // QA Acceptance Tests
  const [qaResults, setQaResults] = useState<any>(null);
  const [qaRunning, setQaRunning] = useState<boolean>(false);

  // Supabase Integration
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [supabaseLoading, setSupabaseLoading] = useState<boolean>(false);
  const [supabaseTesting, setSupabaseTesting] = useState<boolean>(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<any>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdminOrStaff = user && ['owner_admin', 'receptionist', 'stylist'].includes(user.role);

  useEffect(() => {
    if (isAdminOrStaff) {
      loadOverview();
      loadAppointments();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'appointments') loadAppointments();
    if (activeTab === 'saloniq') loadSalonIq();
    if (activeTab === 'notifications') loadNotifications();
    if (activeTab === 'audit') loadAuditLogs();
    if (activeTab === 'supabase') loadSupabaseStatus();
  }, [activeTab]);

  const loadSupabaseStatus = async () => {
    setSupabaseLoading(true);
    try {
      const res = await authFetch('/api/admin/supabase');
      if (res.ok) {
        const data = await res.json();
        setSupabaseStatus(data);
      }
    } catch (e) {
      console.error('Failed to load Supabase status', e);
    } finally {
      setSupabaseLoading(false);
    }
  };

  const handleTestSupabaseSync = async () => {
    setSupabaseTesting(true);
    setSupabaseTestResult(null);
    try {
      const res = await authFetch('/api/admin/supabase/test-sync', { method: 'POST' });
      const data = await res.json();
      setSupabaseTestResult(data);
      loadSupabaseStatus();
    } catch (e: any) {
      setSupabaseTestResult({ error: e.message });
    } finally {
      setSupabaseTesting(false);
    }
  };

  useEffect(() => {
    loadSlotStatus();
  }, []);

  const loadSlotStatus = async () => {
    try {
      setLoadingSlot(true);
      const st = await fetchAdminSlotStatus();
      setSlotStatus(st);
      if (st.slotAvailable) {
        setAuthMode('register');
      } else {
        setAuthMode('login');
      }
    } catch (err) {
      console.error('Error fetching admin slot status:', err);
    } finally {
      setLoadingSlot(false);
    }
  };

  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (regPassword !== regConfirmPassword) {
      setAuthError('Passwords do not match. Please re-enter.');
      return;
    }
    if (regPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }
    setAuthLoading(true);
    try {
      await registerAdminAccount({
        fullName: regFullName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
      });
      setNotificationMsg({
        type: 'success',
        text: 'Admin account created successfully! The single admin registration slot is now locked.',
      });
      await onRefreshData();
      await loadSlotStatus();
    } catch (err: any) {
      setAuthError(err.message || 'Failed to create admin account');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleClaimDefaultAdmin = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      await claimDefaultAdmin();
      setNotificationMsg({
        type: 'success',
        text: 'Default master admin account created and slot locked!',
      });
      await onRefreshData();
      await loadSlotStatus();
    } catch (err: any) {
      setAuthError(err.message || 'Failed to claim default admin account');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetAdminSlot = async () => {
    if (!window.confirm('Are you sure you want to reset the administrator slot? Any existing admin account will be cleared so you can create a fresh one.')) {
      return;
    }
    setAuthError('');
    setAuthLoading(true);
    try {
      await resetAdminSlot();
      setNotificationMsg({
        type: 'success',
        text: 'Admin slot has been reset and is now open for registration.',
      });
      await onRefreshData();
      await loadSlotStatus();
    } catch (err: any) {
      setAuthError(err.message || 'Failed to reset admin slot');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      await loginUser(loginEmail, loginPassword);
      await onRefreshData();
      await loadSlotStatus();
    } catch (err: any) {
      setAuthError(err.message || 'Invalid credentials');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setOverview(null);
      setAppointments([]);
      setNotifications([]);
      setAuditLogs([]);
      if (onLogout) {
        await onLogout();
      } else {
        await logoutUser();
        await onRefreshData();
      }
      setNotificationMsg({ type: 'success', text: 'Signed out successfully.' });
      await loadSlotStatus();
    } catch (e: any) {
      console.error('Logout error:', e);
    }
  };

  const loadOverview = async () => {
    try {
      const res = await authFetch('/api/admin/overview');
      if (res.ok) {
        setOverview(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAppointments = async () => {
    setLoadingAppts(true);
    try {
      const query = new URLSearchParams();
      if (apptFilterStatus !== 'all') query.set('status', apptFilterStatus);
      if (apptFilterStaff !== 'all') query.set('staffId', apptFilterStaff);
      if (apptSearch) query.set('search', apptSearch);

      const res = await authFetch(`/api/admin/appointments?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAppts(false);
    }
  };

  const handleStatusChange = async (apptId: string, newStatus: string, reason?: string) => {
    // 1. Optimistically update local appointments array so the status badge and dropdown update immediately
    setAppointments((prev) =>
      prev.map((a) => (a.id === apptId ? { ...a, status: newStatus } : a))
    );

    try {
      const res = await authFetch(`/api/admin/appointments/${apptId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, cancellationReason: reason }),
      });
      if (res.ok) {
        setNotificationMsg({ type: 'success', text: `Appointment status updated to ${newStatus}` });
        await loadAppointments();
        await loadOverview();
      } else {
        const err = await res.json();
        setNotificationMsg({ type: 'error', text: err.error || 'Failed to update appointment status' });
        await loadAppointments();
      }
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message || 'Error updating appointment status' });
      await loadAppointments();
    }
  };

  const handleSaveInternalNotes = async () => {
    if (!selectedApptForNotes) return;
    setNotesSaving(true);
    try {
      const res = await authFetch(`/api/admin/appointments/${selectedApptForNotes.id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internalNotes: internalNotesText,
          notes: customerNotesText,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save notes');
      }

      // Optimistic update of state
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === selectedApptForNotes.id
            ? { ...a, internal_notes: internalNotesText, notes: customerNotesText }
            : a
        )
      );

      setNotificationMsg({ type: 'success', text: 'Appointment notes updated successfully.' });
      setSelectedApptForNotes(null);
      await loadAppointments();
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message || 'Could not update notes' });
    } finally {
      setNotesSaving(false);
    }
  };

  const handleSaveInlineNote = async (apptId: string) => {
    setInlineSaving(true);
    try {
      const res = await authFetch(`/api/admin/appointments/${apptId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internalNotes: inlineInternalNote,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save note');

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === apptId ? { ...a, internal_notes: inlineInternalNote } : a
        )
      );
      setNotificationMsg({ type: 'success', text: 'Note saved successfully.' });
      setEditingNoteApptId(null);
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message || 'Could not save note' });
    } finally {
      setInlineSaving(false);
    }
  };

  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      const res = await authFetch('/api/admin/export/appointments.csv');
      if (!res.ok) {
        let errMsg = 'Failed to export appointments CSV';
        try {
          const errData = await res.json();
          if (errData.error) errMsg = errData.error;
        } catch {
          const text = await res.text();
          if (text) errMsg = text;
        }
        throw new Error(errMsg);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `george-davis-appointments-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      setNotificationMsg({ type: 'success', text: 'Appointments CSV exported successfully.' });
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message || 'Error exporting CSV' });
    } finally {
      setExportingCsv(false);
    }
  };

  const handleDownloadIcs = async (bookingRef: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingRef}/ics`);
      if (!res.ok) throw new Error('Could not download calendar invite');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${bookingRef}.ics`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message || 'Calendar download failed' });
    }
  };

  const handleConfirmHours = async () => {
    setHoursConfirming(true);
    try {
      const res = await authFetch('/api/admin/hours/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setNotificationMsg({ type: 'success', text: 'Official salon hours confirmed! Live availability activated.' });
        onRefreshData();
        loadOverview();
      }
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message });
    } finally {
      setHoursConfirming(false);
    }
  };

  const loadSalonIq = async () => {
    try {
      const res = await authFetch('/api/admin/saloniq');
      if (res.ok) setSaloniqData(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCutover = async (confirmed: boolean) => {
    setCutoverUpdating(true);
    try {
      const res = await authFetch('/api/admin/saloniq/cutover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed }),
      });
      if (res.ok) {
        setNotificationMsg({
          type: 'success',
          text: confirmed
            ? 'Cutover confirmed! Native calendar is now authoritative.'
            : 'Cutover unconfirmed. SalonIQ remains external backup.',
        });
        loadSalonIq();
      }
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message });
    } finally {
      setCutoverUpdating(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const [notifsRes, statusRes] = await Promise.all([
        authFetch('/api/admin/notifications'),
        authFetch('/api/admin/notifications/status'),
      ]);
      if (notifsRes.ok) {
        const data = await notifsRes.json();
        setNotifications(data.logs);
      }
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setEmailProviderStatus(statusData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress.trim()) return;
    setSendingTestEmail(true);
    try {
      const res = await authFetch('/api/admin/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: testEmailAddress.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotificationMsg({
          type: 'success',
          text: `Test email successfully sent to ${testEmailAddress.trim()} via ${data.provider} (${data.status}).`,
        });
        setTestEmailAddress('');
        await loadNotifications();
      } else {
        setNotificationMsg({
          type: 'error',
          text: data.errorDetails || data.error || 'Failed to dispatch test notification',
        });
      }
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message || 'Error triggering test email' });
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleRetryNotif = async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/notifications/${id}/retry`, { method: 'POST' });
      if (res.ok) {
        setNotificationMsg({ type: 'success', text: 'Notification retried successfully.' });
        loadNotifications();
      }
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message });
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await authFetch('/api/admin/audit');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunQaTests = async () => {
    setQaRunning(true);
    setQaResults(null);
    try {
      const res = await authFetch('/api/admin/qa-test', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setQaResults(data);
      }
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message });
    } finally {
      setQaRunning(false);
    }
  };

  const handleManualCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualSubmitting(true);
    try {
      const res = await authFetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: manualServiceId,
          staffId: manualStaffId || 'any',
          dateStr: manualDate,
          timeStr: manualTime,
          customerName: manualCustName,
          customerEmail: manualCustEmail,
          customerPhone: manualCustPhone,
          notes: manualNotes,
          policyAccepted: true,
          marketingConsent: false,
          patchTestAcknowledged: true,
        }),
      });

      if (res.ok) {
        setNotificationMsg({ type: 'success', text: 'Appointment created successfully.' });
        setShowManualModal(false);
        loadAppointments();
        loadOverview();
      } else {
        const err = await res.json();
        setNotificationMsg({ type: 'error', text: err.error });
      }
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message });
    } finally {
      setManualSubmitting(false);
    }
  };

  // If not logged in, show secure admin portal authentication
  if (!isAdminOrStaff) {
    if (loadingSlot) {
      return (
        <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
          <div className="w-10 h-10 border-2 border-[#9B8058] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#8C8273]">Verifying administrator slot status...</p>
        </div>
      );
    }

    const isSlotOpen = Boolean(slotStatus?.slotAvailable);

    return (
      <div className="max-w-lg mx-auto px-4 py-16 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2.5">
          <div className="w-14 h-14 rounded-full bg-[#1F1D1A] border border-[#9B8058]/80 flex items-center justify-center text-[#BFA57D] mx-auto shadow-md">
            {authMode === 'register' && isSlotOpen ? (
              <UserPlus className="w-7 h-7 text-[#BFA57D]" />
            ) : (
              <Lock className="w-7 h-7 text-[#BFA57D]" />
            )}
          </div>
          <h1 className="text-3xl font-serif-heading text-[#F5F1EA]">
            Salon Admin Portal
          </h1>
          <p className="text-xs text-[#A69B8D] max-w-sm mx-auto">
            George Davis Hairdressing administrative operations, live bookings overview, and salon management.
          </p>
        </div>

        {/* Notification Banner */}
        {notificationMsg && (
          <div
            className={`p-3 rounded-sm border text-xs flex items-center justify-between gap-3 ${
              notificationMsg.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                : 'bg-red-950/60 border-red-800 text-red-200'
            }`}
          >
            <span>{notificationMsg.text}</span>
            <button
              onClick={() => setNotificationMsg(null)}
              className="text-[#8C8273] hover:text-white text-sm"
            >
              ✕
            </button>
          </div>
        )}

        {/* Slot Availability Banner */}
        {isSlotOpen ? (
          <div className="bg-[#242018] border border-[#BFA57D]/50 rounded-sm p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F5F1EA]">
              <Sparkles className="w-4 h-4 text-[#BFA57D] shrink-0" />
              <span>Single Admin Account Slot is Open</span>
              <span className="ml-auto bg-[#9B8058] text-[#141414] font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-xs">
                1 Slot Available
              </span>
            </div>
            <p className="text-[11px] text-[#D9D1C5] leading-relaxed">
              Create your master administrator account below. Once this single account is created, the slot will be{' '}
              <strong className="text-white">permanently locked</strong> and nobody else will be allowed to create an admin account.
            </p>
          </div>
        ) : (
          <div className="bg-[#1C1A17] border border-[#3A352F] rounded-sm p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-[#BFA57D] shrink-0" />
              <div className="text-xs">
                <span className="text-[#F5F1EA] font-semibold block">Admin Slot Claimed & Locked</span>
                <span className="text-[#8C8273] text-[11px]">
                  Registration is closed. Please sign in with your administrator credentials.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetAdminSlot}
              className="text-[11px] text-[#BFA57D] hover:text-white underline shrink-0 px-2 py-1"
            >
              Reset Slot
            </button>
          </div>
        )}

        {/* Auth Box */}
        <div className="bg-[#181818] border border-[#2B2925] rounded-sm shadow-xl overflow-hidden">
          {/* Tabs (Only if slot is open) */}
          {isSlotOpen && (
            <div className="grid grid-cols-2 border-b border-[#262420] text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                }}
                className={`py-3 text-center transition-colors flex items-center justify-center gap-1.5 ${
                  authMode === 'register'
                    ? 'bg-[#1F1D1A] text-[#F5F1EA] border-b-2 border-[#9B8058]'
                    : 'text-[#8C8273] hover:text-[#D9D1C5]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Admin (1 Slot)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
                className={`py-3 text-center transition-colors flex items-center justify-center gap-1.5 ${
                  authMode === 'login'
                    ? 'bg-[#1F1D1A] text-[#F5F1EA] border-b-2 border-[#9B8058]'
                    : 'text-[#8C8273] hover:text-[#D9D1C5]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}

          <div className="p-6 space-y-4">
            {authError && (
              <div className="bg-red-950/60 border border-red-800 p-3 rounded-sm text-xs text-red-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {/* REGISTER ADMIN FORM (SINGLE SLOT) */}
            {authMode === 'register' && isSlotOpen ? (
              <form onSubmit={handleRegisterAdmin} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#D9D1C5]">
                    Full Name <span className="text-[#BFA57D]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. George Davis"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2D2D2D] text-[#F5F1EA] px-3.5 py-2.5 rounded-sm text-xs focus:outline-none focus:border-[#9B8058]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#D9D1C5]">
                    Admin Email Address <span className="text-[#BFA57D]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. owner@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2D2D2D] text-[#F5F1EA] px-3.5 py-2.5 rounded-sm text-xs focus:outline-none focus:border-[#9B8058]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#D9D1C5]">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 01527 577000"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2D2D2D] text-[#F5F1EA] px-3.5 py-2.5 rounded-sm text-xs focus:outline-none focus:border-[#9B8058]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#D9D1C5]">
                      Password <span className="text-[#BFA57D]">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Min 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-[#141414] border border-[#2D2D2D] text-[#F5F1EA] px-3.5 py-2.5 rounded-sm text-xs focus:outline-none focus:border-[#9B8058]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#D9D1C5]">
                      Confirm Password <span className="text-[#BFA57D]">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Re-enter password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full bg-[#141414] border border-[#2D2D2D] text-[#F5F1EA] px-3.5 py-2.5 rounded-sm text-xs focus:outline-none focus:border-[#9B8058]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold text-xs uppercase tracking-wider py-3 rounded-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {authLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Registering Admin & Locking Slot...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Create Admin Account & Lock Slot</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-3 border-t border-[#262420] text-center space-y-2">
                  <p className="text-[11px] text-[#8C8273]">
                    Want 1-click evaluation setup with standard credentials?
                  </p>
                  <button
                    type="button"
                    onClick={handleClaimDefaultAdmin}
                    disabled={authLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#222] hover:bg-[#2A2A2A] text-xs text-[#BFA57D] rounded-sm border border-[#3A3830] transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Claim with Default Admin (admin@georgedavishair.co.uk)</span>
                  </button>
                </div>

                <p className="text-[11px] text-[#8C8273] text-center pt-2">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError('');
                    }}
                    className="text-[#BFA57D] hover:underline"
                  >
                    Sign in here
                  </button>
                </p>
              </form>
            ) : (
              /* SIGN IN FORM */
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#D9D1C5]">
                    Admin / Staff Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2D2D2D] text-[#F5F1EA] px-3.5 py-2.5 rounded-sm text-xs focus:outline-none focus:border-[#9B8058]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#D9D1C5]">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2D2D2D] text-[#F5F1EA] px-3.5 py-2.5 rounded-sm text-xs focus:outline-none focus:border-[#9B8058]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold text-xs uppercase tracking-wider py-3 rounded-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {authLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Sign In to Admin Dashboard</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-3 border-t border-[#262420] flex items-center justify-between text-[11px] text-[#8C8273]">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('admin@georgedavishair.co.uk');
                      setLoginPassword('GeorgeDavis2026!');
                    }}
                    className="text-[#8C8273] hover:text-[#BFA57D] transition-colors underline"
                  >
                    Fill Default Admin
                  </button>
                  <button
                    type="button"
                    onClick={handleResetAdminSlot}
                    className="text-[#BFA57D] hover:underline"
                  >
                    Reset Admin Slot
                  </button>
                </div>

                {isSlotOpen && (
                  <p className="text-[11px] text-[#8C8273] text-center pt-1">
                    Need to claim the single admin slot?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setAuthError('');
                      }}
                      className="text-[#BFA57D] hover:underline font-semibold"
                    >
                      Create your admin account here
                    </button>
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & User Lockup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-6">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-[#BFA57D] font-semibold">
            Administrative Management
          </span>
          <h1 className="text-3xl font-serif-heading text-[#F5F1EA]">
            Salon Operations Hub
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <span className="text-[#F5F1EA] font-medium block">{user.full_name}</span>
            <span className="text-[#8C8273] uppercase text-[10px]">Role: {user.role}</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] hover:bg-red-950/60 border border-[#3A352F] hover:border-red-700 text-xs font-semibold text-[#D9D1C5] hover:text-red-200 rounded-sm transition-colors cursor-pointer shadow-sm active:translate-y-px"
            title="Sign Out from Admin Dashboard"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Global Notification */}
      {notificationMsg && (
        <div
          className={`p-3.5 rounded-sm text-xs flex items-center justify-between ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-200'
              : 'bg-red-950/40 border border-red-800 text-red-200'
          }`}
        >
          <span>{notificationMsg.text}</span>
          <button onClick={() => setNotificationMsg(null)} className="underline text-[11px] ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Draft Hours Alert */}
      {!config?.salon.hours_confirmed && (
        <div className="bg-[#241F16] border border-[#9B8058] p-4 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#D9D1C5]">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#BFA57D] shrink-0" />
            <span>
              <strong className="text-[#F5F1EA]">Schedule Action Required:</strong> Good Salon Guide draft hours need salon owner confirmation before being published as established schedule.
            </span>
          </div>
          <button
            disabled={hoursConfirming}
            onClick={handleConfirmHours}
            className="bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-sm transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            {hoursConfirming ? 'Confirming...' : 'Confirm Good Salon Guide Hours'}
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-[#262626]">
        {[
          { id: 'appointments', label: 'All Bookings & Appointments', icon: Calendar },
          { id: 'overview', label: 'Salon Overview', icon: Layers },
          { id: 'services', label: 'Services Catalogue', icon: Scissors },
          { id: 'staff', label: 'Stylists & Team', icon: Users },
          { id: 'schedules', label: 'Schedules & Operating Hours', icon: Clock },
          { id: 'saloniq', label: 'SalonIQ Migration', icon: FileSpreadsheet },
          { id: 'notifications', label: 'Notification Outbox', icon: Mail },
          { id: 'audit', label: 'Audit Trail', icon: History },
          { id: 'qatest', label: 'QA Acceptance Tests', icon: Play },
          { id: 'supabase', label: 'Supabase Backend', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-sm whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[#9B8058] text-[#141414] font-bold'
                  : 'bg-[#181818] text-[#D9D1C5] hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OPERATIONAL OVERVIEW */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#181818] border border-[#2B2925] p-5 rounded-sm space-y-1">
              <span className="text-[11px] text-[#8C8273] uppercase tracking-wider block">
                Today's Bookings
              </span>
              <span className="text-3xl font-serif-heading font-mono-numbers text-[#F5F1EA]">
                {overview.todayCount}
              </span>
              <span className="text-[10px] text-[#A69B8D] block">In salon schedule today</span>
            </div>

            <div className="bg-[#181818] border border-[#2B2925] p-5 rounded-sm space-y-1">
              <span className="text-[11px] text-[#8C8273] uppercase tracking-wider block">
                Confirmed Upcoming
              </span>
              <span className="text-3xl font-serif-heading font-mono-numbers text-[#BFA57D]">
                {overview.futureCount}
              </span>
              <span className="text-[10px] text-[#A69B8D] block">Upcoming booked slots</span>
            </div>

            <div className="bg-[#181818] border border-[#2B2925] p-5 rounded-sm space-y-1">
              <span className="text-[11px] text-[#8C8273] uppercase tracking-wider block">
                Active Client Records
              </span>
              <span className="text-3xl font-serif-heading font-mono-numbers text-[#F5F1EA]">
                {overview.totalCustomers}
              </span>
              <span className="text-[10px] text-[#A69B8D] block">Registered customers</span>
            </div>

            <div className="bg-[#181818] border border-[#2B2925] p-5 rounded-sm space-y-1">
              <span className="text-[11px] text-[#8C8273] uppercase tracking-wider block">
                Schedule Status
              </span>
              <span
                className={`text-sm font-semibold block pt-2 ${
                  overview.hasUnconfirmedHours ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {overview.hasUnconfirmedHours ? 'Draft Pending' : 'Confirmed Active'}
              </span>
              <span className="text-[10px] text-[#8C8273] block">Europe/London Time</span>
            </div>
          </div>

          {/* Quick Actions & Recent Appointments */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 bg-[#181818] border border-[#2B2925] p-6 rounded-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#262420] pb-3">
                <h3 className="font-serif-heading text-xl text-[#F5F1EA]">
                  Recent Bookings Snapshot
                </h3>
                <button
                  onClick={() => setActiveTab('appointments')}
                  className="text-xs text-[#BFA57D] hover:underline"
                >
                  View All Appointments
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#D9D1C5]">
                  <thead className="text-[10px] uppercase text-[#8C8273] border-b border-[#262626]">
                    <tr>
                      <th className="py-2.5">Ref</th>
                      <th className="py-2.5">Date & Time</th>
                      <th className="py-2.5">Client</th>
                      <th className="py-2.5">Service</th>
                      <th className="py-2.5">Stylist</th>
                      <th className="py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222]">
                    {overview.recentAppointments.map((app: any) => (
                      <tr key={app.id} className="hover:bg-[#1C1C1C]">
                        <td className="py-2.5 font-mono-numbers text-[#BFA57D]">
                          {app.booking_reference}
                        </td>
                        <td className="py-2.5 font-mono-numbers">
                          {app.london_date} {app.london_time}
                        </td>
                        <td className="py-2.5 font-medium text-[#F5F1EA]">
                          {app.customer_name}
                        </td>
                        <td className="py-2.5">{app.booked_service_name}</td>
                        <td className="py-2.5 text-[#A69B8D]">{app.staff_name}</td>
                        <td className="py-2.5">
                          <span
                            className={`text-[10px] uppercase px-1.5 py-0.5 rounded-xs ${
                              app.status === 'confirmed'
                                ? 'bg-emerald-950 text-emerald-300'
                                : app.status === 'cancelled'
                                ? 'bg-red-950 text-red-300'
                                : 'bg-[#2A2A2A] text-[#A69B8D]'
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions Column */}
            <div className="lg:col-span-4 bg-[#181818] border border-[#2B2925] p-6 rounded-sm space-y-4">
              <h3 className="font-serif-heading text-xl text-[#F5F1EA] border-b border-[#262420] pb-3">
                Quick Actions
              </h3>

              <div className="space-y-2">
                <button
                  onClick={() => setShowManualModal(true)}
                  className="w-full flex items-center justify-between text-xs bg-[#24221F] hover:bg-[#9B8058] hover:text-[#141414] text-[#D9D1C5] p-3 rounded-sm transition-colors"
                >
                  <span className="font-semibold">New Manual Booking</span>
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={exportingCsv}
                  className="w-full flex items-center justify-between text-xs bg-[#24221F] hover:bg-[#9B8058] hover:text-[#141414] text-[#D9D1C5] p-3 rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                  title="Download all appointments as CSV"
                >
                  <span className="font-semibold">{exportingCsv ? 'Exporting CSV...' : 'Export Appointments (CSV)'}</span>
                  {exportingCsv ? <RefreshCw className="w-4 h-4 animate-spin text-[#9B8058]" /> : <Download className="w-4 h-4 text-[#9B8058]" />}
                </button>

                <button
                  onClick={() => setActiveTab('qatest')}
                  className="w-full flex items-center justify-between text-xs bg-[#24221F] hover:bg-[#9B8058] hover:text-[#141414] text-[#D9D1C5] p-3 rounded-sm transition-colors"
                >
                  <span className="font-semibold">Run QA Acceptance Suite</span>
                  <Play className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-4 border-t border-[#262420] text-xs text-[#8C8273] space-y-2">
                <strong className="text-[#D9D1C5] block font-medium">Launch Readiness</strong>
                <ul className="space-y-1 text-[11px]">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Verified staff profiles configured (6 members)
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    48hr patch test rules active on colour
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Double-booking atomic protection active
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APPOINTMENTS & CALENDAR */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            <div className="bg-[#181818] border border-[#2B2925] p-3.5 rounded-sm">
              <span className="text-[10px] uppercase tracking-wider text-[#8C8273] block">Total Bookings</span>
              <span className="font-serif-heading text-2xl text-[#F5F1EA] font-semibold">{appointments.length}</span>
            </div>
            <div className="bg-[#181818] border border-[#2B2925] p-3.5 rounded-sm">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 block">Confirmed</span>
              <span className="font-serif-heading text-2xl text-emerald-300 font-semibold">
                {appointments.filter((a) => a.status === 'confirmed').length}
              </span>
            </div>
            <div className="bg-[#181818] border border-[#2B2925] p-3.5 rounded-sm">
              <span className="text-[10px] uppercase tracking-wider text-blue-400 block">Checked In</span>
              <span className="font-serif-heading text-2xl text-blue-300 font-semibold">
                {appointments.filter((a) => a.status === 'checked_in').length}
              </span>
            </div>
            <div className="bg-[#181818] border border-[#2B2925] p-3.5 rounded-sm">
              <span className="text-[10px] uppercase tracking-wider text-[#D9D1C5] block">Completed</span>
              <span className="font-serif-heading text-2xl text-[#F5F1EA] font-semibold">
                {appointments.filter((a) => a.status === 'completed').length}
              </span>
            </div>
            <div className="bg-[#181818] border border-[#2B2925] p-3.5 rounded-sm col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase tracking-wider text-[#BFA57D] block">Est. Total Value</span>
              <span className="font-serif-heading text-2xl text-[#BFA57D] font-semibold">
                £{appointments.reduce((sum, a) => sum + (Number(a.booked_price) || 0), 0).toFixed(0)}
              </span>
            </div>
          </div>

          {/* Notification Banner within Appointments Tab */}
          {notificationMsg && (
            <div
              className={`p-3.5 rounded-sm text-xs flex items-center justify-between shadow-md ${
                notificationMsg.type === 'success'
                  ? 'bg-emerald-950/70 border border-emerald-700 text-emerald-200'
                  : 'bg-red-950/70 border border-red-700 text-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {notificationMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{notificationMsg.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotificationMsg(null)}
                className="underline text-[11px] ml-4 hover:text-white cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#181818] p-4 rounded-sm border border-[#262626]">
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <select
                value={apptFilterStatus}
                onChange={(e) => setApptFilterStatus(e.target.value)}
                className="bg-[#141414] border border-[#2E2E2E] text-xs text-[#F5F1EA] px-3 py-2 rounded-sm focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="checked_in">Checked In</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>

              {/* Stylist Filter */}
              <select
                value={apptFilterStaff}
                onChange={(e) => setApptFilterStaff(e.target.value)}
                className="bg-[#141414] border border-[#2E2E2E] text-xs text-[#F5F1EA] px-3 py-2 rounded-sm focus:outline-none"
              >
                <option value="all">All Stylists</option>
                {staff.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search ref, name, phone..."
                  value={apptSearch}
                  onChange={(e) => setApptSearch(e.target.value)}
                  className="bg-[#141414] border border-[#2E2E2E] text-xs text-[#F5F1EA] pl-3 pr-8 py-2 rounded-sm focus:outline-none w-48 sm:w-60"
                />
                <button
                  onClick={loadAppointments}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C8273]"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={exportingCsv}
                className="bg-[#24221F] hover:bg-[#9B8058] hover:text-[#141414] text-[#D9D1C5] font-semibold text-xs px-3.5 py-2 rounded-sm border border-[#3E382E] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Download all appointments as CSV file"
              >
                {exportingCsv ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-[#9B8058]" />}
                <span>{exportingCsv ? 'Exporting...' : 'Export CSV'}</span>
              </button>

              <button
                onClick={() => setShowManualModal(true)}
                className="bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-sm transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Manual Booking</span>
              </button>

              <button
                onClick={loadAppointments}
                className="p-2 border border-[#333] hover:border-white text-[#D9D1C5] rounded-sm transition-colors cursor-pointer"
                title="Refresh List"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAppts ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Appointments Table */}
          <div className="bg-[#181818] border border-[#262626] rounded-sm overflow-x-auto">
            <table className="w-full text-left text-xs text-[#D9D1C5]">
              <thead className="bg-[#151515] text-[10px] uppercase text-[#8C8273] border-b border-[#262626]">
                <tr>
                  <th className="p-3.5">Ref</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Client & Phone</th>
                  <th className="p-3.5">Service Snapshot</th>
                  <th className="p-3.5">Stylist</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Internal Notes</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[#8C8273]">
                      No appointments matching this filter.
                    </td>
                  </tr>
                ) : (
                  appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-[#1A1A1A]">
                      <td className="p-3.5 font-mono-numbers text-[#BFA57D] font-medium">
                        {a.booking_reference}
                      </td>
                      <td className="p-3.5 font-mono-numbers">
                        <div className="text-[#F5F1EA]">{a.london_date}</div>
                        <div className="text-[11px] text-[#8C8273]">{a.london_time}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-[#F5F1EA]">{a.customer_name}</div>
                        <div className="text-[11px] text-[#8C8273] font-mono-numbers">{a.customer_phone}</div>
                      </td>
                      <td className="p-3.5">
                        <div>{a.booked_service_name}</div>
                        <div className="text-[11px] text-[#8C8273] font-mono-numbers">
                          {a.booked_duration_minutes}m · £{Number(a.booked_price).toFixed(2)}
                        </div>
                      </td>
                      <td className="p-3.5 text-[#D9D1C5]">{a.staff_name}</td>
                      <td className="p-3.5">
                        <select
                          value={a.status}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'cancelled') {
                              setSelectedApptForCancel(a);
                              setCancellationReason('Client requested cancellation');
                            } else {
                              handleStatusChange(a.id, val);
                            }
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-xs border focus:outline-none font-medium cursor-pointer transition-colors ${
                            a.status === 'confirmed'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                              : a.status === 'checked_in'
                              ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                              : a.status === 'completed'
                              ? 'bg-[#252525] text-white border-[#444]'
                              : a.status === 'cancelled'
                              ? 'bg-red-950/80 text-red-300 border-red-800'
                              : 'bg-amber-950/80 text-amber-300 border-amber-800'
                          }`}
                        >
                          <option value="confirmed">confirmed</option>
                          <option value="checked_in">checked_in</option>
                          <option value="completed">completed</option>
                          <option value="cancelled">cancelled</option>
                          <option value="no_show">no_show</option>
                        </select>
                      </td>
                      <td className="p-3.5 min-w-[220px]">
                        {editingNoteApptId === a.id ? (
                          <div className="space-y-2 p-2.5 bg-[#141414] border border-[#9B8058] rounded-sm shadow-xl">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-[#BFA57D] uppercase tracking-wider block">
                                Staff Note · {a.booking_reference}
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingNoteApptId(null)}
                                className="text-[#8C8273] hover:text-white p-0.5 rounded cursor-pointer"
                                title="Cancel editing"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <textarea
                              rows={3}
                              autoFocus
                              value={inlineInternalNote}
                              onChange={(e) => setInlineInternalNote(e.target.value)}
                              placeholder="Formulas, skin patch test date, styling preferences..."
                              className="w-full bg-[#1C1A17] border border-[#3E382E] text-xs text-[#F5F1EA] p-2 rounded-xs focus:outline-none focus:border-[#9B8058]"
                            />
                            {a.notes && (
                              <div className="text-[10px] text-[#8C8273] italic border-t border-[#262626] pt-1">
                                Client Note: {a.notes}
                              </div>
                            )}
                            <div className="flex items-center justify-end gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingNoteApptId(null)}
                                className="px-2.5 py-1 text-[11px] text-[#8C8273] hover:text-white rounded border border-[#333] cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={inlineSaving}
                                onClick={() => handleSaveInlineNote(a.id)}
                                className="px-3 py-1 bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold text-[11px] rounded flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {inlineSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                <span>{inlineSaving ? 'Saving...' : 'Save Note'}</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNoteApptId(a.id);
                                setInlineInternalNote(a.internal_notes || '');
                              }}
                              className="inline-flex items-center gap-1.5 text-[11px] text-[#BFA57D] hover:text-[#F5F1EA] hover:underline cursor-pointer font-medium"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#9B8058]" />
                              <span>{a.internal_notes || a.notes ? 'Edit Note' : '+ Add Note'}</span>
                            </button>
                            {a.internal_notes && (
                              <div
                                onClick={() => {
                                  setEditingNoteApptId(a.id);
                                  setInlineInternalNote(a.internal_notes || '');
                                }}
                                className="text-[10px] text-[#D9D1C5] bg-[#24201A] border border-[#3E3425] px-2 py-0.5 rounded-xs truncate max-w-[190px] cursor-pointer hover:border-[#9B8058]"
                                title={`Internal: ${a.internal_notes} (Click to edit)`}
                              >
                                {a.internal_notes}
                              </div>
                            )}
                            {a.notes && !a.internal_notes && (
                              <div
                                onClick={() => {
                                  setEditingNoteApptId(a.id);
                                  setInlineInternalNote('');
                                }}
                                className="text-[10px] text-[#8C8273] truncate max-w-[190px] italic cursor-pointer hover:text-[#D9D1C5]"
                                title={`Client: ${a.notes} (Click to add staff note)`}
                              >
                                Client: {a.notes}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {a.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedApptForCancel(a);
                                setCancellationReason('Client requested cancellation');
                              }}
                              className="text-[11px] text-red-400 hover:text-red-200 hover:bg-red-950/70 px-2 py-1 rounded border border-red-900/60 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                              title="Cancel this appointment"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Cancel</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDownloadIcs(a.booking_reference)}
                            className="text-[#8C8273] hover:text-[#F5F1EA] p-1.5 rounded hover:bg-[#252525] transition-colors cursor-pointer"
                            title="Download Calendar Invite (.ics)"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: SERVICES CATALOGUE CRUD */}
      {activeTab === 'services' && (
        <AdminServicesManager
          staffList={staff}
          onRefreshGlobalData={onRefreshData}
        />
      )}

      {/* TAB: STYLISTS & TEAM CRUD */}
      {activeTab === 'staff' && (
        <AdminStaffManager
          services={services}
          onRefreshGlobalData={onRefreshData}
        />
      )}

      {/* TAB: SCHEDULES, SALON HOURS & ROSTER */}
      {activeTab === 'schedules' && (
        <AdminSchedulesManager
          staffList={staff}
          onRefreshGlobalData={onRefreshData}
        />
      )}

      {/* TAB 5: SALONIQ MIGRATION */}
      {activeTab === 'saloniq' && (
        <div className="space-y-6">
          <div className="bg-[#181818] border border-[#2B2925] p-6 sm:p-8 rounded-sm space-y-6">
            <h3 className="font-serif-heading text-2xl text-[#F5F1EA]">
              SalonIQ Migration & Cutover Management
            </h3>

            <p className="text-xs sm:text-sm text-[#A69B8D] leading-relaxed">
              The salon currently has existing booking links pointing to SalonIQ. To prevent overlapping double-bookings, one authoritative calendar must be established before full marketing transition.
            </p>

            <div className="bg-[#141414] p-5 rounded-sm border border-[#242424] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold text-[#D9D1C5]">
                  Authoritative Cutover Status:
                </span>
                <span
                  className={`text-xs font-bold uppercase px-2.5 py-1 rounded-xs ${
                    saloniqData?.cutoverConfirmed
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {saloniqData?.cutoverConfirmed
                    ? 'Native App Authoritative'
                    : 'SalonIQ External Link Active'}
                </span>
              </div>

              <p className="text-xs text-[#8C8273]">
                Current SalonIQ Portal:{' '}
                <a
                  href="https://s-iq.co/BookingPortal/dist/?salonid=e319696e-dc88-4da6-9dd5-d7232d7efe68&tab=book"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[#BFA57D] underline inline-flex items-center gap-1"
                >
                  Open SalonIQ Portal <ExternalLink className="w-3 h-3" />
                </a>
              </p>

              <div className="pt-2">
                <button
                  disabled={cutoverUpdating}
                  onClick={() => handleToggleCutover(!saloniqData?.cutoverConfirmed)}
                  className="bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-sm transition-colors"
                >
                  {saloniqData?.cutoverConfirmed
                    ? 'Revert Authoritative Flag to SalonIQ'
                    : 'Confirm Native Cutover Launch'}
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#262420]">
              <strong className="text-xs text-[#F5F1EA] block font-medium">
                Authoritative Calendar Launch Requirements:
              </strong>
              <ul className="list-disc pl-5 space-y-1 text-xs text-[#8C8273]">
                <li>Reconcile imported future appointments with native slots.</li>
                <li>Verify staff working rosters and approved holidays for all 6 stylists.</li>
                <li>Confirm official opening hours in the Operating Hours panel.</li>
                <li>Update external website CTA links to point directly to this booking system.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: NOTIFICATION OUTBOX */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif-heading text-2xl text-[#F5F1EA]">
                Transactional Notification Outbox
              </h3>
              <p className="text-xs text-[#8C8273] mt-1">
                Automated customer confirmations, reminders, and cancellations dispatched immediately via Resend API or SMTP.
              </p>
            </div>
            <button
              onClick={loadNotifications}
              className="text-xs text-[#BFA57D] hover:underline flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Logs</span>
            </button>
          </div>

          {/* Email Provider Active Status & Diagnostic Test Dispatcher */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Provider Configuration Card */}
            <div className="lg:col-span-2 bg-[#181818] border border-[#262626] p-4 sm:p-5 rounded-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold text-[#8C8273] tracking-wider">
                  Active Dispatch Provider
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-xs ${
                    emailProviderStatus?.activeProvider === 'resend'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : emailProviderStatus?.activeProvider === 'smtp'
                      ? 'bg-blue-950 text-blue-300 border border-blue-800'
                      : 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                  }`}
                >
                  {emailProviderStatus?.activeProvider === 'resend'
                    ? 'Resend API (Live)'
                    : emailProviderStatus?.activeProvider === 'smtp'
                    ? 'SMTP Transport (Live)'
                    : 'Local Outbox (Simulated)'}
                </span>
              </div>

              <div className="text-xs text-[#D9D1C5] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#8C8273]">Sender Address:</span>
                  <span className="font-mono text-[#F5F1EA] text-[11px] truncate max-w-[260px]">
                    {emailProviderStatus?.fromEmail || 'appointments@georgedavishairdressing.co.uk'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8C8273]">Status:</span>
                  <span className="text-[#BFA57D]">
                    {emailProviderStatus?.description || 'Loading provider configuration...'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#222] text-[11px] text-[#8C8273] leading-relaxed">
                💡 To activate live external email delivery, set <code className="text-[#BFA57D]">RESEND_API_KEY</code> or <code className="text-[#BFA57D]">SMTP_HOST</code> in your environment variables.
              </div>
            </div>

            {/* Test Email Dispatch Form */}
            <div className="bg-[#181818] border border-[#262626] p-4 sm:p-5 rounded-sm space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-semibold text-[#8C8273] tracking-wider block">
                  Send Test Notification
                </span>
                <p className="text-[11px] text-[#8C8273] mt-1">
                  Trigger an immediate test email to verify credentials and template delivery.
                </p>
              </div>

              <form onSubmit={handleSendTestEmail} className="space-y-2">
                <input
                  type="email"
                  required
                  placeholder="recipient@example.com"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  className="w-full bg-[#121212] border border-[#333] rounded px-3 py-1.5 text-xs text-[#F5F1EA] focus:outline-none focus:border-[#9B8058]"
                />
                <button
                  type="submit"
                  disabled={sendingTestEmail}
                  className="w-full bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold text-xs uppercase tracking-wider py-2 rounded-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {sendingTestEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  <span>{sendingTestEmail ? 'Sending...' : 'Send Test Email'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Outbox Logs Table */}
          <div className="bg-[#181818] border border-[#262626] rounded-sm overflow-x-auto">
            <table className="w-full text-left text-xs text-[#D9D1C5]">
              <thead className="bg-[#151515] text-[10px] uppercase text-[#8C8273] border-b border-[#262626]">
                <tr>
                  <th className="p-3">Created</th>
                  <th className="p-3">Recipient</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {notifications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#8C8273]">
                      No notification logs recorded yet. Bookings will automatically generate entries here.
                    </td>
                  </tr>
                ) : (
                  notifications.map((n) => (
                    <tr key={n.id} className="hover:bg-[#1E1E1E] transition-colors">
                      <td className="p-3 font-mono-numbers text-[#8C8273]">
                        {n.created_at ? n.created_at.replace('T', ' ').substring(0, 16) : '—'}
                      </td>
                      <td className="p-3 font-medium text-[#F5F1EA]">{n.recipient_email}</td>
                      <td className="p-3 uppercase text-[10px] text-[#BFA57D] font-mono">{n.type}</td>
                      <td className="p-3 font-mono text-[10px] text-[#A69B8D]">{n.provider}</td>
                      <td className="p-3 truncate max-w-xs">{n.subject}</td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] uppercase px-1.5 py-0.5 rounded-xs font-semibold ${
                            n.status === 'sent'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : n.status === 'failed'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : 'bg-[#2A2620] text-[#BFA57D] border border-[#3E382E]'
                          }`}
                        >
                          {n.status === 'simulated' ? 'Simulated' : n.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedNotificationForDetail(n)}
                            className="text-[11px] text-[#8C8273] hover:text-white underline cursor-pointer"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRetryNotif(n.id)}
                            className="text-[11px] text-[#9B8058] hover:text-[#BFA57D] font-medium cursor-pointer"
                          >
                            Retry
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Message Detail Modal */}
          {selectedNotificationForDetail && (
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedNotificationForDetail(null);
              }}
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
            >
              <div className="bg-[#181818] border border-[#2B2925] rounded-sm max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 text-xs shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                  <h3 className="font-serif-heading text-lg text-[#F5F1EA]">
                    Notification Message Details
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedNotificationForDetail(null)}
                    className="text-[#8C8273] hover:text-white p-1 rounded cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 bg-[#141414] p-3 rounded-sm border border-[#222]">
                  <div>
                    <span className="text-[#8C8273] block text-[10px] uppercase">To:</span>
                    <span className="text-[#F5F1EA] font-semibold">{selectedNotificationForDetail.recipient_email}</span>
                  </div>
                  <div>
                    <span className="text-[#8C8273] block text-[10px] uppercase">Subject:</span>
                    <span className="text-[#BFA57D]">{selectedNotificationForDetail.subject}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#8C8273] block text-[10px] uppercase">Provider:</span>
                      <span className="font-mono text-[#D9D1C5]">{selectedNotificationForDetail.provider}</span>
                    </div>
                    <div>
                      <span className="text-[#8C8273] block text-[10px] uppercase">Status:</span>
                      <span className="font-mono text-[#D9D1C5]">{selectedNotificationForDetail.status}</span>
                    </div>
                  </div>
                </div>

                {selectedNotificationForDetail.error_details && (
                  <div className="bg-red-950/40 border border-red-900/60 p-3 rounded text-red-300 text-[11px] space-y-1">
                    <strong className="block text-red-200">Delivery Diagnostics / Error:</strong>
                    <span>{selectedNotificationForDetail.error_details}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-[#8C8273] block text-[10px] uppercase font-semibold">Message Plaintext Body:</span>
                  <pre className="bg-[#121110] border border-[#262420] p-3 rounded text-[11px] text-[#D9D1C5] whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                    {selectedNotificationForDetail.content}
                  </pre>
                </div>

                <div className="flex justify-end pt-2 border-t border-[#262420]">
                  <button
                    type="button"
                    onClick={() => setSelectedNotificationForDetail(null)}
                    className="bg-[#24221F] hover:bg-[#333] text-[#D9D1C5] px-4 py-2 rounded-sm text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif-heading text-2xl text-[#F5F1EA]">
              Administrative Security Audit Trail
            </h3>
            <span className="text-xs text-[#8C8273]">Immutable Change Log</span>
          </div>

          <div className="bg-[#181818] border border-[#262626] rounded-sm overflow-x-auto">
            <table className="w-full text-left text-xs text-[#D9D1C5]">
              <thead className="bg-[#151515] text-[10px] uppercase text-[#8C8273] border-b border-[#262626]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="p-3 font-mono-numbers text-[#8C8273]">
                      {log.created_at.split('T')[0]} {log.created_at.split('T')[1].substring(0, 8)}
                    </td>
                    <td className="p-3 text-[#F5F1EA]">{log.user_email}</td>
                    <td className="p-3 font-mono-numbers text-[#BFA57D] uppercase text-[10px]">
                      {log.action}
                    </td>
                    <td className="p-3 text-[#8C8273]">{log.entity_type}</td>
                    <td className="p-3">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: QA ACCEPTANCE TESTS */}
      {activeTab === 'qatest' && (
        <div className="space-y-6">
          <div className="bg-[#181818] border border-[#2B2925] p-6 sm:p-8 rounded-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262420] pb-4">
              <div>
                <h3 className="font-serif-heading text-2xl text-[#F5F1EA]">
                  Automated QA Acceptance Suite
                </h3>
                <p className="text-xs text-[#8C8273]">
                  Executes the 11 end-to-end acceptance scenarios live against the SQLite database and booking engine.
                </p>
              </div>

              <button
                disabled={qaRunning}
                onClick={handleRunQaTests}
                className="bg-[#9B8058] hover:bg-[#856C47] disabled:opacity-40 text-[#141414] font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-sm transition-colors flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{qaRunning ? 'Running Tests...' : 'Execute Full QA Suite'}</span>
              </button>
            </div>

            {qaResults && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-sm flex items-center justify-between text-xs font-semibold ${
                    qaResults.allPassed
                      ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
                      : 'bg-red-950/60 border border-red-800 text-red-200'
                  }`}
                >
                  <span>
                    {qaResults.allPassed
                      ? 'ALL 11 ACCEPTANCE SCENARIOS PASSED SUCCESSFULLY'
                      : 'SOME SCENARIOS FAILED'}
                  </span>
                  <span className="font-mono-numbers">
                    Verified at {qaResults.timestamp.split('T')[1].substring(0, 8)} UTC
                  </span>
                </div>

                <div className="space-y-2">
                  {qaResults.results.map((res: any) => (
                    <div
                      key={res.id}
                      className="bg-[#141414] border border-[#262626] p-4 rounded-sm flex items-start justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              res.passed
                                ? 'bg-emerald-900 text-emerald-200'
                                : 'bg-red-900 text-red-200'
                            }`}
                          >
                            {res.passed ? '✓' : '✗'}
                          </span>
                          <strong className="text-[#F5F1EA]">
                            Scenario {res.id}: {res.scenario}
                          </strong>
                        </div>
                        <p className="text-[#A69B8D] pl-6">{res.message}</p>
                      </div>

                      <span className="font-mono-numbers text-[10px] text-[#8C8273] shrink-0">
                        {res.durationMs}ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUPABASE BACKEND TAB */}
      {activeTab === 'supabase' && (
        <div className="space-y-6">
          <div className="bg-[#181818] border border-[#262626] rounded-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#BFA57D]" />
                  <h2 className="font-serif-heading text-xl text-[#F5F1EA]">
                    Supabase Backend Integration
                  </h2>
                </div>
                <p className="text-xs text-[#8C8273] mt-1">
                  Synchronizes appointment booking form submissions directly to your external Supabase PostgreSQL database.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadSupabaseStatus}
                  disabled={supabaseLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] hover:bg-[#2A2A2A] text-xs text-[#D9D1C5] rounded-sm border border-[#333]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${supabaseLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={handleTestSupabaseSync}
                  disabled={supabaseTesting}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold text-xs rounded-sm transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  {supabaseTesting ? 'Testing Sync...' : 'Test Supabase Sync'}
                </button>
              </div>
            </div>

            {/* Connection Details Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#141414] border border-[#262420] p-4 rounded-sm space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#8C8273]">Project ID</span>
                <p className="font-mono text-sm text-[#F5F1EA] font-semibold">
                  {supabaseStatus?.projectId || 'trdmxjurfvzhjeqmaoir'}
                </p>
                <div className="flex items-center gap-1.5 pt-1 text-[11px] text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Connected Gateway
                </div>
              </div>

              <div className="bg-[#141414] border border-[#262420] p-4 rounded-sm space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#8C8273]">API Endpoint</span>
                <p className="font-mono text-xs text-[#A69B8D] truncate">
                  {supabaseStatus?.url || 'https://trdmxjurfvzhjeqmaoir.supabase.co'}
                </p>
                <div className="text-[11px] text-[#8C8273] pt-1">
                  Key: <span className="text-[#D9D1C5] font-mono">sb_publishable_...</span> (Active)
                </div>
              </div>

              <div className="bg-[#141414] border border-[#262420] p-4 rounded-sm space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#8C8273]">Backend Tables</span>
                <div className="flex items-center gap-3 pt-1">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-sm ${
                    supabaseStatus?.tables?.appointments
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950/60 text-amber-300 border border-amber-800/80'
                  }`}>
                    {supabaseStatus?.tables?.appointments ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    appointments
                  </span>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-sm ${
                    supabaseStatus?.tables?.bookings
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-[#222] text-[#8C8273] border border-[#333]'
                  }`}>
                    bookings
                  </span>
                </div>
                <p className="text-[10px] text-[#8C8273] pt-0.5">
                  {supabaseStatus?.tables?.appointments
                    ? 'Target table detected in Supabase schema'
                    : 'Awaiting table creation in Supabase'}
                </p>
              </div>
            </div>

            {/* Test Sync Result Banner */}
            {supabaseTestResult && (
              <div className={`p-4 rounded-sm border text-xs space-y-2 ${
                supabaseTestResult.result?.success
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                  : 'bg-amber-950/40 border-amber-800 text-amber-200'
              }`}>
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-2">
                    {supabaseTestResult.result?.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                    {supabaseTestResult.result?.success
                      ? `Sync Successful: Appointment saved to Supabase '${supabaseTestResult.result.table}' table!`
                      : 'Sync Test Attempted'}
                  </span>
                  <span className="font-mono text-[10px]">
                    {supabaseTestResult.appointment?.booking_reference}
                  </span>
                </div>
                {supabaseTestResult.result?.error && (
                  <p className="text-amber-300/90 text-[11px] bg-black/30 p-2 rounded-xs border border-amber-900/50">
                    {supabaseTestResult.result.error}
                  </p>
                )}
              </div>
            )}

            {/* SQL Table Creation Guide */}
            <div className="bg-[#141414] border border-[#2B2925] rounded-sm p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-serif-heading text-sm text-[#F5F1EA] flex items-center gap-1.5">
                    <span>1-Click Supabase Table Setup</span>
                  </h3>
                  <p className="text-[11px] text-[#8C8273]">
                    If you have not created the table yet, paste this SQL in your{' '}
                    <a
                      href="https://supabase.com/dashboard/project/trdmxjurfvzhjeqmaoir/sql/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#BFA57D] hover:underline inline-flex items-center gap-0.5"
                    >
                      Supabase SQL Editor <ExternalLink className="w-2.5 h-2.5" />
                    </a>{' '}
                    and click <strong>Run</strong>.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (supabaseStatus?.sqlSetupScript) {
                      navigator.clipboard.writeText(supabaseStatus.sqlSetupScript);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 2500);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#262420] hover:bg-[#333] text-[#F5F1EA] text-xs rounded-sm border border-[#3A3830] transition-colors self-start sm:self-auto"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#BFA57D]" />}
                  {copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Schema'}
                </button>
              </div>

              <pre className="bg-[#0D0D0D] border border-[#222] p-3 rounded-sm text-[11px] font-mono text-[#A69B8D] overflow-x-auto max-h-56 leading-relaxed">
                {supabaseStatus?.sqlSetupScript || `-- Loading SQL schema script...`}
              </pre>
            </div>

            {/* Live Sync History */}
            <div className="space-y-3">
              <h3 className="font-serif-heading text-sm text-[#F5F1EA]">
                Recent Supabase Sync Activity
              </h3>
              {supabaseStatus?.recentLogs && supabaseStatus.recentLogs.length > 0 ? (
                <div className="border border-[#262626] rounded-sm overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#141414] text-[#8C8273] uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">Reference</th>
                        <th className="p-3">Client</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Table</th>
                        <th className="p-3">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262626]">
                      {supabaseStatus.recentLogs.map((log: any, idx: number) => (
                        <tr key={idx} className="hover:bg-[#1C1C1C]">
                          <td className="p-3 font-mono font-bold text-[#F5F1EA]">
                            {log.booking_reference}
                          </td>
                          <td className="p-3 text-[#D9D1C5]">
                            <div>{log.customer_name}</div>
                            <div className="text-[10px] text-[#8C8273]">{log.customer_email}</div>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-sm ${
                              log.success
                                ? 'bg-emerald-950 text-emerald-300'
                                : 'bg-red-950 text-red-300'
                            }`}>
                              {log.success ? 'Saved to Supabase' : 'Pending Schema'}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-[#A69B8D]">
                            {log.table_used || '—'}
                          </td>
                          <td className="p-3 text-[#8C8273] font-mono-numbers text-[10px]">
                            {new Date(log.timestamp).toLocaleTimeString('en-GB')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-[#141414] border border-[#262420] p-6 rounded-sm text-center text-xs text-[#8C8273]">
                  No appointment booking submissions synced yet. When clients complete the booking form, submissions appear here in real-time.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MANUAL BOOKING MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-[#2B2925] rounded-sm max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#262420] pb-3">
              <h3 className="font-serif-heading text-xl text-[#F5F1EA]">
                Manual Reception Booking
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-xs text-[#8C8273] hover:text-white"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleManualCreateAppointment} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-[#D9D1C5]">Treatment *</label>
                <select
                  required
                  value={manualServiceId}
                  onChange={(e) => setManualServiceId(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2A2A2A] px-3 py-2 text-[#F5F1EA] rounded-sm"
                >
                  <option value="">Select Treatment...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (£{s.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[#D9D1C5]">Stylist</label>
                <select
                  value={manualStaffId}
                  onChange={(e) => setManualStaffId(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2A2A2A] px-3 py-2 text-[#F5F1EA] rounded-sm"
                >
                  <option value="">Any Available Stylist</option>
                  {staff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[#D9D1C5]">Date</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2A2A2A] px-3 py-2 text-[#F5F1EA] rounded-sm font-mono-numbers"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[#D9D1C5]">Time (London)</label>
                  <input
                    type="time"
                    required
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2A2A2A] px-3 py-2 text-[#F5F1EA] rounded-sm font-mono-numbers"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[#D9D1C5]">Client Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Client name"
                  value={manualCustName}
                  onChange={(e) => setManualCustName(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2A2A2A] px-3 py-2 text-[#F5F1EA] rounded-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[#D9D1C5]">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={manualCustEmail}
                    onChange={(e) => setManualCustEmail(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2A2A2A] px-3 py-2 text-[#F5F1EA] rounded-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[#D9D1C5]">Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="07700 900123"
                    value={manualCustPhone}
                    onChange={(e) => setManualCustPhone(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2A2A2A] px-3 py-2 text-[#F5F1EA] rounded-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[#D9D1C5]">Notes</label>
                <input
                  type="text"
                  placeholder="Walk-in, telephone booking, etc."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2A2A2A] px-3 py-2 text-[#F5F1EA] rounded-sm"
                />
              </div>

              <div className="pt-3 border-t border-[#262420] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 text-[#8C8273] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting}
                  className="bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold px-6 py-2 rounded-sm"
                >
                  {manualSubmitting ? 'Creating...' : 'Create Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTERNAL & CLIENT NOTES MODAL */}
      {selectedApptForNotes && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedApptForNotes(null);
          }}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-[#181818] border border-[#2B2925] rounded-sm max-w-lg w-full max-h-[88vh] overflow-y-auto p-6 space-y-5 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3 sticky top-0 bg-[#181818] z-10">
              <div>
                <h3 className="font-serif-heading text-xl text-[#F5F1EA]">
                  Appointment Notes
                </h3>
                <span className="text-[11px] font-mono text-[#BFA57D]">
                  Ref: {selectedApptForNotes.booking_reference} · {selectedApptForNotes.customer_name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApptForNotes(null)}
                className="text-[#8C8273] hover:text-white p-1 rounded cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Client's Booking Comments */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8C8273]">
                Client Booking Request / Instructions
              </label>
              <textarea
                rows={2}
                value={customerNotesText}
                onChange={(e) => setCustomerNotesText(e.target.value)}
                placeholder="Client notes from online booking (e.g. hair history, previous colours, sensitivity)..."
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-sm p-3 text-[#F5F1EA] focus:outline-none focus:border-[#9B8058]"
              />
            </div>

            {/* Confidential Staff / Salon Notes */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#BFA57D]">
                Confidential Staff Notes (Internal)
              </label>
              <textarea
                rows={4}
                value={internalNotesText}
                onChange={(e) => setInternalNotesText(e.target.value)}
                placeholder="Private salon notes (colour formulas, developer vol, skin patch test date, client preferences)..."
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-sm p-3 text-[#F5F1EA] focus:outline-none focus:border-[#9B8058]"
              />
              <span className="text-[10px] text-[#8C8273] block">
                Staff notes are confidential and only visible in the admin panel.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#2A2A2A]">
              <button
                type="button"
                onClick={() => setSelectedApptForNotes(null)}
                className="px-4 py-2 text-[#8C8273] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={notesSaving}
                onClick={handleSaveInternalNotes}
                className="bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold px-5 py-2 rounded-sm transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {notesSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{notesSaving ? 'Saving Notes...' : 'Save Notes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCELLATION CONFIRMATION MODAL */}
      {selectedApptForCancel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-[#3E2522] rounded-md max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-950 border border-red-800 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif-heading text-xl text-[#F5F1EA]">
                  Cancel Appointment?
                </h3>
                <p className="text-xs text-[#8C8273]">
                  This will transition the appointment status to <strong className="text-red-400">cancelled</strong> and release the slot in the salon calendar.
                </p>
              </div>
            </div>

            <div className="bg-[#141414] border border-[#262626] p-3.5 rounded text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-[#8C8273]">Reference:</span>
                <span className="text-[#BFA57D] font-bold">{selectedApptForCancel.booking_reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C8273]">Client:</span>
                <span className="text-[#F5F1EA]">{selectedApptForCancel.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C8273]">Service:</span>
                <span className="text-[#D9D1C5]">{selectedApptForCancel.booked_service_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C8273]">Date & Time:</span>
                <span className="text-[#F5F1EA]">{selectedApptForCancel.london_date} at {selectedApptForCancel.london_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C8273]">Stylist:</span>
                <span className="text-[#D9D1C5]">{selectedApptForCancel.staff_name}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#D9D1C5] font-medium block">
                Reason for Cancellation
              </label>
              <input
                type="text"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="e.g. Client requested cancellation, illness, rescheduled"
                className="w-full bg-[#121212] border border-[#333] rounded px-3 py-2 text-xs text-[#F5F1EA] focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={cancellingLoading}
                onClick={() => setSelectedApptForCancel(null)}
                className="px-4 py-2 text-xs text-[#A69B8D] hover:text-white transition-colors cursor-pointer"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                disabled={cancellingLoading}
                onClick={async () => {
                  setCancellingLoading(true);
                  const targetId = selectedApptForCancel.id;
                  const reason = cancellationReason.trim() || 'Cancelled by salon administrator';
                  setSelectedApptForCancel(null);
                  try {
                    await handleStatusChange(targetId, 'cancelled', reason);
                  } finally {
                    setCancellingLoading(false);
                  }
                }}
                className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-semibold text-xs px-5 py-2.5 rounded-sm transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg active:translate-y-px"
              >
                <XCircle className="w-4 h-4" />
                <span>{cancellingLoading ? 'Cancelling...' : 'Confirm Cancellation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
