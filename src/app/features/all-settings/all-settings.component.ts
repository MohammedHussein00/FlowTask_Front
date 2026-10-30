import {
  ChangeDetectionStrategy, Component, computed, inject, output, signal,
} from '@angular/core';
import {
  LucideAngularModule, X, ChevronRight, User, Bell, Briefcase, MessageSquare, Users, Link,
  LogOut, Settings, Shield, Trash2, Zap, Globe, Clock, ToggleLeft, Tag, Layout, Cpu, Smile,
  Box, ClipboardList, Key, BarChart2, Mail, LucideIconData,
} from 'lucide-angular';
import { ComponentTranslatePipe } from '../../core/i18n/component-translate.pipe';
import { ComponentI18nService }   from '../../core/i18n/component-i18n.service';

type SettingsSection =
  | 'profile' | 'notifications' | 'workspaces' | 'chat' | 'referrals'
  | 'general' | 'people' | 'teams' | 'upgrade' | 'billing' | 'ai-usage'
  | 'security' | 'audit-logs' | 'trash'
  | 'custom-fields' | 'tag-manager' | 'template-center'
  | 'automations' | 'ai-notetaker' | 'emojis' | 'spaces'
  | 'task-types' | 'work-schedule'
  | 'app-center' | 'imports-exports' | 'clickup-api' | 'email-integration'
  | 'preferences';

interface NavItem { id: SettingsSection; labelKey: string; icon: LucideIconData; }
interface NavGroup { headingKey: string | null; items: NavItem[]; }

