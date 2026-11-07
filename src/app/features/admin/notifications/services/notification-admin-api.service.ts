// src/app/features/admin/notifications/services/notification-admin-api.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  CreateTriggerRequest, NotificationTrigger, Paged, TriggerQuery, TriggerStatistics, UpdateTriggerRequest,
} from '../models/notification-admin.models';

/**
 * REST client for PetroFlow `NotificationTriggersController` (admin only).
 * Auth header + 401 handling come from the app-wide authInterceptor (it matches environment.apiUrl).
 */
@Injectable({ providedIn: 'root' })
export class NotificationAdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/notification-triggers`;

  list(q: TriggerQuery): Observable<Paged<NotificationTrigger>> {
    let params = new HttpParams().set('page', q.page).set('pageSize', q.pageSize);
    if (q.search.trim()) params = params.set('search', q.search.trim());
    if (q.isActive !== null) params = params.set('isActive', q.isActive);
    if (q.triggerType) params = params.set('triggerType', q.triggerType);
    if (q.operation) params = params.set('operation', q.operation);
    return this.http.get<Paged<NotificationTrigger>>(this.base, { params });
  }

  get(id: number): Observable<NotificationTrigger> {
    return this.http.get<NotificationTrigger>(`${this.base}/${id}`);
  }

  statistics(): Observable<TriggerStatistics> {
    return this.http.get<TriggerStatistics>(`${this.base}/statistics`);
  }

  create(body: CreateTriggerRequest): Observable<NotificationTrigger> {
    return this.http.post<NotificationTrigger>(this.base, body);
  }

  update(id: number, body: UpdateTriggerRequest): Observable<NotificationTrigger> {
    return this.http.put<NotificationTrigger>(`${this.base}/${id}`, body);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  toggle(id: number): Observable<{ isActive: boolean }> {
    return this.http.post<{ isActive: boolean }>(`${this.base}/${id}/toggle`, {});
  }
}
