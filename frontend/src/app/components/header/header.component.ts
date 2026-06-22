import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { getAdminSectionId } from '../../shared/admin-page.config';

const TITLES: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/products': 'Quản lý sản phẩm',
  '/admin/products/new': 'Thêm sản phẩm',
  '/admin/categories': 'Quản lý sản phẩm',
  '/admin/collections': 'Quản lý sản phẩm',
  '/admin/attributes': 'Quản lý sản phẩm',
  '/admin/variants': 'Quản lý sản phẩm',
  '/admin/product-reviews': 'Đánh giá & tương tác',
  '/admin/orders': 'Quản lý đơn hàng',
  '/admin/users': 'Quản lý khách hàng',
  '/admin/posts': 'Quản lý bài viết',
  '/admin/banners': 'Quản lý banner',
  '/admin/promotions/vouchers': 'Mã giảm giá',
  '/admin/contacts': 'Cấu hình hệ thống',
  '/admin/test-mail': 'Test mail',
  '/admin/account': 'Quản lý tài khoản',
  '/admin/account/password': 'Đổi mật khẩu'
};

const SECTION_TITLES: Record<string, string> = {
  products: 'Quản lý sản phẩm',
  orders: 'Quản lý đơn hàng',
  customers: 'Quản lý khách hàng',
  promotions: 'Khuyến mãi',
  posts: 'Quản lý bài viết',
  banners: 'Quản lý banner',
  reports: 'Báo cáo & thống kê',
  engagement: 'Đánh giá & tương tác',
  finance: 'Quản lý tài chính',
  account: 'Quản lý tài khoản',
  system: 'Cấu hình hệ thống'
};

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="topbar">
      <div class="topbar-left">
        <button type="button" class="icon-btn" aria-label="Menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 class="topbar-title">{{ pageTitle() }}</h1>
      </div>

      <div class="topbar-right">
        <button type="button" class="icon-btn notify" aria-label="Thông báo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          @if (notifyCount() > 0) {
            <span class="dot"></span>
          }
        </button>

        <div class="profile">
          <div class="avatar">{{ initials() }}</div>
          <div class="profile-meta">
            <span class="profile-name">{{ displayName() }}</span>
            <span class="profile-role">Quản trị viên</span>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      .topbar {
        height: var(--header-h);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 1.5rem;
        background: var(--surface);
        border-bottom: 1px solid var(--border);
        flex-shrink: 0;
      }

      .topbar-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .topbar-title {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        letter-spacing: -0.02em;
      }

      .topbar-right {
        display: flex;
        align-items: center;
        gap: 1.25rem;
      }

      .icon-btn {
        position: relative;
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;
        transition: background 0.15s;
      }

      .icon-btn svg {
        width: 20px;
        height: 20px;
      }

      .icon-btn:hover {
        background: var(--border-light);
        color: var(--text);
      }

      .notify .dot {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #ef4444;
        border: 2px solid var(--surface);
      }

      .profile {
        display: flex;
        align-items: center;
        gap: 0.65rem;
      }

      .avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(145deg, #6b7280, #374151);
        color: #fff;
        font-size: 0.75rem;
        font-weight: 600;
        display: grid;
        place-items: center;
      }

      .profile-meta {
        display: flex;
        flex-direction: column;
        line-height: 1.25;
      }

      .profile-name {
        font-size: 0.8125rem;
        font-weight: 600;
      }

      .profile-role {
        font-size: 0.6875rem;
        color: var(--muted);
      }

      @media (max-width: 640px) {
        .profile-meta {
          display: none;
        }

        .topbar {
          padding: 0 1rem;
        }
      }
    `
  ]
})
export class HeaderComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  pageTitle = signal('Dashboard');
  notifyCount = signal(1);

  ngOnInit(): void {
    this.syncTitle(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.syncTitle(e.urlAfterRedirects));
  }

  displayName(): string {
    const user = this.auth.getCurrentUser();
    return user?.fullName || 'Admin';
  }

  initials(): string {
    const name = this.displayName();
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  private syncTitle(url: string): void {
    const path = url.split('?')[0];
    if (path.endsWith('/edit') && path.includes('/products/')) {
      this.pageTitle.set('Chỉnh sửa sản phẩm');
      return;
    }
    if (path.endsWith('/promotions/new')) {
      this.pageTitle.set('Thêm voucher');
      return;
    }
    if (/\/promotions\/[a-f0-9]{24}\/edit$/i.test(path)) {
      this.pageTitle.set('Sửa voucher');
      return;
    }
    if (TITLES[path]) {
      this.pageTitle.set(TITLES[path]);
      return;
    }
    const sectionId = getAdminSectionId(path);
    if (sectionId && SECTION_TITLES[sectionId]) {
      this.pageTitle.set(SECTION_TITLES[sectionId]);
      return;
    }
    this.pageTitle.set('Dashboard');
  }
}
