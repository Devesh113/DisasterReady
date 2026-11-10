import apiClient from './apiClient';
import { ApiResponse } from '@/types/api';
import {
  Notification,
  NotificationType,
  NotificationsResponseData,
  UnreadCountData,
  MarkAsReadResult,
} from '@/types/notification';

export interface QueryNotificationsParams {
  page?: number;
  limit?: number;
  type?: NotificationType;
  isRead?: boolean;
  sortOrder?: 'asc' | 'desc';
}

export const notificationService = {
  /**
   * List the authenticated user's notifications
   */
  async getNotifications(params?: QueryNotificationsParams): Promise<NotificationsResponseData> {
    const res = await apiClient.get<NotificationsResponseData>('/notifications', {
      params,
    });
    return res.data;
  },

  /**
   * Get count of unread notifications for the bell indicator
   */
  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<ApiResponse<UnreadCountData>>('/notifications/unread-count');
    return res.data.data.unreadCount;
  },

  /**
   * Mark a single notification as read.
   * Backend returns { success: true, data: { id, isRead, updatedAt } }
   */
  async markAsRead(id: string): Promise<MarkAsReadResult> {
    const res = await apiClient.patch<ApiResponse<MarkAsReadResult>>(
      `/notifications/${id}/read`
    );
    return res.data.data;
  },

  /**
   * Mark all notifications as read for current user
   */
  async markAllAsRead(): Promise<number> {
    const res = await apiClient.patch<ApiResponse<{ updatedCount: number }>>(
      '/notifications/read-all'
    );
    return res.data.data.updatedCount;
  },

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },
};

export default notificationService;
