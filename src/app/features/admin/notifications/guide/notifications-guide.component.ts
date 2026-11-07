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
  template: `
    <div class="cols">
      @for (s of sections; track s.key) {
        <section class="card">
          <h2>{{ ('guide.' + s.key + '.title') | anT }}</h2>
          <p>{{ ('guide.' + s.key + '.text') | anT }}</p>
          @for (sn of s.snippets; track sn.id) {
            <div class="code">
              <span class="code__label">{{ ('guide.' + s.key + '.' + sn.id) | anT }}</span>
              <pre><code>{{ sn.code }}</code></pre>
              <button type="button" class="copy" (click)="copy(s.key + sn.id, sn.code)" [attr.aria-label]="'guide.copy' | anT">
                <lucide-icon [img]="copied() === s.key + sn.id ? Check : Copy" size="14" />
              </button>
            </div>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(25rem, 1fr)); gap: 1rem; align-items: start; }
    .card { padding: 1.15rem 1.2rem 1.2rem; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface-1); }
    h2 { margin: 0 0 .4rem; font-size: .98rem; font-weight: 800; }
    p { margin: 0 0 .9rem; font-size: .8rem; line-height: 1.6; color: var(--color-text-secondary); }
    .code { position: relative; margin-top: .6rem; }
    .code__label { display: block; margin-bottom: .25rem; font-size: .68rem; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; color: var(--color-text-muted); }
    pre { margin: 0; padding: .7rem 2.6rem .7rem .85rem; overflow-x: auto; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-2); direction: ltr; text-align: left; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .75rem; line-height: 1.55; color: var(--color-text-primary); white-space: pre; }
    .copy { position: absolute; inset-block-end: .45rem; inset-inline-end: .45rem; display: grid; place-items: center; width: 1.8rem; height: 1.8rem; border-radius: .4rem; color: var(--color-text-secondary); background: var(--color-surface-3); }
    .copy:hover { color: var(--color-text-primary); }
    @media (max-width: 560px) { .cols { grid-template-columns: 1fr; } }
  `],
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
