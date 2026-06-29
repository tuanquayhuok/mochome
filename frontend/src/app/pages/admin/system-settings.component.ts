import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SettingsService, SystemContact } from '../../core/services/settings.service';
import { ToastService } from '../../core/services/toast.service';
import { AdminCatalogPageComponent } from '../../shared/admin-catalog-page.component';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AdminCatalogPageComponent],
  template: `
    <app-admin-catalog-page
      title="Cấu hình hệ thống"
      subtitle="Chỉnh sửa thông tin liên hệ và cài đặt hiển thị trên toàn cửa hàng"
      [breadcrumbs]="[
        { label: 'Trang chủ', route: '/admin/dashboard' },
        { label: 'Cấu hình hệ thống' }
      ]"
    >
      <div class="settings-grid">
        <section class="panel">
          <header class="panel-head">
            <div>
              <h2>Thông tin liên hệ cửa hàng</h2>
              <p>Các thông tin dưới đây sẽ hiển thị trực tiếp lên trang Liên hệ ngoài cửa hàng.</p>
            </div>
          </header>

          <form [formGroup]="form" (ngSubmit)="save()" class="settings-form" novalidate>
            <div class="form-group">
              <label class="field">
                <span>Địa chỉ cửa hàng</span>
                <textarea formControlName="address" rows="3" placeholder="Nhập địa chỉ cửa hàng"></textarea>
                @if (form.controls.address.touched && form.controls.address.invalid) {
                  <small class="field-error">Địa chỉ là bắt buộc</small>
                }
              </label>
            </div>

            <div class="form-row">
              <label class="field">
                <span>Số điện thoại hotline</span>
                <input type="text" formControlName="phone" placeholder="Nhập SĐT cửa hàng" />
                @if (form.controls.phone.touched && form.controls.phone.invalid) {
                  <small class="field-error">Số điện thoại là bắt buộc</small>
                }
              </label>

              <label class="field">
                <span>Email hỗ trợ</span>
                <input type="email" formControlName="email" placeholder="support@mochome.vn" />
                @if (form.controls.email.touched && form.controls.email.invalid) {
                  <small class="field-error">Email không hợp lệ</small>
                }
              </label>
            </div>

            <div class="form-row">
              <label class="field">
                <span>Giờ làm việc (Ngày thường)</span>
                <input type="text" formControlName="workingHoursWeekdays" placeholder="Thứ 2 - Thứ 7: 8:00 - 17:30" />
              </label>

              <label class="field">
                <span>Giờ làm việc (Chủ nhật)</span>
                <input type="text" formControlName="workingHoursSunday" placeholder="Chủ nhật: 8:30 - 12:00" />
              </label>
            </div>

            <div class="form-group">
              <label class="field">
                <span>Link nhúng bản đồ Google Maps (iframe src)</span>
                <input type="text" formControlName="mapUrl" placeholder="https://www.google.com/maps/embed?pb=..." />
              </label>
            </div>

            <div class="form-group">
              <label class="field">
                <span>Link chỉ đường Google Maps (Bấm nút chỉ đường)</span>
                <input type="text" formControlName="mapLink" placeholder="https://www.google.com/maps/search/?api=1..." />
              </label>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-action primary" [disabled]="form.invalid">
                Lưu cấu hình
              </button>
            </div>
          </form>
        </section>
      </div>
    </app-admin-catalog-page>
  `,
  styles: [
    `
      .settings-grid {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        max-width: 800px;
      }

      .panel {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
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

      .settings-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
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
        margin-top: 1.5rem;
        display: flex;
        justify-content: flex-start;
        border-top: 1px solid var(--border-light);
        padding-top: 1.5rem;
      }
    `
  ]
})
export class SystemSettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);
  private readonly toast = inject(ToastService);

  readonly form = this.fb.group({
    address: [this.settingsService.contactSettings().address, [Validators.required]],
    phone: [this.settingsService.contactSettings().phone, [Validators.required]],
    email: [this.settingsService.contactSettings().email, [Validators.required, Validators.email]],
    workingHoursWeekdays: [this.settingsService.contactSettings().workingHoursWeekdays],
    workingHoursSunday: [this.settingsService.contactSettings().workingHoursSunday],
    mapUrl: [this.settingsService.contactSettings().mapUrl],
    mapLink: [this.settingsService.contactSettings().mapLink]
  });

  save(): void {
    if (this.form.invalid) return;
    this.settingsService.saveContact(this.form.value as SystemContact);
    this.toast.show('Đã cập nhật cấu hình hệ thống thành công!', 'success');
  }
}
