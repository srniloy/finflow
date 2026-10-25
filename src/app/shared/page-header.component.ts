import { Component, Input } from '@angular/core';
import { IconComponent, IconName } from './icon.component';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="mb-6 flex items-center gap-4">
      <span
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-900 text-white"
      >
        <app-icon [name]="icon" [size]="22" />
      </span>
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-slate-900">{{ title }}</h1>
        <p class="text-sm text-slate-500">{{ subtitle }}</p>
      </div>
    </div>
  `
})
export class PageHeaderComponent {
  @Input({ required: true }) icon!: IconName;
  @Input({ required: true }) title!: string;
  @Input() subtitle = '';
}
