import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, of, Subscription, forkJoin } from 'rxjs'; // Importa forkJoin
import { catchError, map, tap } from 'rxjs/operators';
import { Playlist } from '../models/playlist.model';
import { PlaylistService } from '../playlist.services';
// Asumiendo que tienes un servicio de autenticación que te da el ID del usuario actual.
// Si no, lo inferiremos, pero es menos robusto.
// import { AuthService } from 'src/app/auth/auth.service'; // Ejemplo

@Component({
  selector: 'app-playlist-list',
  templateUrl: './playlist-list.component.html',
  styleUrls: ['./playlist-list.component.scss']
})
export class PlaylistListComponent implements OnInit, OnDestroy {
  // Para la vista combinada (currentUser)
  originalMyPlaylists: Playlist[] = [];
  filteredMyPlaylists: Playlist[] = [];
  originalOtherPublicPlaylists: Playlist[] = [];
  filteredOtherPublicPlaylists: Playlist[] = [];
  currentUserId: number | null = null; // Para filtrar las playlists públicas

  // Para vistas de lista única (public, userSpecific)
  originalSingleListPlaylists: Playlist[] = [];
  filteredSingleListPlaylists: Playlist[] = [];

  searchTerm: string = '';
  isLoading: boolean = true;
  errorMessage: string | null = null;
  listTitle: string = 'Mis Playlists'; // Se ajustará dinámicamente
  listType: 'currentUser' | 'public' | 'userSpecific' = 'currentUser';

  private dataSubscription: Subscription | undefined;

  constructor(
    private playlistService: PlaylistService,
    private router: Router,
    private route: ActivatedRoute,
    // private authService: AuthService // Descomenta si tienes un AuthService
  ) {}

  ngOnInit(): void {
    // this.currentUserId = this.authService.getCurrentUserId(); // Idealmente desde un servicio de autenticación

    this.route.data.subscribe(data => {
      this.listType = data['listType'] || 'currentUser';
      const userIdParam = this.route.snapshot.paramMap.get('userId');
      this.resetState();

      if (this.listType === 'currentUser') {
        this.listTitle = ''; // El título se manejará con las secciones en el HTML
        this.loadCombinedPlaylistsView();
      } else {
        let playlistsObservable: Observable<Playlist[]>;
        switch (this.listType) {
          case 'public':
            this.listTitle = 'Playlists Públicas';
            playlistsObservable = this.playlistService.getPublicPlaylists();
            break;
          case 'userSpecific':
            if (userIdParam) {
              const userId = +userIdParam;
              this.listTitle = `Playlists Públicas del Usuario ${userId}`;
              playlistsObservable = this.playlistService.getPublicPlaylistsByOwner(userId);
            } else {
              this.errorMessage = 'ID de usuario no encontrado.';
              playlistsObservable = of([]);
            }
            break;
          default: // No debería llegar aquí si 'currentUser' se maneja arriba
            this.errorMessage = 'Tipo de lista desconocido.';
            playlistsObservable = of([]);
            break;
        }
        this.loadSinglePlaylistList(playlistsObservable);
      }
    });
  }

