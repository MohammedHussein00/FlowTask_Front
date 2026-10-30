/**
 * ChannelViewComponent
 * ────────────────────
 * Landed on at `/channels/:channelId` — either a user-created channel (looked
 * up in `ChannelStore`, populated by the "Add Channel" flow) or one of the two
 * permanent, built-in channels the sidebar always shows ("welcome"/"general"),
 * which aren't stored anywhere since they can't be renamed or deleted.
 *
 * The tab bar mirrors `SpaceShellComponent`'s (Channel / Overview / List /
 * Board / Calendar / Gantt / Team / +View) but switches content locally
 * instead of routing, since a channel has no nested routes yet — only the
 * "Channel" tab (the chat) is fully built; the rest render a lightweight
 * "coming soon" placeholder, consistent with the rest of the app's scaffolds.
 */
import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import {
  LucideAngularModule,
  AtSign, Bell, Bot, BrainCircuit, Bookmark, Calendar, ChartGantt, Check, CheckSquare, ChevronDown,
  Cloud, Download, FileText, Hash, HardDrive, Heading1, Heading2, Image, LayoutDashboard, Lightbulb,
  Link2, ListChecks, ListOrdered, Lock, Megaphone, Mic, MessageCircle, MessageSquare, Package, Paperclip,
  PenSquare, Phone, Plus, Presentation, Send, Share2, Smile, Sparkles, Square, Star, Table, ToggleLeft,
  Type, Users, UserPlus, Video, Workflow, X, Zap, Heading3, Code,
} from 'lucide-angular';
import { ChannelStore, ChannelSnapshot } from '../../../core/stores/channel.store';
import { WorkspaceStore } from '../../../core/stores/workspace.store';
import { ComponentTranslatePipe } from '../../../core/i18n/component-translate.pipe';
import { ComponentI18nService } from '../../../core/i18n/component-i18n.service';
import { VoicePlayerComponent } from './voice-player.component';

type ChannelTab = 'channel' | 'overview' | 'list' | 'board' | 'calendar' | 'gantt' | 'team';
type PostType = 'message' | 'announcement' | 'discussion' | 'idea' | 'update';

interface VoiceNote { url: string; duration: number; peaks: number[]; mime: string; }

interface ChatMessage {
  id: number; text: string; time: string;
  postType: PostType;
  voice?: VoiceNote;
}

interface SlashItem {
  id: string;
  labelKey: string;
  section: 'suggestions' | 'text';
  icon: any;
  isNew?: boolean;
  /** Text inserted into the draft when picked ('' = just clear the slash). */
  insert: string;
}

interface PostTypeItem { id: PostType; labelKey: string; icon: any; color: string; }

