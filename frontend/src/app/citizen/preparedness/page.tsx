'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckSquare,
  ShieldCheck,
  PlusCircle,
  Trash2,
  Edit2,
  AlertTriangle,
  Package,
  Layers,
  Sparkles,
  Search,
  Filter,
  Check,
  Info,
  Droplet,
  HeartPulse,
  Wrench,
  FileText,
  Shield,
  Smile,
} from 'lucide-react';
import { preparednessService } from '@/services/preparedness.service';
import { PreparednessItem, CreateKitItemData, UpdateKitItemData } from '@/types/kit';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Dialog } from '@/components/ui/Dialog';
import EmptyState from '@/components/shared/EmptyState';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const STANDARD_CATEGORIES = [
  'Food & Water',
  'First Aid & Medical',
  'Tools & Safety Gear',
  'Important Documents',
  'Sanitation & Hygiene',
  'Clothing & Warmth',
  'Special Needs & Power',
];

const RECOMMENDED_STARTER_ITEMS: CreateKitItemData[] = [
  {
    name: 'Bottled Drinking Water (3-Day Supply)',
    category: 'Food & Water',
    quantity: 3,
    description: '1 gallon per person per day for drinking and basic sanitation.',
    isReady: false,
  },
  {
    name: 'Non-Perishable Food / Canned Goods',
    category: 'Food & Water',
    quantity: 6,
    description: 'Ready-to-eat canned meats, fruits, vegetables, and high-energy granola bars.',
    isReady: false,
  },
  {
    name: 'First Aid Emergency Trauma Kit',
    category: 'First Aid & Medical',
    quantity: 1,
    description: 'Sterile bandages, gauze pads, antiseptic wipes, tourniquet, and medical tape.',
    isReady: false,
  },
  {
    name: 'Prescription & Critical Medications',
    category: 'First Aid & Medical',
    quantity: 1,
    description: '7-day minimum supply of essential daily medications with copy of prescriptions.',
    isReady: false,
  },
  {
    name: 'High-Lumen LED Flashlight + Extra Batteries',
    category: 'Tools & Safety Gear',
    quantity: 2,
    description: 'Durable waterproof flashlights with sealed spare battery cells.',
    isReady: false,
  },
  {
    name: 'Battery / Hand-Crank Emergency Radio',
    category: 'Tools & Safety Gear',
    quantity: 1,
    description: 'NOAA weather / AM/FM radio for civil emergency announcements.',
    isReady: false,
  },
  {
    name: 'Waterproof Document Pouch',
    category: 'Important Documents',
    quantity: 1,
    description: 'Sealed copies of ID, passports, property deed, insurance, and medical records.',
    isReady: false,
  },
  {
    name: 'Heavy-Duty Work Gloves & N95 Dust Masks',
    category: 'Tools & Safety Gear',
    quantity: 4,
    description: 'Particulate protection for smoke and post-quake structural debris handling.',
    isReady: false,
  },
];