@Component({
  selector: 'app-all-settings',
  standalone: true,
  imports: [LucideAngularModule, ComponentTranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="settings-overlay" (click)="onBackdropClick($event)">
  <div class="settings-panel" (click)="$event.stopPropagation()">

    <!-- Left nav -->
    <nav class="settings-nav" aria-label="Settings navigation">
      <div class="settings-nav__header">
        <span class="settings-nav__title">{{ 'allSettings' | componentT:'settings' }}</span>
        <button class="settings-nav__close" type="button"
          [attr.aria-label]="'closeSettings' | componentT:'settings'"
          (click)="close.emit()">
          <lucide-icon [img]="X" size="16" />
        </button>
      </div>

      @for (group of navGroups; track group.headingKey) {
        @if (group.headingKey) {
          <p class="settings-nav__group-label">{{ group.headingKey | componentT:'settings' }}</p>
        }
        @for (item of group.items; track item.id) {
          <button class="settings-nav__item"
            [class.settings-nav__item--active]="activeSection() === item.id"
            type="button" (click)="activeSection.set(item.id)">
            <lucide-icon [img]="item.icon" size="15" />
            <span>{{ item.labelKey | componentT:'settings' }}</span>
          </button>
        }
      }

      <div class="settings-nav__footer">
        <button class="settings-nav__item settings-nav__item--danger" type="button">
          <lucide-icon [img]="LogOut" size="15" />
          <span>{{ 'logout' | componentT:'settings' }}</span>
        </button>
      </div>
    </nav>

    <!-- Right content -->
    <div class="settings-content">
      <div class="settings-content__inner">

        @switch (activeSection()) {

          @case ('profile') {
            <h1 class="settings-h1">{{ 'profileTitle' | componentT:'settings' }}</h1>
            <section class="settings-section">
              <div class="settings-section__label">
                <h2>{{ 'profileSection' | componentT:'settings' }}</h2>
                <p>{{ 'profileDesc' | componentT:'settings' }}</p>
              </div>
              <div class="settings-section__fields">
                <div class="avatar-row">
                  <div class="avatar-circle">MM</div>
                  <div>
                    <p class="avatar-name">Muhammed Hussein Sophy Mustafa</p>
                    <button class="link-btn" type="button">{{ 'changeAvatar' | componentT:'settings' }}</button>
                  </div>
                </div>
                <label class="field-label">{{ 'fullName' | componentT:'settings' }}
                  <div class="field-input-wrap"><lucide-icon [img]="User" size="14" /><input class="field-input" type="text" value="Muhammed Hussein Sophy Mustafa" /></div>
                </label>
                <label class="field-label">{{ 'email' | componentT:'settings' }}
                  <div class="field-input-wrap"><lucide-icon [img]="Mail" size="14" /><input class="field-input" type="email" value="mh2156@fayoum.edu.eg" /></div>
                </label>
                <label class="field-label">{{ 'password' | componentT:'settings' }}
                  <div class="field-input-wrap"><lucide-icon [img]="Key" size="14" /><input class="field-input" type="password" [placeholder]="'enterNewPassword' | componentT:'settings'" /></div>
                </label>
              </div>
            </section>

            <section class="settings-section">
              <div class="settings-section__label">
                <h2>{{ 'twoFaTitle' | componentT:'settings' }}</h2>
                <p>{{ 'twoFaDesc' | componentT:'settings' }}</p>
              </div>
              <div class="settings-section__fields">
                <div class="toggle-row">
                  <div class="toggle-info">
                    <strong>{{ 'smsTwoFa' | componentT:'settings' }}</strong>
                    <span>{{ 'smsTwoFaDesc' | componentT:'settings' }}</span>
                    <span class="badge badge--business">{{ 'businessBadge' | componentT:'settings' }}</span>
                  </div>
                  <button class="toggle" type="button" aria-pressed="false"></button>
                </div>
                <div class="toggle-row">
                  <div class="toggle-info">
                    <strong>{{ 'totpTwoFa' | componentT:'settings' }}</strong>
                    <span>{{ 'totpTwoFaDesc' | componentT:'settings' }}</span>
                  </div>
                  <button class="toggle" type="button" aria-pressed="false"></button>
                </div>
              </div>
            </section>

            <section class="settings-section">
              <div class="settings-section__label">
                <h2>{{ 'themeColorTitle' | componentT:'settings' }}</h2>
                <p>{{ 'themeColorDesc' | componentT:'settings' }}</p>
              </div>
              <div class="settings-section__fields">
                <div class="color-swatches">
                  @for (swatch of themeColors; track swatch.value) {
                    <button class="swatch" [style.background]="swatch.value"
                      [class.swatch--active]="activeTheme() === swatch.value" type="button"
                      (click)="activeTheme.set(swatch.value)" [attr.aria-label]="swatch.label"></button>
                  }
                </div>
                <div class="appearance-row">
                  <button class="appearance-btn" [class.appearance-btn--active]="activeAppearance() === 'light'" type="button" (click)="activeAppearance.set('light')">
                    <div class="appearance-preview appearance-preview--light"><span></span><span></span></div>
                    <small>{{ 'appearanceLight' | componentT:'settings' }}</small>
                  </button>
                  <button class="appearance-btn" [class.appearance-btn--active]="activeAppearance() === 'dark'" type="button" (click)="activeAppearance.set('dark')">
                    <div class="appearance-preview appearance-preview--dark"><span></span><span></span></div>
                    <small>{{ 'appearanceDark' | componentT:'settings' }}</small>
                  </button>
                  <button class="appearance-btn" [class.appearance-btn--active]="activeAppearance() === 'auto'" type="button" (click)="activeAppearance.set('auto')">
                    <div class="appearance-preview appearance-preview--auto"><span></span><span></span></div>
                    <small>{{ 'appearanceAuto' | componentT:'settings' }}</small>
                  </button>
                </div>
              </div>
            </section>

            <section class="settings-section">
              <div class="settings-section__label">
                <h2>{{ 'languageRegionTitle' | componentT:'settings' }}</h2>
                <p>{{ 'languageRegionDesc' | componentT:'settings' }}</p>
              </div>
              <div class="settings-section__fields">
                <label class="field-label">{{ 'language' | componentT:'settings' }}
                  <div class="field-select-wrap"><lucide-icon [img]="Globe" size="14" /><select class="field-select"><option>English</option><option>العربية</option><option>Français</option></select></div>
                </label>
                <label class="field-label">{{ 'timezone' | componentT:'settings' }}
                  <div class="field-select-wrap"><lucide-icon [img]="Clock" size="14" /><select class="field-select"><option>Africa/Cairo</option></select></div>
                </label>
                <label class="checkbox-label"><input type="checkbox" checked /> {{ 'notifyTimezone' | componentT:'settings' }}</label>
              </div>
            </section>
          }

          @case ('preferences') {
            <h1 class="settings-h1">{{ 'preferencesTitle' | componentT:'settings' }}</h1>
            <section class="settings-section">
              <div class="settings-section__label">
                <h2>{{ 'timeDateTitle' | componentT:'settings' }}</h2>
                <p>{{ 'timeDateDesc' | componentT:'settings' }}</p>
              </div>
              <div class="settings-section__fields">
                <fieldset class="radio-group">
                  <legend>{{ 'weekStart' | componentT:'settings' }}</legend>
                  <label><input type="radio" name="week-start" value="sunday" checked /> {{ 'weekSunday' | componentT:'settings' }}</label>
                  <label><input type="radio" name="week-start" value="monday" /> {{ 'weekMonday' | componentT:'settings' }}</label>
                </fieldset>
                <fieldset class="radio-group">
                  <legend>{{ 'timeFormat' | componentT:'settings' }}</legend>
                  <label><input type="radio" name="time-fmt" value="24" /> {{ 'time24h' | componentT:'settings' }}</label>
                  <label><input type="radio" name="time-fmt" value="12" checked /> {{ 'time12h' | componentT:'settings' }}</label>
                </fieldset>
                <fieldset class="radio-group">
                  <legend>{{ 'dateFormat' | componentT:'settings' }}</legend>
                  <label><input type="radio" name="date-fmt" value="mdy" checked /> mm/dd/yyyy</label>
                  <label><input type="radio" name="date-fmt" value="dmy" /> dd/mm/yyyy</label>
                  <label><input type="radio" name="date-fmt" value="ymd" /> yyyy/mm/dd</label>
                </fieldset>
              </div>
            </section>
            <section class="settings-section">
              <div class="settings-section__label">
                <h2>{{ 'preferencesSection' | componentT:'settings' }}</h2>
                <p>{{ 'preferencesDesc' | componentT:'settings' }}</p>
              </div>
              <div class="settings-section__fields">
                @for (pref of appPreferences; track pref.key) {
                  <div class="toggle-row">
                    <div class="toggle-info">
                      <strong>{{ pref.label }}</strong>
                      <span>{{ pref.description }}</span>
                    </div>
                    <button class="toggle" [class.toggle--on]="pref.on" type="button"
                      [attr.aria-pressed]="pref.on" (click)="pref.on = !pref.on"></button>
                  </div>
                }
              </div>
            </section>
            <section class="settings-section">
              <div class="settings-section__label">
                <h2>{{ 'dangerZoneTitle' | componentT:'settings' }}</h2>
                <p>{{ 'dangerZoneDesc' | componentT:'settings' }}</p>
              </div>
              <div class="settings-section__fields danger-zone">
                <div class="danger-row">
                  <span>{{ 'logoutAllSessionsDesc' | componentT:'settings' }}</span>
                  <button class="btn btn--ghost" type="button">{{ 'logoutAllSessions' | componentT:'settings' }}</button>
                </div>
                <button class="btn btn--danger" type="button">{{ 'deleteAccount' | componentT:'settings' }}</button>
              </div>
            </section>
          }

          @case ('general') {
            <h1 class="settings-h1">{{ 'generalTitle' | componentT:'settings' }}</h1>
            <section class="settings-section">
              <div class="settings-section__label">
                <h2>{{ 'workspaceName' | componentT:'settings' }}</h2>
                <p>{{ 'workspaceNameDesc' | componentT:'settings' }}</p>
              </div>
              <div class="settings-section__fields">
                <label class="field-label">{{ 'workspaceName' | componentT:'settings' }}<input class="field-input" type="text" value="Fayoum" /></label>
              </div>
            </section>
          }

          @case ('people')      { <h1 class="settings-h1">{{ 'peopleTitle'       | componentT:'settings' }}</h1><p class="settings-empty">{{ 'peopleDesc'       | componentT:'settings' }}</p> }
          @case ('teams')       { <h1 class="settings-h1">{{ 'teamsTitle'        | componentT:'settings' }}</h1><p class="settings-empty">{{ 'teamsDesc'        | componentT:'settings' }}</p> }
          @case ('security')    { <h1 class="settings-h1">{{ 'securityTitle'     | componentT:'settings' }}</h1><p class="settings-empty">{{ 'securityDesc'     | componentT:'settings' }}</p> }
          @case ('audit-logs')  { <h1 class="settings-h1">{{ 'auditLogsTitle'    | componentT:'settings' }}</h1><p class="settings-empty">{{ 'auditLogsDesc'    | componentT:'settings' }}</p> }
          @case ('trash')       { <h1 class="settings-h1">{{ 'trashTitle'        | componentT:'settings' }}</h1><p class="settings-empty">{{ 'trashDesc'        | componentT:'settings' }}</p> }
          @case ('notifications'){ <h1 class="settings-h1">{{ 'notificationsTitle'| componentT:'settings'}}</h1><p class="settings-empty">{{ 'notificationsDesc'| componentT:'settings' }}</p> }
          @case ('billing')     { <h1 class="settings-h1">{{ 'billingTitle'      | componentT:'settings' }}</h1><p class="settings-empty">{{ 'billingDesc'      | componentT:'settings' }}</p> }
          @case ('upgrade')     { <h1 class="settings-h1">{{ 'upgradeTitle'      | componentT:'settings' }}</h1><p class="settings-empty">{{ 'upgradeDesc'      | componentT:'settings' }}</p> }
          @case ('ai-usage')    { <h1 class="settings-h1">{{ 'aiUsageTitle'      | componentT:'settings' }}</h1><p class="settings-empty">{{ 'aiUsageDesc'      | componentT:'settings' }}</p> }
          @case ('custom-fields'){ <h1 class="settings-h1">{{ 'customFieldsTitle'| componentT:'settings'}}</h1><p class="settings-empty">{{ 'customFieldsDesc' | componentT:'settings' }}</p> }
          @case ('tag-manager') { <h1 class="settings-h1">{{ 'tagManagerTitle'   | componentT:'settings' }}</h1><p class="settings-empty">{{ 'tagManagerDesc'   | componentT:'settings' }}</p> }
          @case ('template-center'){ <h1 class="settings-h1">{{ 'templateCenterTitle'|componentT:'settings'}}</h1><p class="settings-empty">{{ 'templateCenterDesc'|componentT:'settings'}}</p> }
          @case ('automations') { <h1 class="settings-h1">{{ 'automationsTitle'  | componentT:'settings' }}</h1><p class="settings-empty">{{ 'automationsDesc'  | componentT:'settings' }}</p> }
          @case ('ai-notetaker'){ <h1 class="settings-h1">{{ 'aiNotetakerTitle' | componentT:'settings' }}</h1><p class="settings-empty">{{ 'aiNotetakerDesc'  | componentT:'settings' }}</p> }
          @case ('emojis')      { <h1 class="settings-h1">{{ 'emojisTitle'       | componentT:'settings' }}</h1><p class="settings-empty">{{ 'emojisDesc'       | componentT:'settings' }}</p> }
          @case ('spaces')      { <h1 class="settings-h1">{{ 'spacesTitle'       | componentT:'settings' }}</h1><p class="settings-empty">{{ 'spacesDesc'       | componentT:'settings' }}</p> }
          @case ('task-types')  { <h1 class="settings-h1">{{ 'taskTypesTitle'    | componentT:'settings' }}</h1><p class="settings-empty">{{ 'taskTypesDesc'    | componentT:'settings' }}</p> }
          @case ('work-schedule'){ <h1 class="settings-h1">{{ 'workScheduleTitle'| componentT:'settings'}}</h1><p class="settings-empty">{{ 'workScheduleDesc' | componentT:'settings' }}</p> }
          @case ('app-center')  { <h1 class="settings-h1">{{ 'appCenterTitle'    | componentT:'settings' }}</h1><p class="settings-empty">{{ 'appCenterDesc'    | componentT:'settings' }}</p> }
          @case ('imports-exports'){ <h1 class="settings-h1">{{ 'importsExportsTitle'|componentT:'settings'}}</h1><p class="settings-empty">{{ 'importsExportsDesc'|componentT:'settings'}}</p> }
          @case ('clickup-api') { <h1 class="settings-h1">{{ 'clickupApiTitle'   | componentT:'settings' }}</h1><p class="settings-empty">{{ 'clickupApiDesc'   | componentT:'settings' }}</p> }
          @case ('email-integration'){ <h1 class="settings-h1">{{ 'emailIntegrationTitle'|componentT:'settings'}}</h1><p class="settings-empty">{{ 'emailIntegrationDesc'|componentT:'settings'}}</p> }
          @case ('workspaces')  { <h1 class="settings-h1">{{ 'workspacesTitle'   | componentT:'settings' }}</h1><p class="settings-empty">{{ 'workspacesDesc'   | componentT:'settings' }}</p> }
          @case ('chat')        { <h1 class="settings-h1">{{ 'chatTitle'         | componentT:'settings' }}</h1><p class="settings-empty">{{ 'chatDesc'         | componentT:'settings' }}</p> }
          @case ('referrals')   { <h1 class="settings-h1">{{ 'referralsTitle'    | componentT:'settings' }}</h1><p class="settings-empty">{{ 'referralsDesc'    | componentT:'settings' }}</p> }

          @default { <p class="settings-empty">{{ 'selectSection' | componentT:'settings' }}</p> }
        }
      </div>
      <div class="settings-save-bar">
        <button class="btn btn--primary" type="button">{{ 'saved' | componentT:'settings' }}</button>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .settings-overlay { position: absolute; inset: 0; z-index: 30; display: flex; }
    .settings-panel { display: flex; width: 100%; height: 100%; background: var(--color-surface-1); overflow: hidden; }
    .settings-nav { display: flex; flex-direction: column; width: 13.6rem; min-width: 13.6rem; height: 100%; padding: .6rem .5rem; background: var(--color-surface-1); border-inline-end: 1px solid var(--color-border); overflow-y: auto; overflow-x: hidden; }
    .settings-nav__header { display: flex; align-items: center; justify-content: space-between; padding: .25rem .4rem .6rem; margin-bottom: .15rem; }
    .settings-nav__title { font-size: .92rem; font-weight: 700; color: var(--color-text-primary); }
    .settings-nav__close { display: grid; place-items: center; width: 1.6rem; height: 1.6rem; border: 0; border-radius: .35rem; color: var(--color-text-muted); background: transparent; cursor: pointer; }
    .settings-nav__close:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
    .settings-nav__group-label { margin: .65rem 0 .2rem .5rem; color: var(--color-text-muted); font-size: .70rem; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; }
    .settings-nav__item { width: 100%; min-height: 1.95rem; display: flex; align-items: center; gap: .55rem; padding: 0 .55rem; border: 0; border-radius: .35rem; color: var(--color-text-secondary); background: transparent; font: inherit; font-size: .87rem; font-weight: 500; text-align: start; cursor: pointer; }
    .settings-nav__item:hover { color: var(--color-text-primary); background: var(--color-surface-3); }
    .settings-nav__item--active { color: var(--color-text-primary); background: var(--color-surface-3); font-weight: 650; }
    .settings-nav__item--danger { color: var(--color-danger, #e5534b); margin-top: .4rem; }
    .settings-nav__item--danger:hover { background: rgba(229,83,75,.1); }
    .settings-nav__footer { margin-top: auto; padding-top: .6rem; border-top: 1px solid var(--color-border); }
    .settings-content { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }
    .settings-content__inner { flex: 1; padding: 2rem 2.4rem; overflow-y: auto; }
    .settings-h1 { font-size: 1.25rem; font-weight: 750; color: var(--color-text-primary); margin: 0 0 1.6rem; }
    .settings-empty { color: var(--color-text-secondary); font-size: .84rem; margin-top: .5rem; }
    .settings-section { display: grid; grid-template-columns: 18rem 1fr; gap: 1.6rem; padding: 1.4rem 0; border-bottom: 1px solid var(--color-border); }
    .settings-section:last-child { border-bottom: 0; }
    .settings-section__label h2 { margin: 0 0 .35rem; font-size: .88rem; font-weight: 700; color: var(--color-text-primary); }
    .settings-section__label p { margin: 0; font-size: .87rem; color: var(--color-text-secondary); line-height: 1.5; }
    .settings-section__fields { display: flex; flex-direction: column; gap: .9rem; }
    .avatar-row { display: flex; align-items: center; gap: 1rem; }
    .avatar-circle { width: 3.5rem; height: 3.5rem; display: grid; place-items: center; border-radius: 50%; background: var(--color-surface-3); color: var(--color-text-primary); font-size: 1rem; font-weight: 700; }
    .avatar-name { margin: 0 0 .25rem; font-size: .83rem; font-weight: 650; color: var(--color-text-primary); }
    .link-btn { border: 0; background: transparent; color: var(--color-accent); font: inherit; font-size: .86rem; cursor: pointer; padding: 0; }
    .field-label { display: flex; flex-direction: column; gap: .35rem; font-size: .87rem; font-weight: 600; color: var(--color-text-secondary); }
    .field-input-wrap { display: flex; align-items: center; gap: .5rem; padding: 0 .75rem; border: 1px solid var(--color-border-strong); border-radius: .4rem; background: var(--color-surface-2); color: var(--color-text-muted); }
    .field-input { flex: 1; padding: .55rem 0; border: 0; background: transparent; color: var(--color-text-primary); font: inherit; font-size: .8rem; outline: none; }
    .field-input::placeholder { color: var(--color-text-muted); }
    .field-select-wrap { display: flex; align-items: center; gap: .5rem; padding: 0 .75rem; border: 1px solid var(--color-border-strong); border-radius: .4rem; background: var(--color-surface-2); color: var(--color-text-muted); }
    .field-select { flex: 1; padding: .55rem 0; border: 0; background: transparent; color: var(--color-text-primary); font: inherit; font-size: .8rem; outline: none; cursor: pointer; appearance: none; }
    .toggle-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; padding: .25rem 0; }
    .toggle-info { display: flex; flex-direction: column; gap: .2rem; }
    .toggle-info strong { font-size: .8rem; color: var(--color-text-primary); }
    .toggle-info span { font-size: .84rem; color: var(--color-text-secondary); line-height: 1.4; }
    .toggle { flex-shrink: 0; width: 2.2rem; height: 1.2rem; border: 0; border-radius: 99px; background: var(--color-surface-3); cursor: pointer; position: relative; transition: background .18s; }
    .toggle::after { content: ''; position: absolute; top: 2px; left: 2px; width: calc(1.2rem - 4px); height: calc(1.2rem - 4px); border-radius: 50%; background: #fff; transition: left .18s; }
    .toggle--on { background: var(--color-accent); }
    .toggle--on::after { left: calc(100% - 1.2rem + 2px); }
    .color-swatches { display: flex; gap: .5rem; flex-wrap: wrap; }
    .swatch { width: 1.7rem; height: 1.7rem; border-radius: .38rem; border: 2px solid transparent; cursor: pointer; transition: border-color .15s; }
    .swatch--active { border-color: var(--color-text-primary); }
    .appearance-row { display: flex; gap: .7rem; }
    .appearance-btn { display: flex; flex-direction: column; align-items: center; gap: .4rem; padding: .4rem .5rem; border: 2px solid var(--color-border); border-radius: .5rem; background: transparent; cursor: pointer; color: var(--color-text-secondary); font: inherit; font-size: .83rem; }
    .appearance-btn--active { border-color: var(--color-accent); }
    .appearance-preview { width: 4.2rem; height: 2.8rem; border-radius: .3rem; overflow: hidden; display: flex; flex-direction: column; gap: .3rem; padding: .35rem; }
    .appearance-preview--light { background: #f5f5f5; }
    .appearance-preview--dark  { background: #1a1b1e; }
    .appearance-preview--auto  { background: linear-gradient(135deg,#f5f5f5 50%,#1a1b1e 50%); }
    .appearance-preview span { display: block; height: .4rem; border-radius: 2px; background: var(--color-accent); opacity: .7; }
    .appearance-preview span:last-child { width: 60%; }
    .radio-group { border: 0; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .55rem; }
    .radio-group legend { font-size: .86rem; font-weight: 700; color: var(--color-text-secondary); margin-bottom: .35rem; }
    .radio-group label { display: flex; align-items: center; gap: .5rem; font-size: .8rem; color: var(--color-text-primary); cursor: pointer; }
    .checkbox-label { display: flex; align-items: center; gap: .5rem; font-size: .8rem; color: var(--color-text-primary); cursor: pointer; }
    .badge--business { display: inline-block; padding: .1rem .42rem; border-radius: .28rem; background: #be185d; color: #fff; font-size: .75rem; font-weight: 700; }
    .danger-zone { gap: 1rem; }
    .danger-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; font-size: .8rem; color: var(--color-text-secondary); }
    .btn { padding: .45rem 1rem; border: 0; border-radius: .38rem; font: inherit; font-size: .90rem; font-weight: 650; cursor: pointer; }
    .btn--primary { background: var(--color-accent); color: #fff; }
    .btn--primary:hover { background: var(--color-accent-strong); }
    .btn--ghost { background: var(--color-surface-3); color: var(--color-text-primary); }
    .btn--ghost:hover { background: var(--color-border); }
    .btn--danger { background: var(--color-danger, #e5534b); color: #fff; }
    .btn--danger:hover { filter: brightness(1.1); }
    .settings-save-bar { display: flex; justify-content: flex-end; padding: .55rem 1.4rem; border-top: 1px solid var(--color-border); background: var(--color-surface-1); }
    @media (max-width: 860px) { .settings-section { grid-template-columns: 1fr; }.settings-nav { width: 11rem; min-width: 11rem; } }
    @media (max-width: 600px) { .settings-nav { display: none; } }
  `],
})
export class AllSettingsComponent {
  readonly close = output<void>();
  readonly activeSection   = signal<SettingsSection>('profile');
  readonly activeTheme     = signal('#e91e8c');
  readonly activeAppearance = signal<'light' | 'dark' | 'auto'>('dark');

  readonly X = X; readonly ChevronRight = ChevronRight; readonly User = User;
  readonly Bell = Bell; readonly Briefcase = Briefcase; readonly MessageSquare = MessageSquare;
  readonly Users = Users; readonly Link = Link; readonly LogOut = LogOut;
  readonly Settings = Settings; readonly Shield = Shield; readonly Trash2 = Trash2;
  readonly Zap = Zap; readonly Globe = Globe; readonly Clock = Clock;
  readonly ToggleLeft = ToggleLeft; readonly Tag = Tag; readonly Layout = Layout;
  readonly Cpu = Cpu; readonly Smile = Smile; readonly Box = Box;
  readonly ClipboardList = ClipboardList; readonly Key = Key;
  readonly BarChart2 = BarChart2; readonly Mail = Mail;

  readonly themeColors = [
    { label: 'Gray',   value: '#6b7280' }, { label: 'Violet', value: '#7c3aed' },
    { label: 'Cyan',   value: '#0891b2' }, { label: 'Pink',   value: '#e91e8c' },
    { label: 'Purple', value: '#a21caf' }, { label: 'Indigo', value: '#4338ca' },
    { label: 'Orange', value: '#ea580c' }, { label: 'Teal',   value: '#0d9488' },
    { label: 'Tan',    value: '#92400e' }, { label: 'Green',  value: '#16a34a' },
  ];

  appPreferences = [
    { key: 'toast',       label: 'Flyout Toast Message',                        description: 'When performing actions, toast messages may appear in the bottom left-hand of your screen.',  on: true  },
    { key: 'enter',       label: "Don't post comments with Enter",               description: 'Use Ctrl + Enter to send comments instead of just Enter.',                                      on: false },
    { key: 'shortcuts',   label: 'Keyboard Shortcuts',                           description: 'Use keyboard shortcuts to quickly navigate and take action through ClickUp.',                   on: false },
    { key: 'markdown',    label: 'Markdown',                                     description: 'You can disable Markdown (shortcuts when typing) by turning it off here.',                      on: true  },
    { key: 'quotes',      label: 'Show quotes',                                  description: 'Show celebratory quotes when you clear all your notifications or load certain pages.',           on: true  },
    { key: 'celebrate',   label: 'Show Celebrations',                            description: 'Show confetti celebrations when you clear My Work, clear all notifications, or complete a Goal.', on: true },
    { key: 'verified',    label: 'ClickUp Verified',                             description: 'You can disable your ClickUp Verified checkmark.',                                              on: true  },
    { key: 'perf',        label: 'Performance mode',                             description: 'Enhance performance by turning off non-essential features.',                                    on: false },
    { key: 'desktop',     label: 'Detect Desktop App',                           description: "Automatically open links in the desktop app when it's running.",                               on: false },
    { key: 'selectall',   label: 'Block Select All',                             description: 'Press Cmd + A to select all text in the current block, press again to select all.',            on: true  },
    { key: 'tablimits',   label: 'Browser Tab Limits',                           description: 'Set how many ClickUp tabs can be active at the same time.',                                     on: true  },
    { key: 'askpriority', label: 'Ask to add task to priorities after assigning', description: "Show a prompt asking if you'd like to add the task to assigned member's priorities.",          on: true  },
  ];

  /** Nav groups use translation keys instead of hard-coded English strings. */
  readonly navGroups: NavGroup[] = [
    { headingKey: 'adminGroup', items: [
      { id: 'general',          labelKey: 'navGeneral',        icon: Settings      },
      { id: 'people',           labelKey: 'navPeople',         icon: Users         },
      { id: 'teams',            labelKey: 'navTeams',          icon: Briefcase     },
      { id: 'upgrade',          labelKey: 'navUpgrade',        icon: Zap           },
      { id: 'billing',          labelKey: 'navBilling',        icon: ClipboardList },
      { id: 'ai-usage',         labelKey: 'navAiUsage',        icon: BarChart2     },
      { id: 'security',         labelKey: 'navSecurity',       icon: Shield        },
      { id: 'audit-logs',       labelKey: 'navAuditLogs',      icon: Key           },
      { id: 'trash',            labelKey: 'navTrash',          icon: Trash2        },
    ]},
    { headingKey: 'featuresGroup', items: [
      { id: 'custom-fields',    labelKey: 'navCustomFields',   icon: Layout        },
      { id: 'tag-manager',      labelKey: 'navTagManager',     icon: Tag           },
      { id: 'template-center',  labelKey: 'navTemplateCenter', icon: Box           },
      { id: 'automations',      labelKey: 'navAutomations',    icon: Cpu           },
      { id: 'ai-notetaker',     labelKey: 'navAiNotetaker',    icon: MessageSquare },
      { id: 'emojis',           labelKey: 'navEmojis',         icon: Smile         },
      { id: 'spaces',           labelKey: 'navSpaces',         icon: Layout        },
      { id: 'task-types',       labelKey: 'navTaskTypes',      icon: ClipboardList },
      { id: 'work-schedule',    labelKey: 'navWorkSchedule',   icon: Clock         },
    ]},
    { headingKey: 'integrationsGroup', items: [
      { id: 'app-center',       labelKey: 'navAppCenter',        icon: Box  },
      { id: 'imports-exports',  labelKey: 'navImportsExports',   icon: Link },
      { id: 'clickup-api',      labelKey: 'navClickupApi',       icon: Key  },
      { id: 'email-integration',labelKey: 'navEmailIntegration', icon: Mail },
    ]},
    { headingKey: 'mySettingsGroup', items: [
      { id: 'preferences',  labelKey: 'navPreferences',   icon: Settings      },
      { id: 'notifications', labelKey: 'navNotifications', icon: Bell          },
      { id: 'workspaces',   labelKey: 'navWorkspaces',    icon: Briefcase     },
      { id: 'chat',         labelKey: 'navChat',          icon: MessageSquare },
      { id: 'referrals',    labelKey: 'navReferrals',     icon: Users         },
    ]},
    { headingKey: null, items: [
      { id: 'profile', labelKey: 'navProfile', icon: User },
    ]},
  ];

  onBackdropClick(_e: MouseEvent): void {}
}
