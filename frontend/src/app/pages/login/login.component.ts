import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

const REMEMBER_KEY = 'admin_remember_email';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-page">
      <!-- Decorative Background Blurs -->
      <div class="bg-blur bg-blur-1"></div>
      <div class="bg-blur bg-blur-2"></div>

      <aside class="login-aside">
        <div class="aside-glow"></div>
        <div class="brand">
          <div class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M4 19V9l8-5 8 5v10" />
              <path d="M9 19v-6h6v6" />
            </svg>
          </div>
          <div class="brand-text">
            <span class="brand-name">MỘC HOME</span>
            <span class="brand-sub">HỆ THỐNG QUẢN TRỊ</span>
          </div>
        </div>

        <div class="aside-content">
          <h2 class="aside-title">Quản trị tối ưu,<br>vận hành thông suốt</h2>
          <p class="aside-lead">
            Hệ thống quản lý nội thất thông minh tích hợp biểu đồ doanh thu, điều phối đơn hàng và quản trị sản phẩm thời gian thực.
          </p>
        </div>

        <ul class="feature-list">
          <li>
            <span class="feature-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="9" rx="1"/>
                <rect x="14" y="3" width="7" height="5" rx="1"/>
                <rect x="14" y="12" width="7" height="9" rx="1"/>
                <rect x="3" y="16" width="7" height="5" rx="1"/>
              </svg>
            </span>
            <div>
              <strong>Báo cáo trực quan</strong>
              <span>Biểu đồ tăng trưởng, doanh thu và tồn kho tức thời.</span>
            </div>
          </li>
          <li>
            <span class="feature-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              </svg>
            </span>
            <div>
              <strong>Kho hàng thông minh</strong>
              <span>Tự động cập nhật số lượng, thuộc tính và biến thể sản phẩm.</span>
            </div>
          </li>
          <li>
            <span class="feature-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
              </svg>
            </span>
            <div>
              <strong>Xử lý đơn tốc hành</strong>
              <span>Hệ thống chuyển trạng thái đơn hàng tự động hóa.</span>
            </div>
          </li>
        </ul>

        <div class="aside-stats">
          <div class="stat-chip">
            <span class="stat-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14 9 11" />
              </svg>
            </span>
            <div class="stat-info">
              <span class="stat-label">Hệ thống</span>
              <span class="stat-value">Ổn định</span>
            </div>
          </div>
          <div class="stat-chip">
            <span class="stat-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <div class="stat-info">
              <span class="stat-label">Bảo mật</span>
              <span class="stat-value">SSL 256-bit</span>
            </div>
          </div>
        </div>
      </aside>

      <main class="login-main">
        <div class="login-card">
          <header class="card-head">
            <h1 class="page-title">Chào mừng trở lại</h1>
            <p class="muted">Truy cập cổng thông tin quản trị Mộc Home</p>
          </header>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form" novalidate>
            <div class="field">
              <label for="email">Tài khoản Email</label>
              <div class="input-wrap">
                <span class="field-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                    <path d="M4 6h16v12H4z" />
                    <path d="M4 7l8 6 8-6" />
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  placeholder="admin@furniture.com"
                  autocomplete="username"
                  [class.input-invalid]="form.controls.email.touched && form.controls.email.invalid"
                />
              </div>
              @if (form.controls.email.touched && form.controls.email.invalid) {
                <span class="field-error">Địa chỉ Email không hợp lệ</span>
              }
            </div>

            <div class="field">
              <label for="password">Mật khẩu bảo mật</label>
              <div class="input-wrap">
                <span class="field-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V8a4 4 0 118 0v3" />
                  </svg>
                </span>
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  [class.input-invalid]="form.controls.password.touched && form.controls.password.invalid"
                />
                <button
                  type="button"
                  class="toggle-pw"
                  (click)="showPassword.set(!showPassword())"
                  [attr.aria-label]="showPassword() ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                >
                  @if (showPassword()) {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <path d="M1 1l22 22" />
                    </svg>
                  } @else {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  }
                </button>
              </div>
              @if (form.controls.password.touched && form.controls.password.invalid) {
                <span class="field-error">Vui lòng nhập mật khẩu</span>
              }
            </div>

            <div class="form-row">
              <label class="checkbox">
                <input type="checkbox" [checked]="remember()" (change)="onRememberChange($event)" />
                <span class="chk-label">Ghi nhớ đăng nhập</span>
              </label>
            </div>

            @if (error()) {
              <div class="alert-error" role="alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{{ error() }}</span>
              </div>
            }

            <button class="btn-submit" type="submit" [disabled]="loading()">
              @if (loading()) {
                <span class="spinner" aria-hidden="true"></span>
                <span>Đang xác thực...</span>
              } @else {
                <span>Đăng nhập hệ thống</span>
              }
            </button>
          </form>

          <div class="demo-panel">
            <div class="demo-head">
              <span class="demo-tag">Tài khoản dùng thử</span>
              <button type="button" class="demo-fill" (click)="fillDemo()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="fill-ico">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
                Điền nhanh
              </button>
            </div>
            <div class="demo-account-info">
              <div class="demo-field-box">
                <span class="lbl">Email:</span>
                <code>admin&#64;furniture.com</code>
              </div>
              <div class="demo-field-box">
                <span class="lbl">Mật khẩu:</span>
                <code>Admin&#64;123</code>
              </div>
            </div>
          </div>
        </div>

        <p class="login-footer">
          <a routerLink="/" class="back-home">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="arrow-ico">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Về trang chủ
          </a>
          <span class="footer-sep">·</span>
          <span class="copyright">© Mộc Home</span>
        </p>
      </main>
    </div>
  `,
  styles: [
    `
      .login-page {
        min-height: 100vh;
        display: grid;
        grid-template-columns: minmax(360px, 460px) 1fr;
        background-color: #faf6f2;
        position: relative;
        overflow: hidden;
      }

      /* Decorative Background Blurs */
      .bg-blur {
        position: absolute;
        border-radius: 50%;
        filter: blur(120px);
        z-index: 1;
        opacity: 0.5;
        pointer-events: none;
      }
      .bg-blur-1 {
        width: 450px;
        height: 450px;
        background: rgba(229, 192, 123, 0.2);
        left: 20%;
        top: -100px;
      }
      .bg-blur-2 {
        width: 550px;
        height: 550px;
        background: rgba(140, 98, 57, 0.15);
        right: -100px;
        bottom: -150px;
      }

      .login-aside {
        background-color: #2b1d14;
        background-image: 
          radial-gradient(circle at 0% 0%, rgba(229, 192, 123, 0.18) 0%, transparent 60%),
          radial-gradient(circle at 100% 100%, rgba(229, 192, 123, 0.1) 0%, transparent 75%),
          linear-gradient(135deg, #1b120c 0%, #2b1d14 50%, #463124 100%);
        color: #ffffff;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 3.5rem 3rem;
        border-right: 1px solid rgba(229, 192, 123, 0.1);
        z-index: 2;
      }

      .aside-glow {
        position: absolute;
        width: 300px;
        height: 300px;
        background: radial-gradient(circle, rgba(229, 192, 123, 0.08) 0%, transparent 70%);
        top: 20%;
        right: -150px;
        pointer-events: none;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 0.85rem;
      }

      .brand-mark {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%);
        border: 1px solid rgba(229, 192, 123, 0.35);
        color: #e5c07b;
        display: grid;
        place-items: center;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        transition: all 0.3s ease;
      }

      .brand:hover .brand-mark {
        border-color: #e5c07b;
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(229, 192, 123, 0.2);
      }

      .brand-mark svg {
        width: 22px;
        height: 22px;
      }

      .brand-text {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }

      .brand-name {
        font-size: 1.1rem;
        font-weight: 800;
        letter-spacing: 0.08em;
      }

      .brand-sub {
        font-size: 0.65rem;
        font-weight: 600;
        letter-spacing: 0.12em;
        color: #e5c07b;
      }

      .aside-content {
        margin: 2.5rem 0;
      }

      .aside-title {
        font-size: 2rem;
        font-weight: 800;
        line-height: 1.3;
        margin: 0 0 1rem;
        letter-spacing: -0.02em;
        color: #ffffff;
      }

      .aside-lead {
        font-size: 0.875rem;
        line-height: 1.6;
        color: rgba(255, 255, 255, 0.75);
        margin: 0;
      }

      .feature-list {
        list-style: none;
        padding: 0;
        margin: 0 0 auto;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .feature-list li {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
        transition: all 0.3s ease;
      }

      .feature-list li:hover {
        transform: translateX(4px);
      }

      .feature-ico {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: rgba(229, 192, 123, 0.08);
        border: 1px solid rgba(229, 192, 123, 0.2);
        color: #e5c07b;
        display: grid;
        place-items: center;
        flex-shrink: 0;
        transition: all 0.3s ease;
      }

      .feature-list li:hover .feature-ico {
        background: rgba(229, 192, 123, 0.16);
        border-color: #e5c07b;
        color: #ffffff;
        box-shadow: 0 0 12px rgba(229, 192, 123, 0.25);
      }

      .feature-ico svg {
        width: 20px;
        height: 20px;
      }

      .feature-list strong {
        display: block;
        font-size: 0.875rem;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 0.2rem;
      }

      .feature-list span {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.6);
        line-height: 1.4;
      }

      .aside-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-top: 3rem;
        padding-top: 1.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .stat-chip {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        backdrop-filter: blur(10px);
      }

      .stat-ico {
        color: #e5c07b;
        display: flex;
        flex-shrink: 0;
      }

      .stat-ico svg {
        width: 16px;
        height: 16px;
      }

      .stat-info {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }

      .stat-label {
        font-size: 0.65rem;
        color: rgba(255, 255, 255, 0.45);
        font-weight: 500;
      }

      .stat-value {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #ffffff;
      }

      .login-main {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 2rem;
        z-index: 2;
        position: relative;
      }

      .login-card {
        width: 100%;
        max-width: 440px;
        padding: 3rem 2.75rem;
        background-color: #ffffff;
        border-radius: 20px;
        box-shadow: 
          0 20px 40px -15px rgba(62, 42, 30, 0.08),
          0 10px 20px -10px rgba(62, 42, 30, 0.04),
          0 0 0 1px rgba(92, 64, 51, 0.03);
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .card-head {
        border-left: 3px solid #8c6239;
        padding-left: 1rem;
      }

      .card-head .page-title {
        font-size: 1.5rem;
        font-weight: 800;
        color: #2b1d14;
        margin: 0 0 0.25rem;
        letter-spacing: -0.01em;
      }

      .card-head .muted {
        font-size: 0.8125rem;
        color: #8c8175;
        margin: 0;
      }

      .login-form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
      }

      .field label {
        font-size: 0.8125rem;
        font-weight: 700;
        color: #5c524a;
      }

      .input-wrap {
        position: relative;
      }

      .field-ico {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: #a89a8e;
        display: flex;
        pointer-events: none;
        transition: color 0.2s ease;
      }

      .field-ico svg {
        width: 18px;
        height: 18px;
      }

      .input-wrap input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 2.75rem;
        border: 1.5px solid #ebdcd0;
        border-radius: 10px;
        font-size: 0.875rem;
        background-color: #ffffff;
        color: #2b1d14;
        transition: all 0.25s ease;
      }

      .input-wrap input::placeholder {
        color: #bfaea0;
      }

      .input-wrap input:focus {
        outline: none;
        border-color: #8c6239;
        box-shadow: 0 0 0 4px rgba(140, 98, 57, 0.08);
      }

      .input-wrap:focus-within .field-ico {
        color: #8c6239;
      }

      .input-wrap input.input-invalid {
        border-color: #fca5a5;
        background-color: #fffaf9;
      }

      .toggle-pw {
        position: absolute;
        right: 0.6rem;
        top: 50%;
        transform: translateY(-50%);
        width: 32px;
        height: 32px;
        border: none;
        background: none;
        color: #a89a8e;
        cursor: pointer;
        display: grid;
        place-items: center;
        border-radius: 8px;
        transition: all 0.2s ease;
      }

      .toggle-pw:hover {
        color: #8c6239;
        background-color: #faf6f2;
      }

      .toggle-pw svg {
        width: 18px;
        height: 18px;
      }

      .field-error {
        font-size: 0.75rem;
        color: #dc2626;
        font-weight: 500;
        margin-top: 0.1rem;
      }

      .form-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .checkbox {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        user-select: none;
      }

      .checkbox input {
        width: 16px;
        height: 16px;
        accent-color: #8c6239;
        cursor: pointer;
      }

      .chk-label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #7a6e65;
      }

      .alert-error {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 10px;
        background: #fff5f5;
        border: 1px solid #feb2b2;
        color: #c53030;
        font-size: 0.8125rem;
        line-height: 1.4;
      }

      .alert-error svg {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        color: #e53e3e;
      }

      .btn-submit {
        width: 100%;
        padding: 0.8rem 1.5rem;
        border-radius: 10px;
        border: none;
        background: linear-gradient(135deg, #8c6239 0%, #5c4033 100%);
        color: #ffffff;
        font-size: 0.875rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        box-shadow: 0 4px 15px rgba(92, 64, 51, 0.15);
        transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      .btn-submit:hover:not(:disabled) {
        background: linear-gradient(135deg, #a07246 0%, #6e4c3d 100%);
        box-shadow: 0 8px 20px rgba(92, 64, 51, 0.25);
        transform: translateY(-1px);
      }

      .btn-submit:active:not(:disabled) {
        transform: translateY(0) scale(0.98);
      }

      .btn-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .spinner {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(255, 255, 255, 0.35);
        border-top-color: #ffffff;
        border-radius: 50%;
        animation: spin 0.75s linear infinite;
      }

      .demo-panel {
        padding: 1rem 1.25rem;
        border-radius: 12px;
        background: #fdfaf6;
        border: 1.5px dashed #ebdcd0;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .demo-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .demo-tag {
        font-size: 0.75rem;
        font-weight: 700;
        color: #8c8175;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .demo-fill {
        padding: 0.3rem 0.65rem;
        border: 1px solid #c29c68;
        border-radius: 6px;
        background: #ffffff;
        font-size: 0.75rem;
        font-weight: 700;
        color: #8c6239;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        transition: all 0.2s ease;
      }

      .demo-fill:hover {
        background-color: #faf6f2;
        color: #5c4033;
      }

      .fill-ico {
        width: 12px;
        height: 12px;
      }

      .demo-account-info {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .demo-field-box {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
      }

      .demo-field-box .lbl {
        color: #8c8175;
        font-weight: 600;
        min-width: 70px;
      }

      .demo-field-box code {
        font-size: 0.8125rem;
        font-family: ui-monospace, 'Cascadia Code', monospace;
        color: #2b1d14;
        background: #f5efe8;
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
        font-weight: 600;
      }

      .login-footer {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        font-size: 0.8125rem;
        color: #8c8175;
        margin-top: 1.5rem;
      }

      .back-home {
        font-weight: 700;
        color: #8c6239;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        transition: color 0.2s ease;
      }

      .back-home:hover {
        color: #5c4033;
      }

      .arrow-ico {
        width: 14px;
        height: 14px;
      }

      .footer-sep {
        color: #ebdcd0;
      }

      .copyright {
        font-weight: 500;
      }

      @media (max-width: 900px) {
        .login-page {
          grid-template-columns: 1fr;
          min-height: auto;
        }

        .login-aside {
          border-right: none;
          border-bottom: 1px solid rgba(229, 192, 123, 0.1);
          padding: 2.5rem 2rem;
          gap: 2rem;
        }

        .aside-stats {
          display: none;
        }

        .aside-title {
          font-size: 1.625rem;
        }

        .feature-list {
          margin-bottom: 0;
        }
      }

      @media (max-width: 480px) {
        .login-main {
          padding: 1.5rem 1rem;
        }

        .login-card {
          padding: 2rem 1.5rem;
        }
      }
    `
  ]
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);
  readonly remember = signal(true);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  ngOnInit(): void {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      this.form.patchValue({ email: saved });
      this.remember.set(true);
    }
  }

  onRememberChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.remember.set(checked);
    if (!checked) {
      localStorage.removeItem(REMEMBER_KEY);
    }
  }

  fillDemo(): void {
    this.form.patchValue({
      email: 'admin@furniture.com',
      password: 'Admin@123'
    });
    this.error.set('');
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set('Vui lòng nhập đầy đủ thông tin hợp lệ.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const { email, password } = this.form.getRawValue();
    this.authService.login(email!, password!).subscribe({
      next: () => {
        if (this.remember()) {
          localStorage.setItem(REMEMBER_KEY, email!);
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Đăng nhập thất bại. Kiểm tra email và mật khẩu.');
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }
}
