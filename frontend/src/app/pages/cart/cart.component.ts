import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService, CartLine } from '../../core/services/cart.service';
import { ApiService } from '../../core/services/api.service';
import { StoreAuthService } from '../../core/services/store-auth.service';
import { VoucherCartService } from '../../core/services/voucher-cart.service';
import { StoreVoucherInputComponent } from '../../shared/store-voucher-input/store-voucher-input.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DecimalPipe, StoreVoucherInputComponent],
  template: `
    <div class="store-page cart-page">
      <div class="store-container">
        <header class="store-page-head">
          <div>
            <nav class="store-breadcrumb" aria-label="Đường dẫn">
              <a routerLink="/">Trang chủ</a>
              <span aria-hidden="true">›</span>
              <span>Giỏ hàng</span>
            </nav>
            <h1>Giỏ hàng</h1>
            <p>{{ cart.cartItems().length ? cart.cartItems().length + ' sản phẩm' : 'Giỏ hàng của bạn' }}</p>
          </div>
          <a routerLink="/san-pham" class="store-btn store-btn-outline store-page-head__actions">Tiếp tục mua</a>
        </header>

        @if (!cart.cartItems().length) {
          <div class="store-card store-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <path d="M3 6h18M16 10a4 4 0 01-8 0" />
            </svg>
            <p>Giỏ hàng của bạn đang trống.</p>
            <a routerLink="/san-pham" class="store-btn store-btn-primary">Xem sản phẩm</a>
          </div>
        } @else {
          <div class="cart-layout">
            <div class="store-card cart-list">
              <div class="cart-cards">
                @for (item of cart.cartItems(); track trackKey(item)) {
                  <article class="cart-line-card">
                    @if (item.imageUrl) {
                      <img [src]="item.imageUrl" [alt]="item.name" />
                    } @else {
                      <span class="img-ph"></span>
                    }
                    <div class="cart-line-card__body">
                      <a [routerLink]="['/san-pham', item.slug]" class="name">{{ item.name }}</a>
                      @if (item.color || item.size) {
                        <span class="variant">{{ item.color }} {{ item.size }}</span>
                      }
                      <div class="cart-line-card__row">
                        <div class="qty">
                          <button type="button" (click)="changeQty(item, -1)">−</button>
                          <span>{{ item.quantity }}</span>
                          <button type="button" (click)="changeQty(item, 1)">+</button>
                        </div>
                        <strong>{{ item.price * item.quantity | number }} đ</strong>
                      </div>
                      <button type="button" class="remove-link" (click)="remove(item)">Xóa</button>
                    </div>
                  </article>
                }
              </div>

              <div class="store-table-wrap cart-table-desktop">
                <table class="cart-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Đơn giá</th>
                      <th>Số lượng</th>
                      <th>Thành tiền</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of cart.cartItems(); track trackKey(item)) {
                      <tr>
                        <td>
                          <div class="cart-product">
                            @if (item.imageUrl) {
                              <img [src]="item.imageUrl" [alt]="item.name" />
                            } @else {
                              <span class="img-ph"></span>
                            }
                            <div>
                              <a [routerLink]="['/san-pham', item.slug]" class="name">{{ item.name }}</a>
                              @if (item.color || item.size) {
                                <span class="variant">{{ item.color }} {{ item.size }}</span>
                              }
                            </div>
                          </div>
                        </td>
                        <td>{{ item.price | number }} đ</td>
                        <td>
                          <div class="qty">
                            <button type="button" (click)="changeQty(item, -1)">−</button>
                            <span>{{ item.quantity }}</span>
                            <button type="button" (click)="changeQty(item, 1)">+</button>
                          </div>
                        </td>
                        <td class="line-total">{{ item.price * item.quantity | number }} đ</td>
                        <td>
                          <button type="button" class="remove-btn" (click)="remove(item)" title="Xóa">×</button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <aside class="store-card cart-summary">
              <h2>Tóm tắt đơn hàng</h2>

              <div class="voucher-box">
                <label class="voucher-label">Mã giảm giá</label>
                <div class="voucher-row">
                  <app-store-voucher-input
                    [code]="voucherCode"
                    [applying]="applying()"
                    (codeChange)="voucherCode = $event"
                    (apply)="applyVoucher()"
                  />
                  <button type="button" class="store-btn store-btn-outline" [disabled]="applying()" (click)="applyVoucher()">
                    {{ applying() ? '...' : 'Áp dụng' }}
                  </button>
                </div>
                @if (voucherMsg()) {
                  <p class="voucher-msg" [class.error]="voucherError()">{{ voucherMsg() }}</p>
                }
                @if (voucherCart.applied(); as v) {
                  <div class="voucher-applied">
                    <span>{{ v.code }} — giảm {{ v.discountAmount | number }}đ</span>
                    <button type="button" (click)="removeVoucher()">×</button>
                  </div>
                }
              </div>

              <div class="summary-row">
                <span>Tạm tính</span>
                <strong>{{ cart.total() | number }} đ</strong>
              </div>
              @if (discount() > 0) {
                <div class="summary-row discount">
                  <span>Giảm giá</span>
                  <strong>−{{ discount() | number }} đ</strong>
                </div>
              }
              <div class="summary-row muted">
                <span>Phí vận chuyển</span>
                <span>Tính khi thanh toán</span>
              </div>
              <div class="summary-row total">
                <span>Tổng cộng</span>
                <strong>{{ grandTotal() | number }} đ</strong>
              </div>
              <button type="button" class="store-btn store-btn-primary checkout-btn" (click)="goCheckout()">
                Tiến hành thanh toán
              </button>
              @if (!storeAuth.isLoggedIn()) {
                <p class="checkout-hint">Bạn cần đăng nhập để hoàn tất đơn hàng.</p>
              }
              <button type="button" class="clear-btn" (click)="clear()">Xóa giỏ hàng</button>
            </aside>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .cart-layout {
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: 1.25rem;
        align-items: start;
      }

      .cart-list {
        padding: 0.75rem;
      }

      .cart-table {
        width: 100%;
        border-collapse: collapse;
      }

      .cart-table th {
        padding: 0.75rem 1rem;
        text-align: left;
        font-size: 0.75rem;
        font-weight: 500;
        color: #6b7280;
        background: #fafafa;
        border-bottom: 1px solid #e4e7ec;
      }

      .cart-table td {
        padding: 1rem;
        border-bottom: 1px solid #f0f2f5;
        vertical-align: middle;
        font-size: 0.875rem;
      }

      .cart-product {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        min-width: 180px;
      }

      .cart-product img,
      .img-ph {
        width: 64px;
        height: 64px;
        object-fit: cover;
        border-radius: 6px;
        border: 1px solid #e4e7ec;
        flex-shrink: 0;
      }

      .img-ph {
        display: block;
        background: #f3f4f6;
      }

      .name {
        font-weight: 600;
        color: #1a1d21;
        text-decoration: none;
      }

      .name:hover {
        color: #5c4033;
      }

      .variant {
        display: block;
        font-size: 0.75rem;
        color: #9ca3af;
        margin-top: 0.15rem;
      }

      .qty {
        display: inline-flex;
        border: 1px solid #e4e7ec;
        border-radius: 4px;
        overflow: hidden;
      }

      .qty button {
        width: 32px;
        height: 32px;
        border: none;
        background: #fff;
        cursor: pointer;
      }

      .qty span {
        min-width: 36px;
        text-align: center;
        line-height: 32px;
        border-left: 1px solid #e4e7ec;
        border-right: 1px solid #e4e7ec;
      }

      .remove-btn {
        border: none;
        background: none;
        font-size: 1.25rem;
        color: #9ca3af;
        cursor: pointer;
      }

      .remove-link {
        margin-top: 0.35rem;
        border: none;
        background: none;
        padding: 0;
        font-size: 0.75rem;
        color: #9ca3af;
        text-decoration: underline;
        cursor: pointer;
      }

      .cart-summary {
        padding: 1.25rem;
        position: sticky;
        top: 1rem;
      }

      .cart-summary h2 {
        margin: 0 0 1rem;
        font-size: 1rem;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.5rem 0;
        font-size: 0.875rem;
      }

      .summary-row.muted {
        color: #9ca3af;
        font-size: 0.8125rem;
      }

      .summary-row.total {
        margin-top: 0.5rem;
        padding-top: 0.75rem;
        border-top: 1px solid #e4e7ec;
        font-size: 1rem;
      }

      .voucher-box {
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e4e7ec;
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
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        margin-top: 0.5rem;
        padding: 0.4rem 0.5rem;
        background: #ecfdf5;
        border-radius: 6px;
        font-size: 0.75rem;
      }

      .voucher-applied button {
        border: none;
        background: none;
        font-size: 1rem;
        cursor: pointer;
        color: #6b7280;
      }

      .summary-row.discount strong {
        color: #047857;
      }

      .checkout-btn {
        width: 100%;
        margin-top: 1rem;
      }

      .checkout-hint {
        margin: 0.5rem 0 0;
        font-size: 0.75rem;
        color: #6b7280;
        text-align: center;
      }

      .clear-btn {
        width: 100%;
        margin-top: 0.5rem;
        padding: 0.5rem;
        border: none;
        background: none;
        font-size: 0.8125rem;
        color: #6b7280;
        cursor: pointer;
        text-decoration: underline;
      }

      @media (max-width: 900px) {
        .cart-layout {
          grid-template-columns: 1fr;
        }

        .cart-summary {
          position: static;
        }
      }
    `
  ]
})
export class CartComponent {
  readonly cart = inject(CartService);
  readonly api = inject(ApiService);
  readonly storeAuth = inject(StoreAuthService);
  readonly voucherCart = inject(VoucherCartService);
  private readonly router = inject(Router);

