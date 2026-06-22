export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipping'
  | 'completed'
  | 'cancelled'
  | 'returned';

export const ORDER_STATUS_PIPELINE: OrderStatus[] = [
  'pending',
  'processing',
  'shipping',
  'completed'
];

export const STATUS_LIST_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  completed: 'Đã nhận',
  cancelled: 'Đã hủy',
  returned: 'Hoàn trả'
};

export const STATUS_FLOW_LABELS: Record<OrderStatus, string> = {
  pending: 'Đã đặt',
  processing: 'Đã thanh toán',
  shipping: 'Đã giao',
  completed: 'Đã nhận',
  cancelled: 'Đã hủy',
  returned: 'Hoàn trả'
};

export function getNextOrderStatus(current: OrderStatus): OrderStatus | null {
  const index = ORDER_STATUS_PIPELINE.indexOf(current);
  if (index === -1 || index >= ORDER_STATUS_PIPELINE.length - 1) {
    return null;
  }
  return ORDER_STATUS_PIPELINE[index + 1];
}

export function canAdvanceOrderStatus(current: OrderStatus): boolean {
  return getNextOrderStatus(current) !== null;
}

export function isPipelineStatus(status: OrderStatus): boolean {
  return ORDER_STATUS_PIPELINE.includes(status);
}
