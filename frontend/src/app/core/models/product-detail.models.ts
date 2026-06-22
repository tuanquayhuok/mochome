export interface ProductColorOption {
  name: string;
  hex: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductCategoryRef {
  _id: string;
  name: string;
  slug: string;
}

export interface PublicProductDetail {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  stock: number;
  imageUrl?: string;
  images: string[];
  description: string;
  longDescription: string;
  colors: ProductColorOption[];
  sizes: string[];
  material: string;
  origin: string;
  detailSpecs: ProductSpec[];
  careGuide: string;
  returnPolicy: string;
  category: ProductCategoryRef | null;
  inStock: boolean;
}

export interface PublicProductCard {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  stock: number;
  imageUrl?: string;
  images: string[];
  category?: ProductCategoryRef | null;
  inStock: boolean;
}

export interface ProductDetailResponse {
  product: PublicProductDetail;
  related: PublicProductCard[];
}
