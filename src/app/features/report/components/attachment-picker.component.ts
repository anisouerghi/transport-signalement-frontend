import { Component, EventEmitter, Input, OnDestroy, Output, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

export interface SelectedAttachment {
  id: string;
  file: File;
  previewUrl?: string;
}

const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 25 * 1024 * 1024;
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf']);
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']);

@Component({
  selector: 'app-attachment-picker',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './attachment-picker.component.html',
  styleUrl: './attachment-picker.component.scss',
})
export class AttachmentPickerComponent implements OnDestroy {
  private readonly translate = inject(TranslateService);

  @Input() disabled = false;
  @Output() filesChange = new EventEmitter<File[]>();

  readonly items: SelectedAttachment[] = [];
  error: string | null = null;
  dragOver = false;

  readonly maxFiles = MAX_FILES;
  readonly maxFileMb = 10;
  readonly maxTotalMb = 25;

  get countLabel(): string {
    return `${this.items.length} / ${MAX_FILES}`;
  }

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.addFiles(Array.from(input.files));
      input.value = '';
    }
  }

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

  formatSize(bytes: number): string {
    if (bytes < 1024) {
      return this.translate.instant('attachments.unitB', { n: bytes });
    }
    if (bytes < 1024 * 1024) {
      return this.translate.instant('attachments.unitKb', { n: (bytes / 1024).toFixed(1) });
    }
    return this.translate.instant('attachments.unitMb', { n: (bytes / (1024 * 1024)).toFixed(1) });
  }

  ngOnDestroy(): void {
    for (const item of this.items) {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    }
  }

  private addFiles(files: File[]): void {
    this.error = null;
    const next = [...this.items];

    for (const file of files) {
      if (next.length >= MAX_FILES) {
        this.error = this.translate.instant('attachments.maxFiles', { count: MAX_FILES });
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

  private validateFile(file: File, current: SelectedAttachment[]): string | null {
    const ext = file.name.includes('.')
      ? file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase()
      : '';
    if (!ALLOWED_EXT.has(ext)) {
      return this.translate.instant('attachments.badFormat', { name: file.name });
    }
    const mime = (file.type || '').toLowerCase();
    if (mime && !ALLOWED_MIME.has(mime)) {
      return this.translate.instant('attachments.badMime', { name: file.name });
    }
    if (file.size > MAX_FILE_BYTES) {
      return this.translate.instant('attachments.fileTooBig', { name: file.name });
    }
    const total = current.reduce((sum, i) => sum + i.file.size, 0) + file.size;
    if (total > MAX_TOTAL_BYTES) {
      return this.translate.instant('attachments.totalTooBig');
    }
    return null;
  }

  private emit(): void {
    this.filesChange.emit(this.items.map((i) => i.file));
  }
}
