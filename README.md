# Documentación del Frontend en Angular - Alikin

## Introducción

El frontend, implementado con Angular 15 y TypeScript, es una Single Page Application (SPA) diseñada para ofrecer una interfaz de usuario dinámica y reactiva. Permite a los usuarios gestionar canciones, playlists, comunidades, publicaciones y perfiles, consumiendo una API REST desarrollada con Spring Boot. El despliegue se realiza mediante Docker y Docker Compose, integrando el frontend con el backend y una base de datos PostgreSQL.

## Arquitectura General

El frontend de Alikin utiliza una arquitectura modular basada en las mejores prácticas de Angular:

- **Modularidad**: La aplicación está organizada en módulos de características (`AuthModule`, `CommunitiesModule`, etc.) con carga diferida (lazy loading) para optimizar el rendimiento.
- **Componentes Reutilizables**: Componentes estructurales como `NavbarComponent`, `SidebarComponent` y `MusicPlayerComponent` se integran en un `LayoutComponent` principal.
- **Programación Reactiva**: Se utiliza RxJS para gestionar el estado global (por ejemplo, autenticación) y eventos en tiempo real.
- **Estilos SCSS**: Los estilos están organizados con SCSS, con variables globales definidas en `src/assets/styles/_colors.scss` para mantener consistencia visual.
- **Comunicación con el Backend**: La aplicación consume la API REST del backend mediante `HttpClientModule`, con un proxy configurado para desarrollo.

## Estructura de Carpetas

La estructura del proyecto sigue las convenciones de Angular, diseñada para ser escalable y mantenible:

```
alikin-frontend/
├── src/
│   ├── app/
│   │   ├── auth/                    # Módulo para autenticación (login, registro)
│   │   │   ├── login/               # Componente de inicio de sesión
│   │   │   ├── register/            # Componente de registro
│   │   ├── communities/             # Módulo para gestionar comunidades
│   │   ├── community-detail/        # Detalles de una comunidad
│   │   ├── community-feed/          # Feed de publicaciones de una comunidad
│   │   ├── community-members/       # Miembros de una comunidad
│   │   ├── core/                    # Servicios y utilidades transversales
│   │   ├── create-community-modal/  # Modal para crear comunidades
│   │   ├── delete-community-modal/  # Modal para eliminar comunidades
│   │   ├── feed/                    # Feed general de publicaciones
│   │   ├── home/                    # Página principal
│   │   ├── layout/                  # Componentes estructurales
│   │   │   ├── navbar/              # Barra de navegación
│   │   │   ├── sidebar/             # Menú lateral
│   │   │   ├── music-player/        # Reproductor de música
│   │   ├── playlist/                # Módulo para playlists
│   │   │   ├── playlist-detail/     # Detalles de una playlist
│   │   │   ├── playlist-form/       # Formulario para crear/editar playlists
│   │   │   ├── playlist-item/       # Elemento de playlist
│   │   │   ├── playlist-list/       # Lista de playlists
│   │   ├── post/                    # Módulo para publicaciones
│   │   │   ├── post-item/           # Elemento de publicación
│   │   ├── profile/                 # Módulo para perfiles de usuario
│   │   ├── shared/                  # Directivas y modelos reutilizables
│   │   ├── songs/                   # Módulo para canciones
│   │   ├── app-routing.module.ts    # Rutas principales
│   │   ├── app.component.*          # Componente raíz
│   │   ├── app.module.ts            # Módulo raíz
│   │   ├── proxy.conf.json          # Configuración de proxy para desarrollo
│   ├── assets/                      # Recursos estáticos
│   │   ├── bgi/                     # Fondos (bgauth.jpg, bgposts.jpg)
│   │   ├── icons/                   # Iconos SVG (play.svg, pause.svg)
│   │   ├── images/                  # Imágenes predeterminadas (default-profile.jpg)
│   │   ├── styles/                  # Estilos SCSS (_colors.scss)
│   ├── environments/                # Configuraciones de entorno (environment.ts)
│   ├── index.html                   # Página HTML principal
│   ├── main.ts                      # Punto de entrada
│   ├── styles.scss                  # Estilos globales
├── Dockerfile                       # Configuración de Docker
├── nginx.conf                       # Configuración de Nginx
├── angular.json                     # Configuración de Angular CLI
├── package.json                     # Dependencias y scripts
├── tsconfig.json                    # Configuración de TypeScript
```

