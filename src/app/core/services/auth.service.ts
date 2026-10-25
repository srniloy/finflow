import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL, TOKEN_KEY, USER_KEY } from '../config';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly tokenSignal = signal<string | null>(this.readToken());
  readonly currentUser = signal<User | null>(this.readUser());
  readonly isLoggedIn = computed(() => !!this.tokenSignal());

  get token(): string | null {
    return this.tokenSignal();
  }

  register(payload: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${API_BASE_URL}/auth/register`, payload);
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_BASE_URL}/auth/login`, payload).pipe(
      tap((res) => {
        const user: User = {
          userId: res.userId,
          email: payload.email,
          name: res.name ?? payload.email,
          accountNumber: res.accountId
        };
        try {
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        } catch {
          /* storage unavailable */
        }
        this.tokenSignal.set(res.token);
        this.currentUser.set(user);
      })
    );
  }

  logout(redirect = true): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      /* storage unavailable */
    }
    this.tokenSignal.set(null);
    this.currentUser.set(null);
    if (redirect) {
      void this.router.navigate(['/login']);
    }
  }

  private readToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private readUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
