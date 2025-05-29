import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FeedControlService {
  private loadMoreRequest = new Subject<void>();
  loadMoreRequest$ = this.loadMoreRequest.asObservable();

  // BehaviorSubjects para que FeedComponent informe a LayoutComponent del estado
  private isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoading.asObservable();

  private hasMorePosts = new BehaviorSubject<boolean>(true);
  hasMorePosts$ = this.hasMorePosts.asObservable();

  constructor() { }

  // LayoutComponent llama a esto cuando el scroll llega al final
  requestLoadMore(): void {
    console.log('FeedControlService: requestLoadMore() llamado.'); // <--- AÑADE ESTO

    this.loadMoreRequest.next();
  }

  // FeedComponent llama a esto para actualizar el estado
  setLoading(loading: boolean): void {
    this.isLoading.next(loading);
  }

  setHasMore(hasMore: boolean): void {
    this.hasMorePosts.next(hasMore);
  }
}
