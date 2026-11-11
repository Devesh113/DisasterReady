'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { disasterService } from '@/services/disasterService';
import {
  Disaster,
  DisasterType,
  CreateDisasterData,
  UpdateDisasterData,
} from '@/types/disaster';
import { formatDate } from '@/lib/utils';

const DISASTER_TYPES: DisasterType[] = [
  'EARTHQUAKE',
  'FLOOD',
  'CYCLONE',
  'TSUNAMI',
  'WILDFIRE',
  'LANDSLIDE',
  'DROUGHT',
  'VOLCANIC_ERUPTION',
  'TORNADO',
  'INDUSTRIAL_ACCIDENT',
  'OTHER',
];

export default function AdminDisastersPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDisaster, setEditingDisaster] = useState<Disaster | null>(null);
  const [deletingDisaster, setDeletingDisaster] = useState<Disaster | null>(null);
  const [viewingDisaster, setViewingDisaster] = useState<Disaster | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    type: DisasterType;
    description: string;
    guidelines: string;
    iconUrl: string;
  }>({
    name: '',
    type: 'EARTHQUAKE',
    description: '',
    guidelines: '',
    iconUrl: '',
  });

  // Query disaster catalog
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-disasters-catalog', page, selectedType, searchQuery],
    queryFn: () =>
      disasterService.getDisasters({
        page,
        limit: 10,
        type: selectedType === 'ALL' ? undefined : (selectedType as DisasterType),
        search: searchQuery.trim() || undefined,
      }),
  });

  const disasters: Disaster[] = data?.disasters || [];
  const pagination = data?.pagination;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateDisasterData) => disasterService.createDisaster(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disasters-catalog'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || err.message || 'Failed to create disaster entry');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDisasterData }) =>
      disasterService.updateDisaster(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disasters-catalog'] });
      setEditingDisaster(null);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || err.message || 'Failed to update disaster entry');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => disasterService.deleteDisaster(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disasters-catalog'] });
      setDeletingDisaster(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to delete disaster entry');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'EARTHQUAKE',
      description: '',
      guidelines: '',
      iconUrl: '',
    });
    setFormError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditModal = (d: Disaster) => {
    setEditingDisaster(d);
    setFormData({
      name: d.name,
      type: d.type,
      description: d.description,
      guidelines: d.guidelines || '',
      iconUrl: d.iconUrl || '',
    });
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Disaster title/name is required (1-100 characters).');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Description is required (1-2000 characters).');
      return;
    }

    const payload: CreateDisasterData = {
      name: formData.name.trim(),
      type: formData.type,
      description: formData.description.trim(),
      guidelines: formData.guidelines.trim() || null,
      iconUrl: formData.iconUrl.trim() || null,
    };

    if (editingDisaster) {
      updateMutation.mutate({ id: editingDisaster.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-xs font-semibold text-[#1769AA] mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            Standard Operating Procedures (SOP)
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102A43]">
            Disaster Taxonomy & SOP Management
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Authoritative national disaster catalog defining hazard causes, warning signs, and official response protocols.
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
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-[#1769AA] hover:bg-[#125386] rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Create Disaster Taxonomy
          </button>
        </div>
      </div>

      {/* 2. Search & Category Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search taxonomy by hazard name, description, or keyword..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              Type Filter:
            </span>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
            >
              <option value="ALL">All Disaster Types</option>
              {DISASTER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Disasters Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Hazard Name</th>
                <th className="py-3 px-4">Taxonomy Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Preparedness Guidelines</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 bg-slate-200 rounded-full w-24" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-64" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-8 bg-slate-200 rounded w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : disasters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No disaster records located</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery
                        ? 'Try adjusting your search or category filter.'
                        : 'Create your first disaster standard operating procedure using the button above.'}
                    </p>
                  </td>
                </tr>
              ) : (
                disasters.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#172B4D]">
                      {d.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#1769AA] border border-blue-200">
                        {d.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-sm truncate">
                      {d.description}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {d.guidelines ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Configured
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {formatDate(d.updatedAt || d.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingDisaster(d)}
                          className="p-1.5 text-slate-500 hover:text-[#1769AA] hover:bg-slate-100 rounded-lg transition-colors"
                          title="Inspect Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(d)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Disaster Entry"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingDisaster(d)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Permanently Delete Disaster"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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

      {/* 4. Create / Edit Disaster Modal */}
      {(isCreateOpen || editingDisaster) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#102A43]">
                  {editingDisaster ? 'Edit Disaster Record' : 'Register Disaster Taxonomy'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Exclusive Administrator Privilege: POST/PATCH /api/v1/disasters
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingDisaster(null);
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
                  Disaster / Hazard Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Flash Flood & Inundation Protocol"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Taxonomy Category *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as DisasterType })
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
                >
                  {DISASTER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Technical Description & Risk Characteristics *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Scientific summary of triggering mechanisms, impact zones, and vulnerability factors..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
                />
              </div>

              {/* Guidelines */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Preparedness & Standard Operating Guidelines (SOP)
                </label>
                <textarea
                  rows={4}
                  value={formData.guidelines}
                  onChange={(e) => setFormData({ ...formData, guidelines: e.target.value })}
                  placeholder="Pre-disaster checklist, evacuation routes, critical dos and don'ts..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
                />
              </div>

              {/* Icon URL */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Badge / Icon Asset URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.iconUrl}
                  onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                  placeholder="https://example.com/icons/flood.png"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingDisaster(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1769AA] hover:bg-[#125386] rounded-lg transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </span>
                  ) : editingDisaster ? (
                    'Update Record'
                  ) : (
                    'Save Taxonomy'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Disaster Confirmation Dialog */}
      {deletingDisaster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-[#102A43]">
                Confirm Permanent Deletion
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete the disaster taxonomy entry{' '}
              <span className="font-bold text-slate-900">&ldquo;{deletingDisaster.name}&rdquo;</span>?
              This action cannot be undone. Active alerts linked to this hazard may be affected.
            </p>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                onClick={() => setDeletingDisaster(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingDisaster.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-bold text-white bg-[#DC3545] hover:bg-[#B02A37] rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Disaster'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. View Disaster Details Modal */}
      {viewingDisaster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1769AA]">
                  {viewingDisaster.type.replace('_', ' ')}
                </span>
                <h3 className="text-xl font-bold text-[#102A43] mt-0.5">
                  {viewingDisaster.name}
                </h3>
              </div>
              <button
                onClick={() => setViewingDisaster(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-800 mb-1">Description</h4>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                  {viewingDisaster.description}
                </p>
              </div>

              {viewingDisaster.guidelines && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">
                    Standard Operating Guidelines (SOP)
                  </h4>
                  <div className="text-slate-700 bg-blue-50/50 p-3 rounded-lg border border-blue-100 leading-relaxed whitespace-pre-wrap">
                    {viewingDisaster.guidelines}
                  </div>
                </div>
              )}

              <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-100">
                <span>UUID: {viewingDisaster.id}</span>
                <span>Registered: {formatDate(viewingDisaster.createdAt)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingDisaster(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
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
