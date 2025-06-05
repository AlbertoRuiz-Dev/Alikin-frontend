import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Page, PostResponse } from "../post/post.model";
import { Song } from "../songs/song.model";
import { environment } from "../../enviroments/enviroment";
import { PageableRequest, PostService } from "../post/post.service";
import { SongService } from "../songs/song.service";
import { MusicPlayerService } from "../layout/music-player/music-player.service";
import { CommentService } from "../comment/comment.service";
import { Comment as AppComment, CommentRequest } from '../comment/comment.model';

@Component({
  selector: 'app-community-feed',
  templateUrl: './community-feed.component.html',
  styleUrls: ['./community-feed.component.scss']
})
export class CommunityFeedComponent implements OnInit, OnChanges {
  @Input() communityId!: number;
  @Input() currentUserRole: 'LEADER' | 'MEMBER' | 'VISITOR' = 'VISITOR';
  @Input() currentUserId: number | null = null; // NUEVO INPUT para el ID del usuario actual

  posts: PostResponse[] = [];
  isLoadingPosts = false;
  postsError: string | null = null;

  currentPage = 0;
  pageSize = 15;
  totalPages = 0;
  hasMorePosts = true;

  newPostForm!: FormGroup;
  isSubmittingPost = false;
  postSubmitError: string | null = null;

  selectedImageFile: File | null = null;
  imagePreviewUrl: string | ArrayBuffer | null = null;
  availableSongs: Song[] = [];
  isLoadingSongs = false;
  commentForms = new Map<number, FormGroup>();

  showDropdownMap = new Map<number, boolean>(); // Para manejar desplegables por post

  private readonly backendImageUrlBase = `${environment.mediaUrl || 'http://localhost:8080'}`;

