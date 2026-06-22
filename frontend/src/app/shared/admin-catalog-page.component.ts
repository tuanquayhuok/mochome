import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminPageShellComponent } from './admin-page-shell.component';

export interface AdminCrumb {
  label: string;
  route?: string;
}

@Component({
  selector: 'app-admin-catalog-page',
  standalone: true,
  imports: [AdminPageShellComponent, RouterLink],
  template: `
    <div class="catalog-page">
      <header class="catalog-head">
        <nav class="catalog-crumbs" aria-label="Breadcrumb">
          @for (crumb of breadcrumbs; track crumb.label; let last = $last) {
            @if (!last && crumb.route) {
              <a [routerLink]="crumb.route">{{ crumb.label }}</a>
            } @else if (!last) {
              <span>{{ crumb.label }}</span>
            } @else {
              <span class="current">{{ crumb.label }}</span>
            }
            @if (!last) {
              <span class="sep" aria-hidden="true">›</span>
            }
          }
        </nav>
        <div class="catalog-head-row">
          <div class="catalog-titles">
            <h1>{{ title }}</h1>
            @if (subtitle) {
              <p>{{ subtitle }}</p>
            }
          </div>
          <div class="catalog-actions">
            <ng-content select="[catalogActions]" />
          </div>
        </div>
      </header>

      <app-admin-page-shell>
        <ng-content select="[pageToolbar]" pageToolbar />
        <ng-content />
      </app-admin-page-shell>
    </div>
  `,
  styles: [
    `
      .catalog-page {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        max-width: none;
      }

      .catalog-crumbs {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.8125rem;
        color: var(--muted);
      }

      .catalog-crumbs a:hover {
        color: var(--text);
      }

      .catalog-crumbs .current {
        color: var(--text);
        font-weight: 500;
      }

      .sep {
        color: #c5c9d0;
      }

      .catalog-head-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .catalog-titles h1 {
        margin: 0 0 0.25rem;
        font-size: 1.375rem;
        font-weight: 600;
        letter-spacing: -0.02em;
      }

      .catalog-titles p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--muted);
      }

      .catalog-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-shrink: 0;
      }
    `
  ]
})
export class AdminCatalogPageComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle = '';
  @Input({ required: true }) breadcrumbs: AdminCrumb[] = [];
}
