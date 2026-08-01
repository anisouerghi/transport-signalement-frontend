import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'accueil' },
  {
    path: 'accueil',
    loadComponent: () =>
      import('./features/report/pages/home.page').then((m) => m.HomePage),
  },
  {
    path: 'report/:uuid',
    loadComponent: () =>
      import('./features/report/pages/report-create.page').then((m) => m.ReportCreatePage),
  },
  {
    path: 'confirmation',
    loadComponent: () =>
      import('./features/report/pages/report-confirmation.page').then((m) => m.ReportConfirmationPage),
  },
  {
    path: 'suivi',
    loadComponent: () =>
      import('./features/report/pages/report-tracking.page').then((m) => m.ReportTrackingPage),
  },
  {
    path: 'suivi/:uuid',
    loadComponent: () =>
      import('./features/report/pages/report-tracking.page').then((m) => m.ReportTrackingPage),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/report/pages/not-found.page').then((m) => m.NotFoundPage),
  },
];
