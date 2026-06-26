import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  OnInit,
  output,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { StorePickerVoucher } from '../../core/models/admin-list.models';

@Component({
  selector: 'app-store-voucher-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="voucher-combo">
      <div class="voucher-input-wrap">
        <input
          type="text"
          class="voucher-input"
          [placeholder]="placeholder()"
          [ngModel]="code()"
          (ngModelChange)="onCodeInput($event)"
          [disabled]="disabled() || applying()"
          (keydown.enter)="apply.emit()"
        />
        <button
          type="button"
          class="picker-toggle"
          [class.open]="pickerOpen()"
          [disabled]="disabled() || applying()"
          (click)="togglePicker($event)"
          [attr.aria-expanded]="pickerOpen()"
          aria-label="Chọn mã giảm giá có sẵn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      @if (pickerOpen()) {
        <div class="picker-dropdown" role="listbox">
          @if (pickerLoading()) {
            <p class="picker-empty">Đang tải mã...</p>
          } @else if (!pickerList().length) {
            <p class="picker-empty">Bạn không có mã giảm giá nào.</p>
          } @else {
            @for (v of pickerList(); track v.code) {
              <button type="button" class="picker-item" role="option" (click)="selectVoucher(v)">
                <span class="picker-code">{{ v.code }}</span>
                <span class="picker-name">{{ v.name }}</span>
                <span class="picker-hint">{{ v.discountLabel }}</span>
                @if (v.firstOrderOnly) {
                  <span class="picker-tag">Lần đầu mua</span>
                }
              </button>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .voucher-combo {
        position: relative;
        flex: 1;
        min-width: 0;
      }

      .voucher-input-wrap {
        display: flex;
        align-items: stretch;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        overflow: hidden;
        background: #fff;
      }

      .voucher-input-wrap:focus-within {
        border-color: #9ca3af;
        box-shadow: 0 0 0 3px rgba(92, 64, 51, 0.08);
      }

      .voucher-input {
        flex: 1;
        min-width: 0;
        border: none;
        padding: 0.45rem 0.6rem;
        font-size: 0.8125rem;
        text-transform: uppercase;
        outline: none;
        background: transparent;
      }

      .picker-toggle {
        display: grid;
        place-items: center;
        width: 36px;
        flex-shrink: 0;
        border: none;
        border-left: 1px solid #e5e7eb;
        background: #fafafa;
        color: #6b7280;
        cursor: pointer;
        transition: background 0.15s;
      }

      .picker-toggle:hover:not(:disabled) {
        background: #f3f4f6;
        color: #374151;
      }

      .picker-toggle.open svg {
        transform: rotate(180deg);
      }

      .picker-toggle svg {
        width: 16px;
        height: 16px;
        transition: transform 0.2s;
      }

      .picker-dropdown {
        position: absolute;
        z-index: 20;
        left: 0;
        right: 0;
        top: calc(100% + 4px);
        max-height: 220px;
        overflow-y: auto;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      }

      .picker-empty {
        margin: 0;
        padding: 0.75rem;
        font-size: 0.75rem;
        color: #9ca3af;
      }

      .picker-item {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.1rem;
        width: 100%;
        padding: 0.6rem 0.75rem;
        border: none;
        border-bottom: 1px solid #f3f4f6;
        background: #fff;
        text-align: left;
        cursor: pointer;
      }

      .picker-item:last-child {
        border-bottom: none;
      }

      .picker-item:hover {
        background: #faf8f6;
      }

      .picker-code {
        font-size: 0.8125rem;
        font-weight: 700;
        letter-spacing: 0.03em;
        color: #5c4033;
      }

      .picker-name {
        font-size: 0.75rem;
        font-weight: 500;
        color: #374151;
      }

      .picker-hint {
        font-size: 0.7rem;
        color: #9ca3af;
      }

      .picker-tag {
        margin-top: 0.15rem;
        font-size: 0.65rem;
        padding: 0.1rem 0.35rem;
        border-radius: 3px;
        background: #ecfdf5;
        color: #047857;
        font-weight: 600;
      }
    `
  ]
})
export class StoreVoucherInputComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly el = inject(ElementRef);

  readonly code = input('');
  readonly applying = input(false);
  readonly disabled = input(false);
  readonly placeholder = input('Nhập mã');

  readonly codeChange = output<string>();
  readonly apply = output<void>();

  readonly pickerOpen = signal(false);
  readonly pickerLoading = signal(false);
  readonly pickerList = signal<StorePickerVoucher[]>([]);

  ngOnInit(): void {
    this.loadPicker();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.pickerOpen()) return;
    if (!this.el.nativeElement.contains(event.target)) {
      this.pickerOpen.set(false);
    }
  }

  onCodeInput(value: string): void {
    this.codeChange.emit(String(value || '').toUpperCase().replace(/\s+/g, ''));
  }

  togglePicker(event: Event): void {
    event.stopPropagation();
    this.pickerOpen.update((v) => !v);
    if (this.pickerOpen() && !this.pickerList().length && !this.pickerLoading()) {
      this.loadPicker();
    }
  }

  selectVoucher(v: StorePickerVoucher): void {
    this.codeChange.emit(v.code);
    this.pickerOpen.set(false);
    this.apply.emit();
  }

  loadPicker(): void {
    this.pickerLoading.set(true);
    this.api.getStorePickerVouchers().subscribe({
      next: (list) => {
        this.pickerList.set(list);
        this.pickerLoading.set(false);
      },
      error: () => {
        this.pickerList.set([]);
        this.pickerLoading.set(false);
      }
    });
  }
}
