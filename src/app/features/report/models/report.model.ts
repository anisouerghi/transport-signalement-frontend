export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TransportSupport {
  transportSupportId: number;
  uuid: string;
  reference: string;
  label: string;
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
  priority?: Priority;
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
}

export interface ConfirmationState {
  reference: string;
  email?: string;
  supportUuid?: string;
}