### Descripción de Directorios

- **src/app**: Contiene módulos, componentes, servicios y modelos organizados por funcionalidad.
- **src/assets**: Almacena recursos estáticos como imágenes (`alikin-logo.png`), iconos SVG (`play.svg`, `pause.svg`), y estilos SCSS (`_colors.scss`).
- **src/environments**: Define configuraciones para entornos de desarrollo y producción (`environment.ts`).
- **Dockerfile**: Configura el contenedor para el despliegue con Nginx.
- **nginx.conf**: Configuración del servidor web Nginx.
- **angular.json**: Configuración de Angular CLI, incluyendo opciones de compilación y estilos.

## Componentes Principales

Los componentes son la base de la interfaz de usuario, diseñados para ser reutilizables y modulares:

1. **LayoutComponent** (`src/app/layout/`)

   - Define la estructura visual principal de la aplicación.
   - Incluye `NavbarComponent` (barra de navegación superior), `SidebarComponent` (menú lateral), y `MusicPlayerComponent` (reproductor de música que aparece al reproducir canciones).
   - Archivos: `layout.component.html`, `layout.component.scss`, `layout.component.ts`.

2. **Auth Components** (`src/app/auth/`)

   - **LoginComponent**: Formulario para iniciar sesión, consume el endpoint `/api/auth/login`.
   - **RegisterComponent**: Formulario para registrar nuevos usuarios, consume `/api/auth/signup`.
   - Archivos: `login.component.*`, `register.component.*`.

3. **Communities Components** (`src/app/communities/`, `src/app/community-detail/`, etc.)

   - **CommunitiesComponent**: Lista todas las comunidades disponibles.
   - **CommunityDetailComponent**: Muestra detalles de una comunidad específica.
   - **CommunityFeedComponent**: Muestra publicaciones de una comunidad.
   - **CommunityMembersComponent**: Lista los miembros de una comunidad.
   - **CreateCommunityModalComponent** y **DeleteCommunityModalComponent**: Modales para crear y eliminar comunidades.

4. **Playlist Components** (`src/app/playlist/`)

   - **PlaylistComponent**: Lista de playlists del usuario o públicas.
   - **PlaylistDetailComponent**: Detalles de una playlist específica.
   - **PlaylistFormComponent**: Formulario para crear o editar playlists.
   - **PlaylistItemComponent** y **PlaylistListComponent**: Representan elementos y listas de playlists.

5. **Post Components** (`src/app/post/`)

   - **PostComponent**: Muestra publicaciones en el feed general.
   - **PostItemComponent**: Representa una publicación individual con opciones de votar o comentar.

6. **ProfileComponent** (`src/app/profile/`)

   - Permite visualizar y editar el perfil del usuario.

7. **SongsComponent** (`src/app/songs/`)

   - Lista canciones disponibles y permite reproducirlas mediante `MusicPlayerComponent`.

## Servicios

Los servicios gestionan la lógica de negocio y la comunicación con el backend:

