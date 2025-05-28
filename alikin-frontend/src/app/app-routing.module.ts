import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { AuthGuard } from './core/auth.guard';
import {FeedComponent} from "./feed/feed.component";
import {CommunityDetailComponent} from "./community-detail/community-detail.component";

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    canActivateChild: [AuthGuard],
    children: [
      {
        path: '', // Ruta principal para el FeedComponent
        component: FeedComponent,
        data: { pageType: 'feed' } // <--- AÑADIDO: Identificador para el feed principal
      },
      {
        path: 'me',
        loadChildren: () => import('./profile/profile.module').then(m => m.ProfileModule),
        data: { pageType: 'profile' } // Opcional, si necesitas identificarla
      },
      {
        path: 'communities',
        loadChildren: () => import('./communities/communities.module').then(m => m.CommunitiesModule),
        data: { pageType: 'communities' } // Mantenemos para consistencia, indica full-width por defecto
      },
      {
        path: 'community/:id',
        component: CommunityDetailComponent,
        data: { pageType: 'communityDetail' }
      },
      {
        path: 'songs',
        loadChildren: () => import('./songs/songs.module').then(m => m.SongsModule),
        data: { pageType: 'songs' }
      },
      {
        path: 'playlist',
        loadChildren: () => import('./playlist/playlist.module').then(m => m.PlaylistModule),
        data: { pageType: 'playlist' }
      }
    ]
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  { path: 'post', loadChildren: () => import('./post/post.module').then(m => m.PostModule) },
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
