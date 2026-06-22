export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipping'
  | 'completed'
  | 'cancelled'
  | 'returned';

export interface OrderStatusHistoryEntry {
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  reason: string;
  changedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderCode: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  totalAmount: number;
  paymentMethod: 'COD' | 'VNPay' | 'Momo';
  status: OrderStatus;
  createdAt: string;
}

export interface OrderDetail extends Order {
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  note: string;
  subtotal: number;
  discountAmount: number;
  voucherCode: string;
  items: OrderItem[];
  statusHistory: OrderStatusHistoryEntry[];
  nextStatus: OrderStatus | null;
  cancellationReason?: string;
  cancellationReasonOther?: string;
  cancellationReasonLabel?: string;
  cancelledAt?: string | null;
  cancelledBy?: string;
}

export interface OrderStatistics {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  returnedOrders?: number;
}

export interface OrdersResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface OrdersFilter {
  page: number;
  limit: number;
  search?: string;
  orderCode?: string;
  customerName?: string;
  phone?: string;
  status?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
}

export type OrderFilters = OrdersFilter;
export type OrderListResponse = OrdersResponse;

export interface OrderStatusUpdatePayload {
  status: OrderStatus;
  reason: string;
}

export interface OrderActionForm {
  status?: string;
  reason?: string;
  note?: string;
}
