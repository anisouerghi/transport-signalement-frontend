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
      import('./features/report/pages/report-welcome.page').then((m) => m.ReportWelcomePage),
  },
  {
    path: 'report/:uuid/signaler',
    loadComponent: () =>
      import('./features/report/pages/report-create.page').then((m) => m.ReportCreatePage),
  },
  {
    path: 'connexion',
    loadComponent: () =>
      import('./features/report/pages/passenger-login.page').then((m) => m.PassengerLoginPage),
  },
  {
    path: 'inscription',
    loadComponent: () =>
      import('./features/report/pages/passenger-register.page').then((m) => m.PassengerRegisterPage),
  },
  {
    path: 'confirmation',
    loadComponent: () =>
      import('./features/report/pages/report-confirmation.page').then((m) => m.ReportConfirmationPage),
  },
  /** Suivi sécurisé (lien e-mail UUID). */
  {
    path: 'report-followup/:uuid',
    loadComponent: () =>
      import('./features/report/pages/report-tracking.page').then((m) => m.ReportTrackingPage),
  },
  /** Compatibilité anciens liens e-mail /suivi/{uuid} */
  {
    path: 'suivi/:uuid',
    redirectTo: 'report-followup/:uuid',
    pathMatch: 'full',
  },
  {
    path: 'suivi',
    loadComponent: () =>
      import('./features/report/pages/report-tracking.page').then((m) => m.ReportTrackingPage),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/report/pages/not-found.page').then((m) => m.NotFoundPage),
  },
];
