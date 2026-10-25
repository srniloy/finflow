import { CurrencyPipe } from '@angular/common';
import { Component, Input } from '@angular/core';

/** Shows the balance the account will have after the amount in the form is applied. */
@Component({
  selector: 'app-balance-note',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    <div class="mt-6 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
      <span class="text-slate-500">Balance after this {{ noun }}</span>
      <span class="font-semibold tabular-nums" [class.text-red-500]="after() < 0">
        {{ after() | currency }}
      </span>
    </div>
  `
})
export class BalanceNoteComponent {
  @Input() balance: number | null = null;
  @Input() amount: number | null = null;
  @Input() direction: 'in' | 'out' = 'out';
  @Input() noun = 'transaction';

  after(): number {
    const b = this.balance ?? 0;
    const a = Number(this.amount) || 0;
    return this.direction === 'in' ? b + a : b - a;
  }
}
