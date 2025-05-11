import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { AuthGuard } from './core/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    canActivateChild: [AuthGuard], // ⬅️ importante: protege todas las hijas
    children: [
      {
        path: '',
        loadChildren: () => import('./home/home.module').then(m => m.HomeModule)
      },
      {
        path: 'me',
        loadChildren: () => import('./profile/profile.module').then(m => m.ProfileModule)
      },
      {
        path: 'communities',
        loadChildren: () => import('./communities/communities.module').then(m => m.CommunitiesModule)
      },
      {
        path: 'songs',
        loadChildren: () => import('./songs/songs.module').then(m => m.SongsModule)
      },
      {
        path: 'playlist',
        loadChildren: () => import('./playlist/playlist.module').then(m => m.PlaylistModule)
      }
    ]
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
