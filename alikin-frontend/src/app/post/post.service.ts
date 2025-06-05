import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroment';
import { Page, PostResponse } from "./post.model";

export interface PageableRequest {
  page?: number;
  size?: number;
  sort?: string;
}

export interface CreatePostRequest {
  content: string;
  songId?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getGeneralFeedPosts(page: number, size: number): Observable<Page<PostResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<Page<PostResponse>>(`${this.apiUrl}/posts/feed`, { params });
  }

  getGlobalPostsWithoutCommunity(page: number, size: number): Observable<Page<PostResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<Page<PostResponse>>(`${this.apiUrl}/posts/feed/global`, { params });
  }

  createGeneralPostWithFormData(formData: FormData): Observable<PostResponse> {
    return this.http.post<PostResponse>(`${this.apiUrl}/posts/upload`, formData);
  }

  getCommunityPosts(communityId: number, pageable: PageableRequest = { page: 0, size: 15 }): Observable<Page<PostResponse>> {
    let params = new HttpParams();
    if (pageable.page !== undefined) {
      params = params.set('page', pageable.page.toString());
    }
    if (pageable.size !== undefined) {
      params = params.set('size', pageable.size.toString());
    }
    if (pageable.sort) {
      params = params.set('sort', pageable.sort);
    }
    return this.http.get<Page<PostResponse>>(`${this.apiUrl}/communities/${communityId}/posts`, { params });
  }

  createPostInCommunity(communityId: number, formData: FormData): Observable<PostResponse> {
    return this.http.post<PostResponse>(`${environment.apiUrl}/communities/${communityId}/posts`, formData);
  }

  voteForPost(postId: number, value: number): Observable<PostResponse> {
    return this.http.post<PostResponse>(`${this.apiUrl}/posts/${postId}/vote`, null, {
      params: { value: value.toString() }
    });
  }

  getPostById(postId: number): Observable<PostResponse> {
    return this.http.get<PostResponse>(`${this.apiUrl}/posts/${postId}`);
  }

  deletePost(postId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/posts/${postId}`);
  }
}

export interface SpringPage<T> {
  content: T[];
  pageable: {
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}
