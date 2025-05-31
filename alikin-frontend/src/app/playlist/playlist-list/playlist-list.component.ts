import {Component, OnDestroy, OnInit} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {Observable, of, Subscription, tap} from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Playlist } from '../models/playlist.model';
import { PlaylistService } from '../playlist.services';
@Component({
  selector: 'app-playlist-list',
  templateUrl: './playlist-list.component.html',
  styleUrls: ['./playlist-list.component.scss'] // Los estilos minimalistas que definimos antes
})
export class PlaylistListComponent implements OnInit, OnDestroy {
  // playlists$!: Observable<Playlist[]>; // Ya no usaremos async pipe directamente para la lista principal

  originalPlaylists: Playlist[] = []; // Almacena todas las playlists cargadas para el tipo de vista
  filteredPlaylists: Playlist[] = []; // Playlists a mostrar después de aplicar filtros y búsqueda

  searchTerm: string = ''; // Término de búsqueda ingresado por el usuario
  isLoading: boolean = true; // Para mostrar el estado de carga
  errorMessage: string | null = null;
  listTitle: string = 'Mis Playlists';
  listType: 'currentUser' | 'public' | 'userSpecific' = 'currentUser';

  private playlistsSubscription: Subscription | undefined; // Para gestionar la suscripción

  constructor(
    private playlistService: PlaylistService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.listType = data['listType'] || 'currentUser';
      const userIdParam = this.route.snapshot.paramMap.get('userId');
      this.resetState(); // Resetea estado antes de cargar nuevas playlists

      let playlistsObservable: Observable<Playlist[]>;

      switch (this.listType) {
        case 'public':
          this.listTitle = 'Playlists Públicas';
          playlistsObservable = this.playlistService.getPublicPlaylists(); //
          break;
        case 'userSpecific':
          if (userIdParam) {
            const userId = +userIdParam;
            this.listTitle = `Playlists Públicas del Usuario ${userId}`;
            playlistsObservable = this.playlistService.getPublicPlaylistsByOwner(userId); //
          } else {
            this.errorMessage = 'ID de usuario no encontrado.';
            playlistsObservable = of([]);
          }
          break;
        default: // 'currentUser'
          this.listTitle = 'Mis Playlists';
          playlistsObservable = this.playlistService.getCurrentUserPlaylists(); //
          break;
      }

      this.loadPlaylists(playlistsObservable);
    });
  }

  private resetState(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.originalPlaylists = [];
    this.filteredPlaylists = [];
    this.searchTerm = ''; // Resetea el término de búsqueda al cambiar de tipo de lista
    if (this.playlistsSubscription) {
      this.playlistsSubscription.unsubscribe(); // Cancela suscripción anterior si existe
    }
  }

  private loadPlaylists(observable: Observable<Playlist[]>): void {
    this.playlistsSubscription = observable.pipe(
      tap(playlists => { // Usamos tap para efectos secundarios sin alterar el flujo para el error
        this.originalPlaylists = playlists;
        this.applyFilters(); // Aplica filtros (incluyendo la búsqueda inicial si searchTerm no está vacío)
        this.isLoading = false;
      }),
      catchError(err => {
        this.errorMessage = 'Error al cargar las playlists. Inténtalo de nuevo más tarde.';
        console.error(err);
        this.originalPlaylists = [];
        this.filteredPlaylists = [];
        this.isLoading = false;
        return of([]); // Devuelve un array vacío para que la UI no se rompa
      })
    ).subscribe(); // Nos suscribimos aquí para tener control sobre la data
  }

  applyFilters(): void {
    let playlistsParaFiltrar = [...this.originalPlaylists]; // Copiamos la lista original para no modificarla directamente

    if (this.searchTerm.trim() !== '') {
      const lowerSearchTerm = this.searchTerm.toLowerCase().trim();

      this.filteredPlaylists = playlistsParaFiltrar.filter(playlist =>
        playlist.name.toLowerCase().includes(lowerSearchTerm) ||
        (playlist.description && playlist.description.toLowerCase().includes(lowerSearchTerm)) ||
        (playlist.owner?.name && playlist.owner.name.toLowerCase().includes(lowerSearchTerm)) // Usamos 'name' del owner
      );
    } else {
      this.filteredPlaylists = playlistsParaFiltrar;
    }
  }

  onSearchTermChange(): void {
    this.applyFilters();
  }

  handleViewDetails(playlistId: number): void {
    this.router.navigate(['/playlist', playlistId]);
  }

  handleEditPlaylist(playlistId: number): void {
    this.router.navigate(['/playlist', playlistId, 'edit']);
  }

  handleDeletePlaylist(playlistId: number): void {
    this.playlistService.deletePlaylist(playlistId).subscribe({ //
      next: () => {
        alert('Playlist eliminada correctamente.');
        // Recargar la lista original y aplicar filtros
        const currentObservable = this.getCurrentObservable(); // Obtener el observable actual para recargar
        if (currentObservable) {
          this.loadPlaylists(currentObservable);
        }
      },
      error: (err) => {
        this.errorMessage = 'Error al eliminar la playlist.';
        console.error(err);
        alert(this.errorMessage);
      }
    });
  }

  // Helper para obtener el observable correcto para recargar
  private getCurrentObservable(): Observable<Playlist[]> | null {
    const userIdParam = this.route.snapshot.paramMap.get('userId');
    switch (this.listType) {
      case 'public': return this.playlistService.getPublicPlaylists(); //
      case 'userSpecific':
        return userIdParam ? this.playlistService.getPublicPlaylistsByOwner(+userIdParam) : of([]); //
      case 'currentUser': return this.playlistService.getCurrentUserPlaylists(); //
      default: return null;
    }
  }

  navigateToCreate(): void {
    this.router.navigate(['/playlist/new']);
  }

  ngOnDestroy(): void {
    if (this.playlistsSubscription) {
      this.playlistsSubscription.unsubscribe();
    }
  }
}
