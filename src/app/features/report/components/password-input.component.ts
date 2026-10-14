import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-password-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PasswordInputComponent), multi: true }],
  host: { '[class.is-invalid]': 'invalid()' },
  template: `
    <div class="password-input">
      <input
        [id]="inputId()"
        [type]="visible() ? 'text' : 'password'"
        class="form-control"
        [class.form-control-lg]="large()"
        [class.is-invalid]="invalid()"
        [attr.autocomplete]="autocomplete()"
        [attr.placeholder]="placeholder() || null"
        [value]="value()"
        [disabled]="disabled()"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
      <button
        type="button"
        class="password-input__toggle"
        [attr.aria-label]="'common.' + (visible() ? 'hidePassword' : 'showPassword') | translate"
        [attr.aria-pressed]="visible()"
        [attr.title]="'common.' + (visible() ? 'hidePassword' : 'showPassword') | translate"
        [disabled]="disabled()"
        (click)="toggle()"
      >
        <span class="material-symbols-outlined" aria-hidden="true">{{ visible() ? 'visibility_off' : 'visibility' }}</span>
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .password-input { position: relative; }
    .password-input input { padding-inline-end: 2.75rem; }
    .password-input__toggle {
      position: absolute;
      inset-inline-end: 0.25rem;
      top: 50%;
      transform: translateY(-50%);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--transtu-muted, #6c757d);
      cursor: pointer;
    }
    .password-input__toggle:hover { color: var(--transtu-blue); }
    .password-input__toggle:focus-visible { outline: 2px solid var(--bs-focus-ring-color, #86b7fe); outline-offset: 1px; }
    .password-input__toggle .material-symbols-outlined { font-size: 1.35rem; }
    .password-input__toggle:disabled { cursor: default; opacity: 0.6; }
  `],
})
export class PasswordInputComponent implements ControlValueAccessor {
  readonly inputId = input('');
  readonly autocomplete = input('off');
  readonly placeholder = input('');
  readonly large = input(false);
  readonly invalid = input(false);

  readonly value = signal('');
  readonly visible = signal(false);
  readonly disabled = signal(false);

  private onChange: (value: string) => void = () => undefined;
  private onTouchedFn: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value.set(next);
    this.onChange(next);
  }

  onTouched(): void {
    this.onTouchedFn();
  }

  toggle(): void {
    this.visible.update((current) => !current);
  }
}
