'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Calendar,
  FileText,
  Info,
  Clock,
  CheckCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { notificationService } from '@/services/notification.service';
import { Notification, NotificationType } from '@/types/notification';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { timeAgo } from '@/lib/utils';

export default function CitizenNotificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filterRead, setFilterRead] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const limit = 10;

  // Query notifications list
  const { data: notificationsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['citizen-notifications', page, filterRead, filterType],
    queryFn: () =>
      notificationService.getNotifications({
        page,
        limit,
        isRead: filterRead === 'ALL' ? undefined : filterRead === 'UNREAD' ? false : true,
        type: filterType === 'ALL' ? undefined : (filterType as NotificationType),
        sortOrder: 'desc',
      }),
  });

  // Query unread count for the counter badge
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
  });

  // Mark single notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citizen-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  // Mark all as read mutation
  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citizen-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citizen-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const notifications = notificationsData?.data || [];
  const pagination = notificationsData?.pagination;

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'ALERT':
        return <AlertTriangle className="h-5 w-5 text-[#DC3545]" />;
      case 'EVENT_REMINDER':
        return <Calendar className="h-5 w-5 text-[#1769AA]" />;
      case 'INCIDENT_UPDATE':
        return <FileText className="h-5 w-5 text-[#F59E0B]" />;
      case 'GENERAL':
      default:
        return <Info className="h-5 w-5 text-slate-500" />;
    }
  };

  const getTargetLink = (n: Notification) => {
    if (n.type === 'ALERT') return '/citizen/alerts';
    if (n.type === 'EVENT_REMINDER') return '/citizen/events';
    if (n.type === 'INCIDENT_UPDATE') return '/citizen/reports';
    return null;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ========================================================
          1. HEADER WITH ACTIONS
          ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-xs font-semibold text-[#1769AA] mb-2">
            <Bell className="h-4 w-4" />
            Notification Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A43] tracking-tight flex items-center gap-3">
            In-App Notifications
            {unreadCount > 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#DC3545] text-white">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time emergency hazard warnings, mock drill alerts, and incident status updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-[#1769AA] border-blue-200 hover:bg-blue-50"
              onClick={() => markAllMutation.mutate()}
              isLoading={markAllMutation.isPending}
            >
              <CheckCheck className="h-4 w-4" />
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================
          2. FILTERS
          ======================================================== */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Read / Unread Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-full md:w-auto">
          {(['ALL', 'UNREAD', 'READ'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setFilterRead(tab);
                setPage(1);
              }}
              className={`flex-1 md:flex-initial px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                filterRead === tab
                  ? 'bg-white text-[#102A43] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'ALL' ? 'All' : tab === 'UNREAD' ? 'Unread' : 'Read'}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {['ALL', 'ALERT', 'EVENT_REMINDER', 'INCIDENT_UPDATE', 'GENERAL'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setFilterType(type);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterType === type
                  ? 'bg-[#102A43] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'ALL'
                ? 'All Types'
                : type === 'EVENT_REMINDER'
                ? 'Events & Drills'
                : type === 'INCIDENT_UPDATE'
                ? 'Incidents'
                : type === 'GENERAL'
                ? 'General'
                : type}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================
          3. NOTIFICATIONS LIST
          ======================================================== */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load notifications"
          message="Failed to retrieve notifications from the server. Please check your connection and retry."
          onRetry={() => refetch()}
        />
      ) : notifications.length === 0 ? (
        <Card className="border border-slate-200">
          <CardContent className="p-8">
            <EmptyState
              title="No notifications to display"
              description={
                filterRead === 'UNREAD'
                  ? 'You are all caught up! No unread notifications.'
                  : 'You have no notifications matching the selected filter.'
              }
              icon={Bell}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const targetLink = getTargetLink(notification);

            return (
              <div
                key={notification.id}
                className={`relative group rounded-xl border p-4 sm:p-5 transition-all duration-150 flex items-start gap-4 ${
                  !notification.isRead
                    ? 'bg-blue-50/30 border-blue-200 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Type Icon */}
                <div
                  className={`p-2.5 rounded-xl flex-shrink-0 ${
                    !notification.isRead ? 'bg-blue-100/70' : 'bg-slate-100'
                  }`}
                >
                  {getTypeIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {notification.type.replace('_', ' ')}
                    </span>
                    {!notification.isRead && (
                      <span className="h-2 w-2 rounded-full bg-[#1769AA]" title="Unread" />
                    )}
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(notification.createdAt)}
                    </span>
                  </div>

                  <h3
                    className={`text-sm font-bold text-[#102A43] ${
                      !notification.isRead ? 'font-extrabold' : ''
                    }`}
                  >
                    {notification.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {notification.message}
                  </p>

                  {/* Contextual Link */}
                  {targetLink && (
                    <div className="mt-3">
                      <Link
                        href={targetLink}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1769AA] hover:underline"
                      >
                        View Related Details
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {!notification.isRead && (
                    <button
                      type="button"
                      onClick={() => markAsReadMutation.mutate(notification.id)}
                      disabled={markAsReadMutation.isPending}
                      className="p-1.5 text-slate-500 hover:text-[#1769AA] hover:bg-slate-100 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Delete this notification?')) {
                        deleteMutation.mutate(notification.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 text-slate-400 hover:text-[#DC3545] hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete notification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          4. PAGINATION
          ======================================================== */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs text-slate-600">
          <div>
            Showing Page <span className="font-bold text-[#102A43]">{pagination.page}</span> of{' '}
            <span className="font-bold text-[#102A43]">{pagination.totalPages}</span> ({pagination.total} notifications)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="gap-1 text-xs"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= (pagination.totalPages || 1)}
              onClick={() => setPage((prev) => prev + 1)}
              className="gap-1 text-xs"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
