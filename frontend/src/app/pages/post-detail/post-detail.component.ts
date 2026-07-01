import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PublicApiService, PostCommentRow } from '../../core/services/public-api.service';
import { StoreAuthService } from '../../core/services/store-auth.service';
import { PostRow } from '../../core/models/admin-list.models';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="store-section store-section--white">
      <div class="store-container post-wrap">
        <nav class="store-breadcrumb" aria-label="Đường dẫn">
          <a routerLink="/">Trang chủ</a>
          <span aria-hidden="true">›</span>
          <a routerLink="/tin-tuc">Bài viết</a>
          <span aria-hidden="true">›</span>
          <span>{{ post()?.title || 'Đang tải...' }}</span>
        </nav>

        @if (loading()) {
          <div class="loading-state">
            <p>Đang tải bài viết...</p>
          </div>
        } @else if (!post()) {
          <div class="error-state">
            <p>Không tìm thấy bài viết hoặc bài viết đã bị ẩn.</p>
            <a routerLink="/tin-tuc" class="back-link">← Quay lại danh sách bài viết</a>
          </div>
        } @else {
          <article class="post">
            <header class="post-header">
              <h1>{{ post()?.title }}</h1>
              <div class="post-meta">
                <span class="meta-item">Đăng bởi Mộc Home</span>
                <span class="meta-divider">•</span>
                <span class="meta-item">{{ post()?.createdAt | date:'dd/MM/yyyy' }}</span>
                <span class="meta-divider">•</span>
                <span class="meta-item">👀 {{ post()?.viewCount || 0 }} lượt xem</span>
              </div>
            </header>

            <div class="post-body" [innerHTML]="post()?.content"></div>

            <footer class="post-footer">
              <div class="post-actions">
                <button
                  type="button"
                  class="action-btn like-btn"
                  [class.active]="isPostLikedByMe()"
                  (click)="toggleLikePost()"
                  [title]="isPostLikedByMe() ? 'Bỏ thích bài viết' : 'Thích bài viết'"
                >
                  <svg viewBox="0 0 24 24" [attr.fill]="isPostLikedByMe() ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span>{{ post()?.likeCount || 0 }} Thích</span>
                </button>
              </div>

              <a routerLink="/tin-tuc" class="back-link">← Quay lại danh sách bài viết</a>
            </footer>
          </article>

          <!-- COMMENTS SECTION -->
          <section class="comments-section">
            <h2 class="comments-title">Bình luận ({{ comments().length }})</h2>

            <!-- Add Comment Form -->
            @if (storeAuth.isLoggedIn()) {
              <form class="comment-form main-comment-form" (submit)="submitComment($event)">
                <div class="user-avatar-small">{{ getMyInitials() }}</div>
                <div class="form-body">
                  <textarea
                    [(ngModel)]="newCommentText"
                    name="content"
                    rows="3"
                    placeholder="Chia sẻ ý kiến của bạn về bài viết này..."
                    required
                  ></textarea>
                  <button type="submit" class="submit-btn" [disabled]="!newCommentText().trim()">
                    Gửi bình luận
                  </button>
                </div>
              </form>
            } @else {
              <div class="login-prompt">
                <p>Vui lòng <a routerLink="/tai-khoan">Đăng nhập</a> để gửi bình luận và tương tác với bài viết.</p>
              </div>
            }

            <!-- Comments List -->
            @if (comments().length === 0) {
              <p class="no-comments">Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nghĩ!</p>
            } @else {
              <div class="comments-list">
                @for (comment of getTopLevelComments(); track comment._id) {
                  <div class="comment-item">
                    <div class="comment-main-row">
                      <div class="user-avatar">{{ getInitials(comment.user.fullName) }}</div>
                      <div class="comment-body">
                        <div class="comment-header">
                          <strong class="user-name">{{ comment.user.fullName }}</strong>
                          <span class="comment-time">{{ comment.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                        </div>
                        <p class="comment-content">{{ comment.content }}</p>
                        
                        <div class="comment-actions">
                          <button
                            type="button"
                            class="comment-action-btn like-comment-btn"
                            [class.active]="isCommentLikedByMe(comment)"
                            (click)="toggleLikeComment(comment._id)"
                          >
                            <svg viewBox="0 0 24 24" [attr.fill]="isCommentLikedByMe(comment) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            <span>{{ comment.likes?.length || 0 }} Thích</span>
                          </button>

                          @if (storeAuth.isLoggedIn()) {
                            <button
                              type="button"
                              class="comment-action-btn reply-btn"
                              (click)="startReply(comment._id)"
                            >
                              Trả lời
                            </button>
                          }
                        </div>

                        <!-- Reply input area inside the comment -->
                        @if (replyingToId() === comment._id) {
                          <form class="comment-form reply-comment-form" (submit)="submitReply(comment._id, $event)">
                            <div class="form-body">
                              <textarea
                                [(ngModel)]="replyText"
                                name="replyContent"
                                rows="2"
                                [placeholder]="'Trả lời ' + comment.user.fullName + '...'"
                                required
                              ></textarea>
                              <div class="reply-form-actions">
                                <button type="button" class="cancel-reply-btn" (click)="cancelReply()">Hủy</button>
                                <button type="submit" class="submit-btn sm" [disabled]="!replyText().trim()">Trả lời</button>
                              </div>
                            </div>
                          </form>
                        }
                      </div>
                    </div>

                    <!-- Nested Replies -->
                    @if (getRepliesFor(comment._id).length > 0) {
                      <div class="replies-list">
                        @for (reply of getRepliesFor(comment._id); track reply._id) {
                          <div class="reply-item">
                            <div class="user-avatar sm">{{ getInitials(reply.user.fullName) }}</div>
                            <div class="comment-body">
                              <div class="comment-header">
                                <strong class="user-name">{{ reply.user.fullName }}</strong>
                                <span class="comment-time">{{ reply.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                              </div>
                              <p class="comment-content">{{ reply.content }}</p>
                              
                              <div class="comment-actions">
                                <button
                                  type="button"
                                  class="comment-action-btn like-comment-btn"
                                  [class.active]="isCommentLikedByMe(reply)"
                                  (click)="toggleLikeComment(reply._id)"
                                >
                                  <svg viewBox="0 0 24 24" [attr.fill]="isCommentLikedByMe(reply) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                  </svg>
                                  <span>{{ reply.likes?.length || 0 }} Thích</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </section>
        }
      </div>
    </section>

    <!-- CUSTOM MODAL POPUP -->
    @if (showLoginModal()) {
      <div class="custom-modal-overlay" (click)="closeLoginModal()">
        <div class="custom-modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <span class="modal-title">Thông báo</span>
            <button class="close-modal-btn" (click)="closeLoginModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="modal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <p>{{ loginModalMessage() }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-cancel" (click)="closeLoginModal()">Đóng</button>
            <a routerLink="/tai-khoan" class="btn-login">Đăng nhập ngay</a>
          </div>
        </div>
      </div>
    }

    @if (toastText()) {
      <div class="toast-notification">{{ toastText() }}</div>
    }
  `,
  styles: [
    `
      .post-wrap {
        max-width: 760px;
        margin: 0 auto;
        padding: 2.5rem 1.25rem;
      }

      .loading-state,
      .error-state {
        text-align: center;
        padding: 3rem 0;
        color: #6b7280;
      }

      .post {
        margin-bottom: 3rem;
      }

      .post-header {
        margin-bottom: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 1rem;
      }

      .post h1 {
        margin: 0 0 0.75rem;
        font-size: clamp(1.5rem, 5vw, 2.25rem);
        line-height: 1.25;
        color: #1a1d21;
        font-weight: 700;
      }

      .post-meta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
        font-size: 0.8125rem;
        color: #8b939e;
      }

      .meta-divider {
        color: #d1d5db;
      }

      .post-body {
        font-size: 0.96rem;
        line-height: 1.8;
        color: #374151;
      }

      .post-body ::ng-deep p {
        margin-bottom: 1.25rem;
      }

      .post-body ::ng-deep img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 1.5rem 0;
      }

      .post-footer {
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .post-actions {
        display: flex;
        gap: 0.75rem;
      }

      .action-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 999px;
        background: #fff;
        color: #4b5563;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .action-btn svg {
        width: 18px;
        height: 18px;
      }

      .action-btn:hover {
        background: #f9fafb;
        color: #1a1d21;
        border-color: #9ca3af;
      }

      .action-btn.like-btn.active {
        background: #fff5f5;
        color: #dc2626;
        border-color: #fca5a5;
      }

      .back-link {
        font-size: 0.875rem;
        font-weight: 600;
        color: #5c4033;
        text-decoration: none;
      }

      .back-link:hover {
        text-decoration: underline;
      }

      /* COMMENTS SECTION */
      .comments-section {
        border-top: 2px solid #f3f4f6;
        padding-top: 2.5rem;
        margin-top: 2.5rem;
      }

      .comments-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #1a1d21;
        margin: 0 0 1.5rem;
      }

      .comment-form {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .user-avatar-small,
      .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #8c6239;
        color: #fff;
        display: grid;
        place-items: center;
        font-size: 0.875rem;
        font-weight: 700;
        flex-shrink: 0;
      }

      .user-avatar.sm {
        width: 32px;
        height: 32px;
        font-size: 0.75rem;
      }

      .form-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        min-width: 0;
      }

      .comment-form textarea {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid #e4e7ec;
        border-radius: 8px;
        font-size: 0.875rem;
        background: #fafafa;
        color: #1a1d21;
        resize: vertical;
      }

      .comment-form textarea:focus {
        outline: none;
        border-color: #9ca3af;
        background: #fff;
      }

      .submit-btn {
        align-self: flex-end;
        padding: 0.55rem 1.25rem;
        border: none;
        border-radius: 6px;
        background: #1a1d21;
        color: #fff;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s ease;
      }

      .submit-btn:hover:not(:disabled) {
        background: #374151;
      }

      .submit-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .submit-btn.sm {
        padding: 0.4rem 1rem;
        font-size: 0.8125rem;
      }

      .login-prompt {
        padding: 1.25rem;
        background: #faf6f2;
        border: 1px solid #ebdcd0;
        border-radius: 8px;
        text-align: center;
        font-size: 0.875rem;
        color: #5c524a;
        margin-bottom: 2rem;
      }

      .login-prompt a {
        font-weight: 700;
        color: #8c6239;
        text-decoration: underline;
      }

      .no-comments {
        text-align: center;
        color: #9ca3af;
        padding: 2rem 0;
        font-style: italic;
      }

      .comments-list {
        display: flex;
        flex-direction: column;
        gap: 1.75rem;
      }

      .comment-item {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .comment-main-row {
        display: flex;
        gap: 1rem;
      }

      .comment-body {
        flex: 1;
        min-width: 0;
      }

      .comment-header {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
      }

      .user-name {
        font-size: 0.875rem;
        font-weight: 700;
        color: #1a1d21;
      }

      .comment-time {
        font-size: 0.75rem;
        color: #9ca3af;
      }

      .comment-content {
        margin: 0 0 0.5rem;
        font-size: 0.875rem;
        line-height: 1.5;
        color: #374151;
        word-break: break-word;
      }

      .comment-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .comment-action-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        background: transparent;
        border: none;
        color: #8b939e;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.25rem 0;
        cursor: pointer;
        transition: color 0.15s ease;
      }

      .comment-action-btn svg {
        width: 14px;
        height: 14px;
      }

      .comment-action-btn:hover {
        color: #1a1d21;
      }

      .comment-action-btn.like-comment-btn.active {
        color: #dc2626;
      }

      .reply-comment-form {
        margin-top: 1rem;
        margin-bottom: 0;
      }

      .reply-form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }

      .cancel-reply-btn {
        padding: 0.4rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: #fff;
        color: #4b5563;
        font-size: 0.8125rem;
        font-weight: 600;
        cursor: pointer;
      }

      .cancel-reply-btn:hover {
        background: #f9fafb;
      }

      /* NESTED REPLIES */
      .replies-list {
        margin-left: 3rem;
        border-left: 2px solid #e5e7eb;
        padding-left: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        margin-top: 0.5rem;
      }

      .reply-item {
        display: flex;
        gap: 0.75rem;
      }

      @media (max-width: 640px) {
        .replies-list {
          margin-left: 1.5rem;
          padding-left: 0.75rem;
        }
      }

      /* Custom Modal Styles */
      .custom-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(4px);
        animation: fadeIn 0.2s ease-out;
      }

      .custom-modal-content {
        background: #fff;
        border-radius: 12px;
        width: 90%;
        max-width: 380px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        animation: slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from { transform: translateY(15px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #f3f4f6;
        padding-bottom: 0.75rem;
      }

      .modal-title {
        font-weight: 700;
        color: #1a1d21;
        font-size: 1.1rem;
      }

      .close-modal-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #9ca3af;
        cursor: pointer;
        line-height: 1;
        padding: 0;
      }

      .close-modal-btn:hover {
        color: #4b5563;
      }

      .modal-body {
        text-align: center;
        padding: 0.5rem 0;
        color: #4b5563;
        font-size: 0.95rem;
        line-height: 1.5;
      }

      .modal-icon {
        color: #d97706;
        margin-bottom: 0.75rem;
      }

      .modal-icon svg {
        width: 48px;
        height: 48px;
        margin: 0 auto;
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        border-top: 1px solid #f3f4f6;
        padding-top: 0.75rem;
      }

      .btn-cancel {
        padding: 0.5rem 1.25rem;
        border: 1px solid #d1d5db;
        background: #fff;
        color: #4b5563;
        font-weight: 600;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.875rem;
      }

      .btn-cancel:hover {
        background: #f9fafb;
        color: #1a1d21;
      }

      .btn-login {
        padding: 0.5rem 1.25rem;
        background: #8c6239;
        color: #fff;
        font-weight: 600;
        border-radius: 6px;
        text-decoration: none;
        transition: all 0.2s;
        font-size: 0.875rem;
        text-align: center;
      }

      .btn-login:hover {
        background: #704e2d;
      }

      /* —— WORLD CUP 2026 INLINE VOUCHERS —— */
      .blog-voucher-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        border: 2px dashed #d97706;
        border-radius: 14px;
        padding: 1.5rem 1.75rem;
        margin: 2rem 0;
        box-shadow: 0 10px 25px rgba(217, 119, 6, 0.12);
        position: relative;
        overflow: hidden;
        border-left: 6px solid #d97706;
        animation: pulseBorder 3s infinite alternate;
      }

      @keyframes pulseBorder {
        0% {
          box-shadow: 0 5px 15px rgba(217, 119, 6, 0.08);
          border-color: #d97706;
        }
        100% {
          box-shadow: 0 10px 25px rgba(217, 119, 6, 0.25);
          border-color: #b45309;
        }
      }

      .voucher-left {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        flex: 1;
        padding-right: 1.5rem;
      }

      .v-tag {
        font-size: 0.7rem;
        font-weight: 800;
        color: #b45309;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      }

      .v-tag::before {
        content: '⚽';
      }

      .v-code-title {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 900;
        color: #78350f;
        letter-spacing: 0.08em;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }

      .v-desc-lbl {
        margin: 0;
        font-size: 0.875rem;
        color: #92400e;
        line-height: 1.5;
        font-weight: 500;
      }

      .voucher-right {
        display: flex;
        align-items: center;
      }

      .btn-save-blog-voucher {
        padding: 0.8rem 1.5rem;
        background: #d97706;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 0.8125rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
        white-space: nowrap;
        text-transform: uppercase;
      }

      .btn-save-blog-voucher:hover {
        background: #b45309;
        transform: translateY(-2px);
        box-shadow: 0 6px 18px rgba(217, 119, 6, 0.45);
      }

      .btn-save-blog-voucher.saved {
        background: #10b981 !important;
        color: #fff !important;
        cursor: pointer;
        box-shadow: none !important;
        transform: none !important;
      }

      @media (max-width: 576px) {
        .blog-voucher-card {
          flex-direction: column;
          align-items: stretch;
          gap: 1rem;
          padding: 1rem;
        }
        .voucher-left {
          padding-right: 0;
        }
        .btn-save-blog-voucher {
          width: 100%;
          text-align: center;
        }
      }
    `
  ]
})
export class PostDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly publicApi = inject(PublicApiService);
  readonly storeAuth = inject(StoreAuthService);

  readonly post = signal<PostRow | null>(null);
  readonly comments = signal<PostCommentRow[]>([]);
  readonly loading = signal(true);

  // Form values
  newCommentText = signal('');
  replyText = signal('');
  replyingToId = signal<string | null>(null);
  showLoginModal = signal(false);
  loginModalMessage = signal('');
  readonly toastText = signal('');
  private toastTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') || '';
    
    // Fetch article details
    this.publicApi.getPostBySlug(slug).subscribe({
      next: (postData) => {
        this.post.set(postData);
        this.fetchComments(postData._id);
        // Setup voucher dynamic action event listeners after DOM render ticks
        setTimeout(() => this.setupVoucherListeners(), 300);
      },
      error: (err) => {
        console.error('Error fetching post detail:', err);
        this.loading.set(false);
      }
    });
  }

  // Setup voucher dynamic button event click listeners inside the blog post body content
  setupVoucherListeners(): void {
    if (typeof document === 'undefined') return;
    
    // Restore button saved state for saved vouchers
    const savedVouchers = JSON.parse(localStorage.getItem('saved_blog_vouchers') || '[]');

    const buttons = document.querySelectorAll('.btn-save-blog-voucher');
    buttons.forEach((btn) => {
      const code = btn.getAttribute('data-code');
      if (code) {
        // If already saved, update button label/state
        if (savedVouchers.includes(code)) {
          btn.textContent = 'ĐÃ LƯU ✓';
          btn.classList.add('saved');
        }

        // Bind click handler
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.saveVoucher(code, btn as HTMLButtonElement);
        });
      }
    });
  }

  saveVoucher(code: string, btn: HTMLButtonElement): void {
    if (btn.classList.contains('saved')) {
      // Redirect to shop / checkout directly if user wants to use it
      this.showToast('Bạn đã lưu mã này rồi! Đang dẫn bạn tới cửa hàng mua sắm...');
      setTimeout(() => this.router.navigate(['/san-pham']), 1500);
      return;
    }

    const savedVouchers = JSON.parse(localStorage.getItem('saved_blog_vouchers') || '[]');
    if (!savedVouchers.includes(code)) {
      savedVouchers.push(code);
      localStorage.setItem('saved_blog_vouchers', JSON.stringify(savedVouchers));
    }

    // Set saved state visually
    btn.textContent = 'ĐÃ LƯU ✓';
    btn.classList.add('saved');
    this.showToast(`Đã lưu mã "${code}" thành công! Có thể dùng khi thanh toán.`);
  }

  showToast(msg: string): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastText.set(msg);
    this.toastTimeout = setTimeout(() => {
      this.toastText.set('');
    }, 3000);
  }

  fetchComments(postId: string): void {
    this.publicApi.getComments(postId).subscribe({
      next: (data) => {
        this.comments.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching comments:', err);
        this.loading.set(false);
      }
    });
  }

  // POST LIKING
  isPostLikedByMe(): boolean {
    const p = this.post();
    const user = this.storeAuth.getUser();
    if (!p || !p.likes || !user) return false;
    return p.likes.includes(user.id);
  }

  toggleLikePost(): void {
    const p = this.post();
    if (!p) return;

    if (!this.storeAuth.isLoggedIn()) {
      this.loginModalMessage.set('Bạn cần đăng nhập để có thể thích bài viết này.');
      this.showLoginModal.set(true);
      return;
    }

    this.publicApi.likePost(p._id).subscribe({
      next: (res) => {
        // Update local likes list
        const user = this.storeAuth.getUser();
        if (user && p.likes) {
          let updatedLikes = [...p.likes];
          if (res.isLiked) {
            updatedLikes.push(user.id);
          } else {
            updatedLikes = updatedLikes.filter(id => id !== user.id);
          }
          this.post.set({
            ...p,
            likeCount: res.likeCount,
            likes: updatedLikes
          });
        }
      },
      error: (err) => console.error('Error liking post:', err)
    });
  }

  // COMMENTS LIST SEPARATION
  getTopLevelComments(): PostCommentRow[] {
    return this.comments().filter(c => !c.parentId);
  }

  getRepliesFor(commentId: string): PostCommentRow[] {
    return this.comments().filter(c => c.parentId === commentId);
  }

  // COMMENT LIKING
  isCommentLikedByMe(comment: PostCommentRow): boolean {
    const user = this.storeAuth.getUser();
    if (!user || !comment.likes) return false;
    return comment.likes.includes(user.id);
  }

  toggleLikeComment(commentId: string): void {
    if (!this.storeAuth.isLoggedIn()) {
      this.loginModalMessage.set('Bạn cần đăng nhập để có thể thích bình luận.');
      this.showLoginModal.set(true);
      return;
    }

    this.publicApi.likeComment(commentId).subscribe({
      next: (updatedComment) => {
        // Update local comment state in list
        this.comments.update(list => 
          list.map(c => c._id === commentId ? updatedComment : c)
        );
      },
      error: (err) => console.error('Error liking comment:', err)
    });
  }

  // REPLY ACTIONS
  startReply(commentId: string): void {
    this.replyingToId.set(commentId);
    this.replyText.set('');
  }

  cancelReply(): void {
    this.replyingToId.set(null);
    this.replyText.set('');
  }

  // COMMENTS SUBMISSIONS
  submitComment(event: Event): void {
    event.preventDefault();
    const p = this.post();
    const text = this.newCommentText().trim();
    if (!p || !text) return;

    this.publicApi.addComment(p._id, text).subscribe({
      next: (newComment) => {
        this.comments.update(list => [...list, newComment]);
        this.newCommentText.set('');
      },
      error: (err) => console.error('Error posting comment:', err)
    });
  }

  submitReply(parentId: string, event: Event): void {
    event.preventDefault();
    const p = this.post();
    const text = this.replyText().trim();
    if (!p || !text) return;

    this.publicApi.addComment(p._id, text, parentId).subscribe({
      next: (newReply) => {
        this.comments.update(list => [...list, newReply]);
        this.cancelReply();
      },
      error: (err) => console.error('Error posting reply:', err)
    });
  }

  // INITIALS HELPERS
  getMyInitials(): string {
    const user = this.storeAuth.getUser();
    return this.getInitials(user?.fullName || 'User');
  }

  getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  closeLoginModal(): void {
    this.showLoginModal.set(false);
  }
}
