import { Component, Input, OnInit, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../../enviroments/enviroment';
import { MusicPlayerService } from "../../layout/music-player/music-player.service";
import { PostService } from '../post.service';
import { PostResponse } from "../post.model";
import { CommentService } from "../../comment/comment.service";
import { Comment } from '../../comment/comment.model';
// Asume que tienes un AuthService para obtener el ID del usuario actual
// import { AuthService } from '../../auth/auth.service'; // Descomenta y ajusta la ruta

@Component({
  selector: 'app-post-item',
  templateUrl: './post-item.component.html',
  styleUrls: ['./post-item.component.scss']
})
export class PostItemComponent implements OnInit {
  @Input() post!: PostResponse;
  @Input() currentUserId: number | null = null; // Alternativa si no usas AuthService
  @Output() postDeleted = new EventEmitter<number>();

  expandedImageUrl?: string;
  private readonly backendImageUrlBase = `${environment.mediaUrl}`;

  comments: Comment[] = [];
  showComments = false;
  isLoadingComments = false;
  commentsError: string | null = null;
  commentForm!: FormGroup;
  isSubmittingComment = false;
  submitCommentError: string | null = null;

  isOwner = false;
  showDropdown = false;

  constructor(
    private musicService: MusicPlayerService,
    private postService: PostService,
    private commentService: CommentService,
    private fb: FormBuilder,
    private elementRef: ElementRef
    // private authService: AuthService // Descomenta si usas AuthService
  ) {}

  ngOnInit(): void {
    this.commentForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(1000)]]
    });


    if (this.currentUserId != null && this.post?.user?.id != null) {
      // Convertir ambos a número para una comparación segura
      const numCurrentUserId = +this.currentUserId;
      const numPostOwnerId = +this.post.user.id;

      this.isOwner = numCurrentUserId === numPostOwnerId;
    } else {
      this.isOwner = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.showDropdown && !this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
  }

  deletePost(): void {
    if (!this.isOwner || !this.post || this.post.id === undefined) {
      console.error("No se puede eliminar: no es propietario o falta ID del post.");
      return;
    }
    if (confirm('¿Estás seguro de que quieres eliminar este post? Esta acción no se puede deshacer.')) {
      this.postService.deletePost(this.post.id).subscribe({
        next: () => {
          this.postDeleted.emit(this.post.id);
          this.showDropdown = false;
          // Considera mostrar un toast de éxito aquí
        },
        error: (err) => {
          console.error('Error al eliminar el post:', err);
          alert(err.error?.message || 'No se pudo eliminar el post.');
          this.showDropdown = false;
        }
      });
    } else {
      this.showDropdown = false;
    }
  }

  private handleVoteResponse(newVoteValue: number, response: PostResponse) {
    this.post.userVote = newVoteValue;
    this.post.voteCount = response.voteCount;
  }

  private handleVoteError(action: string, error: any) {
    console.error(`${action} failed`, error);
  }

  vote(value: number): void {
    if (!this.post || this.post.id === undefined) return;
    const newVoteToSend = this.post.userVote === value ? 0 : value;
    this.postService.voteForPost(this.post.id, newVoteToSend).subscribe({
      next: (response) => this.handleVoteResponse(newVoteToSend, response),
      error: (err) => this.handleVoteError(`Vote (value: ${newVoteToSend})`, err)
    });
  }

  getImageUrl(relativePath?: string | null): string {
    if (!relativePath) return 'assets/default-profile.jpg';
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }
    const base = this.backendImageUrlBase.endsWith('/') ? this.backendImageUrlBase : this.backendImageUrlBase + '/';
    const path = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    return `${base}${path}`;
  }

  expandImage(): void {
    if (this.post.imageUrl) {
      this.expandedImageUrl = this.getImageUrl(this.post.imageUrl);
    }
  }

  closeImage(): void {
    this.expandedImageUrl = undefined;
  }

  getSongStreamUrl(songId?: number): string | null {
    if (songId === undefined || songId === null) return null;
    return `${environment.apiUrl}/songs/${songId}/stream`;
  }

  playSong(): void {
    if (!this.post.song || this.post.song.id === undefined) return;
    const streamUrl = this.getSongStreamUrl(this.post.song.id);
    if (!streamUrl) return;
    this.musicService.playSong({
      title: this.post.song.title,
      artist: this.post.song.artist || 'Artista Desconocido',
      coverImageUrl: this.getImageUrl(this.post.song.coverImageUrl),
      streamUrl: streamUrl
    });
  }

  toggleComments(): void {
    this.showComments = !this.showComments;
    if (this.showComments && this.comments.length === 0 && !this.commentsError) {
      this.loadComments();
    }
  }

  loadComments(): void {
    if (!this.post || this.post.id === undefined) return;
    this.isLoadingComments = true;
    this.commentsError = null;
    this.commentService.getCommentsForPost(this.post.id).subscribe({
      next: (comments) => {
        this.comments = comments;
        this.isLoadingComments = false;
      },
      error: (err) => {
        console.error('Error loading comments', err);
        this.commentsError = 'No se pudieron cargar los comentarios.';
        this.isLoadingComments = false;
      }
    });
  }

  onCommentSubmit(): void {
    if (this.commentForm.invalid || !this.post.id) {
      this.commentForm.markAllAsTouched();
      return;
    }

    this.isSubmittingComment = true;
    this.submitCommentError = null;
    const commentData = { content: this.commentForm.value.content };

    this.commentService.addComment(this.post.id, commentData).subscribe({
      next: (newComment) => {
        this.comments.unshift(newComment);
        this.commentForm.reset();
        this.post.commentsCount = (this.post.commentsCount || 0) + 1;
        this.isSubmittingComment = false;
      },
      error: (err) => {
        console.error('Error submitting comment', err);
        this.submitCommentError = err.error?.message || 'Error al enviar el comentario. Inténtalo de nuevo.';
        this.isSubmittingComment = false;
      }
    });
  }

  getCommentUserInitials(user: { nickname: string | null, name: string }): string {
    const nameToUse = user.nickname || user.name;
    return nameToUse ? nameToUse.substring(0, 1).toUpperCase() : '?';
  }
}
