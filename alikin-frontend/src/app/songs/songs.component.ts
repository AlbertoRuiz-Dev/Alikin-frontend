import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from "../../enviroments/enviroment";
import { Song } from './song.model';
import { SongService, PageableSongRequest } from './song.service';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { Page } from '../shared/models/page.model';
import { MusicPlayerService } from "../layout/music-player/music-player.service";

@Component({
  selector: 'app-songs',
  templateUrl: './songs.component.html',
  styleUrls: ['./songs.component.scss']
})
export class SongsComponent implements OnInit, OnDestroy {
  songForm: FormGroup;
  selectedSongFile?: File;
  selectedCoverFile?: File;
  coverPreviewUrl?: string | null;

  genres: string[] = ['Rock', 'Pop', 'Jazz', 'Electrónica', 'Clásica', 'Hip Hop', 'Reggae', 'Otro'];
  isSubmittingUpload = false;
  uploadError: string | null = null;
  uploadSuccess: string | null = null;

  allSongs: Song[] = [];
  filteredSongs: Song[] = [];
  isLoadingSongs = false;
  listError: string | null = null;
  searchControl = this.fb.control('');

  showUploadForm = false;

  private destroy$ = new Subject<void>();

  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  hasMoreSongs = true;


  constructor(
    private fb: FormBuilder,
    private songService: SongService,
    private musicPlayerService : MusicPlayerService
  ) {
    this.songForm = this.fb.group({
      title: ['', Validators.required],
      artist: ['', Validators.required],
      album: [''],
      genre: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadInitialSongs();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.filterSongs(searchTerm || '');
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.coverPreviewUrl && this.coverPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.coverPreviewUrl);
    }
  }

  loadInitialSongs(): void {
    this.currentPage = 0;
    this.allSongs = [];
    this.filteredSongs = [];
    this.hasMoreSongs = true;
    this.fetchSongs(false);
  }

  loadMoreSongs(): void {
    if (!this.hasMoreSongs || this.isLoadingSongs) return;
    this.currentPage++;
    this.fetchSongs(true);
  }

  fetchSongs(isLoadMore: boolean = false): void {
    this.isLoadingSongs = true;
    this.listError = null;
    this.songService.getAvailableSongs({ page: this.currentPage, size: this.pageSize, sort: 'title,asc' })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingSongs = false )
      )
      .subscribe({
        next: (pageData: Page<Song>) => {
          if (pageData && Array.isArray(pageData.content)) {
            if (isLoadMore) {
              this.allSongs = [...this.allSongs, ...pageData.content];
            } else {
              this.allSongs = pageData.content;
            }
            this.filterSongs(this.searchControl.value || '');
            this.hasMoreSongs = !pageData.last;
            this.totalPages = pageData.totalPages;
          } else {
            this.listError = 'Formato de respuesta de canciones inválido.';
            if (!isLoadMore) { this.allSongs = []; this.filteredSongs = []; }
          }
        },
        error: (err) => {
          console.error('Error cargando todas las canciones:', err);
          this.listError = 'No se pudieron cargar las canciones.';
          if (!isLoadMore) { this.allSongs = []; this.filteredSongs = []; }
        }
      });
  }


  filterSongs(searchTerm: string): void {
    const filterValue = searchTerm.toLowerCase();
    if (!searchTerm.trim()) {
      this.filteredSongs = [...this.allSongs];
      return;
    }
    this.filteredSongs = this.allSongs.filter(song =>
      song.title.toLowerCase().includes(filterValue) ||
      (song.artist && song.artist.toLowerCase().includes(filterValue)) ||
      (song.album && song.album.toLowerCase().includes(filterValue))
    );
  }

  toggleUploadForm(): void {
    this.showUploadForm = !this.showUploadForm;
    if (this.showUploadForm) {
      this.songForm.reset({ genre: '' });
      this.selectedSongFile = undefined;
      this.selectedCoverFile = undefined;
      this.clearCoverPreview();
      this.uploadError = null;
      this.uploadSuccess = null;
    }
  }

  onSongSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedSongFile = input.files[0];
      this.uploadError = null;
    } else {
      this.selectedSongFile = undefined;
    }
    if(input) input.value = "";
  }

  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.clearCoverPreview();

    if (input.files?.length) {
      this.selectedCoverFile = input.files[0];
      this.coverPreviewUrl = URL.createObjectURL(this.selectedCoverFile);
    } else {
      this.selectedCoverFile = undefined;
    }
    if(input) input.value = "";
  }

  clearCoverPreview(): void {
    if (this.coverPreviewUrl && this.coverPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.coverPreviewUrl);
    }
    this.coverPreviewUrl = null;
    this.selectedCoverFile = undefined; // También limpiar el archivo seleccionado
    // Si tienes un ViewChild para el input de portada, también resetea su valor
    // const coverInput = document.getElementById('tuInputIdDePortada') as HTMLInputElement;
    // if (coverInput) coverInput.value = "";
  }

  onSubmitUpload(): void {
    if (this.songForm.invalid) {
      this.uploadError = 'Por favor completa los campos obligatorios del formulario (Título, Artista, Género).';
      this.songForm.markAllAsTouched();
      return;
    }
    if (!this.selectedSongFile) {
      this.uploadError = 'Por favor, selecciona un archivo de canción.';
      return;
    }

    this.isSubmittingUpload = true;
    this.uploadError = null;
    this.uploadSuccess = null;

    const songData = {
      title: this.songForm.value.title,
      artist: this.songForm.value.artist,
      album: this.songForm.value.album || '',
      genres: [this.songForm.value.genre]
    };

    const formData = new FormData();
    formData.append('songData', new Blob([JSON.stringify(songData)], { type: 'application/json' }));
    formData.append('audioFile', this.selectedSongFile);

    if (this.selectedCoverFile) {
      formData.append('coverImage', this.selectedCoverFile); // Asegúrate que esta clave coincida con el backend
    }

    this.songService.uploadSong(formData) // Usar el método del servicio
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: Song) => { // La respuesta ahora es Song
          this.uploadSuccess = `Canción "${response.title}" subida con éxito!`;
          this.isSubmittingUpload = false;
          this.toggleUploadForm();
          this.loadInitialSongs();
        },
        error: (err) => {
          console.error('Error al subir canción:', err);
          this.isSubmittingUpload = false;
          this.uploadError = err.error?.message || err.message || 'No se pudo subir la canción.';
        }
      });
  }

  getSongCoverUrl(coverPath?: string | null): string {
    const defaultCover = 'assets/default-cover.jpg';
    if (!coverPath) return defaultCover;
    if (coverPath.startsWith('http')) return coverPath;
    return `${environment.mediaUrl || 'http://localhost:8080'}/uploads/${coverPath}`;
  }

  getSongStreamUrl(songId?: number): string | null {
    if (songId === undefined || songId === null) return null;
    return `${environment.apiUrl}/songs/${songId}/stream`;
  }

  playSongFromList(song: Song): void {
    const streamUrl = this.getSongStreamUrl(song.id);
    if (!streamUrl) return;

    this.musicPlayerService.playSong({
        title: song.title,
        artist: song.artist || 'Artista Desconocido',
        coverImageUrl: this.getSongCoverUrl(song.coverImageUrl) || "", // Asegura que no sea null
        streamUrl: streamUrl
      }
    );
  }
}
