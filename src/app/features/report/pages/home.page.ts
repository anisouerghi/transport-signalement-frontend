import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { LanguageService } from '../../../core/services/language.service';
import { PublicHomepageReply, ReportType, SupportTypeCount } from '../models/report.model';
import { ReportService } from '../services/report.service';
import { ReportTypeService } from '../services/report-type.service';

const PAGE_SIZE = 4;
const EXCERPT_LENGTH = 110;

/** Icônes et couleurs déjà utilisées sur l'accueil. Affichage uniquement. */
const NATURE_VISUAL: Record<string, { icon: string; tone: string; badge?: boolean }> = {
  COMPLAINT: { icon: 'rate_review', tone: 'blue' },
  INCIDENT: { icon: 'photo_camera', tone: 'red', badge: true },
  SUGGESTION: { icon: 'tips_and_updates', tone: 'gold' },
  THANKS: { icon: 'thumb_up', tone: 'green' },
  OTHER: { icon: 'contact_support', tone: 'gray' },
  ASSAULT: { icon: 'shield', tone: 'red' },
};

interface NatureCardView {
  code: string;
  icon: string;
  tone: string;
  badge: boolean;
  translated: boolean;
  label: string;
  description: string;
}

interface EmergencyView {
  code: string;
  icon: string;
}

const EMERGENCY_CODES = new Set(['URGENCE', 'URGENCY', 'EMERGENCY', 'URGENT']);

