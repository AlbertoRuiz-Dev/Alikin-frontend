import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {PlaylistListComponent} from "./playlist-list/playlist-list.component";
import {PlaylistFormComponent} from "./playlist-form/playlist-form.component";
import {PlaylistDetailComponent} from "./playlist-detail/playlist-detail.component";


const routes: Routes = [
  {
    path: '', // Ruta base para playlists (ej. /playlists)
    component: PlaylistListComponent,
    data: { listType: 'currentUser' } // Para mostrar las playlists del usuario actual por defecto
  },
  {
    path: 'new',
    component: PlaylistFormComponent
  },
  {
    path: 'public', // Para mostrar todas las playlists públicas (ej. /playlists/public)
    component: PlaylistListComponent,
    data: { listType: 'public' }
  },
  {
    path: 'user/:userId', // Playlists públicas de un usuario específico (ej. /playlists/user/123)
    component: PlaylistListComponent,
    data: { listType: 'userSpecific' }
  },
  {
    path: ':id', // Detalle de una playlist (ej. /playlists/456)
    component: PlaylistDetailComponent
  },
  {
    path: ':id/edit', // Editar una playlist (ej. /playlists/456/edit)
    component: PlaylistFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlaylistRoutingModule { }
