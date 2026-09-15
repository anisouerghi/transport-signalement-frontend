/** Session voyageur persistée localement (jamais le mot de passe). */
export interface PassengerSession {
  token: string;
  tokenType: string;
  /** Horodatage d'expiration (ms depuis epoch). */
  expiresAt: number;
  passengerId: number;
  name?: string;
  email: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  authProvider?: string;
}

export interface PassengerLoginRequest {
  email: string;
  password: string;
  /** Token Cloudflare Turnstile (si activé). */
  turnstileToken?: string;
}

export interface OptionalGpsPayload {
  latitude?: number;
  longitude?: number;
  gpsAccuracy?: number;
}

export interface PassengerRegisterRequest extends OptionalGpsPayload {
  name?: string;
  email: string;
  phoneNumber?: string;
  password: string;
  /** Token Cloudflare Turnstile (si activé). */
  turnstileToken?: string;
}

export interface PassengerProfileUpdateRequest {
  name?: string;
  email: string;
  phoneNumber?: string;
  currentPassword?: string;
  password?: string;
}

export interface PassengerAuthResponse {
  token: string;
  tokenType: string;
  expiresInMs: number;
  passengerId: number;
  name?: string;
  email: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  authProvider?: string;
}

export interface PassengerOtpPendingResponse {
  otpTransactionId: string;
  expiresInSeconds: number;
  resendDelaySeconds: number;
  maskedEmail?: string;
  emailSent?: boolean;
}

export type LoginOutcome =
  | { kind: 'session'; session: PassengerSession }
  | { kind: 'otp'; pending: PassengerOtpPendingResponse };
