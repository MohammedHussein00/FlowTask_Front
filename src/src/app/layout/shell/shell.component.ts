/** ClickUp reference fidelity: a full-width top bar, global rail, contextual navigation, and layered utility overlays. */
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideAngularModule, Clapperboard, CheckCircle2, ClipboardList, FileText, Grid2X2, Info, LayoutDashboard, LayoutGrid,
  MessageCircle, PanelLeftOpen, PenLine, Settings2, Sparkles, Target, Timer, UserPlus, X, XCircle,
} from 'lucide-angular';
import { NzButtonModule }  from 'ng-zorro-antd/button';
import { NzModalModule }   from 'ng-zorro-antd/modal';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { AppCustomizerComponent } from '../../shared/components/app-customizer/app-customizer.component';
import { AppSidebarComponent } from '../../shared/components/app-sidebar/app-sidebar.component';
import { AppTopbarComponent } from '../../shared/components/app-topbar/app-topbar.component';
import { CreateWorkspaceWizardComponent } from '../../shared/components/create-workspace-wizard/create-workspace-wizard.component';
import { InviteModalComponent } from '../../shared/components/modals/invite-modal/invite-modal.component';
import { NewSpaceModalComponent } from '../../shared/components/modals/new-space-modal/new-space-modal.component';
import { UpgradeModalComponent } from '../../shared/components/modals/upgrade-modal/upgrade-modal.component';
import { CreateDocModalComponent } from '../../shared/components/modals/create-doc-modal/create-doc-modal.component';
import { AddItemModalComponent } from '../../shared/components/modals/add-item-modal/add-item-modal.component';
import { AddChannelModalComponent } from '../../shared/components/modals/add-channel-modal/add-channel-modal.component';
import { NotificationService } from '../../core/errors/notification.service';
import { ChannelModalService } from '../../core/services/channel-modal.service';
import { WorkspaceCustomizationService } from '../../core/theme/workspace-customization.service';
import { SpaceListStore } from '../../core/stores/space-list.store';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive, AppSidebarComponent, AppTopbarComponent,
    AppCustomizerComponent, CreateWorkspaceWizardComponent, InviteModalComponent, NewSpaceModalComponent,
    UpgradeModalComponent, CreateDocModalComponent, AddItemModalComponent, AddChannelModalComponent, LucideAngularModule,
    NzButtonModule, NzModalModule, NzPopoverModule, NzTooltipModule,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  readonly notifications = inject(NotificationService);
  readonly workspace = inject(WorkspaceCustomizationService);
  readonly channelModal = inject(ChannelModalService);
  readonly spaceListStore = inject(SpaceListStore);
  private readonly router = inject(Router);

  /** Rail items actually shown — driven by the "Navigation" tab in Customize (see workspace-customization.service.ts). */
  readonly checkedRailItems = computed(() => this.workspace.railItems().filter(item => item.checked));

  readonly sidebarCollapsed = signal(false);
  readonly customizerOpen = signal(false);
  readonly moreRailOpen = signal(false);
  readonly inviteOpen = signal(false);
  readonly upgradeOpen = signal(false);
  readonly createWorkspaceOpen = signal(false);
  readonly newSpaceOpen = signal(false);

  // ─── NEW: Modal signals for sidebar create events ───
  readonly createListSpaceId = signal<number | null>(null);
  readonly createFolderOpen = signal(false);
  readonly createSprintOpen = signal(false);
  readonly createDocOpen = signal(false);
  readonly createDashboardOpen = signal(false);
  readonly createWhiteboardOpen = signal(false);
  readonly createFormOpen = signal(false);
  readonly templatesOpen = signal(false);
  readonly importOpen = signal(false);

  readonly Clapperboard = Clapperboard;
  readonly CheckCircle2 = CheckCircle2;
  readonly ClipboardList = ClipboardList;
  readonly FileText = FileText;
  readonly Grid2X2 = Grid2X2;
  readonly Info = Info;
  readonly LayoutDashboard = LayoutDashboard;
  readonly LayoutGrid = LayoutGrid;
  readonly MessageCircle = MessageCircle;
  readonly PanelLeftOpen = PanelLeftOpen;
  readonly PenLine = PenLine;
  readonly Settings2 = Settings2;
  readonly Sparkles = Sparkles;
  readonly Target = Target;
  readonly Timer = Timer;
  readonly UserPlus = UserPlus;
  readonly X = X;
  readonly XCircle = XCircle;

  toggleSidebar(): void { this.sidebarCollapsed.update(value => !value); }
  openCustomizer(): void { this.customizerOpen.set(true); }
  closeCustomizer(): void { this.customizerOpen.set(false); }
  openInvite(): void { this.inviteOpen.set(true); }
  closeInvite(): void { this.inviteOpen.set(false); }
  openUpgrade(): void { this.upgradeOpen.set(true); }
  closeUpgrade(): void { this.upgradeOpen.set(false); }
  openCreateWorkspace(): void { this.createWorkspaceOpen.set(true); }
  closeCreateWorkspace(): void { this.createWorkspaceOpen.set(false); }
  openNewSpace(): void { this.newSpaceOpen.set(true); }
  closeNewSpace(): void { this.newSpaceOpen.set(false); }

  // ─── NEW: Modal handlers for sidebar create events ───
  openCreateList(spaceId: number): void { this.createListSpaceId.set(spaceId); }
  closeCreateList(): void { this.createListSpaceId.set(null); }

  /** Registers the list, closes the modal, and navigates to it — mirrors selecting it in the sidebar. */
  onListCreated(spaceId: number): void {
    this.spaceListStore.createList(spaceId);
    this.closeCreateList();
    this.router.navigate(['/spaces', spaceId, 'list']);
  }

  openCreateFolder(): void { this.createFolderOpen.set(true); }
  closeCreateFolder(): void { this.createFolderOpen.set(false); }

  openCreateSprint(): void { this.createSprintOpen.set(true); }
  closeCreateSprint(): void { this.createSprintOpen.set(false); }

  openCreateDoc(): void { this.createDocOpen.set(true); }
  closeCreateDoc(): void { this.createDocOpen.set(false); }

  openCreateDashboard(): void { this.createDashboardOpen.set(true); }
  closeCreateDashboard(): void { this.createDashboardOpen.set(false); }

  openCreateWhiteboard(): void { this.createWhiteboardOpen.set(true); }
  closeCreateWhiteboard(): void { this.createWhiteboardOpen.set(false); }

  openCreateForm(): void { this.createFormOpen.set(true); }
  closeCreateForm(): void { this.createFormOpen.set(false); }

  openTemplates(): void { this.templatesOpen.set(true); }
  closeTemplates(): void { this.templatesOpen.set(false); }

  openImport(): void { this.importOpen.set(true); }
  closeImport(): void { this.importOpen.set(false); }

  /** The wizard already switched the WorkspaceStore to the new workspace — just land the user on it. */
  onWorkspaceCreated(_workspaceId: number): void {
    this.createWorkspaceOpen.set(false);
    this.router.navigateByUrl('/dashboard');
  }
}
