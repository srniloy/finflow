import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/layout.component').then((m) => m.LayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'deposit',
        loadComponent: () =>
          import('./features/transactions/deposit.component').then((m) => m.DepositComponent)
      },
      {
        path: 'withdraw',
        loadComponent: () =>
          import('./features/transactions/withdraw.component').then((m) => m.WithdrawComponent)
      },
      {
        path: 'transfer',
        loadComponent: () =>
          import('./features/transactions/transfer.component').then((m) => m.TransferComponent)
      },
      {
        path: 'payment',
        loadComponent: () =>
          import('./features/transactions/payment.component').then((m) => m.PaymentComponent)
      },
      {
        path: 'transactions/:transactionId',
        loadComponent: () =>
          import('./features/transactions/transaction-detail.component').then(
            (m) => m.TransactionDetailComponent
          )
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
