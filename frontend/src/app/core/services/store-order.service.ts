import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../config/api-url';
import { getWithPathFallback } from './store-http.util';

const ORDERS_PATHS = ['/auth/store/orders', '/store/orders'] as const;

export interface CheckoutLine {
  productId: string;
  quantity: number;
}

export interface PlaceOrderPayload {
  items: CheckoutLine[];
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  paymentMethod: string;
  voucherCode?: string;
  note?: string;
}

export interface StoreOrderLine {
  productId?: string;
  name: string;
  slug?: string;
  imageUrl?: string;
  quantity: number;
  price: number;
}

export interface StoreOrderStatusHistory {
  fromStatus: string;
  toStatus: string;
  reason: string;
  changedAt: string;
}

export interface StoreOrderResult {
  id: string;
  orderCode: string;
  subtotal?: number;
  discountAmount?: number;
  voucherCode?: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus?: string;
  status: string;
  receiverName?: string;
  receiverPhone?: string;
  shippingAddress?: string;
  note?: string;
  items?: StoreOrderLine[];
  createdAt: string;
}

export interface StoreOrderDetail extends StoreOrderResult {
  statusHistory: StoreOrderStatusHistory[];
  canEditShipping: boolean;
  canCancel: boolean;
  cancellationReason?: string;
  cancellationReasonOther?: string;
  cancellationReasonLabel?: string;
  cancelledAt?: string | null;
  cancelledBy?: string;
}

export type CancellationReasonCode =
  | 'no_longer_want'
  | 'out_of_money'
  | 'wrong_address'
  | 'found_cheaper'
  | 'other';

export interface CancelOrderPayload {
  reason: CancellationReasonCode;
  reasonOther?: string;
}

export interface UpdateOrderShippingPayload {
  receiverPhone: string;
  shippingAddress: string;
}

@Injectable({ providedIn: 'root' })
export class StoreOrderService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/auth/store/orders`;

  placeOrder(payload: PlaceOrderPayload) {
    return this.http.post<{ message: string; order: StoreOrderResult }>(this.base, payload);
  }

  myOrders() {
    return getWithPathFallback<{ data: StoreOrderResult[] }>(this.http, ORDERS_PATHS);
  }

  getOrder(id: string) {
    return this.http.get<StoreOrderDetail>(`${this.base}/${id}`);
  }

  updateShipping(id: string, payload: UpdateOrderShippingPayload) {
    return this.http.patch<{ message: string; order: StoreOrderDetail }>(
      `${this.base}/${id}/shipping`,
      payload
    );
  }

  cancelOrder(id: string, payload: CancelOrderPayload) {
    return this.http.post<{ message: string; order: StoreOrderDetail }>(
      `${this.base}/${id}/cancel`,
      payload
    );
  }

  cancellationReasons() {
    return this.http.get<{ data: Record<CancellationReasonCode, string> }>(
      `${this.base}/cancellation-reasons`
    );
  }
}
