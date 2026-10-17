import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { ApiResponse } from '../../shared/models/api-response.model';
import {
  PassengerPreference,
  PassengerPreferenceUpdateRequest,
} from '../models/preference.model';
import { AuthService } from './auth.service';
import { AppLanguage, LanguageService } from './language.service';

@Injectable({ providedIn: 'root' })
export class PassengerPreferenceService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly language = inject(LanguageService);

  private get baseUrl(): string {
    return `${API_CONFIG.public.auth}/me/preferences`;
  }

  get(): Observable<PassengerPreference> {
    return this.http
      .get<ApiResponse<PassengerPreference>>(this.baseUrl)
      .pipe(
        map((res) => res.data),
        tap((prefs) => this.applyPreference(prefs, false)),
      );
  }

  update(request: PassengerPreferenceUpdateRequest): Observable<PassengerPreference> {
    return this.http
      .put<ApiResponse<PassengerPreference>>(this.baseUrl, request)
      .pipe(
        map((res) => res.data),
        tap((prefs) => this.applyPreference(prefs, true)),
      );
  }

  private applyPreference(prefs: PassengerPreference, applyUiLanguage: boolean): void {
    const lang = (prefs.language ?? 'FR').trim().toLowerCase() as AppLanguage;
    this.auth.patchSessionPreferences(lang, prefs.notifications ?? []);
    if (applyUiLanguage && (lang === 'fr' || lang === 'ar' || lang === 'en')) {
      void this.language.setLanguage(lang);
    }
  }
}
