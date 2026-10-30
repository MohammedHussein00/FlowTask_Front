export interface TaskAssignee {
  userId: number;
  fullName: string;
  avatarUrl?: string | null;
}

export interface Task {
  id: number;
  name: string;
  priority: string;          // 'urgent' | 'high' | 'normal' | 'low'
  statusName?: string | null;
  statusColor?: string | null;
  dueDate?: string | null;
  assignees: TaskAssignee[];
}
