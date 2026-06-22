import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { VoucherCartService } from '../../core/services/voucher-cart.service';
import { StoreAuthService } from '../../core/services/store-auth.service';
import { StoreOrderService, StoreOrderResult } from '../../core/services/store-order.service';
import { ApiService } from '../../core/services/api.service';
import { StoreVoucherInputComponent } from '../../shared/store-voucher-input/store-voucher-input.component';

type PaymentMethod = 'cod' | 'vnpay' | 'momo';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, DecimalPipe, StoreVoucherInputComponent],
  template: `
    <div class="store-page checkout-page">
      <div class="store-container">
        @if (successOrder(); as order) {
          <div class="store-card checkout-success">
            <div class="success-icon" aria-hidden="true">✓</div>
            <h1>Đặt hàng thành công</h1>
            <p>
              Mã đơn hàng: <strong>{{ order.orderCode }}</strong>
            </p>
            <p class="success-meta">
              Tổng thanh toán: <strong>{{ order.totalAmount | number }} đ</strong>
              · {{ paymentLabel(order.paymentMethod) }}
            </p>
            <p class="success-hint">
              Chúng tôi sẽ liên hệ qua số điện thoại để xác nhận đơn. Cảm ơn bạn đã mua tại MỘC HOME.
            </p>
            <div class="success-actions">
              <a routerLink="/" class="store-btn store-btn-primary">Về trang chủ</a>
              <a routerLink="/tai-khoan" class="store-btn store-btn-outline">Tài khoản</a>
            </div>
          </div>
        } @else {
          <header class="store-page-head">
            <div>
              <nav class="store-breadcrumb" aria-label="Đường dẫn">
                <a routerLink="/">Trang chủ</a>
                <span aria-hidden="true">›</span>
                <a routerLink="/gio-hang">Giỏ hàng</a>
                <span aria-hidden="true">›</span>
                <span>Thanh toán</span>
              </nav>
              <h1>Thanh toán</h1>
              <p>Hoàn tất thông tin giao hàng và phương thức thanh toán</p>
            </div>
          </header>

          @if (submitError()) {
            <div class="checkout-alert error">{{ submitError() }}</div>
          }

          <form class="checkout-layout" [formGroup]="form" (ngSubmit)="placeOrder()">
            <div class="checkout-main">
              <section class="store-card checkout-section">
                <h2>Thông tin giao hàng</h2>
                <div class="field-grid">
                  <label class="store-field">
                    <span>Họ tên người nhận <em>*</em></span>
                    <input type="text" formControlName="receiverName" placeholder="Nguyễn Văn A" />
                  </label>
                  <label class="store-field">
                    <span>Số điện thoại <em>*</em></span>
                    <input type="tel" formControlName="receiverPhone" placeholder="09xxxxxxxx" />
                  </label>
                </div>
                <label class="store-field">
                  <span>Địa chỉ giao hàng <em>*</em></span>
                  <textarea
                    formControlName="shippingAddress"
                    rows="3"
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  ></textarea>
                </label>
                <label class="store-field">
                  <span>Ghi chú đơn hàng</span>
                  <textarea formControlName="note" rows="2" placeholder="Giao giờ hành chính, gọi trước khi giao..."></textarea>
                </label>
              </section>

              <section class="store-card checkout-section">
                <h2>Phương thức thanh toán</h2>
                <div class="pay-options">
                  <label class="pay-option" [class.selected]="payment() === 'cod'">
                    <input type="radio" value="cod" formControlName="paymentMethod" />
                    <div>
                      <strong>Thanh toán khi nhận hàng (COD)</strong>
                      <span>Thanh toán tiền mặt khi nhận hàng</span>
                    </div>
                  </label>
                  <label class="pay-option" [class.selected]="payment() === 'vnpay'">
                    <input type="radio" value="vnpay" formControlName="paymentMethod" />
                    <div>
                      <strong>VNPay</strong>
                      <span>Chuyển hướng cổng thanh toán (demo)</span>
                    </div>
                  </label>
                  <label class="pay-option" [class.selected]="payment() === 'momo'">
                    <input type="radio" value="momo" formControlName="paymentMethod" />
                    <div>
                      <strong>Ví MoMo</strong>
                      <span>Quét mã / ví điện tử (demo)</span>
                    </div>
                  </label>
                </div>
              </section>

              <section class="store-card checkout-section">
                <h2>Sản phẩm ({{ cart.cartItems().length }})</h2>
                <ul class="checkout-lines">
                  @for (item of cart.cartItems(); track trackKey(item)) {
                    <li>
                      @if (item.imageUrl) {
                        <img [src]="item.imageUrl" [alt]="item.name" />
                      } @else {
                        <span class="img-ph"></span>
                      }
                      <div class="line-info">
                        <span class="line-name">{{ item.name }}</span>
                        @if (item.color || item.size) {
                          <span class="line-variant">{{ item.color }} {{ item.size }}</span>
                        }
                        <span class="line-qty">{{ item.quantity }} × {{ item.price | number }} đ</span>
                      </div>
                      <strong class="line-total">{{ item.price * item.quantity | number }} đ</strong>
                    </li>
                  }
                </ul>
              </section>
            </div>

            <aside class="store-card checkout-summary">
              <h2>Tóm tắt</h2>

              <div class="voucher-box">
                <label class="voucher-label">Mã giảm giá</label>
                <div class="voucher-row">
                  <app-store-voucher-input
                    [code]="voucherCode"
                    [applying]="voucherApplying()"
                    (codeChange)="voucherCode = $event"
                    (apply)="applyVoucher()"
                  />
                  <button
                    type="button"
                    class="store-btn store-btn-outline"
                    [disabled]="voucherApplying()"
                    (click)="applyVoucher()"
                  >
                    Áp dụng
                  </button>
                </div>
                @if (voucherMsg()) {
                  <p class="voucher-msg" [class.error]="voucherError()">{{ voucherMsg() }}</p>
                }
                @if (voucherCart.applied(); as v) {
                  <div class="voucher-applied">
                    <span>{{ v.code }}</span>
                    <button type="button" (click)="removeVoucher()">×</button>
                  </div>
                }
              </div>

              <div class="sum-row">
                <span>Tạm tính</span>
                <span>{{ cart.total() | number }} đ</span>
              </div>
              @if (discount() > 0) {
                <div class="sum-row discount">
                  <span>Giảm giá</span>
                  <span>−{{ discount() | number }} đ</span>
                </div>
              }
              <div class="sum-row muted">
                <span>Phí vận chuyển</span>
                <span>Miễn phí (nội thành)</span>
              </div>
              <div class="sum-row total">
                <span>Tổng thanh toán</span>
                <strong>{{ grandTotal() | number }} đ</strong>
              </div>

              <button type="submit" class="store-btn store-btn-primary submit-btn" [disabled]="submitting()">
                {{ submitting() ? 'Đang xử lý...' : 'Đặt hàng' }}
              </button>
              <a routerLink="/gio-hang" class="back-link">← Quay lại giỏ hàng</a>
            </aside>
          </form>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .checkout-layout {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: 1.25rem;
        align-items: start;
      }

      @media (max-width: 900px) {
        .checkout-layout {
          grid-template-columns: 1fr;
        }
      }

      .checkout-section {
        padding: 1.25rem;
        margin-bottom: 1rem;
      }

      .checkout-section h2 {
        margin: 0 0 1rem;
        font-size: 1rem;
        font-weight: 700;
      }

      .field-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }

      @media (max-width: 640px) {
        .field-grid {
          grid-template-columns: 1fr;
        }
      }

      .store-field {
        display: block;
        margin-bottom: 0.85rem;
      }

      .store-field span {
        display: block;
        margin-bottom: 0.35rem;
        font-size: 0.8125rem;
        font-weight: 500;
        color: #374151;
      }

      .store-field em {
        color: #dc2626;
        font-style: normal;
      }

      .store-field input,
      .store-field textarea {
        width: 100%;
        padding: 0.55rem 0.75rem;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        font-size: 0.875rem;
        box-sizing: border-box;
      }

      .store-field input:focus,
      .store-field textarea:focus {
        outline: none;
        border-color: #9ca3af;
        box-shadow: 0 0 0 3px rgba(92, 64, 51, 0.1);
      }

      .pay-options {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .pay-option {
        display: flex;
        gap: 0.75rem;
        padding: 0.85rem 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s;
      }

      .pay-option.selected {
        border-color: #5c4033;
        background: #faf8f6;
      }

      .pay-option input {
        margin-top: 0.2rem;
      }

      .pay-option strong {
        display: block;
        font-size: 0.875rem;
      }

      .pay-option span {
        font-size: 0.75rem;
        color: #6b7280;
      }

      .checkout-lines {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .checkout-lines li {
        display: grid;
        grid-template-columns: 56px 1fr auto;
        gap: 0.75rem;
        align-items: center;
        padding: 0.65rem 0;
        border-bottom: 1px solid #f0f2f5;
      }

      .checkout-lines li:last-child {
        border-bottom: none;
      }

      .checkout-lines img,
      .checkout-lines .img-ph {
        width: 56px;
        height: 56px;
        object-fit: cover;
        border-radius: 6px;
        border: 1px solid #e4e7ec;
      }

      .checkout-lines .img-ph {
        display: block;
        background: #f3f4f6;
      }

      .line-name {
        display: block;
        font-weight: 600;
        font-size: 0.875rem;
      }

      .line-variant,
      .line-qty {
        display: block;
        font-size: 0.75rem;
        color: #9ca3af;
      }

      .line-total {
        font-size: 0.875rem;
        white-space: nowrap;
      }

      .checkout-summary {
        padding: 1.25rem;
        position: sticky;
        top: 1rem;
      }

      .checkout-summary h2 {
        margin: 0 0 1rem;
        font-size: 1rem;
      }

      .voucher-box {
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
      }

      .voucher-label {
        display: block;
        font-size: 0.75rem;
        font-weight: 600;
        margin-bottom: 0.35rem;
        color: #6b7280;
      }

      .voucher-row {
        display: flex;
        gap: 0.35rem;
      }

      .voucher-row app-store-voucher-input {
        flex: 1;
        min-width: 0;
      }

      .voucher-row .store-btn {
        flex-shrink: 0;
        padding: 0.45rem 0.65rem;
        font-size: 0.75rem;
      }

      .voucher-msg {
        margin: 0.35rem 0 0;
        font-size: 0.75rem;
        color: #047857;
      }

      .voucher-msg.error {
        color: #b91c1c;
      }

      .voucher-applied {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 0.5rem;
        padding: 0.4rem 0.5rem;
        background: #ecfdf5;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .voucher-applied button {
        border: none;
        background: none;
        cursor: pointer;
        font-size: 1rem;
        color: #6b7280;
      }

      .sum-row {
        display: flex;
        justify-content: space-between;
        padding: 0.4rem 0;
        font-size: 0.875rem;
      }

      .sum-row.muted {
        color: #9ca3af;
        font-size: 0.8125rem;
      }

      .sum-row.discount span:last-child {
        color: #047857;
      }

      .sum-row.total {
        margin-top: 0.5rem;
        padding-top: 0.75rem;
        border-top: 1px solid #e5e7eb;
        font-size: 1rem;
      }

      .submit-btn {
        width: 100%;
        margin-top: 1rem;
      }

      .back-link {
        display: block;
        margin-top: 0.75rem;
        text-align: center;
        font-size: 0.8125rem;
        color: #6b7280;
      }

      .checkout-alert {
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        font-size: 0.875rem;
      }

      .checkout-alert.error {
        background: #fef2f2;
        color: #b91c1c;
        border: 1px solid #fecaca;
      }

      .checkout-success {
        max-width: 520px;
        margin: 2rem auto;
        padding: 2rem;
        text-align: center;
      }

      .success-icon {
        width: 56px;
        height: 56px;
        margin: 0 auto 1rem;
        border-radius: 50%;
        background: #ecfdf5;
        color: #047857;
        font-size: 1.75rem;
        line-height: 56px;
        font-weight: 700;
      }

      .checkout-success h1 {
        margin: 0 0 0.5rem;
        font-size: 1.35rem;
      }

      .success-meta {
        color: #6b7280;
        font-size: 0.9375rem;
      }

      .success-hint {
        margin: 1rem 0 1.5rem;
        font-size: 0.875rem;
        color: #6b7280;
      }

      .success-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        flex-wrap: wrap;
      }
    `
  ]
})
export class CheckoutComponent implements OnInit {
  readonly cart = inject(CartService);
  readonly voucherCart = inject(VoucherCartService);
  readonly storeAuth = inject(StoreAuthService);
  readonly orders = inject(StoreOrderService);
  readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly submitting = signal(false);
  readonly submitError = signal('');
  readonly successOrder = signal<StoreOrderResult | null>(null);
  readonly voucherApplying = signal(false);
  readonly voucherMsg = signal('');
  readonly voucherError = signal(false);

