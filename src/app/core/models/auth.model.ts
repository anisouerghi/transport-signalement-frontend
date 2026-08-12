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
}

export interface PassengerLoginRequest {
  email: string;
  password: string;
}

export interface PassengerRegisterRequest {
  name?: string;
  email: string;
  phoneNumber?: string;
  password: string;
}

export interface PassengerAuthResponse {
  token: string;
  tokenType: string;
  expiresInMs: number;
  passengerId: number;
  name?: string;
  email: string;
  phoneNumber?: string;
}
