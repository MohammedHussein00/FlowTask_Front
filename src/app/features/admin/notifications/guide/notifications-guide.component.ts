// src/app/features/admin/notifications/guide/notifications-guide.component.ts
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Check, Copy, LucideAngularModule } from 'lucide-angular';
import { AnTPipe } from '../utils/an-i18n';

interface Snippet { id: string; code: string; }

/** Static reference for admins: syntax of templates / conditions / schedules, with copy-able examples. */
@Component({
  selector: 'app-notifications-guide',
  standalone: true,
  imports: [LucideAngularModule, AnTPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notifications-guide.component.html',
  styleUrl: './notifications-guide.component.scss',
})
export class NotificationsGuideComponent {
  readonly Copy = Copy;
  readonly Check = Check;
  readonly copied = signal('');

  readonly sections: Array<{ key: string; snippets: Snippet[] }> = [
    { key: 'templates', snippets: [
      { id: 'a', code: 'New code created: {{Name}}' },
      { id: 'b', code: '{{Old.Status}} → {{Status}}  ({{Table}}, {{Operation}})' },
    ] },
    { key: 'conditions', snippets: [
      { id: 'a', code: "{{Status}} == 'Approved'" },
      { id: 'b', code: "{{Status}} changed AND {{Amount}} >= 1000" },
      { id: 'c', code: '{{Email}} contains @petroflow.com' },
    ] },
    { key: 'targets', snippets: [
      { id: 'a', code: '{{OwnerId}}, 5' },
      { id: 'b', code: 'Admin, Dispatcher' },
    ] },
    { key: 'schedule', snippets: [
      { id: 'a', code: '0 0 9 ? * MON-FRI' },
      { id: 'b', code: '0 0/15 * * * ?' },
    ] },
    { key: 'extras', snippets: [
      { id: 'a', code: '{"web":"/codes/{{Id}}","mobile":"/codes"}' },
      { id: 'b', code: '{"codeId":"{{Id}}","priority":"high"}' },
    ] },
    { key: 'channels', snippets: [] },
  ];

  copy(id: string, text: string): void {
    void navigator.clipboard?.writeText(text).then(() => {
      this.copied.set(id);
      setTimeout(() => this.copied.update(c => (c === id ? '' : c)), 1400);
    });
  }
}
