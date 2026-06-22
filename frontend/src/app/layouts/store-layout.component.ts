import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { CartService } from '../core/services/cart.service';
import { FavoritesService } from '../core/services/favorites.service';
import { StoreAuthService } from '../core/services/store-auth.service';
import { StoreChatbotComponent } from '../shared/store-chatbot/store-chatbot.component';

@Component({
  selector: 'app-store-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule, StoreChatbotComponent],
  template: `
    <div class="store" [class.store--compact]="compactLayout()">
      <header class="site-header">
        @if (compactLayout()) {
          <div class="container header-compact">
            <button
              type="button"
              class="icon-btn menu-toggle-compact"
              (click)="toggleMobileNav()"
              [attr.aria-expanded]="mobileNavOpen()"
              aria-label="Menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                @if (mobileNavOpen()) {
                  <path d="M18 6L6 18M6 6l12 12" />
                } @else {
                  <path d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>

            <a routerLink="/" class="brand" aria-label="Mộc Home">
              <span class="brand-mark"></span>
              <span class="brand-name">MỘC HOME</span>
            </a>

            <nav class="nav-compact desktop-nav-compact" aria-label="Menu chính">
              <a
                routerLink="/"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: true }"
                class="nav-item"
              >
                Trang chủ
              </a>
              <a routerLink="/san-pham" routerLinkActive="active" class="nav-item has-chevron">
                Sản phẩm
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </a>
              <a routerLink="/san-pham" routerLinkActive="active" class="nav-item">Bộ sưu tập</a>
              <a routerLink="/tin-tuc" routerLinkActive="active" class="nav-item">Bài viết</a>
              <a routerLink="/gioi-thieu" routerLinkActive="active" class="nav-item">Giới thiệu</a>
              <a routerLink="/lien-he" routerLinkActive="active" class="nav-item">Liên hệ</a>
            </nav>

            @if (mobileNavOpen()) {
              <div class="mobile-overlay" (click)="closeMobileNav()" aria-hidden="true"></div>
              <nav class="mobile-drawer" aria-label="Menu di động">
                <form class="mobile-search-form" (submit)="onSearch($event)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    type="search"
                    placeholder="Tìm kiếm sản phẩm..."
                    [value]="searchQuery()"
                    (input)="searchQuery.set($any($event.target).value)"
                  />
                </form>
                <a routerLink="/" (click)="closeMobileNav()" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Trang chủ</a>
                <a routerLink="/san-pham" (click)="closeMobileNav()" routerLinkActive="active">Sản phẩm</a>
                <a routerLink="/tin-tuc" (click)="closeMobileNav()" routerLinkActive="active">Bài viết</a>
                <a routerLink="/gioi-thieu" (click)="closeMobileNav()" routerLinkActive="active">Giới thiệu</a>
                <a routerLink="/lien-he" (click)="closeMobileNav()" routerLinkActive="active">Liên hệ</a>
              </nav>
            }

            <div class="header-icons">
              <button type="button" class="icon-btn" title="Tìm kiếm" (click)="toggleSearch()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </button>
              <a routerLink="/tai-khoan" class="icon-btn" title="Tài khoản">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </a>
              <a routerLink="/gio-hang" class="icon-btn cart-btn" title="Giỏ hàng">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <path d="M3 6h18M16 10a4 4 0 01-8 0" />
                </svg>
                @if (cartCount() > 0) {
                  <em class="cart-badge">{{ cartCount() }}</em>
                }
              </a>
            </div>
          </div>
        } @else {
          <div class="topbar">
            <div class="container topbar-row">
              <button
                type="button"
                class="menu-toggle"
                (click)="toggleMobileNav()"
                [attr.aria-expanded]="mobileNavOpen()"
                aria-label="Mở menu điều hướng"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  @if (mobileNavOpen()) {
                    <path d="M18 6L6 18M6 6l12 12" />
                  } @else {
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  }
                </svg>
              </button>

              <a routerLink="/" class="logo-wrap" aria-label="Mộc Home">
                <span class="logo-box">LOGO</span>
              </a>

              <form class="search-form" (submit)="onSearch($event)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="search"
                  placeholder="Tìm kiếm sản phẩm..."
                  [value]="searchQuery()"
                  (input)="searchQuery.set($any($event.target).value)"
                />
              </form>

              <div class="topbar-actions">
                <a routerLink="/tai-khoan" class="action-link">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Tài khoản</span>
                </a>
                <a routerLink="/yeu-thich" class="action-link">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                    <path
                      d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                    />
                  </svg>
                  <span>Yêu thích</span>
                </a>
                <a routerLink="/gio-hang" class="action-link cart-link">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                  </svg>
                  <span>Giỏ hàng</span>
                  @if (cartCount() > 0) {
                    <em class="cart-badge">{{ cartCount() }}</em>
                  }
                </a>
              </div>
            </div>
          </div>

          <nav class="main-nav desktop-nav" aria-label="Menu chính">
            <div class="container nav-row">
              <a
                routerLink="/"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: true }"
                class="nav-link"
              >
                TRANG CHỦ
              </a>
              <a routerLink="/san-pham" routerLinkActive="active" class="nav-link has-chevron">
                SẢN PHẨM
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </a>
              <a routerLink="/san-pham" routerLinkActive="active" class="nav-link">BỘ SƯU TẬP</a>
              <a routerLink="/tin-tuc" routerLinkActive="active" class="nav-link">BÀI VIẾT</a>
              <a routerLink="/gioi-thieu" routerLinkActive="active" class="nav-link">GIỚI THIỆU</a>
              <a routerLink="/lien-he" routerLinkActive="active" class="nav-link">LIÊN HỆ</a>
            </div>
          </nav>

          @if (mobileNavOpen()) {
            <div class="mobile-overlay" (click)="closeMobileNav()" aria-hidden="true"></div>
            <nav class="mobile-drawer" aria-label="Menu di động">
              <form class="mobile-search-form" (submit)="onSearch($event)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="search"
                  placeholder="Tìm kiếm sản phẩm..."
                  [value]="searchQuery()"
                  (input)="searchQuery.set($any($event.target).value)"
                />
              </form>
              <a routerLink="/" (click)="closeMobileNav()" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Trang chủ</a>
              <a routerLink="/san-pham" (click)="closeMobileNav()" routerLinkActive="active">Sản phẩm</a>
              <a routerLink="/san-pham" (click)="closeMobileNav()" routerLinkActive="active">Bộ sưu tập</a>
              <a routerLink="/tin-tuc" (click)="closeMobileNav()" routerLinkActive="active">Bài viết</a>
              <a routerLink="/gioi-thieu" (click)="closeMobileNav()" routerLinkActive="active">Giới thiệu</a>
              <a routerLink="/lien-he" (click)="closeMobileNav()" routerLinkActive="active">Liên hệ</a>
            </nav>
          }
        }

        @if (searchOpen()) {
          <div class="search-bar">
            <form class="container search-form-popup" (submit)="onSearch($event)">
              <input
                type="search"
                placeholder="Tìm kiếm sản phẩm..."
                [(ngModel)]="searchQueryModel"
                name="q"
                autofocus
              />
              <button type="submit">Tìm</button>
            </form>
          </div>
        }
      </header>

      <main class="store-main">
        <router-outlet />
      </main>

      @if (isHomePage()) {
        <app-store-chatbot />
      }

      <footer class="site-footer">
        @if (compactLayout()) {
          <div class="container footer-grid footer-grid--contact">
            <div class="footer-col footer-brand">
              <div class="brand footer-brand-row">
                <span class="brand-mark sm"></span>
                <span class="brand-name">MỘC HOME</span>
              </div>
              <p>
                Thương hiệu nội thất gỗ tự nhiên, cam kết chất lượng và mang đến không gian sống tinh
                tế cho gia đình Việt.
              </p>
              <div class="social" aria-label="Mạng xã hội">
                <a href="#" aria-label="Facebook" (click)="$event.preventDefault()">f</a>
                <a href="#" aria-label="Instagram" (click)="$event.preventDefault()">ig</a>
                <a href="#" aria-label="Pinterest" (click)="$event.preventDefault()">p</a>
                <a href="#" aria-label="YouTube" (click)="$event.preventDefault()">yt</a>
              </div>
            </div>

            <div class="footer-col">
              <h4>VỀ CHÚNG TÔI</h4>
              <ul>
                <li><a routerLink="/gioi-thieu">Giới thiệu</a></li>
                <li><a routerLink="/san-pham">Bộ sưu tập</a></li>
                <li><a routerLink="/tin-tuc">Tin tức</a></li>
                <li><a routerLink="/lien-he">Liên hệ</a></li>
              </ul>
            </div>

            <div class="footer-col">
              <h4>CHÍNH SÁCH</h4>
              <ul>
                <li><a href="#">Chính sách bảo mật</a></li>
                <li><a href="#">Chính sách đổi trả</a></li>
                <li><a href="#">Chính sách vận chuyển</a></li>
                <li><a href="#">Điều khoản sử dụng</a></li>
              </ul>
            </div>

            <div class="footer-col">
              <h4>HỖ TRỢ KHÁCH HÀNG</h4>
              <ul>
                <li><a href="#">Hướng dẫn mua hàng</a></li>
                <li><a href="#">Hướng dẫn thanh toán</a></li>
                <li><a href="#">Hướng dẫn vận chuyển</a></li>
                <li><a href="#">Câu hỏi thường gặp</a></li>
              </ul>
            </div>

            <div class="footer-col newsletter">
              <h4>ĐĂNG KÝ NHẬN TIN</h4>
              <p>Đăng ký để nhận thông tin khuyến mãi và sản phẩm mới nhất.</p>
              <form class="newsletter-form" (submit)="onNewsletter($event)">
                <input
                  type="email"
                  placeholder="Nhập email của bạn"
                  [(ngModel)]="newsletterEmail"
                  name="newsletter"
                  required
                />
                <button type="submit" aria-label="Gửi đăng ký">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </button>
              </form>
            </div>
          </div>

          <div class="footer-bottom footer-bottom--center">
            <p>© {{ year }} Mộc Home. All rights reserved.</p>
          </div>
        } @else {
          <div class="container footer-grid">
            <div class="footer-col footer-about">
              <span class="logo-box sm">LOGO</span>
              <p>
                Mộc Home — thương hiệu nội thất gỗ tự nhiên, mang đến không gian sống tinh tế và ấm
                cúng cho gia đình Việt.
              </p>
              <div class="social" aria-label="Mạng xã hội">
                <a href="#" aria-label="Facebook" (click)="$event.preventDefault()">f</a>
                <a href="#" aria-label="Instagram" (click)="$event.preventDefault()">in</a>
                <a href="#" aria-label="YouTube" (click)="$event.preventDefault()">yt</a>
              </div>
            </div>

            <div class="footer-col">
              <h4>VỀ MỘC HOME</h4>
              <ul>
                <li><a routerLink="/gioi-thieu">Giới thiệu</a></li>
                <li><a href="#">Chính sách giao hàng</a></li>
                <li><a href="#">Chính sách đổi trả</a></li>
                <li><a href="#">Chính sách bảo hành</a></li>
                <li><a href="#">Chính sách bảo mật</a></li>
              </ul>
            </div>

            <div class="footer-col">
              <h4>HỖ TRỢ KHÁCH HÀNG</h4>
              <ul>
                <li><a href="#">Hướng dẫn mua hàng</a></li>
                <li><a href="#">Hướng dẫn thanh toán</a></li>
                <li><a href="#">Câu hỏi thường gặp</a></li>
                <li><a routerLink="/lien-he">Liên hệ</a></li>
              </ul>
            </div>

            <div class="footer-col">
              <h4>DANH MỤC SẢN PHẨM</h4>
              <ul>
                <li><a routerLink="/san-pham">Sofa</a></li>
                <li><a routerLink="/san-pham">Bàn ăn</a></li>
                <li><a routerLink="/san-pham">Giường ngủ</a></li>
                <li><a routerLink="/san-pham">Tủ quần áo</a></li>
                <li><a routerLink="/san-pham">Kệ tivi</a></li>
              </ul>
            </div>

            <div class="footer-col">
              <h4>LIÊN HỆ</h4>
              <ul class="contact-list">
                <li>123 Đường ABC, Quận 1, TP. Hồ Chí Minh</li>
                <li><a href="tel:0123456789">0123 456 789</a></li>
                <li><a href="mailto:info@mochome.vn">info@mochome.vn</a></li>
                <li>8:00 – 22:00 (Tất cả các ngày)</li>
              </ul>
            </div>
          </div>

          <div class="footer-bottom">
            <div class="container footer-bottom-row">
              <p>© {{ year }} Mộc Home. All rights reserved.</p>
              <div class="payments" aria-label="Phương thức thanh toán">
                <span>VISA</span>
                <span>MC</span>
                <span>Momo</span>
                <span>ZaloPay</span>
              </div>
            </div>
          </div>
        }
      </footer>
    </div>
  `,
  styles: [
    `
      .store {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        background: #f5f5f5;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1.25rem;
      }

      .site-header {
        background: #fff;
        border-bottom: 1px solid #e0e0e0;
      }

      /* —— Compact header (Liên hệ) —— */
      .header-compact {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 1rem;
        min-height: 64px;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-shrink: 0;
      }

      .brand-mark {
        width: 36px;
        height: 36px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        background: #f5f5f5;
        flex-shrink: 0;
      }

      .brand-mark.sm {
        width: 32px;
        height: 32px;
      }

      .brand-name {
        font-size: 0.9375rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        color: #1a1d21;
      }

      .nav-compact {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        flex-wrap: wrap;
      }

      .nav-item {
        display: inline-flex;
        align-items: center;
        gap: 0.15rem;
        padding: 0.4rem 0.75rem;
        font-size: 0.875rem;
        font-weight: 400;
        color: #6b7280;
        border-bottom: 2px solid transparent;
      }

      .nav-item svg {
        width: 10px;
        height: 10px;
      }

      .nav-item:hover {
        color: #1a1d21;
      }

      .nav-item.active {
        color: #1a1d21;
        font-weight: 500;
        border-bottom-color: #1a1d21;
      }

      .header-icons {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .icon-btn {
        position: relative;
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        border: none;
        background: transparent;
        color: #374151;
        cursor: pointer;
        border-radius: 4px;
      }

      .icon-btn svg {
        width: 22px;
        height: 22px;
      }

      .icon-btn:hover {
        background: #f3f4f6;
      }

      /* —— Default header (Trang chủ) —— */
      .topbar {
        border-bottom: 1px solid #f0f2f5;
      }

      .topbar-row {
        display: grid;
        grid-template-columns: 120px 1fr auto;
        align-items: center;
        gap: 1.25rem;
        min-height: 72px;
      }

      .logo-box {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100px;
        height: 40px;
        border: 1px dashed #c5c9d0;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #8b939e;
        background: #fafafa;
      }

      .logo-box.sm {
        width: 88px;
        height: 36px;
        margin-bottom: 0.75rem;
      }

      .search-form {
        position: relative;
        max-width: 520px;
        width: 100%;
        margin: 0 auto;
        justify-self: center;
      }

      .search-form svg {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        width: 18px;
        height: 18px;
        color: #8b939e;
      }

      .search-form input {
        width: 100%;
        padding: 0.65rem 1rem 0.65rem 2.75rem;
        border: 1px solid #e4e7ec;
        border-radius: 999px;
        font-size: 0.875rem;
        background: #fafafa;
        color: #1a1d21;
      }

      .search-form input:focus {
        outline: none;
        border-color: #9ca3af;
        background: #fff;
      }

      .topbar-actions {
        display: flex;
        align-items: center;
        gap: 1.25rem;
      }

      .action-link {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.2rem;
        font-size: 0.6875rem;
        font-weight: 500;
        color: #4b5563;
        position: relative;
      }

      .action-link svg {
        width: 22px;
        height: 22px;
      }

      .action-link:hover {
        color: #1a1d21;
      }

      .cart-badge {
        position: absolute;
        top: -4px;
        right: -6px;
        min-width: 16px;
        height: 16px;
        padding: 0 4px;
        border-radius: 999px;
        background: #1a1d21;
        color: #fff;
        font-size: 0.625rem;
        font-style: normal;
        font-weight: 700;
        display: grid;
        place-items: center;
      }

      .main-nav {
        background: #fff;
      }

      .nav-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.15rem;
        min-height: 48px;
      }

      .nav-link {
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
        padding: 0.75rem 1.1rem;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        color: #4b5563;
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;
      }

      .nav-link svg {
        width: 12px;
        height: 12px;
      }

      .nav-link:hover,
      .nav-link.active {
        color: #1a1d21;
        border-bottom-color: #1a1d21;
      }

      .search-bar {
        border-top: 1px solid #eee;
        padding: 0.65rem 0;
        background: #fafafa;
      }

      .search-form-popup {
        display: flex;
        gap: 0.5rem;
        max-width: 480px;
        margin: 0 auto;
      }

      .search-form-popup input {
        flex: 1;
        padding: 0.5rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 0.875rem;
      }

      .search-form-popup button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        background: #1a1d21;
        color: #fff;
        font-size: 0.8125rem;
        font-weight: 600;
        cursor: pointer;
      }

      .store-main {
        flex: 1;
      }

      .site-footer {
        background: #ebebeb;
        border-top: 1px solid #ddd;
      }

      .footer-grid {
        display: grid;
        grid-template-columns: 1.4fr repeat(4, 1fr);
        gap: 2rem;
        padding: 2.5rem 1.25rem 2rem;
      }

      .footer-grid--contact {
        grid-template-columns: 1.35fr repeat(4, 1fr);
      }

      .footer-brand p,
      .footer-about p {
        margin: 0.75rem 0 1rem;
        font-size: 0.8125rem;
        line-height: 1.6;
        color: #6b7280;
        max-width: 32ch;
      }

      .footer-brand-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0;
      }

      .social {
        display: flex;
        gap: 0.5rem;
      }

      .social a {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 1px solid #d1d5db;
        background: #fff;
        display: grid;
        place-items: center;
        font-size: 0.625rem;
        font-weight: 700;
        color: #6b7280;
      }

      .social a:hover {
        color: #1a1d21;
        border-color: #9ca3af;
      }

      .footer-col h4 {
        margin: 0 0 0.85rem;
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        color: #1a1d21;
      }

      .footer-col ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .footer-col li {
        margin-bottom: 0.45rem;
      }

      .footer-col a,
      .contact-list li {
        font-size: 0.8125rem;
        color: #6b7280;
        line-height: 1.45;
      }

      .footer-col a:hover {
        color: #1a1d21;
      }

      .newsletter p {
        margin: 0 0 0.65rem;
        font-size: 0.8125rem;
        color: #6b7280;
        line-height: 1.5;
      }

      .newsletter-form {
        display: flex;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        overflow: hidden;
        background: #fff;
      }

      .newsletter-form input {
        flex: 1;
        min-width: 0;
        padding: 0.55rem 0.65rem;
        border: none;
        font-size: 0.8125rem;
        background: transparent;
      }

      .newsletter-form input:focus {
        outline: none;
      }

      .newsletter-form button {
        display: grid;
        place-items: center;
        width: 44px;
        border: none;
        border-left: 1px solid #e5e7eb;
        background: #1a1d21;
        color: #fff;
        cursor: pointer;
      }

      .newsletter-form button svg {
        width: 16px;
        height: 16px;
      }

      .footer-bottom {
        border-top: 1px solid #d8d8d8;
        background: #e3e3e3;
      }

      .footer-bottom--center {
        padding: 1rem 1.25rem;
        text-align: center;
      }

      .footer-bottom--center p {
        margin: 0;
        font-size: 0.75rem;
        color: #9ca3af;
      }

      .footer-bottom-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.85rem 1.25rem;
        flex-wrap: wrap;
      }

      .footer-bottom-row p {
        margin: 0;
        font-size: 0.75rem;
        color: #8b939e;
      }

      .payments {
        display: flex;
        gap: 0.5rem;
      }

      .payments span {
        padding: 0.25rem 0.5rem;
        border: 1px solid #e4e7ec;
        border-radius: 4px;
        background: #fff;
        font-size: 0.625rem;
        font-weight: 700;
        color: #8b939e;
      }

      .menu-toggle,
      .menu-toggle-compact {
        display: none;
        place-items: center;
        width: 40px;
        height: 40px;
        border: none;
        background: transparent;
        color: #374151;
        cursor: pointer;
        border-radius: 4px;
        flex-shrink: 0;
      }

      .menu-toggle svg,
      .menu-toggle-compact svg {
        width: 22px;
        height: 22px;
      }

      .menu-toggle:hover,
      .menu-toggle-compact:hover {
        background: #f3f4f6;
      }

      .mobile-overlay {
        position: fixed;
        inset: 0;
        z-index: 90;
        background: rgba(0, 0, 0, 0.4);
      }

      .mobile-drawer {
        position: fixed;
        top: 0;
        right: 0;
        z-index: 100;
        width: min(300px, 88vw);
        height: 100%;
        background: #fff;
        box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
        padding: 1.25rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        overflow-y: auto;
      }

      .mobile-drawer a {
        padding: 0.75rem 0.85rem;
        border-radius: 6px;
        font-size: 0.9375rem;
        font-weight: 500;
        color: #4b5563;
        text-decoration: none;
      }

      .mobile-drawer a:hover,
      .mobile-drawer a.active {
        background: #f3f4f6;
        color: #1a1d21;
      }

      @media (max-width: 1024px) {
        .menu-toggle,
        .menu-toggle-compact {
          display: grid;
        }

        .desktop-nav,
        .desktop-nav-compact {
          display: none !important;
        }

        .header-compact {
          grid-template-columns: auto auto 1fr;
          align-items: center;
          gap: 0.75rem;
        }

        .menu-toggle-compact {
          order: 1;
        }

        .brand {
          order: 2;
        }

        .header-icons {
          order: 3;
          justify-self: end;
        }

        .topbar-row {
          grid-template-columns: auto auto 1fr;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 0;
        }

        .menu-toggle {
          order: 1;
        }

        .logo-wrap {
          order: 2;
        }

        .topbar-actions {
          order: 3;
          justify-self: end;
          gap: 0.35rem;
        }

        .search-form {
          display: none !important;
        }

        .footer-grid,
        .footer-grid--contact {
          grid-template-columns: 1fr 1fr;
        }
      }

      .mobile-search-form {
        position: relative;
        margin-bottom: 1rem;
        padding: 0 0.5rem;
      }

      .mobile-search-form svg {
        position: absolute;
        left: 1.25rem;
        top: 50%;
        transform: translateY(-50%);
        width: 16px;
        height: 16px;
        color: #8b939e;
      }

      .mobile-search-form input {
        width: 100%;
        padding: 0.55rem 1rem 0.55rem 2.25rem;
        border: 1px solid #e4e7ec;
        border-radius: 999px;
        font-size: 0.8125rem;
        background: #fafafa;
        color: #1a1d21;
      }

      .mobile-search-form input:focus {
        outline: none;
        border-color: #9ca3af;
        background: #fff;
      }

      @media (max-width: 640px) {
        .action-link span {
          display: none;
        }

        .footer-grid,
        .footer-grid--contact {
          grid-template-columns: 1fr;
        }

        .footer-bottom-row {
          flex-direction: column;
          text-align: center;
        }

        .payments {
          flex-wrap: wrap;
          justify-content: center;
        }
      }
    `
  ]
})
export class StoreLayoutComponent {
  private readonly router = inject(Router);
  readonly cart = inject(CartService);
  readonly favorites = inject(FavoritesService);
  readonly storeAuth = inject(StoreAuthService);

