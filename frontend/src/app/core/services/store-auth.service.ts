import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { API_URL } from '../config/api-url';
import { LoyaltyInfo, StoreAddress } from '../models/store-profile.models';

export interface StoreUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: StoreAddress;
  loyalty?: LoyaltyInfo;
}

type AuthResponse = {
  token: string;
  user: StoreUser;
  emailSent?: boolean;
  emailMessage?: string;
};

const TOKEN_KEY = 'store_token';
const USER_KEY = 'store_user';

const LOGIN_PATHS = ['/auth/store/login', '/public/store/login'] as const;
const REGISTER_PATHS = ['/auth/store/register', '/public/store/register'] as const;

@Injectable({ providedIn: 'root' })
export class StoreAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  login(email: string, password: string) {
    return this.postWithFallback<AuthResponse>(LOGIN_PATHS, { email, password }).pipe(
      tap((res) => this.persist(res))
    );
  }

  loginGoogle(accessToken: string) {
    const GOOGLE_PATHS = ['/public/store/google-login', '/auth/store/google-login'] as const;
    return this.postWithFallback<AuthResponse>(GOOGLE_PATHS, { accessToken }).pipe(
      tap((res) => this.persist(res))
    );
  }

  register(fullName: string, email: string, password: string) {
    return this.postWithFallback<AuthResponse>(REGISTER_PATHS, { fullName, email, password });
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  fetchMe() {
    return this.http.get<{ user: StoreUser }>(`${API_URL}/auth/store/me`);
  }

  persistUser(user: StoreUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  logout(redirectTo = '/tai-khoan'): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.router.navigate([redirectTo]);
  }

  isLoggedIn(): boolean {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  }

  getUser(): StoreUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoreUser) : null;
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private persist(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  }

  /** Thử lần lượt các endpoint (tương thích backend cũ/mới). */
  private postWithFallback<T>(paths: readonly string[], body: unknown): Observable<T> {
    const tryPath = (index: number): Observable<T> => {
      const path = paths[index];
      return this.http.post<T>(`${API_URL}${path}`, body).pipe(
        catchError((err: HttpErrorResponse) => {
          const canRetry = index < paths.length - 1 && err.status === 404;
          if (canRetry) {
            return tryPath(index + 1);
          }
          return throwError(() => err);
        })
      );
    };
    return tryPath(0);
  }
}
