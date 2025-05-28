import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comment, CommentRequest } from './comment.model';
import {environment} from "../../enviroments/enviroment";

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = `${environment.apiUrl}/comments`;

  constructor(private http: HttpClient) { }

  getCommentsForPost(postId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/post/${postId}`);
  }

  addComment(postId: number, commentData: CommentRequest): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/post/${postId}`, commentData);
  }

  // Opcional: Métodos para actualizar y eliminar (no implementados en el componente en esta fase)
  /*
  updateComment(commentId: number, commentData: CommentRequest): Observable<Comment> {
    return this.http.put<Comment>(`${this.apiUrl}/${commentId}`, commentData);
  }

  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${commentId}`);
  }
  */
}
