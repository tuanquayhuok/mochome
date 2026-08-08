import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';

import { LoyaltyMarkerIconComponent } from './loyalty-marker-icon.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StoreProfileService } from '../../core/services/store-profile.service';
import { StoreAuthService, StoreUser } from '../../core/services/store-auth.service';
import { StoreAccountOrdersComponent } from './store-account-orders.component';
import { createDefaultLoyalty } from '../../core/models/loyalty-defaults';
import {
  MONTH_TRACK_MAX,
  monthTrackMarkers,
  spendPercent,
  YEAR_TRACK_MAX,
  yearTrackMarkers,
  LoyaltyTrackMarker
} from '../../core/models/loyalty-track.config';
import { LoyaltyInfo, LoyaltyMilestone, LoyaltyTierId } from '../../core/models/store-profile.models';

type Panel = 'profile' | 'orders' | 'security' | 'loyalty' | 'lucky-wheel';

const TIER_BADGE: Record<string, string> = {
  bronze: 'tier-bronze',
  silver: 'tier-silver',
  gold: 'tier-gold',
  diamond: 'tier-diamond',
  vip: 'tier-vip',
  partner: 'tier-partner',
  super_loyal: 'tier-super'
};

@Component({
  selector: 'app-store-account-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DecimalPipe, LoyaltyMarkerIconComponent, StoreAccountOrdersComponent],
  template: `
    <div class="account-grid">
      <aside class="store-card account-nav">
        <div class="account-nav-inner">
        <div class="profile-summary">
          @if (user().avatarUrl) {
            <img [src]="user().avatarUrl" alt="" class="avatar-img" />
          } @else {
            <span class="avatar">{{ initials(user().fullName) }}</span>
          }
          <div>
            <strong>{{ user().fullName }}</strong>
            <span class="email-line">{{ user().email }}</span>
          </div>
        </div>
        <nav class="account-menu">
          <button type="button" class="menu-item" [class.active]="panel() === 'profile'" (click)="setPanel('profile')">
            Thông tin cá nhân
          </button>
          <button type="button" class="menu-item" [class.active]="panel() === 'orders'" (click)="setPanel('orders')">
            Đơn hàng của tôi
          </button>
          <button type="button" class="menu-item" [class.active]="panel() === 'loyalty'" (click)="setPanel('loyalty')">
            Ưu đãi thành viên
          </button>
          <button type="button" class="menu-item" [class.active]="panel() === 'security'" (click)="setPanel('security')">
            Bảo mật
          </button>
          <button type="button" class="menu-item" [class.active]="panel() === 'lucky-wheel'" (click)="setPanel('lucky-wheel')">
            Vòng quay may mắn
          </button>
          <a routerLink="/gio-hang" class="menu-item">Giỏ hàng</a>
          <a routerLink="/yeu-thich" class="menu-item">Yêu thích</a>
        </nav>
        <button type="button" class="logout-btn" (click)="logout.emit()">Đăng xuất</button>
        </div>
      </aside>

      <div class="store-card account-panel">

        @if (panel() === 'profile') {
          <h2>Thông tin cá nhân</h2>
          @if (profileMsg()) {
            <div class="store-alert-success">{{ profileMsg() }}</div>
          }
          @if (profileErr()) {
            <div class="store-alert-error">{{ profileErr() }}</div>
          }

          <div class="avatar-edit">
            <div class="avatar-container" (click)="showAvatarPicker.set(!showAvatarPicker())">
              @if (user().avatarUrl) {
                <img [src]="user().avatarUrl" alt="" class="avatar-lg" />
              } @else {
                <span class="avatar avatar-lg">{{ initials(user().fullName) }}</span>
              }
              <div class="avatar-overlay">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </div>
            </div>
            <div>
              <button type="button" class="store-btn store-btn-outline avatar-btn" (click)="showAvatarPicker.set(!showAvatarPicker())">
                Đổi ảnh đại diện
              </button>
            </div>
          </div>

          @if (showAvatarPicker()) {
            <div class="avatar-picker-panel">
              <h4>Chọn ảnh đại diện mẫu hoặc tải lên</h4>
              <div class="avatar-options-grid">
                @for (avt of sampleAvatars; track avt) {
                  <button type="button" class="avatar-option-btn" (click)="selectSampleAvatar(avt); showAvatarPicker.set(false)" [class.active]="user().avatarUrl === avt">
                    <img [src]="avt" alt="Avatar option" />
                  </button>
                }
                <label class="avatar-option-btn avatar-upload-btn">
                  <span class="plus-icon">+</span>
                  <input type="file" accept="image/*" hidden (change)="onAvatarPick($event); showAvatarPicker.set(false)" />
                </label>
              </div>
            </div>
          }

          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="profile-form">
            <div class="form-row">
              <div class="store-field">
                <label>Họ tên <em>*</em></label>
                <input type="text" formControlName="fullName" />
              </div>
              <div class="store-field">
                <label>Email</label>
                <input type="email" [value]="user().email" disabled />
              </div>
            </div>
            <div class="form-row">
              <div class="store-field">
                <label>Số điện thoại</label>
                <input type="tel" formControlName="phone" placeholder="09xxxxxxxx" />
              </div>
              <div class="store-field">
                <label>Ngày sinh</label>
                <input type="date" formControlName="dateOfBirth" />
              </div>
              <div class="store-field">
                <label>Giới tính</label>
                <select formControlName="gender">
                  <option value="">— Chọn —</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>

            <h3 class="section-title">Địa chỉ giao hàng</h3>
            <div class="form-row" formGroupName="address">
              <div class="store-field">
                <label>Tỉnh / Thành phố</label>
                <input type="text" formControlName="province" placeholder="TP. Hồ Chí Minh" />
              </div>
              <div class="store-field">
                <label>Quận / Huyện</label>
                <input type="text" formControlName="district" />
              </div>
              <div class="store-field">
                <label>Phường / Xã</label>
                <input type="text" formControlName="ward" />
              </div>
            </div>
            <div class="form-row" formGroupName="address">
              <div class="store-field flex-2">
                <label>Địa chỉ chi tiết</label>
                <input type="text" formControlName="street" placeholder="Số nhà, tên đường" />
              </div>
              <div class="store-field">
                <label>Mã bưu điện</label>
                <input type="text" formControlName="zip" />
              </div>
            </div>

            <button type="submit" class="store-btn store-btn-primary" [disabled]="savingProfile()">
              {{ savingProfile() ? 'Đang lưu...' : 'Lưu thông tin' }}
            </button>
          </form>
        }

        @if (panel() === 'orders') {
          <app-store-account-orders />
        }

        @if (panel() === 'lucky-wheel') {
          <h2 style="text-align: center; color: #5c4033; font-weight: 700; font-size: 1.5rem; margin-bottom: 0.5rem;">Vòng Quay May Mắn Mộc Home</h2>
          <div class="lucky-wheel-panel">
            <div class="wheel-intro">
              <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.75rem;">Sử dụng số điểm tích lũy thành viên để thử vận may nhận ngay voucher giảm giá trực tiếp mua sắm nội thất cao cấp. Mỗi lượt quay tốn <strong>20 điểm</strong>.</p>
              <div class="user-points-badge">
                Số điểm hiện tại của bạn: <span><strong>{{ userPoints() }}</strong> điểm</span>
              </div>
            </div>

            <div class="wheel-wrapper">
              <div class="wheel-pointer"></div>
              <div class="wheel-outer" [style.transform]="wheelRotationStyle()">
                <div class="wheel-canvas">
                  <div class="wheel-sector" style="--i:0; --bg:#8c7161;"><span>Voucher 50k</span></div>
                  <div class="wheel-sector" style="--i:1; --bg:#ebdcd0; --color:#5c4033;"><span>Freeship</span></div>
                  <div class="wheel-sector" style="--i:2; --bg:#5c4033;"><span>Voucher 10%</span></div>
                  <div class="wheel-sector" style="--i:3; --bg:#fcfaf8; --color:#5c4033;"><span>Chúc may mắn</span></div>
                  <div class="wheel-sector" style="--i:4; --bg:#7c5e4d;"><span>Voucher 100k</span></div>
                  <div class="wheel-sector" style="--i:5; --bg:#dfcfc4; --color:#5c4033;"><span>Voucher 200k</span></div>
                </div>
              </div>
              <button type="button" class="spin-trigger" (click)="spinWheel()" [disabled]="isSpinning() || userPoints() < 20">
                {{ isSpinning() ? '...' : 'QUAY' }}
              </button>
            </div>

            @if (wheelResultMsg()) {
              <div class="wheel-result-alert" [class.success]="hasWon()">
                <div class="result-title">{{ hasWon() ? '🎉 CHÚC MỪNG BẠN ĐÃ TRÚNG THƯỞNG!' : '😢 RẤT TIẾC!' }}</div>
                <p style="margin: 0; font-size: 0.875rem; color: #4b5563;">{{ wheelResultMsg() }}</p>
                @if (hasWon()) {
                  <div class="voucher-code-copy">
                    Mã Voucher: <strong>{{ wonVoucherCode() }}</strong>
                    <button type="button" class="copy-btn" (click)="copyVoucher()">Sao chép</button>
                  </div>
                }
              </div>
            }
          </div>
        }

        @if (panel() === 'loyalty') {
          <h2>Ưu đãi thành viên</h2>
          @if (loyaltyError()) {
            <div class="store-alert-error" style="display: flex; align-items: center; gap: 0.5rem;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; flex-shrink: 0;">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{{ loyaltyError() }}</span>
            </div>
          }
          @if (claimMsg()) {
            <div class="store-alert-success" style="display: flex; align-items: center; gap: 0.5rem;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; flex-shrink: 0;">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>{{ claimMsg() }}</span>
            </div>
          }

          @if (loyaltyLoading()) {
            <div class="loyalty-loading-wrap" style="padding: 4rem 0; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem;">
              <span class="spinner" style="border-top-color: #5c4033; display: inline-block;"></span>
              <p style="margin: 0; color: #6b7280; font-size: 0.875rem;">Đang tải thông tin tích lũy của bạn...</p>
            </div>
          } @else {
            <div class="loyalty-hero" [style.--tier-color]="loyaltyView().tierColor">
              <div>
                <span class="stat-label">Hạng thành viên</span>
                <div class="loyalty-tier-name">{{ loyaltyView().tierLabel }}</div>
                <p>Hạng thẻ được cập nhật dựa trên chi tiêu tích lũy của bạn</p>
              </div>
              <div class="loyalty-stats">
                <div>
                  <span class="stat-label">Doanh thu tháng này</span>
                  <strong>{{ loyaltyView().spendMonth | number:'1.0-0' }}đ</strong>
                </div>
                <div>
                  <span class="stat-label">Doanh thu năm nay</span>
                  <strong>{{ loyaltyView().spendYear | number:'1.0-0' }}đ</strong>
                </div>
              </div>
            </div>

            <div class="track-block">
              <p class="track-hint">Di chuột lên các mốc phần quà bên dưới để xem chi tiết và nhận Voucher ưu đãi.</p>

              <!-- Month Track -->
              <div class="track-section">
                <div class="track-head">
                  <span class="track-title">Hạng thẻ & Chi tiêu theo Tháng</span>
                  <span class="track-spend">
                    {{ loyaltyView().spendMonth | number:'1.0-0' }}đ
                    <span class="muted">/ {{ monthMax | number:'1.0-0' }}đ</span>
                  </span>
                </div>
                <div class="track-bar-outer">
                  <div class="track-bar">
                    <div class="track-fill" [style.width.%]="monthPercent(loyaltyView())"></div>
                    @for (mk of monthMarkers(loyaltyView()); track mk.label) {
                      <div
                        class="track-marker"
                        [class.reached]="mk.reached"
                        [class.current]="loyaltyView().tier === mk.tierId"
                        [class.track-marker--start]="mk.percent === 0"
                        [class.track-marker--end]="mk.percent === 100"
                        [style.left.%]="mk.percent"
                      >
                        <app-loyalty-marker-icon [icon]="mk.iconKey" [color]="mk.color" />
                        <span class="marker-name">{{ mk.label }}</span>

                        <div class="marker-tooltip">
                          <strong style="display: block; font-size: 0.8125rem; margin-bottom: 0.25rem;">{{ mk.label }}</strong>
                          <p class="tt-amount">Yêu cầu: {{ mk.amount | number:'1.0-0' }}đ</p>
                          @if (mk.milestoneId) {
                            <p class="tt-pct">Ưu đãi giảm giá {{ mk.discountPercent }}%</p>
                            <p class="tt-voucher">{{ mk.voucherTitle }}</p>
                            <div style="margin-top: 0.35rem;">
                              <span class="tt-code">Mã: {{ mk.voucherCode }}</span>
                            </div>

                            @if (mk.claimed) {
                              <span class="tt-status done">✓ Đã nhận voucher</span>
                            } @else if (mk.canClaim) {
                              <button
                                type="button"
                                class="tt-claim"
                                [disabled]="claiming()"
                                (click)="claimByMarker(mk)"
                              >
                                {{ claiming() ? 'Đang nhận...' : 'Nhận Voucher' }}
                              </button>
                            } @else {
                              <span class="tt-status lock">🔒 Chưa đạt (Cần thêm {{ markerGap(loyaltyView().spendMonth, mk.amount) | number:'1.0-0' }}đ)</span>
                            }
                          } @else {
                            <p class="tt-amount" style="margin-top:0.25rem; font-size:0.7rem; opacity:0.85;">Mốc khởi đầu</p>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>

              <!-- Year Track -->
              <div class="track-section">
                <div class="track-head">
                  <span class="track-title">Mốc Chi tiêu theo Năm</span>
                  <span class="track-spend">
                    {{ loyaltyView().spendYear | number:'1.0-0' }}đ
                    <span class="muted">/ {{ yearMax | number:'1.0-0' }}đ</span>
                  </span>
                </div>
                <div class="track-bar-outer">
                  <div class="track-bar">
                    <div class="track-fill track-fill--year" [style.width.%]="yearPercent(loyaltyView())"></div>
                    @for (mk of yearMarkers(loyaltyView()); track mk.label) {
                      <div
                        class="track-marker"
                        [class.reached]="mk.reached"
                        [class.current]="loyaltyView().tier === mk.tierId"
                        [class.track-marker--start]="mk.percent === 0"
                        [class.track-marker--end]="mk.percent === 100"
                        [style.left.%]="mk.percent"
                      >
                        <app-loyalty-marker-icon [icon]="mk.iconKey" [color]="mk.color" />
                        <span class="marker-name">{{ mk.label }}</span>

                        <div class="marker-tooltip">
                          <strong style="display: block; font-size: 0.8125rem; margin-bottom: 0.25rem;">{{ mk.label }}</strong>
                          <p class="tt-amount">Yêu cầu: {{ mk.amount | number:'1.0-0' }}đ</p>
                          @if (mk.milestoneId) {
                            <p class="tt-pct">Ưu đãi giảm giá {{ mk.discountPercent }}%</p>
                            <p class="tt-voucher">{{ mk.voucherTitle }}</p>
                            <div style="margin-top: 0.35rem;">
                              <span class="tt-code">Mã: {{ mk.voucherCode }}</span>
                            </div>

                            @if (mk.claimed) {
                              <span class="tt-status done">✓ Đã nhận voucher</span>
                            } @else if (mk.canClaim) {
                              <button
                                type="button"
                                class="tt-claim"
                                [disabled]="claiming()"
                                (click)="claimByMarker(mk)"
                              >
                                {{ claiming() ? 'Đang nhận...' : 'Nhận Voucher' }}
                              </button>
                            } @else {
                              <span class="tt-status lock">🔒 Chưa đạt (Cần thêm {{ markerGap(loyaltyView().spendYear, mk.amount) | number:'1.0-0' }}đ)</span>
                            }
                          } @else {
                            <p class="tt-amount" style="margin-top:0.25rem; font-size:0.7rem; opacity:0.85;">Mốc khởi đầu</p>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>

            </div>
          }
        }

        @if (panel() === 'security') {
          <h2>Bảo mật tài khoản</h2>
          @if (pwdMsg()) {
            <div class="store-alert-success">{{ pwdMsg() }}</div>
          }
          @if (pwdErr()) {
            <div class="store-alert-error">{{ pwdErr() }}</div>
          }

          <form [formGroup]="pwdForm" (ngSubmit)="changePassword()" class="profile-form">
            <div class="store-field">
              <label>Mật khẩu hiện tại</label>
              <input type="password" formControlName="currentPassword" autocomplete="current-password" />
            </div>
            <div class="store-field">
              <label>Mật khẩu mới</label>
              <input type="password" formControlName="newPassword" autocomplete="new-password" />
            </div>
            <div class="store-field">
              <label>Nhập lại mật khẩu mới</label>
              <input type="password" formControlName="confirmPassword" autocomplete="new-password" />
            </div>
            <button type="submit" class="store-btn store-btn-primary" [disabled]="savingPwd()">Đổi mật khẩu</button>
          </form>

          <hr class="divider" />
          <h3 class="section-title">Quên mật khẩu</h3>
          <p class="hint">
            Nhập email hoặc số điện thoại đã đăng ký. Hệ thống gửi <strong>mật khẩu khôi phục</strong> tới email của
            tài khoản.
          </p>
          <form [formGroup]="forgotForm" (ngSubmit)="submitForgot()" class="forgot-panel">
            <div class="form-row">
              <div class="store-field">
                <label>Email đăng ký</label>
                <input type="email" formControlName="email" placeholder="email@example.com" />
              </div>
              <div class="store-field">
                <label>Số điện thoại (nếu có)</label>
                <input type="tel" formControlName="phone" placeholder="09xxxxxxxx" />
              </div>
            </div>
            <button type="submit" class="store-btn store-btn-primary" [disabled]="forgotLoading()">
              {{ forgotLoading() ? 'Đang gửi...' : 'Gửi mật khẩu khôi phục' }}
            </button>
          </form>
          @if (forgotMsg()) {
            <p class="forgot-msg" [class.forgot-msg--hint]="forgotDevHint()">{{ forgotMsg() }}</p>
          }
          @if (forgotDevHint()) {
            <p class="forgot-dev">{{ forgotDevHint() }}</p>
          }
        }
      </div>
    </div>
  `,
  styles: [
    `
      .account-grid {
        display: grid;
        grid-template-columns: 260px minmax(0, 1fr);
        gap: 1.5rem;
        align-items: stretch;
        width: 100%;
      }

      .account-nav,
      .account-panel {
        display: flex;
        flex-direction: column;
        min-height: 100%;
      }

      .account-nav {
        padding: 1.25rem;
      }

      .account-nav-inner {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 100%;
      }

      .profile-summary {
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;
        margin-bottom: 1.25rem;
        padding-bottom: 1.25rem;
        border-bottom: 1px solid #f0f2f5;
      }

      .avatar,
      .avatar-img {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .avatar {
        background: linear-gradient(145deg, #8b6914, #5c4033);
        color: #fff;
        font-weight: 700;
        display: grid;
        place-items: center;
      }

      .avatar-img {
        object-fit: cover;
      }

      .profile-summary div {
        min-width: 0;
      }

      .profile-summary strong {
        display: block;
        font-size: 0.9375rem;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }

      .email-line {
        display: block;
        font-size: 0.7rem;
        color: #9ca3af;
        margin-top: 0.15rem;
        word-break: break-all;
      }

      .tier-pill {
        display: inline-block;
        margin-top: 0.25rem;
        padding: 0.1rem 0.45rem;
        border-radius: 999px;
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
      }

      .tier-bronze {
        background: #fef3c7;
        color: #92400e;
      }
      .tier-silver {
        background: #f3f4f6;
        color: #374151;
      }
      .tier-gold {
        background: #fef9c3;
        color: #a16207;
      }
      .tier-diamond {
        background: #dbeafe;
        color: #1d4ed8;
      }
      .tier-vip {
        background: #ede9fe;
        color: #6d28d9;
      }
      .tier-partner {
        background: #ccfbf1;
        color: #0f766e;
      }
      .tier-super {
        background: #fee2e2;
        color: #b91c1c;
      }

      .account-menu {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        flex: 1;
        margin-top: 0.5rem;
      }

      .menu-item {
        display: flex;
        align-items: center;
        width: 100%;
        padding: 0.75rem 1rem;
        border: none;
        border-radius: 10px;
        font-size: 0.9rem;
        font-weight: 500;
        color: #5c524a;
        text-decoration: none;
        text-align: left;
        background: transparent;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .menu-item:hover {
        background: rgba(140, 98, 57, 0.05);
        color: #8c6239;
        transform: translateX(4px);
      }

      .menu-item.active {
        background: #fcf8f5;
        color: #8c6239;
        font-weight: 700;
        border-left: 3px solid #8c6239;
        border-radius: 0 10px 10px 0;
        padding-left: calc(1rem - 3px);
      }

      .logout-btn {
        margin-top: 2rem;
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ebdcd0;
        border-radius: 10px;
        background: #ffffff;
        font-size: 0.875rem;
        font-weight: 700;
        color: #8c8175;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .logout-btn:hover {
        background: #fdfaf6;
        color: #dc2626;
        border-color: #fca5a5;
      }

      .account-panel {
        padding: 2rem 2.25rem;
        background: #ffffff;
        border: 1px solid #ebdcd0;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(62, 42, 30, 0.04);
        min-width: 0;
        overflow: visible;
      }

      .account-panel--wide {
        padding: 1.75rem 2rem 2rem;
      }

      .account-panel h2 {
        margin: 0 0 1.25rem;
        font-size: 1.125rem;
      }

      .section-title {
        margin: 1.5rem 0 0.75rem;
        font-size: 0.9375rem;
        font-weight: 700;
      }

      .loyalty-hero {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 1.5rem;
        padding: 1.75rem 2rem;
        border-radius: 16px;
        background: linear-gradient(135deg, var(--tier-color, #5c4033) 0%, #2b1d14 100%);
        color: #fff;
        box-shadow: 0 12px 28px rgba(43, 29, 20, 0.15);
        position: relative;
        overflow: hidden;
      }

      .loyalty-hero::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 100% 0%, rgba(255, 255, 255, 0.15) 0%, transparent 60%);
        pointer-events: none;
      }

      .loyalty-tier-name {
        font-size: 1.75rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
      }

      .loyalty-hero p {
        margin: 0.35rem 0 0;
        font-size: 0.8125rem;
        opacity: 0.85;
      }

      .loyalty-stats {
        display: flex;
        gap: 2rem;
      }

      .stat-label {
        display: block;
        font-size: 0.75rem;
        opacity: 0.8;
        margin-bottom: 0.25rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .track-block {
        margin-top: 1.5rem;
      }

      .track-hint {
        margin: 0 0 1.5rem;
        font-size: 0.8125rem;
        color: #8c8175;
      }

      .track-section + .track-section {
        margin-top: 2rem;
      }

      .track-head {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: baseline;
        gap: 0.35rem;
        margin-bottom: 0.65rem;
      }

      .track-title {
        font-size: 0.9375rem;
        font-weight: 700;
        color: #3e2a1e;
      }

      .track-spend {
        font-size: 0.875rem;
        font-weight: 700;
        color: #8c6239;
      }

      .track-spend .muted {
        color: #a89a8e;
        font-weight: 400;
        margin-left: 0.25rem;
      }

      .track-bar-outer {
        padding: 3.25rem 1.25rem 3rem;
        margin: 0 0.25rem;
        overflow: visible;
      }

      .track-bar {
        position: relative;
        height: 8px;
        background: #e2d7cd;
        border-radius: 999px;
        margin: 0 1rem;
      }

      .track-fill {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        background: linear-gradient(90deg, #ca8a04, #8c6239);
        border-radius: 999px;
        transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
      }

      .track-fill--year {
        background: linear-gradient(90deg, #ca8a04, #a16207);
      }

      .track-marker {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 2;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: default;
      }

      .track-marker--start {
        transform: translate(0, -50%);
      }

      .track-marker--end {
        transform: translate(-100%, -50%);
      }

      .track-marker.reached ::ng-deep .loyalty-marker-icon {
        box-shadow: 0 0 0 3px rgba(4, 120, 87, 0.28);
      }

      .track-marker.current ::ng-deep .loyalty-marker-icon {
        box-shadow: 0 0 0 3px rgba(92, 64, 51, 0.35);
        transform: scale(1.08);
      }

      .marker-name {
        position: absolute;
        top: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
        max-width: 5.5rem;
        font-size: 0.625rem;
        font-weight: 700;
        color: #6b7280;
        white-space: normal;
        text-align: center;
        line-height: 1.2;
        letter-spacing: 0.01em;
      }

      .track-marker--start .marker-name {
        left: 0;
        transform: none;
        text-align: left;
      }

      .track-marker--end .marker-name {
        left: auto;
        right: 0;
        transform: none;
        text-align: right;
      }

      .track-marker.current .marker-name {
        color: #5c4033;
      }

      .marker-tooltip {
        position: absolute;
        bottom: calc(100% + 10px);
        left: 50%;
        transform: translateX(-50%) translateY(4px);
        min-width: 200px;
        max-width: 260px;
        padding: 0.65rem 0.75rem;
        background: #1a1d21;
        color: #f9fafb;
        border-radius: 8px;
        font-size: 0.75rem;
        line-height: 1.4;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity 0.15s, transform 0.15s, visibility 0.15s;
        z-index: 10;
      }

      .marker-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -6px;
        border: 6px solid transparent;
        border-top-color: #1a1d21;
      }

      .track-marker:hover .marker-tooltip,
      .track-marker:focus-within .marker-tooltip {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(0);
        pointer-events: auto;
      }

      .track-marker:hover ::ng-deep .loyalty-marker-icon,
      .track-marker:focus-within ::ng-deep .loyalty-marker-icon {
        transform: scale(1.1);
      }

      .tt-amount {
        margin: 0.25rem 0 0;
        color: #d1d5db;
      }

      .tt-pct {
        margin: 0.35rem 0 0;
        font-size: 0.8125rem;
        font-weight: 800;
        color: #fde68a;
      }

      .tt-voucher {
        margin: 0.2rem 0 0;
        color: #fef3c7;
      }

      .tt-code {
        display: inline-block;
        margin-top: 0.35rem;
        padding: 0.15rem 0.4rem;
        background: #374151;
        border-radius: 4px;
        font-size: 0.7rem;
      }

      .tt-status {
        display: block;
        margin-top: 0.5rem;
        font-size: 0.7rem;
      }

      .tt-status.done {
        color: #6ee7b7;
      }

      .tt-status.lock {
        color: #fcd34d;
      }

      .tt-claim {
        display: block;
        width: 100%;
        margin-top: 0.5rem;
        padding: 0.4rem 0.5rem;
        border: none;
        border-radius: 4px;
        background: #5c4033;
        color: #fff;
        font-size: 0.7rem;
        font-weight: 700;
        cursor: pointer;
      }

      .tt-claim:hover:not(:disabled) {
        background: #4a3329;
      }

      .tt-claim:disabled {
        opacity: 0.6;
      }

      .avatar-edit {
        display: flex;
        gap: 1rem;
        align-items: center;
        margin-bottom: 1.25rem;
      }

      .avatar-lg {
        width: 80px;
        height: 80px;
        font-size: 1.5rem;
      }

      .avatar-btn {
        cursor: pointer;
      }

      .avatar-container {
        position: relative;
        cursor: pointer;
        border-radius: 50%;
        overflow: hidden;
        width: 80px;
        height: 80px;
        flex-shrink: 0;
      }

      .avatar-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
      }

      .avatar-container:hover .avatar-overlay {
        opacity: 1;
      }

      .avatar-overlay svg {
        width: 24px;
        height: 24px;
      }

      .avatar-picker-panel {
        background: #fdfcfb;
        padding: 1.25rem;
        border-radius: 8px;
        border: 1px dashed #e4e7ec;
        margin-bottom: 1.5rem;
      }

      .avatar-picker-panel h4 {
        margin: 0 0 0.85rem;
        font-size: 0.8125rem;
        font-weight: 600;
        color: #4b5563;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .avatar-options-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
      }

      .avatar-option-btn {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 2px solid transparent;
        padding: 0;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        background: #f3f4f6;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .avatar-option-btn img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .avatar-option-btn:hover {
        transform: scale(1.05);
        border-color: #d1d5db;
      }

      .avatar-option-btn.active {
        border-color: #5c4033;
        box-shadow: 0 0 0 2px rgba(92, 64, 51, 0.2);
      }

      .avatar-upload-btn {
        border: 2px dashed #d1d5db;
        color: #9ca3af;
        font-size: 1.5rem;
        font-weight: 300;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
      }

      .avatar-upload-btn:hover {
        border-color: #5c4033;
        color: #5c4033;
        background: rgba(92, 64, 51, 0.04);
      }

      .plus-icon {
        line-height: 1;
        margin-top: -2px;
      }

      .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0 1rem;
      }

      .flex-2 {
        grid-column: span 2;
      }

      .profile-form em {
        color: #dc2626;
        font-style: normal;
      }

      .store-alert-success {
        padding: 0.65rem 0.85rem;
        margin-bottom: 1rem;
        background: #ecfdf5;
        color: #047857;
        border-radius: 6px;
        font-size: 0.8125rem;
      }

      .hint {
        font-size: 0.8125rem;
        color: #9ca3af;
        margin: 0 0 0.75rem;
      }

      .divider {
        margin: 1.5rem 0;
        border: none;
        border-top: 1px solid #f0f2f5;
      }

      .forgot-panel {
        max-width: 520px;
      }

      .forgot-panel .store-field {
        margin-bottom: 0.75rem;
      }

      .forgot-msg {
        margin-top: 0.75rem;
        font-size: 0.8125rem;
        color: #047857;
      }

      .forgot-msg--hint {
        color: #b45309;
      }

      .forgot-dev {
        margin-top: 0.35rem;
        font-size: 0.75rem;
        color: #6b7280;
      }

      .max-tier {
        margin: 1rem 0 0;
        padding: 0.75rem;
        background: #f0fdf4;
        color: #047857;
        border-radius: 6px;
        font-size: 0.8125rem;
      }

      @media (max-width: 768px) {
        .account-grid {
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }

        .account-nav {
          padding: 1rem;
        }

        .profile-summary {
          margin-bottom: 0.75rem;
          padding-bottom: 0.75rem;
          align-items: center;
        }

        .account-menu {
          display: flex;
          flex-direction: row;
          overflow-x: auto;
          gap: 0.5rem;
          padding: 0.25rem 0.25rem 0.75rem;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          border-bottom: 1px solid #f0f2f5;
          margin-top: 0.25rem;
        }

        .account-menu::-webkit-scrollbar {
          display: none;
        }

        .menu-item {
          white-space: nowrap;
          padding: 0.45rem 1rem !important;
          border-radius: 20px !important;
          border: 1.5px solid #ebdcd0 !important;
          background: #fdfdfd;
          font-size: 0.8125rem;
          text-align: center;
          width: auto;
          flex-shrink: 0;
          border-left: 1.5px solid #ebdcd0 !important;
        }

        .menu-item.active {
          background: #8c6239 !important;
          color: #fff !important;
          border-color: #8c6239 !important;
          padding-left: 1rem !important;
        }

        .menu-item:hover {
          transform: none;
        }

        .logout-btn {
          margin-top: 0.75rem;
          width: auto;
          align-self: flex-end;
          padding: 0.4rem 1.25rem;
          font-size: 0.8125rem;
        }

        .account-panel {
          padding: 1.25rem 1rem;
        }

        .form-row {
          grid-template-columns: 1fr !important;
          gap: 0.75rem;
        }

        .flex-2 {
          grid-column: span 1;
        }
      }

      /* Lucky Wheel CSS Styles */
      .lucky-wheel-panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        padding: 1rem 0;
      }

      .wheel-intro {
        text-align: center;
        max-width: 500px;
      }

      .user-points-badge {
        display: inline-block;
        margin-top: 0.5rem;
        padding: 0.5rem 1.25rem;
        border-radius: 999px;
        background: #fcf8f5;
        border: 1px solid #ebdcd0;
        color: #5c4033;
        font-weight: 700;
        font-size: 0.9375rem;
      }

      .user-points-badge span {
        color: #8c7161;
      }

      .wheel-wrapper {
        position: relative;
        width: 360px;
        height: 360px;
        margin: 1.5rem auto;
      }

      .wheel-pointer {
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        width: 24px;
        height: 32px;
        background: #dc2626;
        clip-path: polygon(50% 100%, 0 0, 100% 0);
        z-index: 10;
        filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15));
      }

      .wheel-outer {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 8px solid #5c4033;
        box-shadow: 0 10px 30px rgba(92, 64, 51, 0.2), inset 0 0 15px rgba(0,0,0,0.1);
        overflow: hidden;
        position: relative;
        transition: transform 3s cubic-bezier(0.1, 0.8, 0.1, 1);
      }

      .wheel-canvas {
        width: 100%;
        height: 100%;
        position: relative;
      }

      .wheel-sector {
        position: absolute;
        width: 50%;
        height: 50%;
        left: 50%;
        top: 50%;
        transform-origin: 0% 0%;
        transform: rotate(calc(var(--i) * 60deg)) skewY(30deg);
        background: var(--bg);
        overflow: hidden;
      }

      .wheel-sector span {
        position: absolute;
        width: 130px;
        height: 60px;
        left: 25px;
        top: 15px;
        transform: skewY(-30deg) rotate(30deg);
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-size: 11px;
        font-weight: 800;
        color: var(--color, #fff);
        text-transform: uppercase;
        letter-spacing: 0.03em;
        line-height: 1.25;
      }

      .spin-trigger {
        position: absolute;
        width: 54px;
        height: 54px;
        background: #ffffff;
        border: 4px solid #5c4033;
        border-radius: 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 5;
        font-weight: 900;
        font-size: 11px;
        color: #5c4033;
        cursor: pointer;
        display: grid;
        place-items: center;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        transition: transform 0.2s;
        user-select: none;
      }

      .spin-trigger:hover:not(:disabled) {
        transform: translate(-50%, -50%) scale(1.08);
      }

      .spin-trigger:disabled {
        opacity: 0.8;
        background: #f3f4f6;
        cursor: not-allowed;
      }

      .wheel-result-alert {
        width: 100%;
        max-width: 480px;
        padding: 1.25rem;
        border-radius: 12px;
        background: #f3f4f6;
        border: 1px solid #ebdcd0;
        text-align: center;
        animation: slideDown 0.3s ease;
      }

      .wheel-result-alert.success {
        background: #fdfbf7;
        border-color: #8c7161;
      }

      .result-title {
        font-weight: 800;
        font-size: 0.9375rem;
        margin-bottom: 0.5rem;
        color: #5c4033;
      }

      .wheel-result-alert.success .result-title {
        color: #8c7161;
      }

      .voucher-code-copy {
        margin-top: 1rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        background: #fff;
        border: 1.5px dashed #8c7161;
        font-size: 0.875rem;
      }

      .voucher-code-copy strong {
        color: #8c7161;
        font-size: 1.05rem;
      }

      .copy-btn {
        padding: 0.25rem 0.65rem;
        border: none;
        border-radius: 4px;
        background: #8c7161;
        color: #fff;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }

      .copy-btn:hover {
        background: #705648;
      }
    `
  ]
})
export class StoreAccountDashboardComponent implements OnInit {
  private readonly profileApi = inject(StoreProfileService);
  private readonly storeAuth = inject(StoreAuthService);
  private readonly fb = inject(FormBuilder);

