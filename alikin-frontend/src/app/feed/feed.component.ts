import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { PostService } from '../post/post.service';
import { PostResponse } from '../post/post.model';
import { Page } from '../shared/models/page.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent implements OnInit, OnDestroy {
  posts: PostResponse[] = [];
  page = 0;
  pageSize = 10;
  isLoading = false;
  hasMorePosts = true;
  private destroy$ = new Subject<void>();

  constructor(private postService: PostService) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    if (this.isLoading || !this.hasMorePosts) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.offsetHeight;

    if (scrollPosition >= documentHeight - 100) {
      this.loadPosts();
    }
  }

  loadPosts(): void {
    this.isLoading = true;
    this.postService.getPosts(this.page, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page: Page<PostResponse>) => {
          this.posts = [...this.posts, ...page.content];
          this.hasMorePosts = !page.last;
          this.page++;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar posts:', error);
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
