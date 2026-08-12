import { environment } from '../../../environments/environment';

/** Endpoints API publics (voyageur). */
export const API_CONFIG = {
  baseUrl: environment.apiBaseUrl,
  public: {
    supports: `${environment.apiBaseUrl}/api/public/supports`,
    reportTypes: `${environment.apiBaseUrl}/api/public/report-types`,
    signalements: `${environment.apiBaseUrl}/api/public/signalements`,
    suivi: `${environment.apiBaseUrl}/api/public/suivi`,
    auth: `${environment.apiBaseUrl}/api/public/auth`,
  },
} as const;
