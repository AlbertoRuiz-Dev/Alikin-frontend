import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MusicPlayerService {
  private audio = new Audio();

  currentSong: { title: string; artist: string; coverImageUrl: string; streamUrl: string } | null = null;

  isPlaying = false;
  currentTime = 0;
  duration = 0;
  progress = 0;
  volume = 1;

  constructor() {
    this.audio.volume = this.volume;

    this.audio.addEventListener('timeupdate', () => {
      this.currentTime = this.audio.currentTime;
      this.duration = this.audio.duration || 0;
      this.progress = this.duration ? (this.currentTime / this.duration) * 100 : 0;
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
    });
  }

  playSong(song: { title: string; artist: string; coverImageUrl: string; streamUrl: string }): void {
    if (this.audio.src !== song.streamUrl) {
      this.audio.src = song.streamUrl;
      this.audio.load();
    }

    this.audio.play().then(() => {
      this.isPlaying = true;
      this.currentSong = song;
    }).catch(err => console.error('🎵 Error al reproducir:', err));
  }

  pause(): void {
    this.audio.pause();
    this.isPlaying = false;
  }

  togglePlayPause(): void {
    if (this.audio.paused) {
      this.audio.play().then(() => this.isPlaying = true);
    } else {
      this.audio.pause();
      this.isPlaying = false;
    }
  }

  changeVolume(): void {
    this.audio.volume = this.volume;
  }

  onLoadedMetadata(event: Event): void {
    const audio = event.target as HTMLAudioElement;
    this.duration = audio.duration;
  }

  onTimeUpdate(event: Event): void {
    const audio = event.target as HTMLAudioElement;
    this.currentTime = audio.currentTime;
    this.progress = this.duration ? (this.currentTime / this.duration) * 100 : 0;
  }

  onEnded(): void {
    this.isPlaying = false;
  }

  getCurrentAudio(): HTMLAudioElement {
    return this.audio;
  }
}
