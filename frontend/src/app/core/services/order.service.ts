import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api-url';
import { Order, OrderDetail, OrderStatistics, OrdersResponse, OrdersFilter, OrderStatusUpdatePayload } from '../models/order.interface';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = `${API_URL}/orders`;

  constructor(private http: HttpClient) {}

  getStatistics(): Observable<OrderStatistics> {
    return this.http.get<OrderStatistics>(`${this.apiUrl}/statistics`);
  }

  getOrders(filter: OrdersFilter): Observable<OrdersResponse> {
    let queryParams = `?page=${filter.page}&limit=${filter.limit}`;
    if (filter.search) queryParams += `&search=${encodeURIComponent(filter.search)}`;
    if (filter.orderCode) queryParams += `&orderCode=${encodeURIComponent(filter.orderCode)}`;
    if (filter.customerName) queryParams += `&customerName=${encodeURIComponent(filter.customerName)}`;
    if (filter.phone) queryParams += `&phone=${encodeURIComponent(filter.phone)}`;
    if (filter.status) queryParams += `&status=${filter.status}`;
    if (filter.paymentMethod) queryParams += `&paymentMethod=${filter.paymentMethod}`;
    if (filter.startDate) queryParams += `&startDate=${filter.startDate}`;
    if (filter.endDate) queryParams += `&endDate=${filter.endDate}`;

    return this.http.get<OrdersResponse>(`${this.apiUrl}${queryParams}`);
  }

  getOrderById(id: string): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(`${this.apiUrl}/${id}`);
  }

  updateOrderStatus(id: string, payload: OrderStatusUpdatePayload): Observable<OrderDetail> {
    return this.http.put<OrderDetail>(`${this.apiUrl}/${id}`, payload);
  }

  deleteOrder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
