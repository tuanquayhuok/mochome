import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  CancellationReasonCode,
  StoreOrderDetail,
  StoreOrderResult,
  StoreOrderService
} from '../../core/services/store-order.service';
import {
  ORDER_STATUS_PIPELINE,
  OrderStatus,
  STATUS_FLOW_LABELS,
  STATUS_LIST_LABELS,
  isPipelineStatus
} from '../../core/utils/order-status';

const ORDER_STATUS = STATUS_LIST_LABELS;

const CANCEL_REASONS: { code: CancellationReasonCode; label: string }[] = [
  { code: 'no_longer_want', label: 'Không muốn mua nữa' },
  { code: 'out_of_money', label: 'Hết tiền' },
  { code: 'wrong_address', label: 'Nhập sai địa chỉ' },
  { code: 'found_cheaper', label: 'Tìm được giá rẻ hơn' },
  { code: 'other', label: 'Lý do khác' }
];

@Component({
  selector: 'app-store-account-orders',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DecimalPipe],
  template: `
    <h2>Đơn hàng của tôi</h2>

    @if (ordersLoading()) {
      <p class="hint">Đang tải đơn hàng...</p>
    } @else if (loadError()) {
      <div class="store-alert-error">{{ loadError() }}</div>
      <button type="button" class="store-btn store-btn-outline" (click)="loadOrders()">Tải lại</button>
    } @else if (!orders().length) {
      <p class="hint">Bạn chưa có đơn hàng nào.</p>
      <a routerLink="/san-pham" class="store-btn store-btn-primary">Mua sắm ngay</a>
    } @else {
      <div class="orders-table-wrap">
        <table class="orders-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Ngày đặt</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            @for (o of orders(); track o.id) {
              <tr>
                <td data-label="Mã đơn" class="cell-strong">{{ o.orderCode }}</td>
                <td data-label="Ngày đặt" class="cell-muted">{{ formatDate(o.createdAt) }}</td>
                <td data-label="Tổng tiền">{{ o.totalAmount | number }} đ</td>
                <td data-label="Trạng thái">
                  <span class="order-status" [class]="o.status" [class.unpaid]="o.status === 'pending' && o.paymentMethod === 'vnpay'">
                    {{ o.status === 'pending' && o.paymentMethod === 'vnpay' ? 'Chưa thanh toán' : orderStatusLabel(o.status) }}
                  </span>
                </td>
                <td data-label="Thao tác">
                  <button type="button" class="store-btn store-btn-outline btn-sm" (click)="openDetail(o)">
                    Xem đơn hàng
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (detailOpen()) {
      <div class="modal-backdrop" (click)="closeDetail()">
        <div class="modal-panel" role="dialog" (click)="$event.stopPropagation()">
          <header class="modal-head">
            <div>
              <h3>Chi tiết đơn hàng</h3>
              @if (detailOrder()) {
                <p class="modal-sub">{{ detailOrder()!.orderCode }}</p>
              }
            </div>
            <button type="button" class="modal-close" (click)="closeDetail()" aria-label="Đóng">×</button>
          </header>

          @if (detailLoading()) {
            <div class="modal-body"><p class="hint">Đang tải...</p></div>
          } @else if (detailError()) {
            <div class="modal-body">
              <div class="store-alert-error">{{ detailError() }}</div>
            </div>
          } @else if (detailOrder(); as order) {
            <div class="modal-body">
              @if (actionMsg()) {
                <div class="store-alert-success">{{ actionMsg() }}</div>
              }
              @if (actionErr()) {
                <div class="store-alert-error">{{ actionErr() }}</div>
              }

              <div class="detail-meta">
                <span>{{ formatDate(order.createdAt) }}</span>
                <span>·</span>
                <span>{{ paymentLabel(order.paymentMethod) }}</span>
                <span class="order-status" [class]="order.status" [class.unpaid]="order.status === 'pending' && order.paymentMethod === 'vnpay'">
                  {{ order.status === 'pending' && order.paymentMethod === 'vnpay' ? 'Chưa thanh toán' : orderStatusLabel(order.status) }}
                </span>
              </div>

              <section class="detail-section">
                <h4>Tiến trình đơn hàng</h4>
                @if (isOrderInPipeline(order.status)) {
                  <div class="status-flow">
                    @for (step of statusPipeline; track step; let i = $index) {
                      <div
                        class="status-step"
                        [class.done]="isStepDone(order, step)"
                        [class.current]="order.status === step"
                      >
                        <span class="status-step-dot">{{ i + 1 }}</span>
                        <span class="status-step-label">{{ STATUS_FLOW_LABELS[step] }}</span>
                      </div>
                      @if (i < statusPipeline.length - 1) {
                        <span
                          class="status-step-line"
                          [class.done]="isStepDone(order, statusPipeline[i + 1]) || order.status === statusPipeline[i + 1]"
                        ></span>
                      }
                    }
                  </div>
                } @else {
                  <p class="hint terminal-status">
                    Trạng thái: <strong>{{ orderStatusLabel(order.status) }}</strong>
                  </p>
                }
              </section>

              @if (order.status === 'cancelled' && order.cancellationReasonLabel) {
                <section class="detail-section cancel-info">
                  <h4>Lý do hủy đơn</h4>
                  <p>{{ order.cancellationReasonLabel }}</p>
                  @if (order.cancelledAt) {
                    <p class="hint">Hủy lúc {{ formatDate(order.cancelledAt) }}</p>
                  }
                </section>
              }

              <section class="detail-section">
                <h4>Sản phẩm</h4>
                <ul class="order-lines">
                  @for (line of order.items || []; track $index) {
                    <li>
                      <span>{{ line.name }} × {{ line.quantity }}</span>
                      <span>{{ line.price * line.quantity | number }} đ</span>
                    </li>
                  }
                </ul>
                <div class="order-total">
                  @if ((order.discountAmount ?? 0) > 0) {
                    <span class="order-discount">Giảm −{{ order.discountAmount | number }} đ</span>
                  }
                  <strong>Tổng: {{ order.totalAmount | number }} đ</strong>
                </div>
              </section>

              <section class="detail-section">
                <div class="section-head">
                  <h4>Thông tin giao hàng</h4>
                  @if (order.canEditShipping && !editMode()) {
                    <button type="button" class="link-btn" (click)="startEdit(order)">Sửa</button>
                  }
                </div>
                @if (editMode()) {
                  <form [formGroup]="editForm" (ngSubmit)="saveEdit(order)" class="edit-form">
                    <div class="store-field">
                      <label>Số điện thoại</label>
                      <input type="tel" formControlName="receiverPhone" placeholder="09xxxxxxxx" />
                    </div>
                    <div class="store-field">
                      <label>Địa chỉ giao hàng</label>
                      <textarea formControlName="shippingAddress" rows="3"></textarea>
                    </div>
                    <div class="form-actions">
                      <button type="button" class="store-btn store-btn-outline" (click)="cancelEdit()">Hủy</button>
                      <button type="submit" class="store-btn store-btn-primary" [disabled]="savingEdit()">
                        {{ savingEdit() ? 'Đang lưu...' : 'Lưu thay đổi' }}
                      </button>
                    </div>
                  </form>
                } @else {
                  <p><strong>{{ order.receiverName }}</strong></p>
                  <p class="hint">{{ order.receiverPhone }}</p>
                  <p>{{ order.shippingAddress }}</p>
                  @if (!order.canEditShipping) {
                    <p class="hint lock-hint">Không thể sửa — đơn đã giao hoặc đã hủy.</p>
                  }
                }
              </section>

              @if (order.statusHistory?.length) {
                <section class="detail-section">
                  <h4>Lịch sử trạng thái</h4>
                  <ul class="history-list">
                    @for (entry of order.statusHistory.slice().reverse(); track $index) {
                      <li>
                        <strong>{{ statusFlowLabel(entry.fromStatus) }}</strong>
                        →
                        <strong>{{ statusFlowLabel(entry.toStatus) }}</strong>
                        <span class="history-time">{{ formatDate(entry.changedAt) }}</span>
                        <p class="history-reason">{{ entry.reason }}</p>
                      </li>
                    }
                  </ul>
                </section>
              }
            </div>

            <footer class="modal-foot" style="display: flex; gap: 0.5rem; justify-content: flex-end; flex-wrap: wrap;">
              @if (order.status === 'pending' && order.paymentMethod === 'vnpay') {
                <button type="button" class="store-btn store-btn-primary" style="background: #2563eb; border-color: #2563eb;" (click)="payAgain(order)">
                  Thanh toán lại
                </button>
              }
              @if (order.canCancel && !(order.status === 'pending' && order.paymentMethod === 'vnpay')) {
                <button type="button" class="store-btn store-btn-outline danger-btn" (click)="openCancel(order)">
                  Hủy đơn hàng
                </button>
              }
              <button type="button" class="store-btn store-btn-outline" (click)="closeDetail()">Đóng</button>
            </footer>
          }
        </div>
      </div>
    }

    @if (cancelOpen()) {
      <div class="modal-backdrop" (click)="closeCancel()">
        <div class="modal-panel modal-panel--cancel" role="dialog" (click)="$event.stopPropagation()">
          <header class="modal-head">
            <h3>Hủy đơn hàng</h3>
            <button type="button" class="modal-close" (click)="closeCancel()" aria-label="Đóng">×</button>
          </header>
          <form [formGroup]="cancelForm" (ngSubmit)="submitCancel()" class="modal-body cancel-form">
            @if (cancelErr()) {
              <div class="store-alert-error">{{ cancelErr() }}</div>
            }
            <p class="hint">Vui lòng chọn lý do hủy đơn:</p>
            <div class="reason-list">
              @for (r of cancelReasons; track r.code) {
                <label class="reason-option">
                  <input type="radio" formControlName="reason" [value]="r.code" />
                  <span>{{ r.label }}</span>
                </label>
              }
            </div>
            @if (cancelForm.value.reason === 'other') {
              <div class="store-field">
                <label>Lý do khác</label>
                <textarea formControlName="reasonOther" rows="3" placeholder="Nhập lý do..."></textarea>
              </div>
            }
            <div class="form-actions">
              <button type="button" class="store-btn store-btn-outline" (click)="closeCancel()">Không hủy</button>
              <button type="submit" class="store-btn store-btn-primary danger-btn" [disabled]="cancelling()">
                {{ cancelling() ? 'Đang hủy...' : 'Xác nhận hủy' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [
    `
      h2 {
        margin: 0 0 1.25rem;
        font-size: 1.125rem;
      }

      .hint {
        font-size: 0.8125rem;
        color: #9ca3af;
        margin: 0 0 0.75rem;
      }

      .store-alert-success {
        padding: 0.65rem 0.85rem;
        margin-bottom: 1rem;
        background: #ecfdf5;
        color: #047857;
        border-radius: 6px;
        font-size: 0.8125rem;
      }

      .store-alert-error {
        padding: 0.65rem 0.85rem;
        margin-bottom: 1rem;
        background: #fef2f2;
        color: #b91c1c;
        border-radius: 6px;
        font-size: 0.8125rem;
      }

      .orders-table-wrap {
        overflow-x: auto;
      }

      .orders-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
      }

      .orders-table th,
      .orders-table td {
        padding: 0.85rem 0.75rem;
        text-align: left;
        border-bottom: 1px solid #ebdcd0;
      }

      .orders-table tr {
        transition: background-color 0.2s ease;
      }

      .orders-table tr:hover td {
        background-color: #fcf8f5;
      }

      .orders-table th {
        font-size: 0.75rem;
        font-weight: 700;
        color: #8c8175;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 2px solid #ebdcd0;
      }

      .cell-strong {
        font-weight: 700;
        color: #3e2a1e;
      }

      .cell-muted {
        color: #8c8175;
        font-size: 0.8125rem;
      }

      .order-status {
        display: inline-flex;
        align-items: center;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.25rem 0.65rem;
        border-radius: 999px;
        background: #faf8f5;
        border: 1px solid #ebdcd0;
        color: #5c524a;
      }

      .order-status.completed {
        background: #ecfdf5;
        color: #065f46;
        border-color: #a7f3d0;
      }

      .order-status.cancelled {
        background: #fdf2f2;
        color: #991b1b;
        border-color: #fecaca;
      }

      .order-status.shipping {
        background: #eff6ff;
        color: #1e40af;
        border-color: #bfdbfe;
      }

      .order-status.unpaid {
        background: #fffbeb;
        color: #b45309;
        border-color: #fde68a;
      }

      .btn-sm {
        padding: 0.45rem 0.85rem;
        font-size: 0.8125rem;
        border-radius: 6px;
      }

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
        width: min(640px, 100%);
        max-height: 90vh;
        overflow: auto;
        background: #ffffff;
        border-radius: 16px;
        border: 1px solid rgba(229, 192, 123, 0.2);
        box-shadow: 0 25px 60px -15px rgba(62, 42, 30, 0.2);
      }

      .modal-panel--sm {
        width: min(440px, 100%);
      }

      .modal-panel--cancel {
        width: min(520px, 100%);
      }

      .modal-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1.15rem;
        border-bottom: 1px solid #f0f2f5;
      }

      .modal-head h3 {
        margin: 0;
        font-size: 1rem;
      }

      .modal-sub {
        margin: 0.2rem 0 0;
        font-size: 0.8125rem;
        color: #9ca3af;
      }

      .modal-close {
        border: none;
        background: none;
        font-size: 1.5rem;
        line-height: 1;
        cursor: pointer;
        color: #9ca3af;
      }

      .modal-body {
        padding: 1rem 1.15rem;
      }

      .modal-foot {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        padding: 0.85rem 1.15rem;
        border-top: 1px solid #f0f2f5;
      }

      .detail-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.8125rem;
        color: #6b7280;
        margin-bottom: 1rem;
      }

      .detail-section {
        margin-bottom: 1.15rem;
      }

      .detail-section h4 {
        margin: 0 0 0.65rem;
        font-size: 0.875rem;
        font-weight: 700;
      }

      .section-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .section-head h4 {
        margin: 0;
      }

      .link-btn {
        border: none;
        background: none;
        padding: 0;
        font-size: 0.8125rem;
        font-weight: 600;
        color: #5c4033;
        cursor: pointer;
        text-decoration: underline;
      }

      .status-flow {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        flex-wrap: wrap;
      }

      .status-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.3rem;
        min-width: 64px;
        text-align: center;
      }

      .status-step-dot {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        font-size: 0.75rem;
        font-weight: 700;
        border: 2px solid #e2d7cd;
        color: #8c8175;
        background: #ffffff;
        transition: all 0.3s ease;
      }

      .status-step.done .status-step-dot,
      .status-step.current .status-step-dot {
        border-color: #059669;
        background: #ecfdf5;
        color: #059669;
        box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15);
      }

      .status-step-label {
        font-size: 0.7rem;
        color: #8c8175;
        line-height: 1.25;
        font-weight: 500;
        transition: all 0.3s ease;
      }

      .status-step.done .status-step-label,
      .status-step.current .status-step-label {
        color: #3e2a1e;
        font-weight: 700;
      }

      .status-step-line {
        flex: 1;
        min-width: 24px;
        height: 2px;
        background: #e2d7cd;
        margin-bottom: 1.25rem;
        transition: all 0.3s ease;
      }

      .status-step-line.done {
        background: #059669;
      }

      .terminal-status {
        padding: 0.65rem;
        background: #fafafa;
        border-radius: 6px;
      }

      .cancel-info {
        padding: 0.75rem;
        background: #fef2f2;
        border-radius: 8px;
      }

      .cancel-info p {
        margin: 0;
        font-size: 0.875rem;
      }

      .order-lines {
        list-style: none;
        margin: 0;
        padding: 0;
        font-size: 0.8125rem;
      }

      .order-lines li {
        display: flex;
        justify-content: space-between;
        color: #6b7280;
        padding: 0.25rem 0;
      }

      .order-total {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        align-items: baseline;
        gap: 0.5rem;
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid #f0f2f5;
      }

      .order-discount {
        font-size: 0.8125rem;
        color: #047857;
      }

      .lock-hint {
        margin-top: 0.35rem;
        color: #b45309;
      }

      .edit-form .store-field {
        margin-bottom: 0.75rem;
      }

      .edit-form label {
        display: block;
        font-size: 0.8125rem;
        font-weight: 500;
        margin-bottom: 0.25rem;
      }

      .edit-form input,
      .edit-form textarea {
        width: 100%;
        padding: 0.5rem 0.65rem;
        border: 1px solid #e4e7ec;
        border-radius: 6px;
        font-size: 0.875rem;
        font-family: inherit;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 0.75rem;
      }

      .history-list {
        list-style: none;
        margin: 0;
        padding: 0;
        font-size: 0.8125rem;
      }

      .history-list li {
        padding: 0.5rem 0;
        border-bottom: 1px solid #f0f2f5;
      }

      .history-time {
        display: block;
        font-size: 0.75rem;
        color: #9ca3af;
      }

      .history-reason {
        margin: 0.25rem 0 0;
        color: #6b7280;
      }

      .reason-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        width: 100%;
      }

      .reason-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        cursor: pointer;
        width: 100%;
        padding: 0.35rem 0;
      }

      .cancel-form .store-field {
        width: 100%;
        margin-top: 0.25rem;
      }

      .cancel-form .store-field label {
        display: block;
        font-size: 0.8125rem;
        font-weight: 500;
        margin-bottom: 0.35rem;
      }

      .cancel-form textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 0.55rem 0.7rem;
        border: 1px solid #e4e7ec;
        border-radius: 6px;
        font-size: 0.875rem;
        font-family: inherit;
        resize: vertical;
        min-height: 5.5rem;
      }

      .cancel-form .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.65rem;
        margin-top: 1rem;
        padding-top: 0.85rem;
        border-top: 1px solid #f0f2f5;
      }

      .danger-btn {
        color: #b91c1c;
        border-color: #fecaca;
      }

      .store-btn.danger-btn.store-btn-primary {
        background: #b91c1c;
        border-color: #b91c1c;
        color: #fff;
      }

      @media (max-width: 600px) {
        .orders-table thead {
          display: none;
        }
        .orders-table, .orders-table tbody, .orders-table tr, .orders-table td {
          display: block;
          width: 100%;
        }
        .orders-table tr {
          margin-bottom: 1rem;
          border: 1px solid #ebdcd0;
          border-radius: 12px;
          padding: 0.75rem;
          background: #fff;
          box-shadow: 0 2px 8px rgba(62, 42, 30, 0.02);
        }
        .orders-table td {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px dashed #f0f2f5;
          text-align: right;
        }
        .orders-table td:last-child {
          border-bottom: none;
          padding-top: 0.75rem;
          justify-content: flex-end;
        }
        .orders-table td::before {
          content: attr(data-label);
          font-weight: 700;
          color: #8c8175;
          font-size: 0.75rem;
          text-transform: uppercase;
          text-align: left;
        }
      }
    `
  ]
})
export class StoreAccountOrdersComponent implements OnInit {
  private readonly ordersApi = inject(StoreOrderService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly STATUS_FLOW_LABELS = STATUS_FLOW_LABELS;
  readonly statusPipeline = ORDER_STATUS_PIPELINE;
  readonly isPipelineStatus = isPipelineStatus;
  readonly cancelReasons = CANCEL_REASONS;

  readonly orders = signal<StoreOrderResult[]>([]);
  readonly ordersLoading = signal(false);
  readonly loadError = signal('');

  readonly detailOpen = signal(false);
  readonly detailOrder = signal<StoreOrderDetail | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal('');

  readonly editMode = signal(false);
  readonly savingEdit = signal(false);
  readonly actionMsg = signal('');
  readonly actionErr = signal('');

  readonly cancelOpen = signal(false);
  readonly cancelOrderId = signal<string | null>(null);
  readonly cancelling = signal(false);
  readonly cancelErr = signal('');

  editForm = this.fb.group({
    receiverPhone: ['', Validators.required],
    shippingAddress: ['', Validators.required]
  });

  cancelForm = this.fb.group({
    reason: ['no_longer_want' as CancellationReasonCode, Validators.required],
    reasonOther: ['']
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.ordersLoading.set(true);
    this.loadError.set('');
    this.ordersApi.myOrders().subscribe({
      next: (res) => {
        this.orders.set(res.data);
        this.ordersLoading.set(false);
      },
      error: (err) => {
        this.ordersLoading.set(false);
        this.loadError.set(this.errMsg(err, 'Không tải được danh sách đơn hàng.'));
      }
    });
  }

  openDetail(order: StoreOrderResult): void {
    this.detailOpen.set(true);
    this.detailOrder.set(null);
    this.detailError.set('');
    this.detailLoading.set(true);
    this.actionMsg.set('');
    this.actionErr.set('');
    this.editMode.set(false);

    this.ordersApi.getOrder(order.id).subscribe({
      next: (detail) => {
        this.detailOrder.set(detail);
        this.detailLoading.set(false);
      },
      error: (err) => {
        this.detailLoading.set(false);
        this.detailError.set(this.errMsg(err, 'Không tải được chi tiết đơn hàng.'));
      }
    });
  }

  closeDetail(): void {
    this.detailOpen.set(false);
    this.detailOrder.set(null);
    this.editMode.set(false);
    this.actionMsg.set('');
    this.actionErr.set('');
  }

  startEdit(order: StoreOrderDetail): void {
    this.editForm.patchValue({
      receiverPhone: order.receiverPhone || '',
      shippingAddress: order.shippingAddress || ''
    });
    this.editMode.set(true);
    this.actionErr.set('');
  }

  cancelEdit(): void {
    this.editMode.set(false);
  }

  saveEdit(order: StoreOrderDetail): void {
    this.editForm.markAllAsTouched();
    if (this.editForm.invalid) {
      this.actionErr.set('Vui lòng điền đủ số điện thoại và địa chỉ.');
      return;
    }
    const v = this.editForm.getRawValue();
    this.savingEdit.set(true);
    this.actionErr.set('');
    this.ordersApi
      .updateShipping(order.id, {
        receiverPhone: v.receiverPhone!,
        shippingAddress: v.shippingAddress!
      })
      .subscribe({
        next: (res) => {
          this.savingEdit.set(false);
          this.editMode.set(false);
          this.actionMsg.set(res.message);
          this.detailOrder.set(res.order);
          this.refreshListItem(res.order);
        },
        error: (err) => {
          this.savingEdit.set(false);
          this.actionErr.set(this.errMsg(err, 'Không cập nhật được thông tin giao hàng.'));
        }
      });
  }

  openCancel(order: StoreOrderDetail): void {
    this.cancelOrderId.set(order.id);
    this.cancelForm.reset({ reason: 'no_longer_want', reasonOther: '' });
    this.cancelErr.set('');
    this.cancelOpen.set(true);
  }

  closeCancel(): void {
    this.cancelOpen.set(false);
    this.cancelOrderId.set(null);
    this.cancelErr.set('');
  }

  submitCancel(): void {
    const id = this.cancelOrderId();
    if (!id) return;

    const v = this.cancelForm.getRawValue();
    if (v.reason === 'other' && !String(v.reasonOther || '').trim()) {
      this.cancelErr.set('Vui lòng nhập lý do hủy khác.');
      return;
    }

    this.cancelling.set(true);
    this.cancelErr.set('');
    this.ordersApi
      .cancelOrder(id, {
        reason: v.reason as CancellationReasonCode,
        reasonOther: v.reasonOther || undefined
      })
      .subscribe({
        next: (res) => {
          this.cancelling.set(false);
          this.cancelOpen.set(false);
          this.actionMsg.set(res.message);
          this.detailOrder.set(res.order);
          this.refreshListItem(res.order);
          this.loadOrders();
        },
        error: (err) => {
          this.cancelling.set(false);
          this.cancelErr.set(this.errMsg(err, 'Không hủy được đơn hàng.'));
        }
      });
  }

  private refreshListItem(order: StoreOrderDetail): void {
    this.orders.update((list) =>
      list.map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: order.status,
              totalAmount: order.totalAmount,
              receiverPhone: order.receiverPhone,
              shippingAddress: order.shippingAddress
            }
          : o
      )
    );
  }

  orderStatusLabel(status: string): string {
    return ORDER_STATUS[status as OrderStatus] || status;
  }

  statusFlowLabel(status: string): string {
    return STATUS_FLOW_LABELS[status as OrderStatus] || this.orderStatusLabel(status);
  }

  paymentLabel(method: string): string {
    const m = String(method || '').toLowerCase();
    if (m === 'vnpay') return 'VNPay';
    if (m === 'momo') return 'MoMo';
    return 'COD';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('vi-VN');
  }

  isStepDone(order: StoreOrderDetail, step: OrderStatus): boolean {
    if (!isPipelineStatus(order.status as OrderStatus)) return false;
    const currentIndex = ORDER_STATUS_PIPELINE.indexOf(order.status as OrderStatus);
    const stepIndex = ORDER_STATUS_PIPELINE.indexOf(step);
    return stepIndex < currentIndex;
  }

  isOrderInPipeline(status: string): boolean {
    return isPipelineStatus(status as OrderStatus);
  }

  payAgain(order: StoreOrderDetail): void {
    // Lưu đơn hàng vào localStorage giống như vừa đặt xong để trang checkout phục hồi
    localStorage.setItem('pending_qr_order', JSON.stringify({
      id: order.id,
      orderCode: order.orderCode.replace('#', ''), // Bỏ ký tự # để giống định dạng trả về từ API lúc đặt hàng
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      status: order.status,
      createdAt: order.createdAt
    }));
    localStorage.setItem('pending_qr_order_time', '600');
    localStorage.setItem('pending_qr_order_timestamp', Date.now().toString());

    this.closeDetail();
    this.router.navigate(['/thanh-toan']);
  }

  private errMsg(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message || fallback;
    }
    return fallback;
  }
}
