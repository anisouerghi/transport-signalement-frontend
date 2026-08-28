import { environment } from '../../../environments/environment';

function api(path: string): string {
  return `${environment.apiBaseUrl}${path}`;
}

/** Endpoints API publics (voyageur) — selon environment. */
export const API_CONFIG = {
  baseUrl: environment.apiBaseUrl,
  public: {
    supports: api('/api/public/supports'),
    reportTypes: api('/api/public/report-types'),
    signalements: api('/api/public/signalements'),
    followUp: api('/api/public/signalements'),
    suivi: api('/api/public/suivi'),
    reponses: api('/api/public/reponses'),
    auth: api('/api/public/auth'),
  },
} as const;
