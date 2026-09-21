import { HttpClient } from '@angular/common/http';

import { Injectable, computed, inject, signal } from '@angular/core';

import { Observable, map, tap, catchError, of } from 'rxjs';

import { API_CONFIG } from '../config/api.config';

import { ApiResponse } from '../../shared/models/api-response.model';

import {

  LoginOutcome,

  PassengerAuthResponse,

  PassengerLoginRequest,

  PassengerProfileUpdateRequest,

  PassengerOtpPendingResponse,

  PassengerRegisterRequest,

  PassengerSession,

} from '../models/auth.model';



const STORAGE_KEY = 'transtu_passenger_session';
const GOOGLE_RETURN_URL_KEY = 'transtu_google_return_url';



/**

 * Gestion centralisée de la session voyageur.

 * Le token JWT est stocké en localStorage ; le mot de passe n'est jamais persisté.

 */

@Injectable({ providedIn: 'root' })

export class AuthService {

  private readonly http = inject(HttpClient);

  /** Lu à chaque appel : config.json peut arriver après la construction du service. */
  private get baseUrl(): string {
    return API_CONFIG.public.auth;
  }



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



  login(request: PassengerLoginRequest): Observable<LoginOutcome> {

    return this.http

      .post<ApiResponse<PassengerAuthResponse | PassengerOtpPendingResponse>>(

        `${this.baseUrl}/login`,

        request,

      )

      .pipe(

        map((res) => {
          const data = res.data as PassengerAuthResponse & PassengerOtpPendingResponse;
          const otpRequired =
            res.errorCode === 'OTP_REQUIRED' ||
            (!!data?.otpTransactionId && !data?.token);

          if (otpRequired) {
            return {
              kind: 'otp' as const,
              pending: data as PassengerOtpPendingResponse,
            };
          }

          return {
            kind: 'session' as const,
            session: this.persist(data as PassengerAuthResponse),
          };
        }),

      );

  }



  verifyOtp(otpTransactionId: string, otp: string): Observable<PassengerSession> {

    return this.http

      .post<ApiResponse<PassengerAuthResponse>>(`${this.baseUrl}/otp/verify`, {

        otpTransactionId,

        otp,

      })

      .pipe(map((res) => this.persist(res.data)));

  }



  resendOtp(otpTransactionId: string): Observable<PassengerOtpPendingResponse> {

    return this.http

      .post<ApiResponse<PassengerOtpPendingResponse>>(`${this.baseUrl}/otp/resend`, {

        otpTransactionId,

      })

      .pipe(map((res) => res.data));

  }



  register(request: PassengerRegisterRequest): Observable<PassengerOtpPendingResponse> {

    return this.http

      .post<ApiResponse<PassengerOtpPendingResponse>>(`${this.baseUrl}/register`, request)

      .pipe(map((res) => res.data));

  }

  updateProfile(request: PassengerProfileUpdateRequest): Observable<PassengerSession> {
    return this.http
      .put<ApiResponse<Partial<PassengerAuthResponse>>>(`${this.baseUrl}/me`, request)
      .pipe(
        map((res) => {
          const current = this.sessionSignal();
          const updated = res.data;
          if (!current) {
            throw new Error('Passenger session is missing');
          }

          const session: PassengerSession = {
            ...current,
            name: updated.name ?? request.name ?? current.name,
            email: updated.email ?? request.email,
            phoneNumber: updated.phoneNumber ?? request.phoneNumber ?? current.phoneNumber,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
          this.sessionSignal.set(session);
          return session;
        }),
      );
  }



  /** Redirection vers le flux OAuth Google côté public-api (validation serveur). */

  startGoogleSignIn(returnUrl: string): void {

    const apiOrigin = this.resolveApiOrigin();

    sessionStorage.setItem(GOOGLE_RETURN_URL_KEY, returnUrl);

    const params = new URLSearchParams({ returnUrl });

    window.location.href = `${apiOrigin}/api/public/auth/google?${params.toString()}`;

  }

  consumeGoogleReturnUrl(): string | null {
    const returnUrl = sessionStorage.getItem(GOOGLE_RETURN_URL_KEY);
    sessionStorage.removeItem(GOOGLE_RETURN_URL_KEY);
    return returnUrl;
  }



  /** Échange le code éphémère post-redirection contre un JWT application. */
  completeGoogleSignIn(
    code: string,
    gps?: { latitude?: number; longitude?: number; gpsAccuracy?: number },
  ): Observable<PassengerSession> {
    return this.http
      .post<ApiResponse<PassengerAuthResponse>>(`${this.baseUrl}/google/callback`, {
        code,
        ...gps,
      })
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
    if (!this.getToken()) {
      this.clearSession();
      return;
    }

    this.http.post<ApiResponse<unknown>>(`${this.baseUrl}/logout`, {}).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }



  private resolveApiOrigin(): string {

    const base = API_CONFIG.baseUrl?.replace(/\/$/, '');

    if (base) {

      return base;

    }

    return 'http://localhost:8081';

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
      profilePictureUrl: auth.profilePictureUrl,
      authProvider: auth.authProvider,
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


