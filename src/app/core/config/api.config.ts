let apiBaseUrl = '';

function api(path: string): string {
  return `${apiBaseUrl}${path}`;
}

export type PublicApiConfig = {
  baseUrl: string;
  public: {
    supports: string;
    reportTypes: string;
    signalements: string;
    followUp: string;
    suivi: string;
    reponses: string;
    auth: string;
  };
};

function buildApiConfig(): PublicApiConfig {
  return {
    baseUrl: apiBaseUrl,
    public: {
      supports: api('/api/public/supports'),
      reportTypes: api('/api/public/report-types'),
      signalements: api('/api/public/signalements'),
      followUp: api('/api/public/signalements'),
      suivi: api('/api/public/suivi'),
      reponses: api('/api/public/reponses'),
      auth: api('/api/public/auth'),
    },
  };
}

/** Endpoints API publics (voyageur) — apiBaseUrl charge depuis config.json. */
export const API_CONFIG: PublicApiConfig = buildApiConfig();

export function initializeApiConfig(baseUrl: string): void {
  apiBaseUrl = baseUrl;
  const built = buildApiConfig();
  API_CONFIG.baseUrl = built.baseUrl;
  Object.assign(API_CONFIG.public, built.public);
}
