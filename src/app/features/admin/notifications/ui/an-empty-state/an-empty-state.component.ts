// src/app/features/admin/notifications/ui/an-empty-state/an-empty-state.component.ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule, type LucideIconData } from 'lucide-angular';

@Component({
  selector: 'an-empty-state',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './an-empty-state.component.html',
  styleUrl: './an-empty-state.component.scss',
})
export class AnEmptyStateComponent {
  readonly icon = input.required<LucideIconData>();
  readonly title = input.required<string>();
  readonly text = input('');
  readonly tone = input<'accent' | 'danger'>('accent');
}
