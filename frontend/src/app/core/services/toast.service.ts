import { Injectable, signal } from '@angular/core';

export interface ToastData {
  message: string;
  type: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toast = signal<ToastData | null>(null);
  private timeout: any;

  show(message: string, type: 'success' | 'error' = 'success'): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.toast.set({ message, type });
    this.timeout = setTimeout(() => {
      this.toast.set(null);
    }, 3000);
  }
}