@Component({
  selector: 'app-channel-view',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, ComponentTranslatePipe, VoicePlayerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="cv-shell">
    @if (channel(); as ch) {

      <!-- ── Tab bar ── -->
      <header class="cv-tabbar">
        <div class="cv-tabbar__left">
          <button type="button" class="cv-badge-btn">
            <span class="cv-badge" [style.background]="ch.color">
              @if (ch.isPrivate) { <lucide-icon [img]="Lock" size="11" /> } @else { <lucide-icon [img]="Hash" size="11" /> }
            </span>
            <b>{{ ch.name }}</b>
            <lucide-icon [img]="ChevronDown" size="14" />
            <lucide-icon class="cv-badge-btn__star" [class.cv-badge-btn__star--on]="favorite()"
              [img]="Star" size="14" (click)="favorite.update(v => !v)" />
          </button>

          <nav class="cv-tabs">
            <button type="button" class="cv-tab" [class.cv-tab--active]="activeTab() === 'channel'" (click)="activeTab.set('channel')">
              <lucide-icon [img]="Hash" size="13" />{{ 'channelTab' | componentT:'channel-view' }}
            </button>
            <button type="button" class="cv-tab" [class.cv-tab--active]="activeTab() === 'overview'" (click)="activeTab.set('overview')">
              {{ 'overviewTab' | componentT:'channel-view' }}
            </button>
            <button type="button" class="cv-tab" [class.cv-tab--active]="activeTab() === 'list'" (click)="activeTab.set('list')">
              <lucide-icon [img]="ListChecks" size="13" />{{ 'listTab' | componentT:'channel-view' }}
            </button>
            <button type="button" class="cv-tab" [class.cv-tab--active]="activeTab() === 'board'" (click)="activeTab.set('board')">
              <lucide-icon [img]="LayoutDashboard" size="13" />{{ 'boardTab' | componentT:'channel-view' }}
            </button>
            <button type="button" class="cv-tab" [class.cv-tab--active]="activeTab() === 'calendar'" (click)="activeTab.set('calendar')">
              <lucide-icon [img]="Calendar" size="13" />{{ 'calendarTab' | componentT:'channel-view' }}
            </button>
            <button type="button" class="cv-tab" [class.cv-tab--active]="activeTab() === 'gantt'" (click)="activeTab.set('gantt')">
              <lucide-icon [img]="ChartGantt" size="13" />{{ 'ganttTab' | componentT:'channel-view' }}
            </button>
            <button type="button" class="cv-tab" [class.cv-tab--active]="activeTab() === 'team'" (click)="activeTab.set('team')">
              <lucide-icon [img]="Users" size="13" />{{ 'teamTab' | componentT:'channel-view' }}
            </button>
            <button type="button" class="cv-tab">
              <lucide-icon [img]="Plus" size="13" />{{ 'addViewTab' | componentT:'channel-view' }}
            </button>
          </nav>
        </div>

        <div class="cv-tabbar__right">
          <button type="button" class="cv-action">
            <lucide-icon [img]="Phone" size="14" />{{ 'callAction' | componentT:'channel-view' }}
            <lucide-icon [img]="ChevronDown" size="12" />
          </button>
          <button type="button" class="cv-action cv-action--icon" aria-label="Connections">
            <lucide-icon [img]="Link2" size="15" />
          </button>
          <button type="button" class="cv-action">
            <lucide-icon [img]="Workflow" size="14" />{{ 'automateAction' | componentT:'channel-view' }}
          </button>
          <button type="button" class="cv-action">
            <lucide-icon [img]="BrainCircuit" size="14" />Brain<sup>2</sup>
          </button>
          <button type="button" class="cv-action">
            <lucide-icon [img]="Share2" size="14" />{{ 'shareAction' | componentT:'channel-view' }}
          </button>
        </div>
      </header>

      <!-- ── Content ── -->
      <div class="cv-content">
        @if (activeTab() === 'channel') {

          <div class="cv-scroll">
            @if (messages().length === 0) {
              <div class="cv-welcome">
                <div class="cv-welcome__inner">
                  <div class="cv-thumb">
                    <span class="cv-thumb__dot cv-thumb__dot--a"></span>
                    <span class="cv-thumb__dot cv-thumb__dot--b"></span>
                  </div>
                  <h1>{{ 'chatIntroLead' | componentT:'channel-view' }} #{{ ch.name }}</h1>
                  <p>{{ 'chatIntroBody' | componentT:'channel-view' }}</p>

                  <div class="cv-welcome__actions">
                    <button type="button" class="cv-btn">
                      <lucide-icon [img]="Plus" size="14" />{{ 'addPeople' | componentT:'channel-view' }}
                    </button>
                    <button type="button" class="cv-btn">
                      <lucide-icon [img]="Download" size="14" />{{ 'importFromSlack' | componentT:'channel-view' }}
                    </button>
                  </div>

                  <div class="cv-cards">
                    <button type="button" class="cv-card">
                      <span class="cv-card__icon cv-card__icon--violet"><lucide-icon [img]="ListChecks" size="16" /></span>
                      <span>
                        <b>{{ 'trackTasksTitle' | componentT:'channel-view' }}</b>
                        <em>{{ 'trackTasksDesc' | componentT:'channel-view' }}</em>
                      </span>
                    </button>
                    <button type="button" class="cv-card">
                      <span class="cv-card__icon cv-card__icon--blue"><lucide-icon [img]="FileText" size="16" /></span>
                      <span>
                        <b>{{ 'addDocTitle' | componentT:'channel-view' }}</b>
                        <em>{{ 'addDocDesc' | componentT:'channel-view' }}</em>
                      </span>
                    </button>
                    <button type="button" class="cv-card">
                      <span class="cv-card__icon cv-card__icon--green"><lucide-icon [img]="Video" size="16" /></span>
                      <span>
                        <b>{{ 'startSyncUpTitle' | componentT:'channel-view' }}</b>
                        <em>{{ 'startSyncUpDesc' | componentT:'channel-view' }}</em>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            } @else {
              <div class="cv-messages">
                @for (m of messages(); track m.id) {
                  <div class="cv-msg">
                    <span class="cv-msg__avatar">{{ meInitial() }}</span>
                    <div class="cv-msg__body">
                      <div class="cv-msg__head">
                        <b>You</b><time>{{ m.time }}</time>
                        @if (m.postType !== 'message') { <span class="cv-msg__tag">{{ postTypeLabelKey(m.postType) | componentT:'channel-view' }}</span> }
                      </div>
                      @if (m.text) { <p>{{ m.text }}</p> }
                      @if (m.voice; as v) {
                        <app-voice-player class="cv-msg__voice" [url]="v.url" [peaks]="v.peaks" [duration]="v.duration" [mime]="v.mime" />
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          @if (!bannerDismissed() && messages().length === 0) {
            <div class="cv-banner">
              <span>🎉 {{ 'getConversationStarted' | componentT:'channel-view' }} #{{ ch.name }} {{ 'getConversationStartedSuffix' | componentT:'channel-view' }}</span>
              <button type="button" (click)="bannerDismissed.set(true)">{{ 'dismiss' | componentT:'channel-view' }}</button>
            </div>
          }

          <div class="cv-composer-wrap" data-cv-pop>

            <!-- Post-type popover (Message / Announcement / Discussion / Idea / Update) -->
            @if (postMenuOpen()) {
              <div class="cv-pop cv-pop--post" role="menu">
                <button type="button" class="cv-pop__item cv-pop__item--main" role="menuitemradio"
                  [attr.aria-checked]="postType() === 'message'" (click)="selectPostType('message')">
                  <lucide-icon [img]="Send" size="15" />
                  <span>{{ 'postMessage' | componentT:'channel-view' }}</span>
                  @if (postType() === 'message') { <lucide-icon class="cv-pop__check" [img]="Check" size="15" /> }
                </button>
                <div class="cv-pop__sep"></div>
                <div class="cv-pop__label">{{ 'postTypes' | componentT:'channel-view' }}</div>
                @for (t of postTypes; track t.id) {
                  <button type="button" class="cv-pop__item" role="menuitemradio"
                    [attr.aria-checked]="postType() === t.id" (click)="selectPostType(t.id)">
                    <lucide-icon [img]="t.icon" size="15" [style.color]="t.color" />
                    <span>{{ t.labelKey | componentT:'channel-view' }}</span>
                    @if (postType() === t.id) { <lucide-icon class="cv-pop__check" [img]="Check" size="15" /> }
                  </button>
                }
              </div>
            }

            <!-- Slash-command popover -->
            @if (slashOpen()) {
              <div class="cv-pop cv-pop--slash" role="listbox">
                @if (slashSuggestions().length) {
                  <div class="cv-pop__label">{{ 'slashSuggestions' | componentT:'channel-view' }}</div>
                  <div class="cv-slash-grid">
                    @for (it of slashSuggestions(); track it.id) {
                      <button type="button" class="cv-slash-item" role="option"
                        [class.cv-slash-item--active]="slashActive() === it.id"
                        (mouseenter)="slashActive.set(it.id)" (mousedown)="$event.preventDefault()" (click)="applySlash(it)">
                        <span class="cv-slash-item__icon"><lucide-icon [img]="it.icon" size="14" /></span>
                        <span class="cv-slash-item__label">{{ it.labelKey | componentT:'channel-view' }}</span>
                        @if (it.isNew) { <span class="cv-slash-item__new">{{ 'slashNew' | componentT:'channel-view' }}</span> }
                      </button>
                    }
                  </div>
                }
                @if (slashText().length) {
                  <div class="cv-pop__label cv-pop__label--spaced">{{ 'slashText' | componentT:'channel-view' }}</div>
                  <div class="cv-slash-grid">
                    @for (it of slashText(); track it.id) {
                      <button type="button" class="cv-slash-item" role="option"
                        [class.cv-slash-item--active]="slashActive() === it.id"
                        (mouseenter)="slashActive.set(it.id)" (mousedown)="$event.preventDefault()" (click)="applySlash(it)">
                        <span class="cv-slash-item__icon"><lucide-icon [img]="it.icon" size="14" /></span>
                        <span class="cv-slash-item__label">{{ it.labelKey | componentT:'channel-view' }}</span>
                      </button>
                    }
                  </div>
                }
              </div>
            }

            <footer class="cv-composer" [class.cv-composer--rec]="voiceState() === 'recording'">

              <!-- Recorded voice note, ready to send -->
              @if (voiceNote(); as v) {
                <app-voice-player class="cv-voice-pending" [url]="v.url" [peaks]="v.peaks" [duration]="v.duration" [mime]="v.mime"
                  [deletable]="true" (deleted)="discardVoice()" />
              }

              <input class="cv-composer__input" type="text"
                [placeholder]="('messagePlaceholder' | componentT:'channel-view') + ' #' + ch.name + ', ' + ('messagePlaceholderSuffix' | componentT:'channel-view')"
                [value]="draft()" (input)="onDraftInput($event)" (keydown)="onComposerKeydown($event)" />

              @if (voiceError(); as err) { <div class="cv-voice-error" role="alert">{{ err | componentT:'channel-view' }}</div> }

              @if (voiceState() === 'recording') {
                <!-- Recording bar -->
                <div class="cv-rec">
                  <button type="button" class="cv-rec__cancel" (click)="stopRecording('cancel')" [attr.aria-label]="'voiceCancel' | componentT:'channel-view'">
                    <lucide-icon [img]="X" size="13" />
                  </button>
                  <span class="cv-rec__dot"></span>
                  <time class="cv-rec__time">{{ fmt(recordSeconds(), false) }}</time>
                  <div class="cv-live" aria-hidden="true">
                    @for (h of liveBars(); track $index) { <i [style.height.%]="h"></i> }
                  </div>
                  <button type="button" class="cv-rec__btn" (click)="stopRecording('voice')">{{ 'voiceNote' | componentT:'channel-view' }}</button>
                  <button type="button" class="cv-rec__btn cv-rec__btn--primary" (click)="stopRecording('transcribe')">{{ 'voiceTranscribe' | componentT:'channel-view' }}</button>
                </div>
              } @else {
                <div class="cv-composer__toolbar">
                  <div class="cv-composer__left">
                    <button type="button" class="cv-tool" aria-label="Add"><lucide-icon [img]="Plus" size="15" /></button>
                    <span class="cv-tool-divider"></span>
                    <button type="button" class="cv-tool cv-tool--wide" aria-haspopup="menu" [attr.aria-expanded]="postMenuOpen()"
                      (click)="togglePostMenu()">
                      {{ currentPostLabelKey() | componentT:'channel-view' }}<lucide-icon [img]="ChevronDown" size="12" />
                    </button>
                    <button type="button" class="cv-tool" aria-label="AI"><lucide-icon [img]="Sparkles" size="14" /></button>
                    <button type="button" class="cv-tool" aria-label="Agent"><lucide-icon [img]="Bot" size="14" /></button>
                    <button type="button" class="cv-tool" aria-label="Attach"><lucide-icon [img]="Paperclip" size="14" /></button>
                    <button type="button" class="cv-tool" aria-label="Mention"><lucide-icon [img]="AtSign" size="14" /></button>
                    <button type="button" class="cv-tool" aria-label="Assign"><lucide-icon [img]="UserPlus" size="14" /></button>
                    <button type="button" class="cv-tool" aria-label="Emoji"><lucide-icon [img]="Smile" size="14" /></button>
                    <button type="button" class="cv-tool" aria-label="Video"><lucide-icon [img]="Video" size="14" /></button>
                    <button type="button" class="cv-tool" aria-label="Automate"><lucide-icon [img]="Zap" size="14" /></button>
                    <button type="button" class="cv-tool" aria-label="File"><lucide-icon [img]="FileText" size="14" /></button>
                    <button type="button" class="cv-tool" aria-label="Image"><lucide-icon [img]="Image" size="14" /></button>
                  </div>
                  <div class="cv-composer__right">
                    <button type="button" class="cv-tool" [attr.aria-label]="'voiceRecord' | componentT:'channel-view'" (click)="startRecording()">
                      <lucide-icon [img]="Mic" size="14" />
                    </button>
                    <button type="button" class="cv-send" [disabled]="!canSend()" [attr.aria-label]="'send' | componentT:'channel-view'" (click)="sendMessage()">
                      <lucide-icon [img]="Send" size="14" />
                    </button>
                    <button type="button" class="cv-tool cv-tool--caret" aria-label="Send options"><lucide-icon [img]="ChevronDown" size="12" /></button>
                  </div>
                </div>
              }
            </footer>
          </div>

        } @else {
          <div class="cv-scroll">
            <div class="cv-soon">
              <p class="cv-soon__title">{{ 'comingSoonTitle' | componentT:'channel-view' }}</p>
              <p class="cv-soon__desc">{{ 'comingSoonDesc' | componentT:'channel-view' }}</p>
            </div>
          </div>
        }
      </div>

    } @else {
      <div class="cv-notfound">
        <h2>{{ 'notFoundTitle' | componentT:'channel-view' }}</h2>
        <p>{{ 'notFoundDesc' | componentT:'channel-view' }}</p>
        <a routerLink="/dashboard">{{ 'backToDashboard' | componentT:'channel-view' }}</a>
      </div>
    }
  </div>
  `,
  styles: [`
    :host { display: block; height: 100%; min-height: 0; overflow: hidden; }
    .cv-shell { display: flex; flex-direction: column; height: 100%; min-height: 0; overflow: hidden; background: var(--color-canvas); color: var(--color-text-primary); }

    /* Tab bar — mirrors SpaceShellComponent */
    .cv-tabbar { display: flex; align-items: center; justify-content: space-between; min-height: 3.6rem; padding: 0 .95rem; border-bottom: 1px solid var(--color-border); flex: none; gap: .5rem; }
    .cv-tabbar__left { display: flex; align-items: flex-end; flex: 1; min-width: 0; overflow: hidden; }
    .cv-badge-btn { display: inline-flex; align-items: center; gap: .32rem; flex: none; height: 2.1rem; padding: 0 .4rem 0 .2rem; border: 0; background: transparent; color: var(--color-text-primary); font: inherit; font-size: .74rem; font-weight: 700; cursor: pointer; border-radius: .35rem; margin-bottom: .15rem; }
    .cv-badge-btn:hover { background: var(--color-surface-3); }
    .cv-badge { width: 1.15rem; height: 1.15rem; display: grid; place-items: center; border-radius: .3rem; color: #fff; flex: none; }
    .cv-badge-btn__star { color: var(--color-text-muted); }
    .cv-badge-btn__star--on { color: #e8b830; }

    .cv-tabs { display: flex; align-items: flex-end; overflow: hidden; }
    .cv-tab { display: inline-flex; align-items: center; gap: .3rem; height: 2.05rem; padding: 0 .5rem; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--color-text-muted); font: inherit; font-size: .69rem; font-weight: 600; white-space: nowrap; cursor: pointer; text-decoration: none; transition: color .12s; }
    .cv-tab:hover { color: var(--color-text-primary); }
    .cv-tab--active { color: var(--color-text-primary) !important; border-bottom-color: var(--color-accent) !important; }

    .cv-tabbar__right { flex: none; display: flex; align-items: center; gap: .2rem; }
    .cv-action { height: 1.8rem; display: inline-flex; align-items: center; gap: .28rem; padding: 0 .5rem; border: 0; border-radius: .35rem; background: transparent; color: var(--color-text-muted); font: inherit; font-size: .68rem; font-weight: 600; white-space: nowrap; cursor: pointer; }
    .cv-action:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
    .cv-action--icon { width: 1.8rem; padding: 0; }
    .cv-action sup { font-size: .55rem; }

    /* Content — tab bar and composer stay fixed; only .cv-scroll scrolls */
    .cv-content { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
    .cv-scroll { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; }

    .cv-welcome { flex: 1; display: flex; align-items: flex-start; justify-content: center; padding: 2.6rem 1rem 1rem; }
    .cv-welcome__inner { width: 100%; max-width: 30rem; }
    .cv-thumb { position: relative; width: 3.4rem; height: 3.4rem; border-radius: .7rem; margin-bottom: 1rem; background: var(--color-surface-3); border: 1px solid var(--color-border-strong); }
    .cv-thumb__dot { position: absolute; width: .95rem; height: .95rem; border-radius: 50%; border: 2px solid var(--color-canvas); bottom: -.25rem; }
    .cv-thumb__dot--a { background: #3fa772; right: .55rem; }
    .cv-thumb__dot--b { background: #5b9bd5; right: -.15rem; }
    .cv-welcome__inner h1 { margin: 0 0 .4rem; font-size: 1.25rem; font-weight: 800; }
    .cv-welcome__inner > p { margin: 0 0 1.1rem; color: var(--color-text-secondary); font-size: .82rem; line-height: 1.5; max-width: 26rem; }

    .cv-welcome__actions { display: flex; gap: .5rem; margin-bottom: 1.4rem; }
    .cv-btn { display: inline-flex; align-items: center; gap: .4rem; height: 2.1rem; padding: 0 .85rem; border: 1px solid var(--color-border-strong); border-radius: .5rem; background: transparent; color: var(--color-text-secondary); font: inherit; font-size: .78rem; font-weight: 650; cursor: pointer; }
    .cv-btn:hover { color: var(--color-text-primary); background: var(--color-surface-3); }

    .cv-cards { display: flex; flex-direction: column; gap: .4rem; }
    .cv-card { display: flex; align-items: center; gap: .7rem; width: 100%; padding: .7rem .8rem; border: 1px solid var(--color-border); border-radius: .6rem; background: var(--color-surface-1); text-align: start; cursor: pointer; }
    .cv-card:hover { background: var(--color-surface-3); border-color: var(--color-border-strong); }
    .cv-card__icon { flex: none; width: 2rem; height: 2rem; display: grid; place-items: center; border-radius: .45rem; color: #fff; }
    .cv-card__icon--violet { background: #8e5fe0; }
    .cv-card__icon--blue { background: #5b9bd5; }
    .cv-card__icon--green { background: #3fa772; }
    .cv-card > span:last-child { display: flex; flex-direction: column; gap: .1rem; min-width: 0; }
    .cv-card b { font-size: .82rem; font-weight: 700; color: var(--color-text-primary); }
    .cv-card em { font-size: .71rem; font-style: normal; color: var(--color-text-muted); }

    /* Messages (once the user has sent something) */
    .cv-messages { flex: 1; padding: 1.1rem 1.2rem; display: flex; flex-direction: column; gap: .9rem; }
    .cv-msg { display: flex; gap: .6rem; }
    .cv-msg__avatar { flex: none; width: 1.9rem; height: 1.9rem; border-radius: .4rem; display: grid; place-items: center; background: var(--color-accent); color: #fff; font-size: .72rem; font-weight: 700; }
    .cv-msg__head { display: flex; align-items: baseline; gap: .5rem; }
    .cv-msg__head b { font-size: .8rem; }
    .cv-msg__head time { font-size: .66rem; color: var(--color-text-muted); }
    .cv-msg__tag { font-size: .62rem; font-weight: 700; padding: .05rem .4rem; border-radius: 999px; background: var(--color-surface-3); color: var(--color-text-secondary); }
    .cv-msg__voice { margin-top: .3rem; }
    .cv-msg__body p { margin: .1rem 0 0; font-size: .82rem; color: var(--color-text-secondary); line-height: 1.45; }

    /* Get-started banner */
    .cv-banner { flex: none; display: flex; align-items: center; justify-content: space-between; gap: .8rem; margin: 0 1.1rem 1rem; padding: .55rem .8rem; border: 1px solid var(--color-border-strong); border-radius: .5rem; background: var(--color-surface-1); font-size: .76rem; color: var(--color-text-secondary); }
    .cv-banner button { flex: none; border: 0; background: transparent; color: var(--color-text-muted); font: inherit; font-size: .74rem; font-weight: 650; cursor: pointer; }
    .cv-banner button:hover { color: var(--color-text-primary); }

    /* Composer */
    .cv-composer-wrap { position: relative; flex: none; margin: 0 1.1rem 1.1rem; }
    .cv-composer { flex: none; border: 1px solid var(--color-border-strong); border-radius: .6rem; background: var(--color-surface-1); }
    .cv-composer__input { width: 100%; border: 0; background: transparent; padding: .7rem .8rem .35rem; color: var(--color-text-primary); font: inherit; font-size: .82rem; }
    .cv-composer__input::placeholder { color: var(--color-text-muted); }
    .cv-composer__input:focus { outline: none; }
    .cv-composer__toolbar { display: flex; align-items: center; justify-content: space-between; gap: .4rem; padding: 0 .45rem .45rem; }
    .cv-composer__left { display: flex; align-items: center; gap: .05rem; flex-wrap: wrap; min-width: 0; }
    .cv-composer__right { display: flex; align-items: center; gap: .1rem; flex: none; }
    .cv-tool-divider { width: 1px; align-self: center; height: 1.1rem; margin: 0 .3rem; background: var(--color-border-strong); }
    .cv-tool { width: 1.7rem; height: 1.7rem; display: inline-flex; align-items: center; justify-content: center; gap: .2rem; flex: none; border: 0; border-radius: .35rem; background: transparent; color: var(--color-text-muted); cursor: pointer; }
    .cv-tool:hover { color: var(--color-text-primary); background: var(--color-surface-3); }
    .cv-tool--wide { width: auto; padding: 0 .4rem; font-size: .68rem; font-weight: 600; }
    .cv-tool--caret { width: 1.15rem; }
    .cv-send { flex: none; width: 1.7rem; height: 1.7rem; display: grid; place-items: center; border: 0; border-radius: .4rem; background: var(--color-accent); color: #fff; cursor: pointer; }
    .cv-send:disabled { opacity: .4; cursor: not-allowed; }
    .cv-send:not(:disabled):hover { background: color-mix(in srgb, var(--color-accent) 80%, #000); }

    .cv-composer--rec { border-color: var(--color-accent); }

    /* Popovers (post types + slash commands) */
    .cv-pop { position: absolute; bottom: calc(100% + .4rem); inset-inline-start: 0; z-index: 30; background: var(--color-surface-1); border: 1px solid var(--color-border-strong); border-radius: .6rem; box-shadow: 0 10px 28px rgba(0,0,0,.45); padding: .35rem; }
    .cv-pop--post { width: 12.5rem; }
    .cv-pop--slash { width: min(30rem, 100%); max-height: 25rem; overflow-y: auto; padding: .6rem .5rem; }
    .cv-pop__label { padding: .3rem .55rem; font-size: .66rem; font-weight: 600; letter-spacing: .03em; text-transform: uppercase; color: var(--color-text-muted); }
    .cv-pop--post .cv-pop__label { text-transform: none; letter-spacing: 0; }
    .cv-pop__label--spaced { margin-top: .4rem; }
    .cv-pop__sep { height: 1px; margin: .25rem -.35rem; background: var(--color-border); }
    .cv-pop__item { display: flex; align-items: center; gap: .6rem; width: 100%; padding: .48rem .55rem; border: 0; border-radius: .4rem; background: transparent; color: var(--color-text-primary); font: inherit; font-size: .78rem; text-align: start; cursor: pointer; }
    .cv-pop__item:hover { background: var(--color-surface-3); }
    .cv-pop__item--main { font-weight: 700; }
    .cv-pop__check { margin-inline-start: auto; }

    .cv-slash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .1rem .5rem; }
    .cv-slash-item { display: flex; align-items: center; gap: .55rem; min-width: 0; padding: .35rem .45rem; border: 0; border-radius: .4rem; background: transparent; color: var(--color-text-primary); font: inherit; font-size: .78rem; text-align: start; cursor: pointer; }
    .cv-slash-item--active, .cv-slash-item:hover { background: var(--color-surface-3); }
    .cv-slash-item__icon { flex: none; width: 1.7rem; height: 1.7rem; display: grid; place-items: center; border: 1px solid var(--color-border-strong); border-radius: .4rem; color: var(--color-text-secondary); }
    .cv-slash-item__label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cv-slash-item__new { flex: none; padding: .05rem .35rem; border-radius: .25rem; background: var(--color-surface-3); font-size: .58rem; font-weight: 800; letter-spacing: .04em; }

    /* Voice note */
    .cv-voice-pending { display: block; width: fit-content; max-width: calc(100% - 1.4rem); margin: .6rem .7rem 0; }
    .cv-voice-error { padding: 0 .8rem .4rem; font-size: .7rem; color: #e5484d; }

    .cv-rec { display: flex; align-items: center; gap: .5rem; padding: .2rem .55rem .55rem; }
    .cv-rec__cancel { flex: none; width: 1.6rem; height: 1.6rem; display: grid; place-items: center; border: 0; border-radius: 50%; background: var(--color-surface-3); color: var(--color-text-secondary); cursor: pointer; }
    .cv-rec__cancel:hover { color: var(--color-text-primary); }
    .cv-rec__dot { flex: none; width: .5rem; height: .5rem; border-radius: 50%; background: #e5484d; animation: cv-pulse 1.1s ease-in-out infinite; }
    .cv-rec__time { flex: none; font-size: .72rem; color: var(--color-text-muted); font-variant-numeric: tabular-nums; }
    /* Live level meter: newest sample on the right, older ones scroll left (WhatsApp style) */
    .cv-live { flex: 1; min-width: 1rem; height: 1.8rem; display: flex; align-items: center; justify-content: flex-end; gap: 2px; overflow: hidden; }
    .cv-live i { flex: none; width: 2px; border-radius: 1px; background: var(--color-text-secondary); transition: height 60ms linear; }
    .cv-rec__btn { flex: none; height: 1.9rem; padding: 0 .8rem; border: 0; border-radius: 999px; background: var(--color-surface-3); color: var(--color-text-primary); font: inherit; font-size: .74rem; font-weight: 650; cursor: pointer; }
    .cv-rec__btn:hover { filter: brightness(1.15); }
    .cv-rec__btn--primary { background: var(--color-text-primary); color: var(--color-canvas); }
    @keyframes cv-pulse { 50% { opacity: .3; } }

    /* Coming soon */
    .cv-soon { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .3rem; padding: 3rem 1rem; text-align: center; }
    .cv-soon__title { margin: 0; font-size: .92rem; font-weight: 750; color: var(--color-text-primary); }
    .cv-soon__desc { margin: 0; font-size: .78rem; color: var(--color-text-muted); }

    /* Not found */
    .cv-notfound { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .4rem; padding: 3rem 1rem; text-align: center; }
    .cv-notfound h2 { margin: 0; font-size: 1rem; font-weight: 750; }
    .cv-notfound p { margin: 0; color: var(--color-text-muted); font-size: .8rem; }
    .cv-notfound a { margin-top: .5rem; color: var(--color-accent); font-size: .8rem; font-weight: 650; text-decoration: none; }
    .cv-notfound a:hover { text-decoration: underline; }

    @media (max-width: 1024px) { .cv-tabbar__right { display: none; } }
    @media (max-width: 700px) { .cv-tabbar { min-height: 3rem; overflow-x: auto; padding-inline: .65rem; } }
  `],
})
export class ChannelViewComponent {
  private readonly route          = inject(ActivatedRoute);
  private readonly channelStore   = inject(ChannelStore);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly i18n           = inject(ComponentI18nService);
  private readonly destroyRef     = inject(DestroyRef);

  readonly Hash = Hash; readonly Lock = Lock; readonly ChevronDown = ChevronDown; readonly Star = Star;
  readonly Phone = Phone; readonly Link2 = Link2; readonly Share2 = Share2; readonly Workflow = Workflow; readonly BrainCircuit = BrainCircuit;
  readonly ListChecks = ListChecks; readonly LayoutDashboard = LayoutDashboard; readonly Calendar = Calendar; readonly ChartGantt = ChartGantt;
  readonly Users = Users; readonly Plus = Plus; readonly Download = Download; readonly FileText = FileText; readonly Video = Video;
  readonly AtSign = AtSign; readonly Paperclip = Paperclip; readonly Image = Image; readonly Mic = Mic; readonly Send = Send;
  readonly Sparkles = Sparkles; readonly Bot = Bot; readonly UserPlus = UserPlus; readonly Smile = Smile; readonly Zap = Zap;
  readonly Check = Check; readonly Megaphone = Megaphone; readonly MessageCircle = MessageCircle; readonly MessageSquare = MessageSquare;
  readonly Lightbulb = Lightbulb; readonly Bell = Bell; readonly ToggleLeft = ToggleLeft; readonly Square = Square;
  readonly Bookmark = Bookmark; readonly PenSquare = PenSquare; readonly Presentation = Presentation; readonly Table = Table;
  readonly CheckSquare = CheckSquare; readonly Type = Type; readonly ListOrdered = ListOrdered; readonly Heading1 = Heading1; readonly Heading2 = Heading2;
  readonly Cloud = Cloud; readonly Package = Package; readonly HardDrive = HardDrive; readonly X = X;

  private readonly channelId = toSignal(
    this.route.paramMap.pipe(map(p => p.get('channelId') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('channelId') ?? '' },
  );

  readonly channel = computed<ChannelSnapshot | null>(() => {
    const id = this.channelId();
    const stored = this.channelStore.findById(id);
    if (stored) return stored;

    if (id === 'welcome') {
      return { id: 'welcome', workspaceId: this.workspaceStore.activeId() ?? 0, name: 'Welcome', isPrivate: false, color: '#16a883', topic: null, createdAt: '' };
    }
    if (id === 'general') {
      return { id: 'general', workspaceId: this.workspaceStore.activeId() ?? 0, name: 'General', isPrivate: false, color: '#16a883', topic: null, createdAt: '' };
    }
    return null;
  });

  readonly activeTab       = signal<ChannelTab>('channel');
  readonly favorite        = signal(false);
  readonly bannerDismissed = signal(false);
  readonly draft           = signal('');
  readonly messages        = signal<ChatMessage[]>([]);

  readonly meInitial = computed(() => 'Y');

  private nextMessageId = 1;

  // ── Post types ────────────────────────────────────────────────────────────
  readonly postTypes: PostTypeItem[] = [
    { id: 'announcement', labelKey: 'postAnnouncement', icon: Megaphone,     color: '#e5484d' },
    { id: 'discussion',   labelKey: 'postDiscussion',   icon: MessageSquare, color: '#e5484d' },
    { id: 'idea',         labelKey: 'postIdea',         icon: Lightbulb,     color: '#f5a524' },
    { id: 'update',       labelKey: 'postUpdate',       icon: Bell,          color: '#6e6ef0' },
  ];
  readonly postType     = signal<PostType>('message');
  readonly postMenuOpen = signal(false);
  readonly currentPostLabelKey = computed(() => this.postTypeLabelKey(this.postType()));

  postTypeLabelKey(t: PostType): string {
    return t === 'message' ? 'postMessage' : this.postTypes.find(x => x.id === t)!.labelKey;
  }
  togglePostMenu(): void { this.slashDismissed.set(true); this.postMenuOpen.update(v => !v); }
  selectPostType(t: PostType): void { this.postType.set(t); this.postMenuOpen.set(false); }

  // ── Slash commands ────────────────────────────────────────────────────────
  private readonly slashItems: SlashItem[] = [
    { id: 'skills',     labelKey: 'slashSkills',     section: 'suggestions', icon: Zap,         isNew: true, insert: '' },
    { id: 'ai',         labelKey: 'slashAskAi',      section: 'suggestions', icon: Sparkles,    insert: '' },
    { id: 'agent',      labelKey: 'slashAgent',      section: 'suggestions', icon: Bot,         insert: '' },
    { id: 'banners',    labelKey: 'slashBanners',    section: 'suggestions', icon: Bookmark,    insert: '' },
    { id: 'checklist',  labelKey: 'slashChecklist',  section: 'suggestions', icon: CheckSquare, insert: '[ ] ' },
    { id: 'table',      labelKey: 'slashTable',      section: 'suggestions', icon: Table,       insert: '' },
    { id: 'toggle',     labelKey: 'slashToggleList', section: 'suggestions', icon: ToggleLeft,  insert: '> ' },
    { id: 'button',     labelKey: 'slashButton',     section: 'suggestions', icon: Square,      insert: '' },
    { id: 'doc',        labelKey: 'slashCreateDoc',  section: 'suggestions', icon: FileText,    insert: '' },
    { id: 'whiteboard', labelKey: 'slashWhiteboard', section: 'suggestions', icon: Presentation,insert: '' },
    { id: 'standup',    labelKey: 'slashStandUp',    section: 'suggestions', icon: PenSquare,   insert: '' },
    { id: 'normal',     labelKey: 'slashNormalText', section: 'text', icon: Type,        insert: '' },
    { id: 'numbered',   labelKey: 'slashNumbered',   section: 'text', icon: ListOrdered, insert: '1. ' },
    { id: 'h1',         labelKey: 'slashHeading1',   section: 'text', icon: Heading1,    insert: '# ' },
    { id: 'toggle2',    labelKey: 'slashToggleList', section: 'text', icon: ToggleLeft,  insert: '> ' },
    { id: 'h2',         labelKey: 'slashHeading2',   section: 'text', icon: Heading2,    insert: '## ' },
    { id: 'banners2',   labelKey: 'slashBanners',    section: 'text', icon: Bookmark,    insert: '' },
    { id: 'h3',         labelKey: 'slashHeading3',   section: 'text', icon: Heading3,    insert: '### ' },
    { id: 'code',       labelKey: 'slashCodeBlock',  section: 'text', icon: Code,        insert: '```\n' },
  ];

  /** Set when the user presses Esc / picks something, until the draft changes again. */
  private readonly slashDismissed = signal(false);
  readonly slashActive = signal<string>('');

  readonly slashOpen = computed(() =>
    !this.slashDismissed() && !this.postMenuOpen() && this.draft().startsWith('/') && this.voiceState() !== 'recording');

  private readonly slashFiltered = computed(() => {
    const q = this.draft().slice(1).trim().toLowerCase();
    return this.slashItems.filter(i => !q || this.i18n.t('channel-view', i.labelKey, i.labelKey).toLowerCase().includes(q));
  });
  readonly slashSuggestions = computed(() => this.slashFiltered().filter(i => i.section === 'suggestions'));
  readonly slashText        = computed(() => this.slashFiltered().filter(i => i.section === 'text'));

  onDraftInput(ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    this.draft.set(v);
    this.slashDismissed.set(false);
    this.voiceError.set(null);
    if (v.startsWith('/')) {
      this.postMenuOpen.set(false);
      this.slashActive.set(this.slashFiltered()[0]?.id ?? '');
    }
  }

  onComposerKeydown(ev: KeyboardEvent): void {
    if (this.slashOpen()) {
      const list = this.slashFiltered();
      const i = list.findIndex(x => x.id === this.slashActive());
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        if (!list.length) return;
        const next = (i + (ev.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length;
        this.slashActive.set(list[next].id);
        return;
      }
      if (ev.key === 'Enter' && list.length) {
        ev.preventDefault();
        this.applySlash(list[Math.max(i, 0)]);
        return;
      }
      if (ev.key === 'Escape') { ev.preventDefault(); this.slashDismissed.set(true); return; }
    }
    if (ev.key === 'Escape' && this.postMenuOpen()) { this.postMenuOpen.set(false); return; }
    if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); this.sendMessage(); }
  }

  applySlash(item: SlashItem): void {
    this.draft.set(item.insert);
    this.slashDismissed.set(true);
  }

  /** Close popovers when clicking anywhere outside the composer. */
  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(ev: MouseEvent): void {
    if ((ev.target as HTMLElement | null)?.closest('[data-cv-pop]')) return;
    if (this.postMenuOpen()) this.postMenuOpen.set(false);
    if (this.slashOpen()) this.slashDismissed.set(true);
  }

  // ── Voice notes ───────────────────────────────────────────────────────────
  readonly voiceState    = signal<'idle' | 'recording'>('idle');
  readonly recordSeconds = signal(0);
  readonly voiceNote     = signal<VoiceNote | null>(null);
  readonly voiceError    = signal<string | null>(null);
  /** Last N input levels (percent height) shown in the recording bar. */
  readonly liveBars      = signal<number[]>([]);

  readonly canSend = computed(() => !!this.draft().trim() || !!this.voiceNote());

  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private timerId: ReturnType<typeof setInterval> | null = null;
  private stopMode: 'voice' | 'transcribe' | 'cancel' = 'voice';
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private levelTimer: ReturnType<typeof setInterval> | null = null;
  private peaks: number[] = [];
  private startedAt = 0;
  private elapsedMs = 0;
  private recognition: any = null;
  private transcript = '';
  private voiceBlobUrls: string[] = [];

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.cleanupRecording();
      this.voiceBlobUrls.forEach(u => URL.revokeObjectURL(u));
    });
  }

  fmt(total: number, pad: boolean): string {
    const m = Math.floor(total / 60), s = total % 60;
    return `${pad ? String(m).padStart(2, '0') : m}:${String(s).padStart(2, '0')}`;
  }

  async startRecording(): Promise<void> {
    this.voiceError.set(null);
    this.slashDismissed.set(true);
    this.postMenuOpen.set(false);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      this.voiceError.set('voiceUnsupported');
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      this.voiceError.set('voiceDenied');
      return;
    }
    this.discardVoice();
    this.chunks = [];
    this.transcript = '';
    this.recorder = new MediaRecorder(this.stream);
    this.recorder.ondataavailable = e => { if (e.data.size) this.chunks.push(e.data); };
    this.recorder.onstop = () => this.finishRecording();
    this.recorder.start();

    // Optional live speech-to-text, used by the "Transcribe" action where supported.
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (SR) {
      try {
        this.recognition = new SR();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = document.documentElement.lang || 'en-US';
        this.recognition.onresult = (e: any) => {
          for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) this.transcript += e.results[i][0].transcript + ' ';
          }
        };
        this.recognition.start();
      } catch { this.recognition = null; }
    }

    this.startMeter();
    this.recordSeconds.set(0);
    this.startedAt = performance.now();
    this.voiceState.set('recording');
    this.timerId = setInterval(() => this.recordSeconds.set(Math.floor((performance.now() - this.startedAt) / 1000)), 250);
  }

  /** Samples the microphone level ~16×/s; feeds the live bars and the stored waveform. */
  private startMeter(): void {
    this.peaks = [];
    this.liveBars.set([]);
    try {
      const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
      this.audioCtx = new Ctx();
      const src = this.audioCtx.createMediaStreamSource(this.stream!);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      src.connect(this.analyser);
      const buf = new Uint8Array(this.analyser.fftSize);
      this.levelTimer = setInterval(() => {
        if (!this.analyser) return;
        this.analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
        // RMS → 0..1, boosted because speech RMS is small
        const level = Math.pow(Math.min(1, Math.sqrt(sum / buf.length) * 6), 0.75);
        this.peaks.push(level);
        this.liveBars.update(b => [...b.slice(-59), Math.round(10 + level * 90)]);
      }, 60);
    } catch { /* no Web Audio → bars stay empty, recording still works */ }
  }

  private stopMeter(): void {
    if (this.levelTimer) { clearInterval(this.levelTimer); this.levelTimer = null; }
    this.analyser = null;
    void this.audioCtx?.close().catch(() => undefined);
    this.audioCtx = null;
  }

  stopRecording(mode: 'voice' | 'transcribe' | 'cancel'): void {
    this.stopMode = mode;
    if (this.timerId) { clearInterval(this.timerId); this.timerId = null; }
    this.elapsedMs = performance.now() - this.startedAt;
    this.stopMeter();
    try { this.recognition?.stop(); } catch { /* already stopped */ }
    if (this.recorder && this.recorder.state !== 'inactive') this.recorder.stop();
    else this.finishRecording();
  }

  private finishRecording(): void {
    const seconds = Math.max(1, Math.round(this.elapsedMs / 1000));
    const mime = this.recorder?.mimeType || 'audio/webm';
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    this.recorder = null;
    this.voiceState.set('idle');

    if (this.stopMode === 'cancel') { this.chunks = []; return; }

    if (this.stopMode === 'transcribe') {
      // Give the recognizer a moment to flush its final result.
      setTimeout(() => {
        const text = this.transcript.trim();
        if (text) this.draft.update(d => (d ? d + ' ' : '') + text);
        else this.voiceError.set(this.recognition === null && !((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition)
          ? 'transcribeUnsupported' : 'transcribeEmpty');
        this.recognition = null;
        this.chunks = [];
      }, 350);
      return;
    }

    this.recognition = null;
    const blob = new Blob(this.chunks, { type: mime });
    this.chunks = [];
    const url = URL.createObjectURL(blob);
    this.voiceBlobUrls.push(url);
    this.voiceNote.set({ url, duration: seconds, peaks: this.peaks, mime: blob.type || mime });
    this.liveBars.set([]);
  }

  discardVoice(): void {
    const v = this.voiceNote();
    if (v) { URL.revokeObjectURL(v.url); this.voiceBlobUrls = this.voiceBlobUrls.filter(u => u !== v.url); }
    this.voiceNote.set(null);
  }

  private cleanupRecording(): void {
    if (this.timerId) clearInterval(this.timerId);
    this.stopMeter();
    try { this.recognition?.stop(); } catch { /* noop */ }
    if (this.recorder && this.recorder.state !== 'inactive') { this.recorder.onstop = null; this.recorder.stop(); }
    this.stream?.getTracks().forEach(t => t.stop());
  }

  // ── Sending ───────────────────────────────────────────────────────────────
  sendMessage(): void {
    const text = this.draft().trim();
    const voice = this.voiceNote();
    if (!text && !voice) return;

    this.messages.update(list => [...list, {
      id: this.nextMessageId++,
      text,
      postType: this.postType(),
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      // Ownership of the blob URL moves to the message (revoked on destroy).
      voice: voice ?? undefined,
    }]);

    this.draft.set('');
    this.voiceNote.set(null);
    this.voiceError.set(null);
    this.postType.set('message');
    this.slashDismissed.set(false);
  }
}
