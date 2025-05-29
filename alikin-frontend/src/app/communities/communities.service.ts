import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {catchError, Observable, of, tap, throwError} from 'rxjs';
import { environment } from "../../enviroments/enviroment";
import {CommunityResponse} from "./community-response";
import {MessageResponse} from "./message-response.model";
import {UserResponse} from "../models/user.model";
import {RadioStationSearchResult} from "../community-detail/RadioStationSearchResult.model";
import {map} from "rxjs/operators"; // Asegúrate que la ruta sea correcta

@Injectable({
  providedIn: 'root'
})
export class CommunityService {
  private apiUrl = `${environment.apiUrl}/communities`;

  constructor(private http: HttpClient) {}



  getUserCommunities(): Observable<CommunityResponse[]> {
    return this.http.get<CommunityResponse[]>(`${this.apiUrl}/user`);
  }

  getAllCommunities(): Observable<CommunityResponse[]> {
    return this.http.get<CommunityResponse[]>(`${this.apiUrl}`);
  }

  createCommunity(formData: FormData): Observable<CommunityResponse> {

    return this.http.post<CommunityResponse>(this.apiUrl, formData);
  }

  joinCommunity(communityId: number): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/${communityId}/join`, {});
  }

  getCommunityById(id: number): Observable<CommunityResponse> {
    return this.http.get<CommunityResponse>(`${this.apiUrl}/${id}`);
  }

  deleteCommunity(communityId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${communityId}`);
  }

  getCommunityMembers(communityId: number): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.apiUrl}/${communityId}/members`);
  }


  updateCommunity(communityId: number, formData: FormData) {
    return this.http.put<CommunityResponse>(`${this.apiUrl}/${communityId}`, formData);
  }

  setCommunityRadioStation(communityId: number, stationName: string, streamUrl: string, stationLogoUrl: string | null): Observable<CommunityResponse> {
    const endpoint = `${this.apiUrl}/${communityId}/radio-station`;
    let params = new HttpParams()
      .set('stationName', stationName) // Asegúrate que stationName tenga valor
      .set('streamUrl', streamUrl);     // Asegúrate que streamUrl tenga valor
    if (stationLogoUrl) {
      params = params.set('stationLogoUrl', stationLogoUrl);
    }
    return this.http.put<CommunityResponse>(endpoint, null, { params }); // null como body si los params van en la URL
  }


  searchRadioStationsAPI(searchTerm: string): Observable<RadioStationSearchResult[]> {
    if (!searchTerm || !searchTerm.trim()) {
      return of([]); // Devuelve un observable con un array vacío si no hay término
    }

    const params = new HttpParams()
      .set('name', searchTerm)
      .set('limit', '25') // Puedes ajustar el límite
      .set('hidebroken', 'true')
      .set('order', 'clickcount')
      .set('reverse', 'true');

    // Es recomendable usar los servidores DNS de Radio Browser o elegir uno cercano.
    // Ver documentación: https://api.radio-browser.info/
    const radioApiUrl = 'https://de1.api.radio-browser.info/json/stations/search'; // Ejemplo de servidor

    return this.http.get<any[]>(radioApiUrl, { params }).pipe(
      map(apiStationsArray => {
        if (!apiStationsArray) return []; // Manejar respuesta vacía o inesperada de la API
        return apiStationsArray.map(station => ({
          id: station.stationuuid,
          name: station.name,
          streamUrl: station.url_resolved || station.url, // url_resolved suele ser más fiable
          favicon: station.favicon || null,
          country: station.countrycode || station.country || '', // countrycode es más estándar
          tags: station.tags || ''
        } as RadioStationSearchResult)); // Casting al tipo definido
      })
    );
  }


  kickCommunityMember(communityId: number, memberId: number): Observable<MessageResponse> {
    // El endpoint es DELETE /api/communities/{communityId}/members/{memberId}
    return this.http.delete<MessageResponse>(`${this.apiUrl}/${communityId}/members/${memberId}`)
      .pipe(
        tap(response => console.log('Respuesta de expulsión:', response)), // Opcional: para debugging
        catchError(this.handleError) // Manejo de errores
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido.';
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente o de red
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // El backend devolvió un código de respuesta no exitoso.
      // El cuerpo de la respuesta puede contener pistas sobre qué salió mal.
      if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión de red.';
      } else if (error.error && error.error.message) {
        errorMessage = `Error ${error.status}: ${error.error.message}`;
      } else {
        errorMessage = `Error ${error.status}: ${error.statusText}`;
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage)); // Devuelve un observable con un error descriptivo
  }

}