  voucherCode = '';

  readonly discount = computed(() => this.voucherCart.applied()?.discountAmount ?? 0);
  readonly grandTotal = computed(() => Math.max(0, this.cart.total() - this.discount()));

  form = this.fb.group({
    receiverName: ['', Validators.required],
    receiverPhone: ['', [Validators.required, Validators.pattern(/^0\d{8,10}$/)]],
    shippingAddress: ['', Validators.required],
    note: [''],
    paymentMethod: ['cod' as PaymentMethod, Validators.required]
  });

  payment = () => this.form.get('paymentMethod')?.value as PaymentMethod;

  ngOnInit(): void {
    if (!this.cart.cartItems().length) {
      this.router.navigate(['/gio-hang']);
      return;
    }

    const user = this.storeAuth.getUser();
    if (user) {
      this.form.patchValue({
        receiverName: user.fullName,
        receiverPhone: user.phone || ''
      });
    }

    const applied = this.voucherCart.applied();
    if (applied) {
      this.voucherCode = applied.code;
      this.revalidateVoucher();
    }
  }

  private revalidateVoucher(): void {
    const applied = this.voucherCart.applied();
    if (!applied) return;

    const userId = this.storeAuth.getUser()?.id ?? null;
    this.api.validateVoucher(applied.code, this.cart.total(), userId).subscribe({
      next: (res) => {
        this.voucherCart.setApplied({
          code: res.voucher.code,
          name: res.voucher.name,
          discountAmount: res.discountAmount
        });
      },
      error: (err) => {
        this.voucherCart.clear();
        this.voucherCode = '';
        this.voucherMsg.set(err?.error?.message || 'Mã giảm giá không còn hợp lệ.');
        this.voucherError.set(true);
      }
    });
  }

