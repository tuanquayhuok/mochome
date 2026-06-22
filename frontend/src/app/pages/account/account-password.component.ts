import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AdminPageShellComponent } from '../../shared/admin-page-shell.component';

@Component({
  selector: 'app-account-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminPageShellComponent],
  template: `
    <app-admin-page-shell>
      <div class="form-panel">
        <p class="muted form-intro">
          Cập nhật mật khẩu cho tài khoản quản trị đang đăng nhập.
        </p>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <label for="currentPassword">Mật khẩu hiện tại</label>
          <input
            id="currentPassword"
            type="password"
            formControlName="currentPassword"
            autocomplete="current-password"
          />

          <label for="newPassword">Mật khẩu mới</label>
          <input
            id="newPassword"
            type="password"
            formControlName="newPassword"
            autocomplete="new-password"
          />

          @if (message) {
            <p class="form-hint" [class.ok]="success" [class.err]="!success">{{ message }}</p>
          }

          <button type="submit" class="btn-action primary">Đổi mật khẩu</button>
        </form>
      </div>
    </app-admin-page-shell>
  `,
  styles: [
    `
      .form-intro {
        margin: 0 0 1rem;
        font-size: 0.8125rem;
      }
    `
  ]
})
export class AccountPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);

  success = false;
  message = '';

  form = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.success = false;
      this.message = 'Vui lòng nhập đầy đủ thông tin';
      return;
    }

    const { currentPassword, newPassword } = this.form.getRawValue();
    this.api.changePassword(currentPassword!, newPassword!).subscribe({
      next: () => {
        this.success = true;
        this.message = 'Cập nhật mật khẩu thành công';
        this.form.reset();
      },
      error: (err) => {
        this.success = false;
        this.message = err?.error?.message || 'Có lỗi xảy ra';
      }
    });
  }
}
