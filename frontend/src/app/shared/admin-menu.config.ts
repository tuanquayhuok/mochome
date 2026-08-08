/** Cấu hình menu sidebar admin — chỉnh tại đây */
export interface AdminMenuChild {
  label: string;
  route: string;
  queryParams?: Record<string, string>;
}

export interface AdminMenuItem {
  label: string;
  route?: string;
  children?: AdminMenuChild[];
}

export const ADMIN_MENU_ITEMS: AdminMenuItem[] = [
  { label: 'Dashboard', route: '/admin/dashboard' },
  {
    label: 'Quản lý sản phẩm',
    children: [
      { label: 'Sản phẩm', route: '/admin/products' },
      { label: 'Danh mục', route: '/admin/categories' },
      { label: 'Bộ sưu tập', route: '/admin/collections' },
      { label: 'Thuộc tính', route: '/admin/attributes' },
      { label: 'Biến thể', route: '/admin/variants' }
    ]
  },
  { label: 'Quản lý thương hiệu', route: '/admin/brands' },
  {
    label: 'Quản lý đơn hàng',
    children: [
      { label: 'Tất cả đơn hàng', route: '/admin/orders' },
      { label: 'Chờ xác nhận', route: '/admin/orders', queryParams: { status: 'pending' } },
      { label: 'Đang xử lý', route: '/admin/orders', queryParams: { status: 'processing' } },
      { label: 'Đang giao', route: '/admin/orders', queryParams: { status: 'shipping' } },
      { label: 'Đã giao', route: '/admin/orders', queryParams: { status: 'completed' } },
      { label: 'Đã hủy', route: '/admin/orders', queryParams: { status: 'cancelled' } },
      { label: 'Hoàn trả', route: '/admin/orders', queryParams: { status: 'returned' } }
    ]
  },
  /*
  {
    label: 'Quản lý khách hàng',
    children: [
      { label: 'Danh sách khách hàng', route: '/admin/users' },
      { label: 'Thành viên VIP', route: '/admin/users', queryParams: { tier: 'vip' } },
      { label: 'Điểm tích lũy', route: '/admin/customers/points' },
      { label: 'Địa chỉ giao hàng', route: '/admin/customers/addresses' },
      { label: 'Danh sách yêu thích', route: '/admin/customers/favorites' },
      { label: 'Nhật ký hoạt động', route: '/admin/customers/activity' },
      { label: 'Khóa / Mở khóa', route: '/admin/users', queryParams: { status: 'locked' } }
    ]
  },
  */
  {
    label: 'Quản lý bài viết',
    children: [
      { label: 'Tất cả bài viết', route: '/admin/posts' },
      { label: 'Lượt tương tác', route: '/admin/posts/interactions' },
      { label: 'Quản lý bình luận', route: '/admin/posts/comments' }
    ]
  },
  {
    label: 'Khuyến mãi',
    children: [
      { label: 'Mã giảm giá', route: '/admin/promotions/vouchers' },
      { label: 'Flash Sale', route: '/admin/promotions/flash-sale' },
      { label: 'Combo sản phẩm', route: '/admin/promotions/combos' },
      { label: 'Voucher khách hàng mới', route: '/admin/promotions/new-customer' },
      { label: 'Voucher sinh nhật', route: '/admin/promotions/birthday' },
      { label: 'Thông báo đẩy', route: '/admin/promotions/push' }
    ]
  },
  {
    label: 'Báo cáo & thống kê',
    children: [
      { label: 'Doanh thu ngày/tháng/năm', route: '/admin/reports/revenue' },
      { label: 'Top sản phẩm bán chạy', route: '/admin/reports/top-products' },
      { label: 'Top sản phẩm bán chậm', route: '/admin/reports/slow-products' },
      { label: 'Top khách hàng', route: '/admin/reports/top-customers' },
      { label: 'Sản phẩm tồn kho', route: '/admin/reports/inventory' },
      { label: 'Biểu đồ doanh thu', route: '/admin/reports/chart' }
    ]
  },
  {
    label: 'Đánh giá & tương tác',
    children: [
      { label: 'Đánh giá sản phẩm', route: '/admin/product-reviews' },
      { label: 'Bình luận sản phẩm', route: '/admin/engagement/comments' },
      { label: 'Hỏi đáp sản phẩm', route: '/admin/engagement/qa' },
      { label: 'Báo cáo spam', route: '/admin/engagement/spam' }
    ]
  },
  {
    label: 'Quản lý đại lý',
    children: [
      { label: 'Danh sách đại lý', route: '/admin/stores' },
      { label: 'Tồn kho đại lý', route: '/admin/stores/inventory' },
      { label: 'Báo cáo phân phối', route: '/admin/stores/reports' }
    ]
  },
  {
    label: 'Cấu hình hệ thống',
    children: [
      { label: 'Thông tin cửa hàng', route: '/admin/system-settings' },
      { label: 'Banner quảng cáo', route: '/admin/banners' },
      { label: 'Ý kiến khách hàng', route: '/admin/contacts' },
      { label: 'Phát thông báo', route: '/admin/notifications' }
    ]
  },
  {
    label: 'Quản lý tài khoản',
    children: [
      { label: 'Danh sách người dùng', route: '/admin/account' },
      { label: 'Đổi mật khẩu', route: '/admin/account/password' }
    ]
  }
];

export const ADMIN_MENU_SECTION_PARENT: Record<string, string> = {
  products: 'Quản lý sản phẩm',
  orders: 'Quản lý đơn hàng',
  customers: 'Quản lý khách hàng',
  promotions: 'Khuyến mãi',
  posts: 'Quản lý bài viết',
  reports: 'Báo cáo & thống kê',
  engagement: 'Đánh giá & tương tác',
  finance: 'Quản lý tài chính',
  account: 'Quản lý tài khoản',
  system: 'Cấu hình hệ thống',
  banners: 'Quản lý banner'
};
