import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostComponent } from './post.component';
import { PostRoutingModule } from './post-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { PostItemComponent } from './post-item/post-item.component'; // ⬅️ IMPORTANTE


@NgModule({
  declarations: [PostComponent],
  imports: [
    CommonModule,
    HttpClientModule,
    PostRoutingModule,
    ReactiveFormsModule,  ]
})
export class PostModule {}
