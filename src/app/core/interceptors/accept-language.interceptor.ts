import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LanguageService } from '../services/language.service';

/** Envoie Accept-Language (fr|ar|en) pour localiser les labels API. */
export const acceptLanguageInterceptor: HttpInterceptorFn = (req, next) => {
  const language = inject(LanguageService);
  return next(
    req.clone({
      setHeaders: { 'Accept-Language': language.currentLang() },
    }),
  );
};
