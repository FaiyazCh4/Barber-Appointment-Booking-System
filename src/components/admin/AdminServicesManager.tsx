import React, { useState, useEffect } from 'react';
import {
  Scissors,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Search,
  Filter,
  X,
  Layers,
  Users,
} from 'lucide-react';
import { authFetch } from '../../api/client';
import type { Service, Staff } from '../../types';

interface Props {
  staffList: Staff[];
  onRefreshGlobalData: () => void;
}

export const AdminServicesManager: React.FC<Props> = ({ staffList, onRefreshGlobalData }) => {
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [deleteConfirmService, setDeleteConfirmService] = useState<any | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);

  // Form State
  const [formName, setFormName] = useState<string>('');
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formPrice, setFormPrice] = useState<string>('50');
  const [formPriceType, setFormPriceType] = useState<string>('from');
  const [formDuration, setFormDuration] = useState<string>('45');
  const [formBuffer, setFormBuffer] = useState<string>('15');
  const [formRequiresConsultation, setFormRequiresConsultation] = useState<boolean>(false);
  const [formRequiresPatchTest, setFormRequiresPatchTest] = useState<boolean>(false);
  const [formOnlineBooking, setFormOnlineBooking] = useState<boolean>(true);
  const [formActive, setFormActive] = useState<boolean>(true);
  const [formAssignedStaff, setFormAssignedStaff] = useState<string[]>([]);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // New Category State
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatDesc, setNewCatDesc] = useState<string>('');
  const [categorySubmitting, setCategorySubmitting] = useState<boolean>(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/admin/services');
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to load services catalogue', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingServiceId(null);
    setFormName('');
    setFormCategoryId(categories[0]?.id || '');
    setFormDescription('');
    setFormPrice('50');
    setFormPriceType('from');
    setFormDuration('45');
    setFormBuffer('15');
    setFormRequiresConsultation(false);
    setFormRequiresPatchTest(false);
    setFormOnlineBooking(true);
    setFormActive(true);
    setFormAssignedStaff(staffList.map((s) => s.id));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service: any) => {
    setEditingServiceId(service.id);
    setFormName(service.name);
    setFormCategoryId(service.category_id);
    setFormDescription(service.description || '');
    setFormPrice(String(service.price));
    setFormPriceType(service.price_type || 'from');
    setFormDuration(String(service.duration_minutes));
    setFormBuffer(String(service.buffer_minutes || 15));
    setFormRequiresConsultation(Boolean(service.requires_consultation));
    setFormRequiresPatchTest(Boolean(service.requires_patch_test));
    setFormOnlineBooking(Boolean(service.online_booking_enabled));
    setFormActive(Boolean(service.active));
    setFormAssignedStaff(service.assigned_staff_ids || []);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Service name is required.');
      return;
    }
    if (!formCategoryId) {
      setFormError('Please select a category.');
      return;
    }
    if (isNaN(Number(formPrice)) || Number(formPrice) < 0) {
      setFormError('Please provide a valid price.');
      return;
    }
    if (isNaN(Number(formDuration)) || Number(formDuration) <= 0) {
      setFormError('Please provide a valid duration in minutes.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        categoryId: formCategoryId,
        description: formDescription.trim(),
        price: Number(formPrice),
        priceType: formPriceType,
        durationMinutes: Number(formDuration),
        bufferMinutes: Number(formBuffer || 15),
        requiresConsultation: formRequiresConsultation,
        requiresPatchTest: formRequiresPatchTest,
        onlineBookingEnabled: formOnlineBooking,
        active: formActive,
        assignedStaffIds: formAssignedStaff,
      };

      if (editingServiceId) {
        const res = await authFetch(`/api/admin/services/${editingServiceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to update service');
        }
        setNotification({ type: 'success', text: `Service "${formName}" updated successfully!` });
      } else {
        const res = await authFetch('/api/admin/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to add service');
        }
        setNotification({ type: 'success', text: `New service "${formName}" created successfully!` });
      }

      setIsModalOpen(false);
      await loadServices();
      onRefreshGlobalData();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteService = async () => {
    if (!deleteConfirmService) return;
    setFormSubmitting(true);
    try {
      const res = await authFetch(`/api/admin/services/${deleteConfirmService.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete service');
      }
      setNotification({
        type: 'success',
        text: `Service "${deleteConfirmService.name}" has been deleted.`,
      });
      setDeleteConfirmService(null);
      await loadServices();
      onRefreshGlobalData();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCategorySubmitting(true);
    try {
      const res = await authFetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName.trim(),
          description: newCatDesc.trim(),
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create category');
      }
      setNewCatName('');
      setNewCatDesc('');
      setIsCategoryModalOpen(false);
      await loadServices();
      setNotification({ type: 'success', text: 'Category created successfully!' });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setCategorySubmitting(false);
    }
  };

  const toggleStaffAssignment = (stId: string) => {
    if (formAssignedStaff.includes(stId)) {
      setFormAssignedStaff(formAssignedStaff.filter((id) => id !== stId));
    } else {
      setFormAssignedStaff([...formAssignedStaff, stId]);
    }
  };

  const filteredServices = services.filter((srv) => {
    const matchesSearch =
      srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (srv.description && srv.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || srv.category_id === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181818] border border-[#2B2925] p-5 rounded-sm">
        <div>
          <h3 className="font-serif-heading text-2xl text-[#F5F1EA] flex items-center gap-2">
            <Scissors className="w-5 h-5 text-[#BFA57D]" />
            Services Catalogue & Treatments
          </h3>
          <p className="text-xs text-[#8C8273] mt-1">
            Manage salon prices, durations, 48-hour skin patch tests, and assigned stylists.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#3E382E] bg-[#222] hover:bg-[#2A2A2A] text-[#D9D1C5] rounded-sm transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-[#BFA57D]" />
            <span>Add Category</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#9B8058] hover:bg-[#856C47] text-[#141414] rounded-sm transition-colors uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Service</span>
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

      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#8C8273] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search service name, cutting, curly, balayage, replacement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#181818] border border-[#2B2925] pl-9 pr-3 py-2 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-[#8C8273]" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#181818] border border-[#2B2925] px-3 py-2 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058] w-full sm:w-48"
          >
            <option value="all">All Categories ({services.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-[#8C8273]">Loading catalogue...</div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-[#181818] border border-[#2B2925] rounded-sm text-xs text-[#8C8273]">
          No services match your search or filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((srv) => (
            <div
              key={srv.id}
              className={`bg-[#181818] border rounded-sm p-5 space-y-3 transition-colors ${
                srv.active ? 'border-[#2B2925]' : 'border-red-950/40 opacity-70 bg-[#141414]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded-xs bg-[#24211D] text-[#BFA57D] border border-[#3E382E]">
                    {srv.category_name || 'Treatment'}
                  </span>
                  <h4 className="font-serif-heading text-lg text-[#F5F1EA] mt-1.5">{srv.name}</h4>
                </div>
                <div className="text-right">
                  <div className="font-mono-numbers text-base font-bold text-[#BFA57D]">
                    {srv.price_type === 'from' && <span className="text-xs font-normal mr-0.5">from </span>}
                    £{Number(srv.price).toFixed(2)}
                  </div>
                  <span className="text-[10px] text-[#8C8273] uppercase tracking-wider">{srv.price_type}</span>
                </div>
              </div>

              {srv.description && (
                <p className="text-xs text-[#A69B8D] line-clamp-2 leading-relaxed">{srv.description}</p>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px] text-[#8C8273] pt-2 border-t border-[#262626]">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[#BFA57D]" />
                  <span>
                    {srv.duration_minutes}m (+{srv.buffer_minutes || 15}m buf)
                  </span>
                </div>
                <div>
                  {srv.requires_patch_test ? (
                    <span className="text-amber-400/90 font-medium">⚠️ 48h Patch Test</span>
                  ) : (
                    <span className="text-neutral-500">No Patch Test</span>
                  )}
                </div>
              </div>

              {/* Badges & Assigned Staff */}
              <div className="pt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                <span
                  className={`px-2 py-0.5 rounded-xs font-semibold uppercase ${
                    srv.online_booking_enabled
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                      : 'bg-amber-950 text-amber-300 border border-amber-800/40'
                  }`}
                >
                  {srv.online_booking_enabled ? 'Online Booking' : 'Consultation Only'}
                </span>
                {!srv.active && (
                  <span className="px-2 py-0.5 rounded-xs font-semibold uppercase bg-red-950 text-red-300 border border-red-800/40">
                    Inactive
                  </span>
                )}
                {srv.requires_consultation && (
                  <span className="px-2 py-0.5 rounded-xs font-semibold uppercase bg-blue-950 text-blue-300 border border-blue-800/40">
                    Consultation Req.
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#242424] flex items-center justify-between">
                <span className="text-[11px] text-[#8C8273]">
                  {srv.assigned_staff_ids?.length || 0} Stylist(s)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(srv)}
                    className="p-1.5 text-xs text-[#D9D1C5] hover:text-white bg-[#222] hover:bg-[#2c2c2c] border border-[#3A3A3A] rounded-sm transition-colors flex items-center gap-1"
                    title="Edit Service"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#BFA57D]" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirmService(srv)}
                    className="p-1.5 text-xs text-red-400 hover:text-red-200 bg-red-950/20 hover:bg-red-950/50 border border-red-900/40 rounded-sm transition-colors flex items-center gap-1"
                    title="Delete Service"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT SERVICE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#181818] border border-[#3E382E] w-full max-w-xl rounded-sm p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-[#2B2925] pb-3">
              <h4 className="font-serif-heading text-xl text-[#F5F1EA]">
                {editingServiceId ? 'Edit Treatment / Service' : 'Add New Treatment'}
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

            <form onSubmit={handleSaveService} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-[#D9D1C5] font-medium">Service Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Curly Hair Specialist Cut & Hydration"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2B2925] px-3 py-2 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#D9D1C5] font-medium">Category *</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2B2925] px-3 py-2 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#D9D1C5] font-medium">Price Type</label>
                  <select
                    value={formPriceType}
                    onChange={(e) => setFormPriceType(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2B2925] px-3 py-2 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                  >
                    <option value="from">From (£)</option>
                    <option value="fixed">Fixed Price (£)</option>
                    <option value="consultation">Consultation Required</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#D9D1C5] font-medium">Price (£) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2B2925] px-3 py-2 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#D9D1C5] font-medium">Duration (Minutes) *</label>
                  <input
                    type="number"
                    step="5"
                    min="5"
                    required
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2B2925] px-3 py-2 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#D9D1C5] font-medium">Buffer Time (Minutes)</label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    value={formBuffer}
                    onChange={(e) => setFormBuffer(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2B2925] px-3 py-2 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-[#D9D1C5] font-medium">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Bespoke consultation, cleansing, precision technique, and finish..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2B2925] px-3 py-2 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#262626]">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#D9D1C5]">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="rounded-xs border-[#3E382E] accent-[#9B8058]"
                  />
                  <span>Active Service</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#D9D1C5]">
                  <input
                    type="checkbox"
                    checked={formOnlineBooking}
                    onChange={(e) => setFormOnlineBooking(e.target.checked)}
                    className="rounded-xs border-[#3E382E] accent-[#9B8058]"
                  />
                  <span>Online Booking</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#D9D1C5]">
                  <input
                    type="checkbox"
                    checked={formRequiresPatchTest}
                    onChange={(e) => setFormRequiresPatchTest(e.target.checked)}
                    className="rounded-xs border-[#3E382E] accent-[#9B8058]"
                  />
                  <span>48h Patch Test</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#D9D1C5]">
                  <input
                    type="checkbox"
                    checked={formRequiresConsultation}
                    onChange={(e) => setFormRequiresConsultation(e.target.checked)}
                    className="rounded-xs border-[#3E382E] accent-[#9B8058]"
                  />
                  <span>Consultation</span>
                </label>
              </div>

              {/* Assigned Stylists */}
              <div className="space-y-2 pt-2 border-t border-[#262626]">
                <label className="text-xs text-[#D9D1C5] font-medium flex items-center justify-between">
                  <span>Assigned Stylists & Specialists</span>
                  <span className="text-[11px] text-[#8C8273]">
                    {formAssignedStaff.length} of {staffList.length} selected
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {staffList.map((st) => {
                    const isSelected = formAssignedStaff.includes(st.id);
                    return (
                      <button
                        type="button"
                        key={st.id}
                        onClick={() => toggleStaffAssignment(st.id)}
                        className={`px-2.5 py-1.5 text-xs text-left rounded-sm border transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#24211D] border-[#9B8058] text-[#F5F1EA]'
                            : 'bg-[#141414] border-[#2B2925] text-[#8C8273] hover:text-[#D9D1C5]'
                        }`}
                      >
                        <span className="truncate">{st.name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#BFA57D] shrink-0" />}
                      </button>
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
                  {formSubmitting ? 'Saving...' : editingServiceId ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmService && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-red-900/60 w-full max-w-md rounded-sm p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="font-serif-heading text-xl text-[#F5F1EA]">Delete Service</h4>
            </div>

            <p className="text-xs text-[#D9D1C5] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white">"{deleteConfirmService.name}"</strong>? This will remove all
              stylist mappings and prevent new appointments from being booked for this treatment.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262626]">
              <button
                type="button"
                onClick={() => setDeleteConfirmService(null)}
                className="px-4 py-2 text-xs text-[#D9D1C5] hover:text-white bg-[#222] border border-[#3A3A3A] rounded-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={formSubmitting}
                onClick={handleDeleteService}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white rounded-sm transition-colors"
              >
                {formSubmitting ? 'Deleting...' : 'Delete Service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-[#3E382E] w-full max-w-md rounded-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2B2925] pb-3">
              <h4 className="font-serif-heading text-xl text-[#F5F1EA]">Add Service Category</h4>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-[#8C8273] hover:text-[#F5F1EA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-[#D9D1C5] font-medium">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hair Replacement Systems"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2B2925] px-3 py-2 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#D9D1C5] font-medium">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Non-surgical custom lace and mesh integration..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2B2925] px-3 py-2 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#D9D1C5] hover:text-white bg-[#222] border border-[#3A3A3A] rounded-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={categorySubmitting}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[#9B8058] hover:bg-[#856C47] text-[#141414] rounded-sm transition-colors"
                >
                  {categorySubmitting ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
