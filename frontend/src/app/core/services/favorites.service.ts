import { Injectable, signal } from '@angular/core';

export interface FavoriteItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  imageUrl?: string;
}

const STORAGE_KEY = 'moc_favorites';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly items = signal<FavoriteItem[]>(this.read());

  readonly favorites = this.items.asReadonly();

  count = () => this.items().length;

  isFavorite(productId: string): boolean {
    return this.items().some((i) => i.productId === productId);
  }

  toggle(item: FavoriteItem): boolean {
    if (this.isFavorite(item.productId)) {
      this.remove(item.productId);
      return false;
    }
    this.save([...this.items(), item]);
    return true;
  }

  remove(productId: string): void {
    this.save(this.items().filter((i) => i.productId !== productId));
  }

  private read(): FavoriteItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private save(list: FavoriteItem[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    this.items.set(list);
  }
}
