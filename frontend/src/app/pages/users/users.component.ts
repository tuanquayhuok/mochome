import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AdminCatalogPageComponent } from '../../shared/admin-catalog-page.component';
import { ApiService } from '../../core/services/api.service';
import { UserRow } from '../../core/models/admin-list.models';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  returned: 'Đã trả hàng'
};

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DecimalPipe,
    AdminCatalogPageComponent
  ],
  template: `
    <app-admin-catalog-page
      title="Quản lý khách hàng"
      subtitle="Danh sách khách hàng và thao tác tài khoản"
      [breadcrumbs]="[
        { label: 'Trang chủ', route: '/admin/dashboard' },
        { label: 'Quản lý khách hàng' }
      ]"
    >
      <div pageToolbar class="catalog-filter-bar">
        <div class="filter-fields">
          <div class="search-field">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              placeholder="Tìm khách hàng, email, SĐT..."
              [ngModel]="search()"
              (ngModelChange)="search.set($event); currentPage.set(1)"
            />
          </div>
          <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event); currentPage.set(1)">
            <option value="">Trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Đã khóa</option>
          </select>
          <select [ngModel]="tierFilter()" (ngModelChange)="tierFilter.set($event); currentPage.set(1)">
            <option value="">Hạng thành viên</option>
            <option value="vip">VIP</option>
            <option value="standard">Thường</option>
          </select>
        </div>
        <div class="filter-actions">
          <button type="button" class="btn-action secondary filter-btn" (click)="resetFilters()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M3 12a9 9 0 0115-6.7L21 3v6h-6M21 12a9 9 0 01-15 6.7L3 21v-6h6" />
            </svg>
            Đặt lại
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="page-state">Đang tải khách hàng...</div>
      } @else if (!filtered().length) {
        <div class="page-state">Không có khách hàng phù hợp bộ lọc.</div>
      } @else {
        <div class="data-table-wrap">
          <table class="data-table data-table--users">
            <thead>
              <tr>
                <th class="col-index">#</th>
                <th>Khách hàng</th>
                <th>Số điện thoại</th>
                <th>Đơn hàng</th>
                <th>Hạng</th>
                <th>Trạng thái</th>
                <th>Ngày đăng ký</th>
                <th class="col-actions">Hành động</th>
              </tr>
            </thead>
            <tbody>
              @for (item of paged(); track item._id; let i = $index) {
                <tr>
                  <td class="col-index cell-muted">{{ rowIndex(i) }}</td>
                  <td>
                    <div class="customer-cell">
                      <span class="customer-avatar">{{ initials(item.fullName) }}</span>
                      <div>
                        <div class="cell-strong">{{ item.fullName }}</div>
                        <div class="cell-muted">{{ item.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="cell-muted">{{ item.phone || '—' }}</td>
                  <td>
                    <button type="button" class="link-btn" (click)="viewOrders(item)">
                      {{ item.orderCount ?? 0 }} đơn
                    </button>
                  </td>
                  <td>
                    @if (item.isVip) {
                      <span class="status-badge processing">VIP</span>
                    } @else {
                      <span class="cell-muted">Thường</span>
                    }
                  </td>
                  <td>
                    <span
                      class="status-badge"
                      [class.completed]="item.isActive"
                      [class.cancelled]="!item.isActive"
                    >
                      {{ item.isActive ? 'Hoạt động' : 'Đã khóa' }}
                    </span>
                  </td>
                  <td class="cell-muted">{{ formatDate(item.createdAt) }}</td>
                  <td class="col-actions">
                    <div class="action-menu-wrap">
                      <button
                        type="button"
                        class="icon-round"
                        title="Hành động"
                        (click)="$event.stopPropagation(); toggleMenu(item._id)"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </button>
                      @if (openMenuId() === item._id) {
                        <div class="action-menu" (click)="$event.stopPropagation()">
                          <button type="button" (click)="openEdit(item)">Chỉnh sửa thông tin</button>
                          @if (item.isActive) {
                            <button type="button" class="danger" (click)="lockAccount(item)">
                              Khóa tài khoản
                            </button>
                          } @else {
                            <button type="button" (click)="unlockAccount(item)">Mở khóa tài khoản</button>
                          }
                          @if (!item.isVip) {
                            <button type="button" (click)="upgradeVip(item)">Thăng cấp VIP</button>
                          } @else {
                            <button type="button" (click)="downgradeVip(item)">Hạ hạng thường</button>
                          }
                          <button type="button" (click)="viewOrders(item)">Lịch sử mua hàng</button>
                        </div>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="table-bulk-footer">
          <div class="bulk-left"></div>
          <div class="bulk-right">
            <span>Hiển thị {{ rangeStart() }} – {{ rangeEnd() }} trong {{ filtered().length }} khách</span>
            <select class="page-size-select" [ngModel]="pageSize()" (ngModelChange)="setPageSize($event)">
              <option [ngValue]="10">10 / trang</option>
              <option [ngValue]="20">20 / trang</option>
              <option [ngValue]="50">50 / trang</option>
            </select>
            <div class="pagination-btns">
              <button type="button" class="btn-page" (click)="goPage(currentPage() - 1)" [disabled]="currentPage() === 1">
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

    @if (editUser()) {
      <div class="modal-backdrop" (click)="closeEdit()">
        <div class="modal-panel" role="dialog" (click)="$event.stopPropagation()">
          <header class="modal-head">
            <h2>Chỉnh sửa khách hàng</h2>
            <button type="button" class="modal-close" (click)="closeEdit()" aria-label="Đóng">×</button>
          </header>
          <form [formGroup]="editForm" (ngSubmit)="saveEdit()" class="modal-body">
            <label>Họ tên <em>*</em></label>
            <input formControlName="fullName" />
            <label>Email <em>*</em></label>
            <input type="email" formControlName="email" />
            <label>Số điện thoại</label>
            <input formControlName="phone" />
            <label>Mật khẩu mới (để trống nếu không đổi)</label>
            <input type="password" formControlName="password" placeholder="Tối thiểu 6 ký tự" />
            @if (formError()) {
              <p class="form-error">{{ formError() }}</p>
            }
            <div class="modal-foot">
              <button type="button" class="btn-action secondary" (click)="closeEdit()">Hủy</button>
              <button type="submit" class="btn-action primary" [disabled]="saving()">
                {{ saving() ? 'Đang lưu...' : 'Lưu thay đổi' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    @if (ordersModal()) {
      <div class="modal-backdrop" (click)="closeOrders()">
        <div class="modal-panel modal-panel--wide" role="dialog" (click)="$event.stopPropagation()">
          <header class="modal-head">
            <div>
              <h2>Lịch sử mua hàng</h2>
              <p class="modal-sub">{{ ordersModal()!.fullName }} — {{ ordersModal()!.email }}</p>
            </div>
            <button type="button" class="modal-close" (click)="closeOrders()" aria-label="Đóng">×</button>
          </header>
          <div class="modal-body modal-body--table">
            @if (ordersLoading()) {
              <p class="page-state">Đang tải đơn hàng...</p>
            } @else if (!ordersList().length) {
              <p class="page-state">Khách hàng chưa có đơn hàng nào.</p>
            } @else {
              <div class="data-table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Tổng tiền</th>
                      <th>Thanh toán</th>
                      <th>Trạng thái</th>
                      <th>Ngày đặt</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (o of ordersList(); track o.id) {
                      <tr>
                        <td class="cell-strong">{{ o.orderCode }}</td>
                        <td>{{ o.totalAmount | number }} đ</td>
                        <td>{{ o.paymentMethod }}</td>
                        <td>
                          <span class="status-badge" [class]="o.status">
                            {{ statusLabel(o.status) }}
                          </span>
                        </td>
                        <td class="cell-muted">{{ formatDate(o.createdAt) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .customer-cell {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-width: 200px;
      }

      .customer-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(145deg, #8b6914, #5c4033);
        color: #fff;
        font-size: 0.75rem;
        font-weight: 700;
        display: grid;
        place-items: center;
        flex-shrink: 0;
      }

      .data-table--users .col-actions {
        width: 72px;
      }

      .action-menu-wrap {
        position: relative;
        display: flex;
        justify-content: flex-end;
      }

      .action-menu {
        position: absolute;
        right: 0;
        top: calc(100% + 4px);
        z-index: 30;
        min-width: 200px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(16, 24, 40, 0.12);
        padding: 0.35rem 0;
      }

      .action-menu button {
        display: block;
        width: 100%;
        text-align: left;
        padding: 0.55rem 0.85rem;
        border: none;
        background: none;
        font-size: 0.8125rem;
        color: var(--text);
        cursor: pointer;
      }

      .action-menu button:hover {
        background: var(--border-light);
      }

      .action-menu button.danger {
        color: #b91c1c;
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
        width: min(720px, 100%);
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

      .modal-body label {
        display: block;
        margin-bottom: 0.35rem;
        font-size: 0.8125rem;
        font-weight: 500;
      }

      .modal-body label em {
        color: #dc2626;
        font-style: normal;
      }

      .modal-body input {
        width: 100%;
        margin-bottom: 0.85rem;
        padding: 0.55rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 0.875rem;
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

      .modal-body--table {
        padding: 0;
      }

      .modal-body--table .page-state {
        padding: 2rem;
      }
    `
  ],
  host: {
    '(document:click)': 'closeMenuOnOutside()'
  }
})
export class UsersComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly rows = signal<UserRow[]>([]);
  readonly search = signal('');
  readonly statusFilter = signal('');
  readonly tierFilter = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly openMenuId = signal<string | null>(null);

  readonly editUser = signal<UserRow | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');

  readonly ordersModal = signal<UserRow | null>(null);
  readonly ordersLoading = signal(false);
  readonly ordersList = signal<
    {
      id: string;
      orderCode: string;
      totalAmount: number;
      paymentMethod: string;
      status: string;
      createdAt: string;
    }[]
  >([]);

  editForm = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['']
  });

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.rows()
      .filter((r) => r.role === 'user')
      .filter((row) => {
        if (q && !`${row.fullName} ${row.email} ${row.phone || ''}`.toLowerCase().includes(q)) {
          return false;
        }
        if (this.statusFilter() === 'active' && !row.isActive) return false;
        if (this.statusFilter() === 'locked' && row.isActive) return false;
        if (this.tierFilter() === 'vip' && !row.isVip) return false;
        if (this.tierFilter() === 'standard' && row.isVip) return false;
        return true;
      });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize()))
  );

  readonly paged = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const tier = params.get('tier');
      const status = params.get('status');
      if (tier === 'vip') {
        this.tierFilter.set('vip');
        this.statusFilter.set('');
      } else if (status === 'locked') {
        this.statusFilter.set('locked');
        this.tierFilter.set('');
      } else if (status === 'active') {
        this.statusFilter.set('active');
        this.tierFilter.set('');
      }
      this.currentPage.set(1);
    });
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.api.list<UserRow>('users').subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  resetFilters(): void {
    this.search.set('');
    this.statusFilter.set('');
    this.tierFilter.set('');
    this.currentPage.set(1);
  }

  rowIndex(i: number): number {
    return (this.currentPage() - 1) * this.pageSize() + i + 1;
  }

  rangeStart(): number {
    if (!this.filtered().length) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  rangeEnd(): number {
    return Math.min(this.currentPage() * this.pageSize(), this.filtered().length);
  }

  pageNumbers(): (number | string)[] {
    const total = this.totalPages();
    const cur = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | string)[] = [1];
    if (cur > 3) pages.push('…');
    for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p);
    if (cur < total - 2) pages.push('…');
    pages.push(total);
    return pages;
  }

  goPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  setPageSize(size: number): void {
    this.pageSize.set(Number(size));
    this.currentPage.set(1);
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('vi-VN');
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] || status;
  }

  toggleMenu(id: string): void {
    this.openMenuId.update((cur) => (cur === id ? null : id));
  }

  closeMenuOnOutside(): void {
    this.openMenuId.set(null);
  }

  openEdit(user: UserRow): void {
    this.openMenuId.set(null);
    this.formError.set('');
    this.editUser.set(user);
    this.editForm.patchValue({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      password: ''
    });
  }

  closeEdit(): void {
    this.editUser.set(null);
  }

  saveEdit(): void {
    const user = this.editUser();
    if (!user || this.editForm.invalid) {
      this.formError.set('Vui lòng điền đầy đủ thông tin hợp lệ.');
      return;
    }
    const { fullName, email, phone, password } = this.editForm.getRawValue();
    const payload: Record<string, unknown> = { fullName, email, phone };
    if (password?.trim()) payload['password'] = password.trim();

    this.saving.set(true);
    this.formError.set('');
    this.api.update<UserRow>('users', user._id, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeEdit();
        this.loadUsers();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.error?.message || 'Không lưu được thông tin.');
      }
    });
  }

  lockAccount(user: UserRow): void {
    if (!confirm(`Khóa tài khoản "${user.fullName}"? Khách sẽ không đăng nhập được.`)) return;
    this.patchUser(user, { isActive: false });
  }

  unlockAccount(user: UserRow): void {
    this.patchUser(user, { isActive: true });
  }

  upgradeVip(user: UserRow): void {
    if (!confirm(`Thăng cấp VIP cho "${user.fullName}"?`)) return;
    this.patchUser(user, { isVip: true });
  }

  downgradeVip(user: UserRow): void {
    if (!confirm(`Hạ hạng thường cho "${user.fullName}"?`)) return;
    this.patchUser(user, { isVip: false });
  }

  patchUser(user: UserRow, payload: Partial<UserRow>): void {
    this.openMenuId.set(null);
    this.api.update<UserRow>('users', user._id, payload).subscribe({
      next: () => this.loadUsers(),
      error: (err) => alert(err?.error?.message || 'Thao tác thất bại.')
    });
  }

  viewOrders(user: UserRow): void {
    this.openMenuId.set(null);
    this.ordersModal.set(user);
    this.ordersLoading.set(true);
    this.ordersList.set([]);
    this.api.getUserOrders(user._id).subscribe({
      next: (res) => {
        this.ordersList.set(res.data);
        this.ordersLoading.set(false);
      },
      error: () => {
        this.ordersLoading.set(false);
        alert('Không tải được lịch sử đơn hàng.');
      }
    });
  }

  closeOrders(): void {
    this.ordersModal.set(null);
  }
}
