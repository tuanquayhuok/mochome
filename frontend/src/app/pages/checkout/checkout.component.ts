import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { VoucherCartService } from '../../core/services/voucher-cart.service';
import { StoreAuthService } from '../../core/services/store-auth.service';
import { StoreOrderService, StoreOrderResult } from '../../core/services/store-order.service';
import { ApiService } from '../../core/services/api.service';
import { StoreVoucherInputComponent } from '../../shared/store-voucher-input/store-voucher-input.component';
import { AdministrativeUnit, VIETNAM_DIVISIONS } from '../../core/config/vietnam-divisions';

type PaymentMethod = 'cod' | 'vnpay' | 'momo';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, DecimalPipe, StoreVoucherInputComponent],
  template: `
    <div class="store-page checkout-page">
      <div class="store-container">
        @if (successOrder(); as order) {
          <!-- Trường hợp 1: Chọn Chuyển khoản QR và CHƯA THANH TOÁN (hoặc đang đếm ngược) -->
          @if (order.paymentMethod === 'vnpay' && orderPaidStatus() === 'pending') {
            <div class="store-card checkout-success" style="max-width: 680px;">
              <h1>Cổng thanh toán QR Code</h1>
              <p style="margin-bottom: 0.5rem;">Vui lòng chuyển khoản đúng thông tin bên dưới để hoàn tất đơn hàng.</p>
              
              <!-- Đếm ngược thời gian -->
              <div class="countdown-badge" style="display: inline-block; padding: 0.35rem 0.85rem; background: #fff1f2; color: #e11d48; font-weight: bold; border-radius: 20px; font-size: 0.85rem; margin-bottom: 1.5rem; border: 1px solid #fecdd3;">
                Đơn hàng sẽ tự động hủy sau: <strong style="font-size: 0.95rem;">{{ displayTime() }}</strong>
              </div>

              <!-- Khu vực hiển thị chuyển khoản qua mã QR VietQR -->
              <div class="bank-transfer-box" style="padding: 1.5rem; background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; text-align: left;">
                <h3 style="margin-top: 0; color: #1e293b; font-size: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="color: #2563eb;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="3"></rect><rect x="14" y="7" width="3" height="3"></rect><rect x="7" y="14" width="3" height="3"></rect><rect x="14" y="14" width="3" height="3"></rect></svg>
                  Thông tin Chuyển khoản QR Code
                </h3>
                
                <div class="transfer-layout" style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap; margin-top: 1rem;">
                  <div style="flex-shrink: 0; margin: 0 auto; text-align: center; background: #fff; padding: 10px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                    <!-- API VietQR tạo ảnh QR Napas chứa số tiền và nội dung tự động -->
                    <img 
                      [src]="'https://img.vietqr.io/image/MB-20080699998386-qr_only.png?amount=' + order.totalAmount + '&addInfo=DH' + order.orderCode.slice(-6) + '&accountName=QUANG%20TRONG%20TUAN'" 
                      alt="VietQR code" 
                      style="width: 200px; height: 200px; display: block;" 
                    />
                    <small style="color: #64748b; font-size: 11px; font-weight: 500; display: block; margin-top: 5px;">Quét để thanh toán</small>
                  </div>

                  <!-- Thông tin tài khoản chi tiết -->
                  <div style="flex: 1; min-width: 250px;">
                    <p style="margin: 0 0 0.5rem; font-size: 0.875rem;">Ngân hàng: <strong>MBBank (Ngân hàng Quân đội)</strong></p>
                    <p style="margin: 0 0 0.5rem; font-size: 0.875rem;">Số tài khoản: <strong style="color: #2563eb; font-size: 1rem;">20080699998386</strong></p>
                    <p style="margin: 0 0 0.5rem; font-size: 0.875rem;">Chủ tài khoản: <strong>QUANG TRONG TUAN</strong></p>
                    <p style="margin: 0 0 0.5rem; font-size: 0.875rem;">Số tiền: <strong style="color: #ef4444; font-size: 1.1rem;">{{ order.totalAmount | number }} đ</strong></p>
                    <p style="margin: 0 0 1rem; font-size: 0.875rem; padding: 0.4rem; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 4px; display: inline-block;">
                      Nội dung CK bắt buộc: <strong style="color: #dc2626; font-size: 1.05rem;">DH{{ order.orderCode.slice(-6) }}</strong>
                    </p>

                    <div style="font-size: 0.775rem; color: #475569; line-height: 1.4;">
                      <p style="margin: 0; display: flex; align-items: center; gap: 0.25rem;">
                        <span style="color: #059669; font-weight: bold;">●</span>
                        Hệ thống tự động duyệt đơn ngay khi nhận được tiền.
                      </p>
                      <p style="margin: 0.25rem 0 0; display: flex; align-items: center; gap: 0.25rem;">
                        <span style="color: #059669; font-weight: bold;">●</span>
                        Vui lòng giữ nguyên nội dung chuyển khoản ở trên.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Trạng thái thanh toán thời gian thực qua polling -->
              <div class="realtime-payment-status" style="margin: 1.25rem 0; padding: 1rem; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 0.75rem; font-weight: 600; font-size: 0.9rem; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;">
                <!-- SVG Loading Spinner -->
                <svg class="spinning" viewBox="0 0 24 24" width="20" height="20" fill="none" style="display: inline-block;">
                  <circle cx="12" cy="12" r="10" stroke="#bfdbfe" stroke-width="3" style="opacity: 0.25;"></circle>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style="color: #2563eb;"></path>
                </svg>
                <span>Hệ thống đang chờ bạn chuyển khoản chuyển khoản online...</span>
              </div>
            </div>
          } @else if (orderPaidStatus() === 'cancelled') {
            <!-- Trường hợp thanh toán hết hạn / tự hủy -->
            <div class="store-card checkout-success" style="max-width: 520px;">
              <div class="success-icon" style="background: #fef2f2; color: #dc2626;" aria-hidden="true">✕</div>
              <h1 style="color: #dc2626;">Thanh toán hết hạn</h1>
              <p>Thời gian thanh toán cho đơn hàng <strong>{{ order.orderCode }}</strong> đã kết thúc.</p>
              <p class="success-hint">Đơn hàng này đã bị hệ thống tự động hủy bỏ do quá giờ giao dịch.</p>
              <div class="success-actions">
                <a routerLink="/" class="store-btn store-btn-primary">Về trang chủ</a>
                <a routerLink="/tai-khoan" class="store-btn store-btn-outline">Tài khoản của tôi</a>
              </div>
            </div>
          } @else {
            <!-- Trường hợp 2: COD, Momo, hoặc ĐÃ THANH TOÁN (paid) -->
            <div class="store-card checkout-success" style="max-width: 520px;">
              <div class="success-icon" aria-hidden="true">✓</div>
              <h1>Đặt hàng thành công</h1>
              <p>
                Mã đơn hàng: <strong>{{ order.orderCode }}</strong>
              </p>
              <p class="success-meta">
                Tổng thanh toán: <strong>{{ order.totalAmount | number }} đ</strong>
                · {{ paymentLabel(order.paymentMethod) }}
              </p>
              @if (order.paymentMethod === 'vnpay') {
                <div style="margin: 1rem 0; padding: 0.85rem; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; color: #047857; font-weight: 600; font-size: 0.9rem;">
                  Đã thanh toán thành công! Hệ thống đã duyệt đơn của bạn.
                </div>
              }
              <p class="success-hint">
                Chúng tôi sẽ liên hệ qua số điện thoại để xác nhận đơn. Cảm ơn bạn đã mua tại MỘC HOME.
              </p>
              <div class="success-actions">
                <a routerLink="/" class="store-btn store-btn-primary">Về trang chủ</a>
                <a routerLink="/tai-khoan" class="store-btn store-btn-outline">Tài khoản</a>
              </div>
            </div>
          }
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

              <section class="store-card checkout-section">
                <h2>Thông tin giao hàng</h2>
                <div class="field-grid">
                  <label class="store-field">
                    <span>Họ tên người nhận <em>*</em></span>
                    <input type="text" formControlName="receiverName" placeholder="Nguyễn Văn A" />
                  </label>
                  <label class="store-field">
                    <span>Số điện thoại <em>*</em></span>
                    <input
                      type="tel"
                      formControlName="receiverPhone"
                      placeholder="0"
                      (input)="onPhoneInput($event)"
                      [class.phone-error]="phoneLengthError()"
                      [class.phone-shake]="phoneShakeActive()"
                    />
                    @if (phoneLengthError()) {
                      <span style="display: block; color: #dc2626; font-size: 0.75rem; margin-top: 0.25rem;">
                        Số điện thoại chỉ được phép có 10 số.
                      </span>
                    }
                  </label>
                </div>
                <div class="field-grid" style="margin-bottom: 0.85rem;">
                  <label class="store-field" style="margin-bottom: 0;">
                    <span>Tỉnh / Thành phố <em>*</em></span>
                    <select formControlName="province" (change)="onProvinceChange($event)">
                      <option value="">-- Chọn Tỉnh / Thành --</option>
                      @for (p of provincesList; track p.name) {
                        <option [value]="p.name">{{ p.name }}</option>
                      }
                    </select>
                  </label>
                  
                  <label class="store-field" style="margin-bottom: 0;">
                    <span>Phường / Xã <em>*</em></span>
                    <select formControlName="ward" [disabled]="!selectedProvinceObj()" (change)="syncShippingAddress()">
                      <option value="">-- Chọn Phường / Xã --</option>
                      @for (w of wardsList(); track w) {
                        <option [value]="w">{{ w }}</option>
                      }
                    </select>
                  </label>
                </div>

                <div style="margin-bottom: 0.85rem;">
                  <button type="button" class="store-btn store-btn-outline" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.35rem; font-size: 0.8125rem; height: 38px;" (click)="getCurrentLocation()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
                    </svg>
                    Lấy vị trí hiện tại
                  </button>
                </div>

                <label class="store-field">
                  <span>Địa chỉ chi tiết (Số nhà, tên đường...) <em>*</em></span>
                  <input type="text" formControlName="addressDetail" (input)="syncShippingAddress()" placeholder="Ví dụ: 123 Đường Nguyễn Trãi" />
                </label>
                
                <div style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                  <input type="checkbox" id="save-info-cb" [checked]="saveShippingInfo()" (change)="toggleSaveShipping($event)" />
                  <label for="save-info-cb" style="font-size: 0.8125rem; font-weight: 500; color: #4b5563; cursor: pointer;">Lưu thông tin giao hàng cho lần mua tiếp theo</label>
                </div>

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
                     <div class="pay-option-content" style="display: flex; align-items: center; gap: 0.75rem;">
                       <span class="pay-qr-icon" style="font-size: 1.5rem; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 8px; background: #eff6ff; color: #2563eb;">
                         <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="3"></rect><rect x="14" y="7" width="3" height="3"></rect><rect x="7" y="14" width="3" height="3"></rect><rect x="14" y="14" width="3" height="3"></rect></svg>
                       </span>
                       <div>
                         <strong>Chuyển khoản Ngân hàng (QR Code)</strong>
                         <span>Quét mã QR qua ứng dụng Ngân hàng để thanh toán tự động</span>
                       </div>
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
      .store-field select,
      .store-field textarea {
        width: 100%;
        padding: 0.55rem 0.75rem;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        font-size: 0.875rem;
        box-sizing: border-box;
        height: 38px;
        background-color: #fff;
      }

      .store-field textarea {
        height: auto;
      }

      .store-field input:focus,
      .store-field textarea:focus {
        outline: none;
        border-color: #9ca3af;
        box-shadow: 0 0 0 3px rgba(92, 64, 51, 0.1);
      }

      .store-field input.phone-error {
        border-color: #dc2626 !important;
        background-color: #fef2f2;
      }

      .store-field input.phone-shake {
        animation: shakeInput 0.4s ease-in-out;
      }

      @keyframes shakeInput {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-6px); }
        40%, 80% { transform: translateX(6px); }
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

      .pay-option-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
      }

      .pay-logo {
        height: 24px;
        width: auto;
        object-fit: contain;
        flex-shrink: 0;
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

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @-webkit-keyframes spin {
        from { -webkit-transform: rotate(0deg); }
        to { -webkit-transform: rotate(360deg); }
      }

      .spinning {
        animation: spin 1s linear infinite;
        -webkit-animation: spin 1s linear infinite;
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
export class CheckoutComponent implements OnInit, OnDestroy {
  readonly cart = inject(CartService);
  readonly voucherCart = inject(VoucherCartService);
  readonly storeAuth = inject(StoreAuthService);
  readonly orders = inject(StoreOrderService);
  readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private pollingIntervalId: any;

  readonly submitting = signal(false);
  readonly submitError = signal('');
  readonly successOrder = signal<StoreOrderResult | null>(null);
  readonly orderPaidStatus = signal<string>('pending'); // 'pending' | 'paid' | 'failed' | 'cancelled'
  readonly countdownSeconds = signal<number>(600); // 10 minutes = 600s
  readonly displayTime = computed(() => {
    const mins = Math.floor(this.countdownSeconds() / 60);
    const secs = this.countdownSeconds() % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  });
  private countdownIntervalId: any;
  readonly voucherApplying = signal(false);
  readonly voucherMsg = signal('');
  readonly voucherError = signal(false);
  readonly saveShippingInfo = signal(true);

  voucherCode = '';

  readonly discount = computed(() => this.voucherCart.applied()?.discountAmount ?? 0);
  readonly grandTotal = computed(() => Math.max(0, this.cart.total() - this.discount()));

  readonly provincesList = VIETNAM_DIVISIONS;
  readonly selectedProvinceObj = signal<AdministrativeUnit | null>(null);
  readonly wardsList = computed(() => {
    const p = this.selectedProvinceObj();
    return p ? p.wards : [];
  });

  form = this.fb.group({
    receiverName: ['', Validators.required],
    receiverPhone: ['', [Validators.required, Validators.pattern(/^0\d{9}$/)]],
    province: ['', Validators.required],
    ward: ['', Validators.required],
    addressDetail: ['', Validators.required],
    shippingAddress: [''],
    note: [''],
    paymentMethod: ['cod' as PaymentMethod, Validators.required]
  });

  payment = () => this.form.get('paymentMethod')?.value as PaymentMethod;

  onProvinceChange(event: Event): void {
    const provinceName = (event.target as HTMLSelectElement).value;
    const found = this.provincesList.find(p => p.name === provinceName) || null;
    this.selectedProvinceObj.set(found);
    this.form.patchValue({ ward: '' });
    this.syncShippingAddress();
  }

  getCurrentLocation(): void {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS hiện tại.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Gọi OpenStreetMap Nominatim API để dịch tọa độ thành địa chỉ chi tiết (Tên đường, phường)
        this.api.apiCallFreeReverseGeocoding(latitude, longitude).subscribe({
          next: (res: any) => {
            if (res && res.address) {
              const addr = res.address;
              
              const provinceCandidate = addr.city || addr.province || addr.state || '';
              const districtCandidate = addr.district || addr.subdistrict || addr.county || addr.city_district || '';
              const wardCandidate = addr.suburb || addr.quarter || addr.village || addr.town || addr.ward || '';
              const houseNumber = addr.house_number || '';
              const road = addr.road || addr.street || '';
              const streetDetail = [houseNumber, road].filter(Boolean).join(' ');

              let matchedProvince: any = null;
              if (provinceCandidate) {
                const normProvince = provinceCandidate.toLowerCase().replace(/^(tỉnh|thành phố)\s+/i, '').trim();
                matchedProvince = this.provincesList.find(p => {
                  const pName = p.name.toLowerCase().replace(/^(tỉnh|thành phố)\s+/i, '').trim();
                  return pName.includes(normProvince) || normProvince.includes(pName);
                });
              }

              if (matchedProvince) {
                this.selectedProvinceObj.set(matchedProvince);
                this.form.patchValue({ province: matchedProvince.name, ward: '', addressDetail: streetDetail || 'Địa chỉ định vị' });

                let matchedWard = '';
                if (wardCandidate) {
                  const normWard = wardCandidate.toLowerCase().replace(/^(phường|xã|thị trấn)\s+/i, '').trim();
                  const foundWard = matchedProvince.wards.find((w: string) => {
                    const wName = w.toLowerCase().replace(/^(phường|xã|thị trấn)\s+/i, '').trim();
                    return wName.startsWith(normWard) || wName.includes(normWard);
                  });
                  if (foundWard) {
                    matchedWard = foundWard;
                  }
                }
                
                if (matchedWard) {
                  this.form.patchValue({ ward: matchedWard });
                }

                this.syncShippingAddress();
              } else {
                const fullText = [streetDetail, wardCandidate, districtCandidate, provinceCandidate].filter(Boolean).join(', ');
                this.form.patchValue({
                  addressDetail: fullText
                });
                this.syncShippingAddress();
              }
            } else {
              this.form.patchValue({
                addressDetail: `Tọa độ: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
              });
              this.syncShippingAddress();
            }
          },
          error: () => {
            this.form.patchValue({
              addressDetail: `Tọa độ: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
            });
            this.syncShippingAddress();
          }
        });
      },
      (error) => {
        console.warn('Geolocation error:', error);
        alert(`Không thể truy cập vị trí GPS: ${error.message || 'Thiết bị không khả dụng hoặc bị từ chối'}`);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

  syncShippingAddress(): void {
    const f = this.form.value;
    const parts = [
      f.addressDetail,
      f.ward,
      f.province
    ].filter(Boolean);
    this.form.get('shippingAddress')?.setValue(parts.join(', '), { emitEvent: false });
  }

  readonly phoneLengthError = signal(false);
  readonly phoneShakeActive = signal(false);

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Chỉ cho phép số

    if (value.length > 0 && value[0] !== '0') {
      value = '0' + value.slice(1);
    }

    if (value.length > 10) {
      this.phoneLengthError.set(true);
      value = value.slice(0, 10);
      
      this.phoneShakeActive.set(true);
      setTimeout(() => this.phoneShakeActive.set(false), 400);
    } else {
      this.phoneLengthError.set(false);
    }

    input.value = value;
    this.form.get('receiverPhone')?.setValue(value, { emitEvent: false });
  }

  ngOnInit(): void {
    // Nếu trong giỏ hàng có sản phẩm, người dùng muốn đặt đơn hàng mới -> Xóa phiên thanh toán của đơn hàng cũ trước đó
    if (this.cart.cartItems().length > 0) {
      this.clearPendingOrderSession();
    } else {
      // Nếu giỏ hàng trống, thử phục hồi đơn hàng đang chờ thanh toán chuyển khoản từ localStorage để không bị mất khi F5
      const savedOrderJson = localStorage.getItem('pending_qr_order');
      if (savedOrderJson) {
        try {
          const order = JSON.parse(savedOrderJson);
          const savedTimeStr = localStorage.getItem('pending_qr_order_time') || '600';
          const startTimestamp = Number(localStorage.getItem('pending_qr_order_timestamp') || Date.now());
          const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
          const remaining = Math.max(0, Number(savedTimeStr) - elapsed);

          if (remaining > 0) {
            this.successOrder.set(order);
            this.countdownSeconds.set(remaining);
            this.startPaymentPolling(order.id, remaining);
            return;
          } else {
            this.clearPendingOrderSession();
          }
        } catch (e) {
          this.clearPendingOrderSession();
        }
      }
    }

    if (!this.cart.cartItems().length) {
      this.router.navigate(['/gio-hang']);
      return;
    }

    this.restoreSavedAddress();

    const applied = this.voucherCart.applied();
    if (applied) {
      this.voucherCode = applied.code;
      this.revalidateVoucher();
    }
  }

  private clearPendingOrderSession(): void {
    localStorage.removeItem('pending_qr_order');
    localStorage.removeItem('pending_qr_order_time');
    localStorage.removeItem('pending_qr_order_timestamp');
  }

  restoreSavedAddress(): void {
    const savedName = localStorage.getItem('checkout_saved_name');
    const savedPhone = localStorage.getItem('checkout_saved_phone');
    const savedAddress = localStorage.getItem('checkout_saved_address');
    const savedPref = localStorage.getItem('checkout_save_pref');
    
    if (savedPref !== null) {
      this.saveShippingInfo.set(savedPref === 'true');
    }

    const user = this.storeAuth.getUser();
    
    if (savedAddress) {
      const parts = savedAddress.split(',').map(s => s.trim());
      if (parts.length >= 3) {
        const province = parts[parts.length - 1];
        const ward = parts[parts.length - 2];
        const detail = parts.slice(0, parts.length - 2).join(', ');

        const pFound = this.provincesList.find(p => p.name === province);
        if (pFound) {
          this.selectedProvinceObj.set(pFound);
          this.form.patchValue({
            receiverName: savedName || user?.fullName || '',
            receiverPhone: savedPhone || user?.phone || '',
            province,
            ward,
            addressDetail: detail,
            shippingAddress: savedAddress
          });
        } else {
          this.form.patchValue({
            receiverName: savedName || user?.fullName || '',
            receiverPhone: savedPhone || user?.phone || '',
            addressDetail: savedAddress,
            shippingAddress: savedAddress
          });
        }
      } else {
        this.form.patchValue({
          receiverName: savedName || user?.fullName || '',
          receiverPhone: savedPhone || user?.phone || '',
          addressDetail: savedAddress,
          shippingAddress: savedAddress
        });
      }
    } else {
      this.form.patchValue({
        receiverName: savedName || user?.fullName || '',
        receiverPhone: savedPhone || user?.phone || ''
      });
    }
  }

  toggleSaveShipping(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.saveShippingInfo.set(isChecked);
    localStorage.setItem('checkout_save_pref', String(isChecked));
    if (!isChecked) {
      localStorage.removeItem('checkout_saved_name');
      localStorage.removeItem('checkout_saved_phone');
      localStorage.removeItem('checkout_saved_address');
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
    this.syncShippingAddress();
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
          // Lưu thông tin giao hàng nếu checkbox được check
          if (this.saveShippingInfo()) {
            localStorage.setItem('checkout_saved_name', v.receiverName || '');
            localStorage.setItem('checkout_saved_phone', v.receiverPhone || '');
            localStorage.setItem('checkout_saved_address', v.shippingAddress || '');
          }

          this.cart.clear();
          this.voucherCart.clear();
          this.successOrder.set(res.order);
          this.submitting.set(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });

          // Nếu là thanh toán chuyển khoản, tiến hành kiểm tra trạng thái đơn hàng định kỳ
          if (res.order.paymentMethod === 'vnpay') {
            localStorage.setItem('pending_qr_order', JSON.stringify(res.order));
            localStorage.setItem('pending_qr_order_time', '600');
            localStorage.setItem('pending_qr_order_timestamp', Date.now().toString());
            this.startPaymentPolling(res.order.id);
          }
        },
        error: (err) => {
          this.submitting.set(false);
          this.submitError.set(err?.error?.message || 'Không thể đặt hàng. Vui lòng thử lại.');
        }
      });
  }

  paymentLabel(method: string): string {
    const m = String(method || '').toLowerCase();
    if (m === 'vnpay') return 'Chuyển khoản Ngân hàng (QR)';
    if (m === 'momo') return 'MoMo';
    return 'Thanh toán khi nhận hàng';
  }

  startPaymentPolling(orderId: string, remainingSecs: number = 600): void {
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
    }
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
    }

    this.countdownSeconds.set(remainingSecs);

    // Thiết lập đếm ngược thời gian
    this.countdownIntervalId = setInterval(() => {
      const current = this.countdownSeconds();
      if (current <= 1) {
        clearInterval(this.countdownIntervalId);
        clearInterval(this.pollingIntervalId);
        this.orderPaidStatus.set('cancelled');

        // Tự động gửi API hủy đơn hàng do quá giờ thanh toán
        this.orders.cancelOrder(orderId, { reason: 'other', reasonOther: 'Hết hạn thời gian thanh toán (10 phút)' }).subscribe({
          next: () => console.log('Đơn hàng đã tự động hủy do hết hạn thanh toán.'),
          error: (err) => console.error('Lỗi khi tự động hủy đơn hàng:', err)
        });
      } else {
        this.countdownSeconds.set(current - 1);
      }
    }, 1000);

    // Gửi request kiểm tra trạng thái đơn hàng mỗi 4 giây
    this.pollingIntervalId = setInterval(() => {
      this.orders.getOrder(orderId).subscribe({
        next: (orderDetail) => {
          if (orderDetail.paymentStatus === 'paid') {
            this.orderPaidStatus.set('paid');
            this.clearPendingOrderSession();
            clearInterval(this.pollingIntervalId);
            if (this.countdownIntervalId) {
              clearInterval(this.countdownIntervalId);
            }
          } else if (orderDetail.paymentStatus === 'failed') {
            this.orderPaidStatus.set('failed');
            this.clearPendingOrderSession();
            clearInterval(this.pollingIntervalId);
            if (this.countdownIntervalId) {
              clearInterval(this.countdownIntervalId);
            }
          }
        },
        error: (err) => {
          console.error('Lỗi khi kiểm tra trạng thái thanh toán đơn hàng:', err);
        }
      });
    }, 4000);
  }

  ngOnDestroy(): void {
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
    }
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
    }
  }
}
