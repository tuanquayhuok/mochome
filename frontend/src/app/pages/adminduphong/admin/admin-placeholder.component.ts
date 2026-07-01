import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminCatalogPageComponent } from '../../shared/admin-catalog-page.component';

@Component({
  selector: 'app-admin-placeholder',
  standalone: true,
  imports: [RouterLink, AdminCatalogPageComponent],
  template: `
    <app-admin-catalog-page
      [title]="title"
      [subtitle]="subtitle"
      [breadcrumbs]="breadcrumbs"
    >
      <div class="placeholder-card">
        <p class="hint">{{ hint }}</p>
        @if (linkRoute) {
          <a [routerLink]="linkRoute" class="btn-action primary">{{ linkLabel }}</a>
        }
      </div>
    </app-admin-catalog-page>
  `,
  styles: [
    `
      .placeholder-card {
        padding: 2rem;
        text-align: center;
        background: var(--surface);
        border: 1px dashed var(--border);
        border-radius: 10px;
      }

      .hint {
        margin: 0 0 1.25rem;
        color: var(--muted);
        font-size: 0.9375rem;
        max-width: 480px;
        margin-left: auto;
        margin-right: auto;
      }
    `
  ]
})
export class AdminPlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  get title(): string {
    return this.route.snapshot.data['title'] || 'Đang phát triển';
  }

  get subtitle(): string {
    return this.route.snapshot.data['subtitle'] || '';
  }

  get hint(): string {
    return (
      this.route.snapshot.data['hint'] ||
      'Tính năng sẽ được bổ sung trong phiên bản tiếp theo.'
    );
  }

  get linkRoute(): string | null {
    return this.route.snapshot.data['linkRoute'] || null;
  }

  get linkLabel(): string {
    return this.route.snapshot.data['linkLabel'] || 'Quay lại';
  }

  get breadcrumbs(): { label: string; route?: string }[] {
    const section = this.route.snapshot.data['sectionLabel'] as string | undefined;
    const sectionRoute = this.route.snapshot.data['sectionRoute'] as string | undefined;
    const crumbs: { label: string; route?: string }[] = [
      { label: 'Trang chủ', route: '/admin/dashboard' }
    ];
    if (section && sectionRoute) {
      crumbs.push({ label: section, route: sectionRoute });
    }
    crumbs.push({ label: this.title });
    return crumbs;
  }
}
