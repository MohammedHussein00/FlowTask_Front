// src/app/features/admin/notifications/ui/an-confirm-host/an-confirm-host.component.ts
import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { ConfirmService } from '../confirm.service';

@Component({
  selector: 'an-confirm-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './an-confirm-host.component.html',
  styleUrl: './an-confirm-host.component.scss',
})
export class AnConfirmHostComponent {
  readonly confirm = inject(ConfirmService);

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.confirm.pending()) this.confirm.answer(false); }
}
