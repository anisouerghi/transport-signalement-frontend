export interface InboxNotificationItem {
  id: number;
  reportReference: string;
  reportUuid: string;
  message: string;
  publicStatus: string | null;
  eventType: string;
  createdAt: string;
  read: boolean;
}

export interface InboxNotificationResponse {
  unreadCount: number;
  items: InboxNotificationItem[];
}
