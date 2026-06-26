export interface CategoryRef {
  _id?: string;
  name?: string;
  slug?: string;
}

export interface UserRef {
  fullName?: string;
  email?: string;
}

export interface ProductRef {
  name?: string;
}

export type ProductSaleStatus = 'selling' | 'out_of_stock' | 'stopped';

export interface ProductRow {
  _id: string;
  name: string;
  slug?: string;
  sku: string;
  price: number;
  stock: number;
  imageUrl?: string;
  featured?: boolean;
  inStock?: boolean;
  collection?: string;
  saleStatus?: ProductSaleStatus;
  isVisible?: boolean;
  category?: CategoryRef;
  createdAt?: string;
}

export interface CatalogCollectionRow {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface AttributeRow {
  _id: string;
  name: string;
  slug: string;
  type: 'text' | 'color' | 'size' | string;
  values: string[];
  isActive: boolean;
  createdAt?: string;
}

export interface ProductVariantRow {
  _id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  isActive: boolean;
  attributes?: { color?: string; size?: string };
  product?: ProductRef;
  createdAt?: string;
}

export interface CategoryRow {
  _id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  productCount?: number;
  description?: string;
  createdAt?: string;
}

export interface UserRow {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user' | string;
  isActive: boolean;
  isVip?: boolean;
  createdAt?: string;
  orderCount?: number;
}

export interface PostRow {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  thumbnail?: string;
  published: boolean;
  isVisible?: boolean;
  viewCount?: number;
  likeCount?: number;
  likes?: string[];
  shareCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface VoucherRow {
  _id: string;
  code: string;
  name: string;
  description?: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  firstOrderOnly: boolean;
  usageLimit: number;
  usedCount: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  showInStorePicker?: boolean;
  createdAt?: string;
}

export interface StorePickerVoucher {
  code: string;
  name: string;
  description?: string;
  discountLabel: string;
  firstOrderOnly: boolean;
}

export interface ContactRow {
  _id: string;
  fullName: string;
  email: string;
  subject: string;
  message: string;
  status: string;
}

export interface ReviewRow {
  _id: string;
  user?: UserRef;
  product?: ProductRef;
  rating: number;
  comment?: string;
  approved: boolean;
}

export interface BannerRow {
  _id: string;
  title?: string;
  subtitle?: string;
  imageUrl: string;
  link?: string;
  order?: number;
  active?: boolean;
  position?: string;
  createdAt?: string;
}
