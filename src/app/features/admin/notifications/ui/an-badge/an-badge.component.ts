// src/app/features/admin/notifications/ui/an-badge/an-badge.component.ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'an-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './an-badge.component.html',
  styleUrl: './an-badge.component.scss',
})
export class AnBadgeComponent {
  readonly tone = input<'neutral' | 'accent' | 'success' | 'warning' | 'danger'>('neutral');
}
