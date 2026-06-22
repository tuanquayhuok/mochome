import { Routes } from '@angular/router';

const loadPlaceholder = () =>
  import('../pages/admin/admin-placeholder.component').then((m) => m.AdminPlaceholderComponent);

const phData = (path: string, data: Record<string, string>) => ({
  path,
  loadComponent: loadPlaceholder,
  data
});

const finance = (page: string, title: string) =>
  phData(`finance/${page}`, {
    title,
    subtitle: 'Quản lý tài chính',
    sectionLabel: 'Quản lý tài chính',
    sectionRoute: '/admin/finance/revenue',
    hint: 'Module tài chính sẽ liên kết đơn hàng, thanh toán và hoàn tiền trong bản cập nhật tiếp theo.'
  });

const engagement = (page: string, title: string, hint?: string) =>
  phData(`engagement/${page}`, {
    title,
    subtitle: 'Đánh giá & tương tác',
    sectionLabel: 'Đánh giá & tương tác',
    sectionRoute: '/admin/engagement/reviews',
    hint: hint || 'Tính năng đang được phát triển.'
  });

const customers = (page: string, title: string, hint?: string, linkRoute?: string, linkLabel?: string) =>
  phData(`customers/${page}`, {
    title,
    subtitle: 'Quản lý khách hàng',
    sectionLabel: 'Quản lý khách hàng',
    sectionRoute: '/admin/users',
    hint: hint || 'Tính năng đang được phát triển.',
    ...(linkRoute ? { linkRoute, linkLabel: linkLabel || 'Mở danh sách' } : {})
  });

const promotions = (page: string, title: string, hint?: string, linkRoute?: string, linkLabel?: string) =>
  phData(`promotions/${page}`, {
    title,
    subtitle: 'Khuyến mãi',
    sectionLabel: 'Khuyến mãi',
    sectionRoute: '/admin/promotions/vouchers',
    hint: hint || 'Tính năng đang được phát triển.',
    ...(linkRoute ? { linkRoute, linkLabel: linkLabel || 'Mở mã giảm giá' } : {})
  });

/** Routes bổ sung cho báo cáo, tài chính, đánh giá, khách hàng */
export const ADMIN_EXTENDED_ROUTES: Routes = [
  { path: 'reports', pathMatch: 'full', redirectTo: 'reports/revenue' },
  {
    path: 'reports/:slug',
    loadComponent: () =>
      import('../pages/admin/reports-page.component').then((m) => m.ReportsPageComponent)
  },
  { path: 'engagement/reviews', redirectTo: 'product-reviews', pathMatch: 'full' },
  engagement('comments', 'Bình luận sản phẩm'),
  engagement('qa', 'Hỏi đáp sản phẩm'),
  engagement('spam', 'Báo cáo spam', 'Danh sách đánh giá/bình luận bị gắn cờ spam.'),
  finance('revenue', 'Doanh thu'),
  finance('expenses', 'Chi phí'),
  finance('profit', 'Lợi nhuận'),
  finance('payments', 'Quản lý thanh toán'),
  finance('transactions', 'Lịch sử giao dịch'),
  finance('refunds', 'Yêu cầu hoàn tiền'),
  finance('receivables', 'Công nợ khách hàng'),
  { path: 'finance', pathMatch: 'full', redirectTo: 'finance/revenue' },
  customers('points', 'Điểm tích lũy'),
  customers('addresses', 'Địa chỉ giao hàng'),
  customers('favorites', 'Danh sách yêu thích'),
  customers('activity', 'Nhật ký hoạt động khách hàng'),
  promotions('flash-sale', 'Flash Sale', 'Chương trình giảm giá theo khung giờ / sự kiện.'),
  promotions('combos', 'Combo sản phẩm', 'Gói sản phẩm kèm giá ưu đãi.'),
  promotions(
    'new-customer',
    'Voucher khách hàng mới',
    'Mã dành cho đơn đầu tiên.',
    '/admin/promotions/vouchers',
    'Quản lý voucher'
  ),
  promotions('birthday', 'Voucher sinh nhật', 'Tự động gửi mã theo ngày sinh khách hàng.'),
  promotions('push', 'Thông báo đẩy', 'Gửi thông báo khuyến mãi tới app / trình duyệt.')
];
