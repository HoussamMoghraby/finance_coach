/**
 * Notification Bell Component - Shows notification indicator and dropdown
 */
import { useState } from 'react';
import {
  IonIcon,
  IonBadge,
  IonButton,
  IonPopover,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonSpinner,
} from '@ionic/react';
import { notificationsOutline, closeOutline } from 'ionicons/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsAPI, Notification } from '@/services/notifications';
import { formatTimeAgo } from '@/utils/dateUtils';

export const NotificationBell = () => {
  const [popoverEvent, setPopoverEvent] = useState<any>(undefined);
  const queryClient = useQueryClient();

  // Fetch notifications summary
  const { data: summary } = useQuery({
    queryKey: ['notification-summary'],
    queryFn: () => notificationsAPI.getSummary(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => notificationsAPI.getAll(),
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => notificationsAPI.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-summary'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-summary'] });
    },
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: (notificationId: number) => notificationsAPI.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-summary'] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const unreadCount = summary?.unread || 0;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'budget_threshold':
        return '💰';
      case 'unusual_spending':
        return '⚠️';
      case 'summary_ready':
        return '📊';
      case 'recurring_upcoming':
        return '🔄';
      default:
        return '🔔';
    }
  };

  return (
    <>
      <IonButton
        fill="clear"
        onClick={(e) => setPopoverEvent(e.nativeEvent)}
        className="relative"
      >
        <IonIcon slot="icon-only" icon={notificationsOutline} />
        {unreadCount > 0 && (
          <IonBadge
            color="danger"
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              fontSize: '10px',
              minWidth: '18px',
              height: '18px',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </IonBadge>
        )}
      </IonButton>

      <IonPopover
        isOpen={!!popoverEvent}
        event={popoverEvent}
        onDidDismiss={() => setPopoverEvent(undefined)}
        style={{ '--width': '320px', '--max-height': '500px' }}
      >
        <div className="ion-padding">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <IonButton
                size="small"
                fill="clear"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                Mark all read
              </IonButton>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <IonSpinner />
            </div>
          ) : notifications && notifications.length > 0 ? (
            <IonList lines="full" className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <IonItem
                  key={notification.id}
                  button
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    '--background': !notification.is_read ? 'var(--ion-color-light)' : 'transparent'
                  }}
                >
                  <div slot="start" className="text-2xl">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <IonLabel className="ion-text-wrap">
                    <h2 className="font-medium">{notification.title}</h2>
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimeAgo(notification.created_at)}
                    </p>
                  </IonLabel>
                  <IonButton
                    slot="end"
                    fill="clear"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(notification.id);
                    }}
                  >
                    <IonIcon icon={closeOutline} slot="icon-only" />
                  </IonButton>
                </IonItem>
              ))}
            </IonList>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🔔</div>
              <IonText color="medium">
                <p>No notifications</p>
              </IonText>
            </div>
          )}
        </div>
      </IonPopover>
    </>
  );
};
