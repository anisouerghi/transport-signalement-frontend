import { environment } from '../../../environments/environment';

/** Endpoints API publics (voyageur). */
export const API_CONFIG = {
  baseUrl: environment.apiBaseUrl,
  public: {
    supports: `${environment.apiBaseUrl}/api/public/supports`,
    reportTypes: `${environment.apiBaseUrl}/api/public/report-types`,
    signalements: `${environment.apiBaseUrl}/api/public/signalements`,
    /** Suivi sécurisé par UUID (lien e-mail). */
    followUp: `${environment.apiBaseUrl}/api/public/signalements`,
    /** @deprecated alias — préférer followUp */
    suivi: `${environment.apiBaseUrl}/api/public/suivi`,
    /** Réponses visibles à l'accueil (publish). */
    reponses: `${environment.apiBaseUrl}/api/public/reponses`,
    auth: `${environment.apiBaseUrl}/api/public/auth`,
  },
} as const;
