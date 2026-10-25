import { Component, Input } from '@angular/core';
import { BrandMarkComponent } from './brand-mark.component';
import { IconComponent } from './icon.component';

/** Split-screen frame for login and register. The form is projected into the right column. */
@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [BrandMarkComponent, IconComponent],
  template: `
    <div class="min-h-screen lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <section
        class="hidden flex-col justify-between bg-blue-900 p-12 text-white lg:flex"
      >
        <app-brand-mark tone="light" />

        <div>
          <h2 class="max-w-md text-4xl font-semibold leading-tight tracking-tight">
            A full-stack digital banking demo.
          </h2>
          <p class="mt-5 max-w-md leading-relaxed text-blue-200">
            FinFlow simulates a real internet-banking stack: an Angular SPA talking through a
            secured API gateway to Spring Boot microservices backed by MySQL, with Kafka-driven
            events and Redis caching between them.
          </p>

          <ul class="mt-8 space-y-3" aria-label="What you can do">
            @for (f of features; track f) {
              <li class="flex items-start gap-3">
                <span
                  class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15"
                >
                  <app-icon name="check" [size]="12" />
                </span>
                <span class="text-sm font-medium text-blue-100">{{ f }}</span>
              </li>
            }
          </ul>
        </div>

        <footer class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-blue-300">
          <span>Angular 19</span>
          <span aria-hidden="true">&middot;</span>
          <span>Spring Boot 4</span>
          <span aria-hidden="true">&middot;</span>
          <span>Apache Kafka</span>
          <span aria-hidden="true">&middot;</span>
          <span>Redis</span>
          <span aria-hidden="true">&middot;</span>
          <span>MySQL</span>
          <span aria-hidden="true">&middot;</span>
          <span>Razorpay</span>
        </footer>
      </section>

      <main class="flex min-h-screen items-center justify-center px-5 py-10">
        <div class="w-full max-w-sm">
          <div class="mb-10 lg:hidden"><app-brand-mark tone="dark" /></div>
          <h1 class="text-3xl font-semibold tracking-tight text-slate-900">{{ title }}</h1>
          <p class="mt-2 text-slate-500">{{ subtitle }}</p>
          <div class="mt-8">
            <ng-content />
          </div>
        </div>
      </main>
    </div>
  `
})
export class AuthShellComponent {
  @Input({ required: true }) title = '';
  @Input() subtitle = '';

  readonly features = [
    'Instant deposits, withdrawals and account-to-account transfers',
    'Real-time fraud detection with OTP verification on risky transfers',
    'Bill payments through the Razorpay gateway (test mode)',
    'JWT-secured sessions that automatically expire after 60 minutes',
    'Event-driven architecture — every action publishes Kafka events'
  ];
}
