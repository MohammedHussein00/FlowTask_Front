import {
  ChangeDetectionStrategy, Component, ElementRef, ViewChild, AfterViewInit,
  input, output, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, List } from 'lucide-angular';

/**
 * Simple "Create list" form embedded inside the shell's generic nz-modal
 * (see shell.component.html — `nzTitle="Create list"`). On submit it emits
 * the spaceId it was created for; the shell is responsible for actually
 * registering the list and navigating to it.
 */
@Component({
  selector: 'app-add-item-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="aim-body">
      <div class="aim-icon"><lucide-icon [img]="List" size="18" /></div>
      <label class="aim-label" for="aim-name">List name</label>
      <input
        #nameInput
        id="aim-name"
        class="aim-input"
        type="text"
        placeholder="e.g. Sprint tasks"
        [(ngModel)]="name"
        (keydown.enter)="submit()" />
    </div>
    <div class="aim-footer">
      <button class="aim-btn aim-btn--ghost" type="button" (click)="close.emit()">Cancel</button>
      <button class="aim-btn aim-btn--primary" type="button" [disabled]="!name().trim()" (click)="submit()">
        Create List
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .aim-body { display: flex; flex-direction: column; gap: .4rem; padding: .2rem 0 .9rem; }
    .aim-icon {
      width: 2.1rem; height: 2.1rem; display: grid; place-items: center;
      border-radius: .5rem; background: var(--color-accent); color: #fff; margin-bottom: .3rem;
    }
    .aim-label { font-size: .83rem; font-weight: 700; color: var(--color-text-secondary); }
    .aim-input {
      width: 100%; box-sizing: border-box; height: 2.3rem; padding: 0 .65rem;
      border: 1px solid var(--color-border-strong); border-radius: .4rem;
      background: var(--color-surface-2); color: var(--color-text-primary);
      font: inherit; font-size: .8rem; outline: 0;
    }
    .aim-input:focus { border-color: var(--color-accent); }
    .aim-footer { display: flex; justify-content: flex-end; gap: .5rem; padding-top: .6rem; border-top: 1px solid var(--color-border); }
    .aim-btn {
      height: 2rem; padding: 0 .9rem; border-radius: .4rem; border: 1px solid transparent;
      font: inherit; font-size: .85rem; font-weight: 700; cursor: pointer;
    }
    .aim-btn--ghost { background: transparent; border-color: var(--color-border-strong); color: var(--color-text-secondary); }
    .aim-btn--ghost:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
    .aim-btn--primary { background: var(--color-accent); color: #fff; }
    .aim-btn--primary:hover:not(:disabled) { background: color-mix(in srgb, var(--color-accent) 85%, #000); }
    .aim-btn--primary:disabled { opacity: .5; cursor: default; }
  `],
})
export class AddItemModalComponent implements AfterViewInit {
  @ViewChild('nameInput') nameInput?: ElementRef<HTMLInputElement>;

  /** Space this list is being created inside. */
  readonly spaceId = input<number | null>(null);

  readonly close = output<void>();
  /** Emits the spaceId the list was created for. */
  readonly created = output<number>();

  readonly List = List;
  readonly name = signal('List');

  ngAfterViewInit(): void {
    queueMicrotask(() => this.nameInput?.nativeElement.select());
  }

  submit(): void {
    const id = this.spaceId();
    if (!this.name().trim() || id == null) return;
    this.created.emit(id);
  }
}
