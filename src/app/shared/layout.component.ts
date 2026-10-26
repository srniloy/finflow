import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { BrandMarkComponent } from './brand-mark.component';
import { IconComponent, IconName } from './icon.component';

interface NavItem {
  label: string;
  path: string;
  icon: IconName;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, BrandMarkComponent],
  template: `
    <div class="min-h-screen md:flex">
      <!-- Desktop sidebar -->
      <aside
        class="hidden shrink-0 flex-col bg-blue-900 px-4 py-6 text-white md:sticky md:top-0 md:flex md:h-screen md:w-64"
      >
        <div class="px-2 pb-8">
          <app-brand-mark tone="light" />
        </div>
        <nav class="flex flex-col gap-1" aria-label="Main">
          @for (item of nav; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive
              #rla="routerLinkActive"
              class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition"
              [class]="rla.isActive ? 'bg-white text-blue-900' : 'text-blue-100 hover:bg-white/10'"
            >
              <app-icon [name]="item.icon" [size]="20" />
              {{ item.label }}
            </a>
          }
        </nav>
      </aside>

      <div class="flex min-h-screen min-w-0 flex-1 flex-col">
        <!-- Top bar -->
        <header
          class="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-4 py-3 backdrop-blur md:px-8"
        >
          <div class="md:hidden"><app-brand-mark tone="dark" /></div>
          <p class="hidden text-sm text-slate-500 md:block">
            Hi, <span class="font-semibold text-slate-900">{{ firstName() }}</span>
          </p>

          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2.5">
              <span
                class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-900 text-sm font-semibold uppercase text-white"
              >
                {{ firstName().charAt(0) }}
              </span>
              <span class="hidden max-w-[14rem] truncate text-sm text-slate-600 sm:inline">
                {{ auth.currentUser()?.email }}
              </span>
            </div>
            <button
              type="button"
              class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-900 hover:text-blue-900"
              (click)="auth.logout()"
            >
              <app-icon name="logout" [size]="18" />
              <span class="hidden sm:inline">Log out</span>
            </button>
          </div>
        </header>

        <main class="flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-10 md:pt-8">
          <div class="mx-auto w-full max-w-5xl">
            <router-outlet />
          </div>
        </main>
      </div>

      <!-- Mobile bottom navigation -->
      <nav
        class="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white px-2 pb-2 pt-1.5 md:hidden"
        aria-label="Main"
      >
        @for (item of nav; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive
            #rlm="routerLinkActive"
            class="flex flex-col items-center gap-0.5 py-1 text-[11px] font-semibold"
            [class]="rlm.isActive ? 'text-blue-900' : 'text-slate-500'"
          >
            <span
              class="flex h-8 w-12 items-center justify-center rounded-full transition"
              [class]="rlm.isActive ? 'bg-blue-100' : ''"
            >
              <app-icon [name]="item.icon" [size]="20" />
            </span>
            {{ item.label }}
          </a>
        }
      </nav>
    </div>
  `
})
export class LayoutComponent {
  readonly auth = inject(AuthService);

  readonly nav: NavItem[] = [
    { label: 'Overview', path: '/dashboard', icon: 'home' },
    { label: 'Deposit', path: '/deposit', icon: 'deposit' },
    { label: 'Withdraw', path: '/withdraw', icon: 'withdraw' },
    { label: 'Transfer', path: '/transfer', icon: 'transfer' },
    { label: 'Pay Bill', path: '/payment', icon: 'payment' }
  ];

  readonly firstName = computed(() => {
    const name = this.auth.currentUser()?.name?.trim();
    if (name) {
      return name;
    }
    // Fallback for older sessions without a name: derive from the email address.
    const email = this.auth.currentUser()?.email ?? '';
    const local = email.split('@')[0].split(/[._\-+0-9]/)[0];
    return local ? local.charAt(0).toUpperCase() + local.slice(1) : 'there';
  });
}
