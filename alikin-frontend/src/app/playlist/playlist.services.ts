// src/app/features/playlists/services/playlist.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from "../../enviroments/enviroment";
import {Playlist, PlaylistRequest} from "./models/playlist.model";
import {MessageResponse} from "../models/message-response.model";

@Injectable({
  providedIn: 'root' // O proveer en PlaylistsModule
})
export class PlaylistService {
  private apiUrl = `${environment.apiUrl}/playlists`; //

  constructor(private http: HttpClient) {}

  createPlaylist(data: FormData): Observable<Playlist> {
    return this.http.post<Playlist>(this.apiUrl, data); //
  }

  getPlaylistById(id: number): Observable<Playlist> {
    return this.http.get<Playlist>(`${this.apiUrl}/${id}`); //
  }

  updatePlaylist(id: number, data: FormData): Observable<Playlist> {
    return this.http.put<Playlist>(`${this.apiUrl}/${id}`, data); //
  }

  deletePlaylist(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`); //
  }

  addSongToPlaylist(playlistId: number, songId: number): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/${playlistId}/songs/${songId}`, {}); //
  }

  removeSongFromPlaylist(playlistId: number, songId: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/${playlistId}/songs/${songId}`); //
  }

  getCurrentUserPlaylists(): Observable<Playlist[]> {
    return this.http.get<Playlist[]>(`${this.apiUrl}/user`); //
  }

  getPublicPlaylistsByOwner(userId: number): Observable<Playlist[]> {
    return this.http.get<Playlist[]>(`${this.apiUrl}/user/${userId}`); //
  }

  getPublicPlaylists(): Observable<Playlist[]> {
    return this.http.get<Playlist[]>(`${this.apiUrl}/public`); //
  }
}