  voucherCode = '';
  readonly applying = signal(false);
  readonly voucherMsg = signal('');
  readonly voucherError = signal(false);

  readonly discount = computed(() => this.voucherCart.applied()?.discountAmount ?? 0);
  readonly grandTotal = computed(() => Math.max(0, this.cart.total() - this.discount()));

  trackKey(item: CartLine): string {
    return `${item.productId}-${item.color}-${item.size}`;
  }

  changeQty(item: CartLine, delta: number): void {
    this.cart.updateQuantity(item.productId, item.quantity + delta, item.color, item.size);
  }

  remove(item: CartLine): void {
    this.cart.remove(item.productId, item.color, item.size);
  }

  clear(): void {
    if (confirm('Xóa toàn bộ giỏ hàng?')) {
      this.cart.clear();
      this.voucherCart.clear();
    }
  }

  applyVoucher(): void {
    const code = this.voucherCode.trim();
    if (!code) return;

    this.applying.set(true);
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
        this.voucherError.set(false);
        this.applying.set(false);
      },
      error: (err) => {
        this.voucherCart.clear();
        this.voucherMsg.set(err?.error?.message || 'Mã không hợp lệ.');
        this.voucherError.set(true);
        this.applying.set(false);
      }
    });
  }

  removeVoucher(): void {
    this.voucherCart.clear();
    this.voucherCode = '';
    this.voucherMsg.set('');
  }

  goCheckout(): void {
    if (this.storeAuth.isLoggedIn()) {
      this.router.navigate(['/thanh-toan']);
      return;
    }
    this.router.navigate(['/tai-khoan'], { queryParams: { returnUrl: '/thanh-toan' } });
  }
}
