import { Injectable, signal } from '@angular/core';

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  color?: string;
  size?: string;
}

const STORAGE_KEY = 'moc_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly items = signal<CartLine[]>(this.read());

  readonly cartItems = this.items.asReadonly();

  count = () => this.items().reduce((sum, i) => sum + i.quantity, 0);

  total = () => this.items().reduce((sum, i) => sum + i.price * i.quantity, 0);

  add(item: Omit<CartLine, 'quantity'> & { quantity?: number }): void {
    const qty = item.quantity ?? 1;
    const list = [...this.items()];
    const cleanItem = { ...item };

    const idx = list.findIndex(
      (l) =>
        l.productId === item.productId &&
        l.color === item.color &&
        l.size === item.size
    );
    if (idx >= 0) {
      list[idx] = { ...list[idx], quantity: list[idx].quantity + qty };
    } else {
      list.push({ ...cleanItem, quantity: qty });
    }
    this.save(list);
  }

  updateQuantity(productId: string, quantity: number, color?: string, size?: string): void {
    const list = this.items()
      .map((l) => {
        if (l.productId !== productId) return l;
        if (color !== undefined && l.color !== color) return l;
        if (size !== undefined && l.size !== size) return l;
        return { ...l, quantity: Math.max(1, quantity) };
      })
      .filter((l) => l.quantity > 0);
    this.save(list);
  }

  remove(productId: string, color?: string, size?: string): void {
    const list = this.items().filter((l) => {
      if (l.productId !== productId) return true;
      if (color !== undefined && l.color !== color) return true;
      if (size !== undefined && l.size !== size) return true;
      return false;
    });
    this.save(list);
  }

  clear(): void {
    this.save([]);
  }

  private read(): CartLine[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as CartLine[];
    } catch {
      return [];
    }
  }

  private save(list: CartLine[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
    this.items.set(list);
  }
}
