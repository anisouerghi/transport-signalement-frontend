import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  inject,
} from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

/** Durée maximale d'un message vocal (secondes) — facilement ajustable. */
export const VOICE_MAX_DURATION_SEC = 30;

const MAX_FILE_BYTES = 10 * 1024 * 1024;

type RecorderState = 'idle' | 'recording' | 'recorded' | 'unsupported' | 'denied';

@Component({
  selector: 'app-voice-recorder',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './voice-recorder.component.html',
  styleUrl: './voice-recorder.component.scss',
})
export class VoiceRecorderComponent implements OnDestroy {
  private readonly translate = inject(TranslateService);

  @Input() disabled = false;
  @Output() voiceChange = new EventEmitter<File | null>();

  readonly maxDurationSec = VOICE_MAX_DURATION_SEC;

  state: RecorderState = 'idle';
  durationSec = 0;
  error: string | null = null;
  previewUrl: string | null = null;

  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: BlobPart[] = [];
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private selectedMime = '';
  private selectedExt = 'webm';
  private voiceFile: File | null = null;

  get timeLabel(): string {
    return `${this.formatTime(this.durationSec)} / ${this.formatTime(this.maxDurationSec)}`;
  }

  async startRecording(): Promise<void> {
    if (this.disabled || this.state === 'recording') {
      return;
    }
    this.error = null;

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      this.state = 'unsupported';
      this.error = this.translate.instant('voice.unsupported');
      return;
    }

    const format = this.pickSupportedFormat();
    this.selectedMime = format.mime;
    this.selectedExt = format.ext;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      this.state = 'denied';
      this.error = this.translate.instant('voice.permissionDenied');
      this.voiceChange.emit(null);
      return;
    }

    this.chunks = [];
    this.durationSec = 0;
    try {
      this.mediaRecorder = this.selectedMime
        ? new MediaRecorder(this.stream, { mimeType: this.selectedMime })
        : new MediaRecorder(this.stream);
    } catch {
      this.stopStream();
      this.state = 'unsupported';
      this.error = this.translate.instant('voice.unsupported');
      return;
    }

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      this.clearTick();
      this.stopStream();
      this.finalizeRecording();
    };

    this.mediaRecorder.start(250);
    this.state = 'recording';
    this.tickTimer = setInterval(() => {
      this.durationSec += 1;
      if (this.durationSec >= this.maxDurationSec) {
        this.stopRecording();
      }
    }, 1000);
  }

  stopRecording(): void {
    if (this.state !== 'recording' || !this.mediaRecorder) {
      return;
    }
    if (this.mediaRecorder.state === 'recording' || this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.stop();
    }
  }

  clearRecording(): void {
    this.resetWithoutEmit();
    this.voiceChange.emit(null);
  }

  /** Supprime l'enregistrement courant puis redémarre (mic demandé à nouveau si besoin). */
  async rerecord(): Promise<void> {
    this.resetWithoutEmit();
    this.voiceChange.emit(null);
    await this.startRecording();
  }

  private resetWithoutEmit(): void {
    this.clearTick();
    if (this.mediaRecorder && this.state === 'recording') {
      this.mediaRecorder.onstop = null;
      try {
        this.mediaRecorder.stop();
      } catch {
        /* ignore */
      }
    }
    this.stopStream();
    this.revokePreview();
    this.chunks = [];
    this.durationSec = 0;
    this.voiceFile = null;
    this.mediaRecorder = null;
    this.state = 'idle';
    this.error = null;
  }

  formatTime(totalSec: number): string {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  ngOnDestroy(): void {
    this.clearRecording();
  }

  private finalizeRecording(): void {
    const blobType =
      this.mediaRecorder?.mimeType?.split(';')[0]?.trim()
      || this.selectedMime.split(';')[0]?.trim()
      || 'audio/webm';
    const blob = new Blob(this.chunks, { type: blobType });
    this.chunks = [];
    this.mediaRecorder = null;

    if (blob.size === 0) {
      this.state = 'idle';
      this.error = this.translate.instant('voice.empty');
      this.voiceChange.emit(null);
      return;
    }
    if (blob.size > MAX_FILE_BYTES) {
      this.state = 'idle';
      this.error = this.translate.instant('voice.tooLarge');
      this.voiceChange.emit(null);
      return;
    }

    const ext = this.extensionForMime(blobType) || this.selectedExt;
    const file = new File([blob], `voice-message-${Date.now()}.${ext}`, { type: blobType });
    this.revokePreview();
    this.previewUrl = URL.createObjectURL(blob);
    this.voiceFile = file;
    this.state = 'recorded';
    this.voiceChange.emit(file);
  }

  private pickSupportedFormat(): { mime: string; ext: string } {
    const candidates: Array<{ mime: string; ext: string }> = [
      { mime: 'audio/webm;codecs=opus', ext: 'webm' },
      { mime: 'audio/webm', ext: 'webm' },
      { mime: 'audio/mp4', ext: 'm4a' },
      { mime: 'audio/ogg;codecs=opus', ext: 'ogg' },
      { mime: 'audio/ogg', ext: 'ogg' },
    ];
    for (const candidate of candidates) {
      if (MediaRecorder.isTypeSupported(candidate.mime)) {
        return candidate;
      }
    }
    return { mime: '', ext: 'webm' };
  }

  private extensionForMime(mime: string): string {
    const base = mime.toLowerCase().split(';')[0].trim();
    if (base.includes('webm')) {
      return 'webm';
    }
    if (base.includes('ogg')) {
      return 'ogg';
    }
    if (base.includes('mp4') || base.includes('m4a') || base.includes('aac')) {
      return 'm4a';
    }
    if (base.includes('mpeg') || base.includes('mp3')) {
      return 'mp3';
    }
    return '';
  }

  private stopStream(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  private clearTick(): void {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  private revokePreview(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
  }
}
