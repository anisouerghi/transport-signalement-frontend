import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { ApiErrorBody } from '../../shared/models/api-response.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const body = err.error as ApiErrorBody | null;
      const message = resolveMessage(err, body);
      // Les pages gèrent déjà certains 404 métier (QR invalide) — on évite le toast systématique.
      if (err.status !== 404) {
        notifications.error(message);
      }
      return throwError(() => err);
    }),
  );
};

function resolveMessage(err: HttpErrorResponse, body: ApiErrorBody | null): string {
  if (!err.status) {
    return 'Impossible de joindre le serveur. Vérifiez votre connexion Internet.';
  }
  if (err.status === 0) {
    return 'Le service est temporairement indisponible. Réessayez dans quelques instants.';
  }
  if (err.status >= 500) {
    return 'Une erreur technique est survenue. Merci de réessayer plus tard.';
  }
  if (body?.message && body.message !== 'Internal server error') {
    return body.message;
  }
  if (err.status === 400) {
    return 'Certaines informations du formulaire sont invalides.';
  }
  if (err.status === 404) {
    return 'La ressource demandée est introuvable.';
  }
  return 'Une erreur est survenue. Merci de réessayer.';
}
