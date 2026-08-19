export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TransportSupport {
  transportSupportId?: number;
  uuid: string;
  reference: string;
  label: string;
  supportTypeId?: number;
  supportTypeCode?: string;
  supportTypeLabel?: string;
  supportStatus?: string;
}

export interface ReportType {
  reportTypeId: number;
  code: string;
  label: string;
  description?: string;
  active?: boolean;
}

export interface PassengerRequest {
  name?: string;
  email?: string;
  phoneNumber?: string;
}

export interface ReportRequest {
  supportUuid: string;
  reportTypeId: number;
  description: string;
  passenger: PassengerRequest;
}

export interface StatusInfo {
  statusId: number;
  code: string;
  label: string;
  displayOrder?: number;
}

export interface PassengerResponse {
  passengerId?: number;
  name?: string;
  email?: string;
  phoneNumber?: string;
}

export interface ReportResponse {
  reportId: number;
  uuid?: string;
  reference: string;
  creationDate?: string;
  description?: string;
  priority?: Priority;
  closureDate?: string;
  transportSupport?: TransportSupport | null;
  reportTypeCode?: string;
  reportTypeLabel?: string;
  passenger?: PassengerResponse | null;
  status?: StatusInfo | null;
  attachments?: AttachmentResponse[];
}

export interface AttachmentResponse {
  attachmentId: number;
  uuid?: string;
  fileName: string;
  fileType?: string;
  fileSize?: number;
  reportId?: number;
  image?: boolean;
}

export interface ConfirmationState {
  reference: string;
  uuid?: string;
  email?: string;
  supportUuid?: string;
}

/** Suivi public sécurisé (API /api/public/suivi/{uuid}). */
export interface PublicReportTracking {
  uuid: string;
  reference: string;
  creationDate?: string;
  description?: string;
  reportTypeLabel?: string;
  supportLabel?: string;
  statusCode?: string;
  statusLabel?: string;
  replies?: PublicReplyView[];
}

export interface PublicReplyView {
  message: string;
  replyDate: string;
}

export interface PublicReportListItem {
  uuid: string;
  reference: string;
  creationDate?: string;
  supportLabel?: string;
  supportTypeLabel?: string;
  statusCode?: string;
  statusLabel?: string;
}

/** Réponse publiée sur l'accueil (aucune donnée personnelle). */
export interface PublicHomepageReply {
  message: string;
  replyDate: string;
  reportTypeLabel?: string;
}
