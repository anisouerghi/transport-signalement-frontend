import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <section class="panel p-4">
      <h1 class="h3 mb-4">{{ 'contact.title' | translate }}</h1>

      <h2 class="h5 mb-3">{{ 'contact.detailsTitle' | translate }}</h2>

      <ul class="contact-list">
        <li class="contact-item">
          <span class="contact-item__icon material-symbols-outlined" aria-hidden="true">location_on</span>
          <div class="contact-item__body">
            <span class="contact-item__label">{{ 'contact.addressLabel' | translate }}</span>
            <span class="contact-item__value">{{ 'contact.address' | translate }}</span>
          </div>
        </li>
        <li class="contact-item">
          <span class="contact-item__icon material-symbols-outlined" aria-hidden="true">call</span>
          <div class="contact-item__body">
            <span class="contact-item__label">{{ 'contact.phoneLabel' | translate }}</span>
            <span class="contact-item__value contact-item__value--ltr">{{ 'contact.phone' | translate }}</span>
          </div>
        </li>
        <li class="contact-item">
          <span class="contact-item__icon material-symbols-outlined" aria-hidden="true">fax</span>
          <div class="contact-item__body">
            <span class="contact-item__label">{{ 'contact.faxLabel' | translate }}</span>
            <span class="contact-item__value contact-item__value--ltr">{{ 'contact.fax' | translate }}</span>
          </div>
        </li>
        <li class="contact-item">
          <span class="contact-item__icon material-symbols-outlined" aria-hidden="true">mail</span>
          <div class="contact-item__body">
            <span class="contact-item__label">{{ 'contact.emailLabel' | translate }}</span>
            <a class="contact-item__value contact-item__value--ltr" [href]="'mailto:' + ('contact.email' | translate)">
              {{ 'contact.email' | translate }}
            </a>
          </div>
        </li>
      </ul>
    </section>
  `,
  styles: [
    `
      .contact-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.9rem;
      }
      .contact-item {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
      }
      .contact-item__icon {
        flex-shrink: 0;
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 0.65rem;
        background: #e5eeff;
        color: #0b52a8;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
      }
      .contact-item__body {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        min-width: 0;
      }
      .contact-item__label {
        color: #5a6b7d;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .contact-item__value {
        color: #131c28;
        font-size: 0.95rem;
        line-height: 1.4;
      }
      .contact-item__value--ltr {
        direction: ltr;
        unicode-bidi: isolate;
      }
      a.contact-item__value {
        color: #0b52a8;
        text-decoration: none;
      }
      a.contact-item__value:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class ContactPage {}
