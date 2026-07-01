import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { UserRow } from '../../core/models/admin-list.models';
import { AdminPageShellComponent } from '../../shared/admin-page-shell.component';

type RoleFilter = 'all' | 'admin' | 'user';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminPageShellComponent],
  template: `
    <app-admin-page-shell>
      <div pageToolbar class="catalog-filter-bar">
        <div class="filter-fields">
          <div class="search-field">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              placeholder="Tìm họ tên, email, SĐT..."
              [value]="search()"
              (input)="search.set($any($event.target).value)"
            />
          </div>
          <select [value]="roleFilter()" (change)="onRoleFilter($event)">
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Quản trị viên</option>
            <option value="user">Khách hàng</option>
          </select>
        </div>
      </div>

      @if (loading()) {
        <div class="page-state">Đang tải danh sách người dùng...</div>
      } @else if (!filteredRows().length) {
        <div class="page-state">Không có người dùng phù hợp.</div>
      } @else {
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th class="col-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              @for (item of filteredRows(); track item._id) {
                <tr>
                  <td class="cell-strong">{{ item.fullName }}</td>
                  <td class="cell-muted">{{ item.email }}</td>
                  <td>{{ item.phone || '—' }}</td>
                  <td>
                    <span class="role-badge" [class.admin]="item.role === 'admin'">
                      {{ roleLabel(item.role) }}
                    </span>
                  </td>
                  <td>
                    <span
                      class="status-badge"
                      [class.completed]="item.isActive"
                      [class.cancelled]="!item.isActive"
                    >
                      {{ item.isActive ? 'Hoạt động' : 'Vô hiệu' }}
                    </span>
                  </td>
                  <td class="cell-muted">{{ formatDate(item.createdAt) }}</td>
                  <td class="col-actions">
                    <button type="button" class="action-btn-info" (click)="openDetail(item)" title="Xem chi tiết">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="info-svg">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                    </button>
                    <button type="button" class="action-btn-edit" (click)="openEdit(item)">Sửa</button>
                    <button type="button" class="action-btn-lock" [class.locked]="!item.isActive" (click)="toggleLock(item)">
                      {{ item.isActive ? 'Khóa' : 'Mở khóa' }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <p class="table-meta muted">{{ filteredRows().length }} / {{ rows().length }} người dùng</p>
      }

      @if (modalOpen()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal panel" role="dialog" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <h2>{{ editingId() ? 'Cập nhật người dùng' : 'Thêm người dùng' }}</h2>
              <button type="button" class="modal-close" (click)="closeModal()" aria-label="Đóng">
                ×
              </button>
            </header>

            <form [formGroup]="form" (ngSubmit)="save()" class="modal-form">
              <label>Họ tên</label>
              <input type="text" formControlName="fullName" placeholder="Nguyễn Văn A" />
              @if (form.get('fullName')?.touched && form.get('fullName')?.invalid) {
                <span class="field-error">Vui lòng nhập họ tên.</span>
              }

              <label>Email</label>
              <input type="email" formControlName="email" placeholder="user@example.com" />
              @if (form.get('email')?.touched && form.get('email')?.invalid) {
                <span class="field-error">
                  @if (form.get('email')?.hasError('required')) {
                    Vui lòng nhập email.
                  } @else {
                    Email không đúng định dạng.
                  }
                </span>
              }

              <label>Số điện thoại</label>
              <input type="text" formControlName="phone" placeholder="0901234567" />

              <label>Vai trò</label>
              <select formControlName="role">
                <option value="user">Khách hàng</option>
                <option value="admin">Quản trị viên</option>
              </select>

              <label>Trạng thái</label>
              <select formControlName="isActive">
                <option [ngValue]="true">Hoạt động</option>
                <option [ngValue]="false">Vô hiệu</option>
              </select>

              <label>
                {{ editingId() ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu' }}
              </label>
              <input
                type="password"
                formControlName="password"
                [placeholder]="editingId() ? '••••••••' : 'Tối thiểu 6 ký tự'"
              />
              @if (form.get('password')?.touched && form.get('password')?.invalid) {
                <span class="field-error">
                  @if (form.get('password')?.hasError('required')) {
                    Vui lòng nhập mật khẩu.
                  } @else {
                    Mật khẩu tối thiểu 6 ký tự.
                  }
                </span>
              }

              @if (formError()) {
                <p class="form-hint err">{{ formError() }}</p>
              }

              <div class="modal-actions">
                <button type="button" class="btn-action secondary" (click)="closeModal()">
                  Hủy
                </button>
                <button type="submit" class="btn-action primary" [disabled]="saving()">
                  {{ saving() ? 'Đang lưu...' : 'Lưu' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      @if (detailUser()) {
        <div class="modal-backdrop" (click)="closeDetail()">
          <div class="modal panel detail-modal" role="dialog" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <h2>Chi tiết người dùng</h2>
              <button type="button" class="modal-close" (click)="closeDetail()" aria-label="Đóng">
                ×
              </button>
            </header>

            <div class="detail-content">
              <!-- Thông tin cơ bản -->
              <div class="detail-section">
                <h3>Thông tin tài khoản</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-lbl">Họ tên:</span>
                    <span class="info-val cell-strong">{{ detailUser()?.fullName }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-lbl">Email:</span>
                    <span class="info-val">{{ detailUser()?.email }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-lbl">Số điện thoại:</span>
                    <span class="info-val">{{ detailUser()?.phone || '—' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-lbl">Vai trò:</span>
                    <span class="info-val">
                      <span class="role-badge" [class.admin]="detailUser()?.role === 'admin'">
                        {{ roleLabel(detailUser()?.role || '') }}
                      </span>
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-lbl">Trạng thái:</span>
                    <span class="info-val">
                      <span
                        class="status-badge"
                        [class.completed]="detailUser()?.isActive"
                        [class.cancelled]="!detailUser()?.isActive"
                      >
                        {{ detailUser()?.isActive ? 'Hoạt động' : 'Vô hiệu' }}
                      </span>
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-lbl">Ngày tạo:</span>
                    <span class="info-val">{{ formatDate(detailUser()?.createdAt) }}</span>
                  </div>
                </div>
              </div>

              <!-- Lịch sử mua hàng -->
              <div class="detail-section order-history-section">
                <h3>Lịch sử mua hàng</h3>
                
                @if (loadingDetails()) {
                  <div class="loading-state">Đang tải lịch sử mua hàng...</div>
                } @else if (!detailOrders().length) {
                  <div class="empty-state">Chưa có đơn hàng nào.</div>
                } @else {
                  <div class="order-table-wrap">
                    <table class="detail-order-table">
                      <thead>
                        <tr>
                          <th>Mã đơn</th>
                          <th>Ngày mua</th>
                          <th>Tổng tiền</th>
                          <th>Thanh toán</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (order of detailOrders(); track order.id) {
                          <tr>
                            <td class="cell-strong">{{ order.orderCode }}</td>
                            <td class="cell-muted">{{ formatDate(order.createdAt) }}</td>
                            <td class="cell-strong">{{ formatCurrency(order.totalAmount) }}</td>
                            <td>{{ order.paymentMethod === 'cod' ? 'COD' : 'Chuyển khoản' }}</td>
                            <td>
                              <span class="status-badge" [class]="order.status">
                                {{ orderStatusLabel(order.status) }}
                              </span>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </app-admin-page-shell>
  `,
  styles: [
    `
      .filter-select {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 0.8125rem;
        background: var(--surface);
        color: var(--text);
      }

      .col-actions {
        width: 190px;
        text-align: right;
        white-space: nowrap;
      }

      .action-btn-info {
        border: 1px solid var(--border);
        background: #ffffff;
        padding: 0.35rem;
        margin-right: 0.5rem;
        border-radius: 6px;
        color: var(--text-secondary);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .action-btn-info:hover {
        background: var(--border-light);
        color: var(--text);
        border-color: #9ca3af;
      }

      .info-svg {
        width: 14px;
        height: 14px;
      }

      .action-btn-edit {
        border: none;
        background: #8c6239; /* Wood primary color */
        padding: 0.35rem 0.75rem;
        border-radius: 6px;
        font-size: 0.8125rem;
        font-weight: 600;
        color: #ffffff;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(140, 98, 57, 0.15);
      }

      .action-btn-edit:hover {
        background: #a07246;
        box-shadow: 0 4px 6px rgba(140, 98, 57, 0.25);
      }

      .action-btn-lock {
        border: 1px solid #ebdcd0;
        background: #ffffff;
        padding: 0.3rem 0.65rem;
        margin-left: 0.5rem;
        border-radius: 6px;
        font-size: 0.8125rem;
        font-weight: 600;
        color: #dc2626; /* red text for active -> lock action */
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .action-btn-lock:hover {
        background: #fee2e2;
        border-color: #fca5a5;
      }

      .action-btn-lock.locked {
        color: #16a34a; /* green text for locked -> unlock action */
        border-color: #dcfce7;
      }

      .action-btn-lock.locked:hover {
        background: #dcfce7;
        border-color: #bbf7d0;
      }

      .field-error {
        display: block;
        font-size: 0.75rem;
        color: #dc2626;
        font-weight: 500;
        margin-top: 0.15rem;
        text-align: left;
      }

      .role-badge {
        display: inline-block;
        padding: 0.2rem 0.55rem;
        border-radius: 6px;
        font-size: 0.6875rem;
        font-weight: 600;
        background: var(--border-light);
        color: var(--text-secondary);
      }

      .role-badge.admin {
        background: #e0e7ff;
        color: #3730a3;
      }

      .table-meta {
        margin: 0.75rem 0 0;
        font-size: 0.75rem;
      }

      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 100;
        background: rgba(15, 23, 42, 0.35);
        display: grid;
        place-items: center;
        padding: 1rem;
      }

      .modal {
        width: 100%;
        max-width: 440px;
        padding: 0;
        overflow: hidden;
      }

      .modal-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.15rem;
        border-bottom: 1px solid var(--border-light);
      }

      .modal-head h2 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
      }

      .modal-close {
        border: none;
        background: transparent;
        font-size: 1.5rem;
        line-height: 1;
        color: var(--muted);
        cursor: pointer;
        padding: 0 0.25rem;
      }

      .modal-form {
        padding: 1rem 1.15rem 1.15rem;
        display: grid;
        gap: 0.5rem;
      }

      .modal-form label {
        font-size: 0.8125rem;
        font-weight: 600;
        margin-top: 0.35rem;
      }

      .modal-form input,
      .modal-form select {
        width: 100%;
        padding: 0.55rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 0.8125rem;
        background: var(--surface);
      }

      .modal-form input:focus,
      .modal-form select:focus {
        outline: none;
        border-color: #9ca3af;
        box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.12);
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 0.75rem;
      }

      .detail-modal {
        max-width: 680px;
        width: 100%;
      }

      .detail-content {
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        max-height: 80vh;
        overflow-y: auto;
      }

      .detail-section h3 {
        margin: 0 0 0.85rem;
        font-size: 0.875rem;
        font-weight: 700;
        color: #8c6239;
        border-bottom: 1.5px solid #ebdcd0;
        padding-bottom: 0.35rem;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem 1.5rem;
      }

      .info-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
      }

      .info-lbl {
        color: var(--muted);
        font-weight: 500;
        min-width: 90px;
      }

      .info-val {
        color: var(--text);
      }

      .loading-state,
      .empty-state {
        text-align: center;
        padding: 2rem;
        color: var(--muted);
        font-size: 0.8125rem;
      }

      .order-table-wrap {
        overflow-x: auto;
        border: 1px solid var(--border-light);
        border-radius: 8px;
      }

      .detail-order-table {
        width: 100%;
        border-collapse: collapse;
      }

      .detail-order-table th {
        background: #f9fafb;
        padding: 0.6rem 0.85rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--muted);
        border-bottom: 1px solid var(--border);
      }

      .detail-order-table td {
        padding: 0.7rem 0.85rem;
        font-size: 0.8125rem;
        border-bottom: 1px solid var(--border-light);
      }

      .detail-order-table tr:last-child td {
        border-bottom: none;
      }
    `
  ]
})
export class AccountComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly rows = signal<UserRow[]>([]);
  readonly loading = signal(true);
  readonly search = signal('');
  readonly roleFilter = signal<RoleFilter>('all');
  readonly modalOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');

  readonly detailUser = signal<UserRow | null>(null);
  readonly detailOrders = signal<any[]>([]);
  readonly loadingDetails = signal(false);

  readonly filteredRows = computed(() => {
    const q = this.search().trim().toLowerCase();
    const role = this.roleFilter();
    return this.rows().filter((u) => {
      if (role !== 'all' && u.role !== role) return false;
      if (!q) return true;
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q)
      );
    });
  });

  form = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    role: ['user' as 'admin' | 'user', Validators.required],
    isActive: [true],
    password: ['']
  });

  ngOnInit(): void {
    this.load();
  }

  onRoleFilter(event: Event): void {
    this.roleFilter.set((event.target as HTMLSelectElement).value as RoleFilter);
  }

  roleLabel(role: string): string {
    return role === 'admin' ? 'Quản trị viên' : 'Khách hàng';
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('vi-VN');
  }

  openCreate(): void {
    this.editingId.set(null);
    this.formError.set('');
    this.form.reset({
      fullName: '',
      email: '',
      phone: '',
      role: 'user',
      isActive: true,
      password: ''
    });
    this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.get('password')?.updateValueAndValidity();
    this.modalOpen.set(true);
  }

  openEdit(user: UserRow): void {
    this.editingId.set(user._id);
    this.formError.set('');
    this.form.reset({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      role: user.role === 'admin' ? 'admin' : 'user',
      isActive: user.isActive !== false,
      password: ''
    });
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editingId.set(null);
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.formError.set('Vui lòng nhập đầy đủ thông tin hợp lệ.');
      return;
    }

    const raw = this.form.getRawValue();
    const id = this.editingId();

    if (!id && (!raw.password || raw.password.length < 6)) {
      this.formError.set('Mật khẩu tối thiểu 6 ký tự.');
      return;
    }

    if (id && raw.password && raw.password.length < 6) {
      this.formError.set('Mật khẩu mới tối thiểu 6 ký tự.');
      return;
    }

    const payload: Record<string, unknown> = {
      fullName: raw.fullName,
      email: raw.email,
      phone: raw.phone,
      role: raw.role,
      isActive: raw.isActive === true || String(raw.isActive) === 'true'
    };

    if (raw.password) {
      payload['password'] = raw.password;
    }

    this.saving.set(true);
    this.formError.set('');

    const req = id
      ? this.api.update<UserRow>('users', id, payload)
      : this.api.create<UserRow>('users', payload);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.error?.message || 'Không thể lưu người dùng.');
      }
    });
  }

  toggleLock(user: UserRow): void {
    const actionText = user.isActive ? 'Khóa' : 'Mở khóa';
    if (!confirm(`Bạn có chắc chắn muốn ${actionText.toLowerCase()} tài khoản "${user.fullName}"?`)) return;

    this.api.update<UserRow>('users', user._id, { isActive: !user.isActive }).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.message || `Không thể ${actionText.toLowerCase()} tài khoản.`)
    });
  }

  openDetail(user: UserRow): void {
    this.detailUser.set(user);
    this.detailOrders.set([]);
    this.loadingDetails.set(true);
    this.api.getUserOrders(user._id).subscribe({
      next: (res) => {
        this.detailOrders.set(res.data || []);
        this.loadingDetails.set(false);
      },
      error: () => {
        this.loadingDetails.set(false);
      }
    });
  }

  closeDetail(): void {
    this.detailUser.set(null);
    this.detailOrders.set([]);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }

  orderStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Chờ xác nhận',
      processing: 'Đang xử lý',
      shipping: 'Đang giao',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      returned: 'Đã trả hàng'
    };
    return labels[status] || status;
  }

  private load(): void {
    this.loading.set(true);
    this.api.list<UserRow>('users').subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
