import { Component, Input } from '@angular/core';

export type IconName =
  | 'home'
  | 'deposit'
  | 'withdraw'
  | 'transfer'
  | 'payment'
  | 'logout'
  | 'copy'
  | 'check'
  | 'alert'
  | 'info';

const PATHS: Record<IconName, string> = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  deposit: 'M12 4v12m0 0l-5-5m5 5l5-5M5 20h14',
  withdraw: 'M12 20V8m0 0l-5 5m5-5l5 5M5 4h14',
  transfer: 'M7 7h13m0 0l-4-4m4 4l-4 4M17 17H4m0 0l4-4m-4 4l4 4',
  payment: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3zM9 8h6M9 12h6',
  logout: 'M15 17l5-5-5-5M20 12H9M9 4H5v16h4',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  check: 'M5 12l5 5 9-10',
  alert: 'M12 8v5m0 3.5v.01M10.3 4.3L2.8 17.5A2 2 0 004.5 20.5h15a2 2 0 001.7-3L13.7 4.3a2 2 0 00-3.4 0z',
  info: 'M12 11v5m0-8.5v.01M12 21a9 9 0 100-18 9 9 0 000 18z'
};

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path [attr.d]="path" />
    </svg>
  `,
  styles: [':host { display: inline-flex; }']
})
export class IconComponent {
  @Input({ required: true }) name!: IconName;
  @Input() size = 20;

  get path(): string {
    return PATHS[this.name];
  }
}
