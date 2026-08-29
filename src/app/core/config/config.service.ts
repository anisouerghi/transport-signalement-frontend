import { Injectable } from '@angular/core';
import { initializeApiConfig } from './api.config';

/** Chemin relatif au base href (compatible sous-repertoire ex. /sig/). */
const CONFIG_ASSET_PATH = 'assets/config/config.json';

function resolveConfigUrl(): string {
  return new URL(CONFIG_ASSET_PATH, document.baseURI).href;
}

export interface AppRuntimeConfig {
  apiBaseUrl: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private config!: AppRuntimeConfig;

  async load(): Promise<void> {
    const configUrl = resolveConfigUrl();
    let raw: unknown;
    try {
      const response = await fetch(configUrl, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
      }
      raw = await response.json();
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Impossible de charger ${configUrl} (${detail}). Verifiez que le fichier existe, est un JSON valide (sans commentaires) et accessible.`
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
