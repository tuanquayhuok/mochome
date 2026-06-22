import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-page-shell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-page">
      <div class="page-panel">
        <ng-content select="[pageToolbar]" />
        <div class="page-panel-body">
          <ng-content />
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .admin-page {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: none;
      }

      .page-panel {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        overflow: hidden;
      }

      .page-panel-body:empty {
        display: none;
      }

      :host ::ng-deep [pageToolbar] {
        display: block;
        border-bottom: 1px solid var(--border-light);
      }
    `
  ]
})
export class AdminPageShellComponent {}
