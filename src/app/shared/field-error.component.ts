import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

const MESSAGES: Record<string, string> = {
  required: 'This field is required.',
  email: 'Enter a valid email address.',
  pattern: 'Invalid format.',
  min: 'Amount must be greater than zero.',
  insufficient: 'Amount exceeds your available balance.',
  weakPassword:
    'Password needs 8+ characters with upper & lower case letters, a number and a symbol.',
  invalidPhone: 'Enter a valid phone number (7-15 digits, optional +).',
  decimals: 'Use at most two decimal places.',
  mismatch: 'Passwords do not match.'
};

@Component({
  selector: 'app-field-error',
  standalone: true,
  template: `
    @if (control && control.invalid && (control.touched || control.dirty)) {
      <p class="mt-1 text-xs text-red-500">{{ message() }}</p>
    }
  `
})
export class FieldErrorComponent {
  @Input({ required: true }) control!: AbstractControl | null;

  message(): string {
    const errors = this.control?.errors;
    if (!errors) {
      return '';
    }
    const key = Object.keys(errors)[0];
    return MESSAGES[key] ?? 'Invalid value.';
  }
}
