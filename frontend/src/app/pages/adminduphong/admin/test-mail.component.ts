import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { API_URL } from '../../core/config/api-url';
import { AdminCatalogPageComponent } from '../../shared/admin-catalog-page.component';

const BACKEND_URL = 'http://localhost:5000';

interface SmtpDebugConfig {
  nodemailerInstalled: boolean;
  smtpConfigured: boolean;
  host: string | null;
  port: number;
  secure: boolean;
  user: string | null;
  from: string | null;
}

interface MailDebugResponse {
  message: string;
  sent?: boolean;
  reason?: string;
  logged?: boolean;
  config?: SmtpDebugConfig;
}

@Component({
  selector: 'app-test-mail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AdminCatalogPageComponent],
  template: `
    <app-admin-catalog-page
      title="Test mail"
      subtitle="Gửi email kiểm tra để xác nhận SMTP đang hoạt động"
      [breadcrumbs]="[
        { label: 'Trang chủ', route: '/admin/dashboard' },
        { label: 'Cấu hình hệ thống', route: '/admin/contacts' },
        { label: 'Test mail' }
      ]"
    >
      <div class="test-mail-grid">
        <section class="panel mail-panel">
          <header class="panel-head">
            <div>
              <h2>Gửi mail test</h2>
              <p>Nhập email nhận mail và bấm gửi để kiểm tra hộp thư thật.</p>
            </div>
            <a routerLink="/admin/contacts" class="btn-action secondary">Quay lại</a>
          </header>

          <form [formGroup]="form" (ngSubmit)="send()" class="mail-form" novalidate>
            <label class="field">
              <span>Email nhận</span>
              <input type="email" formControlName="to" placeholder="you@example.com" />
              @if (form.controls.to.touched && form.controls.to.invalid) {
                <small class="field-error">Nhập email hợp lệ</small>
              }
            </label>

            <label class="field">
              <span>Tiêu đề</span>
              <input type="text" formControlName="subject" />
            </label>

            <label class="field">
              <span>Nội dung HTML</span>
              <textarea formControlName="html" rows="8"></textarea>
            </label>

            <div class="actions">
              <button type="submit" class="btn-action primary" [disabled]="sending()">
                @if (sending()) {
                  Đang gửi...
                } @else {
                  Gửi mail test
                }
              </button>
              <button type="button" class="btn-action secondary" (click)="fillSample()">Điền mẫu</button>
            </div>
          </form>

          @if (response()) {
            <div class="response-box" [class.error]="!response()!.sent">
              <strong>{{ response()!.message }}</strong>
              @if (response()!.reason) {
                <p>Lý do: {{ response()!.reason }}</p>
              }
              @if (response()!.logged) {
                <p>Ứng dụng chỉ ghi log thay vì gửi thật.</p>
              }
            </div>
          }
        </section>

        <aside class="panel config-panel">
          <h3>Trạng thái SMTP</h3>
          @if (config()) {
            <ul class="config-list">
              <li><span>Nodemailer</span><strong>{{ config()!.nodemailerInstalled ? 'Có' : 'Thiếu' }}</strong></li>
              <li><span>SMTP cấu hình</span><strong>{{ config()!.smtpConfigured ? 'Có' : 'Chưa' }}</strong></li>
              <li><span>Host</span><strong>{{ config()!.host || '—' }}</strong></li>
              <li><span>Port</span><strong>{{ config()!.port }}</strong></li>
              <li><span>Secure</span><strong>{{ config()!.secure ? 'true' : 'false' }}</strong></li>
              <li><span>User</span><strong>{{ config()!.user || '—' }}</strong></li>
              <li><span>From</span><strong>{{ config()!.from || '—' }}</strong></li>
            </ul>
          } @else {
            <p class="muted">Chưa có kết quả test.</p>
          }

          <div class="tip-box">
            <h4>Lưu ý</h4>
            <p>
              Nếu <strong>SMTP cấu hình</strong> là <em>Chưa</em>, trang sẽ chỉ nhận phản hồi log chứ không gửi mail thật.
            </p>
          </div>
        </aside>
      </div>
    </app-admin-catalog-page>
  `,
  styles: [
    `
      .test-mail-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.8fr);
        gap: 1.5rem;
      }

      .mail-panel,
      .config-panel {
        padding: 2rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
      }

      .panel-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 2rem;
        border-bottom: 1px solid var(--border-light);
        padding-bottom: 1.25rem;
      }

      .panel-head h2,
      .config-panel h3,
      .tip-box h4 {
        margin: 0 0 0.35rem;
        font-weight: 700;
        color: var(--text);
      }

      .panel-head h2 {
        font-size: 1.25rem;
      }

      .config-panel h3 {
        font-size: 1.15rem;
        margin-bottom: 1.25rem;
        border-bottom: 1px solid var(--border-light);
        padding-bottom: 0.75rem;
      }

      .panel-head p,
      .config-panel p,
      .tip-box p {
        margin: 0;
        color: var(--muted);
        line-height: 1.55;
      }

      .mail-form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .field span {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .field input,
      .field textarea {
        width: 100%;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        background: #ffffff;
        color: var(--text);
        font-family: inherit;
        font-size: 0.875rem;
        transition: all 0.2s ease;
      }

      .field input:focus,
      .field textarea:focus {
        outline: none;
        border-color: var(--text);
        box-shadow: 0 0 0 3px rgba(26, 29, 33, 0.08);
      }

      .field textarea {
        resize: vertical;
        min-height: 180px;
      }

      .field-error {
        color: #ef4444;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .response-box {
        margin-top: 1rem;
        padding: 1rem;
        border-radius: 12px;
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
      }

      .response-box.error {
        background: #fef2f2;
        border-color: #fecaca;
      }

      .response-box strong {
        display: block;
        margin-bottom: 0.35rem;
      }

      .response-box p {
        margin: 0.25rem 0 0;
        color: var(--muted);
      }

      .config-list {
        list-style: none;
        padding: 0;
        margin: 1rem 0 0;
        display: grid;
        gap: 0.6rem;
      }

      .config-list li {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding-bottom: 0.6rem;
        border-bottom: 1px solid var(--border-light);
      }

      .config-list span {
        color: var(--muted);
      }

      .config-list strong {
        text-align: right;
      }

      .tip-box {
        margin-top: 1.25rem;
        padding: 1rem;
        border-radius: 12px;
        background: var(--border-light);
      }

      @media (max-width: 1024px) {
        .test-mail-grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class TestMailComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  readonly sending = signal(false);
  readonly response = signal<MailDebugResponse | null>(null);
  readonly config = signal<SmtpDebugConfig | null>(null);

  form = this.fb.group({
    to: ['', [Validators.required, Validators.email]],
    subject: ['MỘC HOME — Mail debug test', [Validators.required]],
    html: [
      '<!DOCTYPE html><html><body><h2>MỘC HOME — Mail debug</h2><p>Nếu bạn nhận được mail này thì SMTP đã gửi thành công.</p></body></html>',
      [Validators.required]
    ]
  });

  fillSample(): void {
    this.form.patchValue({
      to: '',
      subject: 'MỘC HOME — Mail debug test',
      html: '<!DOCTYPE html><html><body><h2>MỘC HOME — Mail debug</h2><p>Nếu bạn nhận được mail này thì SMTP đã gửi thành công.</p></body></html>'
    });
    this.response.set(null);
  }

  send(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.sending.set(true);
    this.http
      .post<MailDebugResponse>(`${BACKEND_URL}${API_URL}/public/mail/debug`, this.form.getRawValue())
      .subscribe({
        next: (res) => {
          this.sending.set(false);
          this.response.set(res);
          if (res.config) {
            this.config.set(res.config);
          }
        },
        error: (err) => {
          this.sending.set(false);
          const payload = err?.error as MailDebugResponse | undefined;
          this.response.set(
            payload || {
              message: 'Không gửi được mail test.',
              sent: false,
              reason: err?.message || 'unknown_error'
            }
          );
          if (payload?.config) {
            this.config.set(payload.config);
          }
        }
      });
  }
}