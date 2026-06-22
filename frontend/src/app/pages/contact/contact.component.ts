import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { PublicApiService } from '../../core/services/public-api.service';

const SUBJECT_OPTIONS = [
  { value: '', label: 'Chọn chủ đề' },
  { value: 'tuvan', label: 'Tư vấn sản phẩm' },
  { value: 'baogia', label: 'Báo giá / Đặt hàng' },
  { value: 'baohanh', label: 'Bảo hành & Sửa chữa' },
  { value: 'khac', label: 'Khác' }
];

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="contact-page">
      <section class="hero" aria-labelledby="contact-hero-title">
        <div class="container hero-grid">
          <div class="hero-art" aria-hidden="true">
            <svg viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M28 115V72c0-10 8-18 18-18h10c10 0 18 8 18 18v43" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round"/>
              <ellipse cx="46" cy="64" rx="22" ry="12" stroke="#9ca3af" stroke-width="1.5"/>
              <path d="M36 115h20" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round"/>
              <rect x="78" y="82" width="72" height="24" rx="3" stroke="#6b7280" stroke-width="1.5"/>
              <path d="M78 98h72M114 82v24" stroke="#6b7280" stroke-width="1.5"/>
              <path d="M88 106h52" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="168" y1="32" x2="168" y2="115" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M154 32h28a8 8 0 010 16h-28" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <ellipse cx="168" cy="115" rx="16" ry="4" stroke="#d1d5db" stroke-width="1"/>
            </svg>
          </div>

          <div class="hero-center">
            <h1 id="contact-hero-title">LIÊN HỆ VỚI CHÚNG TÔI</h1>
            <p class="hero-sub">Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn.</p>
          </div>

          <nav class="breadcrumb" aria-label="Breadcrumb">
            <a routerLink="/">Trang chủ</a>
            <span aria-hidden="true">&gt;</span>
            <span class="current">Liên hệ</span>
          </nav>
        </div>
      </section>

      <section class="main-section">
        <div class="container main-grid">
          <div class="form-col">
            <h2 class="section-title">GỬI LIÊN HỆ</h2>
            <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="contact-form">
              <div class="form-row form-row--2">
                <div class="field">
                  <label for="fullName">Họ và tên <span class="req">*</span></label>
                  <input
                    id="fullName"
                    type="text"
                    formControlName="fullName"
                    placeholder="Nhập họ và tên của bạn"
                    [class.invalid]="fullName.touched && fullName.invalid"
                  />
                </div>
                <div class="field">
                  <label for="email">Email <span class="req">*</span></label>
                  <input
                    id="email"
                    type="email"
                    formControlName="email"
                    placeholder="example@email.com"
                    [class.invalid]="email.touched && email.invalid"
                  />
                </div>
              </div>

              <div class="form-row form-row--2">
                <div class="field">
                  <label for="phone">Số điện thoại</label>
                  <input
                    id="phone"
                    type="tel"
                    formControlName="phone"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div class="field">
                  <label for="subject">Chủ đề</label>
                  <select id="subject" formControlName="subject">
                    @for (opt of subjectOptions; track opt.value) {
                      <option [value]="opt.value">{{ opt.label }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="field field--full">
                <label for="message">Nội dung tin nhắn <span class="req">*</span></label>
                <textarea
                  id="message"
                  formControlName="message"
                  rows="7"
                  placeholder="Nhập nội dung bạn muốn gửi..."
                  [class.invalid]="message.touched && message.invalid"
                ></textarea>
              </div>

              <div class="form-actions">
                <button class="btn-submit" type="submit" [disabled]="sending()">
                  @if (sending()) {
                    ĐANG GỬI...
                  } @else {
                    GỬI LIÊN HỆ
                  }
                </button>
              </div>

              <div class="form-status" aria-live="polite">
                @if (serverError()) {
                  <p class="error">{{ serverError() }}</p>
                }
                @if (sent()) {
                  <p class="success">Cảm ơn bạn! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p>
                }
              </div>
            </form>
          </div>

          <aside class="info-col" aria-label="Thông tin liên hệ">
            <h2 class="section-title">THÔNG TIN LIÊN HỆ</h2>
            <div class="info-layout">
              <ul class="info-list">
                <li>
                  <span class="info-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M12 21s-7-4.5-7-10a7 7 0 1114 0c0 5.5-7 10-7 10z"/>
                      <circle cx="12" cy="11" r="2.5"/>
                    </svg>
                  </span>
                  <div>
                    <strong>Địa chỉ</strong>
                    <p>123 Đường ABC, Phường XYZ,<br />Quận 1, TP. Hồ Chí Minh</p>
                  </div>
                </li>
                <li>
                  <span class="info-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                    </svg>
                  </span>
                  <div>
                    <strong>Số điện thoại</strong>
                    <p><a href="tel:0901234567">0901 234 567</a></p>
                  </div>
                </li>
                <li>
                  <span class="info-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M4 4h16v16H4z"/><path d="M4 8l8 6 8-6"/>
                    </svg>
                  </span>
                  <div>
                    <strong>Email</strong>
                    <p><a href="mailto:support@mochome.vn">support@mochome.vn</a></p>
                  </div>
                </li>
                <li>
                  <span class="info-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
                    </svg>
                  </span>
                  <div>
                    <strong>Giờ làm việc</strong>
                    <p>Thứ 2 - Thứ 7: 8:00 - 17:30</p>
                    <p>Chủ nhật: 8:30 - 12:00</p>
                  </div>
                </li>
              </ul>

              <div class="map-col">
                <div class="map-wrap">
                  <iframe
                    title="Bản đồ Mộc Home"
                    [src]="mapUrlSafe"
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
                <a class="btn-directions" [href]="mapLink" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                    <path d="M15 3h6v6M10 14L21 3"/>
                  </svg>
                  CHỈ ĐƯỜNG
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section class="highlights" aria-label="Cam kết dịch vụ">
        <div class="container highlights-grid">
          @for (item of highlights; track item.title) {
            <div class="highlight-item">
              <span class="highlight-icon" [innerHTML]="item.icon"></span>
              <div>
                <strong>{{ item.title }}</strong>
                <span>{{ item.sub }}</span>
              </div>
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .contact-page {
        background: #fff;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1.25rem;
      }

      /* Hero */
      .hero {
        background: #e8e8e8;
        border-bottom: 1px solid #ddd;
        padding: 2rem 0 2.25rem;
      }

      .hero-grid {
        display: grid;
        grid-template-columns: 180px 1fr auto;
        align-items: center;
        gap: 1rem 1.5rem;
        min-height: 140px;
      }

      .hero-art {
        display: flex;
        align-items: flex-end;
        justify-content: flex-start;
      }

      .hero-art svg {
        width: 160px;
        height: auto;
      }

      .hero-center {
        text-align: center;
      }

      .hero-center h1 {
        margin: 0;
        font-size: clamp(1.35rem, 2.5vw, 1.75rem);
        font-weight: 700;
        letter-spacing: 0.06em;
        color: #1a1d21;
      }

      .hero-sub {
        margin: 0.5rem 0 0;
        font-size: 0.875rem;
        color: #6b7280;
      }

      .breadcrumb {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.35rem;
        font-size: 0.75rem;
        color: #9ca3af;
        align-self: start;
        padding-top: 0.25rem;
      }

      .breadcrumb a:hover {
        color: #1a1d21;
      }

      .breadcrumb .current {
        color: #6b7280;
      }

      /* Main */
      .main-section {
        padding: 2.5rem 0 3rem;
        background: #fff;
      }

      .main-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 3rem 2.5rem;
        align-items: start;
      }

      .section-title {
        margin: 0 0 1.25rem;
        font-size: 0.8125rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        color: #1a1d21;
      }

      .form-row--2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .field label {
        display: block;
        margin-bottom: 0.35rem;
        font-size: 0.8125rem;
        font-weight: 500;
        color: #374151;
      }

      .req {
        color: #1a1d21;
      }

      .field input,
      .field select,
      .field textarea {
        width: 100%;
        padding: 0.6rem 0.7rem;
        border: 1px solid #d1d5db;
        border-radius: 2px;
        font-size: 0.875rem;
        color: #1a1d21;
        background: #fff;
      }

      .field input::placeholder,
      .field textarea::placeholder {
        color: #9ca3af;
      }

      .field input:focus,
      .field select:focus,
      .field textarea:focus {
        outline: none;
        border-color: #6b7280;
      }

      .field input.invalid,
      .field textarea.invalid {
        border-color: #dc2626;
      }

      .field--full {
        margin-bottom: 1.25rem;
      }

      .field textarea {
        resize: vertical;
        min-height: 160px;
      }

      .form-actions {
        margin-top: 0.25rem;
      }

      .btn-submit {
        display: inline-block;
        padding: 0.7rem 1.75rem;
        border: none;
        border-radius: 2px;
        background: #2d2d2d;
        color: #fff;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        cursor: pointer;
      }

      .btn-submit:hover:not(:disabled) {
        background: #1a1d21;
      }

      .btn-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .form-status {
        margin-top: 0.75rem;
      }

      .error {
        margin: 0;
        font-size: 0.8125rem;
        color: #b91c1c;
      }

      .success {
        margin: 0;
        font-size: 0.8125rem;
        color: #166534;
      }

      /* Info + map side by side */
      .info-layout {
        display: grid;
        grid-template-columns: 1fr 200px;
        gap: 1.25rem;
        align-items: start;
      }

      .info-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .info-list li {
        display: flex;
        gap: 0.65rem;
        margin-bottom: 1.1rem;
      }

      .info-icon {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        display: grid;
        place-items: center;
        color: #6b7280;
      }

      .info-icon svg {
        width: 18px;
        height: 18px;
      }

      .info-list strong {
        display: block;
        font-size: 0.8125rem;
        font-weight: 700;
        color: #1a1d21;
        margin-bottom: 0.2rem;
      }

      .info-list p {
        margin: 0;
        font-size: 0.8125rem;
        color: #6b7280;
        line-height: 1.5;
      }

      .info-list a {
        color: #374151;
      }

      .map-col {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .map-wrap {
        flex: 1;
        min-height: 200px;
        border: 1px solid #e0e0e0;
        border-radius: 2px;
        overflow: hidden;
        background: #e8e8e8;
      }

      .map-wrap iframe {
        width: 100%;
        height: 100%;
        min-height: 200px;
        border: 0;
        display: block;
      }

      .btn-directions {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        width: 100%;
        padding: 0.55rem 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 2px;
        background: #fff;
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        color: #374151;
      }

      .btn-directions svg {
        width: 12px;
        height: 12px;
      }

      .btn-directions:hover {
        border-color: #9ca3af;
        background: #fafafa;
      }

      /* Highlights */
      .highlights {
        background: #f0f0f0;
        border-top: 1px solid #e5e5e5;
        padding: 1.75rem 0 2rem;
      }

      .highlights-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.5rem;
      }

      .highlight-item {
        display: flex;
        align-items: flex-start;
        gap: 0.65rem;
      }

      .highlight-icon {
        flex-shrink: 0;
        color: #6b7280;
      }

      .highlight-icon :deep(svg) {
        width: 26px;
        height: 26px;
      }

      .highlight-item strong {
        display: block;
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.03em;
        color: #1a1d21;
        line-height: 1.35;
      }

      .highlight-item span {
        display: block;
        font-size: 0.75rem;
        color: #6b7280;
        margin-top: 0.15rem;
      }

      @media (max-width: 960px) {
        .hero-grid {
          grid-template-columns: 1fr;
          text-align: center;
        }

        .hero-art {
          justify-content: center;
          order: 2;
        }

        .hero-center {
          order: 1;
        }

        .breadcrumb {
          order: 0;
          justify-content: center;
          align-self: center;
        }

        .main-grid {
          grid-template-columns: 1fr;
          gap: 2.5rem;
        }

        .info-layout {
          grid-template-columns: 1fr;
        }

        .map-col {
          max-width: 320px;
        }

        .highlights-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 560px) {
        .form-row--2 {
          grid-template-columns: 1fr;
        }

        .highlights-grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class ContactComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PublicApiService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly sanitizer = inject(DomSanitizer);

  readonly subjectOptions = SUBJECT_OPTIONS;
  readonly sending = signal(false);
  readonly sent = signal(false);
  readonly serverError = signal('');

  readonly highlights = [
    {
      title: 'TƯ VẤN MIỄN PHÍ',
      sub: 'Hỗ trợ 24/7',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z"/></svg>`
    },
    {
      title: 'GIAO HÀNG TOÀN QUỐC',
      sub: 'Nhanh chóng, an toàn',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 3h15v13H1zM16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`
    },
    {
      title: 'BẢO HÀNH DÀI HẠN',
      sub: 'Lên đến 5 năm',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
    },
    {
      title: 'ĐỔI TRẢ DỄ DÀNG',
      sub: 'Trong 7 ngày',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`
    }
  ];

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    subject: [''],
    message: ['', [Validators.required, Validators.minLength(10)]]
  });

  mapUrl =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.954!2d106.701!3d10.7769!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752a4139c8d0b1%3A0x9b8f3c8e8e8e8e8e!2zSOG7jWMgQ2jDrSBNaW5o!5e0!3m2!1svi!2s!4v1';
  mapUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.mapUrl);
  mapLink = 'https://www.google.com/maps/search/?api=1&query=123+Duong+ABC+Quan+1+Ho+Chi+Minh';

  get fullName() {
    return this.form.controls.fullName;
  }
  get email() {
    return this.form.controls.email;
  }
  get message() {
    return this.form.controls.message;
  }

  constructor() {
    this.title.setTitle('Liên hệ — Mộc Home');
    this.meta.updateTag({
      name: 'description',
      content: 'Liên hệ Mộc Home — gửi tin nhắn, tư vấn và hỗ trợ khách hàng.'
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.sending.set(true);
    this.serverError.set('');

    const phone = (this.form.value.phone ?? '').trim();
    const subject = (this.form.value.subject ?? '').trim();
    let message = (this.message.value ?? '') as string;
    if (phone) {
      message = `SĐT: ${phone}\n\n${message}`;
    }
    if (subject) {
      const label = SUBJECT_OPTIONS.find((o) => o.value === subject)?.label ?? subject;
      message = `Chủ đề: ${label}\n\n${message}`;
    }

    const payload = {
      fullName: (this.fullName.value ?? '') as string,
      email: (this.email.value ?? '') as string,
      subject: subject || undefined,
      message
    };

    this.api.postContact(payload).subscribe({
      next: () => {
        this.sending.set(false);
        this.sent.set(true);
        this.form.reset();
        setTimeout(() => this.sent.set(false), 5000);
      },
      error: (err: { error?: { message?: string } }) => {
        this.sending.set(false);
        this.serverError.set(err?.error?.message || 'Lỗi khi gửi. Vui lòng thử lại sau.');
      }
    });
  }
}
