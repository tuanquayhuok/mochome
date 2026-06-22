import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { VoucherRow } from '../../core/models/admin-list.models';
import { PriceFormatDirective } from '../../shared/directives/price-format.directive';

@Component({
  selector: 'app-promotion-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PriceFormatDirective],
  template: `
    <div class="promo-form-page">
      <header class="form-page-head">
        <nav class="catalog-crumbs" aria-label="Breadcrumb">
          <a routerLink="/admin/dashboard">Trang chủ</a>
          <span class="sep">›</span>
          <a routerLink="/admin/promotions/vouchers">Mã giảm giá</a>
          <span class="sep">›</span>
          <span class="current">{{ pageTitle() }}</span>
        </nav>
        <h1>{{ pageTitle() }}</h1>
      </header>

      @if (loadError()) {
        <div class="form-alert error">{{ loadError() }}</div>
      }
      @if (saveError()) {
        <div class="form-alert error">{{ saveError() }}</div>
      }

      <form class="form-layout" (ngSubmit)="submit()">
        <div class="form-main">
          <section class="form-card">
            <h2 class="card-title">Thông tin mã giảm giá</h2>

            <div class="field-row field-row--2">
              <label class="field">
                <span class="label">Mã voucher <em>*</em></span>
                <input
                  type="text"
                  name="code"
                  [(ngModel)]="code"
                  (ngModelChange)="onCodeChange($event)"
                  placeholder="VD: MOCHOME10"
                  required
                  [readonly]="!!voucherId"
                />
                <span class="hint">Mã in hoa, không dấu. Không đổi mã sau khi tạo.</span>
              </label>
              <label class="field">
                <span class="label">Tên chương trình <em>*</em></span>
                <input type="text" name="name" [(ngModel)]="name" placeholder="VD: Giảm 10% đơn từ 1 triệu" required />
              </label>
            </div>

            <label class="field">
              <span class="label">Mô tả</span>
              <textarea name="description" [(ngModel)]="description" rows="2" placeholder="Ghi chú nội bộ / hiển thị khách..."></textarea>
            </label>
          </section>

          <section class="form-card">
            <h2 class="card-title">Cách giảm giá</h2>

            <div class="field-row field-row--2">
              <label class="field">
                <span class="label">Loại giảm <em>*</em></span>
                <select name="discountType" [(ngModel)]="discountType">
                  <option value="percent">Giảm theo % trên giá đơn</option>
                  <option value="fixed">Giảm số tiền cố định (đ)</option>
                </select>
              </label>
              <label class="field">
                <span class="label">{{ discountType === 'percent' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (đ)' }} <em>*</em></span>
                @if (discountType === 'percent') {
                  <input type="number" name="discountValue" [(ngModel)]="discountValue" min="1" max="100" required />
                } @else {
                  <input type="text" inputmode="numeric" appPriceFormat name="discountValue" [(ngModel)]="discountValue" placeholder="0" required />
                }
              </label>
            </div>

            <div class="field-row field-row--2">
              <label class="field">
                <span class="label">Đơn hàng tối thiểu (đ)</span>
                <input type="text" inputmode="numeric" appPriceFormat name="minOrderAmount" [(ngModel)]="minOrderAmount" />
                <span class="hint">Giá trị đơn đạt mức này mới được áp dụng mã.</span>
              </label>
              @if (discountType === 'percent') {
                <label class="field">
                  <span class="label">Giảm tối đa (đ)</span>
                  <input type="text" inputmode="numeric" appPriceFormat name="maxDiscountAmount" [(ngModel)]="maxDiscountAmount" />
                  <span class="hint">0 = không giới hạn số tiền giảm.</span>
                </label>
              }
            </div>

            @if (previewSubtotal > 0) {
              <div class="preview-box">
                <strong>Ví dụ:</strong> Đơn {{ previewSubtotal | number }}đ → giảm khoảng
                <strong>{{ previewDiscount() | number }}đ</strong>
              </div>
            }
          </section>

          <section class="form-card">
            <h2 class="card-title">Đối tượng & giới hạn</h2>

            <label class="field checkbox-field highlight">
              <input type="checkbox" name="firstOrderOnly" [(ngModel)]="firstOrderOnly" />
              <span>
                <strong>Chỉ khách mua lần đầu</strong>
                — Khách đã có đơn hàng (trừ đơn hủy) sẽ không dùng được mã này.
              </span>
            </label>

            <div class="field-row field-row--2">
              <label class="field">
                <span class="label">Giới hạn lượt dùng</span>
                <input type="number" name="usageLimit" [(ngModel)]="usageLimit" min="0" />
                <span class="hint">0 = không giới hạn tổng lượt dùng.</span>
              </label>
              @if (voucherId) {
                <label class="field">
                  <span class="label">Đã sử dụng</span>
                  <input type="number" name="usedCount" [(ngModel)]="usedCount" min="0" />
                </label>
              }
            </div>
          </section>
        </div>

        <aside class="form-side">
          <section class="form-card">
            <h2 class="card-title">Thời gian & trạng thái</h2>

            <label class="field">
              <span class="label">Ngày bắt đầu</span>
              <input type="date" name="startDate" [(ngModel)]="startDateLocal" />
            </label>
            <label class="field">
              <span class="label">Ngày kết thúc</span>
              <input type="date" name="endDate" [(ngModel)]="endDateLocal" />
            </label>

            <label class="field checkbox-field">
              <input type="checkbox" name="isActive" [(ngModel)]="isActive" />
              <span>Đang hoạt động</span>
            </label>

            <label class="field checkbox-field highlight-picker">
              <input type="checkbox" name="showInStorePicker" [(ngModel)]="showInStorePicker" />
              <span>
                <strong>Hiển thị trên cửa hàng</strong>
                — Xuất hiện trong danh sách chọn mã (mũi tên) ở giỏ hàng & thanh toán.
              </span>
            </label>

            <label class="field">
              <span class="label">Thử tính trên đơn (đ)</span>
              <input type="text" inputmode="numeric" appPriceFormat [(ngModel)]="previewSubtotal" name="previewSubtotal" />
            </label>

            <div class="side-actions">
              <button type="submit" class="btn-action primary" [disabled]="saving()">
                {{ saving() ? 'Đang lưu...' : voucherId ? 'Cập nhật voucher' : 'Tạo voucher' }}
              </button>
              <a routerLink="/admin/promotions/vouchers" class="btn-action ghost">Hủy</a>
            </div>
          </section>
        </aside>
      </form>
    </div>
  `,
  styles: [
    `
      .promo-form-page {
        width: 100%;
        padding-bottom: 3rem;
      }

      .form-page-head h1 {
        margin: 0.35rem 0 0;
        font-size: 1.35rem;
        font-weight: 600;
      }

      .catalog-crumbs {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        font-size: 0.8125rem;
        color: var(--muted);
      }

      .catalog-crumbs a {
        color: var(--muted);
        text-decoration: none;
      }

      .catalog-crumbs a:hover {
        color: var(--text);
      }

      .catalog-crumbs .current {
        color: var(--text);
      }

      .sep {
        opacity: 0.5;
      }

      .form-layout {
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: 1rem;
        align-items: start;
      }

      @media (max-width: 900px) {
        .form-layout {
          grid-template-columns: 1fr;
        }
      }

      .form-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 1.25rem;
        margin-bottom: 1rem;
      }

      .card-title {
        margin: 0 0 1rem;
        font-size: 0.9375rem;
        font-weight: 600;
      }

      .field {
        display: block;
        margin-bottom: 1rem;
      }

      .field-row {
        display: grid;
        gap: 0.75rem;
      }

      .field-row--2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      @media (max-width: 640px) {
        .field-row--2 {
          grid-template-columns: 1fr;
        }
      }

      .label {
        display: block;
        margin-bottom: 0.35rem;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--text-secondary);
      }

      .label em {
        color: #dc2626;
        font-style: normal;
      }

      .field input,
      .field select,
      .field textarea {
        width: 100%;
        padding: 0.55rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 0.8125rem;
        background: var(--surface);
      }

      .hint {
        display: block;
        margin-top: 0.35rem;
        font-size: 0.75rem;
        color: var(--muted);
      }

      .checkbox-field {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        font-size: 0.8125rem;
      }

      .checkbox-field input {
        width: auto;
        margin-top: 0.2rem;
      }

      .checkbox-field.highlight {
        padding: 0.75rem;
        border-radius: 8px;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
      }

      .checkbox-field.highlight-picker {
        padding: 0.75rem;
        border-radius: 8px;
        background: #fffbeb;
        border: 1px solid #fde68a;
      }

      .preview-box {
        padding: 0.75rem 1rem;
        border-radius: 8px;
        background: #fafbfc;
        border: 1px solid var(--border);
        font-size: 0.8125rem;
      }

      .side-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .btn-action.ghost {
        text-align: center;
        text-decoration: none;
        color: var(--muted);
      }

      .form-alert {
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        font-size: 0.8125rem;
      }

      .form-alert.error {
        background: #fef2f2;
        color: #b91c1c;
        border: 1px solid #fecaca;
      }
    `
  ]
})
export class PromotionFormComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  voucherId: string | null = null;

  code = '';
  name = '';
  description = '';
  discountType: 'percent' | 'fixed' = 'percent';
  discountValue = 10;
  minOrderAmount = 0;
  maxDiscountAmount = 0;
  firstOrderOnly = false;
  usageLimit = 0;
  usedCount = 0;
  startDateLocal = '';
  endDateLocal = '';
  isActive = true;
  showInStorePicker = false;
  previewSubtotal = 1000000;

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);

  readonly pageTitle = computed(() => (this.voucherId ? 'Sửa voucher' : 'Thêm voucher'));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.voucherId = id;
      this.load(id);
    }
  }

  onCodeChange(value: string): void {
    this.code = value.toUpperCase().replace(/\s+/g, '');
  }

  previewDiscount(): number {
    const sub = Number(this.previewSubtotal) || 0;
    let d = 0;
    if (this.discountType === 'percent') {
      d = Math.round((sub * (Number(this.discountValue) || 0)) / 100);
      if (this.maxDiscountAmount > 0) d = Math.min(d, this.maxDiscountAmount);
    } else {
      d = Math.round(Number(this.discountValue) || 0);
    }
    return Math.min(d, sub);
  }

  load(id: string): void {
    this.loading.set(true);
    this.api.get<VoucherRow>('vouchers', id).subscribe({
      next: (v) => {
        this.code = v.code;
        this.name = v.name;
        this.description = v.description || '';
        this.discountType = v.discountType;
        this.discountValue = v.discountValue;
        this.minOrderAmount = v.minOrderAmount ?? 0;
        this.maxDiscountAmount = v.maxDiscountAmount ?? 0;
        this.firstOrderOnly = Boolean(v.firstOrderOnly);
        this.usageLimit = v.usageLimit ?? 0;
        this.usedCount = v.usedCount ?? 0;
        this.startDateLocal = toLocalInput(v.startDate);
        this.endDateLocal = toLocalInput(v.endDate);
        this.isActive = v.isActive !== false;
        this.showInStorePicker = Boolean(v.showInStorePicker);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Không tải được voucher.');
        this.loading.set(false);
      }
    });
  }

  submit(): void {
    this.saveError.set(null);

    if (!this.code.trim() || !this.name.trim()) {
      this.saveError.set('Mã và tên chương trình là bắt buộc.');
      return;
    }
    if (!this.discountValue || this.discountValue <= 0) {
      this.saveError.set('Giá trị giảm phải lớn hơn 0.');
      return;
    }
    if (this.discountType === 'percent' && this.discountValue > 100) {
      this.saveError.set('Phần trăm giảm tối đa là 100%.');
      return;
    }
    if (Number(this.minOrderAmount) < 0) {
      this.saveError.set('Đơn hàng tối thiểu không được âm.');
      return;
    }
    if (this.discountType === 'percent' && Number(this.maxDiscountAmount) < 0) {
      this.saveError.set('Giảm tối đa không được âm.');
      return;
    }
    if (Number(this.usageLimit) < 0) {
      this.saveError.set('Giới hạn lượt dùng không được âm.');
      return;
    }
    if (this.discountType === 'fixed' && Number(this.discountValue) > (Number(this.minOrderAmount) || 0)) {
      this.saveError.set('Số tiền giảm cố định không được lớn hơn đơn hàng tối thiểu.');
      return;
    }
    if (this.startDateLocal && this.endDateLocal) {
      const start = new Date(this.startDateLocal);
      const end = new Date(this.endDateLocal);
      if (end < start) {
        this.saveError.set('Ngày kết thúc không được trước ngày bắt đầu.');
        return;
      }
    }

    const payload: Record<string, unknown> = {
      code: this.code.trim().toUpperCase(),
      name: this.name.trim(),
      description: this.description,
      discountType: this.discountType,
      discountValue: Number(this.discountValue),
      minOrderAmount: Number(this.minOrderAmount) || 0,
      maxDiscountAmount: this.discountType === 'percent' ? Number(this.maxDiscountAmount) || 0 : 0,
      firstOrderOnly: this.firstOrderOnly,
      usageLimit: Number(this.usageLimit) || 0,
      isActive: this.isActive,
      showInStorePicker: this.showInStorePicker,
      startDate: fromLocalInput(this.startDateLocal, false),
      endDate: fromLocalInput(this.endDateLocal, true)
    };

    if (this.voucherId) {
      payload['usedCount'] = Number(this.usedCount) || 0;
    }

    this.saving.set(true);

    const done = () => {
      this.saving.set(false);
      this.router.navigate(['/admin/promotions/vouchers']);
    };

    const onError = (err: unknown) => {
      this.saving.set(false);
      this.saveError.set(this.voucherSaveErrorMessage(err));
    };

    if (this.voucherId) {
      this.api.update<VoucherRow>('vouchers', this.voucherId, payload).subscribe({ next: done, error: onError });
    } else {
      this.api.create<VoucherRow>('vouchers', payload).subscribe({ next: done, error: onError });
    }
  }

  private voucherSaveErrorMessage(err: unknown): string {
    if (!(err instanceof HttpErrorResponse)) {
      return 'Không lưu được voucher.';
    }
    if (err.status === 0) {
      return 'Không kết nối được backend. Chạy: cd backend && npm start';
    }
    if (err.status === 404) {
      return 'API voucher chưa có (404). Tắt backend cũ trên cổng 5000 và chạy lại: cd backend && npm start';
    }
    if (err.status === 401 || err.status === 403) {
      return 'Phiên đăng nhập hết hạn hoặc không có quyền. Đăng nhập lại trang admin.';
    }
    return err.error?.message || 'Không lưu được voucher.';
  }
}

function toLocalInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fromLocalInput(local: string, isEnd = false): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  if (isEnd) {
    d.setHours(23, 59, 59, 999);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d.toISOString();
}
