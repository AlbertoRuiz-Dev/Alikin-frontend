import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { PostService } from '../post/post.service'; // Ajusta la ruta
import { PostResponse } from '../post/post.model'; // Ajusta la ruta
import { Page } from '../shared/models/page.model'; // Ajusta la ruta
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators'; // Importa finalize

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent implements OnInit, OnDestroy {
  posts: PostResponse[] = [];
  currentPage = 0; // Las páginas suelen ser basadas en 0 para el backend
  pageSize = 10;
  isLoading = false;
  hasMorePosts = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private postService: PostService) {} // Inyección correcta

  ngOnInit(): void {
    this.loadInitialPosts();
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    if (this.isLoading || !this.hasMorePosts) return;

    // Comprobación más robusta para el final del scroll
    const threshold = 150; // Píxeles desde el fondo para disparar la carga
    const position = window.innerHeight + window.scrollY;
    const height = document.body.offsetHeight;

    if (position >= height - threshold) {
      this.loadMorePosts();
    }
  }

  loadInitialPosts(): void {
    this.currentPage = 0;
    this.posts = [];
    this.hasMorePosts = true;
    this.error = null;
    this.fetchPosts(false);
  }

  loadMorePosts(): void {
    if (!this.hasMorePosts || this.isLoading) return;
    this.currentPage++;
    this.fetchPosts(true);
  }

  private fetchPosts(isLoadMore: boolean = false): void {
    this.isLoading = true;
    this.postService.getGeneralFeedPosts(this.currentPage, this.pageSize)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false) // Asegura que isLoading se ponga a false
      )
      .subscribe({
        next: (pageData: Page<PostResponse>) => {
          if (isLoadMore) {
            this.posts = [...this.posts, ...pageData.content];
          } else {
            this.posts = pageData.content;
          }
          this.hasMorePosts = !pageData.last;
          // this.currentPage ya se incrementó en loadMorePosts o se reseteó en loadInitialPosts
        },
        error: (err) => {
          console.error('Error al cargar posts del feed:', err);
          this.error = 'No se pudieron cargar las publicaciones.';
          // No resetear hasMorePosts aquí, podría ser un error temporal
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
