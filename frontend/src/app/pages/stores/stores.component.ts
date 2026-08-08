import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';
import { AdminCatalogPageComponent } from '../../shared/admin-catalog-page.component';

export interface InventoryItem {
  product: {
    _id: string;
    name: string;
    sku: string;
  };
  stock: number;
}

export interface PartnerStoreRow {
  _id: string;
  name: string;
  address: string;
  googleMapUrl?: string;
  phone: string;
  email?: string;
  manager: string;
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Standard';
  supplyVolume: number;
  inventory: InventoryItem[];
  isActive: boolean;
  createdAt?: string;
}

export interface ProductItemSummary {
  _id: string;
  name: string;
  sku: string;
}

@Component({
  selector: 'app-stores',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AdminCatalogPageComponent],
  template: `
    <app-admin-catalog-page
      title="Hệ thống Đại lý & Chi nhánh"
      subtitle="Quản lý và cấp phát hàng hóa cho các cửa hàng đại lý trực thuộc Tổng công ty"
      [breadcrumbs]="crumbs"
    >
      <button catalogActions type="button" class="btn-action primary" (click)="openCreate()">
        + Đăng ký Đại lý mới
      </button>

      <div pageToolbar class="catalog-filter-bar catalog-filter-bar--simple">
        <div class="search-field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Tìm đại lý, chi nhánh, địa chỉ..."
            [ngModel]="search()"
            (ngModelChange)="onSearchChange($event)"
          />
        </div>
        @if (rows().length) {
          <p class="toolbar-meta muted">{{ rows().length }} đại lý đang hoạt động</p>
        }
      </div>

      @if (loading()) {
        <div class="page-state">Đang tải danh sách đại lý...</div>
      } @else if (!rows().length) {
        <div class="page-state">
          Chưa có đại lý nào được ghi nhận.
          <button type="button" class="btn-action primary state-action" (click)="openCreate()">
            + Đăng ký Đại lý đầu tiên
          </button>
        </div>
      } @else {
        @if (!filtered().length) {
          <div class="page-state">Không tìm thấy đại lý phù hợp bộ lọc.</div>
        } @else {
          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên Đại lý / Chi nhánh</th>
                  <th>Cấp độ</th>
                  <th>Địa chỉ & Bản đồ</th>
                  <th>Liên hệ</th>
                  <th>Đại diện</th>
                  <th>Số mặt hàng / Tồn kho</th>
                  <th>Doanh số cấp hàng</th>
                  <th>Trạng thái</th>
                  <th class="col-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                @for (item of paged(); track item._id; let i = $index) {
                  <tr>
                    <td class="cell-muted">{{ rowIndex(i) }}</td>
                    <td>
                      <div class="store-name-cell">
                        <strong>{{ item.name }}</strong>
                        <span class="muted-subtext">{{ item.email || 'Chưa cập nhật email' }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="tier-badge" [class]="item.tier.toLowerCase()">
                        {{ item.tier }}
                      </span>
                    </td>
                    <td>
                      <div class="address-cell">
                        <span>{{ item.address }}</span>
                        @if (item.googleMapUrl) {
                          <a
                            [href]="item.googleMapUrl"
                            target="_blank"
                            class="map-link-btn"
                            title="Xem trên Google Maps"
                          >
                            📍 Chỉ đường Map
                          </a>
                        }
                      </div>
                    </td>
                    <td>{{ item.phone }}</td>
                    <td class="cell-muted">{{ item.manager }}</td>
                    <td>
                      <div class="stock-summary-cell">
                        <strong>{{ item.inventory?.length || 0 }} mã hàng</strong>
                        <span>(Tổng: {{ getStoreTotalStock(item) }} sản phẩm)</span>
                      </div>
                    </td>
                    <td class="cell-strong text-right">
                      {{ item.supplyVolume | number }} đ
                    </td>
                    <td>
                      <button
                        type="button"
                        class="badge-toggle"
                        [class.active]="item.isActive"
                        (click)="toggleStatus(item)"
                      >
                        {{ item.isActive ? 'Hợp tác' : 'Tạm dừng' }}
                      </button>
                    </td>
                    <td class="col-actions">
                      <div class="icon-actions">
                        <button type="button" class="icon-round" title="Sửa" (click)="openEdit(item)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button type="button" class="icon-round delete" title="Xóa" (click)="remove(item)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (maxPages() > 1) {
            <div class="pagination-footer">
              <button [disabled]="currentPage() === 1" (click)="currentPage.set(currentPage() - 1)">Trang trước</button>
              <span>Trang {{ currentPage() }} / {{ maxPages() }}</span>
              <button [disabled]="currentPage() === maxPages()" (click)="currentPage.set(currentPage() + 1)">Trang sau</button>
            </div>
          }
        }
      }

      <!-- Modal Dialog -->
      @if (modalOpen()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal-container" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingId() ? 'Cập Nhật Chi Nhánh Đại Lý' : 'Đăng Ký Đại Lý Cấp Dưới Mới' }}</h2>
              <button class="modal-close-btn" (click)="closeModal()">×</button>
            </div>

            <form [formGroup]="form" (ngSubmit)="save()" class="modal-form">
              @if (formError()) {
                <div class="form-error-alert">{{ formError() }}</div>
              }

              <div class="form-group">
                <label for="store-name">Tên Đại lý / Chi nhánh <span class="required">*</span></label>
                <input
                  id="store-name"
                  type="text"
                  formControlName="name"
                  placeholder="Nhập tên đại lý (Ví dụ: Mộc Home Hải Phòng)"
                />
              </div>

              <div class="form-group">
                <label for="store-manager">Người phụ trách / Quản lý <span class="required">*</span></label>
                <input id="store-manager" type="text" formControlName="manager" placeholder="Tên người đại diện quản lý" />
              </div>

              <div class="form-group">
                <label for="store-phone">Số điện thoại liên hệ <span class="required">*</span></label>
                <input id="store-phone" type="text" formControlName="phone" placeholder="Số điện thoại / Hotline" />
              </div>

              <div class="form-group">
                <label for="store-email">Email Đại lý</label>
                <input id="store-email" type="text" formControlName="email" placeholder="example@mochome.vn" />
              </div>

              <div class="form-group">
                <label for="store-tier">Cấp độ đại lý</label>
                <select id="store-tier" formControlName="tier" class="tier-select">
                  <option value="Platinum">Platinum (Đại lý cấp 1)</option>
                  <option value="Gold">Gold (Đại lý cấp 2)</option>
                  <option value="Silver">Silver (Đại lý cấp 3)</option>
                  <option value="Standard">Standard (Cửa hàng liên kết)</option>
                </select>
              </div>

              <div class="form-group">
                <label for="store-volume">Tổng doanh số cấp hàng (đ)</label>
                <input id="store-volume" type="number" formControlName="supplyVolume" placeholder="Doanh số cung cấp" />
              </div>

              <div class="form-group checkbox-group" style="justify-content: center;">
                <label>Trạng thái</label>
                <label class="toggle-switch-label" style="margin-top: 0.5rem;">
                  <input type="checkbox" formControlName="isActive" />
                  <span class="toggle-slider"></span>
                  Kích hoạt hợp tác
                </label>
              </div>

              <div class="form-group full-width">
                <label for="store-address">Địa chỉ đại lý <span class="required">*</span></label>
                <input id="store-address" type="text" formControlName="address" placeholder="Địa chỉ chi tiết cửa hàng đại lý" />
              </div>

              <div class="form-group full-width">
                <label for="store-map">Đường dẫn Google Map Embed (hoặc Link Map)</label>
                <input id="store-map" type="text" formControlName="googleMapUrl" placeholder="https://www.google.com/maps/embed?pb=..." />
                @if (sanitizedMapUrl()) {
                  <div class="map-iframe-wrap">
                    <iframe [src]="sanitizedMapUrl()" width="100%" height="200" style="border:0; border-radius:10px;" allowfullscreen="" loading="lazy"></iframe>
                  </div>
                }
              </div>

              <!-- Distributed Products Association with Stock count -->
              <div class="form-group full-width">
                <label>Quản lý tồn kho hàng cấp phát cho đại lý này</label>
                <p class="muted-note" style="margin-bottom: 0.5rem;">Cấp sản phẩm và ghi nhận số lượng tồn kho còn lại thực tế của đại lý.</p>
                <div class="products-selection-list">
                  <input
                    type="text"
                    placeholder="Tìm sản phẩm cấp phát..."
                    [(ngModel)]="prodFilter"
                    [ngModelOptions]="{standalone: true}"
                    class="prod-search-input"
                  />
                  <div class="inventory-stocks-table-wrap">
                    <table class="inventory-table">
                      <thead>
                        <tr>
                          <th>Chọn cấp</th>
                          <th>Tên sản phẩm / SKU</th>
                          <th style="width: 130px;">Tồn kho đại lý</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (prod of filteredProducts(); track prod._id) {
                          <tr>
                            <td>
                              <input
                                type="checkbox"
                                [checked]="isProductSupplied(prod._id)"
                                (change)="toggleProductSupply(prod._id)"
                                class="row-checkbox"
                              />
                            </td>
                            <td>
                              <div class="prod-row-meta">
                                <span class="p-name">{{ prod.name }}</span>
                                <span class="p-sku">{{ prod.sku }}</span>
                              </div>
                            </td>
                            <td>
                              <input
                                type="number"
                                [value]="getProductStock(prod._id)"
                                [disabled]="!isProductSupplied(prod._id)"
                                (input)="updateProductStock(prod._id, $event)"
                                class="stock-input"
                                min="0"
                              />
                            </td>
                          </tr>
                        } @if (!filteredProducts().length) {
                          <tr>
                            <td colspan="3" class="no-prods-msg">Không tìm thấy sản phẩm.</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn-action secondary" (click)="closeModal()" [disabled]="saving()">
                  Hủy
                </button>
                <button type="submit" class="btn-action primary" [disabled]="form.invalid || saving()">
                  {{ saving() ? 'Đang lưu...' : 'Lưu lại' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </app-admin-catalog-page>
  `,
  styles: [
    `
      .tier-badge {
        display: inline-block;
        padding: 0.25rem 0.65rem;
        font-size: 0.75rem;
        font-weight: 700;
        border-radius: 6px;
        text-align: center;
        text-transform: uppercase;
      }

      .tier-badge.platinum {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #cbd5e1;
      }

      .tier-badge.gold {
        background: #fef3c7;
        color: #d97706;
        border: 1px solid #fde68a;
      }

      .tier-badge.silver {
        background: #f3f4f6;
        color: #4b5563;
        border: 1px solid #e5e7eb;
      }

      .tier-badge.standard {
        background: #eff6ff;
        color: #2563eb;
        border: 1px solid #bfdbfe;
      }

      .badge-toggle {
        padding: 0.3rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 700;
        border-radius: 999px;
        border: none;
        cursor: pointer;
        background: #fef2f2;
        color: #ef4444;
        transition: background 0.2s, color 0.2s;
      }

      .badge-toggle.active {
        background: #ecfdf5;
        color: #10b981;
      }

      .text-right {
        text-align: right;
      }

      .tier-select {
        padding: 0.65rem 0.85rem;
        border: 1px solid #ebdcd0;
        border-radius: 10px;
        font-size: 0.9375rem;
        outline: none;
        background: #fff;
      }

      .store-name-cell {
        display: flex;
        flex-direction: column;
      }

      .muted-subtext {
        font-size: 0.75rem;
        color: #9ca3af;
      }

      .address-cell {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .map-link-btn {
        display: inline-block;
        font-size: 0.75rem;
        color: #8c7161;
        text-decoration: underline;
        font-weight: bold;
      }

      .stock-summary-cell {
        display: flex;
        flex-direction: column;
      }

      .stock-summary-cell strong {
        font-size: 0.85rem;
        color: #4b5563;
      }

      .stock-summary-cell span {
        font-size: 0.7rem;
        color: #9ca3af;
      }

      .map-iframe-wrap {
        margin-top: 0.5rem;
        border: 1px solid #eae6e2;
        border-radius: 10px;
        overflow: hidden;
      }

      /* Modal and layout styles */
      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-container {
        background: #fff;
        border-radius: 20px;
        width: 100%;
        max-width: 820px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #eae6e2;
      }

      .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #5c4033;
        font-weight: 700;
      }

      .modal-close-btn {
        background: none;
        border: none;
        font-size: 1.75rem;
        color: #6b7280;
        cursor: pointer;
      }

      .modal-form {
        padding: 1.5rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.25rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .form-group.full-width {
        grid-column: span 2;
      }

      .form-group label {
        font-weight: 700;
        font-size: 0.875rem;
        color: #4b5563;
      }

      .form-group input[type='text'],
      .form-group input[type='number'],
      .form-group select {
        padding: 0.65rem 0.85rem;
        border: 1px solid #ebdcd0;
        border-radius: 10px;
        font-size: 0.9375rem;
        outline: none;
      }

      .form-error-alert {
        grid-column: span 2;
        padding: 0.75rem 1rem;
        background: #fef2f2;
        color: #ef4444;
        border-radius: 10px;
        font-size: 0.875rem;
        border: 1px solid #fee2e2;
      }

      .required {
        color: #ef4444;
      }

      .muted-note {
        font-size: 0.75rem;
        color: #9ca3af;
        margin: 0;
      }

      /* Toggle switch label */
      .toggle-switch-label {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        font-weight: 700;
        user-select: none;
      }

      .toggle-switch-label input {
        display: none;
      }

      .toggle-slider {
        position: relative;
        width: 44px;
        height: 24px;
        background: #d1d5db;
        border-radius: 999px;
        transition: background 0.3s;
      }

      .toggle-slider::before {
        content: '';
        position: absolute;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: white;
        top: 3px;
        left: 3px;
        transition: transform 0.3s;
      }

      .toggle-switch-label input:checked + .toggle-slider {
        background: #10b981;
      }

      .toggle-switch-label input:checked + .toggle-slider::before {
        transform: translateX(20px);
      }

      /* Products check list table */
      .products-selection-list {
        border: 1px solid #ebdcd0;
        border-radius: 12px;
        background: #fff;
        overflow: hidden;
      }

      .prod-search-input {
        width: 100%;
        border: none !important;
        border-bottom: 1px solid #eae6e2 !important;
        border-radius: 0 !important;
        padding: 0.5rem 0.75rem !important;
        font-size: 0.8125rem !important;
      }

      .inventory-stocks-table-wrap {
        max-height: 240px;
        overflow-y: auto;
      }

      .inventory-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
      }

      .inventory-table th {
        background: #faf8f6;
        padding: 0.5rem;
        font-size: 0.75rem;
        font-weight: 700;
        color: #6b7280;
        border-bottom: 1px solid #eae6e2;
      }

      .inventory-table td {
        padding: 0.45rem 0.5rem;
        border-bottom: 1px solid #f9f7f5;
        font-size: 0.8125rem;
      }

      .row-checkbox {
        width: 16px;
        height: 16px;
        accent-color: #8c7161;
        cursor: pointer;
      }

      .prod-row-meta {
        display: flex;
        flex-direction: column;
      }

      .prod-row-meta .p-name {
        font-weight: 600;
        color: #374151;
      }

      .prod-row-meta .p-sku {
        font-size: 0.6875rem;
        color: #9ca3af;
      }

      .stock-input {
        width: 80px;
        padding: 0.25rem 0.5rem;
        border: 1px solid #ebdcd0;
        border-radius: 6px;
        font-size: 0.8125rem;
        text-align: center;
      }

      .stock-input:disabled {
        background: #f3f4f6;
        color: #9ca3af;
      }

      .no-prods-msg {
        font-size: 0.75rem;
        color: #9ca3af;
        text-align: center;
        padding: 1.5rem;
      }

      .modal-actions {
        grid-column: span 2;
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 0.5rem;
        padding-top: 1rem;
        border-top: 1px solid #eae6e2;
      }
    `
  ]
})
export class StoresComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private sanitizer = inject(DomSanitizer);

  crumbs = [{ label: 'Danh sách Đại lý', active: true }];

  search = signal('');
  currentPage = signal(1);
  pageSize = signal(10);
  loading = signal(false);
  saving = signal(false);

  rows = signal<PartnerStoreRow[]>([]);
  products = signal<ProductItemSummary[]>([]);
  prodFilter = '';

  modalOpen = signal(false);
  editingId = signal<string | null>(null);
  formError = signal('');

  // Local inventory map: productId -> stock (if not supplied, not present or stock is 0)
  storeInventory = signal<Record<string, number>>({});

  form = this.fb.group({
    name: ['', Validators.required],
    address: ['', Validators.required],
    googleMapUrl: [''],
    phone: ['', Validators.required],
    email: [''],
    manager: ['', Validators.required],
    tier: ['Standard', Validators.required],
    supplyVolume: [0],
    isActive: [true]
  });

  // Sanitized Map URL signal for iframe display
  sanitizedMapUrl = computed(() => {
    const rawUrl = this.form.get('googleMapUrl')?.value;
    if (!rawUrl || !rawUrl.startsWith('http')) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
  });

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.rows();
    if (!q) return list;
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        r.manager.toLowerCase().includes(q) ||
        r.phone.includes(q)
    );
  });

  maxPages = computed(() => {
    return Math.max(1, Math.ceil(this.filtered().length / this.pageSize()));
  });

  paged = computed(() => {
    const list = this.filtered();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.loadRows();
    this.loadProducts();
  }

  rowIndex(localIndex: number): number {
    return (this.currentPage() - 1) * this.pageSize() + localIndex + 1;
  }

  onSearchChange(val: string): void {
    this.search.set(val);
    this.currentPage.set(1);
  }

  getStoreTotalStock(item: PartnerStoreRow): number {
    if (!item.inventory) return 0;
    return item.inventory.reduce((acc, curr) => acc + (curr.stock || 0), 0);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.formError.set('');
    this.storeInventory.set({});
    this.form.reset({
      name: '',
      address: '',
      googleMapUrl: '',
      phone: '',
      email: '',
      manager: '',
      tier: 'Standard',
      supplyVolume: 0,
      isActive: true
    });
    this.modalOpen.set(true);
  }

  openEdit(item: PartnerStoreRow): void {
    this.editingId.set(item._id);
    this.formError.set('');

    const map: Record<string, number> = {};
    if (item.inventory) {
      item.inventory.forEach((inv) => {
        if (inv.product) {
          const pid = typeof inv.product === 'object' ? inv.product._id : inv.product;
          map[pid] = inv.stock || 0;
        }
      });
    }
    this.storeInventory.set(map);

    this.form.reset({
      name: item.name,
      address: item.address,
      googleMapUrl: item.googleMapUrl || '',
      phone: item.phone,
      email: item.email || '',
      manager: item.manager,
      tier: item.tier,
      supplyVolume: item.supplyVolume,
      isActive: item.isActive
    });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  toggleStatus(item: PartnerStoreRow): void {
    const target = !item.isActive;
    this.api.update<PartnerStoreRow>('partner-stores', item._id, { isActive: target }).subscribe({
      next: () => this.loadRows()
    });
  }

  remove(item: PartnerStoreRow): void {
    if (!confirm(`Xóa thông tin Đại lý "${item.name}"?`)) return;
    this.api.delete('partner-stores', item._id).subscribe({
      next: () => this.loadRows()
    });
  }

  filteredProducts(): ProductItemSummary[] {
    const q = this.prodFilter.trim().toLowerCase();
    if (!q) return this.products();
    return this.products().filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }

  isProductSupplied(productId: string): boolean {
    return this.storeInventory().hasOwnProperty(productId);
  }

  getProductStock(productId: string): number {
    return this.storeInventory()[productId] || 0;
  }

  toggleProductSupply(productId: string): void {
    const current = { ...this.storeInventory() };
    if (current.hasOwnProperty(productId)) {
      delete current[productId];
    } else {
      current[productId] = 10; // Default stock value on check
    }
    this.storeInventory.set(current);
  }

  updateProductStock(productId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const stockVal = Math.max(0, parseInt(input.value, 10) || 0);
    const current = { ...this.storeInventory() };
    current[productId] = stockVal;
    this.storeInventory.set(current);
  }

  save(): void {
    if (this.form.invalid) return;

    // Convert inventory map back to backend inventory schema
    const inventoryArray = Object.keys(this.storeInventory()).map((pid) => ({
      product: pid,
      stock: this.storeInventory()[pid]
    }));

    const payload = {
      name: String(this.form.value.name || '').trim(),
      address: String(this.form.value.address || '').trim(),
      googleMapUrl: String(this.form.value.googleMapUrl || '').trim(),
      phone: String(this.form.value.phone || '').trim(),
      email: String(this.form.value.email || '').trim(),
      manager: String(this.form.value.manager || '').trim(),
      tier: this.form.value.tier,
      supplyVolume: Number(this.form.value.supplyVolume || 0),
      inventory: inventoryArray,
      isActive: !!this.form.value.isActive
    };

    this.saving.set(true);
    this.formError.set('');

    const id = this.editingId();
    const req = id
      ? this.api.update<PartnerStoreRow>('partner-stores', id, payload)
      : this.api.create<PartnerStoreRow>('partner-stores', payload);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadRows();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.error?.message || 'Có lỗi xảy ra khi lưu thông tin đại lý.');
      }
    });
  }

  private loadRows(): void {
    this.loading.set(true);
    this.api.list<PartnerStoreRow>('partner-stores').subscribe({
      next: (res) => {
        this.rows.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private loadProducts(): void {
    this.api.list<any>('products').subscribe({
      next: (res) => {
        this.products.set(
          res.map((p: any) => ({
            _id: p._id || p.id,
            name: p.name,
            sku: p.sku
          }))
        );
      }
    });
  }
}
