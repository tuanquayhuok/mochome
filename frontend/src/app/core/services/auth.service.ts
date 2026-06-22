import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

import { API_URL } from '../config/api-url';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  login(email: string, password: string) {
    return this.http
      .post<{ token: string; user: { fullName: string; email: string; role: string } }>(`${API_URL}/auth/login`, {
        email,
        password
      })
      .pipe(
        tap((res) => {
          localStorage.setItem('admin_token', res.token);
          localStorage.setItem('admin_user', JSON.stringify(res.user));
        })
      );
  }

  logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    this.router.navigate(['/login']);
  }

  isLoggedIn() {
    return Boolean(localStorage.getItem('admin_token'));
  }

  getCurrentUser() {
    const raw = localStorage.getItem('admin_user');
    return raw ? JSON.parse(raw) : null;
  }
}
