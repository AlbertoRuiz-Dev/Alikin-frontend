import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlaylistRoutingModule } from './playlist-routing.module';
import { PlaylistComponent } from './playlist.component';
import {PlaylistItemComponent} from "./playlist-item/playlist-item.component";
import {PlaylistListComponent} from "./playlist-list/playlist-list.component";
import {PlaylistDetailComponent} from "./playlist-detail/playlist-detail.component";
import {PlaylistFormComponent} from "./playlist-form/playlist-form.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {HttpClientModule} from "@angular/common/http";


@NgModule({
  declarations: [
    PlaylistComponent,
    PlaylistItemComponent,
    PlaylistListComponent,
    PlaylistDetailComponent,
    PlaylistFormComponent
  ],
  imports: [
    CommonModule,
    PlaylistRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ]
})
export class PlaylistModule { }
