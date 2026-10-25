import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../config';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/** Global error handling: 401 on a protected endpoint logs the user out and redirects to /login. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);
  const isAuthEndpoint = req.url.startsWith(`${API_BASE_URL}/auth/`);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint) {
        auth.logout();
        toast.error('Your session has expired. Please log in again.');
      }
      return throwError(() => error);
    })
  );
};

/** Extracts a readable message from an HTTP error. */
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Cannot reach the server. Please check your connection.';
    }
    const body = error.error as { message?: string } | string | null;
    if (body && typeof body === 'object' && typeof body.message === 'string') {
      return body.message;
    }
    if (typeof body === 'string' && body.length > 0 && body.length < 200) {
      return body;
    }
  }
  return fallback;
}
