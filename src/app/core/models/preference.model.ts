/** Préférences voyageur (table passenger_preference). */
export interface PassengerPreference {
  preferenceId?: number;
  passengerId: number;
  language: string;
  notifications: number[];
  notifyPlatform: boolean;
  notifyEmail: boolean;
  notifySms: boolean;
  notifyWhatsapp: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PassengerPreferenceUpdateRequest {
  language?: string;
  notifications?: number[];
}

/** Canaux stables (alignés backend PassengerNotificationChannel). */
export const NOTIFICATION_CHANNEL = {
  PLATFORM: 1,
  EMAIL: 2,
  SMS: 3,
  WHATSAPP: 4,
} as const;