1. **AuthService** (`src/app/core/auth.service.ts`)

   - Gestiona autenticación, registro y estado del usuario.
   - Utiliza un `BehaviorSubject` de RxJS para emitir cambios en tiempo real.
   - Ejemplo de código:

     ```typescript
     import { Injectable } from '@angular/core';
     import { HttpClient } from '@angular/common/http';
     import { BehaviorSubjectfeerSubject, Observable } from 'rxjs';
     import { tap } from 'rxjs/operators';
     import { AuthResponse } from './auth-response.model';
     
     @Injectable()
     export class AuthService {
       private userSubject = new BehaviorSubject<any>(null);
       user$ = this.userSubject.asObservable();
     
       constructor(private http: HttpClient) {}
     
       login(credentials: { username: string, password: string }): Observable<AuthResponse> {
         return this.http.post<AuthResponse>('/api/auth/login', credentials).pipe(
           tap(response => {
             localStorage.setItem('token', response.token);
             this.userSubject.next(response.user);
           })
         );
       }
     }
     ```

2. **CommunitiesService**, **PlaylistService**, **PostService**, **SongService**, **UserService**

   - Realizan operaciones CRUD consumiendo los endpoints de la API REST.
   - Ejemplo (`PlaylistService`):

     ```typescript
     import { Injectable } from '@angular/core';
     import { HttpClient } from '@angular/common/http';
     import { Observable } from 'rxjs';
     import { PlaylistResponse } from './models/playlist.model';
     
     @Injectable()
     export class PlaylistService {
       constructor(private http: HttpClient) {}
     
       createPlaylist(playlist: PlaylistRequest): Observable<PlaylistResponse> {
         return this.http.post<PlaylistResponse>('/api/playlists', playlist);
       }
     }
     ```

3. **MusicPlayerService** (`src/app/layout/music-player/music-player.service.ts`)

   - Controla la lógica del reproductor de música (play, pause).

4. **FeedControlService** (`src/app/layout/feed-control.service.ts`)

   - Gestiona el estado del feed de publicaciones.

## Módulos

La aplicación está organizada en módulos para facilitar el mantenimiento y la escalabilidad:

- **AppModule** (`src/app/app.module.ts`): Módulo raíz que importa módulos principales y configura la aplicación.
- **AuthModule**, **CommunitiesModule**, **PlaylistModule**, **PostModule**, **ProfileModule**, **SongsModule**, **HomeModule**, **LayoutModule**: Módulos de características con carga diferida (lazy loading).
- **CoreModule** (`src/app/core/core.module.ts`): Contiene servicios transversales (`AuthService`, `JwtInterceptor`, `AuthGuard`).
- **SharedModule** (`src/app/shared/shared.module.ts`): Incluye directivas (`DraggableDirective`) y modelos reutilizables (`PageModel`).

## Configuraciones de Seguridad

- **JwtInterceptor** (`src/app/core/jwt.interceptor.ts`): Añade el token JWT a las cabeceras de las peticiones HTTP.

  ```typescript
  import { Injectable } from '@angular/core';
  import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
  import { Observable } from 'rxjs';
  
  @Injectable()
  export class JwtInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
      const token = localStorage.getItem('token');
      if (token) {
        req = req.clone({
          setHeaders: { Authorization: `Bearer ${token}` }
        });
      }
      return next.handle(req);
    }
  }
  ```
- **AuthGuard** (`src/app/core/auth.guard.ts`): Protege rutas restringidas verificando la autenticación del usuario.
- **CORS**: Configurado en el backend, pero el frontend utiliza `proxy.conf.json` durante el desarrollo para redirigir peticiones al backend:

  ```json
  {
    "/api": {
      "target": "http://localhost:8080",
      "secure": false,
      "changeOrigin": true
    }
  }
  ```

## Configuración del Entorno

- **environment.ts** (`src/environments/environment.ts`): Define configuraciones para desarrollo.

  ```typescript
  export const environment = {
    production: false,
    apiUrl: 'http://localhost:8080/api'
  };
  ```
- **environment.prod.ts** (`src/environments/environment.prod.ts`): Configuraciones para producción.

  ```typescript
  export const environment = {
    production: true,
    apiUrl: 'https://albertoruiz-dev.tech/api'
  };
  ```

## Configuración de Angular CLI

