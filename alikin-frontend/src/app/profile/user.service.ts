import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {UserProfile, UserProfileUpdate} from "./UserProfile.model";
import {environment} from "../../enviroments/enviroment";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getCurrentUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`).pipe(
      map(user => {
        if (user.createdAt && typeof user.createdAt === 'string') {
          user.createdAt = new Date(user.createdAt);
        }
        if (user.birthDate && typeof user.birthDate === 'string') {
          // Mantener como string YYYY-MM-DD si el input de fecha lo prefiere, o convertir a Date
          // user.birthDate = new Date(user.birthDate);
        }
        return user;
      }),
      catchError(this.handleError)
    );
  }

  updateUserProfileData(userId: number, profileData: UserProfileUpdate): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/${userId}`, profileData).pipe(
      map(user => {
        return user;
      }),
      catchError(this.handleError)
    );
  }

  uploadProfilePicture(userId: number, imageFile: File): Observable<{ profilePictureUrl: string }> {
    const formData = new FormData();
    formData.append('avatarFile', imageFile, imageFile.name); // El backend esperará 'avatarFile' u otro nombre
    // Asume un endpoint como PUT /api/users/{userId}/avatar para la imagen
    return this.http.put<{ profilePictureUrl: string }>(`${this.apiUrl}/${userId}/avatar`, formData).pipe(
      catchError(this.handleError)
    );
  }

  removeProfilePicture(userId: number): Observable<UserProfile> {
    // Asume un endpoint como DELETE /api/users/{userId}/avatar para eliminar la imagen
    return this.http.delete<UserProfile>(`${this.apiUrl}/${userId}/avatar`).pipe(
      catchError(this.handleError)
    );
  }

  deleteCurrentUserAccount(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión de red.';
      } else if (error.error && error.error.message) {
        errorMessage = `${error.error.message}`;
      } else if (error.error && typeof error.error === 'string' && error.error.trim() !== '') {
        errorMessage = `${error.error}`;
      } else if (error.statusText && error.status !== 0) {
        errorMessage = `Error del servidor ${error.status}: ${error.statusText}`;
      } else if (error.status !== 0) {
        errorMessage = `Error del servidor ${error.status}.`;
      }
    }
    console.error('UserService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
