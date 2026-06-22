import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../config/api-url';
import { LoyaltyInfo, StoreAddress, StoreProfileUser } from '../models/store-profile.models';
import { getWithPathFallback } from './store-http.util';

const PROFILE_PATHS = ['/auth/store/profile', '/store/profile'] as const;
const LOYALTY_PATHS = ['/auth/store/loyalty', '/store/loyalty'] as const;

@Injectable({ providedIn: 'root' })
export class StoreProfileService {
  private readonly http = inject(HttpClient);

  fetchProfile() {
    return getWithPathFallback<{ user: StoreProfileUser }>(this.http, PROFILE_PATHS);
  }

  fetchLoyalty() {
    return getWithPathFallback<{ loyalty: LoyaltyInfo }>(this.http, LOYALTY_PATHS);
  }

  updateProfile(body: {
    fullName?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: StoreAddress;
  }) {
    return this.http.put<{ user: StoreProfileUser; message: string }>(`${API_URL}/auth/store/profile`, body);
  }

  updateAvatar(avatarUrl: string) {
    return this.http.put<{ user: StoreProfileUser; message: string }>(
      `${API_URL}/auth/store/profile/avatar`,
      { avatarUrl }
    );
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.put<{ message: string }>(`${API_URL}/auth/store/password`, {
      currentPassword,
      newPassword
    });
  }

  forgotPassword(body: { email?: string; phone?: string }) {
    return this.http.post<{ message: string; devHint?: string }>(
      `${API_URL}/auth/store/forgot-password`,
      body
    );
  }

  claimMilestone(id: string) {
    return this.http.post<{
      message: string;
      voucherCode: string;
      voucherTitle: string;
      user: StoreProfileUser;
    }>(`${API_URL}/auth/store/loyalty/claim/${id}`, {});
  }
}
