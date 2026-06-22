import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  OrderActionForm,
  OrderFilters,
  OrderListResponse,
  OrderStatistics
} from '../models/order.interface';

import { API_URL } from '../config/api-url';
import { PostRow, StorePickerVoucher } from '../models/admin-list.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  list<T>(resource: string) {
    return this.http.get<T[]>(`${API_URL}/${resource}`);
  }

  get<T>(resource: string, id: string) {
    return this.http.get<T>(`${API_URL}/${resource}/${id}`);
  }

  create<T>(resource: string, payload: unknown) {
    return this.http.post<T>(`${API_URL}/${resource}`, payload);
  }

  update<T>(resource: string, id: string, payload: unknown) {
    return this.http.put<T>(`${API_URL}/${resource}/${id}`, payload);
  }

  delete(resource: string, id: string) {
    return this.http.delete(`${API_URL}/${resource}/${id}`);
  }

  getStorePickerVouchers() {
    return this.http.get<StorePickerVoucher[]>(`${API_URL}/public/vouchers/picker`);
  }

  validateVoucher(code: string, subtotal: number, userId?: string | null) {
    return this.http.post<{
      discountAmount: number;
      finalAmount: number;
      voucher: { code: string; name: string };
      message?: string;
    }>(`${API_URL}/public/vouchers/validate`, { code, subtotal, userId: userId || undefined });
  }

  getPostInteractionStats() {
    return this.http.get<{
      totals: { viewCount: number; likeCount: number; shareCount: number };
      posts: PostRow[];
    }>(`${API_URL}/posts/stats/interactions`);
  }

  getUserOrders(userId: string) {
    return this.http.get<{
      user: { id: string; fullName: string; email: string; phone: string };
      data: {
        id: string;
        orderCode: string;
        totalAmount: number;
        paymentMethod: string;
        status: string;
        createdAt: string;
      }[];
      total: number;
    }>(`${API_URL}/users/${userId}/orders`);
  }

  getAdminOrderStatistics() {
    return this.http.get<OrderStatistics>(`${API_URL}/orders/statistics`);
  }

  getAdminOrders(page: number, limit: number, filters: Partial<OrderFilters>) {
    let params = new HttpParams().set('page', page).set('limit', limit);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<OrderListResponse>(`${API_URL}/orders`, { params });
  }

  getAdminOrder(id: string) {
    return this.http.get(`${API_URL}/orders/${id}`);
  }

  updateAdminOrder(id: string, payload: OrderActionForm) {
    return this.http.put(`${API_URL}/orders/${id}`, payload);
  }

  deleteAdminOrder(id: string) {
    return this.http.delete(`${API_URL}/orders/${id}`);
  }

  getDashboardSummary() {
    return this.http.get<{
      cards: {
        revenueToday: number;
        revenueMonth: number;
        revenueAll: number;
        totalOrders: number;
        totalUsers: number;
        totalProducts: number;
        lowStockCount: number;
      };
      chart: Array<{ month: string; revenue: number }>;
      recentOrders: Array<Record<string, unknown>>;
      bestSellers: Array<{ _id: string; name: string; imageUrl?: string; price: number; categoryName?: string; sold: number; revenue: number; stock?: number }>;
      slowSellers: Array<{ _id: string; name: string; imageUrl?: string; price: number; categoryName?: string; sold: number; revenue: number; stock?: number }>;
      topCustomers: Array<{ name: string; email: string; phone?: string; isVip: boolean; createdAt: string; totalSpent: number; orderCount: number }>;
      categories: Array<{ name: string; count: number }>;
      lowStockProducts: Array<{ _id: string; name: string; imageUrl?: string; price: number; categoryName?: string; stock: number; level: string }>;
    }>(`${API_URL}/dashboard/summary`);
  }

  getRevenueChart(params: { mode: 'day' | 'month' | 'year'; days?: number; year?: number }) {
    let httpParams = new HttpParams().set('mode', params.mode);
    if (params.days != null) {
      httpParams = httpParams.set('days', params.days);
    }
    if (params.year != null) {
      httpParams = httpParams.set('year', params.year);
    }
    return this.http.get<{
      mode: string;
      days?: number;
      year?: number;
      chart: Array<{ label: string; revenue: number }>;
    }>(`${API_URL}/dashboard/revenue-chart`, { params: httpParams });
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.put(`${API_URL}/auth/change-password`, {
      currentPassword,
      newPassword
    });
  }
}