  @ViewChild('postListContainer') postListContainer!: ElementRef;
  @ViewChild('imageFileInput') imageFileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private postService: PostService,
    private songService: SongService,
    private fb: FormBuilder,
    private musicService: MusicPlayerService,
    private commentService: CommentService,
    private elementRef: ElementRef // Para cerrar desplegables al hacer clic fuera
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Cerrar todos los desplegables si el clic es fuera de ellos
    // Esto es una implementación simple. Podría mejorarse para no cerrar si se
    // hace clic en el propio botón que lo abrió de nuevo.
    let closeAll = true;
    this.showDropdownMap.forEach((value, key) => {
      // Necesitaríamos una referencia al elemento del botón del menú para una lógica más precisa
      // Por ahora, cerramos todos si el clic no está contenido en este componente general.
      // Para una mejor UX, cada post-item (si fuera un componente) manejaría su propio clic fuera.
      // Como aquí es una lista, es más complejo.
    });
    // Para simplificar: si un dropdown está abierto y se hace clic en cualquier lugar,
    // la lógica de toggleDropdown debería manejar el cierre si se hace clic en el mismo botón.
    // Un clic genérico fuera podría requerir que cada botón tenga una ref.
    // Vamos a mantenerlo simple: el toggle lo maneja, y el borrado lo cierra.
  }


  ngOnInit(): void {
    this.initNewPostForm();
    if (this.communityId) {
      this.loadInitialPosts();
    }
    if (this.canPost()) {
      this.loadAvailableSongs();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['communityId'] && !changes['communityId'].firstChange && changes['communityId'].currentValue) {
      this.resetAndLoadPosts();
    }
    if (changes['currentUserRole']) {
      this.updateFormBasedOnRole();
      if (this.canPost() && this.availableSongs.length === 0 && !this.isLoadingSongs) {
        this.loadAvailableSongs();
      }
    }
    // Podríamos necesitar recalcular isOwner para los posts si currentUserId cambia,
    // pero currentUserId se establece en ngOnInit del padre y se pasa una vez.
  }

  isOwner(post: PostResponse): boolean {
    if (!this.currentUserId || !post || !post.user) {
      return false;
    }
    return this.currentUserId === post.user.id;
  }

  toggleDropdown(post: PostResponse, event: Event): void {
    event.stopPropagation(); // Evita que el HostListener lo cierre inmediatamente
    const currentState = this.showDropdownMap.get(post.id) || false;
    // Cierra todos los demás desplegables
    this.showDropdownMap.forEach((value, key) => {
      if (key !== post.id) {
        this.showDropdownMap.set(key, false);
      }
    });
    this.showDropdownMap.set(post.id, !currentState);
  }

  deletePost(postId: number, event: Event): void {
    event.stopPropagation();
    if (confirm('¿Estás seguro de que quieres eliminar este post? Esta acción no se puede deshacer.')) {
      this.postService.deletePost(postId).subscribe({
        next: () => {
          this.posts = this.posts.filter(p => p.id !== postId);
          this.showDropdownMap.set(postId, false); // Cierra el desplegable
          // Considera mostrar un toast de éxito
        },
        error: (err) => {
          console.error('Error al eliminar el post:', err);
          alert(err.error?.message || 'No se pudo eliminar el post.');
          this.showDropdownMap.set(postId, false); // Cierra el desplegable
        }
      });
    } else {
      this.showDropdownMap.set(postId, false); // Cierra si cancela
    }
  }

  initNewPostForm(): void {
    this.newPostForm = this.fb.group({
      content: ['', [Validators.maxLength(2000)]],
      songId: [null]
    });
    this.updateFormBasedOnRole();
  }

  private initCommentFormForPost(postId: number): void {
    if (!this.commentForms.has(postId)) {
      this.commentForms.set(postId, this.fb.group({
        content: ['', [Validators.required, Validators.maxLength(1000)]]
      }));
    }
  }

  getCommentForm(postId: number): FormGroup | undefined {
    return this.commentForms.get(postId);
  }

  toggleComments(post: PostResponse): void {
    post.uiShowComments = !post.uiShowComments;
    if (post.uiShowComments) {
      this.initCommentFormForPost(post.id);
      if (!post.uiComments || post.uiComments.length === 0) {
        this.loadComments(post);
      }
    }
  }

  loadComments(post: PostResponse): void {
    if (!post || post.id === undefined) return;
    post.uiIsLoadingComments = true;
    post.uiCommentsError = null;
    this.commentService.getCommentsForPost(post.id).subscribe({
      next: (commentsFromService: AppComment[]) => {
        post.uiComments = commentsFromService as any;
        post.uiIsLoadingComments = false;
      },
      error: (err) => {
        post.uiCommentsError = 'No se pudieron cargar los comentarios.';
        post.uiIsLoadingComments = false;
      }
    });
  }


  onCommentSubmit(post: PostResponse): void {
    const form = this.commentForms.get(post.id);
    if (!form) return;
    if (!post.id) {
      form.markAllAsTouched();
      return;
    }
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }
    post.uiIsSubmittingComment = true;
    post.uiSubmitCommentError = null;
    const commentData: CommentRequest = { content: form.value.content };

    this.commentService.addComment(post.id, commentData).subscribe({
      next: (newComment: AppComment) => {
        if (!post.uiComments) {
          post.uiComments = [];
        }
        post.uiComments.unshift(newComment as any);
        form.reset();
        post.commentsCount = (post.commentsCount || 0) + 1;
        post.uiIsSubmittingComment = false;
      },
      error: (err) => {
        post.uiSubmitCommentError = err.error?.message || 'Error al enviar. Inténtalo de nuevo.';
        post.uiIsSubmittingComment = false;
      }
    });
  }

  getCommentUserInitials(user: { nickname: string | null, name: string }): string {
    const nameToUse = user.nickname || user.name;
    return nameToUse ? nameToUse.substring(0, 1).toUpperCase() : '?';
  }

  updateFormBasedOnRole(): void {
    if (this.canPost()) {
      this.newPostForm?.enable();
    } else {
      this.newPostForm?.disable();
    }
  }

  loadAvailableSongs(): void {
    this.isLoadingSongs = true;
    this.songService.getAvailableSongs().subscribe({
      next: (response) => {
        if (response && 'content' in response && Array.isArray(response.content)) {
          this.availableSongs = response.content;
        }
        else if (Array.isArray(response)) {
          this.availableSongs = response;
        }
        else {
          this.availableSongs = [];
        }
        this.isLoadingSongs = false;
      },
      error: (err) => {
        this.availableSongs = [];
        this.isLoadingSongs = false;
      }
    });
  }

  onImageFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;

    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Tipo de archivo no permitido para imagen. Sube JPG, PNG o GIF.');
        this.clearImageSelection();
        return;
      }
      this.selectedImageFile = file;
      const reader = new FileReader();
      reader.onload = () => this.imagePreviewUrl = reader.result;
      reader.readAsDataURL(file);
    } else {
      this.clearImageSelection();
    }
  }

  clearImageSelection(): void {
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
    if (this.imageFileInput && this.imageFileInput.nativeElement) {
      this.imageFileInput.nativeElement.value = "";
    }
  }

  onPostSubmit(): void {
    const contentValue = this.newPostForm.value.content?.trim();
    const songIdValue = this.newPostForm.value.songId;
    const hasContent = contentValue && contentValue.length > 0;
    const hasImage = !!this.selectedImageFile;
    const hasSongSelected = !!songIdValue;

    if (!this.canPost() || this.isSubmittingPost || (!hasContent && !hasImage && !hasSongSelected)) {
      if (!hasContent && !hasImage && !hasSongSelected) {
        this.postSubmitError = 'El post debe tener contenido, una imagen o una canción seleccionada.';
      }
      this.newPostForm.markAllAsTouched();
      return;
    }

    this.isSubmittingPost = true;
    this.postSubmitError = null;

    const formData = new FormData();
    formData.append('content', contentValue || '');

    if (songIdValue) {
      formData.append('songId', songIdValue.toString());
    }

    if (this.selectedImageFile) {
      formData.append('imageFile', this.selectedImageFile, this.selectedImageFile.name);
    }

    this.postService.createPostInCommunity(this.communityId, formData).subscribe({
      next: (newPost) => {
        this.resetAndLoadPosts();
        this.newPostForm.reset({ songId: null });
        this.clearImageSelection();
        this.isSubmittingPost = false;
      },
      error: (err) => {
        this.postSubmitError = err.error?.message || 'No se pudo enviar el post.';
        this.isSubmittingPost = false;
      }
    });
  }

  autoResizeTextarea(element: any): void {
    element.style.height = 'auto';
    element.style.height = (element.scrollHeight) + 'px';
  }

  resetAndLoadPosts(): void {
    this.posts = [];
    this.currentPage = 0;
    this.totalPages = 0;
    this.hasMorePosts = true;
    this.postsError = null;
    this.loadInitialPosts();
  }

  loadInitialPosts(): void {
    this.isLoadingPosts = true;
    this.postsError = null;
    const pageable: PageableRequest = { page: 0, size: this.pageSize, sort: 'createdAt,desc' };
    this.fetchPosts(pageable);
  }

  loadMorePosts(): void {
    if (!this.hasMorePosts || this.isLoadingPosts) return;
    this.currentPage++;
    this.isLoadingPosts = true;
    const pageable: PageableRequest = { page: this.currentPage, size: this.pageSize, sort: 'createdAt,desc' };
    this.fetchPosts(pageable, true);
  }

  private fetchPosts(pageable: PageableRequest, append: boolean = false): void {
    if (!this.communityId) {
      this.isLoadingPosts = false;
      this.postsError = "ID de comunidad no proporcionado.";
      return;
    }
    this.postService.getCommunityPosts(this.communityId, pageable).subscribe({
      next: (pageData: Page<PostResponse>) => {
        const newPosts = pageData.content.map(p => ({
          ...p,
          uiShowComments: false,
          uiComments: [],
          uiIsLoadingComments: false,
          uiCommentsError: null,
          uiIsSubmittingComment: false,
          uiSubmitCommentError: null
        }));

        if (append) {
          this.posts = [...this.posts, ...newPosts];
        } else {
          this.posts = newPosts;
        }
        this.totalPages = pageData.totalPages;
        this.currentPage = pageData.number;
        this.hasMorePosts = !pageData.last;
        this.isLoadingPosts = false;
      },
      error: (err) => {
        this.postsError = 'No se pudieron cargar los posts.';
        this.isLoadingPosts = false;
      }
    });
  }

  canPost(): boolean {
    return this.currentUserRole === 'LEADER' || this.currentUserRole === 'MEMBER';
  }

  getFullImageUrl(relativePath: string | null | undefined): string {
    const defaultImage = 'assets/images/default-placeholder.png';
    if (!relativePath) return defaultImage;
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) return relativePath;
    const base = this.backendImageUrlBase.endsWith('/') ? this.backendImageUrlBase : this.backendImageUrlBase + '/';
    const path = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    return `${base}${path}`;
  }

  formatPostDate(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) +
      ' ' +
      date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  toggleHighlight(post: PostResponse): void {
    post.isHighlighted = !post.isHighlighted;
  }

  toggleExpand(post: PostResponse): void {
    post.isExpanded = !post.isExpanded;
  }

  playSong(post: PostResponse): void {
    if (!post.song || post.song.id === undefined) {
      return;
    }
    const streamUrl = this.getSongStreamUrl(post.song.id);
    if (!streamUrl) {
      return;
    }
    this.musicService.playSong({
      title: post.song.title || 'Canción Desconocida',
      artist: post.song.artist || 'Artista Desconocido',
      coverImageUrl: this.getFullImageUrl(post.song.coverImageUrl),
      streamUrl: streamUrl
    });
  }

  vote(post: PostResponse, value: number): void {
    if (!post || post.id === undefined) return;
    const newVoteToSend = post.userVote === value ? 0 : value;
    this.postService.voteForPost(post.id, newVoteToSend).subscribe({
      next: (updatedPostData) => {
        post.userVote = updatedPostData.userVote;
        post.voteCount = updatedPostData.voteCount;
      },
      error: (err) => {
        console.error(`Error al votar (valor: ${newVoteToSend}) en post ${post.id}:`, err);
      }
    });
  }

  getSongStreamUrl(songId?: number): string | null {
    if (songId === undefined || songId === null) return null;
    return `${environment.apiUrl}/songs/${songId}/stream`;
  }

  getSelectedSongName(songId: number | null): string {
    if (songId === null || songId === undefined) {
      return '';
    }
    const selectedSong = this.availableSongs.find(song => song.id === songId);
    if (selectedSong) {
      let displayName = selectedSong.title;
      if (selectedSong.artist) {
        displayName += ` - ${selectedSong.artist}`;
      }
      return displayName;
    }
    return 'Canción seleccionada';
  }
}
