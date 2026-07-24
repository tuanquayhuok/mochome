import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PublicApiService, PostCommentRow } from '../../core/services/public-api.service';
import { StoreAuthService } from '../../core/services/store-auth.service';
import { PostRow } from '../../core/models/admin-list.models';

interface ReactionDef {
  type: string;
  emoji: string;
  label: string;
  color: string;
}

@Component({
  selector: 'app-posts-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <section class="store-section store-section--gray">
      <div class="feed-container">
        <!-- Feed Header -->
        <header class="feed-header-section">
          <nav class="store-breadcrumb" aria-label="Đường dẫn">
            <a routerLink="/">Trang chủ</a>
            <span aria-hidden="true">›</span>
            <span>Bảng tin Mộc Home</span>
          </nav>
          <h1>Bảng tin Cộng đồng</h1>
          <p>Xu hướng nội thất, cẩm nang nhà đẹp và tương tác cùng Mộc Home</p>
        </header>

        <!-- Toast Notification -->
        @if (toastMessage()) {
          <div class="toast-alert">
            <span>{{ toastMessage() }}</span>
          </div>
        }

        <!-- Feed List -->
        <div class="fb-feed">
          @if (loading()) {
            <div class="feed-state-card">
              <div class="spinner"></div>
              <p>Đang tải bảng tin...</p>
            </div>
          } @else if (posts().length === 0) {
            <div class="feed-state-card">
              <p>Chưa có bài viết nào được đăng.</p>
            </div>
          } @else {
            @for (post of posts(); track post.slug) {
              <article class="fb-card" [attr.data-post-id]="post._id">
                <!-- Card Header -->
                <header class="fb-card-head">
                  <div class="author-avatar">
                    <img src="assets/images/logo.png" alt="Mộc Home" (error)="handleAvatarError($event)" />
                  </div>
                  <div class="author-info">
                    <div class="author-name-row">
                      <span class="author-name">Mộc Home</span>
                      <!-- Scalloped Verified Badge (Răng cưa) -->
                      <span class="verified-badge" title="Tài khoản đã xác minh">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.345 0-.677.05-1 .147C15.112 2.405 13.68 1.5 12 1.5s-3.112.905-3.77 2.157c-.324-.097-.656-.147-1-.147-2.107 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.345 0 .677-.05 1-.147.658 1.252 2.09 2.157 3.77 2.157s3.112-.905 3.77-2.157c.324.097.656.147 1 .147 2.107 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.914 3.79l-3.7-3.7 1.414-1.414 2.286 2.286 5.886-5.886 1.414 1.414-7.3 7.3z" />
                        </svg>
                      </span>
                      <span class="admin-badge post-admin-badge">Quản trị viên</span>
                    </div>
                    <span class="post-time">
                      {{ formatDate(post.createdAt) }} 
                      <span class="privacy-icon" title="Công khai">🌐</span>
                    </span>
                  </div>
                </header>

                <!-- Card Body (No detailed links, fully static/self-contained) -->
                <div class="fb-card-body">
                  <h2 class="post-title">{{ post.title }}</h2>
                  <p class="post-text">{{ post.excerpt }}</p>
                  
                  @if (post.thumbnail) {
                    <div class="post-media">
                      <img [src]="post.thumbnail" [alt]="post.title" />
                    </div>
                  } @else {
                    <div class="post-media-placeholder">
                      <div class="placeholder-graphic">🛋️</div>
                      <span>Ý tưởng thiết kế độc đáo tại Mộc Home</span>
                    </div>
                  }
                </div>

                <!-- Card Interaction Counters -->
                <div class="fb-card-counters">
                  <div class="counters-left">
                    @if (post.likeCount && post.likeCount > 0) {
                      <span class="emoji-icons">
                        <span class="emoji-icon like-circle">👍</span>
                        <span class="emoji-icon love-circle">❤️</span>
                      </span>
                    }
                    
                    <!-- Hover Tooltip for Reacted Users -->
                    <div class="likes-count-wrapper">
                      <span class="counter-text clickable">{{ post.likeCount || 0 }} lượt thích</span>
                      @if (post.likes && post.likes.length > 0) {
                        <div class="likes-tooltip">
                          <div class="tooltip-title">Người tương tác:</div>
                          @for (like of post.likes; track like._id) {
                            <div class="tooltip-name">• {{ like.fullName }}</div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                  <div class="counters-right">
                    <span class="counter-text clickable" (click)="toggleComments(post)">
                      {{ getCommentCount(post._id) }} bình luận
                    </span>
                    <span class="counter-divider">•</span>
                    <span class="counter-text">{{ post.viewCount || 0 }} lượt xem</span>
                  </div>
                </div>

                <!-- Card Action Buttons with Reaction Hover Bar -->
                <div class="fb-card-actions">
                  <div class="like-button-wrapper">
                    <!-- Facebook Reaction Popup on Hover -->
                    <div class="reactions-popup">
                      @for (react of reactions; track react.type) {
                        <button 
                          type="button" 
                          class="reaction-emoji-btn" 
                          [title]="react.label"
                          (click)="selectReaction(post, react)"
                        >
                          {{ react.emoji }}
                        </button>
                      }
                    </div>

                    <button 
                      type="button" 
                      class="action-btn like-trigger" 
                      [style.color]="getActiveReactionColor(post._id)"
                      (click)="toggleLike(post)"
                    >
                      @if (getActiveReactionEmoji(post._id); as emoji) {
                        <span class="reaction-emoji-display">{{ emoji }}</span>
                      } @else {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-svg">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                        </svg>
                      }
                      <span>{{ getActiveReactionLabel(post._id) }}</span>
                    </button>
                  </div>
                  
                  <button 
                    type="button" 
                    class="action-btn" 
                    [class.active]="isCommentsExpanded(post._id)"
                    (click)="toggleComments(post)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-svg">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span>Bình luận</span>
                  </button>
                  
                  <button 
                    type="button" 
                    class="action-btn" 
                    (click)="sharePost(post)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-svg">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                      <polyline points="16 6 12 2 8 6"/>
                      <line x1="12" y1="2" x2="12" y2="15"/>
                    </svg>
                    <span>Chia sẻ</span>
                  </button>
                </div>

                <!-- Expanded Comments Section -->
                @if (isCommentsExpanded(post._id)) {
                  <div class="fb-comments-section">
                    <!-- Loading state for comments -->
                    @if (loadingComments().has(post._id)) {
                      <div class="comments-loading">
                        <div class="spinner-small"></div>
                        <span>Đang tải bình luận...</span>
                      </div>
                    }

                    <!-- Comments List -->
                    <div class="comments-list">
                      @if (getTopLevelComments(commentsByPost().get(post._id) || []).length === 0 && !loadingComments().has(post._id)) {
                        <p class="no-comments-text">Chưa có bình luận nào. Hãy gửi ý kiến đầu tiên của bạn!</p>
                      } @else {
                        @for (comment of getTopLevelComments(commentsByPost().get(post._id) || []); track comment._id) {
                          <div class="comment-item-container">
                            <!-- Main Comment Row -->
                            <div class="comment-bubble-row">
                              <div class="comment-avatar">
                                {{ getInitials(comment.user.fullName) }}
                              </div>
                              <div class="comment-content-container">
                                <div class="comment-bubble">
                                  <div class="commenter-name-row">
                                    <span class="commenter-name">{{ comment.user.fullName }}</span>
                                    
                                    <!-- Scalloped Verified Badges for Admin comments -->
                                    @if (comment.user.role === 'admin') {
                                      <span class="verified-badge-small" title="Tài khoản quản trị xác minh">
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.345 0-.677.05-1 .147C15.112 2.405 13.68 1.5 12 1.5s-3.112.905-3.77 2.157c-.324-.097-.656-.147-1-.147-2.107 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.345 0 .677-.05 1-.147.658 1.252 2.09 2.157 3.77 2.157s3.112-.905 3.77-2.157c.324.097.656.147 1 .147 2.107 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.914 3.79l-3.7-3.7 1.414-1.414 2.286 2.286 5.886-5.886 1.414 1.414-7.3 7.3z" />
                                        </svg>
                                      </span>
                                      <span class="admin-badge comment-admin-badge">Quản trị viên</span>
                                    }
                                  </div>
                                  <p class="commenter-text">{{ comment.content }}</p>
                                </div>
                                <div class="comment-meta-actions">
                                  <button 
                                    type="button" 
                                    class="comment-action-btn"
                                    [class.active]="isCommentLikedByMe(comment)"
                                    (click)="toggleLikeComment(post._id, comment._id)"
                                  >
                                    Thích ({{ comment.likes?.length || 0 }})
                                  </button>
                                  <span class="action-divider">•</span>
                                  <button 
                                    type="button" 
                                    class="comment-action-btn"
                                    (click)="startReply(comment._id)"
                                  >
                                    Trả lời
                                  </button>
                                  <span class="action-divider">•</span>
                                  <span class="comment-time-ago">{{ formatDate(comment.createdAt) }}</span>
                                </div>
                              </div>
                            </div>

                            <!-- Replies List (Indented) -->
                            @if (getRepliesFor(commentsByPost().get(post._id) || [], comment._id).length > 0) {
                              <div class="comment-replies-container">
                                @for (reply of getRepliesFor(commentsByPost().get(post._id) || [], comment._id); track reply._id) {
                                  <div class="comment-bubble-row reply-bubble-row">
                                    <div class="comment-avatar reply-avatar">
                                      {{ getInitials(reply.user.fullName) }}
                                    </div>
                                    <div class="comment-content-container">
                                      <div class="comment-bubble reply-bubble">
                                        <div class="commenter-name-row">
                                          <span class="commenter-name">{{ reply.user.fullName }}</span>
                                          @if (reply.user.role === 'admin') {
                                            <span class="verified-badge-small" title="Tài khoản quản trị xác minh">
                                              <svg viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.345 0-.677.05-1 .147C15.112 2.405 13.68 1.5 12 1.5s-3.112.905-3.77 2.157c-.324-.097-.656-.147-1-.147-2.107 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.345 0 .677-.05 1-.147.658 1.252 2.09 2.157 3.77 2.157s3.112-.905 3.77-2.157c.324.097.656.147 1 .147 2.107 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.914 3.79l-3.7-3.7 1.414-1.414 2.286 2.286 5.886-5.886 1.414 1.414-7.3 7.3z" />
                                              </svg>
                                            </span>
                                            <span class="admin-badge comment-admin-badge">Quản trị viên</span>
                                          }
                                        </div>
                                        <p class="commenter-text">{{ reply.content }}</p>
                                      </div>
                                      <div class="comment-meta-actions">
                                        <button 
                                          type="button" 
                                          class="comment-action-btn"
                                          [class.active]="isCommentLikedByMe(reply)"
                                          (click)="toggleLikeComment(post._id, reply._id)"
                                        >
                                          Thích ({{ reply.likes?.length || 0 }})
                                        </button>
                                        <span class="action-divider">•</span>
                                        <span class="comment-time-ago">{{ formatDate(reply.createdAt) }}</span>
                                      </div>
                                    </div>
                                  </div>
                                }
                              </div>
                            }

                            <!-- Inline Reply Input Form -->
                            @if (replyingToCommentId() === comment._id && storeAuth.isLoggedIn()) {
                              <div class="reply-input-row">
                                <div class="comment-avatar reply-avatar my-avatar">
                                  {{ getInitials(storeAuth.getUser()?.fullName || 'Me') }}
                                </div>
                                <form class="comment-input-form reply-form" (submit)="submitReply(post._id, comment._id, $event)">
                                  <input 
                                    type="text" 
                                    [(ngModel)]="replyTextVal"
                                    name="reply_input"
                                    placeholder="Phản hồi bình luận này..." 
                                    required
                                  />
                                  <button type="button" class="btn-cancel-reply" (click)="cancelReply()">Hủy</button>
                                  <button type="submit" class="btn-send-comment" [disabled]="!replyTextVal.trim()">Phản hồi</button>
                                </form>
                              </div>
                            }
                          </div>
                        }
                      }
                    </div>

                    <!-- Add Comment input bar -->
                    <div class="add-comment-bar">
                      @if (storeAuth.isLoggedIn()) {
                        <div class="comment-avatar my-avatar">
                          {{ getInitials(storeAuth.getUser()?.fullName || 'Me') }}
                        </div>
                        <form class="comment-input-form" (submit)="submitComment(post._id, $event)">
                          <input 
                            type="text" 
                            [name]="'comment_' + post._id"
                            [(ngModel)]="commentInputs()[post._id]"
                            [disabled]="isSubmittingComment(post._id)"
                            placeholder="Viết bình luận công khai..." 
                            required
                          />
                          <button 
                            type="submit" 
                            class="btn-send-comment"
                            [disabled]="isSubmittingComment(post._id) || !getCommentInputVal(post._id).trim()"
                          >
                            @if (isSubmittingComment(post._id)) {
                              ⌛
                            } @else {
                              ▶
                            }
                          </button>
                        </form>
                      } @else {
                        <div class="login-prompt-bar">
                          Vui lòng <a routerLink="/tai-khoan">Đăng nhập</a> để tham gia bình luận.
                        </div>
                      }
                    </div>
                  </div>
                }
              </article>
            }
          }
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .feed-container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem 1rem 4rem;
      }

      .feed-header-section {
        margin-bottom: 2rem;
        text-align: center;
      }

      .feed-header-section h1 {
        font-size: 2.25rem;
        font-weight: 800;
        color: #2c2520;
        margin: 0.5rem 0 0.25rem;
      }

      .feed-header-section p {
        font-size: 1rem;
        color: #7a6e67;
        margin: 0;
      }

      /* FB card style */
      .fb-feed {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .fb-card {
        background: #ffffff;
        border: 1px solid #e4e6eb;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        overflow: hidden;
      }

      .fb-card-head {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.25rem 0.5rem;
      }

      .author-avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        overflow: hidden;
        background: #f0f2f5;
        border: 1px solid #eae6e2;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .author-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .author-info {
        display: flex;
        flex-direction: column;
      }

      .author-name-row {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .author-name {
        font-weight: 700;
        font-size: 0.95rem;
        color: #050505;
      }

      .verified-badge {
        color: #1877f2;
        display: flex;
        align-items: center;
      }

      .verified-badge svg {
        width: 16px;
        height: 16px;
      }

      .post-time {
        font-size: 0.75rem;
        color: #65676b;
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .fb-card-body {
        padding: 0.5rem 1.25rem 1rem;
      }

      .post-title {
        font-size: 1.35rem;
        font-weight: 800;
        margin: 0 0 0.75rem;
        line-height: 1.35;
        color: #050505;
      }

      .post-text {
        font-size: 0.95rem;
        color: #111;
        line-height: 1.6;
        margin: 0 0 1rem;
      }

      .post-media {
        display: block;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #e4e6eb;
        max-height: 480px;
      }

      .post-media img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .post-media-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #f5efe9, #ebdcd0);
        border: 1px solid #e4e6eb;
        border-radius: 8px;
        padding: 4rem 2rem;
        color: #8c7161;
        gap: 0.5rem;
      }

      .placeholder-graphic {
        font-size: 3rem;
      }

      .post-media-placeholder span {
        font-size: 0.95rem;
        font-weight: 600;
      }

      .fb-card-counters {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1.25rem;
        border-bottom: 1px solid #e4e6eb;
        margin: 0 1.25rem;
      }

      .counters-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .emoji-icons {
        display: flex;
        align-items: center;
      }

      .emoji-icon {
        font-size: 0.8125rem;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1.5px solid #fff;
      }

      .emoji-icon.like-circle {
        background: #1877f2;
        color: #fff;
        z-index: 2;
      }

      .emoji-icon.love-circle {
        background: #f02849;
        margin-left: -4px;
        z-index: 1;
      }

      .counter-text {
        font-size: 0.875rem;
        color: #65676b;
      }

      /* Hover Tooltip for likes */
      .likes-count-wrapper {
        position: relative;
        display: inline-block;
      }

      .likes-tooltip {
        position: absolute;
        bottom: 130%;
        left: 0;
        background: rgba(28, 30, 33, 0.95);
        color: #ffffff;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 0.75rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 100;
        opacity: 0;
        pointer-events: none;
        transform: translateY(6px);
        transition: opacity 0.2s ease, transform 0.2s ease;
        min-width: 160px;
        line-height: 1.4;
      }

      .likes-count-wrapper:hover .likes-tooltip {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
      }

      .tooltip-title {
        font-weight: 700;
        margin-bottom: 4px;
        color: #e4e6eb;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 3px;
      }

      .tooltip-name {
        margin: 2px 0;
        color: #fff;
      }

      .counter-text.clickable {
        cursor: pointer;
      }

      .counter-text.clickable:hover {
        text-decoration: underline;
      }

      .counter-divider {
        font-size: 0.875rem;
        color: #65676b;
        margin: 0 0.35rem;
      }

      .fb-card-actions {
        display: flex;
        padding: 0.35rem;
        margin: 0 1.25rem;
      }

      .like-button-wrapper {
        position: relative;
        flex: 1;
        display: flex;
      }

      /* Reactions popup on hover */
      .reactions-popup {
        position: absolute;
        bottom: 110%;
        left: 50%;
        transform: translateX(-50%) translateY(10px);
        background: #ffffff;
        border: 1px solid #e4e6eb;
        border-radius: 30px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        padding: 6px 10px;
        display: flex;
        gap: 10px;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.28), transform 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.28);
        z-index: 50;
      }

      .like-button-wrapper:hover .reactions-popup {
        opacity: 1;
        pointer-events: auto;
        transform: translateX(-50%) translateY(0);
      }

      .reaction-emoji-btn {
        background: transparent;
        border: none;
        font-size: 26px;
        cursor: pointer;
        transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .reaction-emoji-btn:hover {
        transform: scale(1.35) translateY(-5px);
      }

      .action-btn {
        flex: 1;
        background: transparent;
        border: none;
        padding: 0.65rem;
        border-radius: 6px;
        color: #65676b;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: background 0.15s;
        width: 100%;
      }

      .action-btn:hover {
        background: #f0f2f5;
      }

      .action-btn.active {
        color: #1877f2;
      }

      .action-svg {
        width: 20px;
        height: 20px;
        stroke-width: 2px;
      }

      .action-btn.active .action-svg {
        fill: currentColor;
      }

      .reaction-emoji-display {
        font-size: 1.15rem;
      }

      /* Expanded Comments */
      .fb-comments-section {
        background: #fbfbfc;
        border-top: 1px solid #e4e6eb;
        padding: 1rem 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .comments-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.5rem 0;
        font-size: 0.875rem;
        color: #65676b;
      }

      .no-comments-text {
        font-size: 0.875rem;
        color: #65676b;
        text-align: center;
        margin: 0.5rem 0;
      }

      .comments-list {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
      }

      .comment-item-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .comment-bubble-row {
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;
      }

      .comment-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #8c7161;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8125rem;
        font-weight: 700;
        flex-shrink: 0;
      }

      .comment-avatar.my-avatar {
        background: #4a3e3d;
      }

      .comment-content-container {
        display: flex;
        flex-direction: column;
        max-width: calc(100% - 46px);
      }

      .comment-bubble {
        background: #f0f2f5;
        border-radius: 18px;
        padding: 0.6rem 1rem;
        display: inline-block;
      }

      .commenter-name-row {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        margin-bottom: 0.15rem;
      }

      .commenter-name {
        font-size: 0.85rem;
        font-weight: 700;
        color: #050505;
      }

      .verified-badge-small {
        color: #1877f2;
        display: flex;
        align-items: center;
      }

      .verified-badge-small svg {
        width: 13px;
        height: 13px;
      }

      .admin-badge {
        background: #e7f3ff;
        color: #1877f2;
        font-size: 0.65rem;
        font-weight: 700;
        padding: 1px 6px;
        border-radius: 4px;
        margin-left: 0.25rem;
      }

      .comment-admin-badge {
        background: #e7f3ff;
        color: #1877f2;
      }

      .post-admin-badge {
        background: #f02849;
        color: #ffffff;
      }

      .commenter-text {
        margin: 0;
        font-size: 0.9rem;
        color: #050505;
        line-height: 1.4;
      }

      .comment-meta-actions {
        font-size: 0.75rem;
        color: #65676b;
        margin-top: 0.2rem;
        padding-left: 0.75rem;
        display: flex;
        align-items: center;
      }

      .comment-action-btn {
        background: transparent;
        border: none;
        font-size: 0.75rem;
        font-weight: 700;
        color: #65676b;
        cursor: pointer;
        padding: 0;
        transition: color 0.15s;
      }

      .comment-action-btn:hover {
        text-decoration: underline;
      }

      .comment-action-btn.active {
        color: #1877f2;
      }

      .action-divider {
        margin: 0 0.35rem;
        font-size: 0.75rem;
        color: #65676b;
      }

      /* Indented replies container */
      .comment-replies-container {
        margin-left: 2.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
        border-left: 2px solid #e4e6eb;
        padding-left: 0.75rem;
        margin-top: 0.25rem;
      }

      .reply-bubble-row {
        gap: 0.5rem !important;
      }

      .reply-avatar {
        width: 28px !important;
        height: 28px !important;
        font-size: 0.65rem !important;
      }

      .reply-bubble {
        border-radius: 16px !important;
        padding: 0.5rem 0.85rem !important;
      }

      /* Reply input */
      .reply-input-row {
        margin-left: 2.75rem;
        display: flex;
        gap: 0.5rem;
        align-items: center;
        margin-top: 0.35rem;
      }

      .reply-form {
        border-radius: 18px !important;
        padding: 0.2rem 0.5rem 0.2rem 0.75rem !important;
      }

      .btn-cancel-reply {
        background: transparent;
        border: none;
        color: #65676b;
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 600;
        margin-right: 0.5rem;
      }

      .btn-cancel-reply:hover {
        text-decoration: underline;
      }

      .comment-time-ago {
        color: #8a8d91;
        font-size: 0.75rem;
      }

      .add-comment-bar {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        border-top: 1px solid #e4e6eb;
        padding-top: 1rem;
        margin-top: 0.25rem;
      }

      .comment-input-form {
        display: flex;
        flex: 1;
        background: #f0f2f5;
        border-radius: 24px;
        padding: 0.35rem 0.5rem 0.35rem 1rem;
        align-items: center;
      }

      .comment-input-form input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        padding: 0.5rem 0;
        font-size: 0.9rem;
      }

      .comment-input-form input[disabled] {
        opacity: 0.65;
        cursor: not-allowed;
      }

      .btn-send-comment {
        background: transparent;
        border: none;
        color: #1877f2;
        cursor: pointer;
        padding: 0.35rem;
        font-size: 0.95rem;
      }

      .btn-send-comment[disabled] {
        color: #bcc0c4;
        cursor: not-allowed;
      }

      .login-prompt-bar {
        font-size: 0.875rem;
        color: #65676b;
        text-align: center;
        width: 100%;
        padding: 0.5rem 0;
      }

      .login-prompt-bar a {
        color: #1877f2;
        text-decoration: none;
        font-weight: 600;
      }

      .login-prompt-bar a:hover {
        text-decoration: underline;
      }

      .feed-state-card {
        background: #fff;
        border: 1px solid #e4e6eb;
        border-radius: 12px;
        padding: 4rem 2rem;
        text-align: center;
        color: #65676b;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
      }

      .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #8c7161;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .spinner-small {
        width: 16px;
        height: 16px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #8c7161;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* Toast alert */
      .toast-alert {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.85);
        color: #fff;
        padding: 0.75rem 1.75rem;
        border-radius: 30px;
        font-size: 0.9rem;
        font-weight: 600;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: fadeInUp 0.25s ease-out;
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translate(-50%, 10px);
        }
        to {
          opacity: 1;
          transform: translate(-50%, 0);
        }
      }
    `
  ]
})
export class PostsListComponent implements OnInit, OnDestroy {
  private readonly publicApi = inject(PublicApiService);
  readonly storeAuth = inject(StoreAuthService);

  readonly posts = signal<PostRow[]>([]);
  readonly loading = signal(true);
  readonly toastMessage = signal<string | null>(null);

  // States for comments & interactions
  readonly expandedComments = signal<Set<string>>(new Set());
  readonly commentsByPost = signal<Map<string, PostCommentRow[]>>(new Map());
  readonly loadingComments = signal<Set<string>>(new Set());
  readonly commentInputs = signal<Record<string, string>>({});
  readonly submittingComment = signal<Set<string>>(new Set());

  // Reply features
  readonly replyingToCommentId = signal<string | null>(null);
  replyTextVal = ''; // Standard string property instead of Signal

  // Local reactions tracking
  readonly userReactionByPost = signal<Record<string, ReactionDef>>({});
  readonly likedComments = signal<Set<string>>(new Set());

  // Real view tracking properties
  private observer?: IntersectionObserver;
  private viewTimers: Record<string, any> = {};

  readonly reactions: ReactionDef[] = [
    { type: 'like', emoji: '👍', label: 'Thích', color: '#1877f2' },
    { type: 'love', emoji: '❤️', label: 'Yêu thích', color: '#f02849' },
    { type: 'haha', emoji: '😆', label: 'Haha', color: '#f7b125' },
    { type: 'wow', emoji: '😮', label: 'Wow', color: '#f7b125' },
    { type: 'sad', emoji: '😢', label: 'Buồn', color: '#f7b125' },
    { type: 'angry', emoji: '😡', label: 'Phẫn nộ', color: '#e96630' }
  ];

  ngOnInit(): void {
    this.loadPosts();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    Object.values(this.viewTimers).forEach(clearTimeout);
  }

  getCurrentUserId(): string | null {
    const user = this.storeAuth.getUser();
    if (!user) return null;
    return (user.id || (user as any)._id || '').toString();
  }

  isLikedByMe(likes?: any[]): boolean {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId || !likes) return false;
    return likes.some(lk => {
      const id = lk._id || lk;
      return id && id.toString() === currentUserId;
    });
  }

  loadPosts(): void {
    this.loading.set(true);
    this.publicApi.getPublicPosts().subscribe({
      next: (data) => {
        this.posts.set(data);
        this.loading.set(false);

        const inputs: Record<string, string> = {};
        const reactionsMap: Record<string, ReactionDef> = {};

        data.forEach(p => {
          inputs[p._id] = '';
          if (p.likes && this.storeAuth.isLoggedIn()) {
            if (this.isLikedByMe(p.likes)) {
              reactionsMap[p._id] = this.reactions[0];
            }
          }
        });
        this.commentInputs.set(inputs);
        this.userReactionByPost.set(reactionsMap);

        // Setup real view observer tracking
        this.setupViewTracking();
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  // Intersection Observer for counting real impressions
  setupViewTracking(): void {
    if (typeof window === 'undefined') return;

    if (this.observer) {
      this.observer.disconnect();
    }

    setTimeout(() => {
      const cards = document.querySelectorAll('.fb-card[data-post-id]');
      if (cards.length === 0) return;

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const postId = entry.target.getAttribute('data-post-id');
          if (!postId) return;

          if (entry.isIntersecting) {
            const sessionKey = 'viewed_post_' + postId;
            if (sessionStorage.getItem(sessionKey)) {
              return; // Already recorded this session
            }

            // Must be visible on screen for at least 1.5 seconds to count as read/viewed
            if (!this.viewTimers[postId]) {
              this.viewTimers[postId] = setTimeout(() => {
                this.recordRealView(postId);
              }, 1500);
            }
          } else {
            // Cancel timer if they scroll past quickly
            if (this.viewTimers[postId]) {
              clearTimeout(this.viewTimers[postId]);
              delete this.viewTimers[postId];
            }
          }
        });
      }, {
        threshold: 0.5 // At least 50% visible in the viewport
      });

      cards.forEach(card => this.observer?.observe(card));
    }, 600);
  }

  recordRealView(postId: string): void {
    const sessionKey = 'viewed_post_' + postId;
    sessionStorage.setItem(sessionKey, 'true');

    this.publicApi.viewPost(postId).subscribe({
      next: (res) => {
        this.posts.update(list => list.map(p => {
          if (p._id === postId) {
            return { ...p, viewCount: res.viewCount };
          }
          return p;
        }));
      }
    });

    if (this.viewTimers[postId]) {
      delete this.viewTimers[postId];
    }
  }

  handleAvatarError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=100&auto=format&fit=crop&q=60';
  }

  getActiveReactionLabel(postId: string): string {
    return this.userReactionByPost()[postId]?.label || 'Thích';
  }

  getActiveReactionEmoji(postId: string): string | null {
    return this.userReactionByPost()[postId]?.emoji || null;
  }

  getActiveReactionColor(postId: string): string {
    return this.userReactionByPost()[postId]?.color || '';
  }

  selectReaction(post: PostRow, reaction: ReactionDef): void {
    if (!this.storeAuth.isLoggedIn()) {
      this.showToast('Vui lòng đăng nhập để thả cảm xúc.');
      return;
    }

    const currentReaction = this.userReactionByPost()[post._id];
    if (currentReaction && currentReaction.type === reaction.type) {
      this.toggleLike(post);
      return;
    }

    const hasLiked = Boolean(currentReaction);
    if (!hasLiked) {
      this.publicApi.likePost(post._id).subscribe({
        next: (res) => {
          this.userReactionByPost.update(map => ({ ...map, [post._id]: reaction }));
          this.posts.update(list => list.map(p => {
            if (p._id === post._id) {
              return { ...p, likeCount: res.likeCount, likes: res.likes };
            }
            return p;
          }));
        }
      });
    } else {
      this.userReactionByPost.update(map => ({ ...map, [post._id]: reaction }));
    }
  }

  toggleLike(post: PostRow): void {
    if (!this.storeAuth.isLoggedIn()) {
      this.showToast('Vui lòng đăng nhập để thích bài viết.');
      return;
    }

    const currentReaction = this.userReactionByPost()[post._id];
    
    this.publicApi.likePost(post._id).subscribe({
      next: (res) => {
        this.userReactionByPost.update(map => {
          const next = { ...map };
          if (currentReaction) {
            delete next[post._id];
          } else {
            next[post._id] = this.reactions[0];
          }
          return next;
        });

        this.posts.update(list => list.map(p => {
          if (p._id === post._id) {
            return { ...p, likeCount: res.likeCount, likes: res.likes };
          }
          return p;
        }));
      }
    });
  }

  isCommentsExpanded(postId: string): boolean {
    return this.expandedComments().has(postId);
  }

  toggleComments(post: PostRow): void {
    const isExpanded = this.expandedComments().has(post._id);
    
    this.expandedComments.update(set => {
      const next = new Set(set);
      if (isExpanded) {
        next.delete(post._id);
      } else {
        next.add(post._id);
      }
      return next;
    });

    if (!isExpanded && !this.commentsByPost().has(post._id)) {
      this.loadComments(post._id);
    }
  }

  loadComments(postId: string): void {
    this.loadingComments.update(set => {
      const next = new Set(set);
      next.add(postId);
      return next;
    });

    this.publicApi.getComments(postId).subscribe({
      next: (comments) => {
        this.commentsByPost.update(map => {
          const next = new Map(map);
          next.set(postId, comments);
          return next;
        });
        this.loadingComments.update(set => {
          const next = new Set(set);
          next.delete(postId);
          return next;
        });
      },
      error: () => {
        this.loadingComments.update(set => {
          const next = new Set(set);
          next.delete(postId);
          return next;
        });
      }
    });
  }

  getCommentCount(postId: string): number {
    return this.commentsByPost().get(postId)?.length || 0;
  }

  getCommentInputVal(postId: string): string {
    return this.commentInputs()[postId] || '';
  }

  isSubmittingComment(postId: string): boolean {
    return this.submittingComment().has(postId);
  }

  submitComment(postId: string, event: Event): void {
    event.preventDefault();
    const content = this.getCommentInputVal(postId).trim();
    if (!content || this.isSubmittingComment(postId)) return;

    this.submittingComment.update(set => {
      const next = new Set(set);
      next.add(postId);
      return next;
    });

    this.publicApi.addComment(postId, content).subscribe({
      next: (newComment) => {
        this.commentsByPost.update(map => {
          const next = new Map(map);
          const current = next.get(postId) || [];
          next.set(postId, [...current, newComment]);
          return next;
        });

        this.commentInputs.update(record => {
          const next = { ...record };
          next[postId] = '';
          return next;
        });

        this.submittingComment.update(set => {
          const next = new Set(set);
          next.delete(postId);
          return next;
        });
      },
      error: () => {
        this.showToast('Gửi bình luận không thành công.');
        this.submittingComment.update(set => {
          const next = new Set(set);
          next.delete(postId);
          return next;
        });
      }
    });
  }

  // Comments and Replies Actions
  getTopLevelComments(comments: PostCommentRow[]): PostCommentRow[] {
    return comments.filter(c => !c.parentId);
  }

  getRepliesFor(comments: PostCommentRow[], commentId: string): PostCommentRow[] {
    return comments.filter(c => c.parentId === commentId);
  }

  isCommentLikedByMe(comment: PostCommentRow): boolean {
    return this.isLikedByMe(comment.likes);
  }

  toggleLikeComment(postId: string, commentId: string): void {
    if (!this.storeAuth.isLoggedIn()) {
      this.showToast('Vui lòng đăng nhập để thích bình luận.');
      return;
    }
    this.publicApi.likeComment(commentId).subscribe({
      next: (updatedComment) => {
        this.commentsByPost.update(map => {
          const next = new Map(map);
          const current = next.get(postId) || [];
          const updated = current.map(c => c._id === commentId ? updatedComment : c);
          next.set(postId, updated);
          return next;
        });
        
        this.likedComments.update(set => {
          const next = new Set(set);
          if (next.has(commentId)) {
            next.delete(commentId);
          } else {
            next.add(commentId);
          }
          return next;
        });
      }
    });
  }

  startReply(commentId: string): void {
    if (!this.storeAuth.isLoggedIn()) {
      this.showToast('Vui lòng đăng nhập để phản hồi bình luận.');
      return;
    }
    this.replyingToCommentId.set(commentId);
    this.replyTextVal = '';
  }

  cancelReply(): void {
    this.replyingToCommentId.set(null);
    this.replyTextVal = '';
  }

  submitReply(postId: string, parentId: string, event: Event): void {
    event.preventDefault();
    const content = this.replyTextVal.trim();
    if (!content) return;

    this.publicApi.addComment(postId, content, parentId).subscribe({
      next: (newReply) => {
        this.commentsByPost.update(map => {
          const next = new Map(map);
          const current = next.get(postId) || [];
          next.set(postId, [...current, newReply]);
          return next;
        });
        this.cancelReply();
      },
      error: () => {
        this.showToast('Không thể gửi phản hồi.');
      }
    });
  }

  sharePost(post: PostRow): void {
    const postUrl = `${window.location.origin}/bai-viet/${post.slug}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      this.showToast('Đã sao chép liên kết bài viết vào Clipboard!');
    }).catch(() => {
      this.showToast('Không thể sao chép liên kết.');
    });
  }

  showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Vừa xong';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;

    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  getInitials(fullName?: string): string {
    if (!fullName) return '';
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }
}
