import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from "../../enviroments/enviroment";

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor() {} // Puedes tener un constructor si necesitas inyectar otros servicios

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = localStorage.getItem('accessToken');
    // Verifica si la URL de la petición comienza con la URL de tu API backend
    const isApiUrl = request.url.startsWith(environment.apiUrl);

    if (token && isApiUrl) { // Solo añade la cabecera si hay token Y es una URL de tu API
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request);
  }
}
