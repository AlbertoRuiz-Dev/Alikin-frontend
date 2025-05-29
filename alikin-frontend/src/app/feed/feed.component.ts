// src/app/feed/feed.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { PostService, SpringPage } from '../post/post.service'; // Ajusta la ruta
import { PostResponse } from '../post/post.model'; // Ajusta la ruta
import { Subject } from 'rxjs';
import { takeUntil, finalize, catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import {FeedControlService} from "../layout/feed-control.services";

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent implements OnInit, OnDestroy {
  posts: PostResponse[] = [];
  currentPage = 0;
  pageSize = 10;
  // isLoading y hasMorePosts ahora se gestionan/informan a través del servicio
  // pero mantenemos variables locales para la lógica interna del fetch si es necesario.
  // La directiva en LayoutComponent usará los valores del servicio.
  protected _isLoading = false;
  protected _hasMorePosts = true;

  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private postService: PostService,
    private feedControlService: FeedControlService // <-- INYECTA EL SERVICIO
  ) {}

  ngOnInit(): void {
    this.loadInitialPosts();

    this.feedControlService.loadMoreRequest$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('FeedComponent: Recibida solicitud de loadMoreRequest$ del servicio.'); // <--- AÑADE ESTO
        if (this.posts.length > 0 || this.currentPage === 0 && !this._isLoading) { // Permitir cargar más si es la carga inicial aunque posts esté vacío
          this.loadMorePosts();
        } else {
          console.log('FeedComponent: Solicitud de cargar más ignorada. Posts:', this.posts.length, 'isLoading:', this._isLoading);
        }
      });
  }

  loadInitialPosts(): void {
    this.currentPage = 0;
    this.posts = [];
    this._hasMorePosts = true; // Resetea estado local
    this.feedControlService.setHasMore(true); // Informa al servicio
    this.error = null;
    this._isLoading = false; // Resetea estado local
    this.feedControlService.setLoading(false); // Informa al servicio
    this.fetchPosts(false);
  }

  loadMorePosts(): void {
    console.log('FeedComponent: loadMorePosts() llamado.'); // <--- AÑADE ESTO
    if (!this._hasMorePosts || this._isLoading) {
      console.log(`FeedComponent: Carga de más posts detenida. HasMore: ${this._hasMorePosts}, IsLoading: ${this._isLoading}`);
      return;
    }
    console.log(`FeedComponent: Incrementando página a ${this.currentPage + 1} y llamando a fetchPosts.`);
    this.currentPage++;
    this.fetchPosts(true);
  }

  retryLoad(): void {
    this.error = null;
    this.fetchPosts(this.posts.length > 0 && this.currentPage > 0);
  }

  private fetchPosts(isLoadMore: boolean): void {
    if (this._isLoading) return;

    this._isLoading = true;
    this.feedControlService.setLoading(true); // Informa al servicio

    this.postService.getGeneralFeedPosts(this.currentPage, this.pageSize)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this._isLoading = false;
          this.feedControlService.setLoading(false); // Informa al servicio al finalizar
        }),
        catchError(err => {
          console.error('Error al cargar posts del feed:', err);
          this.error = err.message || 'No se pudieron cargar las publicaciones. Por favor, intenta de nuevo.';
          if (isLoadMore) {
            this.currentPage--; // Revertir si falló al cargar más
          }
          // this.feedControlService.setHasMore(false); // Opcional: Considera si en error se debe detener el scroll
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (pageData: SpringPage<PostResponse>) => {
          this.error = null;
          if (pageData.content && pageData.content.length > 0) {
            if (isLoadMore) {
              this.posts = [...this.posts, ...pageData.content];
            } else {
              this.posts = pageData.content;
            }
          } else if (!isLoadMore) { // No hay contenido en la carga inicial
            this.posts = [];
          }
          this._hasMorePosts = !pageData.last;
          this.feedControlService.setHasMore(this._hasMorePosts); // Informa al servicio
        }
      });
  }

  trackByPostId(index: number, post: PostResponse): number {
    return post.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
