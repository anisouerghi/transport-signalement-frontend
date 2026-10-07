/** Types de message renvoyés par l'API. Le serveur décide, le client affiche. */
export const REPLY_TYPE = {
  response: 'RESPONSE',
  complementRequest: 'COMPLEMENT_REQUEST',
  complementResponse: 'COMPLEMENT_RESPONSE',
  internalNote: 'INTERNAL_NOTE',
} as const;

/** Auteur renvoyé par l'API. */
export const REPLY_AUTHOR = {
  agent: 'AGENT',
  passenger: 'PASSENGER',
  system: 'SYSTEM',
} as const;

export const CLOSED_STATUS_CODES = ['RESOLVED', 'CLOSED'] as const;

export function isClosedStatus(statusCode: string | null | undefined): boolean {
  const code = (statusCode ?? '').toUpperCase();
  return (CLOSED_STATUS_CODES as readonly string[]).includes(code);
}

/** Clé i18n du libellé d'auteur côté voyageur. */
export function authorLabelKey(authorType: string | null | undefined): string {
  if ((authorType ?? '').toUpperCase() === REPLY_AUTHOR.passenger) {
    return 'followUp.you';
  }
  return 'followUp.transtu';
}

/** Icône Material Symbols du type renvoyé par l'API. */
export function replyIcon(replyType: string | null | undefined): string {
  switch ((replyType ?? '').toUpperCase()) {
    case REPLY_TYPE.complementRequest:
      return 'help';
    case REPLY_TYPE.complementResponse:
      return 'chat';
    case REPLY_TYPE.internalNote:
      return 'lock';
    default:
      return 'reply';
  }
}

/** Clé i18n du type de message. Vide pour le texte initial du signalement. */
export function replyTypeLabelKey(replyType: string | null | undefined): string | null {
  switch ((replyType ?? '').toUpperCase()) {
    case REPLY_TYPE.complementRequest:
      return 'followUp.typeComplementRequest';
    case REPLY_TYPE.complementResponse:
      return 'followUp.typeComplementResponse';
    case REPLY_TYPE.response:
      return 'followUp.typeResponse';
    default:
      return 'followUp.typeResponse';
  }
}
