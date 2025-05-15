import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';
import { Page } from '../shared/models/page.model';
import {environment} from "../../enviroments/enviroment";
import {PostResponse} from "./post.model";

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private apiUrl = `${environment.apiUrl}/posts/upload`;

  constructor(private http: HttpClient) {}

  createPost(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData);
  }

  getPosts(page: number, size: number): Observable<Page<PostResponse>> {
    return this.http.get<Page<PostResponse>>(`${environment.apiUrl}/posts/feed`);
  }
}
