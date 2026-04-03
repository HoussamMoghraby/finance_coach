/**
 * Notifications API service
 */
import api from './api';

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationSummary {
  total: number;
  unread: number;
}

export const notificationsAPI = {
  getAll: async (unreadOnly: boolean = false): Promise<Notification[]> => {
    const response = await api.get('/notifications', {
      params: { unread_only: unreadOnly },
    });
    return response.data;
  },

  getSummary: async (): Promise<NotificationSummary> => {
    const response = await api.get('/notifications/summary');
    return response.data;
  },

  markAsRead: async (notificationId: number): Promise<Notification> => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ message: string; count: number }> => {
    const response = await api.post('/notifications/mark-all-read');
    return response.data;
  },

  delete: async (notificationId: number): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
  },
};
