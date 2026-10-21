import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import {
  Subscription,
  catchError,
  filter,
  finalize,
  fromEvent,
  map,
  merge,
  of,
  switchMap,
  tap,
  timer,
} from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { ConfigService } from '../config/config.service';
import { InboxNotificationItem, InboxNotificationResponse } from '../models/inbox-notification.model';
import { ApiResponse } from '../../shared/models/api-response.model';
import { AuthService } from './auth.service';

const DEFAULT_INTERVAL_MS = 30_000;
const MIN_INTERVAL_MS = 5_000;

/**
 * Boîte de notifications plateforme (cloche).
 * Une seule boucle de polling partagée ; démarre/arrête selon l'auth.
 * Pause hors ligne / onglet masqué. Ne crée jamais de notifications.
 */
@Injectable({ providedIn: 'root' })
export class InboxNotificationService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly config = inject(ConfigService);

  private readonly unreadCountSignal = signal(0);
  private readonly itemsSignal = signal<InboxNotificationItem[]>([]);
  private readonly loadingSignal = signal(false);

  readonly unreadCount = this.unreadCountSignal.asReadonly();
  readonly items = this.itemsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly hasUnread = computed(() => this.unreadCountSignal() > 0);

  private pollSub: Subscription | null = null;
  private inFlight = false;

  constructor() {
    // Pilotage central : un seul service, pas de boucles concurrentes dans les composants.
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.startPolling();
      } else {
        this.stopPolling(true);
      }
    });
  }

  private get inboxUrl(): string {
    return `${API_CONFIG.baseUrl}/api/public/notifications/inbox`;
  }

  private get readUrl(): string {
    return `${API_CONFIG.baseUrl}/api/public/notifications/read`;
  }

  ngOnDestroy(): void {
    this.stopPolling(true);
  }

  markAllRead(): void {
    if (!this.auth.isAuthenticated()) {
      return;
    }
    this.http
      .post<ApiResponse<number>>(this.readUrl, { markAll: true })
      .pipe(
        catchError(() => of(null)),
        tap(() => {
          this.itemsSignal.update((list) => list.map((i) => ({ ...i, read: true })));
          this.unreadCountSignal.set(0);
        })
      )
      .subscribe();
  }

  markRead(id: number): void {
    if (!this.auth.isAuthenticated()) {
      return;
    }
    const wasUnread = this.itemsSignal().some((i) => i.id === id && !i.read);
    this.http
      .post<ApiResponse<number>>(this.readUrl, { markAll: false, ids: [id] })
      .pipe(
        catchError(() => of(null)),
        tap(() => {
          this.itemsSignal.update((list) =>
            list.map((i) => (i.id === id ? { ...i, read: true } : i))
          );
          if (wasUnread) {
            this.unreadCountSignal.update((n) => Math.max(0, n - 1));
          }
        })
      )
      .subscribe();
  }

  private startPolling(): void {
    if (this.pollSub) {
      return;
    }
    if (!this.config.notificationsPollingEnabled) {
      this.refreshOnce();
      return;
    }
    this.pollSub = merge(
      of(0),
      timer(this.intervalMs(), this.intervalMs()),
      fromEvent(document, 'visibilitychange').pipe(
        filter(() => document.visibilityState === 'visible')
      ),
      fromEvent(window, 'online')
    )
      .pipe(
        filter(() => this.auth.isAuthenticated()),
        filter(() => document.visibilityState === 'visible'),
        filter(() => navigator.onLine),
        filter(() => !this.inFlight),
        switchMap(() => this.fetchInbox$())
      )
      .subscribe();
  }

  private stopPolling(clearState: boolean): void {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
    this.inFlight = false;
    if (clearState) {
      this.unreadCountSignal.set(0);
      this.itemsSignal.set([]);
    }
  }

  private refreshOnce(): void {
    if (!this.auth.isAuthenticated() || this.inFlight) {
      return;
    }
    this.fetchInbox$().subscribe();
  }

  private fetchInbox$() {
    this.inFlight = true;
    this.loadingSignal.set(true);
    return this.http.get<ApiResponse<InboxNotificationResponse>>(this.inboxUrl).pipe(
      map((res) => res?.data),
      catchError(() => of(null)),
      tap((data) => {
        if (!data) {
          return;
        }
        this.unreadCountSignal.set(data.unreadCount ?? 0);
        this.itemsSignal.set(data.items ?? []);
      }),
      finalize(() => {
        this.inFlight = false;
        this.loadingSignal.set(false);
      })
    );
  }

  private intervalMs(): number {
    const raw = this.config.notificationsPollingIntervalMs;
    if (!Number.isFinite(raw) || raw < MIN_INTERVAL_MS) {
      return DEFAULT_INTERVAL_MS;
    }
    return Math.floor(raw);
  }
}
