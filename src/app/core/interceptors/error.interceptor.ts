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
      const body = err.error as ApiErrorBody | null;
      const message = resolveMessage(err, body, translate);
      if (err.status !== 404) {
        notifications.error(message);
      }
      return throwError(() => err);
    }),
  );
};

function resolveMessage(
  err: HttpErrorResponse,
  body: ApiErrorBody | null,
  translate: TranslateService,
): string {
  if (!err.status) {
    return translate.instant('errors.offline');
  }
  if (err.status === 0) {
    return translate.instant('errors.unavailable');
  }
  if (err.status >= 500) {
    return translate.instant('errors.server');
  }
  if (body?.message && body.message !== 'Internal server error') {
    return body.message;
  }
  if (err.status === 400) {
    return translate.instant('errors.invalidForm');
  }
  if (err.status === 404) {
    return translate.instant('errors.notFound');
  }
  return translate.instant('errors.generic');
}
