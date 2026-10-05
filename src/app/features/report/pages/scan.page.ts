import { Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { BrowserMultiFormatReader } from '@zxing/browser';

@Component({
  selector: 'app-scan-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="scan-page panel p-4">
      <div class="scan-page__heading">
        <span class="scan-page__icon" aria-hidden="true"><i class="bi bi-qr-code-scan"></i></span>
        <div>
          <h1 class="h3 mb-2">{{ 'scan.title' | translate }}</h1>
          <p class="text-secondary mb-0">{{ 'scan.intro' | translate }}</p>
        </div>
      </div>

      <div class="scan-viewfinder" [class.scan-viewfinder--hidden]="!cameraReady()">
        <video #video autoplay muted playsinline [attr.aria-label]="'scan.camera' | translate"></video>
        <span class="scan-viewfinder__corner" aria-hidden="true"></span>
      </div>

      @if (starting()) {
        <p class="scan-status text-secondary" aria-live="polite">{{ 'scan.starting' | translate }}</p>
      } @else if (errorKey()) {
        <div class="scan-error" role="alert">
          <i class="bi bi-camera-video-off" aria-hidden="true"></i>
          <span>{{ errorKey() | translate }}</span>
          <button type="button" class="btn btn-transtu" (click)="startScan()">
            {{ 'scan.retry' | translate }}
          </button>
        </div>
      }

      <a routerLink="/accueil" class="scan-back">{{ 'scan.back' | translate }}</a>
    </section>
  `,
  styles: [`
    .scan-page { max-width: 38rem; margin: 0 auto; }
    .scan-page__heading { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; }
    .scan-page__icon { color: #0b8a3e; font-size: 2.25rem; line-height: 1; }
    .scan-viewfinder { position: relative; overflow: hidden; aspect-ratio: 4 / 3; background: #142033; border-radius: 0.65rem; }
    .scan-viewfinder--hidden { display: none; }
    .scan-viewfinder video { display: block; width: 100%; height: 100%; object-fit: cover; }
    .scan-viewfinder__corner { position: absolute; inset: 18%; border: 3px solid #e8a317; border-radius: 0.35rem; box-shadow: 0 0 0 999px rgba(0, 0, 0, 0.2); }
    .scan-status { text-align: center; margin: 1rem 0; }
    .scan-error { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 0.75rem; margin: 1rem 0; color: #8b1e2d; text-align: center; }
    .scan-error i { font-size: 1.25rem; }
    .scan-back { display: block; margin-top: 1.25rem; color: #0f2758; text-align: center; font-weight: 600; text-decoration: none; }
  `],
})
export class ScanPage implements OnDestroy {
  private readonly router = inject(Router);
  private readonly reader = new BrowserMultiFormatReader();
  private controls?: { stop: () => void };

  @ViewChild('video') private video?: ElementRef<HTMLVideoElement>;
  readonly starting = signal(true);
  readonly cameraReady = signal(false);
  readonly errorKey = signal('');

  ngAfterViewInit(): void {
    this.startScan();
  }

  startScan(): void {
    this.stopScan();
    this.starting.set(true);
    this.cameraReady.set(false);
    this.errorKey.set('');

    if (!navigator.mediaDevices?.getUserMedia || !this.video) {
      this.starting.set(false);
      this.errorKey.set('scan.unsupported');
      return;
    }

    void this.reader.decodeFromConstraints(
      { video: { facingMode: { ideal: 'environment' } } },
      this.video.nativeElement,
      (result) => {
        if (result) {
          this.stopScan();
          this.navigateToQr(result.getText());
        }
      },
    ).then((controls) => {
      this.controls = controls;
      this.starting.set(false);
      this.cameraReady.set(true);
    }).catch(() => {
      this.starting.set(false);
      this.errorKey.set('scan.permission');
    });
  }

  private navigateToQr(value: string): void {
    try {
      const url = new URL(value, window.location.origin);
      if (url.origin !== window.location.origin || !url.pathname.startsWith('/report/')) {
        throw new Error('Unsupported QR code');
      }
      void this.router.navigateByUrl(`${url.pathname}${url.search}${url.hash}`);
    } catch {
      this.cameraReady.set(false);
      this.starting.set(false);
      this.errorKey.set('scan.invalid');
    }
  }

  private stopScan(): void {
    this.controls?.stop();
    this.controls = undefined;
  }

  ngOnDestroy(): void {
    this.stopScan();
  }
}