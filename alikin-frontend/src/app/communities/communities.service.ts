import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from "../../enviroments/enviroment";
import {CommunityResponse} from "./community-response";
import {MessageResponse} from "./message-response.model";
import {UserResponse} from "../models/user.model"; // Asegúrate que la ruta sea correcta

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

}
