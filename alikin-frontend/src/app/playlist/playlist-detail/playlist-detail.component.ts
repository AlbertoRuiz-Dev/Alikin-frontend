import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import {Playlist} from "../models/playlist.model";
import {Song} from "../../songs/song.model";
import {PlaylistService} from "../playlist.services";
import {SongService} from "../../songs/song.service";
import {Page} from "../../shared/models/page.model";
import {SongBasic} from "../models/song-basic.model";
import {environment} from "../../../enviroments/enviroment";

@Component({
  selector: 'app-playlist-detail',
  templateUrl: './playlist-detail.component.html',
  styleUrls: ['./playlist-detail.component.scss']
})
export class PlaylistDetailComponent implements OnInit {
  playlist$: Observable<Playlist | null> = of(null);
  playlistId!: number;
  errorMessage: string | null = null;

  // Para añadir canciones
  showSongSearch = false;
  availableSongsPage$: Observable<Page<Song>> = of({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 0,  first: true, last: true, empty: true, numberOfElements:0, sort: { sorted: false, unsorted: true, empty: true} }); // Inicializar
  currentPage = 0;
  pageSize = 10;
  mediaUrl = environment.mediaUrl;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private playlistService: PlaylistService,
    private songService: SongService // Para buscar canciones y añadirlas
  ) {}

  ngOnInit(): void {
    this.playlist$ = this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (!id) {
          this.errorMessage = 'ID de playlist no proporcionado.';
          return of(null);
        }
        this.playlistId = +id;
        return this.playlistService.getPlaylistById(this.playlistId).pipe( //
          catchError(err => {
            this.errorMessage = 'Error al cargar la playlist.';
            console.error(err);
            return of(null);
          })
        );
      })
    );
  }

  loadPlaylistDetails(): void { // Método para recargar la playlist
    if (this.playlistId) {
      this.playlist$ = this.playlistService.getPlaylistById(this.playlistId).pipe( //
        catchError(err => {
          this.errorMessage = 'Error al recargar la playlist.';
          console.error(err);
          return of(null);
        })
      );
    }
  }

  removeSongFromPlaylist(songId: number): void {
    if (!this.playlistId) return;
    if (confirm('¿Estás seguro de eliminar esta canción de la playlist?')) {
      this.playlistService.removeSongFromPlaylist(this.playlistId, songId).subscribe({ //
        next: () => {
          alert('Canción eliminada.');
          this.loadPlaylistDetails(); // Recargar
        },
        error: (err) => {
          this.errorMessage = 'Error al eliminar la canción.';
          console.error(err);
          alert(this.errorMessage);
        }
      });
    }
  }

  toggleSongSearch(show: boolean): void {
    this.showSongSearch = show;
    if (show) {
      this.searchSongs();
    }
  }

  searchSongs(page: number = 0): void {
    this.currentPage = page;
    // Usamos el SongService existente para buscar canciones paginadas
    // Aquí podrías añadir más filtros si tu PageableSongRequest y backend los soportan
    this.availableSongsPage$ = this.songService.getAvailableSongs({ page: this.currentPage, size: this.pageSize, sort: 'title,asc' }).pipe( //
      catchError(err => {
        this.errorMessage = 'Error al buscar canciones.';
        console.error(err);
        return of({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 0, first: true, last: true, empty: true, numberOfElements: 0, sort: { sorted: false, unsorted: true, empty: true} });
      })
    );
  }

  addSongToPlaylist(songId: number): void {
    if (!this.playlistId) return;
    this.playlistService.addSongToPlaylist(this.playlistId, songId).subscribe({ //
      next: () => {
        alert('Canción añadida a la playlist.');
        this.loadPlaylistDetails(); // Recargar
        // Opcional: podrías cerrar el buscador de canciones o actualizar la lista de disponibles
      },
      error: (err) => {
        this.errorMessage = 'Error al añadir la canción. ¿Quizás ya existe en la playlist?';
        console.error(err);
        alert(this.errorMessage);
      }
    });
  }

  // Simulación de reproducción
  playSong(song: SongBasic | Song): void {
    console.log(`Reproduciendo: ${song.title} - ${song.artist}`);
    alert(`Reproduciendo: ${song.title}`);
  }

  goToEdit(): void {
    this.router.navigate(['/playlist', this.playlistId, 'edit']);
  }
}
