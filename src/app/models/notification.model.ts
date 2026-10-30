export interface Notification {
  id: number;
  title: string;
  message?: string | null;
  isRead: boolean;
  createdAt: string;
}
