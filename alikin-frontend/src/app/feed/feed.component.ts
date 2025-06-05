import { Component, OnInit, OnDestroy } from '@angular/core';
import { PostService, SpringPage } from '../post/post.service';
import { PostResponse } from '../post/post.model';
import { Subject, throwError } from 'rxjs';
import { takeUntil, finalize, catchError } from 'rxjs/operators';
import { FeedControlService } from "../layout/feed-control.services";
// Asume que tienes un AuthService para obtener el ID del usuario actual
// import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent implements OnInit, OnDestroy {
  posts: PostResponse[] = [];
  currentPage = 0;
  pageSize = 10;
  protected _isLoading = false;
  protected _hasMorePosts = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  currentUserId: number | null = null; // Para pasarlo a post-item

  constructor(
    private postService: PostService,
    private feedControlService: FeedControlService
    // private authService: AuthService // Descomenta si usas AuthService
  ) {}

  ngOnInit(): void {
    const userFromStorage = localStorage.getItem('currentUser');

    if (userFromStorage) {
      try {
        const parsedUser = JSON.parse(userFromStorage);

        if (parsedUser && typeof parsedUser.id !== 'undefined' && parsedUser.id !== null) {
          const idValue = parsedUser.id;

          const numericId = Number(idValue); // Intentar convertir a número explícitamente

          if (!isNaN(numericId)) {
            this.currentUserId = numericId;
          } else {
            this.currentUserId = null;
          }
        } else {
          this.currentUserId = null;
        }
      } catch (e) {
        this.currentUserId = null;
      }
    } else {
      this.currentUserId = null;
    }
    this.loadInitialPosts();

    this.feedControlService.loadMoreRequest$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.posts.length > 0 || (this.currentPage === 0 && !this._isLoading)) {
          this.loadMorePosts();
        }
      });


    this.loadInitialPosts();

    this.feedControlService.loadMoreRequest$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.posts.length > 0 || (this.currentPage === 0 && !this._isLoading)) {
          this.loadMorePosts();
        }
      });
  }

  loadInitialPosts(): void {
    this.currentPage = 0;
    this.posts = [];
    this._hasMorePosts = true;
    this.feedControlService.setHasMore(true);
    this.error = null;
    this._isLoading = false;
    this.feedControlService.setLoading(false);
    this.fetchPosts(false);
  }

  loadMorePosts(): void {
    if (!this._hasMorePosts || this._isLoading) {
      return;
    }
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
    this.feedControlService.setLoading(true);

    this.postService.getGlobalPostsWithoutCommunity(this.currentPage, this.pageSize)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this._isLoading = false;
          this.feedControlService.setLoading(false);
        }),
        catchError(err => {
          console.error('Error al cargar posts del feed global:', err);
          this.error = err.message || 'No se pudieron cargar las publicaciones. Por favor, intenta de nuevo.';
          if (isLoadMore) {
            this.currentPage--;
          }
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
          } else if (!isLoadMore) {
            this.posts = [];
          }
          this._hasMorePosts = !pageData.last;
          this.feedControlService.setHasMore(this._hasMorePosts);
        }
      });
  }

  onPostDeleted(deletedPostId: number): void {
    this.posts = this.posts.filter(post => post.id !== deletedPostId);
  }

  trackByPostId(index: number, post: PostResponse): number {
    return post.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
