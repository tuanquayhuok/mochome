import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../core/services/order.service';
import { Order, OrderDetail, OrderStatistics, OrdersFilter, OrdersResponse } from '../core/models/order.interface';
import {
  ORDER_STATUS_PIPELINE,
  STATUS_FLOW_LABELS,
  STATUS_LIST_LABELS,
  OrderStatus,
  canAdvanceOrderStatus,
  getNextOrderStatus,
  isPipelineStatus
} from '../core/utils/order-status';
import { AdminCatalogPageComponent } from '../shared/admin-catalog-page.component';
import { orderSectionCrumbs } from '../shared/admin-order-section.config';

const STATUS_LABELS = STATUS_LIST_LABELS;

const PAYMENT_LABELS: Record<string, string> = {
  COD: 'COD',
  VNPay: 'VNPay',
  Momo: 'MOMO'
};

interface StatCard {
  key: string;
  label: string;
  sub: string;
  value: () => number;
  statusFilter: string;
  icon: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminCatalogPageComponent],
  template: `
    <app-admin-catalog-page
      title="Quản lý đơn hàng"
      [subtitle]="pageSubtitle()"
      [breadcrumbs]="breadcrumbs()"
    >

      <div class="orders-stats" pageToolbar>
          @for (card of statCards; track card.key) {
          <button
            type="button"
            class="stat-card"
            [class.active]="activeStatusFilter() === card.statusFilter"
            (click)="filterByStatus(card.statusFilter)"
          >
            <span class="stat-icon" [innerHTML]="card.icon"></span>
            <div class="stat-body">
              <span class="stat-label">{{ card.label }}</span>
              <strong class="stat-value">{{ card.value() }}</strong>
              <span class="stat-sub">{{ card.sub }}</span>
            </div>
          </button>
          }
        </div>

        <div class="catalog-filter-bar" [formGroup]="filterForm">
          <div class="filter-fields">
            <div class="search-field">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input type="search" placeholder="Tìm kiếm mã đơn, tên KH, SĐT..." formControlName="search" />
            </div>
            <select formControlName="status">
              <option value="">Trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="processing">Đang xử lý</option>
              <option value="shipping">Đang giao</option>
              <option value="completed">Đã nhận</option>
              <option value="cancelled">Đã hủy</option>
              <option value="returned">Hoàn trả</option>
            </select>
            <select formControlName="paymentMethod">
              <option value="">Phương thức thanh toán</option>
              <option value="COD">COD</option>
              <option value="VNPay">VNPay</option>
              <option value="Momo">Momo</option>
            </select>
            <input type="date" formControlName="startDate" title="Từ ngày" />
            <input type="date" formControlName="endDate" title="Đến ngày" />
          </div>
          <div class="filter-actions">
            <button type="button" class="btn-action secondary filter-btn" (click)="applyFilters()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
              </svg>
              Lọc
            </button>
            <button type="button" class="btn-action secondary filter-btn" (click)="resetFilters()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M3 12a9 9 0 0115-6.7L21 3v6h-6M21 12a9 9 0 01-15 6.7L3 21v-6h6" />
              </svg>
              Đặt lại
            </button>
          </div>
        </div>

        @if (isLoading()) {
          <div class="page-state">Đang tải đơn hàng...</div>
        } @else if (error()) {
          <div class="page-state error">
            {{ error() }}
            <div class="state-action">
              <button type="button" class="btn-action secondary" (click)="loadOrders()">Thử lại</button>
            </div>
          </div>
        } @else if (!orders().length) {
          <div class="page-state">
            Không tìm thấy đơn hàng.
            <div class="state-action">
              <button type="button" class="btn-action secondary" (click)="resetFilters()">Xóa bộ lọc</button>
            </div>
          </div>
        } @else {
          <div class="data-table-wrap">
            <table class="data-table data-table--orders">
              <thead>
                <tr>
                  <th class="col-check">
                    <input
                      type="checkbox"
                      [checked]="allSelected()"
                      (change)="toggleSelectAll($event)"
                      aria-label="Chọn tất cả"
                    />
                  </th>
                  <th class="col-index">#</th>
                  <th>Mã đơn hàng</th>
                  <th>Khách hàng</th>
                  <th>SĐT</th>
                  <th>Tổng tiền</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th class="col-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                @for (order of orders(); track order.id; let i = $index) {
                  <tr [class.row-selected]="isOrderSelected(order.id)">
                    <td class="col-check">
                      <input
                        type="checkbox"
                        [checked]="isOrderSelected(order.id)"
                        (change)="toggleSelectOrder(order.id)"
                      />
                    </td>
                    <td class="col-index cell-muted">{{ rowIndex(i) }}</td>
                    <td class="cell-strong order-code">{{ order.orderCode }}</td>
                    <td>
                      <div class="customer-cell">
                        <span class="customer-avatar">{{ initials(order.customerName) }}</span>
                        <div>
                          <div class="cell-strong">{{ order.customerName }}</div>
                          @if (order.customerEmail) {
                            <div class="cell-muted customer-email">{{ order.customerEmail }}</div>
                          }
                        </div>
                      </div>
                    </td>
                    <td class="cell-muted">{{ order.phone || '—' }}</td>
                    <td class="cell-strong">{{ formatCurrency(order.totalAmount) }}</td>
                    <td>
                      <span class="payment-badge" [class]="paymentClass(order.paymentMethod)">
                        {{ PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod }}
                      </span>
                    </td>
                    <td>
                      <span class="status-badge" [class]="order.status">
                        {{ STATUS_LABELS[order.status] || order.status }}
                      </span>
                    </td>
                    <td class="cell-muted">{{ formatDateTime(order.createdAt) }}</td>
                    <td class="col-actions">
                      <div class="icon-actions">
                        <button type="button" class="icon-round" title="Xem" (click)="viewOrder(order)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        <button type="button" class="icon-round" title="Sửa" (click)="editOrderStatus(order)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button type="button" class="icon-round" title="Thêm" (click)="moreActions(order)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="19" r="1" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="table-bulk-footer">
            <div class="bulk-left">
              <select class="page-size-select" [value]="pageSize()" (change)="onPageSizeChange($event)">
                <option [value]="10">10 đơn / trang</option>
                <option [value]="20">20 đơn / trang</option>
                <option [value]="50">50 đơn / trang</option>
              </select>
            </div>
            <div class="bulk-right">
              <span>
                Hiển thị {{ rangeStart() }} – {{ rangeEnd() }} trong tổng {{ totalOrders() }} đơn
              </span>
              <div class="pagination-btns">
                <button
                  type="button"
                  class="btn-page"
                  (click)="goPage(currentPage() - 1)"
                  [disabled]="currentPage() === 1"
                >
                  ‹
                </button>
                @for (p of pageNumbers(); track p) {
                  @if (p === '…') {
                    <span class="page-ellipsis">…</span>
                  } @else {
                    <button
                      type="button"
                      class="btn-page"
                      [class.active]="p === currentPage()"
                      (click)="goPage(+p)"
                    >
                      {{ p }}
                    </button>
                  }
                }
                <button
                  type="button"
                  class="btn-page"
                  (click)="goPage(currentPage() + 1)"
                  [disabled]="currentPage() === totalPages()"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        }
    </app-admin-catalog-page>

    @if (editModalOpen()) {
      <div class="modal-backdrop" (click)="closeEditModal()">
        <div class="modal-panel modal-panel--wide" role="dialog" (click)="$event.stopPropagation()">
          <header class="modal-head">
            <div>
              <h2>Chi tiết & cập nhật đơn hàng</h2>
              @if (editOrder()) {
                <p class="modal-sub">{{ editOrder()!.orderCode }} — {{ editOrder()!.customerName }}</p>
              }
            </div>
            <button type="button" class="modal-close" (click)="closeEditModal()" aria-label="Đóng">×</button>
          </header>

          @if (editLoading()) {
            <div class="modal-body">
              <p class="page-state">Đang tải chi tiết đơn hàng...</p>
            </div>
          } @else if (editLoadError()) {
            <div class="modal-body">
              <p class="form-error">{{ editLoadError() }}</p>
              <div class="modal-foot">
                <button type="button" class="btn-action secondary" (click)="closeEditModal()">Đóng</button>
              </div>
            </div>
          } @else if (editOrder()) {
            <div class="modal-body">
              <section class="detail-section">
                <h3>Thông tin đơn hàng</h3>
                <div class="detail-grid">
                  <div>
                    <span class="detail-label">Khách hàng</span>
                    <strong>{{ editOrder()!.customerName }}</strong>
                    @if (editOrder()!.customerEmail) {
                      <div class="detail-muted">{{ editOrder()!.customerEmail }}</div>
                    }
                  </div>
                  <div>
                    <span class="detail-label">Số điện thoại</span>
                    <strong>{{ editOrder()!.phone || editOrder()!.receiverPhone || '—' }}</strong>
                  </div>
                  <div>
                    <span class="detail-label">Thanh toán</span>
                    <strong>{{ PAYMENT_LABELS[editOrder()!.paymentMethod] || editOrder()!.paymentMethod }}</strong>
                  </div>
                  <div>
                    <span class="detail-label">Ngày đặt</span>
                    <strong>{{ formatDateTime(editOrder()!.createdAt) }}</strong>
                  </div>
                  <div class="detail-span-2">
                    <span class="detail-label">Địa chỉ giao</span>
                    <strong>{{ editOrder()!.shippingAddress || '—' }}</strong>
                  </div>
                  @if (editOrder()!.note) {
                    <div class="detail-span-2">
                      <span class="detail-label">Ghi chú</span>
                      <strong>{{ editOrder()!.note }}</strong>
                    </div>
                  }
                </div>
              </section>

              @if (editOrder()!.status === 'cancelled' && editOrder()!.cancellationReasonLabel) {
                <section class="detail-section cancel-section">
                  <h3>Thông tin hủy đơn</h3>
                  <div class="detail-grid">
                    <div class="detail-span-2">
                      <span class="detail-label">Lý do hủy</span>
                      <strong>{{ editOrder()!.cancellationReasonLabel }}</strong>
                    </div>
                    @if (editOrder()!.cancelledAt) {
                      <div>
                        <span class="detail-label">Thời gian hủy</span>
                        <strong>{{ formatDateTime(editOrder()!.cancelledAt!) }}</strong>
                      </div>
                    }
                    @if (editOrder()!.cancelledBy) {
                      <div>
                        <span class="detail-label">Hủy bởi</span>
                        <strong>{{ editOrder()!.cancelledBy === 'user' ? 'Khách hàng' : 'Quản trị' }}</strong>
                      </div>
                    }
                  </div>
                </section>
              }

              @if (editOrder()!.items.length) {
                <section class="detail-section">
                  <h3>Sản phẩm</h3>
                  <div class="data-table-wrap">
                    <table class="data-table">
                      <thead>
                        <tr>
                          <th>Sản phẩm</th>
                          <th>SL</th>
                          <th>Đơn giá</th>
                          <th>Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (item of editOrder()!.items; track item.productId) {
                          <tr>
                            <td class="cell-strong">{{ item.productName }}</td>
                            <td>{{ item.quantity }}</td>
                            <td>{{ formatCurrency(item.price) }}</td>
                            <td>{{ formatCurrency(item.price * item.quantity) }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                  <div class="order-totals">
                    @if (editOrder()!.discountAmount > 0) {
                      <div class="order-total-row">
                        <span>Giảm giá</span>
                        <span>-{{ formatCurrency(editOrder()!.discountAmount) }}</span>
                      </div>
                    }
                    <div class="order-total-row order-total-row--main">
                      <span>Tổng cộng</span>
                      <strong>{{ formatCurrency(editOrder()!.totalAmount) }}</strong>
                    </div>
                  </div>
                </section>
              }

              <section class="detail-section">
                <h3>Quy trình trạng thái</h3>
                <div class="status-flow">
                  @for (step of statusPipeline; track step; let i = $index) {
                    <div
                      class="status-step"
                      [class.done]="isStepDone(step)"
                      [class.current]="editOrder()!.status === step"
                      [class.upcoming]="isStepUpcoming(step)"
                    >
                      <span class="status-step-dot">{{ i + 1 }}</span>
                      <span class="status-step-label">{{ STATUS_FLOW_LABELS[step] }}</span>
                    </div>
                    @if (i < statusPipeline.length - 1) {
                      <span class="status-step-line" [class.done]="isStepDone(statusPipeline[i + 1]) || editOrder()!.status === statusPipeline[i + 1]"></span>
                    }
                  }
                </div>
                <p class="field-hint">
                  Trạng thái hiện tại:
                  <span class="status-badge" [class]="editOrder()!.status">
                    {{ statusFlowLabel(editOrder()!.status) }}
                  </span>
                </p>
              </section>

              @if (editOrder()!.statusHistory.length) {
                <section class="detail-section">
                  <h3>Lịch sử thay đổi</h3>
                  <ul class="history-list">
                    @for (entry of editOrder()!.statusHistory.slice().reverse(); track $index) {
                      <li>
                        <strong>{{ statusFlowLabel(entry.fromStatus) }}</strong>
                        →
                        <strong>{{ statusFlowLabel(entry.toStatus) }}</strong>
                        <span class="history-time">{{ formatDateTime(entry.changedAt) }}</span>
                        <p class="history-reason">{{ entry.reason }}</p>
                      </li>
                    }
                  </ul>
                </section>
              }

              @if (canAdvanceStatus()) {
                <form [formGroup]="statusForm" (ngSubmit)="saveStatusChange()" class="status-form">
                  <h3>Cập nhật trạng thái</h3>
                  <label for="nextStatus">Trạng thái tiếp theo</label>
                  <select id="nextStatus" formControlName="status">
                    <option [value]="editOrder()!.status" disabled>
                      {{ statusFlowLabel(editOrder()!.status) }} (hiện tại)
                    </option>
                    @if (nextAllowedStatus()) {
                      <option [value]="nextAllowedStatus()">
                        {{ statusFlowLabel(nextAllowedStatus()!) }}
                      </option>
                    }
                  </select>
                  <p class="field-hint">Chỉ có thể chuyển sang bước kế tiếp, không được bỏ qua hoặc quay lại.</p>

                  @if (formError()) {
                    <p class="form-error">{{ formError() }}</p>
                  }

                  <div class="modal-foot">
                    <button type="button" class="btn-action secondary" (click)="closeEditModal()">Hủy</button>
                    <button type="submit" class="btn-action primary" [disabled]="saving()">
                      {{ saving() ? 'Đang lưu...' : 'Cập nhật trạng thái' }}
                    </button>
                  </div>
                </form>
              } @else {
                <section class="detail-section">
                  <p class="field-hint terminal-note">
                    @if (isPipelineStatus(editOrder()!.status) && editOrder()!.status === 'completed') {
                      Đơn hàng đã hoàn tất quy trình giao nhận. Không thể cập nhật thêm trạng thái.
                    } @else {
                      Đơn hàng ở trạng thái "{{ statusFlowLabel(editOrder()!.status) }}" — không thể cập nhật theo quy trình chuẩn.
                    }
                  </p>
                  <div class="modal-foot">
                    <button type="button" class="btn-action secondary" (click)="closeEditModal()">Đóng</button>
                  </div>
                </section>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host ::ng-deep .catalog-actions {
        display: none;
      }

      :host ::ng-deep [pageToolbar].orders-stats {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 0.75rem;
        padding: 1rem 1.15rem;
        border-bottom: 1px solid var(--border-light);
        background: #fafbfc;
      }

      :host ::ng-deep .stat-card {
        display: flex;
        align-items: flex-start;
        gap: 0.65rem;
        padding: 0.85rem 1rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        background: var(--surface);
        text-align: left;
        cursor: pointer;
        transition: border-color 0.15s, box-shadow 0.15s;
      }

      .stat-card:hover {
        border-color: #c5c9d0;
        box-shadow: var(--shadow-sm);
      }

      .stat-card.active {
        border-color: var(--text);
        box-shadow: var(--shadow-sm);
      }

      :host ::ng-deep .stat-icon {
        display: flex;
        width: 36px;
        height: 36px;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        background: var(--border-light);
        color: var(--text-secondary);
      }

      .stat-icon :deep(svg) {
        width: 18px;
        height: 18px;
      }

      :host ::ng-deep .stat-body {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      :host ::ng-deep .stat-label {
        font-size: 0.6875rem;
        font-weight: 600;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      :host ::ng-deep .stat-value {
        font-size: 1.25rem;
        font-weight: 700;
        line-height: 1.2;
        color: var(--text);
      }

      :host ::ng-deep .stat-sub {
        font-size: 0.6875rem;
        color: var(--muted);
      }

      .customer-cell {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        min-width: 180px;
      }

      .customer-avatar {
        width: 36px;
        height: 36px;
        flex-shrink: 0;
        border-radius: 50%;
        background: linear-gradient(145deg, #9ca3af, #6b7280);
        color: #fff;
        font-size: 0.75rem;
        font-weight: 600;
        display: grid;
        place-items: center;
      }

      .customer-email {
        font-size: 0.75rem;
        margin-top: 0.1rem;
      }

      .order-code {
        white-space: nowrap;
      }

      .payment-badge {
        display: inline-block;
        padding: 0.2rem 0.55rem;
        border-radius: 6px;
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.02em;
      }

      .payment-badge.cod {
        background: #f3f4f6;
        color: #374151;
      }

      .payment-badge.vnpay {
        background: #dbeafe;
        color: #1d4ed8;
      }

      .payment-badge.momo {
        background: #ede9fe;
        color: #6d28d9;
      }

      .status-badge.returned {
        background: #f3f4f6;
        color: #4b5563;
      }

      .cancel-section {
        padding: 0.85rem;
        background: #fef2f2;
        border-radius: 8px;
      }

      .cancel-section h3 {
        color: #b91c1c;
      }

      @media (max-width: 1280px) {
        :host ::ng-deep [pageToolbar].orders-stats {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      @media (max-width: 768px) {
        :host ::ng-deep [pageToolbar].orders-stats {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(15, 23, 42, 0.45);
        display: grid;
        place-items: center;
        padding: 1rem;
      }

      .modal-panel {
        width: min(440px, 100%);
        max-height: 90vh;
        overflow: auto;
        background: var(--surface);
        border-radius: 12px;
        box-shadow: 0 20px 48px rgba(0, 0, 0, 0.18);
      }

      .modal-panel--wide {
        width: min(760px, 100%);
      }

      .modal-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        padding: 1.15rem 1.25rem;
        border-bottom: 1px solid var(--border-light);
      }

      .modal-head h2 {
        margin: 0;
        font-size: 1.0625rem;
      }

      .modal-sub {
        margin: 0.25rem 0 0;
        font-size: 0.8125rem;
        color: var(--muted);
      }

      .modal-close {
        border: none;
        background: none;
        font-size: 1.5rem;
        line-height: 1;
        cursor: pointer;
        color: var(--muted);
      }

      .modal-body {
        padding: 1.25rem;
      }

      .detail-section {
        margin-bottom: 1.25rem;
      }

      .detail-section h3 {
        margin: 0 0 0.75rem;
        font-size: 0.875rem;
        font-weight: 600;
      }

      .detail-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.85rem 1rem;
      }

      .detail-span-2 {
        grid-column: span 2;
      }

      .detail-label {
        display: block;
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted);
        margin-bottom: 0.2rem;
      }

      .detail-muted {
        font-size: 0.8125rem;
        color: var(--muted);
      }

      .order-totals {
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--border-light);
      }

      .order-total-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: 0.35rem;
      }

      .order-total-row--main {
        font-size: 1rem;
        color: var(--text);
      }

      .status-flow {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        flex-wrap: wrap;
        margin-bottom: 0.75rem;
      }

      .status-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.35rem;
        min-width: 72px;
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
        border: 2px solid var(--border);
        color: var(--muted);
        background: var(--surface);
      }

      .status-step.done .status-step-dot,
      .status-step.current .status-step-dot {
        border-color: #15803d;
        background: #dcfce7;
        color: #15803d;
      }

      .status-step-label {
        font-size: 0.6875rem;
        color: var(--muted);
        line-height: 1.2;
      }

      .status-step.done .status-step-label,
      .status-step.current .status-step-label {
        color: var(--text);
        font-weight: 600;
      }

      .status-step-line {
        flex: 1;
        min-width: 24px;
        height: 2px;
        background: var(--border);
        margin-bottom: 1.1rem;
      }

      .status-step-line.done {
        background: #15803d;
      }

      .field-hint {
        font-size: 0.8125rem;
        color: var(--muted);
        margin: 0 0 0.75rem;
      }

      .terminal-note {
        padding: 0.75rem;
        background: var(--border-light);
        border-radius: 8px;
      }

      .history-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .history-list li {
        padding: 0.65rem 0;
        border-bottom: 1px solid var(--border-light);
        font-size: 0.875rem;
      }

      .history-time {
        display: block;
        font-size: 0.75rem;
        color: var(--muted);
        margin-top: 0.15rem;
      }

      .history-reason {
        margin: 0.35rem 0 0;
        font-size: 0.8125rem;
        color: var(--text-secondary);
      }

      .status-form label {
        display: block;
        margin-bottom: 0.35rem;
        font-size: 0.8125rem;
        font-weight: 500;
      }

      .status-form label em {
        color: #dc2626;
        font-style: normal;
      }

      .status-form select,
      .status-form textarea {
        width: 100%;
        margin-bottom: 0.75rem;
        padding: 0.55rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 0.875rem;
        font-family: inherit;
      }

      .form-error {
        color: #b91c1c;
        font-size: 0.8125rem;
        margin: 0 0 0.75rem;
      }

      .modal-foot {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
    `
  ]
})
export class OrdersComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly STATUS_LABELS = STATUS_LABELS;
  readonly STATUS_FLOW_LABELS = STATUS_FLOW_LABELS;
  readonly PAYMENT_LABELS = PAYMENT_LABELS;
  readonly statusPipeline = ORDER_STATUS_PIPELINE;
  readonly isPipelineStatus = isPipelineStatus;

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly orders = signal<Order[]>([]);
  readonly stats = signal<OrderStatistics | null>(null);
  readonly selectedOrderIds = signal<Set<string>>(new Set());
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly totalOrders = signal(0);
  readonly activeStatusFilter = signal('');

  readonly editModalOpen = signal(false);
  readonly editOrder = signal<OrderDetail | null>(null);
  readonly editLoading = signal(false);
  readonly editLoadError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  readonly nextAllowedStatus = computed(() => {
    const order = this.editOrder();
    if (!order) return null;
    return getNextOrderStatus(order.status);
  });

  readonly canAdvanceStatus = computed(() => {
    const order = this.editOrder();
    if (!order) return false;
    return canAdvanceOrderStatus(order.status);
  });

  statusForm = this.fb.group({
    status: ['', Validators.required],
    reason: ['']
  });

  readonly totalPages = computed(() => Math.ceil(this.totalOrders() / this.pageSize()) || 1);

  readonly allSelected = computed(() => {
    const n = this.orders().length;
    return n > 0 && this.selectedOrderIds().size === n;
  });

  readonly breadcrumbs = signal(orderSectionCrumbs('Tất cả đơn hàng'));

  readonly statCards: StatCard[] = [
    {
      key: 'all',
      label: 'Tất cả đơn hàng',
      sub: 'Tất cả thời gian',
      value: () => this.stats()?.totalOrders ?? 0,
      statusFilter: '',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 01-8 0"/></svg>`
    },
    {
      key: 'pending',
      label: 'Chờ xác nhận',
      sub: 'Cần xử lý',
      value: () => this.stats()?.pendingOrders ?? 0,
      statusFilter: 'pending',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`
    },
    {
      key: 'processing',
      label: 'Đang xử lý',
      sub: 'Đang chuẩn bị',
      value: () => this.stats()?.processingOrders ?? 0,
      statusFilter: 'processing',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
    },
    {
      key: 'shipping',
      label: 'Đang giao',
      sub: 'Trên đường',
      value: () => this.stats()?.shippingOrders ?? 0,
      statusFilter: 'shipping',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M1 3h15v13H1zM16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`
    },
    {
      key: 'completed',
      label: 'Đã nhận',
      sub: 'Hoàn tất',
      value: () => this.stats()?.completedOrders ?? 0,
      statusFilter: 'completed',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>`
    },
    {
      key: 'cancelled',
      label: 'Đã hủy',
      sub: 'Đơn hủy',
      value: () => this.stats()?.cancelledOrders ?? 0,
      statusFilter: 'cancelled',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>`
    }
  ];

  filterForm = new FormGroup({
    search: new FormControl(''),
    status: new FormControl(''),
    paymentMethod: new FormControl(''),
    startDate: new FormControl(''),
    endDate: new FormControl('')
  });

  ngOnInit(): void {
    this.loadStatistics();
    this.route.queryParamMap.subscribe((params) => {
      const status = params.get('status') || '';
      this.activeStatusFilter.set(status);
      this.filterForm.patchValue({ status }, { emitEvent: false });
      this.updateBreadcrumb(status);
      this.currentPage.set(1);
      this.loadOrders();
    });
  }

  pageSubtitle(): string {
    const s = this.activeStatusFilter();
    if (!s) return 'Danh sách tất cả đơn hàng trong hệ thống';
    return `Danh sách đơn hàng — ${STATUS_LABELS[s as OrderStatus] || s}`;
  }

  private updateBreadcrumb(status: string): void {
    const label = status ? STATUS_LABELS[status as OrderStatus] || status : 'Tất cả đơn hàng';
    this.breadcrumbs.set(orderSectionCrumbs(label));
  }

  loadStatistics(): void {
    this.orderService.getStatistics().subscribe({
      next: (data) => this.stats.set(data),
      error: () => this.stats.set(null)
    });
  }

  filterByStatus(status: string): void {
    this.router.navigate(['/admin/orders'], {
      queryParams: status ? { status } : {}
    });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    const status = this.filterForm.value.status || '';
    this.router.navigate(['/admin/orders'], {
      queryParams: {
        ...(status ? { status } : {})
      }
    });
    this.loadOrders();
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.selectedOrderIds.set(new Set());
    this.router.navigate(['/admin/orders']);
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const raw = this.filterForm.value;
    const filter: OrdersFilter = {
      page: this.currentPage(),
      limit: this.pageSize(),
      ...(raw.search ? { search: raw.search } : {}),
      ...(raw.status ? { status: raw.status } : {}),
      ...(raw.paymentMethod ? { paymentMethod: raw.paymentMethod } : {}),
      ...(raw.startDate ? { startDate: raw.startDate } : {}),
      ...(raw.endDate ? { endDate: raw.endDate } : {})
    };

    this.orderService.getOrders(filter).subscribe({
      next: (response: OrdersResponse) => {
        this.orders.set(response.data);
        this.totalOrders.set(response.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Không thể tải danh sách đơn hàng');
        this.isLoading.set(false);
      }
    });
  }

  rowIndex(i: number): number {
    return (this.currentPage() - 1) * this.pageSize() + i + 1;
  }

  rangeStart(): number {
    if (!this.totalOrders()) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  rangeEnd(): number {
    return Math.min(this.currentPage() * this.pageSize(), this.totalOrders());
  }

  pageNumbers(): (number | string)[] {
    const total = this.totalPages();
    const cur = this.currentPage();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [1];
    if (cur > 3) pages.push('…');
    for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) {
      pages.push(p);
    }
    if (cur < total - 2) pages.push('…');
    pages.push(total);
    return pages;
  }

  goPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadOrders();
  }

  onPageSizeChange(event: Event): void {
    this.pageSize.set(Number((event.target as HTMLSelectElement).value));
    this.currentPage.set(1);
    this.loadOrders();
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const next = new Set<string>();
    if (checked) {
      this.orders().forEach((o) => next.add(o.id));
    }
    this.selectedOrderIds.set(next);
  }

  toggleSelectOrder(orderId: string): void {
    this.selectedOrderIds.update((set) => {
      const next = new Set(set);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  isOrderSelected(orderId: string): boolean {
    return this.selectedOrderIds().has(orderId);
  }

  initials(name: string): string {
    const parts = (name || '?').trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  paymentClass(method: string): string {
    if (method === 'VNPay') return 'vnpay';
    if (method === 'Momo') return 'momo';
    return 'cod';
  }

  formatCurrency(amount: number): string {
    return `${amount.toLocaleString('vi-VN')} đ`;
  }

  formatDateTime(dateString: string): string {
    const d = new Date(dateString);
    return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  }

  viewOrder(order: Order): void {
    this.editOrderStatus(order);
  }

  editOrderStatus(order: Order): void {
    this.editModalOpen.set(true);
    this.editOrder.set(null);
    this.editLoadError.set(null);
    this.formError.set(null);
    this.editLoading.set(true);
    this.statusForm.reset();

    this.orderService.getOrderById(order.id).subscribe({
      next: (detail) => {
        this.editOrder.set(detail);
        const next = getNextOrderStatus(detail.status);
        this.statusForm.patchValue({
          status: next || detail.status,
          reason: ''
        });
        this.editLoading.set(false);
      },
      error: () => {
        this.editLoadError.set('Không thể tải chi tiết đơn hàng');
        this.editLoading.set(false);
      }
    });
  }

  closeEditModal(): void {
    this.editModalOpen.set(false);
    this.editOrder.set(null);
    this.editLoadError.set(null);
    this.formError.set(null);
    this.statusForm.reset();
  }

  statusFlowLabel(status: OrderStatus | string): string {
    return STATUS_FLOW_LABELS[status as OrderStatus] || STATUS_LABELS[status as OrderStatus] || status;
  }

  isStepDone(step: OrderStatus): boolean {
    const order = this.editOrder();
    if (!order || !isPipelineStatus(order.status)) return false;
    const currentIndex = ORDER_STATUS_PIPELINE.indexOf(order.status);
    const stepIndex = ORDER_STATUS_PIPELINE.indexOf(step);
    return stepIndex < currentIndex;
  }

  isStepUpcoming(step: OrderStatus): boolean {
    const order = this.editOrder();
    if (!order || !isPipelineStatus(order.status)) return false;
    const currentIndex = ORDER_STATUS_PIPELINE.indexOf(order.status);
    const stepIndex = ORDER_STATUS_PIPELINE.indexOf(step);
    return stepIndex > currentIndex;
  }

  saveStatusChange(): void {
    const order = this.editOrder();
    if (!order) return;

    this.formError.set(null);

    if (this.statusForm.invalid) {
      this.statusForm.markAllAsTouched();
      this.formError.set('Vui lòng chọn trạng thái tiếp theo.');
      return;
    }

    const nextStatus = this.statusForm.value.status as OrderStatus;
    const reason = String(this.statusForm.value.reason || '').trim();

    if (nextStatus === order.status) {
      this.formError.set('Vui lòng chọn trạng thái tiếp theo.');
      return;
    }

    const allowed = getNextOrderStatus(order.status);
    if (nextStatus !== allowed) {
      this.formError.set('Chỉ được chuyển sang bước kế tiếp trong quy trình.');
      return;
    }

    this.saving.set(true);
    this.orderService.updateOrderStatus(order.id, { status: nextStatus, reason }).subscribe({
      next: (updated) => {
        this.editOrder.set(updated);
        this.statusForm.patchValue({
          status: getNextOrderStatus(updated.status) || updated.status,
          reason: ''
        });
        this.saving.set(false);
        this.loadOrders();
        this.loadStatistics();
      },
      error: (err) => {
        this.formError.set(err?.error?.message || 'Không thể cập nhật trạng thái đơn hàng');
        this.saving.set(false);
      }
    });
  }

  moreActions(order: Order): void {
    if (confirm(`Xóa đơn hàng ${order.orderCode}?`)) {
      this.orderService.deleteOrder(order.id).subscribe({
        next: () => {
          this.loadOrders();
          this.loadStatistics();
        }
      });
    }
  }
}
