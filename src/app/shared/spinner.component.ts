import { Component, inject } from '@angular/core';
import { LoadingService } from '../core/services/loading.service';

/** Small non-blocking pill shown while any API call is in flight. */
@Component({
  selector: 'app-spinner',
  standalone: true,
  template: `
    @if (loading.isLoading()) {
      <div class="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center" role="status">
        <div
          class="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-lg shadow-slate-900/10"
        >
          <span
            class="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-900"
          ></span>
          Working
        </div>
      </div>
    }
  `
})
export class SpinnerComponent {
  readonly loading = inject(LoadingService);
}
