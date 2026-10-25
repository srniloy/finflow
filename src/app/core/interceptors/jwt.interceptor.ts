import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '../config';
import { AuthService } from '../services/auth.service';

/** Attaches "Authorization: Bearer <token>" to every API request except /auth/*. */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token;
  const isApi = req.url.startsWith(API_BASE_URL);
  const isAuthEndpoint = req.url.startsWith(`${API_BASE_URL}/auth/`);

  if (token && isApi && !isAuthEndpoint) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
