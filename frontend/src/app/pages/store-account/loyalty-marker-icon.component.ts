import { Component, input } from '@angular/core';
import { LoyaltyIconKey } from '../../core/models/loyalty-tier-icons';

@Component({
  selector: 'app-loyalty-marker-icon',
  standalone: true,
  template: `
    <span class="loyalty-marker-icon" [style.color]="color()">
      @switch (icon()) {
        @case ('bronze') {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        }
        @case ('silver') {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <circle cx="12" cy="8" r="5" />
            <path d="M8.5 14.5L7 21h10l-1.5-6.5" />
            <path d="M12 13v2" />
          </svg>
        }
        @case ('gold') {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        }
        @case ('diamond') {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path d="M6 3h12l4 7-10 11L2 10z" />
            <path d="M2 10h20M6 3l6 7 6-7" />
          </svg>
        }
        @case ('vip') {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path d="M2 20h20L12 4 2 20z" />
            <path d="M12 9v4M9 14h6" />
          </svg>
        }
        @case ('partner') {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
        }
        @case ('super') {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path
              d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
            />
          </svg>
        }
      }
    </span>
  `,
  styles: [
    `
      .loyalty-marker-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #fff;
        border: 2px solid #fff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
      }

      svg {
        width: 18px;
        height: 18px;
        display: block;
      }
    `
  ]
})
export class LoyaltyMarkerIconComponent {
  readonly icon = input.required<LoyaltyIconKey>();
  readonly color = input('#b45309');
}
