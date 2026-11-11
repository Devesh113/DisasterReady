'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Power,
  Phone,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { resourceService } from '@/services/resourceService';
import {
  EmergencyResource,
  ResourceType,
  CreateResourceData,
  UpdateResourceData,
} from '@/types/resource';
import { formatDate } from '@/lib/utils';

const RESOURCE_TYPES: { label: string; value: ResourceType; color: string }[] = [
  { label: 'Shelter', value: 'SHELTER', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { label: 'Hospital', value: 'HOSPITAL', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { label: 'Fire Station', value: 'FIRE_STATION', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { label: 'Police Station', value: 'POLICE_STATION', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { label: 'Supply Center', value: 'SUPPLY_CENTER', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { label: 'Evacuation Point', value: 'EVACUATION_POINT', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { label: 'Water Source', value: 'WATER_SOURCE', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { label: 'Other Facility', value: 'OTHER', color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

export default function AdminResourcesPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<EmergencyResource | null>(null);
  const [deletingResource, setDeletingResource] = useState<EmergencyResource | null>(null);
  const [viewingResource, setViewingResource] = useState<EmergencyResource | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    type: ResourceType;
    description: string;
    address: string;
    latitude: string;
    longitude: string;
    phone: string;
    capacity: string;
    isActive: boolean;
  }>({
    name: '',
    type: 'SHELTER',
    description: '',
    address: '',
    latitude: '28.6139',
    longitude: '77.2090',
    phone: '',
    capacity: '200',
    isActive: true,
  });

  // Query resources
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-resources-list', page, selectedType, statusFilter, searchQuery],
    queryFn: () =>
      resourceService.getResources({
        page,
        limit: 10,
        type: selectedType === 'ALL' ? undefined : (selectedType as ResourceType),
        isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
        search: searchQuery.trim() || undefined,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      }),
  });

  const resources: EmergencyResource[] = data?.resources || [];
  const pagination = data?.pagination;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateResourceData) => resourceService.createResource(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-resources-list'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || err.message || 'Failed to deploy resource');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateResourceData }) =>
      resourceService.updateResource(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-resources-list'] });
      setEditingResource(null);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || err.message || 'Failed to update resource');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      resourceService.updateResource(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-resources-list'] });
    },
  });

  // Hard delete mutation (ADMIN only)
  const deleteMutation = useMutation({
    mutationFn: (id: string) => resourceService.deleteResource(id, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-resources-list'] });
      setDeletingResource(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to permanently delete resource');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'SHELTER',
      description: '',
      address: '',
      latitude: '28.6139',
      longitude: '77.2090',
      phone: '',
      capacity: '200',
      isActive: true,
    });
    setFormError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditModal = (r: EmergencyResource) => {
    setEditingResource(r);
    setFormData({
      name: r.name,
      type: r.type,
      description: r.description || '',
      address: r.address,
      latitude: r.latitude.toString(),
      longitude: r.longitude.toString(),
      phone: r.phone || '',
      capacity: r.capacity ? r.capacity.toString() : '',
      isActive: r.isActive,
    });
    setFormError(null);
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setFormError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setIsLocating(false);
      },
      () => {
        setFormError('Unable to detect GPS position. Please enter manually.');
        setIsLocating(false);
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (!formData.name.trim()) {
      setFormError('Facility name is required.');
      return;
    }
    if (!formData.address.trim()) {
      setFormError('Physical address is required.');
      return;
    }
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setFormError('Latitude must be between -90 and 90.');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setFormError('Longitude must be between -180 and 180.');
      return;
    }

    const payload: CreateResourceData = {
      name: formData.name.trim(),
      type: formData.type,
      address: formData.address.trim(),
      latitude: lat,
      longitude: lng,
      description: formData.description.trim() || null,
      phone: formData.phone.trim() || null,
      capacity: formData.capacity ? parseInt(formData.capacity, 10) : null,
      isActive: formData.isActive,
    };

    if (editingResource) {
      updateMutation.mutate({ id: editingResource.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 mb-2 border border-emerald-200">
            <Building2 className="w-3.5 h-3.5" />
            Civil Protection Asset Registry
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102A43]">
            Emergency Infrastructure & Facilities
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Global governance over emergency shelters, trauma centers, fire stations, and supply depots.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-[#102A43] hover:bg-[#163859] rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Deploy Emergency Facility
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search facility by name, district, or address..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Status:</span>
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-[#102A43] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100">
          <button
            onClick={() => {
              setSelectedType('ALL');
              setPage(1);
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors whitespace-nowrap ${
              selectedType === 'ALL'
                ? 'bg-[#1769AA] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            All Categories
          </button>
          {RESOURCE_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setSelectedType(t.value);
                setPage(1);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors whitespace-nowrap ${
                selectedType === t.value
                  ? 'bg-[#1769AA] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Resources Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Facility Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4">Hotline Phone</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Operational State</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-36" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 bg-slate-200 rounded-full w-24" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-44" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 bg-slate-200 rounded-full w-20" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-8 bg-slate-200 rounded w-28 ml-auto" /></td>
                  </tr>
                ))
              ) : resources.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No emergency resources found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery
                        ? 'Try modifying your search query or category filter.'
                        : 'Deploy your first emergency resource using the button above.'}
                    </p>
                  </td>
                </tr>
              ) : (
                resources.map((r) => {
                  const typeMeta =
                    RESOURCE_TYPES.find((t) => t.value === r.type) || RESOURCE_TYPES[7];
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-xs text-[#172B4D]">{r.name}</div>
                        {r.description && (
                          <div className="text-[11px] text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                            {r.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeMeta.color}`}
                        >
                          {typeMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{r.address}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {r.phone ? (
                          <a href={`tel:${r.phone}`} className="text-[#1769AA] hover:underline">
                            {r.phone}
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-[#172B4D]">
                        {r.capacity ? `${r.capacity.toLocaleString()} persons` : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() =>
                            toggleStatusMutation.mutate({
                              id: r.id,
                              isActive: !r.isActive,
                            })
                          }
                          title="Click to toggle operational status"
                          disabled={toggleStatusMutation.isPending}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                            r.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          {r.isActive ? 'Active' : 'Offline'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingResource(r)}
                            className="p-1.5 text-slate-500 hover:text-[#1769AA] hover:bg-slate-100 rounded-lg transition-colors"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(r)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Resource"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingResource(r)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Permanent Hard Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing page <span className="font-semibold">{pagination.page}</span> of{' '}
              <span className="font-semibold">{pagination.totalPages}</span> ({pagination.total}{' '}
              total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5 inline mr-1" />
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Create / Edit Resource Modal */}
      {(isCreateOpen || editingResource) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#102A43]">
                  {editingResource ? 'Edit Facility Record' : 'Deploy Emergency Asset'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Register emergency shelter or medical facility in the spatial database.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingResource(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Facility Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Apex Civil Hospital Trauma Wing"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              {/* Type and Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Facility Category *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as ResourceType })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  >
                    {RESOURCE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bed / Person Capacity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Physical Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={isLocating}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1769AA] hover:text-[#125386]"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  {isLocating ? 'Detecting GPS...' : 'Use Current Coordinates'}
                </button>
              </div>

              {/* Phone */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Emergency Phone Contact
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Operational Guidelines & Capabilities
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Special rescue equipment, backup generators, wheelchair accessibility..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingResource(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#102A43] hover:bg-[#163859] rounded-lg transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingResource
                    ? 'Update Facility'
                    : 'Deploy Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Permanent Delete Confirmation Modal */}
      {deletingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-[#102A43]">
                Confirm Permanent Hard Deletion
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently purge the facility{' '}
              <span className="font-bold text-slate-900">&ldquo;{deletingResource.name}&rdquo;</span>?
              This executes <code>DELETE /api/v1/emergency-resources/:id?hard=true</code> (Admin exclusive) and cannot be recovered.
            </p>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                onClick={() => setDeletingResource(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingResource.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-bold text-white bg-[#DC3545] hover:bg-[#B02A37] rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Purging...' : 'Confirm Permanent Purge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. View Resource Details Modal */}
      {viewingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1769AA]">
                  {viewingResource.type.replace('_', ' ')}
                </span>
                <h3 className="text-xl font-bold text-[#102A43] mt-0.5">
                  {viewingResource.name}
                </h3>
              </div>
              <button
                onClick={() => setViewingResource(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between pb-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Operational Status</span>
                <span className="font-bold text-emerald-700">
                  {viewingResource.isActive ? 'Active / In-Service' : 'Offline'}
                </span>
              </div>
              <div className="flex justify-between pb-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Capacity Quota</span>
                <span className="font-medium text-slate-800">
                  {viewingResource.capacity ? `${viewingResource.capacity} persons` : 'Unspecified'}
                </span>
              </div>
              <div className="flex justify-between pb-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Hotline Phone</span>
                <span className="font-medium text-slate-800">
                  {viewingResource.phone || 'None'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block mb-1">Physical Address</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {viewingResource.address}
                </p>
              </div>
              {viewingResource.description && (
                <div>
                  <span className="text-slate-500 font-medium block mb-1">Capabilities</span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {viewingResource.description}
                  </p>
                </div>
              )}
              <div className="flex justify-between text-slate-500 pt-1">
                <span>Created: {formatDate(viewingResource.createdAt)}</span>
                <a
                  href={`https://www.google.com/maps?q=${viewingResource.latitude},${viewingResource.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#1769AA] hover:underline flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5" /> Open in Google Maps
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingResource(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
