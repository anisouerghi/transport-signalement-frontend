import { Component, OnInit, inject, signal } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../core/services/auth.service';

import { NotificationService } from '../../../core/services/notification.service';



@Component({

  selector: 'app-passenger-google-callback-page',

  standalone: true,

  imports: [TranslatePipe],

  template: `

    <section class="panel p-4 text-center">

      @if (loading()) {

        <div class="py-5">

          <div class="spinner-border text-primary mb-3" role="status" aria-hidden="true"></div>

          <p class="mb-0">{{ 'auth.googleCompleting' | translate }}</p>

        </div>

      } @else if (errorMessage()) {

        <h1 class="h4 mb-3">{{ 'auth.googleFailedTitle' | translate }}</h1>

        <p class="text-secondary">{{ errorMessage() }}</p>

      }

    </section>

  `,

})

export class PassengerGoogleCallbackPage implements OnInit {

  private readonly auth = inject(AuthService);

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly notifications = inject(NotificationService);

  private readonly translate = inject(TranslateService);



  readonly loading = signal(true);

  readonly errorMessage = signal<string | null>(null);



  ngOnInit(): void {

    const params = this.route.snapshot.queryParamMap;

    const error = params.get('error');

    const message = params.get('message');

    const code = params.get('code');

    const returnUrl = this.safeReturnUrl(
      params.get('returnUrl') || this.auth.consumeGoogleReturnUrl(),
    );



    if (error) {

      this.loading.set(false);

      this.errorMessage.set(message || this.translate.instant('auth.googleFailedGeneric'));

      this.notifications.error(this.errorMessage()!);

      void this.router.navigate(['/connexion'], { queryParams: { returnUrl } });

      return;

    }



    if (!code) {

      this.loading.set(false);

      this.errorMessage.set(this.translate.instant('auth.googleFailedGeneric'));

      this.notifications.error(this.errorMessage()!);

      void this.router.navigate(['/connexion'], { queryParams: { returnUrl } });

      return;

    }



    this.auth.completeGoogleSignIn(code).subscribe({

      next: () => {

        this.loading.set(false);

        this.notifications.success(this.translate.instant('auth.loginSuccess'));

        void this.router.navigateByUrl(returnUrl);

      },

      error: () => {

        this.loading.set(false);

        this.errorMessage.set(this.translate.instant('auth.googleFailedGeneric'));

        this.notifications.error(this.errorMessage()!);

        void this.router.navigate(['/connexion'], { queryParams: { returnUrl } });

      },

    });

  }

  private safeReturnUrl(returnUrl: string | null): string {
    return returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')
      ? returnUrl
      : '/accueil';
  }

}

