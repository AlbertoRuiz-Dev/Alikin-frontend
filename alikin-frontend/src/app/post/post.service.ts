import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroment';
import {Page, PostResponse} from "./post.model"; // Ajusta la ruta

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
  private apiUrl = environment.apiUrl; // URL base de tu API

  constructor(private http: HttpClient) { }

  // Para el FeedComponent (feed general)
  getGeneralFeedPosts(page: number, size: number): Observable<Page<PostResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<Page<PostResponse>>(`${this.apiUrl}/posts/feed`, { params });
  }

  // Para PostComponent (creación general de post, maneja FormData para archivos)
  // Este llamará al endpoint /api/posts/upload o /api/posts que maneje multipart
  createGeneralPostWithFormData(formData: FormData): Observable<PostResponse> {
    // Asume que tu endpoint general de creación de posts que acepta FormData está en /api/posts o /api/posts/upload
    // Si tu PostController @PostMapping sin path específico es /api/posts y maneja @RequestBody,
    // y el @PostMapping(path="/upload") maneja FormData, entonces necesitas dos métodos o que el backend sea flexible.
    // Por ahora, asumiré que el endpoint /api/posts/upload es el que maneja FormData.
    return this.http.post<PostResponse>(`${this.apiUrl}/posts/upload`, formData);
  }

  // Para CommunityFeedComponent (obtener posts de una comunidad específica)
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

  // Para CommunityFeedComponent (crear post de texto en una comunidad)
  createPostInCommunity(communityId: number, formData: FormData): Observable<PostResponse> {
    // HttpClient manejará el Content-Type como multipart/form-data automáticamente
    return this.http.post<PostResponse>(`${environment.apiUrl}/communities/${communityId}/posts`, formData);
  }

  // Para PostItemComponent (votar un post)
  voteForPost(postId: number, value: number): Observable<PostResponse> {
    // El cuerpo es null porque el valor va como parámetro de la petición
    return this.http.post<PostResponse>(`${this.apiUrl}/posts/${postId}/vote`, null, {
      params: { value: value.toString() }
    });
  }

  // Método para obtener un post por ID (usado por PostController en backend, podría ser útil en frontend)
  getPostById(postId: number): Observable<PostResponse> {
    return this.http.get<PostResponse>(`${this.apiUrl}/posts/${postId}`);
  }

  // Método para establecer el estado de voto del usuario (usado por PostController en backend)
  // Si lo necesitas en el frontend, podría quedar aquí o en un servicio de estado de UI.
  // Por ahora, lo comento ya que la lógica de voto en PostItemComponent actualiza el post localmente.
  // setUserVoteStatus(post: PostResponse, userId: number): void { ... }


  // El método getUserIdByEmail que tenías en tu PostService de backend.
  // En Angular, la obtención del ID del usuario actual suele manejarse a través de un AuthService
  // que guarda la información del usuario tras el login.
  // Si necesitas este método aquí por alguna razón específica, asegúrate de que tenga sentido en el contexto del frontend.
  // Por ahora, lo omito, asumiendo que el userId se obtiene de otra fuente (ej. AuthService).
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
  number: number; // Número de la página actual (basado en 0)
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}