/** Icônes et couleurs des types de support pour la section statistiques. */
const SUPPORT_VISUAL: Record<string, { icon: string; tone: string }> = {
  NO_SUPPORT: { icon: 'report', tone: 'gray' },
  BUS: { icon: 'directions_bus', tone: 'blue' },
  METRO: { icon: 'subway', tone: 'green' },
  STATION: { icon: 'location_on', tone: 'gold' },
  LIGHT_RAIL: { icon: 'tram', tone: 'green' },
  TRAM: { icon: 'tram', tone: 'green' },
  TGM: { icon: 'tram', tone: 'green' },
  TRAIN: { icon: 'train', tone: 'gold' },
  FERRY: { icon: 'directions_boat', tone: 'blue' },
  BOAT: { icon: 'directions_boat', tone: 'blue' },
};

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [TranslatePipe, RouterLink],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  private readonly reportService = inject(ReportService);
  private readonly reportTypeService = inject(ReportTypeService);
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private langSub?: Subscription;
  private naturesRequest = 0;

  readonly referenceError = signal(false);
  readonly natureCards = signal<NatureCardView[]>([]);
  readonly emergency = signal<EmergencyView | null>(null);
  readonly naturesLoading = signal(true);
  readonly naturesError = signal(false);

  readonly supportStats = signal<SupportTypeCount[]>([]);
  readonly supportStatsLoading = signal(true);
  readonly supportStatsError = signal(false);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly replies = signal<PublicHomepageReply[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly expanded = signal<ReadonlySet<number>>(new Set());
  readonly trackingCode = signal('');
  readonly reportTypes = signal<ReportType[]>([]);
  readonly typesLoading = signal(true);
  readonly typesError = signal(false);

  readonly pages = computed(() => {
    const n = this.totalPages();
    return n > 0 ? Array.from({ length: n }, (_, i) => i) : [];
  });

  ngOnInit(): void {
    this.loadNatures();
    this.loadSupportStats();
    this.load(0);
    this.langSub = this.language.langChanged$.subscribe(() => {
      this.loadNatures();
      this.loadSupportStats();
      this.load(this.page());
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  loadNatures(): void {
    const request = ++this.naturesRequest;
    this.naturesLoading.set(true);
    this.naturesError.set(false);
    this.reportTypeService.getActive().subscribe({
      next: (types) => {
        if (request !== this.naturesRequest) {
          return;
        }
        this.applyNatures(types);
        this.naturesLoading.set(false);
      },
      error: () => {
        if (request !== this.naturesRequest) {
          return;
        }
        this.natureCards.set([]);
        this.emergency.set(null);
        this.naturesError.set(true);
        this.naturesLoading.set(false);
      },
    });
  }

  searchByReference(raw: string): void {
    const reference = raw.trim();
    if (!reference) {
      this.referenceError.set(true);
      return;
    }
    this.referenceError.set(false);
    void this.router.navigate(['/reference', reference]);
  }

  /** Répartition des supports par type de support (statistiques publiques). */
  loadSupportStats(): void {
    this.supportStatsLoading.set(true);
    this.supportStatsError.set(false);
    this.reportService.getSupportsByType().subscribe({
      next: (data) => {
        this.supportStats.set(data);
        this.supportStatsLoading.set(false);
      },
      error: () => {
        this.supportStats.set([]);
        this.supportStatsError.set(true);
        this.supportStatsLoading.set(false);
      },
    });
  }

  /** Icône Material Symbols associée au type de support. */
  supportTypeIcon(code?: string | null): string {
    return SUPPORT_VISUAL[(code ?? '').trim().toUpperCase()]?.icon ?? 'commute';
  }

  /** Couleur d'accent associée au type de support. */
  supportTypeTone(code?: string | null): string {
    return SUPPORT_VISUAL[(code ?? '').trim().toUpperCase()]?.tone ?? 'blue';
  }

  /** Libellé localisé du type de support selon la langue active. */
  supportTypeLabel(item: SupportTypeCount): string {
    const lang = this.language.currentLang();
    if (lang.startsWith('ar') && item.labelAr) {
      return item.labelAr;
    }
    if (lang.startsWith('en') && item.labelEn) {
      return item.labelEn;
    }
    return item.label || item.labelAr || item.labelEn || item.code;
  }

  load(page: number): void {
    this.loading.set(true);
    this.error.set(false);
    this.expanded.set(new Set());
    this.reportService.listHomepageReplies(page, PAGE_SIZE).subscribe({
      next: (res) => {
        const content = Array.isArray(res?.content) ? res.content : [];
        const sorted = [...content].sort((a, b) => {
          const da = a.replyDate ? Date.parse(a.replyDate) : 0;
          const db = b.replyDate ? Date.parse(b.replyDate) : 0;
          return db - da;
        });
        this.replies.set(sorted);
        this.totalPages.set(res?.totalPages ?? 0);
        this.page.set(res?.page ?? page);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.replies.set([]);
        this.loading.set(false);
      },
    });
  }

  onTrackingInput(event: Event): void {
    this.trackingCode.set((event.target as HTMLInputElement).value);
  }

  onTrackSubmit(event: Event): void {
    event.preventDefault();
    this.track();
  }

  track(): void {
    const code = this.trackingCode().trim();
    if (!code) {
      return;
    }
    void this.router.navigate(['/report-followup', code]);
  }

  trackReply(index: number, reply: PublicHomepageReply): string {
    return `${reply.replyDate ?? ''}-${index}`;
  }

  goToPage(p: number): void {
    if (p < 0 || p >= this.totalPages() || p === this.page()) {
      return;
    }
    this.load(p);
  }

  needsExcerpt(message?: string): boolean {
    return (message ?? '').trim().length > EXCERPT_LENGTH;
  }

  isExpanded(index: number): boolean {
    return this.expanded().has(index);
  }

  toggleExpand(index: number): void {
    const next = new Set(this.expanded());
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    this.expanded.set(next);
  }

  displayMessage(reply: PublicHomepageReply, index: number): string {
    const text = this.messageOf(reply);
    if (!this.needsExcerpt(text) || this.isExpanded(index)) {
      return text;
    }
    const cut = text.slice(0, EXCERPT_LENGTH);
    const lastSpace = cut.lastIndexOf(' ');
    const excerpt = lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
    return `${excerpt}…`;
  }

  displayResponse(reply: PublicHomepageReply, index: number): string {
    const text = this.responseOf(reply);
    if (!this.needsExcerpt(text) || this.isExpanded(index)) {
      return text;
    }
    const cut = text.slice(0, EXCERPT_LENGTH);
    const lastSpace = cut.lastIndexOf(' ');
    const excerpt = lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
    return `${excerpt}…`;
  }

  authorLabel(reply: PublicHomepageReply): string | null {
    return this.authorName(reply);
  }

  authorInitials(reply: PublicHomepageReply): string {
    const name = this.authorName(reply);
    if (!name) {
      return 'A';
    }
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  private applyNatures(types: ReportType[]): void {
    const usable = types.filter((type) => !!type.code?.trim());
    const emergencyType = this.findEmergency(usable);
    const cards = emergencyType
      ? usable.filter((type) => type.code.toUpperCase() !== emergencyType.code.toUpperCase())
      : usable;
    this.emergency.set(emergencyType ? this.toEmergency(emergencyType) : null);
    this.natureCards.set(this.toNatureCards(cards));
  }

  /** Le type urgence est identifié par son code, pas par sa priorité. */
  private findEmergency(types: ReportType[]): ReportType | null {
    return types.find((type) => this.isEmergencyType(type)) ?? null;
  }

  private isEmergencyType(type: ReportType): boolean {
    return [type.code, type.category, type.type].some(
      (value) => !!value && EMERGENCY_CODES.has(value.trim().toUpperCase()),
    );
  }

  private toEmergency(type: ReportType): EmergencyView {
    return {
      code: type.code.toUpperCase(),
      icon: type.icon?.trim() || 'crisis_alert',
    };
  }

  private toNatureCards(types: ReportType[]): NatureCardView[] {
    return this.sortByPriority(types.filter((type) => !!type.code?.trim()))
      .map((type) => {
        const code = type.code.toUpperCase();
        const visual = NATURE_VISUAL[code];
        const titleKey = `home.natures.${code}.title`;
        const translated = this.translate.instant(titleKey) !== titleKey;
        return {
          code,
          icon: this.resolveNatureIcon(code, type.icon, visual?.icon),
          tone: visual?.tone || 'gray',
          badge: !!visual?.badge,
          translated,
          label: type.label,
          description: type.description?.trim() ?? '',
        };
      });
  }

  /** `emergency` ne dessine pas de glyphe ; le bouclier est déjà utilisé sur l'accueil. */
  private resolveNatureIcon(code: string, apiIcon: string | null | undefined, fallback?: string): string {
    const stored = apiIcon?.trim() ?? '';
    if (code === 'ASSAULT' && (!stored || stored === 'emergency')) {
      return fallback || 'shield';
    }
    return stored || fallback || 'info';
  }

  private sortByPriority(types: ReportType[]): ReportType[] {
    return [...types].sort((a, b) => {
      const left = a.priority ?? Number.MAX_SAFE_INTEGER;
      const right = b.priority ?? Number.MAX_SAFE_INTEGER;
      if (left !== right) {
        return left - right;
      }
      return a.reportTypeId - b.reportTypeId;
    });
  }

  private authorName(reply: PublicHomepageReply): string | null {
    return reply.passengerName?.trim() || reply.passenger?.name?.trim() || null;
  }

  private messageOf(reply: PublicHomepageReply): string {
    return (reply.description ?? reply.reportMessage ?? '').replace(/\s+/g, ' ').trim();
  }

  private responseOf(reply: PublicHomepageReply): string {
    return (reply.responseMessage ?? reply.message ?? '').replace(/\s+/g, ' ').trim();
  }

  formatReplyDate(value?: string): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return new Intl.DateTimeFormat(this.language.currentLang(), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }
}
