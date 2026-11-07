import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { workspaceInitGuard } from './core/auth/workspace-init.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES) },
  {
    path: '',
    canActivate: [authGuard, workspaceInitGuard],
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },

      // Global rail destinations (scaffolded — see ARCHITECTURE.md).
      { path: 'planner', loadComponent: () => import('./features/planner/planner.component').then(m => m.PlannerComponent) },
      { path: 'ai', loadComponent: () => import('./features/ai/ai.component').then(m => m.AiComponent) },
      { path: 'teams', loadComponent: () => import('./features/teams/teams.component').then(m => m.TeamsComponent) },
      { path: 'all-spaces', loadComponent: () => import('./features/all-spaces/all-spaces.component').then(m => m.AllSpacesComponent) },
      { path: 'chat', loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent) },
      { path: 'docs', loadComponent: () => import('./features/docs/docs.component').then(m => m.DocsComponent) },
      { path: 'forms', loadComponent: () => import('./features/forms/forms.component').then(m => m.FormsComponent) },
      { path: 'clips', loadComponent: () => import('./features/clips/clips.component').then(m => m.ClipsComponent) },
      { path: 'goals', loadComponent: () => import('./features/goals/goals.component').then(m => m.GoalsComponent) },
      { path: 'timesheets', loadComponent: () => import('./features/timesheets/timesheets.component').then(m => m.TimesheetsComponent) },

      // Space overview — navigated to when a space is selected in the sidebar.
      { path: 'spaces/:spaceId', loadChildren: () => import('./features/space/space.routes').then(m => m.SPACE_ROUTES) },
      { path: 'admin', loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES) },

      // "Home" widget list destinations (scaffolded — see Customize > Home).
      { path: 'inbox', loadComponent: () => import('./features/inbox/inbox.component').then(m => m.InboxComponent) },
      { path: 'replies', loadComponent: () => import('./features/replies/replies.component').then(m => m.RepliesComponent) },
      { path: 'assigned-comments', loadComponent: () => import('./features/assigned-comments/assigned-comments.component').then(m => m.AssignedCommentsComponent) },
      { path: 'skills', loadComponent: () => import('./features/skills/skills.component').then(m => m.SkillsComponent) },
      { path: 'chat-activity', loadComponent: () => import('./features/chat-activity/chat-activity.component').then(m => m.ChatActivityComponent) },
      { path: 'drafts-sent', loadComponent: () => import('./features/drafts-sent/drafts-sent.component').then(m => m.DraftsSentComponent) },
      { path: 'posts', loadComponent: () => import('./features/posts/posts.component').then(m => m.PostsComponent) },
      { path: 'meetings', loadComponent: () => import('./features/meetings/meetings.component').then(m => m.MeetingsComponent) },
      { path: 'all-channels', loadComponent: () => import('./features/all-channels/all-channels.component').then(m => m.AllChannelsComponent) },

      // Home sidebar destinations (scaffolded).
      { path: 'all-tasks', loadComponent: () => import('./features/all-tasks/all-tasks.component').then(m => m.AllTasksComponent) },
      { path: 'team-space', loadComponent: () => import('./features/spaces/team-space/team-space.component').then(m => m.TeamSpaceComponent) },
      { path: 'channels/:channelId', loadComponent: () => import('./features/channels/channel-view/channel-view.component').then(m => m.ChannelViewComponent) },
      { path: 'messages/:userId', loadComponent: () => import('./features/direct-messages/direct-message-view/direct-message-view.component').then(m => m.DirectMessageViewComponent) },
      { path: 'ai-chats/:threadId', loadComponent: () => import('./features/ai-chats/ai-chat-thread/ai-chat-thread.component').then(m => m.AiChatThreadComponent) },

      // Account menu "Personal Tools" destinations (scaffolded).
      { path: 'my-work', loadComponent: () => import('./features/my-work/my-work.component').then(m => m.MyWorkComponent) },
      { path: 'track-time', loadComponent: () => import('./features/time-tracking/track-time.component').then(m => m.TrackTimeComponent) },
      { path: 'notepad', loadComponent: () => import('./features/notepad/notepad.component').then(m => m.NotepadComponent) },
      { path: 'whiteboards', loadComponent: () => import('./features/whiteboards/whiteboard-editor.component').then(m => m.WhiteboardEditorComponent) },
      { path: 'people', loadComponent: () => import('./features/people/view-people.component').then(m => m.ViewPeopleComponent) },
      { path: 'dashboards/new', loadComponent: () => import('./features/custom-dashboards/dashboard-builder.component').then(m => m.DashboardBuilderComponent) },
      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications-panel.component').then(m => m.NotificationsPanelComponent) },
      { path: 'help', loadComponent: () => import('./features/help-center/help-center.component').then(m => m.HelpCenterComponent) },

      // Add further feature routes under this authenticated boundary as they are migrated.
      {
        path: 'workspaces',
        loadChildren: () =>
          import('./features/workspace/workspace.routes').then(m => m.WORKSPACE_ROUTES),
      },
      { path: 'workspaces/:workspaceId/spaces/:spaceId/lists/:listId/tasks', loadChildren: () => import('./features/tasks/tasks.routes').then(m => m.TASKS_ROUTES) },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
