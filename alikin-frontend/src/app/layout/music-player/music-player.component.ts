import { Component } from '@angular/core';
import { MusicPlayerService } from './music-player.service';

@Component({
  selector: 'app-music-player',
  templateUrl: './music-player.component.html',
  styleUrls: ['./music-player.component.scss']
})
export class MusicPlayerComponent {
  constructor(public musicService: MusicPlayerService) {}

  togglePlayPause(): void {
    this.musicService.togglePlayPause();
  }
}
