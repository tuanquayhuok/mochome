import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { HeaderComponent } from '../components/header/header.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="shell">
      <app-sidebar [open]="sidebarOpen()" (closeSidebar)="sidebarOpen.set(false)"></app-sidebar>
      <div class="shell-main">
        <app-header (toggleSidebar)="sidebarOpen.set(!sidebarOpen())"></app-header>
        <main class="shell-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .shell {
        display: flex;
        min-height: 100vh;
        background: var(--bg);
      }

      .shell-main {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }

      .shell-content {
        flex: 1;
        padding: 1.25rem 1.5rem 1.5rem;
        overflow-y: auto;
      }

      @media (max-width: 1024px) {
        .shell {
          flex-direction: column;
        }

        .shell-content {
          padding: 1rem;
        }
      }
    `
  ]
})
export class AdminLayoutComponent {
  readonly sidebarOpen = signal(false);
}
