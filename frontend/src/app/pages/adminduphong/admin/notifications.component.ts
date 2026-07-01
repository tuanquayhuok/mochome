import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../../core/services/settings.service';
import { ToastService } from '../../core/services/toast.service';
import { AdminCatalogPageComponent } from '../../shared/admin-catalog-page.component';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AdminCatalogPageComponent],
  template: `
    <app-admin-catalog-page
      title="Quản lý thông báo"
      subtitle="Tạo thông báo đẩy tới toàn bộ khách hàng ngoài trang chủ"
      [breadcrumbs]="[
        { label: 'Trang chủ', route: '/admin/dashboard' },
        { label: 'Quản lý thông báo' }
      ]"
    >
      <div class="notifications-layout-grid">
        <!-- Form section -->
        <section class="panel form-panel">
          <header class="panel-head">
            <h2>Gửi thông báo mới</h2>
            <p>Thông báo được gửi đi sẽ lập tức hiển thị trên biểu tượng chuông thông báo của tất cả người dùng.</p>
          </header>

          <div class="template-selector-container">
            <span class="template-label">Chọn mẫu thông báo nhanh:</span>
            <div class="template-chips">
              @for (tpl of templates; track tpl.label) {
                <button type="button" class="template-chip" (click)="applyTemplate(tpl)">
                  {{ tpl.label }}
                </button>
              }
            </div>
          </div>

          <form [formGroup]="form" (ngSubmit)="send()" class="notification-form" novalidate>
            <label class="field">
              <span>Tiêu đề thông báo</span>
              <input type="text" formControlName="title" placeholder="Nhập tiêu đề thông báo ngắn gọn" />
              @if (form.controls.title.touched && form.controls.title.invalid) {
                <small class="field-error">Tiêu đề là bắt buộc (tối thiểu 3 ký tự)</small>
              }
            </label>

            <label class="field">
              <span>Nội dung chi tiết</span>
              <textarea formControlName="content" rows="4" placeholder="Nhập nội dung thông báo đầy đủ gửi khách hàng..."></textarea>
              @if (form.controls.content.touched && form.controls.content.invalid) {
                <small class="field-error">Nội dung thông báo là bắt buộc (tối thiểu 10 ký tự)</small>
              }
            </label>

            <div class="form-actions">
              <button type="submit" class="btn-action primary" [disabled]="form.invalid">
                Phát hành thông báo
              </button>
            </div>
          </form>
        </section>

        <!-- List section -->
        <section class="panel list-panel">
          <header class="panel-head">
            <h2>Lịch sử thông báo đã gửi</h2>
            <p>Danh sách các thông báo đang hoạt động trong hệ thống.</p>
          </header>

          <div class="sent-notifications-list">
            @for (n of notifications(); track n.id) {
              <div class="sent-item" [class.sent-unread]="!n.read">
                <div class="sent-item-body">
                  <h3 class="sent-title">{{ n.title }}</h3>
                  <p class="sent-content">{{ n.content }}</p>
                  <span class="sent-time">{{ n.time }}</span>
                </div>
                <button type="button" class="btn-delete" (click)="deleteNotif(n.id)" title="Xóa thông báo này">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>
            } @empty {
              <div class="empty-sent">Chưa có thông báo nào được gửi.</div>
            }
          </div>
        </section>
      </div>
    </app-admin-catalog-page>
  `,
  styles: [
    `
      .notifications-layout-grid {
        display: grid;
        grid-template-columns: 1fr 1.2fr;
        gap: 1.5rem;
        align-items: start;
      }

      .panel {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 1.5rem;
      }

      .panel-head {
        margin-bottom: 2rem;
        border-bottom: 1px solid var(--border-light);
        padding-bottom: 1.25rem;
      }

      .panel-head h2 {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text);
        margin: 0 0 0.35rem;
      }

      .panel-head p {
        font-size: 0.875rem;
        color: var(--muted);
        margin: 0;
      }

      .notification-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .field span {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .field input,
      .field textarea {
        padding: 0.75rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 0.875rem;
        background: #ffffff;
        color: var(--text);
        font-family: inherit;
        transition: all 0.2s ease;
      }

      .field input:focus,
      .field textarea:focus {
        outline: none;
        border-color: var(--text);
        box-shadow: 0 0 0 3px rgba(26, 29, 33, 0.08);
      }

      .field-error {
        color: #ef4444;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .form-actions {
        margin-top: 0.5rem;
        display: flex;
        justify-content: flex-start;
      }

      .sent-notifications-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-height: 500px;
        overflow-y: auto;
      }

      .sent-item {
        position: relative;
        padding: 1rem 3rem 1rem 1rem;
        border: 1px solid var(--border);
        border-radius: 6px;
        background: var(--surface-hover);
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        transition: all 0.15s ease;
      }

      .sent-item.sent-unread {
        border-left: 3px solid var(--text);
        background: var(--surface);
      }

      .sent-item-body {
        flex: 1;
      }

      .sent-title {
        font-size: 0.875rem;
        font-weight: 700;
        color: var(--text);
        margin: 0 0 0.25rem;
      }

      .sent-content {
        font-size: 0.8125rem;
        color: var(--text-muted);
        line-height: 1.4;
        margin: 0 0 0.5rem;
      }

      .sent-time {
        font-size: 0.75rem;
        color: var(--text-muted);
      }

      .btn-delete {
        position: absolute;
        top: 0.85rem;
        right: 0.85rem;
        background: transparent;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        display: grid;
        place-items: center;
        transition: all 0.15s ease;
      }

      .btn-delete svg {
        width: 18px;
        height: 18px;
      }

      .btn-delete:hover {
        color: #ef4444;
        background: #fee2e2;
      }

      .empty-sent {
        padding: 3rem 1rem;
        text-align: center;
        color: var(--text-muted);
        font-size: 0.875rem;
        border: 1px dashed var(--border);
        border-radius: 6px;
      }

      /* Notification Quick Templates Selector */
      .template-selector-container {
        margin-bottom: 1.5rem;
        background: var(--border-light);
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid var(--border);
      }

      .template-label {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--text-secondary);
        display: block;
        margin-bottom: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .template-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .template-chip {
        background: var(--surface);
        border: 1px solid var(--border);
        padding: 0.4rem 0.8rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .template-chip:hover {
        background: var(--text);
        color: #ffffff;
        border-color: var(--text);
      }

      @media (max-width: 900px) {
        .notifications-layout-grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class AdminNotificationsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);
  private readonly toast = inject(ToastService);

  readonly notifications = this.settingsService.notifications;

  readonly templates = [
    {
      label: 'Trend TikTok & Voucher',
      title: '🔥 BIẾN HÌNH CỰC CHẤT - NHẬN VOUCHER 100K!',
      content: 'Trào lưu thiết kế nhà Mộc Home đang viral cực mạnh trên TikTok! Tham gia thử thách biến hình và nhập ngay mã TIKTOKMOC để nhận ngay voucher giảm 100K cho đơn hàng đầu tiên.'
    },
    {
      label: 'Hàng nằm / Mahjong Ways',
      title: '🀄 MAHJONG WAYS 2: HÀNG NẰM LỆCH SO LE CỰC ĐỈNH!',
      content: 'Chơi game Mạt Chược phiên bản 2 chuẩn chỉ cơ chế xếp hàng nằm lệch so le siêu cuốn. Nổ hũ liền tay nhận ngay mã voucher MOCHOME50K giảm trực tiếp 50K!'
    },
    {
      label: 'Voucher Hôm Nay',
      title: '🎁 VOUCHER ĐẶC BIỆT DÀNH RIÊNG CHO BẠN',
      content: 'Mộc Home tri ân khách hàng: Nhập mã VOUCHER50 giảm ngay 50.000đ cho đơn hàng nội thất từ 1.000.000đ. Số lượng mã có hạn, áp dụng ngay hôm nay!'
    },
    {
      label: 'Xu hướng thiết kế 2026',
      title: '🌳 XU HƯỚNG GỖ SỒI TỰ NHIÊN ĐÓN ĐẦU VIRAL',
      content: 'Đón đầu xu hướng nội thất gỗ sồi tối giản đang càn quét top tìm kiếm TikTok. Giảm ngay 15% cho 50 khách hàng đầu tiên nhập mã GOVIRAL26 khi đặt hàng!'
    }
  ];

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    content: ['', [Validators.required, Validators.minLength(10)]]
  });

  applyTemplate(tpl: { title: string; content: string }): void {
    this.form.patchValue({
      title: tpl.title,
      content: tpl.content
    });
    this.form.markAsDirty();
    this.form.markAsTouched();
    this.toast.show('Đã áp dụng mẫu thông báo!', 'success');
  }

  send(): void {
    if (this.form.invalid) return;
    const { title, content } = this.form.value;
    this.settingsService.addNotification(title!, content!);
    this.toast.show('Đã phát hành thông báo đẩy thành công!', 'success');
    this.form.reset();
  }

  deleteNotif(id: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
      this.settingsService.clearNotification(id);
      this.toast.show('Đã xóa thông báo thành công.', 'success');
    }
  }
}
