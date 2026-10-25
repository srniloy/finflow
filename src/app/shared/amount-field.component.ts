import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FieldErrorComponent } from './field-error.component';

/** Large currency input with optional quick-amount chips. */
@Component({
  selector: 'app-amount-field',
  standalone: true,
  imports: [ReactiveFormsModule, FieldErrorComponent],
  template: `
    <label class="fin-label" for="amount">{{ label }}</label>
    <div class="relative">
      <span
        class="pointer-events-none absolute inset-y-0 left-4 flex items-center text-xl font-semibold text-slate-400"
      >
        $
      </span>
      <input
        id="amount"
        type="number"
        step="0.01"
        min="0"
        inputmode="decimal"
        placeholder="0.00"
        [formControl]="control"
        class="fin-input pl-9 text-2xl font-semibold tabular-nums"
        [class.fin-input-error]="control.invalid && control.touched"
      />
    </div>
    <app-field-error [control]="control" />

    @if (quick.length > 0) {
      <div class="mt-3 flex flex-wrap gap-2">
        @for (q of quick; track q) {
          <button
            type="button"
            class="rounded-full border border-slate-200 px-3.5 py-1.5 text-sm font-semibold tabular-nums text-slate-600 transition hover:border-blue-900 hover:text-blue-900"
            (click)="pick(q)"
          >
            {{ '$' + q }}
          </button>
        }
      </div>
    }
  `
})
export class AmountFieldComponent {
  @Input({ required: true }) control!: FormControl<number | null>;
  @Input() label = 'Amount';
  @Input() quick: number[] = [];

  pick(value: number): void {
    this.control.setValue(value);
    this.control.markAsTouched();
    this.control.markAsDirty();
  }
}