  cartCount = () => this.cart.cartItems().reduce((s, i) => s + i.quantity, 0);

  readonly year = new Date().getFullYear();
  readonly searchQuery = signal('');
  readonly searchOpen = signal(false);
  readonly mobileNavOpen = signal(false);
  readonly compactLayout = signal(this.isContactRoute(this.router.url));
  readonly isHomePage = signal(this.isHomeRoute(this.router.url));

  searchQueryModel = '';
  newsletterEmail = '';

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.compactLayout.set(this.isContactRoute(this.router.url));
      this.isHomePage.set(this.isHomeRoute(this.router.url));
      this.searchOpen.set(false);
      this.mobileNavOpen.set(false);
    });
  }

  private isHomeRoute(url: string): boolean {
    const path = url.split('?')[0];
    return path === '/' || path === '';
  }

  toggleMobileNav(): void {
    this.mobileNavOpen.update((v) => !v);
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  private isContactRoute(url: string): boolean {
    return url === '/lien-he' || url.startsWith('/lien-he?');
  }

  toggleSearch(): void {
    this.searchOpen.update((v) => !v);
  }

  onSearch(event: Event): void {
    event.preventDefault();
    const q = (this.searchQueryModel || this.searchQuery()).trim();
    if (q) {
      window.location.href = '/san-pham';
    }
    this.searchOpen.set(false);
  }

  onNewsletter(event: Event): void {
    event.preventDefault();
    if (this.newsletterEmail.trim()) {
      this.newsletterEmail = '';
    }
  }
}
