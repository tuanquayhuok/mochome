import { AdminCrumb } from './admin-catalog-page.component';

export const ORDER_SECTION_CRUMBS: AdminCrumb[] = [
  { label: 'Dashboard', route: '/admin/dashboard' },
  { label: 'Quản lý đơn hàng' }
];

export function orderSectionCrumbs(page: string): AdminCrumb[] {
  return [...ORDER_SECTION_CRUMBS, { label: page }];
}

export const ORDER_STATUS_TABS: { label: string; status: string; crumb: string }[] = [
  { label: 'Tất cả đơn hàng', status: '', crumb: 'Tất cả đơn hàng' },
  { label: 'Chờ xác nhận', status: 'pending', crumb: 'Chờ xác nhận' },
  { label: 'Đang xử lý', status: 'processing', crumb: 'Đang xử lý' },
  { label: 'Đang giao', status: 'shipping', crumb: 'Đang giao' },
  { label: 'Đã giao', status: 'completed', crumb: 'Đã giao' },
  { label: 'Đã hủy', status: 'cancelled', crumb: 'Đã hủy' },
  { label: 'Hoàn trả', status: 'returned', crumb: 'Hoàn trả' }
];
