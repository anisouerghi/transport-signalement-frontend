import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly message = signal<string | null>(null);
  readonly type = signal<'success' | 'error' | 'info'>('info');

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  clear(): void {
    this.message.set(null);
  }

  private show(message: string, type: 'success' | 'error' | 'info'): void {
    this.type.set(type);
    this.message.set(message);
    window.setTimeout(() => {
      if (this.message() === message) {
        this.clear();
      }
    }, 5000);
  }
}
