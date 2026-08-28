import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { initializeApiConfig } from './api.config';

const CONFIG_URL = '/assets/config/config.json';

export interface AppRuntimeConfig {
  apiBaseUrl: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);
  private config!: AppRuntimeConfig;

  async load(): Promise<void> {
    let raw: unknown;
    try {
      raw = await firstValueFrom(this.http.get<unknown>(CONFIG_URL));
    } catch {
      throw new Error(
        `Impossible de charger ${CONFIG_URL}. Verifiez que le fichier existe et est accessible.`
      );
    }

    this.config = this.validate(raw);
    initializeApiConfig(this.config.apiBaseUrl);
  }

  get apiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  private validate(raw: unknown): AppRuntimeConfig {
    if (!raw || typeof raw !== 'object') {
      throw new Error('config.json invalide : objet JSON attendu.');
    }

    const value = raw as Record<string, unknown>;

    if (typeof value['apiBaseUrl'] !== 'string') {
      throw new Error('config.json invalide : apiBaseUrl (string) est obligatoire.');
    }

    return {
      apiBaseUrl: value['apiBaseUrl'],
    };
  }
}

export function initAppConfig(config: ConfigService) {
  return () => config.load();
}