  private resetState(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.searchTerm = '';

    this.originalMyPlaylists = [];
    this.filteredMyPlaylists = [];
    this.originalOtherPublicPlaylists = [];
    this.filteredOtherPublicPlaylists = [];
    this.originalSingleListPlaylists = [];
    this.filteredSingleListPlaylists = [];

    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  private loadCombinedPlaylistsView(): void {
    this.isLoading = true;

    const myPlaylistsObs = this.playlistService.getCurrentUserPlaylists().pipe(
      tap(playlists => {
        // Intenta inferir currentUserId si no lo obtienes de AuthService
        if (!this.currentUserId && playlists.length > 0 && playlists[0].owner) {
          this.currentUserId = playlists[0].owner.id;
        }
      }),
      catchError(err => {
        console.error("Error cargando mis playlists:", err);
        this.errorMessage = (this.errorMessage ? this.errorMessage + "\n" : "") + "Error al cargar tus playlists.";
        return of([]);
      })
    );

    const publicPlaylistsObs = this.playlistService.getPublicPlaylists().pipe(
      catchError(err => {
        console.error("Error cargando playlists públicas:", err);
        this.errorMessage = (this.errorMessage ? this.errorMessage + "\n" : "") + "Error al cargar playlists públicas.";
        return of([]);
      })
    );

    this.dataSubscription = forkJoin({
      my: myPlaylistsObs,
      public: publicPlaylistsObs
    }).subscribe({
      next: ({ my, public: allPublic }) => {
        this.originalMyPlaylists = my;
        // Si currentUserId no se pudo inferir de 'my' (lista vacía),
        // y necesitas filtrar 'allPublic', podrías necesitar AuthService o no filtrar.
        // Por ahora, si currentUserId es null, no se filtrarán las propias de 'allPublic'.
        if (this.currentUserId) {
          this.originalOtherPublicPlaylists = allPublic.filter(p => p.owner.id !== this.currentUserId);
        } else {
          // Si no tenemos currentUserId, mostramos todas las públicas.
          // Esto podría incluir las propias si el usuario no tiene playlists y currentUserId no se pudo inferir.
          // Una mejor solución es tener AuthService.getCurrentUserId().
          console.warn("No se pudo determinar el ID del usuario actual para filtrar las playlists públicas; se mostrarán todas incluyendo las propias si son públicas.");
          this.originalOtherPublicPlaylists = allPublic;
        }

        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => { // Error general de forkJoin (aunque los catchError individuales deberían manejarlo)
        this.errorMessage = "Error cargando datos de playlists.";
        this.isLoading = false;
        console.error("Error en forkJoin:", err);
      }
    });
  }

  private loadSinglePlaylistList(observable: Observable<Playlist[]>): void {
    this.isLoading = true;
    this.dataSubscription = observable.pipe(
      tap(playlists => {
        this.originalSingleListPlaylists = playlists;
        this.applyFilters();
        this.isLoading = false;
      }),
      catchError(err => {
        this.errorMessage = 'Error al cargar las playlists. Inténtalo de nuevo más tarde.';
        console.error(err);
        this.originalSingleListPlaylists = [];
        this.filteredSingleListPlaylists = [];
        this.isLoading = false;
        return of([]);
      })
    ).subscribe();
  }

  applyFilters(): void {
    const lowerSearchTerm = this.searchTerm.toLowerCase().trim();

    if (this.listType === 'currentUser') {
      if (lowerSearchTerm !== '') {
        this.filteredMyPlaylists = this.originalMyPlaylists.filter(playlist =>
          this.matchesSearchTerm(playlist, lowerSearchTerm)
        );
        this.filteredOtherPublicPlaylists = this.originalOtherPublicPlaylists.filter(playlist =>
          this.matchesSearchTerm(playlist, lowerSearchTerm)
        );
      } else {
        this.filteredMyPlaylists = [...this.originalMyPlaylists];
        this.filteredOtherPublicPlaylists = [...this.originalOtherPublicPlaylists];
      }
    } else {
      // Filtrado para vistas de lista única
      if (lowerSearchTerm !== '') {
        this.filteredSingleListPlaylists = this.originalSingleListPlaylists.filter(playlist =>
          this.matchesSearchTerm(playlist, lowerSearchTerm)
        );
      } else {
        this.filteredSingleListPlaylists = [...this.originalSingleListPlaylists];
      }
    }
  }

  private matchesSearchTerm(playlist: Playlist, term: string): any {
    return playlist.name.toLowerCase().includes(term) ||
      (playlist.description && playlist.description.toLowerCase().includes(term)) ||
      (playlist.owner?.name && playlist.owner.name.toLowerCase().includes(term));
  }

  onSearchTermChange(): void {
    this.applyFilters();
  }

  handleViewDetails(playlistId: number): void {
    this.router.navigate(['/playlist', playlistId]); // Ajusta la ruta base si es necesario
  }

  handleEditPlaylist(playlistId: number): void {
    this.router.navigate(['/playlist', playlistId, 'edit']); // Ajusta la ruta base
  }

  handleDeletePlaylist(playlistId: number, fromWhichList: 'my' | 'other' | 'single'): void {
    this.playlistService.deletePlaylist(playlistId).subscribe({
      next: () => {
        alert('Playlist eliminada correctamente.');
        if (this.listType === 'currentUser') {
          this.loadCombinedPlaylistsView(); // Recargar ambas listas
        } else {
          const currentObservable = this.getCurrentSingleListObservable();
          if (currentObservable) {
            this.loadSinglePlaylistList(currentObservable);
          }
        }
      },
      error: (err) => {
        this.errorMessage = 'Error al eliminar la playlist.';
        console.error(err);
        alert(this.errorMessage);
      }
    });
  }

  private getCurrentSingleListObservable(): Observable<Playlist[]> | null {
    const userIdParam = this.route.snapshot.paramMap.get('userId');
    // No incluir 'currentUser' aquí ya que se maneja por loadCombinedPlaylistsView
    switch (this.listType) {
      case 'public': return this.playlistService.getPublicPlaylists();
      case 'userSpecific':
        return userIdParam ? this.playlistService.getPublicPlaylistsByOwner(+userIdParam) : of([]);
      default: return null;
    }
  }

  navigateToCreate(): void {
    this.router.navigate(['/playlist/new']); // Ajusta la ruta base
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }
}
