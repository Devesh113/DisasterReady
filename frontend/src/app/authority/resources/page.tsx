'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit2,
  Power,
  Phone,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Eye,
  RefreshCw,
  Navigation,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Activity,
  Layers,
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

export default function AuthorityResourcesPage() {
  const queryClient = useQueryClient();

  // Filters & Pagination State
  const [page, setPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<EmergencyResource | null>(null);
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
    capacity: '',
    isActive: true,
  });

  // Query resources
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['authority', 'resources', page, selectedType, statusFilter, searchQuery],
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

  const resources: EmergencyResource[] = useMemo(
    () => data?.resources || [],
    [data?.resources]
  );
  const pagination = data?.pagination;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateResourceData) => resourceService.createResource(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authority', 'resources'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || err.message || 'Failed to create resource');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateResourceData }) =>
      resourceService.updateResource(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authority', 'resources'] });
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
      queryClient.invalidateQueries({ queryKey: ['authority', 'resources'] });
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
      capacity: '',
      isActive: true,
    });
    setFormError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditModal = (resource: EmergencyResource) => {
    setEditingResource(resource);
    setFormData({
      name: resource.name,
      type: resource.type,
      description: resource.description || '',
      address: resource.address,
      latitude: resource.latitude.toString(),
      longitude: resource.longitude.toString(),
      phone: resource.phone || '',
      capacity: resource.capacity ? resource.capacity.toString() : '',
      isActive: resource.isActive,
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
      setFormError('Resource name is required.');
      return;
    }
    if (!formData.address.trim()) {
      setFormError('Physical address is required.');
      return;
    }
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setFormError('Latitude must be a valid number between -90 and 90.');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setFormError('Longitude must be a valid number between -180 and 180.');
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

  // Compute live overview metrics
  const activeCount = useMemo(() => resources.filter((r) => r.isActive).length, [resources]);
  const totalShelterCapacity = useMemo(
    () =>
      resources
        .filter((r) => r.type === 'SHELTER' && r.capacity)
        .reduce((sum, r) => sum + (r.capacity || 0), 0),
    [resources]
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172B4D]">
            Emergency Infrastructure & Resources
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain critical disaster shelters, medical units, supply depots, and dispatch centers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white bg-[#1769AA] rounded-lg hover:bg-[#125386] transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Deploy Resource Asset
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Assets
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1769AA] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#172B4D]">
              {pagination?.total ?? resources.length}
            </span>
            <span className="text-xs text-slate-500">registered units</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active / Operational
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{activeCount}</span>
            <span className="text-xs text-slate-500">in current batch</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Shelter Quota
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#172B4D]">
              {totalShelterCapacity.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">refugee beds</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Authority Jurisdiction
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm font-bold text-[#172B4D]">CRUD Authorized</span>
            <p className="text-xs text-slate-500 mt-0.5">Direct asset provisioning & toggle</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search resource by facility name, address, or district..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
            />
          </div>

          {/* Operational Status */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap mr-1">
              Status:
            </span>
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

        {/* Resource Type Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 border-t border-slate-100">
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
            All Types
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

      {/* Resources Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Facility / Asset Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Address & Location</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-slate-200 rounded w-36" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-5 bg-slate-200 rounded-full w-24" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-slate-200 rounded w-48" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-slate-200 rounded w-28" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-slate-200 rounded w-16" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-5 bg-slate-200 rounded-full w-20" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="h-8 bg-slate-200 rounded w-24 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : resources.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No emergency resources found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery
                        ? 'Try modifying your search criteria.'
                        : 'Deploy your first emergency resource using the button above.'}
                    </p>
                  </td>
                </tr>
              ) : (
                resources.map((res) => {
                  const typeMeta =
                    RESOURCE_TYPES.find((t) => t.value === res.type) || RESOURCE_TYPES[7];
                  return (
                    <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#172B4D]">{res.name}</div>
                        {res.description && (
                          <div className="text-xs text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                            {res.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeMeta.color}`}
                        >
                          {typeMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{res.address}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 pl-4.5">
                          {res.latitude.toFixed(4)}, {res.longitude.toFixed(4)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {res.phone ? (
                          <a
                            href={`tel:${res.phone}`}
                            className="inline-flex items-center gap-1 text-[#1769AA] hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            {res.phone}
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-[#172B4D]">
                        {res.capacity ? `${res.capacity.toLocaleString()} persons` : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() =>
                            toggleStatusMutation.mutate({
                              id: res.id,
                              isActive: !res.isActive,
                            })
                          }
                          title="Click to toggle operational status"
                          disabled={toggleStatusMutation.isPending}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                            res.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <Power className={`w-3 h-3 ${res.isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                          {res.isActive ? 'Active' : 'Offline'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingResource(res)}
                            className="p-1.5 text-slate-500 hover:text-[#1769AA] hover:bg-slate-100 rounded-lg transition-colors"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(res)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Resource"
                          >
                            <Edit2 className="w-4 h-4" />
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

        {/* Pagination footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing page <span className="font-semibold">{pagination.page}</span> of{' '}
              <span className="font-semibold">{pagination.totalPages}</span> ({pagination.total}{' '}
              total assets)
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

      {/* Create / Edit Resource Modal */}
      {(isCreateOpen || editingResource) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#172B4D]">
                  {editingResource ? 'Edit Emergency Resource' : 'Deploy Emergency Resource'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Register infrastructure asset in the EOC spatial directory.
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Facility Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sector 14 Community Evacuation Shelter"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
                />
              </div>

              {/* Type and Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Resource Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as ResourceType })
                    }
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
                  >
                    {RESOURCE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Capacity (Persons / Beds)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="e.g. 250"
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Physical Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Block C, Plot 42, Civil Lines Road, New Delhi"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
                />
              </div>

              {/* Coordinates & GPS */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Latitude (-90 to 90) *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Longitude (-180 to 180) *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
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
                  {isLocating ? 'Detecting GPS...' : 'Use Current GPS Position'}
                </button>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Phone Contact
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Facility Description & Operational Instructions
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Special equipment, wheelchair accessibility, generator backups, intake protocols..."
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-[#1769AA] rounded border-slate-300 focus:ring-[#1769AA]"
                />
                <label htmlFor="isActiveToggle" className="text-sm font-medium text-slate-700">
                  Mark as Active and Operational immediately
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingResource(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#1769AA] hover:bg-[#125386] rounded-lg transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                    </span>
                  ) : editingResource ? (
                    'Update Resource'
                  ) : (
                    'Deploy Resource'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Resource Details Modal */}
      {viewingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Emergency Facility Record
                </span>
                <h3 className="text-xl font-bold text-[#172B4D] mt-0.5">
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

            <div className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Resource Type</span>
                <span className="font-semibold text-[#172B4D]">{viewingResource.type}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Operational Status</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    viewingResource.isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {viewingResource.isActive ? 'Active / In-Service' : 'Offline / Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Capacity</span>
                <span className="font-semibold text-[#172B4D]">
                  {viewingResource.capacity ? `${viewingResource.capacity} persons` : 'Unspecified'}
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Phone Hotline</span>
                <span className="font-semibold text-[#172B4D]">
                  {viewingResource.phone ? (
                    <a href={`tel:${viewingResource.phone}`} className="text-[#1769AA] underline">
                      {viewingResource.phone}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block mb-1">Address</span>
                <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                  {viewingResource.address}
                </p>
              </div>
              {viewingResource.description && (
                <div>
                  <span className="text-slate-500 font-medium block mb-1">Description</span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                    {viewingResource.description}
                  </p>
                </div>
              )}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Created: {formatDate(viewingResource.createdAt)}</span>
                <a
                  href={`https://www.google.com/maps?q=${viewingResource.latitude},${viewingResource.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#1769AA] hover:underline"
                >
                  <MapPin className="w-3.5 h-3.5" /> Open in Google Maps
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingResource(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
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