  readonly user = input.required<StoreUser>();
  readonly userChange = output<StoreUser>();
  readonly logout = output<void>();

  readonly monthMax = MONTH_TRACK_MAX;
  readonly yearMax = YEAR_TRACK_MAX;
  readonly panel = signal<Panel>('profile');
  readonly loyaltyView = signal<LoyaltyInfo>(createDefaultLoyalty());
  readonly loyaltyLoading = signal(false);

  // Lucky Wheel states & calculations
  readonly isSpinning = signal(false);
  readonly wheelRotationStyle = signal('rotate(0deg)');
  readonly wheelResultMsg = signal('');
  readonly hasWon = signal(false);
  readonly wonVoucherCode = signal('');
  readonly spentPoints = signal(0);

  userPoints = () => {
    const spend = this.loyaltyView()?.spendYear || 0;
    return Math.floor(spend / 10000) + 120 - this.spentPoints();
  };

  private currentRotation = 0;

  private playTickSound(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  private playWinSound(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, index) => {
        const time = ctx.currentTime + index * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.4);
      });
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  private playLoseSound(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.45);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  spinWheel(): void {
    if (this.isSpinning() || this.userPoints() < 20) return;

    this.isSpinning.set(true);
    this.wheelResultMsg.set('');
    this.hasWon.set(false);
    this.wonVoucherCode.set('');

    this.spentPoints.update((p) => p + 20);

    // Play synthesized wheel ticking sounds
    let tickDelay = 50;
    const playTicks = () => {
      if (!this.isSpinning()) return;
      this.playTickSound();
      tickDelay += 16;
      if (tickDelay < 420) {
        setTimeout(playTicks, tickDelay);
      }
    };
    setTimeout(playTicks, 50);

    const prizes = [
      { name: 'Voucher 50.000đ', code: 'MOCHOME50K', won: true, minDeg: 0, maxDeg: 60 },
      { name: 'Mã miễn phí vận chuyển', code: 'FREESHIPMOCHOME', won: true, minDeg: 60, maxDeg: 120 },
      { name: 'Voucher giảm giá 10%', code: 'MOCHOMELOYAL10', won: true, minDeg: 120, maxDeg: 180 },
      { name: 'Chúc bạn may mắn lần sau', code: '', won: false, minDeg: 180, maxDeg: 240 },
      { name: 'Voucher 100.000đ', code: 'MOCHOME100K', won: true, minDeg: 240, maxDeg: 300 },
      { name: 'Voucher 200.000đ', code: 'MOCHOME200K', won: true, minDeg: 300, maxDeg: 360 }
    ];

    const rand = Math.random() * 100;
    let selectedIndex = 3;
    if (rand < 2) selectedIndex = 5;
    else if (rand < 10) selectedIndex = 4;
    else if (rand < 25) selectedIndex = 2;
    else if (rand < 45) selectedIndex = 0;
    else if (rand < 70) selectedIndex = 1;

    const selectedPrize = prizes[selectedIndex];
    const avgSectorAngle = (selectedPrize.minDeg + selectedPrize.maxDeg) / 2;
    const targetSliceRotation = 360 - avgSectorAngle;

    const extraRotations = 1800;
    this.currentRotation += extraRotations + (targetSliceRotation - (this.currentRotation % 360));

    this.wheelRotationStyle.set(`rotate(${this.currentRotation}deg)`);

    setTimeout(() => {
      this.isSpinning.set(false);
      this.hasWon.set(selectedPrize.won);
      this.wonVoucherCode.set(selectedPrize.code);

      if (selectedPrize.won) {
        this.playWinSound();
        this.wheelResultMsg.set(`Bạn đã trúng ${selectedPrize.name}! Nhận mã giảm giá độc quyền dành riêng cho bạn ở bên dưới.`);
      } else {
        this.playLoseSound();
        this.wheelResultMsg.set('Hãy thử lại lần sau nhé, rất nhiều phần quà đang đợi bạn!');
      }
    }, 3200);
  }

  copyVoucher(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.wonVoucherCode());
    }
  }
  readonly loyaltyError = signal('');
  readonly savingProfile = signal(false);
  readonly savingPwd = signal(false);
  readonly claiming = signal(false);
  readonly profileMsg = signal('');
  readonly profileErr = signal('');
  readonly pwdMsg = signal('');
  readonly pwdErr = signal('');
  readonly claimMsg = signal('');
  readonly forgotMsg = signal('');
  readonly forgotDevHint = signal('');
  readonly forgotLoading = signal(false);
  readonly showAvatarPicker = signal(false);
  readonly sampleAvatars = [
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQy9opUH_ckOjcS5dhsUWrCGcqFxKcZQCTblidTImHHYg&s=10',
    'https://images2.thanhnien.vn/thumb_w/686/528068263637045248/2026/6/3/18h-1779976634076924307678-377-1118-1185-1724-crop-1780466151086903252230.jpg',
    'https://media.vneconomy.vn/images/upload/2022/12/19/221208164147-argentina-lionel-messi.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRe8c4LA6_mdodv7GoSSJwlSk0CWWyj_QQBST0RHpOGqw&s=10',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUV4pC0wyj8nseU_weWJwregL_i6lvLmwC15AgTsuUpQ&s=10'
  ];

  profileForm = this.fb.group({
    fullName: ['', Validators.required],
    phone: [''],
    dateOfBirth: [''],
    gender: [''],
    address: this.fb.group({
      province: [''],
      district: [''],
      ward: [''],
      street: [''],
      zip: ['']
    })
  });

  pwdForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });

  forgotForm = this.fb.group(
    {
      email: ['', Validators.email],
      phone: ['']
    },
    {
      validators: (group) => {
        const email = String(group.get('email')?.value || '').trim();
        const phone = String(group.get('phone')?.value || '').replace(/\D/g, '');
        return email || phone ? null : { contactRequired: true };
      }
    }
  );

  ngOnInit(): void {
    this.patchProfileForm(this.user());
    this.forgotForm.patchValue({ email: this.user().email });
    if (this.user().loyalty) {
      this.loyaltyView.set(this.user().loyalty!);
    }
    this.loadLoyalty();
  }

  loadLoyalty(): void {
    this.loyaltyLoading.set(true);
    this.loyaltyError.set('');
    this.profileApi.fetchLoyalty().subscribe({
      next: (res) => {
        this.loyaltyLoading.set(false);
        this.loyaltyError.set('');
        this.loyaltyView.set(res.loyalty);
        this.syncLoyaltyToUser(res.loyalty);
      },
      error: (err) => {
        this.loyaltyLoading.set(false);
        if (this.user().loyalty) {
          this.loyaltyView.set(this.user().loyalty!);
          this.loyaltyError.set('');
          return;
        }
        if (err instanceof HttpErrorResponse && err.status === 0) {
          this.loyaltyError.set('Không kết nối backend. Chạy: cd backend && npm start');
        } else if (err instanceof HttpErrorResponse && err.status === 404) {
          this.loyaltyError.set('Backend chưa có API tích lũy — tắt tiến trình cũ port 5000 rồi npm start lại.');
        } else {
          this.loyaltyError.set(this.errMsg(err, 'Chưa tải được số liệu — đang dùng mốc tham khảo (0đ).'));
        }
      }
    });
  }

  private syncLoyaltyToUser(loyalty: LoyaltyInfo): void {
    const u = { ...this.user(), loyalty };
    this.storeAuth.persistUser(u);
    this.userChange.emit(u);
  }

  setPanel(p: Panel): void {
    this.panel.set(p);
  }

  tierClass(tier?: LoyaltyTierId | string): string {
    return (tier && TIER_BADGE[tier]) || 'tier-bronze';
  }

  monthMarkers(L: LoyaltyInfo) {
    return monthTrackMarkers(L);
  }

  yearMarkers(L: LoyaltyInfo) {
    return yearTrackMarkers(L);
  }

  monthPercent(L: LoyaltyInfo): number {
    return spendPercent(L.spendMonth, MONTH_TRACK_MAX);
  }

  yearPercent(L: LoyaltyInfo): number {
    return spendPercent(L.spendYear, YEAR_TRACK_MAX);
  }

  markerGap(spend: number, amount: number): number {
    return Math.max(0, amount - spend);
  }

  claimByMarker(mk: LoyaltyTrackMarker): void {
    if (!mk.milestoneId || !mk.canClaim) return;
    const m = this.loyaltyView().milestones.find((x) => x.id === mk.milestoneId);
    if (m) this.claim(m);
  }

  claim(m: LoyaltyMilestone): void {
    this.claiming.set(true);
    this.claimMsg.set('');
    this.profileApi.claimMilestone(m.id).subscribe({
      next: (res) => {
        this.claiming.set(false);
        this.claimMsg.set(res.message);
        this.loyaltyView.set(res.user.loyalty || this.loyaltyView());
        this.emitUser(res.user);
      },
      error: (err) => {
        this.claiming.set(false);
        this.claimMsg.set(this.errMsg(err, 'Không nhận được voucher.'));
      }
    });
  }

  selectSampleAvatar(url: string): void {
    this.profileErr.set('');
    this.profileMsg.set('');
    this.profileApi.updateAvatar(url).subscribe({
      next: (res) => {
        this.profileMsg.set(res.message);
        this.emitUser(res.user);
      },
      error: (err) => this.profileErr.set(this.errMsg(err, 'Không cập nhật được ảnh.'))
    });
  }

  onAvatarPick(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      this.profileErr.set('Ảnh tối đa 500KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      this.profileApi.updateAvatar(dataUrl).subscribe({
        next: (res) => {
          this.profileMsg.set(res.message);
          this.emitUser(res.user);
        },
        error: (err) => this.profileErr.set(this.errMsg(err, 'Không cập nhật được ảnh.'))
      });
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  saveProfile(): void {
    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid) {
      this.profileErr.set('Vui lòng kiểm tra họ tên.');
      return;
    }
    const v = this.profileForm.getRawValue();
    this.savingProfile.set(true);
    this.profileErr.set('');
    this.profileMsg.set('');
    this.profileApi
      .updateProfile({
        fullName: v.fullName!,
        phone: v.phone || '',
        dateOfBirth: v.dateOfBirth || '',
        gender: v.gender || '',
        address: v.address as StoreUser['address']
      })
      .subscribe({
        next: (res) => {
          this.savingProfile.set(false);
          this.profileMsg.set(res.message);
          this.emitUser(res.user);
        },
        error: (err) => {
          this.savingProfile.set(false);
          this.profileErr.set(this.errMsg(err, 'Lưu thất bại.'));
        }
      });
  }

  changePassword(): void {
    this.pwdForm.markAllAsTouched();
    const v = this.pwdForm.getRawValue();
    if (v.newPassword !== v.confirmPassword) {
      this.pwdErr.set('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (this.pwdForm.invalid) {
      this.pwdErr.set('Vui lòng điền đủ thông tin.');
      return;
    }
    this.savingPwd.set(true);
    this.pwdErr.set('');
    this.pwdMsg.set('');
    this.profileApi.changePassword(v.currentPassword!, v.newPassword!).subscribe({
      next: (res) => {
        this.savingPwd.set(false);
        this.pwdMsg.set(res.message);
        this.pwdForm.reset();
      },
      error: (err) => {
        this.savingPwd.set(false);
        this.pwdErr.set(this.errMsg(err, 'Đổi mật khẩu thất bại.'));
      }
    });
  }

  submitForgot(): void {
    this.forgotForm.markAllAsTouched();
    if (this.forgotForm.hasError('contactRequired')) {
      this.forgotMsg.set('Vui lòng nhập email hoặc số điện thoại.');
      return;
    }
    if (this.forgotForm.invalid) return;
    const { email, phone } = this.forgotForm.getRawValue();
    this.forgotLoading.set(true);
    this.forgotMsg.set('');
    this.forgotDevHint.set('');
    this.profileApi
      .forgotPassword({
        email: String(email || '').trim() || undefined,
        phone: String(phone || '').trim() || undefined
      })
      .subscribe({
        next: (res) => {
          this.forgotLoading.set(false);
          this.forgotMsg.set(res.message);
          this.forgotDevHint.set(res.devHint || '');
        },
        error: (err) => {
          this.forgotLoading.set(false);
          this.forgotMsg.set(this.errMsg(err, 'Không gửi được yêu cầu.'));
        }
      });
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  private patchProfileForm(u: StoreUser): void {
    this.profileForm.patchValue({
      fullName: u.fullName,
      phone: u.phone || '',
      dateOfBirth: u.dateOfBirth || '',
      gender: u.gender || '',
      address: {
        province: u.address?.province || '',
        district: u.address?.district || '',
        ward: u.address?.ward || '',
        street: u.address?.street || '',
        zip: u.address?.zip || ''
      }
    });
  }

  private emitUser(u: StoreUser): void {
    this.storeAuth.persistUser(u);
    this.userChange.emit(u);
    this.patchProfileForm(u);
  }

  private errMsg(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message || fallback;
    }
    return fallback;
  }
}
