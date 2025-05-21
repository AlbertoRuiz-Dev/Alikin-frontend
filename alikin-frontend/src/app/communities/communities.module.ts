import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { CommunitiesComponent } from './communities.component';
import { CreateCommunityModalComponent } from '../create-community-modal/create-community-modal.component';
import {CommunitiesRoutingModule} from "./communities-routing.module";


@NgModule({
  declarations: [
    CommunitiesComponent,
    CreateCommunityModalComponent
  ],
  imports: [
    CommonModule,
    CommunitiesRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  exports: [
    CommunitiesComponent
  ]
})
export class CommunitiesModule { }
