import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StoreProfileService } from '../../core/services/store-profile.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <section class="store-section store-section--white">
      <div class="store-container page-container">
        <div class="forgot-card">
          <header class="forgot-head">
            <h1>Khôi phục mật khẩu</h1>
            <p>Vui lòng nhập email đăng ký của bạn. Hệ thống sẽ tạo mật khẩu ngẫu nhiên và gửi tới Gmail của bạn để đăng nhập.</p>
          </header>

          <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="forgot-form" novalidate>
            <div class="store-field">
              <label for="email">Địa chỉ Email</label>
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
                  placeholder="email@example.com"
                  [class.input-invalid]="forgotForm.controls.email.touched && forgotForm.controls.email.invalid"
                />
              </div>
              @if (forgotForm.controls.email.touched && forgotForm.controls.email.hasError('required')) {
                <span class="field-error">Vui lòng nhập email.</span>
              } @else if (forgotForm.controls.email.touched && forgotForm.controls.email.hasError('email')) {
                <span class="field-error">Email không hợp lệ.</span>
              }
            </div>

            <!-- Captcha Verification -->
            <div class="store-field captcha-field">
              <div class="captcha-box" [class.captcha-checked]="captchaState() === 'checked'" [class.captcha-invalid]="forgotForm.controls.captcha.touched && forgotForm.controls.captcha.invalid">
                <button type="button" class="captcha-checkbox-btn" (click)="toggleCaptcha()" [disabled]="captchaState() !== 'unchecked'">
                  @if (captchaState() === 'unchecked') {
                    <span class="captcha-checkbox-square"></span>
                  } @else if (captchaState() === 'checking') {
                    <span class="captcha-checkbox-spinner"></span>
                  } @else if (captchaState() === 'checked') {
                    <span class="captcha-checkbox-checked">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                  }
                </button>
                <span class="captcha-label" (click)="toggleCaptcha()">Tôi không phải là người máy</span>
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
              @if (forgotForm.controls.captcha.touched && forgotForm.controls.captcha.invalid) {
                <span class="field-error">Vui lòng xác nhận bạn không phải robot.</span>
              }
            </div>

            @if (message()) {
              <div class="store-alert-success" role="alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-ico">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span>{{ message() }}</span>
              </div>
            }

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

            @if (devHint()) {
              <div class="store-alert-info" role="alert">
                <span>{{ devHint() }}</span>
              </div>
            }

            <button type="submit" class="store-btn store-btn-primary auth-submit" [disabled]="loading()">
              @if (loading()) {
                <span class="spinner" aria-hidden="true"></span>
                <span>Đang xử lý...</span>
              } @else {
                <span>Gửi mật khẩu khôi phục</span>
              }
            </button>
          </form>

          <footer class="forgot-footer">
            <a routerLink="/tai-khoan" class="back-link">← Quay lại Đăng nhập</a>
          </footer>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .page-container {
      max-width: 480px;
      margin: 3rem auto;
      padding: 0 1.25rem;
    }

    .forgot-card {
      background: #ffffff;
      border-radius: 20px;
      padding: 2.5rem;
      box-shadow: 
        0 20px 40px -10px rgba(62, 42, 30, 0.08), 
        0 0 0 1px rgba(92, 64, 51, 0.04);
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }

    .forgot-head {
      border-left: 3px solid #8c6239;
      padding-left: 1rem;
    }

    .forgot-head h1 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
      font-weight: 800;
      color: #2b1d14;
      letter-spacing: -0.02em;
    }

    .forgot-head p {
      margin: 0;
      font-size: 0.85rem;
      line-height: 1.5;
      color: #8c8175;
    }

    .forgot-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .store-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .store-field label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #5c524a;
    }

    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .field-ico {
      position: absolute;
      left: 1rem;
      color: #a3978c;
      pointer-events: none;
      display: flex;
      align-items: center;
    }

    .field-ico svg {
      width: 20px;
      height: 20px;
    }

    .input-wrap input {
      width: 100%;
      height: 48px;
      padding: 0 1rem 0 2.75rem;
      border: 1.5px solid #ebdcd0;
      border-radius: 12px;
      background: #fdfbf9;
      color: #3e2a1e;
      font-size: 0.9375rem;
      font-family: inherit;
      outline: none;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .input-wrap input:focus {
      background: #ffffff;
      border-color: #8c6239;
      box-shadow: 0 0 0 4px rgba(140, 98, 57, 0.08);
    }

    .input-wrap input.input-invalid {
      border-color: #fca5a5;
      background: #fffafa;
    }

    .input-wrap input.input-invalid:focus {
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.08);
    }

    .field-error {
      font-size: 0.75rem;
      font-weight: 600;
      color: #dc2626;
    }

    /* Captcha styles */
    .captcha-field {
      margin-top: 0.25rem;
    }

    .captcha-box {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: #faf8f5;
      border: 1.5px solid #ebdcd0;
      border-radius: 12px;
      position: relative;
      overflow: hidden;
      min-height: 64px;
    }

    .captcha-box.captcha-checked {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }

    .captcha-box.captcha-invalid {
      border-color: #fca5a5;
      background: #fffafa;
    }

    .captcha-checkbox-btn {
      width: 28px;
      height: 28px;
      border: 2px solid #c8b9ad;
      border-radius: 6px;
      background: #ffffff;
      cursor: pointer;
      display: grid;
      place-items: center;
      padding: 0;
      flex-shrink: 0;
      transition: all 0.2s;
    }

    .captcha-box.captcha-checked .captcha-checkbox-btn {
      border-color: #22c55e;
      background: #22c55e;
      color: #ffffff;
    }

    .captcha-checkbox-square {
      width: 100%;
      height: 100%;
      border-radius: 4px;
    }

    .captcha-checkbox-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #8c6239;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    .captcha-checkbox-checked svg {
      width: 16px;
      height: 16px;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .captcha-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #5c524a;
      cursor: pointer;
      flex-grow: 1;
      user-select: none;
    }

    .captcha-box.captcha-checked .captcha-label {
      color: #15803d;
    }

    .captcha-brand {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.15rem;
      border-left: 1px solid #ebdcd0;
      padding-left: 0.75rem;
      flex-shrink: 0;
    }

    .captcha-brand-logo {
      width: 20px;
      height: 20px;
      color: #8c6239;
    }

    .captcha-brand-text {
      font-size: 0.625rem;
      font-weight: 700;
      color: #8c8175;
      letter-spacing: 0.05em;
    }

    .captcha-links {
      font-size: 0.55rem;
      color: #a3978c;
    }

    /* Alerts */
    .store-alert-success, .store-alert-error, .store-alert-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
      line-height: 1.45;
    }

    .store-alert-success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #15803d;
    }

    .store-alert-error {
      background: #fef2f2;
      border: 1px solid #fee2e2;
      color: #b91c1c;
    }

    .store-alert-info {
      background: #f0f9ff;
      border: 1px solid #e0f2fe;
      color: #0369a1;
    }

    .alert-ico {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    /* Submit Button */
    .auth-submit {
      height: 48px;
      width: 100%;
      border-radius: 12px;
      font-size: 0.9375rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .store-btn {
      border: none;
      outline: none;
      transition: all 0.2s;
    }

    .store-btn-primary {
      background: #8c6239;
      color: #ffffff;
    }

    .store-btn-primary:hover:not(:disabled) {
      background: #704e2d;
    }

    .store-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .forgot-footer {
      border-top: 1px solid #f3ede8;
      padding-top: 1.25rem;
      display: flex;
      justify-content: center;
    }

    .back-link {
      font-size: 0.875rem;
      font-weight: 700;
      color: #8c6239;
      text-decoration: none;
      transition: all 0.2s;
      border-bottom: 1.5px solid transparent;
    }

    .back-link:hover {
      border-bottom-color: #8c6239;
    }
  `]
})
export class ForgotPasswordComponent {
  private readonly profileApi = inject(StoreProfileService);
  private readonly fb = inject(FormBuilder);

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    captcha: [false, Validators.requiredTrue]
  });

  captchaState = signal<'unchecked' | 'checking' | 'checked'>('unchecked');
  loading = signal(false);
  message = signal('');
  error = signal('');
  devHint = signal('');

  toggleCaptcha(): void {
    if (this.captchaState() !== 'unchecked') return;
    this.captchaState.set('checking');
    setTimeout(() => {
      this.captchaState.set('checked');
      this.forgotForm.patchValue({ captcha: true });
      this.forgotForm.controls.captcha.markAsTouched();
    }, 850);
  }

  onSubmit(): void {
    this.forgotForm.markAllAsTouched();
    if (this.forgotForm.invalid) {
      if (this.forgotForm.controls.captcha.invalid) {
        this.error.set('Vui lòng xác nhận bạn không phải robot.');
      } else {
        this.error.set('Vui lòng nhập địa chỉ email hợp lệ.');
      }
      return;
    }

    const email = this.forgotForm.value.email;
    this.loading.set(true);
    this.message.set('');
    this.error.set('');
    this.devHint.set('');

    this.profileApi.forgotPassword({ email: email || undefined }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.message.set(res.message);
        this.devHint.set(res.devHint || '');
        this.forgotForm.reset();
        this.captchaState.set('unchecked');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Có lỗi xảy ra khi gửi yêu cầu khôi phục mật khẩu.');
      }
    });
  }
}
