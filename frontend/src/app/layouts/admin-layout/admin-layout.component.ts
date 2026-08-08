import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">M</div>
          <div>
            <strong>Moc Home</strong>
            <p>ADMIN</p>
          </div>
        </div>

        <nav class="menu">
          <a routerLink="/dashboard" routerLinkActive="active"><span>⌂</span> Dashboard</a>
          <a routerLink="/products" routerLinkActive="active"><span>▦</span> Quản lý sản phẩm</a>
          <a routerLink="/categories" routerLinkActive="active"><span>◫</span> Quản lý danh mục</a>
          <a routerLink="/brands" routerLinkActive="active"><span>⚐</span> Quản lý thương hiệu</a>
          <a routerLink="/orders" routerLinkActive="active"><span>☰</span> Quản lý đơn hàng</a>
          <a routerLink="/users" routerLinkActive="active"><span>◉</span> Quản lý khách hàng</a>
          <a routerLink="/reviews" routerLinkActive="active"><span>★</span> Quản lý đánh giá</a>
          <a routerLink="/contacts" routerLinkActive="active"><span>✉</span> Liên hệ</a>
          <a routerLink="/posts" routerLinkActive="active"><span>▤</span> Quản lý bài viết</a>
          <a routerLink="/account" routerLinkActive="active"><span>⚙</span> Quản lý tài khoản</a>
        </nav>

        <div class="sidebar-footer">
          <button class="btn logout" (click)="logout()">Đăng xuất</button>
        </div>
      </aside>

      <main class="content">
        <header class="topbar panel">
          <div class="topbar-left">
            <button class="icon-btn" type="button">☰</button>
            <div>
              <p class="eyebrow">Dashboard</p>
              <strong>Bảng điều khiển</strong>
            </div>
          </div>

          <div class="topbar-right">
            <button class="icon-btn" type="button">🔔</button>
            <div class="profile-pill">
              <div class="avatar">{{ initials }}</div>
              <div>
                <strong>{{ user?.fullName || 'Admin' }}</strong>
                <p>{{ user?.email }}</p>
              </div>
            </div>
          </div>
        </header>

        <section class="view panel">
          <router-outlet></router-outlet>
        </section>
      </main>
    </div>
  `,
  styles: [
    `
      .shell {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 1rem;
        padding: 1rem;
      }

      .sidebar {
        background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92));
        border: 1px solid var(--border);
        border-radius: 24px;
        box-shadow: var(--shadow);
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        position: sticky;
        top: 1rem;
        height: calc(100vh - 2rem);
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        padding: 0.3rem 0.2rem 0.6rem;
        border-bottom: 1px solid var(--border);
      }

      .brand-mark {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        color: #fff;
        font-weight: 800;
        background: linear-gradient(135deg, var(--brand), var(--brand-dark));
        box-shadow: 0 10px 22px rgba(15, 118, 110, 0.25);
      }

      .brand p {
        margin: 0.15rem 0 0;
        font-size: 0.72rem;
        letter-spacing: 0.16em;
        color: var(--muted);
      }

      .menu {
        display: grid;
        gap: 0.35rem;
      }

      .menu a {
        padding: 0.8rem 0.95rem;
        border-radius: 16px;
        color: #334155;
        display: flex;
        align-items: center;
        gap: 0.7rem;
        font-weight: 600;
        transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
      }

      .menu a span {
        width: 28px;
        height: 28px;
        border-radius: 10px;
        display: grid;
        place-items: center;
        background: #f3f4f6;
      }

      .menu a.active,
      .menu a:hover {
        background: linear-gradient(135deg, rgba(15,118,110,0.12), rgba(15,118,110,0.05));
        color: var(--brand);
        transform: translateX(2px);
      }

      .menu a.active span,
      .menu a:hover span {
        background: var(--brand-soft);
      }

      .sidebar-footer {
        margin-top: auto;
        padding-top: 0.75rem;
        border-top: 1px solid var(--border);
      }

      .logout {
        width: 100%;
        background: #f3f4f6;
        color: #111827;
      }

      .content {
        min-width: 0;
        display: grid;
        gap: 1rem;
      }

      .topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 1rem 1.1rem;
      }

      .topbar-left,
      .topbar-right,
      .profile-pill {
        display: flex;
        align-items: center;
        gap: 0.9rem;
      }

      .eyebrow {
        margin: 0;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--muted);
      }

      .topbar strong {
        font-size: 1.05rem;
      }

      .profile-pill p {
        margin: 0.1rem 0 0;
        color: var(--muted);
        font-size: 0.78rem;
      }

      .avatar,
      .icon-btn {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        border: 1px solid var(--border);
        background: #fff;
        display: grid;
        place-items: center;
        font-weight: 700;
        color: #334155;
      }

      .icon-btn {
        cursor: pointer;
      }

      .view {
        min-height: calc(100vh - 170px);
      }

      .view :global(.dashboard-shell) {
        display: grid;
        gap: 1rem;
      }

      @media (max-width: 1120px) {
        .shell {
          grid-template-columns: 1fr;
        }

        .sidebar {
          position: static;
          height: auto;
        }
      }

      @media (max-width: 760px) {
        .shell {
          padding: 0.6rem;
          gap: 0.6rem;
        }

        .topbar {
          flex-direction: column;
          align-items: flex-start;
        }

        .sidebar {
          border-radius: 18px;
        }
      }
    `
  ]
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  user = this.authService.getCurrentUser();
  initials = (this.user?.fullName || 'A')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part.charAt(0).toUpperCase())
    .join('');

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
