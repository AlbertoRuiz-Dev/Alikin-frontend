import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Playlist } from '../models/playlist.model';
import {environment} from "../../../enviroments/enviroment";

@Component({
  selector: 'app-playlist-item',
  templateUrl: './playlist-item.component.html',
  styleUrls: ['./playlist-item.component.scss']
})
export class PlaylistItemComponent {
  @Input() playlist!: Playlist;
  // Eventos para interactuar con el componente padre (lista)
  @Output() viewDetails = new EventEmitter<number>();
  @Output() editPlaylist = new EventEmitter<number>();
  @Output() deletePlaylist = new EventEmitter<number>();

  defaultCoverUrl = 'assets/images/default-playlist-cover.jpg'; // Define una imagen por defecto
  mediaUrl = environment.serverURL;

  onViewDetails(): void {
    this.viewDetails.emit(this.playlist.id);
  }

  onEdit(): void {
    this.editPlaylist.emit(this.playlist.id);
  }

  onDelete(): void {
    // Podrías añadir una confirmación aquí antes de emitir
    if (confirm(`¿Estás seguro de eliminar la playlist "${this.playlist.name}"?`)) {
      this.deletePlaylist.emit(this.playlist.id);
    }
  }
}
