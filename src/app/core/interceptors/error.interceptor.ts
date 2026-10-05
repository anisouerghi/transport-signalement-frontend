import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { ApiErrorBody } from '../../shared/models/api-response.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);
  const translate = inject(TranslateService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const message = resolveMessage(err, translate);
      if (err.status !== 404) {
        notifications.error(message);
      }
      return throwError(() => err);
    }),
  );
};

function resolveMessage(err: HttpErrorResponse, translate: TranslateService): string {
  if (!err.status) {
    return translate.instant('errors.offline');
  }
  if (err.status === 0) {
    return translate.instant('errors.unavailable');
  }

  // Toujours privilégier le message métier renvoyé par l'API (ex. e-mail déjà utilisé).
  const apiMessage = extractApiMessage(err);
  if (apiMessage) {
    return apiMessage;
  }

  if (err.status >= 500) {
    return translate.instant('errors.server');
  }
  if (err.status === 400) {
    return translate.instant('errors.invalidForm');
  }
  if (err.status === 404) {
    return translate.instant('errors.notFound');
  }
  return translate.instant('errors.generic');
}

function extractApiMessage(err: HttpErrorResponse): string | null {
  const body = err.error as ApiErrorBody | string | null;
  if (body && typeof body === 'object') {
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (message && message !== 'Internal server error') {
      return message;
    }
  }
  if (typeof body === 'string' && body.trim()) {
    try {
      const parsed = JSON.parse(body) as ApiErrorBody;
      const message = typeof parsed.message === 'string' ? parsed.message.trim() : '';
      if (message && message !== 'Internal server error') {
        return message;
      }
    } catch {
      // corps texte non JSON — ignorer
    }
  }
  return null;
}
