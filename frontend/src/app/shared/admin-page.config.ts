export interface AdminTab {

  label: string;

  route: string;

  queryParams?: Record<string, string>;

  exact?: boolean;

}



export interface AdminSection {

  id: string;

  match: (path: string) => boolean;

  tabs: AdminTab[];

}



export const ADMIN_SECTIONS: AdminSection[] = [

  {

    id: 'products',

    match: (p) =>

      /^\/admin\/(products|categories|collections|attributes|variants)(\/|$)/.test(p),

    tabs: [

      { label: 'Sản phẩm', route: '/admin/products', exact: true },

      { label: 'Danh mục', route: '/admin/categories' },

      { label: 'Bộ sưu tập', route: '/admin/collections' },

      { label: 'Thuộc tính', route: '/admin/attributes' },

      { label: 'Biến thể', route: '/admin/variants' }

    ]

  },

  {

    id: 'orders',

    match: (p) => p.startsWith('/admin/orders'),

    tabs: [

      { label: 'Tất cả đơn hàng', route: '/admin/orders', exact: true },

      {

        label: 'Chờ xác nhận',

        route: '/admin/orders',

        queryParams: { status: 'pending' },

        exact: false

      },

      {

        label: 'Đang xử lý',

        route: '/admin/orders',

        queryParams: { status: 'processing' },

        exact: false

      },

      {

        label: 'Đang giao',

        route: '/admin/orders',

        queryParams: { status: 'shipping' },

        exact: false

      },

      {

        label: 'Đã giao',

        route: '/admin/orders',

        queryParams: { status: 'completed' },

        exact: false

      },

      {

        label: 'Đã hủy',

        route: '/admin/orders',

        queryParams: { status: 'cancelled' },

        exact: false

      },

      {

        label: 'Hoàn trả',

        route: '/admin/orders',

        queryParams: { status: 'returned' },

        exact: false

      }

    ]

  },

  {

    id: 'customers',

    match: (p) => /^\/admin\/(users|customers)/.test(p),

    tabs: [

      { label: 'Danh sách khách hàng', route: '/admin/users', exact: true },

      { label: 'Thành viên VIP', route: '/admin/users', queryParams: { tier: 'vip' } },

      { label: 'Điểm tích lũy', route: '/admin/customers/points' },

      { label: 'Địa chỉ giao hàng', route: '/admin/customers/addresses' },

      { label: 'Danh sách yêu thích', route: '/admin/customers/favorites' },

      { label: 'Nhật ký hoạt động', route: '/admin/customers/activity' },

      {

        label: 'Khóa / Mở khóa',

        route: '/admin/users',

        queryParams: { status: 'locked' }

      }

    ]

  },

  {

    id: 'promotions',

    match: (p) => p.startsWith('/admin/promotions'),

    tabs: [
      { label: 'Mã giảm giá', route: '/admin/promotions/vouchers', exact: true },
      { label: 'Flash Sale', route: '/admin/promotions/flash-sale' },
      { label: 'Combo sản phẩm', route: '/admin/promotions/combos' },
      { label: 'Voucher KH mới', route: '/admin/promotions/new-customer' },
      { label: 'Voucher sinh nhật', route: '/admin/promotions/birthday' },
      { label: 'Thông báo đẩy', route: '/admin/promotions/push' }
    ]

  },

  {

    id: 'posts',

    match: (p) => p.startsWith('/admin/posts'),

    tabs: [

      { label: 'Tất cả bài viết', route: '/admin/posts', exact: true },

      { label: 'Lượt tương tác', route: '/admin/posts/interactions' }

    ]

  },

  {

    id: 'banners',

    match: (p) => p.startsWith('/admin/banners'),

    tabs: [

      { label: 'Danh sách banner', route: '/admin/banners', exact: true }

    ]

  },

  {

    id: 'reports',

    match: (p) => p.startsWith('/admin/reports'),

    tabs: [
      { label: 'Tổng quan', route: '/admin/dashboard' },
      { label: 'Doanh thu', route: '/admin/reports/revenue', exact: true },
      { label: 'Top sản phẩm', route: '/admin/reports/top-products' },
      { label: 'Top khách hàng', route: '/admin/reports/top-customers' },
      { label: 'Tồn kho', route: '/admin/reports/inventory' },
      { label: 'Biểu đồ doanh thu', route: '/admin/reports/chart' },
      { label: 'Nguồn truy cập', route: '/admin/reports/traffic' },
      { label: 'Tỷ lệ chuyển đổi', route: '/admin/reports/conversion' }
    ]

  },

  {

    id: 'engagement',

    match: (p) =>

      /^\/admin\/(engagement|product-reviews)/.test(p) || p === '/admin/reviews',

    tabs: [

      { label: 'Đánh giá sản phẩm', route: '/admin/product-reviews', exact: true },

      { label: 'Bình luận', route: '/admin/engagement/comments' },

      { label: 'Hỏi đáp', route: '/admin/engagement/qa' },

      { label: 'Báo cáo spam', route: '/admin/engagement/spam' }

    ]

  },

  {

    id: 'finance',

    match: (p) => p.startsWith('/admin/finance'),

    tabs: [

      { label: 'Doanh thu', route: '/admin/finance/revenue', exact: true },

      { label: 'Chi phí', route: '/admin/finance/expenses' },

      { label: 'Lợi nhuận', route: '/admin/finance/profit' },

      { label: 'Thanh toán', route: '/admin/finance/payments' },

      { label: 'Giao dịch', route: '/admin/finance/transactions' },

      { label: 'Hoàn tiền', route: '/admin/finance/refunds' },

      { label: 'Công nợ', route: '/admin/finance/receivables' }

    ]

  },

  {

    id: 'account',

    match: (p) => /^\/admin\/account/.test(p),

    tabs: [

      { label: 'Danh sách người dùng', route: '/admin/account', exact: true },

      { label: 'Đổi mật khẩu', route: '/admin/account/password' }

    ]

  },

  {

    id: 'system',

    match: (p) => p.startsWith('/admin/contacts'),

    tabs: [{ label: 'Liên hệ', route: '/admin/contacts' }]

  }

];



export function getAdminTabs(path: string): AdminTab[] {

  const clean = path.split('?')[0];

  const section = ADMIN_SECTIONS.find((s) => s.match(clean));

  return section?.tabs ?? [];

}



export function getAdminSectionId(path: string): string | null {

  const clean = path.split('?')[0];

  return ADMIN_SECTIONS.find((s) => s.match(clean))?.id ?? null;

}

