import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, signal, viewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChatMessage, ChatService } from '../../core/services/chat.service';

const WELCOME: ChatMessage = {
  role: 'assistant',
  content:
    'Xin chào! Mình là **trợ lý AI Mộc Home** 🌿\n\nMình có thể gợi ý nội thất, báo giá tham khảo, giao hàng và chính sách đổi trả. Bạn cần tư vấn gì?',
  time: new Date().toISOString()
};

const QUICK_START = ['Sofa phòng khách', 'Chính sách giao hàng', 'Sản phẩm bán chạy', 'Liên hệ cửa hàng'];

@Component({
  selector: 'app-store-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chatbot-root">
      @if (open()) {
        <div
          class="chat-panel"
          role="dialog"
          aria-labelledby="chatbot-title"
          aria-modal="true"
        >
          <header class="chat-header">
            <div class="chat-header-info">
              <span class="chat-avatar" aria-hidden="true">AI</span>
              <div>
                <h2 id="chatbot-title">Trợ lý Mộc Home</h2>
                <span class="chat-status">
                  <em class="dot-live"></em>
                  Sẵn sàng tư vấn
                </span>
              </div>
            </div>
            <button type="button" class="chat-close" (click)="toggleClose()" aria-label="Đóng chat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </header>

          <div class="chat-messages" #messagesEl (click)="onMessageClick($event)">
            @for (msg of messages(); track $index) {
              <div class="msg-row" [class.msg-row--user]="msg.role === 'user'">
                @if (msg.role === 'assistant') {
                  <span class="msg-avatar" aria-hidden="true">AI</span>
                }
                <div class="msg-bubble" [class.msg-bubble--user]="msg.role === 'user'">
                  <div class="msg-text" [innerHTML]="formatContent(msg.content)"></div>
                </div>
              </div>
            }
            @if (loading()) {
              <div class="msg-row">
                <span class="msg-avatar" aria-hidden="true">AI</span>
                <div class="msg-bubble msg-bubble--typing">
                  <span class="typing"><i></i><i></i><i></i></span>
                </div>
              </div>
            }
          </div>

          @if (suggestions().length && !loading()) {
            <div class="chat-chips">
              @for (chip of suggestions(); track chip) {
                <button type="button" class="chip" (click)="send(chip)">{{ chip }}</button>
              }
            </div>
          }

          <form class="chat-input" (submit)="onSubmit($event)">
            <input
              type="text"
              [(ngModel)]="inputText"
              name="chatInput"
              placeholder="Nhập câu hỏi..."
              autocomplete="off"
              [disabled]="loading()"
            />
            <button type="submit" [disabled]="loading() || !inputText.trim()" aria-label="Gửi">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </div>
      }

      <button
        type="button"
        class="chat-fab"
        [class.chat-fab--open]="open()"
        (click)="toggle()"
        (mousedown)="onMouseDown($event)"
        (touchstart)="onTouchStart($event)"
        [attr.aria-expanded]="open()"
        aria-label="Mở trợ lý AI Mộc Home"
      >
        @if (open()) {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        } @else {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        }
      </button>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        position: fixed;
        z-index: 99999;
        right: 1.25rem;
        bottom: 1.25rem;
        pointer-events: none;
        touch-action: none;
      }

      .chatbot-root {
        position: relative;
        pointer-events: auto;
        font-family: inherit;
      }

      .chat-fab {
        position: relative;
        width: 60px;
        height: 60px;
        border: none;
        border-radius: 50%;
        background: linear-gradient(145deg, #6b5344, #5c4033);
        color: #fff;
        cursor: grab;
        box-shadow: 0 4px 20px rgba(92, 64, 51, 0.45);
        display: grid;
        place-items: center;
        transition: transform 0.2s, box-shadow 0.2s;
        animation: fab-pulse 2.5s ease-in-out infinite;
        user-select: none;
      }

      .chat-fab:active {
        cursor: grabbing;
      }

      @keyframes fab-pulse {
        0%,
        100% {
          box-shadow: 0 4px 20px rgba(92, 64, 51, 0.45);
        }
        50% {
          box-shadow: 0 4px 28px rgba(92, 64, 51, 0.65), 0 0 0 8px rgba(92, 64, 51, 0.12);
        }
      }

      .chat-fab:hover {
        transform: scale(1.06);
        box-shadow: 0 6px 24px rgba(92, 64, 51, 0.55);
        animation: none;
      }

      .chat-fab--open {
        background: #1a1d21;
      }

      .chat-fab svg {
        width: 26px;
        height: 26px;
      }

      .chat-panel {
        position: absolute;
        right: 0;
        bottom: calc(60px + 0.75rem);
        width: min(380px, calc(100vw - 2rem));
        height: min(520px, calc(100vh - 8rem));
        max-height: 520px;
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 12px 48px rgba(16, 24, 40, 0.18);
        border: 1px solid #e5e7eb;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: chat-in 0.25s ease;
      }

      @keyframes chat-in {
        from {
          opacity: 0;
          transform: translateY(12px) scale(0.96);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .chat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.85rem 1rem;
        background: linear-gradient(135deg, #5c4033, #4a3329);
        color: #fff;
        flex-shrink: 0;
      }

      .chat-header-info {
        display: flex;
        align-items: center;
        gap: 0.65rem;
      }

      .chat-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        display: grid;
        place-items: center;
        font-size: 0.75rem;
        font-weight: 800;
      }

      .chat-header h2 {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 700;
      }

      .chat-status {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.6875rem;
        opacity: 0.9;
      }

      .dot-live {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #4ade80;
        font-style: normal;
      }

      .chat-close {
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.15);
        color: #fff;
        cursor: pointer;
        display: grid;
        place-items: center;
        transition: background 0.2s;
      }

      .chat-close:hover {
        background: rgba(255, 255, 255, 0.25);
      }

      .chat-close svg {
        width: 18px;
        height: 18px;
      }

      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        background: #fdfdfd;
      }

      .msg-row {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        max-width: 85%;
      }

      .msg-row--user {
        align-self: flex-end;
        max-width: 85%;
        flex-direction: row-reverse;
      }

      .msg-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #ebdcd0;
        color: #5c4033;
        display: grid;
        place-items: center;
        font-size: 0.625rem;
        font-weight: 800;
        flex-shrink: 0;
        border: 1px solid #ebdcd0;
      }

      .msg-bubble {
        padding: 0.65rem 0.85rem;
        border-radius: 14px;
        background: #f1f5f9;
        color: #1f2937;
        font-size: 0.875rem;
        line-height: 1.5;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }

      .msg-bubble--user {
        background: #ebdcd0;
        color: #5c4033;
        border-radius: 14px;
      }

      .msg-text {
        white-space: pre-wrap;
      }

      .msg-text :global(a.chat-link) {
        color: #1877f2;
        text-decoration: underline;
        word-break: break-all;
        font-weight: 500;
      }

      .msg-text :global(a.chat-link:hover) {
        color: #1565c0;
      }

      .msg-text :global(strong) {
        font-weight: 700;
      }

      .typing {
        display: flex;
        gap: 4px;
      }

      .typing i {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #9ca3af;
        animation: bounce 1s infinite;
      }

      .typing i:nth-child(2) {
        animation-delay: 0.15s;
      }

      .typing i:nth-child(3) {
        animation-delay: 0.3s;
      }

      @keyframes bounce {
        0%,
        80%,
        100% {
          transform: translateY(0);
        }
        40% {
          transform: translateY(-4px);
        }
      }

      .chat-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        padding: 0 0.75rem 0.5rem;
        background: #fafafa;
        flex-shrink: 0;
      }

      .chip {
        padding: 0.35rem 0.65rem;
        border: 1px solid #e5e7eb;
        border-radius: 999px;
        background: #fff;
        font-size: 0.6875rem;
        color: #4b5563;
        cursor: pointer;
      }

      .chip:hover {
        border-color: #5c4033;
        color: #5c4033;
      }

      .chat-input {
        display: flex;
        gap: 0.5rem;
        padding: 0.75rem;
        border-top: 1px solid #e5e7eb;
        background: #fff;
        flex-shrink: 0;
      }

      .chat-input input {
        flex: 1;
        border: 1px solid #e5e7eb;
        border-radius: 20px;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        outline: none;
        transition: border-color 0.2s;
      }

      .chat-input input:focus {
        border-color: #5c4033;
      }

      .chat-input button {
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 50%;
        background: #5c4033;
        color: #fff;
        cursor: pointer;
        display: grid;
        place-items: center;
        flex-shrink: 0;
        transition: background 0.2s;
      }

      .chat-input button:hover:not(:disabled) {
        background: #4a3329;
      }

      .chat-input button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      .chat-input button svg {
        width: 18px;
        height: 18px;
      }

      @media (max-width: 768px) {
        :host {
          right: 1rem;
          bottom: 80px; /* Elevated above the mobile bottom tab bar */
        }

        .chat-panel {
          width: min(380px, calc(100vw - 1.5rem));
          height: min(70vh, 480px);
          bottom: calc(60px + 0.5rem);
        }
      }
    `
  ]
})
export class StoreChatbotComponent implements OnDestroy {
  private readonly chat = inject(ChatService);
  private readonly router = inject(Router);
  private readonly hostElement = inject(ElementRef);
  private readonly messagesEl = viewChild<ElementRef<HTMLDivElement>>('messagesEl');

  readonly open = signal(false);
  readonly loading = signal(false);
  readonly messages = signal<ChatMessage[]>([{ ...WELCOME }]);
  readonly suggestions = signal<string[]>([...QUICK_START]);
  inputText = '';

  // Drag-and-drop state properties
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private initialRight = 20;
  private initialBottom = 20;
  private dragThreshold = 5;
  private dragMoved = false;

  ngOnDestroy(): void {
    // Cleanup any global listeners
  }

  // Desktop Mouse Events
  onMouseDown(event: MouseEvent): void {
    if (typeof window === 'undefined') return;
    this.startDrag(event.clientX, event.clientY);

    const onMouseMove = (e: MouseEvent) => this.drag(e.clientX, e.clientY);
    const onMouseUp = () => {
      this.endDrag();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  // Mobile Touch Events
  onTouchStart(event: TouchEvent): void {
    if (typeof window === 'undefined' || event.touches.length === 0) return;
    const touch = event.touches[0];
    this.startDrag(touch.clientX, touch.clientY);

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      this.drag(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => {
      this.endDrag();
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };

    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
  }

  private startDrag(clientX: number, clientY: number): void {
    this.isDragging = true;
    this.dragMoved = false;
    this.startX = clientX;
    this.startY = clientY;

    const host = this.hostElement.nativeElement as HTMLElement;
    const rect = host.getBoundingClientRect();

    this.initialRight = window.innerWidth - rect.right;
    this.initialBottom = window.innerHeight - rect.bottom;
  }

  private drag(clientX: number, clientY: number): void {
    if (!this.isDragging) return;
    const deltaX = clientX - this.startX;
    const deltaY = clientY - this.startY;

    if (Math.abs(deltaX) > this.dragThreshold || Math.abs(deltaY) > this.dragThreshold) {
      this.dragMoved = true;
    }

    const host = this.hostElement.nativeElement as HTMLElement;

    let newRight = this.initialRight - deltaX;
    let newBottom = this.initialBottom - deltaY;

    // Keep constraints
    newRight = Math.max(10, Math.min(window.innerWidth - 70, newRight));
    newBottom = Math.max(10, Math.min(window.innerHeight - 70, newBottom));

    host.style.right = `${newRight}px`;
    host.style.bottom = `${newBottom}px`;
  }

  private endDrag(): void {
    this.isDragging = false;
  }

  toggle(): void {
    // If the button was dragged, ignore click event
    if (this.dragMoved) {
      this.dragMoved = false;
      return;
    }
    this.open.update((v) => !v);
    if (this.open()) {
      setTimeout(() => this.scrollBottom(), 100);
    }
  }

  toggleClose(): void {
    this.open.set(false);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    const text = this.inputText.trim();
    if (!text || this.loading()) return;
    this.inputText = '';
    this.send(text);
  }

  send(text: string): void {
    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      time: new Date().toISOString()
    };
    this.messages.update((m) => [...m, userMsg]);
    this.loading.set(true);
    this.suggestions.set([]);
    this.scrollBottom();

    this.chat.send(text, this.messages()).subscribe({
      next: (res) => {
        this.messages.update((m) => [
          ...m,
          { role: 'assistant', content: res.reply, time: new Date().toISOString() }
        ]);
        this.suggestions.set(res.suggestions?.length ? res.suggestions : QUICK_START);
        this.loading.set(false);
        this.scrollBottom();
      },
      error: () => {
        this.messages.update((m) => [
          ...m,
          {
            role: 'assistant',
            content:
              'Mình chưa kết nối được máy chủ. Vui lòng thử lại sau hoặc liên hệ **0123 456 789** / trang **Liên hệ**.',
            time: new Date().toISOString()
          }
        ]);
        this.suggestions.set(QUICK_START);
        this.loading.set(false);
        this.scrollBottom();
      }
    });
  }

  onMessageClick(event: Event): void {
    const anchor = (event.target as HTMLElement).closest('a.chat-link');
    if (!anchor) return;
    event.preventDefault();
    const href = anchor.getAttribute('href');
    if (href) {
      this.router.navigateByUrl(href);
      this.open.set(false);
    }
  }

  formatContent(text: string): string {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    html = html.replace(/(\/san-pham\/[a-z0-9-]+)/gi, (path) => {
      const slug = path.replace('/san-pham/', '');
      return `<a class="chat-link" href="${path}" data-slug="${slug}">${path}</a>`;
    });

    return html;
  }

  private scrollBottom(): void {
    requestAnimationFrame(() => {
      const el = this.messagesEl()?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }
}
