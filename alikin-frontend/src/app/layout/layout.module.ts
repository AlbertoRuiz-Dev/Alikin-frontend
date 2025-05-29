import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from './layout.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NavbarComponent } from './navbar/navbar.component';
import { MusicPlayerComponent } from './music-player/music-player.component';
import { RouterModule } from '@angular/router';
import {FormsModule} from "@angular/forms";
import {InfiniteScrollModule} from "ngx-infinite-scroll";

@NgModule({
  declarations: [
    LayoutComponent,
    SidebarComponent,
    NavbarComponent,
    MusicPlayerComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    InfiniteScrollModule,

  ],
  exports: [
    LayoutComponent
  ]
})
export class LayoutModule {}
