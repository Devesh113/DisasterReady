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
  RefreshCw,
  Filter,
} from 'lucide-react';
import { notificationService } from '@/services/notification.service';
import { Notification, NotificationType } from '@/types/notification';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { timeAgo } from '@/lib/utils';

export default function AuthorityNotificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filterRead, setFilterRead] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const limit = 10;

  // Query notifications list
  const {
    data: notificationsData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['authority-notifications', page, filterRead, filterType],
    queryFn: () =>
      notificationService.getNotifications({
        page,
        limit,
        isRead: filterRead === 'ALL' ? undefined : filterRead === 'UNREAD' ? false : true,
        type: filterType === 'ALL' ? undefined : (filterType as NotificationType),
        sortOrder: 'desc',
      }),
  });

  // Query unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['authority-notifications-unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
  });

  // Mark single notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authority-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['authority-notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['authority-unread-notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authority-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['authority-notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['authority-unread-notifications'] });
    },
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authority-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['authority-notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['authority-unread-notifications'] });
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
    if (n.type === 'ALERT') return '/authority/alerts';
    if (n.type === 'EVENT_REMINDER') return '/authority/events';
    if (n.type === 'INCIDENT_UPDATE') return '/authority/incidents';
    return null;
  };

  const getTargetLabel = (type: NotificationType) => {
    switch (type) {
      case 'ALERT':
        return 'View Advisories';
      case 'EVENT_REMINDER':
        return 'View Mock Drills';
      case 'INCIDENT_UPDATE':
        return 'View Triage Desk';
      default:
        return 'View';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#172B4D]">
              Command & Operational Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DC3545] text-white">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time emergency operational broadcasts, incident updates, and drill notifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            disabled={unreadCount === 0 || markAllMutation.isPending}
            className="text-xs flex items-center gap-1.5"
          >
            <CheckCheck className="h-4 w-4 text-emerald-600" />
            Mark all read
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Type Selector */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Read / Unread Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['ALL', 'UNREAD', 'READ'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setFilterRead(tab);
                  setPage(1);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  filterRead === tab
                    ? 'bg-white text-[#102A43] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'ALL' && 'All'}
                {tab === 'UNREAD' && (
                  <span className="flex items-center gap-1.5">
                    Unread
                    {unreadCount > 0 && (
                      <span className="bg-[#1769AA] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </span>
                )}
                {tab === 'READ' && 'Read'}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Type:
            </span>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#1769AA]"
            >
              <option value="ALL">All Categories</option>
              <option value="ALERT">Emergency Alerts</option>
              <option value="INCIDENT_UPDATE">Incident Updates</option>
              <option value="EVENT_REMINDER">Drill Reminders</option>
              <option value="GENERAL">General Announcements</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {isError ? (
        <ErrorState
          title="Could not load command notifications"
          message="Failed to fetch your operational notification stream. Please try again."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-slate-200 p-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications to show"
          description={
            filterRead === 'UNREAD'
              ? 'You have caught up with all incoming EOC alerts and task updates.'
              : 'Your command center notification stream is currently clear.'
          }
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const targetLink = getTargetLink(n);
            return (
              <div
                key={n.id}
                className={`relative flex items-start gap-4 p-4 rounded-xl border transition-all ${
                  n.isRead
                    ? 'bg-white border-slate-200/80 text-slate-600'
                    : 'bg-blue-50/40 border-blue-200/80 text-slate-900 shadow-xs'
                }`}
              >
                {/* Status Dot */}
                {!n.isRead && (
                  <span
                    className="absolute top-4 right-4 h-2 w-2 rounded-full bg-[#1769AA]"
                    title="Unread"
                  />
                )}

                {/* Icon */}
                <div
                  className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    n.type === 'ALERT'
                      ? 'bg-rose-50 text-rose-600'
                      : n.type === 'INCIDENT_UPDATE'
                      ? 'bg-amber-50 text-amber-600'
                      : n.type === 'EVENT_REMINDER'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {getTypeIcon(n.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h3
                      className={`text-sm ${
                        n.isRead ? 'font-semibold text-slate-800' : 'font-bold text-[#102A43]'
                      }`}
                    >
                      {n.title}
                    </h3>
                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-4 mt-3 pt-2 border-t border-slate-100/80">
                    {targetLink && (
                      <Link
                        href={targetLink}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#1769AA] hover:text-[#125386] transition-colors"
                      >
                        {getTargetLabel(n.type)}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}

                    {!n.isRead && (
                      <button
                        onClick={() => markAsReadMutation.mutate(n.id)}
                        disabled={markAsReadMutation.isPending}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                        Mark as read
                      </button>
                    )}

                    <button
                      onClick={() => deleteMutation.mutate(n.id)}
                      disabled={deleteMutation.isPending}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors ml-auto"
                      title="Delete notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Showing page <span className="font-semibold">{pagination.page}</span> of{' '}
            <span className="font-semibold">{pagination.totalPages}</span> ({pagination.total} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs h-8"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= (pagination.totalPages || 1)}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="text-xs h-8"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