El archivo `angular.json` configura el proyecto para compilación, estilos y pruebas:

- **Output Path**: `dist/alikin-frontend`
- **Styles**: Incluye `ngx-toastr/toastr.css` y `styles.scss`.
- **Budgets**:
  - Tamaño máximo inicial: 1MB (error), 500KB (advertencia).
  - Tamaño máximo por estilo de componente: 40KB (error y advertencia).
- **Development Configuration**: Desactiva optimizaciones y habilita mapas de origen.
- **Production Configuration**: Activa optimización y hash de salida.

## Despliegue con Docker

El frontend se despliega en un contenedor Docker con Nginx como servidor web, según el archivo `Dockerfile`:

```dockerfile
# Etapa de compilación
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa de ejecución
FROM nginx:alpine
COPY --from=build /app/dist/alikin-frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Configuración de Nginx

El archivo `nginx.conf` configura el servidor web para servir la aplicación Angular y manejar certificados SSL:

- Redirige peticiones a la API al backend.
- Soporta HTTPS mediante certificados en `/etc/letsencrypt`.

### Integración con Docker Compose

El archivo `docker-compose.yml` integra el frontend, el backend y la base de datos:

```yaml
version: '3.8'
services:
  app:
    build:
      context: ./Alikin-backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    depends_on:
      - db
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/alikin
      - SPRING_DATASOURCE_USERNAME=postgres
      - SPRING_DATASOURCE_PASSWORD=postgres
      - SPRING_JPA_HIBERNATE_DDL_AUTO=update
      - CORS_ALLOWED_ORIGIN=https://albertoruiz-dev.tech
      - APP_BASE_URL=https://albertoruiz-dev.tech
    volumes:
      - media-volume:/app/uploads
    networks:
      - app-network
  frontend:
    build:
      context: ./alikin-frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./data/nginx/letsencrypt:/etc/letsencrypt
      - ./data/nginx/www:/var/www/certbot
    depends_on:
      - app
    networks:
      - app-network
  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=alikin
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network
volumes:
  postgres_data:
  media-volume:
networks:
  app-network:
```

### Pasos para Desplegar

1. Asegúrese de tener Docker y Docker Compose instalados.
2. Navegue al directorio raíz del proyecto:

   ```bash
   cd alikin
   ```
3. Ejecute:

   ```bash
   docker-compose up --build
   ```
4. Acceda al frontend en `http://localhost` o `https://albertoruiz-dev.tech`.

## Instalación y Ejecución en Desarrollo

1. **Requisitos**:
   - Node.js (versión compatible con Angular 15).
   - NPM.
2. **Instalación**:

   ```bash
   cd alikin-frontend
   npm install
   ```
3. **Ejecución**:

   ```bash
   ng serve --proxy-config src/proxy.conf.json
   ```

   Acceda a `http://localhost:4200`.
4. **Build de Producción**:

   ```bash
   ng build --configuration production
   ```

   Los archivos generados estarán en `dist/alikin-frontend`.

## Librerías Utilizadas

- **RxJS**: Para programación reactiva y gestión de eventos.
- **ngx-toastr**: Para notificaciones en la interfaz.
- **Angular HttpClientModule**: Para comunicación con la API REST.
- **SCSS**: Para estilos personalizados y reutilizables.

## Estilos

- **Estilos Globales**: Definidos en `src/styles.scss`.
- **Variables SCSS**: Definidas en `src/assets/styles/_colors.scss` para mantener consistencia visual.
- Ejemplo de variables:

  ```scss
  $primary-color: #1db954;
  $background-dark: #121212;
  ```

## Mejoras:

- **Pruebas Unitarias**: Ampliar las pruebas en los archivos `*.spec.ts` usando Jasmine/Karma.
- **Optimización de Recursos**: Comprimir imágenes en `src/assets` para mejorar el rendimiento.
- **Monitoreo**: Implementar herramientas de monitoreo para el entorno de producción.
