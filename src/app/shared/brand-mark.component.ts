import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-brand-mark',
  standalone: true,
  template: `
    <span class="inline-flex items-center gap-2.5">
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="10" [attr.fill]="tone === 'light' ? '#ffffff' : '#1e3a8a'" />
        <path
          d="M8 21c3.5-9 7 3 10.5-5 1.2-2.7 3.5-3.2 5.5-2"
          fill="none"
          stroke-width="2.6"
          stroke-linecap="round"
          [attr.stroke]="tone === 'light' ? '#1e3a8a' : '#ffffff'"
        />
      </svg>
      <span
        class="text-xl font-bold tracking-tight"
        [class.text-white]="tone === 'light'"
        [class.text-blue-900]="tone === 'dark'"
      >
        FinFlow
      </span>
    </span>
  `
})
export class BrandMarkComponent {
  /** 'light' = white mark for dark backgrounds, 'dark' = blue mark for light backgrounds. */
  @Input() tone: 'light' | 'dark' = 'dark';
}
