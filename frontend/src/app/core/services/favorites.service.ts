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
    let imageUrl = item.imageUrl;
    if (imageUrl && imageUrl.startsWith('data:')) {
      imageUrl = '';
    }
    this.save([...this.items(), { ...item, imageUrl }]);
    return true;
  }

  remove(productId: string): void {
    this.save(this.items().filter((i) => i.productId !== productId));
  }

  private read(): FavoriteItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw) as FavoriteItem[];
      let hasBase64 = false;
      const cleaned = list.map(item => {
        if (item.imageUrl && item.imageUrl.startsWith('data:')) {
          hasBase64 = true;
          return { ...item, imageUrl: '' };
        }
        return item;
      });
      if (hasBase64) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        } catch {}
      }
      return cleaned;
    } catch {
      return [];
    }
  }

  private save(list: FavoriteItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save favorites to localStorage', e);
    }
    this.items.set(list);
  }
}
