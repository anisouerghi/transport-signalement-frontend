import { OptionalGpsPayload } from '../models/auth.model';

/**
 * Récupère une position GPS optionnelle (jamais bloquant / jamais obligatoire).
 * En cas de refus ou d'indisponibilité → objet vide.
 */
export function tryGetOptionalGps(timeoutMs = 4000): Promise<OptionalGpsPayload> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve({});
  }

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve({}), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.clearTimeout(timer);
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          gpsAccuracy: pos.coords.accuracy,
        });
      },
      () => {
        window.clearTimeout(timer);
        resolve({});
      },
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}
