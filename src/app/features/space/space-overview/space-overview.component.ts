import { Component, signal } from '@angular/core';
import { LucideAngularModule, X } from 'lucide-angular';
import { OverviewToolbarComponent } from './overview-toolbar.component';
import { OverviewCardsComponent } from './overview-cards.component';
import { AddCardModalComponent } from '../add-card-modal/add-card-modal.component';

@Component({
  selector: 'app-space-overview',
  standalone: true,
  imports: [
    LucideAngularModule,
    OverviewToolbarComponent,
    OverviewCardsComponent,
    AddCardModalComponent,
  ],
  template: `
    <div class="ov-page">

      <!-- Purple banner -->
      @if (showBanner()) {
        <div class="ov-banner">
          <span>
            Get the most out of your Overview! Add, reorder, and resize cards to customize this page
            <a href="#" (click)="$event.preventDefault()">Get Started</a>
          </span>
          <button class="ov-banner__close" type="button" (click)="showBanner.set(false)">
            <lucide-icon [img]="X" size="15" />
          </button>
        </div>
      }

      <!-- Toolbar + Filters -->
      <app-overview-toolbar (addCard)="addCardOpen.set(true)" />

      <!-- Cards body -->
      <app-overview-cards />

    </div>

    <!-- Add Card modal (teleported above everything) -->
    @if (addCardOpen()) {
      <app-add-card-modal (close)="addCardOpen.set(false)" />
    }
  `,
  styles: [`
    :host { display: block; height: 100%; overflow-y: auto; }

    .ov-page {
      display: flex; flex-direction: column; min-height: 100%;
      background: var(--color-canvas); color: var(--color-text-primary);
    }

    /* Banner */
    .ov-banner {
      position: relative;
      display: flex; align-items: center; justify-content: center; gap: .35rem;
      min-height: 2.6rem; padding: .4rem 3rem;
      background: color-mix(in srgb, var(--color-accent) 34%, #1a1424);
      color: #e8e0ff; font-size: .71rem; text-align: center; line-height: 1.5;
    }
    .ov-banner a { color: #fff; font-weight: 700; text-decoration: underline; }
    .ov-banner a:hover { opacity: .85; }
    .ov-banner__close {
      position: absolute; inset-inline-end: .85rem; inset-block: 0;
      display: grid; place-items: center; width: 1.6rem;
      border: 0; background: transparent; color: #c4b5fd; cursor: pointer; border-radius: .3rem;
    }
    .ov-banner__close:hover { background: color-mix(in srgb,#fff 10%,transparent); }
  `],
})
export class SpaceOverviewComponent {
  readonly X = X;
  readonly showBanner = signal(true);
  readonly addCardOpen = signal(false);
}
