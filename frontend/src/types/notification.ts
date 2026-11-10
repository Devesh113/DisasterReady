export type NotificationType =
  | 'ALERT'
  | 'EVENT_REMINDER'
  | 'INCIDENT_UPDATE'
  | 'GENERAL';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  userId: string;
  createdAt: string;
}

export interface MarkAsReadResult {
  id: string;
  isRead: boolean;
  updatedAt: string;
}

export interface NotificationsResponseData {
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
}

export interface UnreadCountData {
  unreadCount: number;
}
