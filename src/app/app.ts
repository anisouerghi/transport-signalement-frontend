import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PublicHeaderComponent } from './shared/components/public-header.component';
import { PublicFooterComponent } from './shared/components/public-footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PublicHeaderComponent, PublicFooterComponent],
  template: `
    <div class="app-shell">
      <app-public-header />
      <main class="app-main">
        <router-outlet />
      </main>
      <app-public-footer />
    </div>
  `,
})
export class App {}
