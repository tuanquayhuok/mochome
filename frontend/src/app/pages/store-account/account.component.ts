import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StoreAuthService, StoreUser } from '../../core/services/store-auth.service';
import { StoreProfileService } from '../../core/services/store-profile.service';
import { StoreAccountDashboardComponent } from './store-account-dashboard.component';

declare const google: any;

type AuthTab = 'login' | 'register';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (!confirm) return null;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-store-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, StoreAccountDashboardComponent],
  template: `
    <div class="store-page account-page">
      <!-- Decorative Background Blurs -->
      <div class="bg-blur bg-blur-1"></div>
      <div class="bg-blur bg-blur-2"></div>

      <div class="store-container store-container--account">
        @if (user()) {
          <div class="page-head">
            <h1>Tài khoản của tôi</h1>
            <p>Xin chào, {{ user()!.fullName }}</p>
          </div>
          <app-store-account-dashboard
            [user]="user()!"
            (userChange)="onUserUpdated($event)"
            (logout)="logout()"
          />
        } @else {
          @if (checkoutReturn()) {
            <div class="return-banner-wrap">
              <p class="return-banner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="banner-ico">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                  <path d="M12 8v4"/>
                  <path d="M12 16h.01"/>
                </svg>
                <span>Đăng nhập để tiếp tục thanh toán đơn hàng của bạn.</span>
              </p>
            </div>
          }

          @if (activationNotice()) {
            <div class="return-banner-wrap">
              <p class="return-banner return-banner--success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="banner-ico">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span>{{ activationNotice() }}</span>
              </p>
            </div>
          }

          <div class="auth-shell">
            <aside class="auth-aside">
              <div class="auth-aside-inner">
                <a routerLink="/" class="auth-brand">
                  <span class="auth-brand-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M4 19V9l8-5 8 5v10" />
                      <path d="M9 19v-6h6v6" />
                    </svg>
                  </span>
                  <span class="auth-brand-text">
                    <span class="auth-brand-name">MỘC HOME</span>
                    <span class="auth-brand-tag">Nội thất hiện đại</span>
                  </span>
                </a>

                <div class="auth-aside-content">
                  <h2 class="auth-aside-title">Không gian sống đẳng cấp bắt đầu từ đây</h2>
                  <p class="auth-aside-lead">
                    Đăng nhập hoặc tạo tài khoản để theo dõi đơn hàng, lưu yêu thích và tích điểm thành viên.
                  </p>
                </div>

                <ul class="auth-perks">
                  <li>
                    <span class="perk-ico">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                        <path d="M3.3 7.7L12 12l8.7-4.3M12 22V12"/>
                      </svg>
                    </span>
                    <div class="perk-text">
                      <strong>Theo dõi đơn hàng</strong>
                      <span>Cập nhật trạng thái giao hàng theo thời gian thực</span>
                    </div>
                  </li>
                  <li>
                    <span class="perk-ico">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </span>
                    <div class="perk-text">
                      <strong>Tích điểm thành viên</strong>
                      <span>Nhận ưu đãi độc quyền cho khách hàng thân thiết</span>
                    </div>
                  </li>
                  <li>
                    <span class="perk-ico">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                      </svg>
                    </span>
                    <div class="perk-text">
                      <strong>Danh sách yêu thích</strong>
                      <span>Lưu sản phẩm bạn thích để mua sau</span>
                    </div>
                  </li>
                </ul>
              </div>
            </aside>

            <div class="auth-main">
              <div class="auth-card">
                <div class="auth-tabs-container">
                  <div class="auth-tabs">
                    <button
                      type="button"
                      class="auth-tab"
                      [class.active]="authTab() === 'login'"
                      (click)="setTab('login')"
                    >
                      Đăng nhập
                    </button>
                    <button
                      type="button"
                      class="auth-tab"
                      [class.active]="authTab() === 'register'"
                      (click)="setTab('register')"
                    >
                      Đăng ký
                    </button>
                  </div>
                </div>

                @if (authTab() === 'login') {
                  <form [formGroup]="loginForm" (ngSubmit)="submitLogin()" class="auth-form" novalidate>
                    <header class="auth-form-head">
                      <h1>Chào mừng trở lại</h1>
                      <p>Đăng nhập để tiếp tục mua sắm cùng Mộc Home</p>
                    </header>

                    <div class="store-field">
                      <label for="login-email">Địa chỉ Email</label>
                      <div class="input-wrap">
                        <span class="field-ico" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                            <path d="M4 6h16v12H4z" />
                            <path d="M4 7l8 6 8-6" />
                          </svg>
                        </span>
                        <input
                          id="login-email"
                          type="email"
                          formControlName="email"
                          placeholder="email@example.com"
                          autocomplete="username"
                          [class.input-invalid]="loginForm.controls.email.touched && loginForm.controls.email.invalid"
                        />
                      </div>
                      @if (loginForm.controls.email.touched && loginForm.controls.email.hasError('required')) {
                        <span class="field-error">Vui lòng nhập email.</span>
                      } @else if (loginForm.controls.email.touched && loginForm.controls.email.hasError('email')) {
                        <span class="field-error">Email không hợp lệ.</span>
                      }
                    </div>

                    <div class="store-field">
                      <div class="label-row">
                        <label for="login-password">Mật khẩu</label>
                      </div>
                      <div class="input-wrap password-input-wrap">
                        <span class="field-ico" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                            <rect x="5" y="11" width="14" height="10" rx="2" />
                            <path d="M8 11V8a4 4 0 118 0v3" />
                          </svg>
                        </span>
                        <input
                          id="login-password"
                          [type]="showLoginPassword() ? 'text' : 'password'"
                          formControlName="password"
                          placeholder="••••••••"
                          autocomplete="current-password"
                          [class.input-invalid]="loginForm.controls.password.touched && loginForm.controls.password.invalid"
                        />
                        <button
                          type="button"
                          class="pw-toggle"
                          (click)="showLoginPassword.set(!showLoginPassword())"
                          [attr.aria-label]="showLoginPassword() ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                        >
                          @if (showLoginPassword()) {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                              <path d="M1 1l22 22" />
                            </svg>
                          } @else {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          }
                        </button>
                      </div>
                      @if (loginForm.controls.password.touched && loginForm.controls.password.invalid) {
                        <span class="field-error">Vui lòng nhập mật khẩu.</span>
                      }
                    </div>

                    <!-- Captcha Verification -->
                    <div class="store-field captcha-field">
                      <div class="captcha-box" [class.captcha-checked]="loginCaptchaState() === 'checked'" [class.captcha-invalid]="loginForm.controls.captcha.touched && loginForm.controls.captcha.invalid">
                        <button type="button" class="captcha-checkbox-btn" (click)="toggleLoginCaptcha()" [disabled]="loginCaptchaState() !== 'unchecked'">
                          @if (loginCaptchaState() === 'unchecked') {
                            <span class="captcha-checkbox-square"></span>
                          } @else if (loginCaptchaState() === 'checking') {
                            <span class="captcha-checkbox-spinner"></span>
                          } @else if (loginCaptchaState() === 'checked') {
                            <span class="captcha-checkbox-checked">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            </span>
                          }
                        </button>
                        <span class="captcha-label" (click)="toggleLoginCaptcha()">Tôi không phải là người máy</span>
                        <div class="captcha-brand">
                          <svg class="captcha-brand-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                            <path d="M2 12h20"/>
                          </svg>
                          <span class="captcha-brand-text">reCAPTCHA</span>
                          <span class="captcha-links">Bảo mật - Điều khoản</span>
                        </div>
                      </div>
                      @if (loginForm.controls.captcha.touched && loginForm.controls.captcha.invalid) {
                        <span class="field-error">Vui lòng xác nhận bạn không phải robot.</span>
                      }
                    </div>

                    @if (error()) {
                      <div class="store-alert-error" role="alert">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-ico">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <span>{{ error() }}</span>
                      </div>
                    }

                    <button type="submit" class="store-btn store-btn-primary auth-submit" [disabled]="loading()">
                      @if (loading()) {
                        <span class="spinner" aria-hidden="true"></span>
                        <span>Đang đăng nhập...</span>
                      } @else {
                        <span>Đăng nhập</span>
                      }
                    </button>

                    <div class="oauth-divider-wrap">
                      <span class="oauth-line"></span>
                      <span class="oauth-text">Hoặc đăng nhập bằng</span>
                      <span class="oauth-line"></span>
                    </div>

                    <div class="oauth-buttons">
                      <button type="button" class="oauth-btn oauth-btn-google" (click)="loginWithGoogle()" [disabled]="loading()">
                        <svg viewBox="0 0 24 24" class="oauth-ico" aria-hidden="true">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                        </svg>
                        <span>Google</span>
                      </button>
                      <button type="button" class="oauth-btn oauth-btn-tiktok" (click)="loginWithTikTok()" [disabled]="loading()">
                        <svg viewBox="0 0 24 24" class="oauth-ico" aria-hidden="true" fill="currentColor">
                          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.97 1.14 2.29 1.88 3.73 2.15v3.9c-1.39-.08-2.74-.61-3.85-1.5-.68-.54-1.24-1.21-1.62-1.99v6.86c.04 1.4-.29 2.82-1.01 4.04-.97 1.68-2.64 2.87-4.56 3.23-1.63.31-3.35.1-4.85-.62-1.87-.89-3.27-2.65-3.77-4.69-.58-2.29-.02-4.81 1.46-6.66 1.34-1.7 3.46-2.68 5.63-2.65.25.01.5.03.74.06v3.97c-.7-.22-1.47-.23-2.18-.01-1.12.33-2.02 1.21-2.38 2.31-.38 1.1-.19 2.34.48 3.28.66.96 1.81 1.51 2.98 1.44 1.29-.03 2.45-.88 2.88-2.11.16-.47.22-.96.22-1.46V0h.01z"/>
                        </svg>
                        <span>TikTok</span>
                      </button>
                    </div>

                    <div class="auth-links-row">
                      <button type="button" class="link-btn" (click)="forgotOpen.set(true)">Quên mật khẩu?</button>
                      <span class="auth-divider">|</span>
                      <button type="button" class="link-btn" (click)="setTab('register')">Đăng ký ngay</button>
                    </div>

                    @if (forgotOpen()) {
                      <div class="forgot-box">
                        <p class="forgot-title">Khôi phục mật khẩu</p>
                        <p class="forgot-desc">Nhập thông tin tài khoản của bạn để khôi phục mật khẩu.</p>
                        
                        <div class="forgot-input-group">
                          <input
                            type="email"
                            [formControl]="forgotEmailControl"
                            placeholder="Email đã đăng ký"
                            class="forgot-input"
                          />
                          <input
                            type="tel"
                            [formControl]="forgotPhoneControl"
                            placeholder="Số điện thoại"
                            class="forgot-input"
                          />
                        </div>

                        <div class="forgot-actions">
                          <button type="button" class="store-btn store-btn-primary" (click)="submitForgotLogin()" [disabled]="forgotLoading()">
                            {{ forgotLoading() ? 'Đang gửi...' : 'Gửi yêu cầu' }}
                          </button>
                          <button type="button" class="forgot-close-btn" (click)="forgotOpen.set(false)">Đóng</button>
                        </div>
                        @if (forgotMsg()) {
                          <p class="forgot-result">{{ forgotMsg() }}</p>
                        }
                        @if (forgotDevHint()) {
                          <p class="forgot-dev">{{ forgotDevHint() }}</p>
                        }
                      </div>
                    }
                  </form>
                } @else {
                  <form [formGroup]="registerForm" (ngSubmit)="submitRegister()" class="auth-form" novalidate>
                    <header class="auth-form-head">
                      <h1>Tạo tài khoản mới</h1>
                      <p>Trở thành thành viên Mộc Home để nhận nhiều ưu đãi</p>
                    </header>

                    <div class="store-field">
                      <label for="reg-name">Họ tên thành viên <em>*</em></label>
                      <div class="input-wrap">
                        <span class="field-ico" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                          </svg>
                        </span>
                        <input
                          id="reg-name"
                          type="text"
                          formControlName="fullName"
                          placeholder="Nguyễn Văn A"
                          [class.input-invalid]="registerForm.controls.fullName.touched && registerForm.controls.fullName.invalid"
                        />
                      </div>
                      @if (registerForm.controls.fullName.touched && registerForm.controls.fullName.invalid) {
                        <span class="field-error">Vui lòng nhập họ tên.</span>
                      }
                    </div>

                    <div class="store-field">
                      <label for="reg-email">Email đăng ký <em>*</em></label>
                      <div class="input-wrap email-split-wrap">
                        <span class="field-ico" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                            <path d="M4 6h16v12H4z" />
                            <path d="M4 7l8 6 8-6" />
                          </svg>
                        </span>
                        <input
                          id="reg-email"
                          type="text"
                          formControlName="email"
                          placeholder="ten-truy-cap"
                          autocomplete="username"
                          [class.input-invalid]="registerForm.controls.email.touched && registerForm.controls.email.invalid"
                        />
                        <span class="email-suffix">&#64;gmail.com</span>
                      </div>
                      @if (registerForm.controls.email.touched && registerForm.controls.email.hasError('required')) {
                        <span class="field-error">Vui lòng nhập tên email.</span>
                      } @else if (registerForm.controls.email.touched && registerForm.controls.email.invalid) {
                        <span class="field-error">Tên email không hợp lệ (chỉ gồm chữ, số, dấu chấm, gạch dưới, gạch ngang).</span>
                      }
                    </div>

                    <div class="store-field">
                      <label for="reg-password">Mật khẩu bảo mật <em>*</em></label>
                      <div class="input-wrap password-input-wrap">
                        <span class="field-ico" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                            <rect x="5" y="11" width="14" height="10" rx="2" />
                            <path d="M8 11V8a4 4 0 118 0v3" />
                          </svg>
                        </span>
                        <input
                          id="reg-password"
                          [type]="showRegisterPassword() ? 'text' : 'password'"
                          formControlName="password"
                          placeholder="Tối thiểu 6 ký tự"
                          autocomplete="new-password"
                          [class.input-invalid]="registerForm.controls.password.touched && registerForm.controls.password.invalid"
                        />
                        <button
                          type="button"
                          class="pw-toggle"
                          (click)="showRegisterPassword.set(!showRegisterPassword())"
                          [attr.aria-label]="showRegisterPassword() ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                        >
                          @if (showRegisterPassword()) {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                              <path d="M1 1l22 22" />
                            </svg>
                          } @else {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          }
                        </button>
                      </div>
                      @if (registerForm.controls.password.touched && registerForm.controls.password.hasError('required')) {
                        <span class="field-error">Vui lòng nhập mật khẩu.</span>
                      } @else if (registerForm.controls.password.touched && registerForm.controls.password.hasError('minlength')) {
                        <span class="field-error">Mật khẩu tối thiểu 6 ký tự.</span>
                      }
                    </div>

                    <div class="store-field">
                      <label for="reg-confirm">Xác nhận lại mật khẩu <em>*</em></label>
                      <div class="input-wrap password-input-wrap">
                        <span class="field-ico" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                            <rect x="5" y="11" width="14" height="10" rx="2" />
                            <path d="M8 11V8a4 4 0 118 0v3" />
                          </svg>
                        </span>
                        <input
                          id="reg-confirm"
                          [type]="showConfirmPassword() ? 'text' : 'password'"
                          formControlName="confirmPassword"
                          placeholder="Nhập lại mật khẩu khớp phía trên"
                          autocomplete="new-password"
                          [class.input-invalid]="
                            registerForm.get('confirmPassword')?.touched &&
                            (registerForm.get('confirmPassword')?.invalid || registerForm.hasError('passwordMismatch'))
                          "
                        />
                        <button
                          type="button"
                          class="pw-toggle"
                          (click)="showConfirmPassword.set(!showConfirmPassword())"
                          [attr.aria-label]="showConfirmPassword() ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                        >
                          @if (showConfirmPassword()) {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                              <path d="M1 1l22 22" />
                            </svg>
                          } @else {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          }
                        </button>
                      </div>
                      @if (
                        registerForm.get('confirmPassword')?.touched &&
                        registerForm.hasError('passwordMismatch')
                      ) {
                        <span class="field-error">Mật khẩu xác nhận không khớp.</span>
                      }
                    </div>

                    <!-- Captcha Verification -->
                    <div class="store-field captcha-field">
                      <div class="captcha-box" [class.captcha-checked]="registerCaptchaState() === 'checked'" [class.captcha-invalid]="registerForm.controls.captcha.touched && registerForm.controls.captcha.invalid">
                        <button type="button" class="captcha-checkbox-btn" (click)="toggleRegisterCaptcha()" [disabled]="registerCaptchaState() !== 'unchecked'">
                          @if (registerCaptchaState() === 'unchecked') {
                            <span class="captcha-checkbox-square"></span>
                          } @else if (registerCaptchaState() === 'checking') {
                            <span class="captcha-checkbox-spinner"></span>
                          } @else if (registerCaptchaState() === 'checked') {
                            <span class="captcha-checkbox-checked">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            </span>
                          }
                        </button>
                        <span class="captcha-label" (click)="toggleRegisterCaptcha()">Tôi không phải là người máy</span>
                        <div class="captcha-brand">
                          <svg class="captcha-brand-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                            <path d="M2 12h20"/>
                          </svg>
                          <span class="captcha-brand-text">reCAPTCHA</span>
                          <span class="captcha-links">Bảo mật - Điều khoản</span>
                        </div>
                      </div>
                      @if (registerForm.controls.captcha.touched && registerForm.controls.captcha.invalid) {
                        <span class="field-error">Vui lòng xác nhận bạn không phải robot.</span>
                      }
                    </div>

                    @if (error()) {
                      <div class="store-alert-error" role="alert">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-ico">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <span>{{ error() }}</span>
                      </div>
                    }

                    <button type="submit" class="store-btn store-btn-primary auth-submit" [disabled]="loading()">
                      @if (loading()) {
                        <span class="spinner" aria-hidden="true"></span>
                        <span>Đang tạo tài khoản...</span>
                      } @else {
                        <span>Đăng ký thành viên</span>
                      }
                    </button>

                    <p class="auth-foot">
                      Đã có tài khoản?
                      <button type="button" class="link-btn" (click)="setTab('login')">Đăng nhập ngay</button>
                    </p>
                  </form>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>

    @if (registerSuccessOpen()) {
      <div class="modal-backdrop" (click)="closeRegisterSuccess()">
        <div class="modal-panel modal-panel--sm" role="dialog" aria-labelledby="reg-success-title" (click)="$event.stopPropagation()">
          <div class="success-modal-body">
            <div class="success-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l3 3 5-6" />
              </svg>
            </div>
            <h2 id="reg-success-title">Đăng ký thành công</h2>
            <p class="success-msg">{{ registerSuccessMsg() }}</p>
            <p class="success-email">
              Email xác nhận đã gửi tới <strong>{{ registerSuccessEmail() }}</strong>
            </p>
            <button type="button" class="store-btn store-btn-primary success-btn" (click)="closeRegisterSuccess()">
              Đăng nhập ngay
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .store-page.account-page {
        background: radial-gradient(circle at 0% 0%, #fdfbf9 0%, #f5efe8 100%);
        padding: 3.5rem 0;
        min-height: calc(100vh - 120px);
        display: flex;
        align-items: center;
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
        background: rgba(229, 192, 123, 0.25);
        left: -100px;
        top: -100px;
      }
      .bg-blur-2 {
        width: 550px;
        height: 550px;
        background: rgba(140, 98, 57, 0.15);
        right: -150px;
        bottom: -150px;
      }

      .store-container--account {
        position: relative;
        z-index: 2;
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1.25rem;
      }

      .return-banner-wrap {
        margin-bottom: 2rem;
        text-align: center;
        animation: slideDown 0.3s ease;
      }

      .return-banner {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        margin: 0;
        padding: 0.8rem 1.5rem;
        border-radius: 999px;
        background: #fdfbf9;
        border: 1px solid #ebdcd0;
        color: #8c6239;
        font-weight: 600;
        font-size: 0.875rem;
        box-shadow: 0 4px 15px rgba(92, 64, 51, 0.05);
      }

      .banner-ico {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
      }

      .return-banner--success {
        background: #f0fdf4;
        border-color: #bbf7d0;
        color: #15803d;
        box-shadow: 0 4px 15px rgba(21, 128, 61, 0.05);
      }

      .auth-shell {
        display: grid;
        grid-template-columns: minmax(320px, 440px) 1fr;
        min-height: 640px;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 
          0 25px 60px -15px rgba(62, 42, 30, 0.12), 
          0 15px 30px -10px rgba(62, 42, 30, 0.06),
          0 0 0 1px rgba(92, 64, 51, 0.05);
        background: #ffffff;
      }

      .auth-aside {
        background-color: #2b1d14;
        background-image: 
          radial-gradient(circle at 0% 0%, rgba(229, 192, 123, 0.18) 0%, transparent 60%),
          radial-gradient(circle at 100% 100%, rgba(229, 192, 123, 0.1) 0%, transparent 70%),
          linear-gradient(135deg, #2b1d14 0%, #3e2a1e 50%, #563b2a 100%);
        color: #ffffff;
        position: relative;
        overflow: hidden;
        border-right: 1px solid rgba(229, 192, 123, 0.1);
      }

      .auth-aside-inner {
        position: relative;
        z-index: 2;
        padding: 3rem 2.5rem;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 3rem;
      }

      .auth-brand {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        text-decoration: none;
        color: inherit;
        align-self: flex-start;
      }

      .auth-brand-mark {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%);
        backdrop-filter: blur(10px);
        display: grid;
        place-items: center;
        border: 1px solid rgba(229, 192, 123, 0.4);
        color: #e5c07b;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
      }

      .auth-brand:hover .auth-brand-mark {
        transform: translateY(-2px);
        border-color: #e5c07b;
        box-shadow: 0 6px 20px rgba(229, 192, 123, 0.25);
      }

      .auth-brand-mark svg {
        width: 24px;
        height: 24px;
      }

      .auth-brand-text {
        display: flex;
        flex-direction: column;
        line-height: 1.15;
      }

      .auth-brand-name {
        font-size: 1.125rem;
        font-weight: 800;
        letter-spacing: 0.08em;
      }

      .auth-brand-tag {
        font-size: 0.75rem;
        color: #e5c07b;
        font-weight: 500;
        letter-spacing: 0.04em;
      }

      .auth-aside-content {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .auth-aside-title {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 700;
        line-height: 1.35;
        letter-spacing: -0.02em;
        color: #ffffff;
      }

      .auth-aside-lead {
        margin: 0;
        font-size: 0.9375rem;
        line-height: 1.6;
        color: rgba(255, 255, 255, 0.8);
      }

      .auth-perks {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .auth-perks li {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
        padding: 0.5rem;
        border-radius: 12px;
        transition: all 0.3s ease;
      }

      .auth-perks li:hover {
        background: rgba(255, 255, 255, 0.04);
        transform: translateX(6px);
      }

      .perk-ico {
        width: 42px;
        height: 42px;
        flex-shrink: 0;
        display: grid;
        place-items: center;
        border-radius: 12px;
        background: rgba(229, 192, 123, 0.08);
        border: 1px solid rgba(229, 192, 123, 0.2);
        color: #e5c07b;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;
      }

      .auth-perks li:hover .perk-ico {
        background: rgba(229, 192, 123, 0.18);
        border-color: #e5c07b;
        color: #ffffff;
        box-shadow: 0 0 15px rgba(229, 192, 123, 0.35);
        transform: scale(1.05);
      }

      .perk-ico svg {
        width: 20px;
        height: 20px;
        display: block;
      }

      .perk-text {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        text-align: left;
      }

      .auth-perks strong {
        font-size: 0.9375rem;
        font-weight: 600;
        color: #ffffff;
      }

      .auth-perks span {
        font-size: 0.8125rem;
        color: rgba(255, 255, 255, 0.65);
        line-height: 1.45;
      }

      .auth-main {
        background: #ffffff;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .auth-card {
        padding: 3rem 4rem;
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .auth-tabs-container {
        display: flex;
        justify-content: center;
      }

      .auth-tabs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        background: #f3ede8;
        padding: 6px;
        border-radius: 14px;
        border: 1px solid #e9dfd5;
        width: 100%;
        max-width: 320px;
      }

      .auth-tab {
        padding: 0.75rem 1.5rem;
        border: none;
        background: transparent;
        font-size: 0.875rem;
        font-weight: 600;
        color: #7a6e65;
        cursor: pointer;
        border-radius: 10px;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        text-align: center;
      }

      .auth-tab:hover {
        color: #5c4033;
      }

      .auth-tab.active {
        background: #ffffff;
        color: #3e2a1e;
        font-weight: 700;
        box-shadow: 0 4px 12px rgba(62, 42, 30, 0.08);
      }

      .auth-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .auth-form-head {
        text-align: left;
        border-left: 3px solid #8c6239;
        padding-left: 1rem;
        margin-bottom: 0.5rem;
      }

      .auth-form-head h1 {
        margin: 0 0 0.25rem;
        font-size: 1.625rem;
        font-weight: 800;
        color: #2b1d14;
        letter-spacing: -0.02em;
      }

      .auth-form-head p {
        margin: 0;
        font-size: 0.875rem;
        color: #8c8175;
      }

      .store-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 0;
      }

      .store-field label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #5c524a;
        margin-bottom: 0;
        display: flex;
        align-items: center;
      }

      .store-field label em {
        color: #dc2626;
        font-style: normal;
        margin-left: 0.25rem;
      }

      .input-wrap {
        position: relative;
      }

      .field-ico {
        position: absolute;
        left: 1.15rem;
        top: 50%;
        transform: translateY(-50%);
        color: #a89a8e;
        pointer-events: none;
        display: grid;
        place-items: center;
        transition: color 0.25s ease;
        z-index: 2;
      }

      .field-ico svg {
        width: 20px;
        height: 20px;
      }

      .input-wrap input {
        width: 100%;
        padding: 0.85rem 1rem 0.85rem 3rem;
        border: 1.5px solid #ebdcd0;
        border-radius: 12px;
        font-size: 0.9375rem;
        background-color: #ffffff;
        color: #2b1d14;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .input-wrap input::placeholder {
        color: #bfaea0;
      }

      .input-wrap input:focus {
        outline: none;
        border-color: #c29c68;
        box-shadow: 0 0 0 4px rgba(194, 156, 104, 0.15);
      }

      .input-wrap:focus-within .field-ico {
        color: #8c6239;
      }

      .input-wrap input.input-invalid {
        border-color: #fca5a5;
        background-color: #fffaf9;
      }

      .input-wrap input.input-invalid:focus {
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.08);
      }

      .password-input-wrap input {
        padding-right: 3.25rem;
      }

      .pw-toggle {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        width: 36px;
        height: 36px;
        border: none;
        background: none;
        color: #a89a8e;
        cursor: pointer;
        display: grid;
        place-items: center;
        border-radius: 10px;
        transition: all 0.2s ease;
        z-index: 2;
      }

      .pw-toggle:hover {
        color: #8c6239;
        background-color: #faf6f2;
      }

      .pw-toggle svg {
        width: 20px;
        height: 20px;
      }

      .field-error {
        font-size: 0.8125rem;
        color: #dc2626;
        font-weight: 500;
        margin-top: 0.15rem;
        text-align: left;
      }

      /* Captcha Box Design */
      .captcha-field {
        margin-bottom: 0.5rem;
      }

      .captcha-box {
        display: flex;
        align-items: center;
        background: #faf9f7;
        border: 1px solid #ebdcd0;
        border-radius: 12px;
        padding: 0.75rem 1rem;
        gap: 0.75rem;
        position: relative;
        transition: all 0.2s ease;
      }

      .captcha-box.captcha-invalid {
        border-color: #fca5a5;
        background-color: #fffaf9;
      }

      .captcha-checkbox-btn {
        width: 28px;
        height: 28px;
        border: 2px solid #c29c68;
        border-radius: 6px;
        background: #ffffff;
        cursor: pointer;
        padding: 0;
        display: grid;
        place-items: center;
        position: relative;
        transition: all 0.2s ease;
      }

      .captcha-checkbox-btn:hover:not(:disabled) {
        border-color: #8c6239;
        box-shadow: 0 0 0 3px rgba(140, 98, 57, 0.08);
      }

      .captcha-checkbox-btn:disabled {
        cursor: default;
      }

      .captcha-checkbox-square {
        width: 100%;
        height: 100%;
      }

      .captcha-checkbox-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #8c6239;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      .captcha-checkbox-checked {
        color: #16a34a;
        display: grid;
        place-items: center;
      }

      .captcha-checkbox-checked svg {
        width: 18px;
        height: 18px;
      }

      .captcha-box.captcha-checked {
        border-color: #ebdcd0;
        background: #fdfbf9;
      }

      .captcha-box.captcha-checked .captcha-checkbox-btn {
        border-color: #16a34a;
        background: #f0fdf4;
      }

      .captcha-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #5c524a;
        cursor: pointer;
        user-select: none;
        flex: 1;
        text-align: left;
      }

      .captcha-brand {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        line-height: 1.1;
        font-size: 0.625rem;
        color: #8c8175;
      }

      .captcha-brand-logo {
        width: 20px;
        height: 20px;
        color: #3b82f6;
        margin-bottom: 2px;
      }

      .captcha-brand-text {
        font-weight: 700;
        color: #5c524a;
      }

      .captcha-links {
        font-size: 0.55rem;
        color: #a89a8e;
      }

      .store-alert-error {
        padding: 0.9rem 1.25rem;
        border-radius: 12px;
        font-size: 0.875rem;
        background: #fff5f5;
        color: #c53030;
        border: 1px solid #feb2b2;
        margin-bottom: 0;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        line-height: 1.45;
      }

      .alert-ico {
        width: 20px;
        height: 20px;
        color: #e53e3e;
        flex-shrink: 0;
      }

      .auth-submit {
        width: 100%;
        margin-top: 0.5rem;
        padding: 0.9rem 1.75rem;
        border-radius: 12px;
        border: none;
        background: linear-gradient(135deg, #8c6239 0%, #5c4033 100%);
        color: #ffffff;
        font-size: 0.9375rem;
        font-weight: 700;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        box-shadow: 0 6px 20px rgba(92, 64, 51, 0.2);
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      .auth-submit:hover:not(:disabled) {
        background: linear-gradient(135deg, #a07246 0%, #6e4c3d 100%);
        box-shadow: 0 10px 25px rgba(92, 64, 51, 0.3);
        transform: translateY(-2px);
      }

      .auth-submit:active:not(:disabled) {
        transform: translateY(0) scale(0.97);
      }

      .auth-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: #ffffff;
        border-radius: 50%;
        animation: spin 0.75s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .auth-links-row {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        font-size: 0.875rem;
        color: #8c8175;
      }

      .auth-divider {
        color: #ebdcd0;
      }

      .link-btn {
        border: none;
        background: none;
        padding: 0;
        font-weight: 700;
        color: #8c6239;
        cursor: pointer;
        text-decoration: none;
        transition: all 0.2s ease;
        border-bottom: 1.5px solid transparent;
      }

      .link-btn:hover {
        color: #5c4033;
        border-bottom-color: #5c4033;
        text-decoration: none;
      }

      .forgot-box {
        margin-top: 0.5rem;
        padding: 1.5rem;
        background: #fdfaf6;
        border-radius: 16px;
        border: 1.5px dashed #ebdcd0;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        animation: slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .forgot-title {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 700;
        color: #3e2a1e;
      }

      .forgot-desc {
        margin: 0;
        font-size: 0.8125rem;
        color: #8c8175;
        line-height: 1.5;
      }

      .forgot-input-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }

      .forgot-input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1.5px solid #ebdcd0;
        border-radius: 10px;
        font-size: 0.875rem;
        outline: none;
        background: #ffffff;
        color: #2b1d14;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .forgot-input:focus {
        border-color: #c29c68;
        box-shadow: 0 0 0 4px rgba(194, 156, 104, 0.15);
      }

      .forgot-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      .forgot-actions .store-btn {
        padding: 0.75rem 1.25rem;
        font-size: 0.875rem;
        border-radius: 10px;
        flex: 1;
      }

      .forgot-close-btn {
        background: none;
        border: 1.5px solid #ebdcd0;
        padding: 0.75rem 1.25rem;
        font-size: 0.875rem;
        font-weight: 700;
        color: #5c4033;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .forgot-close-btn:hover {
        background: #fbf8f5;
        border-color: #c29c68;
        color: #8c6239;
      }

      .forgot-result {
        margin: 0;
        font-size: 0.8125rem;
        color: #16a34a;
        font-weight: 600;
      }

      .forgot-dev {
        margin: 0;
        font-size: 0.75rem;
        color: #7f5f3f;
        background: #faf2eb;
        padding: 0.75rem;
        border-radius: 8px;
        border: 1px solid #ebd8c8;
        word-break: break-all;
        font-family: ui-monospace, monospace;
      }

      .auth-foot {
        margin: 0;
        text-align: center;
        font-size: 0.875rem;
        color: #8c8175;
      }

      /* Success Modal */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(43, 29, 20, 0.4);
        backdrop-filter: blur(4px);
        display: grid;
        place-items: center;
        padding: 1.25rem;
      }

      .modal-panel {
        width: min(440px, 100%);
        background: #ffffff;
        border-radius: 24px;
        box-shadow: 0 30px 70px rgba(62, 42, 30, 0.25);
        overflow: hidden;
        border: 1px solid rgba(229, 192, 123, 0.2);
        animation: modalScaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      @keyframes modalScaleUp {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .success-modal-body {
        padding: 3rem 2.5rem;
        text-align: center;
      }

      .success-icon {
        width: 64px;
        height: 64px;
        margin: 0 auto 1.5rem;
        border-radius: 50%;
        background: #f0fdf4;
        color: #16a34a;
        display: grid;
        place-items: center;
        box-shadow: 0 6px 15px rgba(22, 163, 74, 0.15);
      }

      .success-icon svg {
        width: 32px;
        height: 32px;
      }

      .success-modal-body h2 {
        margin: 0 0 0.75rem;
        font-size: 1.5rem;
        font-weight: 800;
        color: #2b1d14;
      }

      .success-msg {
        margin: 0 0 0.75rem;
        font-size: 0.9375rem;
        color: #8c8175;
        line-height: 1.5;
      }

      .success-email {
        margin: 0 0 2rem;
        font-size: 0.875rem;
        color: #5c524a;
      }

      .success-email strong {
        color: #8c6239;
        font-weight: 700;
      }

      .success-btn {
        width: 100%;
        border-radius: 12px;
        padding: 0.9rem;
        font-size: 0.9375rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      @media (max-width: 992px) {
        .auth-shell {
          grid-template-columns: 1fr;
          min-height: auto;
          border-radius: 20px;
        }

        .auth-aside {
          display: none;
        }

        .auth-aside-inner {
          padding: 2.5rem 2rem;
          gap: 2rem;
        }

        .auth-aside-title {
          font-size: 1.5rem;
        }

        .auth-perks {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
        }

        .auth-perks li {
          padding: 0.5rem;
        }

        .auth-perks li:hover {
          transform: translateY(-2px);
        }

        .auth-card {
          padding: 2.5rem 2rem;
        }
      }

      @media (max-width: 576px) {
        .store-page.account-page {
          padding: 1.5rem 0;
        }

        .auth-aside-inner {
          padding: 2rem 1.5rem;
        }

        .auth-perks {
          grid-template-columns: 1fr;
        }

        .auth-card {
          padding: 2rem 1.5rem;
        }

        .forgot-input-group {
          grid-template-columns: 1fr;
        }
      }

      /* Suffix Email styles */
      .email-split-wrap {
        display: flex;
        align-items: center;
        position: relative;
      }
      .email-split-wrap input {
        padding-right: 7.5rem;
      }
      .email-suffix {
        position: absolute;
        right: 1.15rem;
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.9375rem;
        font-weight: 600;
        color: #8c8175;
        pointer-events: none;
        user-select: none;
      }

      /* OAuth styles */
      .oauth-divider-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin: 0.5rem 0;
      }
      .oauth-line {
        flex: 1;
        height: 1px;
        background-color: #ebdcd0;
      }
      .oauth-text {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #8c8175;
        white-space: nowrap;
      }
      .oauth-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .oauth-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.8rem 1rem;
        border-radius: 12px;
        border: 1.5px solid #ebdcd0;
        background-color: #ffffff;
        color: #3e2a1e;
        font-size: 0.875rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .oauth-btn svg {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        transition: all 0.25s ease;
      }
      .oauth-btn-google:hover:not(:disabled) {
        background-color: #8c6239;
        border-color: #8c6239;
        color: #ffffff;
      }
      .oauth-btn-tiktok:hover:not(:disabled) {
        background-color: #000000;
        border-color: #000000;
        color: #ffffff;
      }
      .oauth-btn:hover:not(:disabled) svg {
        filter: brightness(0) invert(1);
      }
      .oauth-btn:active:not(:disabled) {
        transform: scale(0.97);
      }
      .oauth-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `
  ]
})
export class StoreAccountComponent implements OnInit {
  private readonly storeAuth = inject(StoreAuthService);
  private readonly profileApi = inject(StoreProfileService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private googleTokenClient: any;

  readonly user = signal<StoreUser | null>(this.storeAuth.getUser());
  readonly checkoutReturn = signal(false);
  readonly forgotOpen = signal(false);
  readonly forgotLoading = signal(false);
  readonly forgotMsg = signal('');
  readonly forgotDevHint = signal('');
  forgotEmailControl = this.fb.control('', [Validators.email]);
  forgotPhoneControl = this.fb.control('');
  readonly authTab = signal<AuthTab>('login');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly showLoginPassword = signal(false);
  readonly showRegisterPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly registerSuccessOpen = signal(false);
  readonly registerSuccessMsg = signal('');
  readonly registerSuccessEmail = signal('');
  readonly activationNotice = signal('');

  // Captcha signals for interactive verification UX
  readonly loginCaptchaState = signal<'unchecked' | 'checking' | 'checked'>('unchecked');
  readonly registerCaptchaState = signal<'unchecked' | 'checking' | 'checked'>('unchecked');

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    captcha: [false, Validators.requiredTrue]
  });

  registerForm = this.fb.group(
    {
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._-]+(@gmail\.com)?$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      captcha: [false, Validators.requiredTrue]
    },
    { validators: passwordMatchValidator }
  );

  ngOnInit(): void {
    this.initGoogleAuth();
    if (this.storeAuth.isLoggedIn()) {
      const cached = this.storeAuth.getUser();
      if (cached) {
        this.user.set(cached);
      }
      this.refreshUser();
    }

    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab');
      if (tab === 'register' || tab === 'dang-ky') {
        this.authTab.set('register');
      }
      const activated = params.get('activated');
      const message = params.get('message');
      if (activated === '1') {
        this.activationNotice.set(message || 'Tài khoản đã được kích hoạt. Bạn có thể đăng nhập ngay.');
      }
      const returnUrl = params.get('returnUrl') || '';
      this.checkoutReturn.set(returnUrl.includes('thanh-toan'));
    });
  }

  onUserUpdated(u: StoreUser): void {
    this.user.set(u);
  }

  toggleLoginCaptcha(): void {
    if (this.loginCaptchaState() !== 'unchecked') return;
    this.loginCaptchaState.set('checking');
    setTimeout(() => {
      this.loginCaptchaState.set('checked');
      this.loginForm.patchValue({ captcha: true });
      this.loginForm.controls.captcha.markAsTouched();
    }, 850);
  }

  toggleRegisterCaptcha(): void {
    if (this.registerCaptchaState() !== 'unchecked') return;
    this.registerCaptchaState.set('checking');
    setTimeout(() => {
      this.registerCaptchaState.set('checked');
      this.registerForm.patchValue({ captcha: true });
      this.registerForm.get('captcha')?.markAsTouched();
    }, 850);
  }

  submitForgotLogin(): void {
    const email = String(this.forgotEmailControl.value || '').trim();
    const phone = String(this.forgotPhoneControl.value || '').trim();
    if (!email && !phone.replace(/\D/g, '')) {
      this.forgotMsg.set('Vui lòng nhập email hoặc số điện thoại.');
      return;
    }
    if (email && this.forgotEmailControl.invalid) return;
    this.forgotLoading.set(true);
    this.forgotMsg.set('');
    this.forgotDevHint.set('');
    this.profileApi.forgotPassword({ email: email || undefined, phone: phone || undefined }).subscribe({
      next: (res) => {
        this.forgotLoading.set(false);
        this.forgotMsg.set(res.message);
        this.forgotDevHint.set(res.devHint || '');
      },
      error: (err) => {
        this.forgotLoading.set(false);
        this.forgotMsg.set(this.authErrorMessage(err, 'Không gửi được yêu cầu.'));
      }
    });
  }

  initGoogleAuth(): void {
    const checkGsi = setInterval(() => {
      if (typeof google !== 'undefined') {
        clearInterval(checkGsi);
        this.googleTokenClient = google.accounts.oauth2.initTokenClient({
          client_id: '530491615905-jccnas0se28sdjqbkia8h2vovsbp25fg.apps.googleusercontent.com',
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              this.handleGoogleLoginSuccess(tokenResponse.access_token);
            } else {
              this.loading.set(false);
            }
          },
          error_callback: (err: any) => {
            console.error(err);
            this.loading.set(false);
            this.error.set('Đăng nhập Google thất bại hoặc bị hủy.');
          }
        });
      }
    }, 100);
  }

  loginWithGoogle(): void {
    if (!this.googleTokenClient) {
      this.error.set('Thư viện đăng nhập Google đang tải. Vui lòng thử lại sau vài giây.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.googleTokenClient.requestAccessToken();
  }

  private handleGoogleLoginSuccess(accessToken: string): void {
    this.storeAuth.loginGoogle(accessToken).subscribe({
      next: () => {
        this.user.set(this.storeAuth.getUser());
        this.loading.set(false);
        this.refreshUser();
        this.navigateAfterAuth();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.authErrorMessage(err, 'Đăng nhập Google thất bại.'));
      }
    });
  }

  loginWithTikTok(): void {
    this.loading.set(true);
    this.error.set('');
    setTimeout(() => {
      this.loading.set(false);
      this.error.set('Tính năng đăng nhập TikTok đang được tích hợp. Vui lòng sử dụng tài khoản email.');
    }, 800);
  }

  closeRegisterSuccess(): void {
    const email = this.registerSuccessEmail();
    this.registerSuccessOpen.set(false);
    this.setTab('login');
    if (email) {
      this.loginForm.patchValue({ email });
    }
  }

  private navigateAfterAuth(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
      this.router.navigateByUrl(returnUrl);
    } else {
      this.router.navigate(['/tai-khoan']);
    }
  }

  setTab(tab: AuthTab): void {
    this.authTab.set(tab);
    this.error.set('');
    this.showLoginPassword.set(false);
    this.showRegisterPassword.set(false);
    this.showConfirmPassword.set(false);

    // Reset Captcha states and controls
    this.loginCaptchaState.set('unchecked');
    this.registerCaptchaState.set('unchecked');
    this.loginForm.patchValue({ captcha: false });
    this.registerForm.patchValue({ captcha: false });
    this.loginForm.controls.captcha.markAsUntouched();
    this.registerForm.get('captcha')?.markAsUntouched();
  }

  submitLogin(): void {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) {
      if (this.loginForm.controls.captcha.invalid) {
        this.error.set('Vui lòng xác nhận bạn không phải robot.');
      } else {
        this.error.set('Vui lòng nhập email và mật khẩu hợp lệ.');
      }
      return;
    }
    const { email, password } = this.loginForm.getRawValue();
    this.loading.set(true);
    this.error.set('');
    this.storeAuth.login(email!, password!).subscribe({
      next: () => {
        this.user.set(this.storeAuth.getUser());
        this.loading.set(false);
        this.refreshUser();
        this.navigateAfterAuth();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.authErrorMessage(err, 'Đăng nhập thất bại.'));
      }
    });
  }

  submitRegister(): void {
    this.registerForm.markAllAsTouched();
    if (this.registerForm.hasError('passwordMismatch')) {
      this.error.set('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (this.registerForm.invalid) {
      if (this.registerForm.get('captcha')?.invalid) {
        this.error.set('Vui lòng xác nhận bạn không phải robot.');
      } else {
        this.error.set('Vui lòng điền đầy đủ thông tin hợp lệ.');
      }
      return;
    }
    const { fullName, email, password } = this.registerForm.getRawValue();
    let emailValue = email ? email.trim() : '';
    if (emailValue && !emailValue.toLowerCase().endsWith('@gmail.com')) {
      emailValue += '@gmail.com';
    }
    this.loading.set(true);
    this.error.set('');
    this.storeAuth.register(fullName!, emailValue, password!).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.storeAuth.clearSession();
        this.registerForm.reset();
        this.registerCaptchaState.set('unchecked'); // reset captcha state
        this.registerSuccessEmail.set(emailValue);
        this.registerSuccessMsg.set(
          res.emailMessage ||
            (res.emailSent
              ? 'Email kích hoạt đã được gửi đến hộp thư của bạn.'
              : 'Tài khoản đã tạo thành công. Vui lòng kiểm tra email để kích hoạt trước khi đăng nhập.')
        );
        this.registerSuccessOpen.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.authErrorMessage(err, 'Đăng ký thất bại.'));
      }
    });
  }

  logout(): void {
    this.storeAuth.logout('/tai-khoan');
    this.user.set(null);
  }

  private refreshUser(): void {
    this.profileApi.fetchProfile().subscribe({
      next: (res) => {
        this.storeAuth.persistUser(res.user);
        this.user.set(res.user);
      },
      error: () => {
        this.storeAuth.fetchMe().subscribe({
          next: (res) => {
            this.storeAuth.persistUser(res.user);
            this.user.set(res.user);
          },
          error: () => this.user.set(this.storeAuth.getUser())
        });
      }
    });
  }

  private authErrorMessage(err: unknown, fallback: string): string {
    if (!(err instanceof HttpErrorResponse)) {
      return fallback;
    }
    if (err.status === 0) {
      return 'Không kết nối được máy chủ. Chạy backend (cd backend && npm start) và frontend (ng serve).';
    }
    if (err.status === 404) {
      return 'API đăng nhập chưa có — khởi động lại backend, sau đó tắt và chạy lại ng serve.';
    }
    if (err.status === 401 && err.error?.message === 'Unauthorized') {
      return 'Backend chưa có API cửa hàng — khởi động lại: cd backend && npm start';
    }
    return err.error?.message || fallback;
  }
}
