/** Enveloppe générique renvoyée par l’API backend. */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/** Format d’erreur Spring Boot (ErrorResponse). */
export interface ApiErrorBody {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  details?: string[];
}

export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
