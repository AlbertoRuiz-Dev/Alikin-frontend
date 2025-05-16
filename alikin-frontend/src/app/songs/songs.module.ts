import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SongsRoutingModule } from './songs-routing.module';
import { SongsComponent } from './songs.component';
import {ReactiveFormsModule} from "@angular/forms";


@NgModule({
  declarations: [
    SongsComponent
  ],
  imports: [
    CommonModule,
    SongsRoutingModule,
    ReactiveFormsModule,
  ]
})
export class SongsModule { }
