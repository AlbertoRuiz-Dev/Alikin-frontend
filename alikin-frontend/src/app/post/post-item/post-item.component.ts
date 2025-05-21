import { Component, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PostResponse } from '../post.model';
import { environment } from '../../../enviroments/enviroment';
import {MusicPlayerService} from "../../layout/music-player/music-player.service";

@Component({
  selector: 'app-post-item',
  templateUrl: './post-item.component.html',
  styleUrls: ['./post-item.component.scss']
})
export class PostItemComponent {
  @Input() post!: PostResponse;
  expandedImageUrl?: string;

  constructor(
    private http: HttpClient,
    private musicService: MusicPlayerService
  ) {}

  upvote(): void {
    const newVote = this.post.userVote === 1 ? 0 : 1;
    this.http.post<PostResponse>(
      `${environment.apiUrl}/posts/${this.post.id}/vote`,
      null,
      { params: { value: newVote.toString() } }
    ).subscribe({
      next: (response) => {
        this.post.userVote = newVote;
        this.post.voteCount = response.voteCount;
      },
      error: (err) => console.error('Upvote failed', err)
    });
  }

  downvote(): void {
    const newVote = this.post.userVote === -1 ? 0 : -1;
    this.http.post<PostResponse>(
      `${environment.apiUrl}/posts/${this.post.id}/vote`,
      null,
      { params: { value: newVote.toString() } }
    ).subscribe({
      next: (response) => {
        this.post.userVote = newVote;
        this.post.voteCount = response.voteCount;
      },
      error: (err) => console.error('Downvote failed', err)
    });
  }

  getImageUrl(path?: string | null): string {
    if (!path) return 'assets/images/default-cover.png'; // O una imagen por defecto
    return path.startsWith('http') ? path : `${environment.mediaUrl}${path}`;
  }


  expandImage(): void {
    this.expandedImageUrl = this.getImageUrl(this.post.imageUrl || '');
  }

  closeImage(): void {
    this.expandedImageUrl = undefined;
  }

  getSongStreamUrl(songId: number): string {
    return `${environment.apiUrl}/songs/${songId}/stream`;
  }

  playSong(): void {
    if (!this.post.song) return;

    this.musicService.playSong({
      title: this.post.song.title,
      artist: this.post.song.artist,
      coverImageUrl: this.getImageUrl(this.post.song.coverImageUrl),
      streamUrl: this.getSongStreamUrl(this.post.song.id)
    });
  }

  getSongUrl(path?: string): string {
    if (!path) return '';
    return path.startsWith('http') ? path : `${environment.mediaUrl}${path}`;
  }

}