  trackKey(item: { productId: string; color?: string; size?: string }): string {
    return `${item.productId}-${item.color}-${item.size}`;
  }

  applyVoucher(): void {
    const code = this.voucherCode.trim();
    if (!code) return;

    this.voucherApplying.set(true);
    this.voucherMsg.set('');
    this.voucherError.set(false);

    const userId = this.storeAuth.getUser()?.id ?? null;

    this.api.validateVoucher(code, this.cart.total(), userId).subscribe({
      next: (res) => {
        this.voucherCart.setApplied({
          code: res.voucher.code,
          name: res.voucher.name,
          discountAmount: res.discountAmount
        });
        this.voucherMsg.set('Đã áp dụng mã giảm giá.');
        this.voucherApplying.set(false);
      },
      error: (err) => {
        this.voucherCart.clear();
        this.voucherMsg.set(err?.error?.message || 'Mã không hợp lệ.');
        this.voucherError.set(true);
        this.voucherApplying.set(false);
      }
    });
  }

  removeVoucher(): void {
    this.voucherCart.clear();
    this.voucherCode = '';
    this.voucherMsg.set('');
  }

  placeOrder(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.submitError.set('Vui lòng điền đầy đủ thông tin giao hàng hợp lệ.');
      return;
    }

    this.submitting.set(true);
    this.submitError.set('');

    const v = this.form.getRawValue();
    const applied = this.voucherCart.applied();

    this.orders
      .placeOrder({
        items: this.cart.cartItems().map((i) => ({
          productId: i.productId,
          quantity: i.quantity
        })),
        receiverName: v.receiverName!,
        receiverPhone: v.receiverPhone!,
        shippingAddress: v.shippingAddress!,
        paymentMethod: v.paymentMethod!,
        note: v.note || '',
        voucherCode: applied?.code
      })
      .subscribe({
        next: (res) => {
          this.cart.clear();
          this.voucherCart.clear();
          this.successOrder.set(res.order);
          this.submitting.set(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (err) => {
          this.submitting.set(false);
          this.submitError.set(err?.error?.message || 'Không thể đặt hàng. Vui lòng thử lại.');
        }
      });
  }

  paymentLabel(method: string): string {
    const m = String(method || '').toLowerCase();
    if (m === 'vnpay') return 'VNPay';
    if (m === 'momo') return 'MoMo';
    return 'Thanh toán khi nhận hàng';
  }
}
