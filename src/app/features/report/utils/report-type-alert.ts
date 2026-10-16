import { ReportType } from '../models/report.model';

/**
 * Types « alerte » traités comme l'urgence : mis en tête, affichés dans l'en-tête
 * et retirés de la grille des natures de l'accueil.
 */
export const ALERT_CODES = new Set(['URGENCE', 'URGENCY', 'EMERGENCY', 'URGENT', 'HARCELEMENT']);

/**
 * Icône Material Symbols propre au type d'alerte. Le harcèlement sexuel n'utilise
 * pas l'icône de l'API (`crisis_alert`, partagée avec l'urgence) mais une main levée.
 */
export const ALERT_ICONS: Record<string, string> = {
  URGENCE: 'crisis_alert',
  URGENCY: 'crisis_alert',
  EMERGENCY: 'crisis_alert',
  URGENT: 'crisis_alert',
  HARCELEMENT: 'front_hand',
};

export function normalizeTypeCode(code?: string | null): string {
  return (code ?? '').trim().toUpperCase();
}

/** Vrai si le type correspond à un code d'alerte (via son code, sa catégorie ou son type). */
export function isAlertType(type: Pick<ReportType, 'code' | 'category' | 'type'>): boolean {
  return [type.code, type.category, type.type].some(
    (value) => !!value && ALERT_CODES.has(normalizeTypeCode(value)),
  );
}

/** Icône à afficher : celle dédiée au type d'alerte, sinon celle fournie par l'API. */
export function alertIcon(code: string | null | undefined, apiIcon?: string | null): string {
  return ALERT_ICONS[normalizeTypeCode(code)] ?? (apiIcon?.trim() || 'crisis_alert');
}
