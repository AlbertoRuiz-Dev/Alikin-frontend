import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from "../../enviroments/enviroment";

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(credentials: { usernameOrEmail: string, password: string }): Observable<any> {
    return this.http.post(`${this.API_URL}/login`, credentials);
  }

  signup(data: any): Observable<any> {
    return this.http.post(`${this.API_URL}/signup`, data);
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }

  getCurrentUser(): any {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }
}
