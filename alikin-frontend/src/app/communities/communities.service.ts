import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from "../../enviroments/enviroment";
import {CommunityRequest} from "../create-community-modal/community-request.model";
import {CommunityResponse} from "./community-response"; // Asegúrate que la ruta sea correcta

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
}
