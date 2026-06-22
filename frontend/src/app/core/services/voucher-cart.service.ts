import { Injectable, signal } from '@angular/core';

export interface AppliedVoucher {
  code: string;
  name: string;
  discountAmount: number;
}

@Injectable({ providedIn: 'root' })
export class VoucherCartService {
  private readonly storageKey = 'cart_voucher';

  readonly applied = signal<AppliedVoucher | null>(this.read());

  setApplied(v: AppliedVoucher | null): void {
    this.applied.set(v);
    if (v) {
      localStorage.setItem(this.storageKey, JSON.stringify(v));
    } else {
      localStorage.removeItem(this.storageKey);
    }
  }

  clear(): void {
    this.setApplied(null);
  }

  private read(): AppliedVoucher | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as AppliedVoucher) : null;
    } catch {
      return null;
    }
  }
}
