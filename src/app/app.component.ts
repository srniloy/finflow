import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SpinnerComponent } from './shared/spinner.component';
import { ToastContainerComponent } from './shared/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SpinnerComponent, ToastContainerComponent],
  template: `
    <router-outlet />
    <app-spinner />
    <app-toast-container />
  `
})
export class AppComponent {}
