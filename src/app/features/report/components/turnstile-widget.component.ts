import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ConfigService } from '../../../core/config/config.service';

const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: Record<string, unknown>,
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('no-window'));
  }
  if (window.turnstile) {
    return Promise.resolve();
  }
  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }
  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('script-error')), { once: true });
      if (window.turnstile) {
        resolve();
      }
      return;
    }
    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error('script-error'));
    };
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

@Component({
  selector: 'app-turnstile-widget',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './turnstile-widget.component.html',
  styleUrl: './turnstile-widget.component.scss',
})
export class TurnstileWidgetComponent implements AfterViewInit, OnDestroy {
  private readonly config = inject(ConfigService);
  private readonly translate = inject(TranslateService);

  @Input() disabled = false;
  @Output() tokenChange = new EventEmitter<string | null>();
  @Output() readyChange = new EventEmitter<boolean>();

  @ViewChild('container', { static: true })
  private containerRef!: ElementRef<HTMLDivElement>;

  error: string | null = null;
  private widgetId: string | null = null;
  private destroyed = false;

  get visible(): boolean {
    return this.config.cloudflareEnabled && !!this.config.cloudflareSiteKey;
  }

  ngAfterViewInit(): void {
    if (!this.visible) {
      this.readyChange.emit(true);
      this.tokenChange.emit(null);
      return;
    }
    void this.mount();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.destroyWidget();
  }

  /** Réinitialise le widget (ex. après échec d'envoi — token à usage unique). */
  reset(): void {
    this.tokenChange.emit(null);
    if (this.widgetId && window.turnstile) {
      try {
        window.turnstile.reset(this.widgetId);
      } catch {
        void this.mount();
      }
    }
  }

  private async mount(): Promise<void> {
    this.error = null;
    this.readyChange.emit(false);
    this.tokenChange.emit(null);
    this.destroyWidget();

    const siteKey = this.config.cloudflareSiteKey;
    if (!siteKey) {
      this.error = this.translate.instant('turnstile.missingKey');
      this.readyChange.emit(false);
      return;
    }

    try {
      await loadTurnstileScript();
      if (this.destroyed || !window.turnstile) {
        throw new Error('unavailable');
      }
      this.widgetId = window.turnstile.render(this.containerRef.nativeElement, {
        sitekey: siteKey,
        theme: 'light',
        size: 'flexible',
        callback: (token: string) => {
          if (!this.destroyed) {
            this.error = null;
            this.tokenChange.emit(token);
            this.readyChange.emit(true);
          }
        },
        'error-callback': () => {
          if (!this.destroyed) {
            this.error = this.translate.instant('turnstile.error');
            this.tokenChange.emit(null);
            this.readyChange.emit(false);
          }
        },
        'expired-callback': () => {
          if (!this.destroyed) {
            this.error = this.translate.instant('turnstile.expired');
            this.tokenChange.emit(null);
            this.readyChange.emit(false);
          }
        },
        'timeout-callback': () => {
          if (!this.destroyed) {
            this.error = this.translate.instant('turnstile.timeout');
            this.tokenChange.emit(null);
            this.readyChange.emit(false);
          }
        },
      });
    } catch {
      if (!this.destroyed) {
        this.error = this.translate.instant('turnstile.loadFailed');
        this.readyChange.emit(false);
        this.tokenChange.emit(null);
      }
    }
  }

  private destroyWidget(): void {
    if (this.widgetId && window.turnstile) {
      try {
        window.turnstile.remove(this.widgetId);
      } catch {
        /* ignore */
      }
    }
    this.widgetId = null;
    if (this.containerRef?.nativeElement) {
      this.containerRef.nativeElement.innerHTML = '';
    }
  }
}
