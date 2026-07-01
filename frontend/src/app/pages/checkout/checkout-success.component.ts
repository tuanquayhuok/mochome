import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { StoreOrderService, StoreOrderResult } from '../../core/services/store-order.service';

@Component({
  selector: 'app-checkout-success',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  template: `
    <div class="store-page success-page">
      <div class="store-container" style="padding: 3rem 1rem;">
        @if (order(); as o) {
          <div class="store-card success-card" style="max-width: 520px; margin: 0 auto; padding: 2.5rem 2rem; text-align: center; background: #fff; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;">
            <!-- Animated SVG Success Badge -->
            <div class="success-animation-wrapper" style="margin: 0 auto 1.5rem; width: 80px; height: 80px;">
              <svg class="checkmark-svg" viewBox="0 0 52 52">
                <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>

            <h1 style="font-size: 1.6rem; color: #1e293b; margin: 0 0 0.5rem; font-weight: 700;">Đặt hàng thành công</h1>
            <p style="color: #64748b; font-size: 0.95rem; margin-bottom: 1.5rem;">
              Mã đơn hàng: <strong style="color: #1e293b;">{{ o.orderCode }}</strong>
            </p>

            <div class="payment-details-box" style="margin-bottom: 1.5rem; padding: 1rem; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; text-align: left;">
              <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.5rem; color: #64748b;">
                <span>Tổng thanh toán:</span>
                <strong style="color: #ef4444;">{{ o.totalAmount | number }} đ</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: #64748b;">
                <span>Phương thức:</span>
                <strong style="color: #1e293b;">{{ paymentLabel(o.paymentMethod) }}</strong>
              </div>
            </div>

            @if (o.paymentMethod === 'vnpay') {
              <div style="margin: 1.25rem 0; padding: 1rem; background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 12px; color: #047857; font-weight: 600; font-size: 0.925rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; animation: pulseAlert 2s infinite;">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #10b981;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                Đã thanh toán thành công! Hệ thống đã duyệt đơn của bạn.
              </div>
            }

            <p style="color: #64748b; font-size: 0.875rem; line-height: 1.5; margin: 1.5rem 0 2rem;">
              Chúng tôi sẽ liên hệ qua số điện thoại để xác nhận đơn. Cảm ơn bạn đã mua tại MỘC HOME.
            </p>

            <div class="success-actions" style="display: flex; gap: 0.75rem; justify-content: center;">
              <a routerLink="/" class="store-btn store-btn-primary" style="flex: 1; text-align: center; text-decoration: none; padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 600; background: #3e2a1e; color: #fff; border: 1px solid #3e2a1e;">Về trang chủ</a>
              <a routerLink="/tai-khoan" class="store-btn store-btn-outline" style="flex: 1; text-align: center; text-decoration: none; padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 600; color: #3e2a1e; border: 1px solid #ebdcd0; background: #fff;">Tài khoản</a>
            </div>
          </div>
        } @else {
          <div style="text-align: center; padding: 3rem 0;">
            <p style="color: #64748b;">Không tìm thấy thông tin đơn hàng.</p>
            <a routerLink="/" class="store-btn store-btn-primary" style="margin-top: 1rem; display: inline-block;">Về trang chủ</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .checkmark-svg {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: block;
        stroke-width: 2.5;
        stroke: #10b981;
        stroke-miterlimit: 10;
        box-shadow: inset 0px 0px 0px #10b981;
        animation: fillCheckmark .4s ease-in-out .4s forwards, scaleCheckmark .3s ease-in-out .9s both;
      }

      .checkmark-circle {
        stroke-dasharray: 166;
        stroke-dashoffset: 166;
        stroke-width: 2.5;
        stroke: #10b981;
        fill: none;
        animation: strokeCircle 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
      }

      .checkmark-check {
        transform-origin: 50% 50%;
        stroke-linecap: round;
        stroke-dasharray: 48;
        stroke-dashoffset: 48;
        animation: strokeCheck 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
      }

      @keyframes strokeCircle {
        100% { stroke-dashoffset: 0; }
      }
      
      @keyframes strokeCheck {
        100% { stroke-dashoffset: 0; }
      }
      
      @keyframes fillCheckmark {
        100% { box-shadow: inset 0px 0px 0px 40px #ecfdf5; }
      }
      
      @keyframes scaleCheckmark {
        0%, 100% { transform: none; }
        50% { transform: scale3d(1.1, 1.1, 1); }
      }

      @keyframes slideUpFade {
        from {
          opacity: 0;
          transform: translateY(15px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes pulseAlert {
        0%, 100% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.2);
        }
        50% {
          transform: scale(1.01);
          box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
        }
      }
    `
  ]
})
export class CheckoutSuccessComponent implements OnInit {
  private readonly ordersApi = inject(StoreOrderService);
  private readonly route = inject(ActivatedRoute);

  readonly order = signal<StoreOrderResult | null>(null);

  ngOnInit(): void {
    const orderId = this.route.snapshot.queryParamMap.get('orderId');
    const orderCode = this.route.snapshot.queryParamMap.get('orderCode');
    const totalAmount = this.route.snapshot.queryParamMap.get('totalAmount');
    const paymentMethod = this.route.snapshot.queryParamMap.get('paymentMethod');

    if (orderId && orderCode) {
      this.order.set({
        id: orderId,
        orderCode: orderCode,
        totalAmount: Number(totalAmount || 0),
        paymentMethod: paymentMethod || 'cod',
        status: 'processing',
        createdAt: new Date().toISOString()
      });
    } else {
      // Thử lấy đơn hàng vừa đặt xong từ sessionStorage hoặc localStorage nếu có
      const saved = localStorage.getItem('pending_qr_order') || sessionStorage.getItem('last_placed_order');
      if (saved) {
        try {
          this.order.set(JSON.parse(saved));
        } catch(e) {}
      }
    }
  }

  paymentLabel(method: string): string {
    const m = String(method || '').toLowerCase();
    if (m === 'vnpay') return 'Chuyển khoản Ngân hàng (QR)';
    if (m === 'momo') return 'MoMo';
    return 'Thanh toán khi nhận hàng (COD)';
  }
}