export default function CitizenPreparednessPage() {
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [readinessFilter, setReadinessFilter] = useState<'ALL' | 'READY' | 'MISSING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PreparednessItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateKitItemData>({
    name: '',
    category: 'Food & Water',
    quantity: 1,
    description: '',
    isReady: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Fetch Items
  const { data: kitData, isLoading: itemsLoading } = useQuery({
    queryKey: ['citizen-kit-items', selectedCategory, readinessFilter],
    queryFn: () =>
      preparednessService.getItems({
        category: selectedCategory === 'ALL' ? undefined : selectedCategory,
        isReady:
          readinessFilter === 'ALL'
            ? undefined
            : readinessFilter === 'READY'
            ? true
            : false,
        limit: 100,
        sortBy: 'name',
        sortOrder: 'asc',
      }),
  });

  // 2. Fetch Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['citizen-kit-stats'],
    queryFn: () => preparednessService.getStats(),
  });

  // Mutations
  const toggleReadinessMutation = useMutation({
    mutationFn: ({ id, isReady }: { id: string; isReady: boolean }) =>
      preparednessService.updateReadiness(id, isReady),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citizen-kit-items'] });
      queryClient.invalidateQueries({ queryKey: ['citizen-kit-stats'] });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: (data: CreateKitItemData) => preparednessService.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citizen-kit-items'] });
      queryClient.invalidateQueries({ queryKey: ['citizen-kit-stats'] });
      setIsAddModalOpen(false);
      resetForm();
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateKitItemData }) =>
      preparednessService.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citizen-kit-items'] });
      queryClient.invalidateQueries({ queryKey: ['citizen-kit-stats'] });
      setEditingItem(null);
      resetForm();
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => preparednessService.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citizen-kit-items'] });
      queryClient.invalidateQueries({ queryKey: ['citizen-kit-stats'] });
    },
  });

  // Seed Starter Kit
  const [isSeeding, setIsSeeding] = useState(false);
  const handleSeedStarterKit = async () => {
    setIsSeeding(true);
    try {
      for (const item of RECOMMENDED_STARTER_ITEMS) {
        await preparednessService.createItem(item);
      }
      queryClient.invalidateQueries({ queryKey: ['citizen-kit-items'] });
      queryClient.invalidateQueries({ queryKey: ['citizen-kit-stats'] });
    } catch {
      alert('Failed to load some starter items. Please try adding items manually.');
    } finally {
      setIsSeeding(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Food & Water',
      quantity: 1,
      description: '',
      isReady: false,
    });
  };

  const openEditModal = (item: PreparednessItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      description: item.description || '',
      isReady: item.isReady,
    });
  };

  const items = kitData?.items || [];
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const readinessPercent = stats?.readinessPercentage ?? 0;
  const totalItems = stats?.totalItems ?? 0;
  const readyItems = stats?.readyItems ?? 0;
  const notReadyItems = stats?.notReadyItems ?? 0;

  const getTierInfo = (percent: number) => {
    if (percent >= 80) {
      return {
        label: 'Ready for Emergency',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        color: '#16A34A',
        description: 'Excellent! Your household kit covers the essential 72-hour survival supplies.',
      };
    }
    if (percent >= 50) {
      return {
        label: 'Moderate Preparedness',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        color: '#F59E0B',
        description: 'Fair coverage. You are missing several critical survival or medical items.',
      };
    }
    return {
      label: 'Needs Immediate Attention',
      badgeClass: 'bg-red-100 text-red-800 border-red-300',
      color: '#DC3545',
      description: 'Critical supplies are missing. Complete your checklist before an alert strikes.',
    };
  };

  const tier = getTierInfo(readinessPercent);

  // Chart data from stats
  const chartData = (stats?.categories || []).map((cat) => ({
    name: cat.category.length > 15 ? cat.category.slice(0, 15) + '...' : cat.category,
    fullName: cat.category,
    count: cat.count,
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ========================================================
          1. HEADER
          ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 mb-2">
            <ShieldCheck className="h-4 w-4" />
            72-Hour Survival Kit
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A43] tracking-tight">
            Personal Preparedness Kit
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Track, audit, and organize your family&apos;s essential emergency supplies to endure the critical first 72 hours of a disaster.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {totalItems === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedStarterKit}
              isLoading={isSeeding}
              className="gap-2 text-[#1769AA] border-blue-200 hover:bg-blue-50"
            >
              <Sparkles className="h-4 w-4 text-[#F59E0B]" />
              Load Starter Checklist
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="bg-[#102A43] hover:bg-[#172B4D] text-white gap-2 font-bold shadow-md"
          >
            <PlusCircle className="h-4 w-4" />
            Add Supply Item
          </Button>
        </div>
      </div>

      {/* ========================================================
          2. READINESS SCORE & METRICS OVERVIEW
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Readiness Score Card */}
        <Card className="lg:col-span-1 border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col justify-between">
          <CardHeader className="pb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Kit Readiness Index
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-5xl font-black text-[#102A43] tracking-tight">
                {readinessPercent}%
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${tier.badgeClass}`}>
                {tier.label}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${readinessPercent}%`,
                  backgroundColor: tier.color,
                }}
              />
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              {tier.description}
            </p>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
              <div className="p-2 rounded-lg bg-slate-50">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Total</span>
                <span className="text-lg font-black text-slate-800">{totalItems}</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50">
                <span className="block text-[10px] uppercase font-bold text-emerald-700">Packed</span>
                <span className="text-lg font-black text-emerald-800">{readyItems}</span>
              </div>
              <div className="p-2 rounded-lg bg-red-50">
                <span className="block text-[10px] uppercase font-bold text-red-700">Missing</span>
                <span className="text-lg font-black text-red-800">{notReadyItems}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown Chart Card */}
        <Card className="lg:col-span-2 border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-[#102A43] flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#1769AA]" />
                Supply Distribution by Category
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time count of logged survival supplies across functional categories
              </CardDescription>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {chartData.length} Active Categories
            </span>
          </CardHeader>

          <CardContent className="pt-2">
            {chartData.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs">
                <Package className="h-8 w-8 mb-2 opacity-50" />
                No category data available. Add items to see supply distribution.
              </div>
            ) : mounted ? (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#64748B' }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#102A43] text-white text-xs p-2 rounded-lg shadow-lg">
                              <p className="font-bold">{data.fullName}</p>
                              <p className="text-blue-200 mt-0.5">{data.count} items recorded</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index % 2 === 0 ? '#1769AA' : '#102A43'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                Loading chart...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ========================================================
          3. CHECKLIST TOOLBAR (SEARCH & FILTERS)
          ======================================================== */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search kit items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-50 text-xs"
          />
        </div>

        {/* Readiness Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-full md:w-auto">
          {(['ALL', 'READY', 'MISSING'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setReadinessFilter(mode)}
              className={`flex-1 md:flex-initial px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                readinessFilter === mode
                  ? 'bg-white text-[#102A43] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {mode === 'ALL' ? 'All Items' : mode === 'READY' ? 'Packed' : 'Missing'}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-48 text-xs font-medium rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]"
          >
            <option value="ALL">All Categories</option>
            {STANDARD_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================
          4. INTERACTIVE CHECKLIST ITEMS
          ======================================================== */}
      {itemsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded-md" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="border border-slate-200">
          <CardContent className="p-8">
            <EmptyState
              title="No kit items found"
              description={
                totalItems === 0
                  ? 'Your emergency kit is currently empty. Click "Load Starter Checklist" or "Add Supply Item" to begin.'
                  : 'No items match your active filters. Try resetting search or category filters.'
              }
              icon={CheckSquare}
              actionLabel={totalItems === 0 ? 'Load Starter Checklist' : undefined}
              onAction={totalItems === 0 ? handleSeedStarterKit : undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`group rounded-xl border p-4 transition-all duration-150 flex items-center justify-between gap-4 ${
                item.isReady
                  ? 'bg-white border-slate-200 hover:border-slate-300'
                  : 'bg-amber-50/20 border-amber-200 hover:border-amber-300'
              }`}
            >
              {/* Left: Checkbox & Name */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {/* Custom Checkbox Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    toggleReadinessMutation.mutate({
                      id: item.id,
                      isReady: !item.isReady,
                    })
                  }
                  disabled={toggleReadinessMutation.isPending}
                  aria-label={item.isReady ? 'Mark missing' : 'Mark packed'}
                  className={`flex-shrink-0 h-6 w-6 rounded-lg border flex items-center justify-center transition-all ${
                    item.isReady
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'border-slate-300 bg-white hover:border-emerald-500'
                  }`}
                >
                  {item.isReady && <Check className="h-4 w-4 stroke-[3]" />}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-sm font-bold text-[#102A43] truncate ${
                        item.isReady ? 'line-through text-slate-500 font-semibold' : ''
                      }`}
                    >
                      {item.name}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-medium border-slate-200">
                      {item.category}
                    </Badge>
                    {item.quantity > 1 && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        Qty: {item.quantity}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Status and Actions */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.isReady
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {item.isReady ? 'Packed' : 'Missing'}
                </span>

                <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="p-1.5 text-slate-400 hover:text-[#1769AA] hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit item"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove "${item.name}" from your preparedness kit?`)) {
                        deleteItemMutation.mutate(item.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-[#DC3545] hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================
          5. ADD / EDIT ITEM MODAL DIALOG
          ======================================================== */}
      <Dialog
        isOpen={isAddModalOpen || editingItem !== null}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
          resetForm();
        }}
        title={editingItem ? 'Edit Supply Item' : 'Add Emergency Kit Item'}
        description="Ensure your emergency bag contains verified, non-expired survival gear."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingItem) {
              updateItemMutation.mutate({
                id: editingItem.id,
                data: formData,
              });
            } else {
              createItemMutation.mutate(formData);
            }
          }}
          className="space-y-4 text-xs"
        >
          {/* Name */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">
              Item Name <span className="text-red-500">*</span>
            </label>
            <Input
              required
              type="text"
              placeholder="e.g. Purified Drinking Water (1 Gallon)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="text-xs"
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full text-xs font-medium rounded-lg border border-slate-200 bg-white p-2.5 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]"
            >
              {STANDARD_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Quantity</label>
            <Input
              type="number"
              min={1}
              max={1000}
              value={formData.quantity || 1}
              onChange={(e) =>
                setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
              }
              className="text-xs"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">
              Notes or Storage Location (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Stored in hallway closet top shelf, expires in 2 years"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]"
            />
          </div>

          {/* isReady Checkbox */}
          <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isReady}
              onChange={(e) => setFormData({ ...formData, isReady: e.target.checked })}
              className="h-4 w-4 rounded-sm border-slate-300 text-[#1769AA] focus:ring-[#1769AA]"
            />
            <div>
              <span className="font-bold text-slate-800 block">This item is currently packed and ready</span>
              <span className="text-[11px] text-slate-500">Uncheck if you still need to purchase or pack this item.</span>
            </div>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingItem(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={createItemMutation.isPending || updateItemMutation.isPending}
              className="bg-[#102A43] hover:bg-[#172B4D] text-white font-bold"
            >
              {editingItem ? 'Save Changes' : 'Add to Kit'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
