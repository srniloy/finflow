import { Component, inject } from '@angular/core';
import { ToastService } from '../core/services/toast.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div
      class="pointer-events-none fixed bottom-24 right-4 z-[60] flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-2 md:bottom-6"
    >
      @for (t of toasts.toasts(); track t.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10"
          role="alert"
        >
          <span
            class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
            [class.bg-emerald-100]="t.type === 'success'"
            [class.text-emerald-600]="t.type === 'success'"
            [class.bg-red-100]="t.type === 'error'"
            [class.text-red-600]="t.type === 'error'"
            [class.bg-blue-100]="t.type === 'info'"
            [class.text-blue-900]="t.type === 'info'"
          >
            <app-icon
              [name]="t.type === 'success' ? 'check' : t.type === 'error' ? 'alert' : 'info'"
              [size]="16"
            />
          </span>
          <p class="flex-1 text-sm leading-snug text-slate-700">{{ t.message }}</p>
          <button
            type="button"
            class="text-lg leading-none text-slate-400 hover:text-slate-700"
            aria-label="Dismiss"
            (click)="toasts.dismiss(t.id)"
          >
            &times;
          </button>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  readonly toasts = inject(ToastService);
}
