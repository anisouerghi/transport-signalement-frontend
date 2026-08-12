import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap, catchError, of } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { ApiResponse } from '../../shared/models/api-response.model';
import {
  PassengerAuthResponse,
  PassengerLoginRequest,
  PassengerRegisterRequest,
  PassengerSession,
} from '../models/auth.model';

const STORAGE_KEY = 'transtu_passenger_session';

/**
 * Gestion centralisée de la session voyageur.
 * Le token JWT est stocké en localStorage ; le mot de passe n'est jamais persisté.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_CONFIG.public.auth;

  private readonly sessionSignal = signal<PassengerSession | null>(this.readStoredSession());

  readonly session = this.sessionSignal.asReadonly();
  readonly isAuthenticated = computed(() => {
    const s = this.sessionSignal();
    return !!s && s.expiresAt > Date.now();
  });
  readonly currentUser = computed(() => {
    const s = this.sessionSignal();
    if (!s || s.expiresAt <= Date.now()) {
      return null;
    }
    return s;
  });

  getToken(): string | null {
    const s = this.sessionSignal();
    if (!s || s.expiresAt <= Date.now()) {
      return null;
    }
    return s.token;
  }

  login(request: PassengerLoginRequest): Observable<PassengerSession> {
    return this.http
      .post<ApiResponse<PassengerAuthResponse>>(`${this.baseUrl}/login`, request)
      .pipe(map((res) => this.persist(res.data)));
  }

  register(request: PassengerRegisterRequest): Observable<PassengerSession> {
    return this.http
      .post<ApiResponse<PassengerAuthResponse>>(`${this.baseUrl}/register`, request)
      .pipe(map((res) => this.persist(res.data)));
  }

  /** Restaure la session au démarrage via GET /me (token expiré → purge silencieuse). */
  restoreSession(): Observable<PassengerSession | null> {
    const stored = this.readStoredSession();
    if (!stored) {
      return of(null);
    }
    if (stored.expiresAt <= Date.now()) {
      this.clearSession();
      return of(null);
    }
    this.sessionSignal.set(stored);
    return this.http.get<ApiResponse<PassengerAuthResponse>>(`${this.baseUrl}/me`).pipe(
      map((res) => this.persist(res.data, stored.token)),
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
    );
  }

  logout(): void {
    this.clearSession();
  }

  private persist(auth: PassengerAuthResponse, existingToken?: string): PassengerSession {
    const session: PassengerSession = {
      token: existingToken ?? auth.token,
      tokenType: auth.tokenType ?? 'Bearer',
      expiresAt: Date.now() + (auth.expiresInMs ?? 86_400_000),
      passengerId: auth.passengerId,
      name: auth.name,
      email: auth.email,
      phoneNumber: auth.phoneNumber,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    this.sessionSignal.set(session);
    return session;
  }

  private readStoredSession(): PassengerSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as PassengerSession;
      if (!parsed?.token || !parsed?.email) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private clearSession(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.sessionSignal.set(null);
  }
}
