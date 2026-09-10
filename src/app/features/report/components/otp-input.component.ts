import { ChangeDetectionStrategy, Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-otp-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => OtpInputComponent), multi: true }],
  template: `
    <div class="form-otp" role="group" aria-label="One-time password">
      @for (digit of digits; track $index) {
        <input
          #otpInput
          class="form-control form-control-lg text-center"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          maxlength="1"
          [attr.autocomplete]="$index === 0 ? 'one-time-code' : null"
          [value]="digit"
          [disabled]="disabled"
          [attr.aria-label]="'OTP digit ' + ($index + 1)"
          (input)="onInput($event, $index)"
          (keydown)="onKeydown($event, $index)"
          (paste)="onPaste($event, $index)"
        />
      }
    </div>
  `,
  styles: [`
    :host.is-invalid input { border-color: var(--bs-form-invalid-border-color); }
    .form-otp { display: flex; justify-content: center; gap: 0.65rem; }
    .form-otp input { width: 3.25rem; height: 3.5rem; padding: 0; font-size: 1.5rem; font-weight: 700; }
    @media (max-width: 360px) {
      .form-otp { gap: 0.35rem; }
      .form-otp input { width: 2.7rem; }
    }
  `],
})
export class OtpInputComponent implements ControlValueAccessor {
  readonly digits = Array(6).fill('');
  disabled = false;

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    const normalized = (value ?? '').replace(/\D/g, '').slice(0, 6);
    this.digits.splice(0, this.digits.length, ...Array.from({ length: 6 }, (_, index) => normalized[index] ?? ''));
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(-1);
    this.digits[index] = value;
    input.value = value;
    this.emitValue();

    if (value) {
      this.focusInput(input.nextElementSibling);
    }
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Backspace' && !input.value && index > 0) {
      event.preventDefault();
      this.digits[index - 1] = '';
      this.emitValue();
      this.focusInput(input.previousElementSibling);
    }
  }

  onPaste(event: ClipboardEvent, index: number): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6 - index) ?? '';
    if (!pasted) {
      return;
    }

    pasted.split('').forEach((digit, offset) => {
      this.digits[index + offset] = digit;
    });
    this.emitValue();
    const inputs = (event.target as HTMLInputElement).parentElement?.querySelectorAll('input');
    this.focusInput(inputs?.[Math.min(index + pasted.length, 5)] ?? null);
  }

  private emitValue(): void {
    this.onChange(this.digits.join(''));
    this.onTouched();
  }

  private focusInput(element: Element | null): void {
    (element as HTMLInputElement | null)?.focus();
  }
}