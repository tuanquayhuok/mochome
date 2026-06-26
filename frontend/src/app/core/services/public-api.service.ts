import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../config/api-url';
import { CategoryRow, PostRow, ProductRow, BannerRow } from '../models/admin-list.models';
import { ProductDetailResponse } from '../models/product-detail.models';

export interface PostCommentRow {
  _id: string;
  post: string;
  user: {
    _id: string;
    fullName: string;
    email: string;
  };
  content: string;
  parentId: string | null;
  likes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicCatalog {
  featured: ProductRow[];
  products: ProductRow[];
  categories: CategoryRow[];
  posts: Pick<PostRow, 'title' | 'slug' | 'excerpt'>[];
}

@Injectable({ providedIn: 'root' })
export class PublicApiService {
  private readonly http = inject(HttpClient);

  getCatalog() {
    return this.http.get<PublicCatalog>(`${API_URL}/public/catalog`);
  }

  getProductBySlug(slug: string) {
    return this.http.get<ProductDetailResponse>(`${API_URL}/public/products/${slug}`);
  }

  getBanners() {
    return this.http.get<BannerRow[]>(`${API_URL}/public/banners`);
  }

  postContact(payload: { fullName: string; email: string; subject?: string; message: string }) {
    return this.http.post(`${API_URL}/contacts`, payload);
  }

  getPostBySlug(slug: string) {
    return this.http.get<PostRow>(`${API_URL}/public/posts/${slug}`);
  }

  likePost(postId: string) {
    return this.http.post<{ likeCount: number; isLiked: boolean }>(`${API_URL}/public/posts/${postId}/like`, {});
  }

  getComments(postId: string) {
    return this.http.get<PostCommentRow[]>(`${API_URL}/public/posts/${postId}/comments`);
  }

  addComment(postId: string, content: string, parentId?: string | null) {
    return this.http.post<PostCommentRow>(`${API_URL}/public/posts/${postId}/comments`, { content, parentId });
  }

  likeComment(commentId: string) {
    return this.http.post<PostCommentRow>(`${API_URL}/public/comments/${commentId}/like`, {});
  }
}
