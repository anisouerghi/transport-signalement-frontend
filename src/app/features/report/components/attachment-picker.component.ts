import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';

/** Fichier sélectionné côté client, avec aperçu optionnel pour les images. */
export interface SelectedAttachment {
  id: string;
  file: File;
  /** Object URL révoquée à la destruction du composant. */
  previewUrl?: string;
}

const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 25 * 1024 * 1024;
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf']);
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']);

/**
 * Zone de sélection des pièces jointes (optionnelles) du formulaire voyageur.
 *
 * Propose multi-sélection, glisser-déposer, aperçu image, compteur et contrôles
 * alignés sur les règles backend (formats, 5 fichiers, 10 Mo / 25 Mo).
 */
@Component({
  selector: 'app-attachment-picker',
  standalone: true,
  templateUrl: './attachment-picker.component.html',
  styleUrl: './attachment-picker.component.scss',
})
export class AttachmentPickerComponent implements OnDestroy {
  /** Désactive l'interaction pendant l'envoi du formulaire. */
  @Input() disabled = false;
  /** Émet la liste courante des fichiers retenus. */
  @Output() filesChange = new EventEmitter<File[]>();

  readonly items: SelectedAttachment[] = [];
  error: string | null = null;
  dragOver = false;

  readonly maxFiles = MAX_FILES;
  readonly maxFileMb = 10;
  readonly maxTotalMb = 25;

  /** Libellé du compteur affiché (ex. {@code 2 / 5}). */
  get countLabel(): string {
    return `${this.items.length} / ${MAX_FILES}`;
  }

  /** Ajoute les fichiers choisis via l'input natif. */
  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.addFiles(Array.from(input.files));
      input.value = '';
    }
  }

  /** Ajoute les fichiers issus d'un glisser-déposer. */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    if (this.disabled) {
      return;
    }
    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.addFiles(Array.from(files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.disabled) {
      this.dragOver = true;
    }
  }

  onDragLeave(): void {
    this.dragOver = false;
  }

  /** Retire un fichier de la sélection et libère son aperçu. */
  remove(id: string): void {
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx < 0) {
      return;
    }
    const [removed] = this.items.splice(idx, 1);
    if (removed.previewUrl) {
      URL.revokeObjectURL(removed.previewUrl);
    }
    this.error = null;
    this.emit();
  }

  /** Formate une taille en octets pour l'affichage utilisateur. */
  formatSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} o`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} Ko`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  ngOnDestroy(): void {
    for (const item of this.items) {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    }
  }

  /** Applique les règles de validation puis met à jour la sélection. */
  private addFiles(files: File[]): void {
    this.error = null;
    const next = [...this.items];

    for (const file of files) {
      if (next.length >= MAX_FILES) {
        this.error = `Maximum ${MAX_FILES} pièces jointes autorisées.`;
        break;
      }
      const validationError = this.validateFile(file, next);
      if (validationError) {
        this.error = validationError;
        continue;
      }
      const item: SelectedAttachment = {
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
      };
      if (file.type.startsWith('image/')) {
        item.previewUrl = URL.createObjectURL(file);
      }
      next.push(item);
    }

    this.items.splice(0, this.items.length, ...next);
    this.emit();
  }

  /**
   * Vérifie extension, MIME, taille unitaire et cumul avant acceptation.
   * @returns message d'erreur utilisateur, ou {@code null} si le fichier est valide
   */
  private validateFile(file: File, current: SelectedAttachment[]): string | null {
    const ext = file.name.includes('.')
      ? file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase()
      : '';
    if (!ALLOWED_EXT.has(ext)) {
      return `Format non autorisé (${file.name}). Formats : JPG, JPEG, PNG, WEBP, PDF.`;
    }
    const mime = (file.type || '').toLowerCase();
    if (mime && !ALLOWED_MIME.has(mime)) {
      return `Type MIME non autorisé (${file.name}).`;
    }
    if (file.size > MAX_FILE_BYTES) {
      return `Le fichier ${file.name} dépasse 10 Mo.`;
    }
    const total = current.reduce((sum, i) => sum + i.file.size, 0) + file.size;
    if (total > MAX_TOTAL_BYTES) {
      return 'La taille totale des pièces jointes ne doit pas dépasser 25 Mo.';
    }
    return null;
  }

  private emit(): void {
    this.filesChange.emit(this.items.map((i) => i.file));
  }
}
