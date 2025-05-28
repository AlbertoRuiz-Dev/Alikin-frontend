import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http'; // Lo mantengo si loadSongs lo usa directamente
import { PostService } from './post.service';
import { environment } from '../../enviroments/enviroment'; // Ajusta la ruta
import { Router } from '@angular/router';
import { Song } from '../songs/song.model'; // Asumo que tienes este modelo

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PostComponent implements OnInit, OnDestroy {
  @Input() communityId?: number; // Si este componente puede usarse para postear en una comunidad específica
  imagePreviewUrl?: string;

  postForm!: FormGroup;
  songs: Song[] = []; // Tipado más específico
  isLoadingSongs = false;
  isSubmitting = false;
  noSongsAvailable = false;
  selectedImageFile?: File;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient, // Para loadSongs
    private postService: PostService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.postForm = this.fb.group({
      content: ['', Validators.required],
      songId: [''], // Se enviará como string en FormData
      // 'image' ya no es un formControl, manejaremos selectedImageFile directamente
    });

    this.loadSongs();
    // Considera mover la manipulación del estilo del body a un servicio o directiva si se usa en muchos sitios
    document.body.style.backgroundImage = "url('/assets/bgi/bgposts.jpg')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.backgroundColor = "#121212"; // Coincide con $spotify-black
  }

  ngOnDestroy(): void {
    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }
    // Limpiar estilos del body
    document.body.style.backgroundImage = '';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundPosition = '';
    document.body.style.backgroundRepeat = '';
    document.body.style.backgroundAttachment = '';
    document.body.style.backgroundColor = ''; // O volver al color por defecto del layout
  }

  loadSongs(): void {
    this.isLoadingSongs = true;
    this.error = null; // Limpiar error anterior
    // Asume que /songs devuelve Page<Song> o Song[]
    this.http.get<any>(`${environment.apiUrl}/songs`).subscribe({ // Cambia 'any' por Page<Song> o Song[]
      next: (response) => {
        const songsData = response.content || response || []; // Adaptar según la estructura de respuesta
        if (!Array.isArray(songsData)) {
          this.songs = [];
          this.error = 'Formato de canciones inválido.';
          this.noSongsAvailable = true;
        } else {
          this.songs = songsData;
          this.noSongsAvailable = songsData.length === 0;
        }
        this.isLoadingSongs = false;
      },
      error: (err) => {
        console.error('Error loading songs:', err);
        this.noSongsAvailable = true;
        this.isLoadingSongs = false;
        this.error = 'No se pudieron cargar las canciones.';
      }
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImageFile = input.files[0];
      // No necesitamos patchValue para 'image' si no está en el formGroup

      if (this.imagePreviewUrl) {
        URL.revokeObjectURL(this.imagePreviewUrl);
      }
      this.imagePreviewUrl = URL.createObjectURL(this.selectedImageFile);
    } else {
      this.selectedImageFile = undefined;
      if (this.imagePreviewUrl) {
        URL.revokeObjectURL(this.imagePreviewUrl);
        this.imagePreviewUrl = undefined;
      }
    }
  }

  public navigateToHome(): void {
    this.router.navigate(['/']);
  }

  onSubmit(): void {
    if (this.postForm.invalid) {
      this.postForm.markAllAsTouched(); // Para mostrar errores de validación
      this.error = 'Por favor, completa el contenido del post.';
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const formData = new FormData();
    formData.append('content', this.postForm.value.content);

    // Si este PostComponent se usa para un communityId específico (pasado por @Input)
    if (this.communityId) {
      formData.append('communityId', this.communityId.toString());
    }

    if (this.postForm.value.songId) {
      formData.append('songId', this.postForm.value.songId.toString());
    }

    if (this.selectedImageFile) {
      // El backend en PostController (createPostWithImage) espera 'imageFile'
      formData.append('imageFile', this.selectedImageFile, this.selectedImageFile.name);
    }

    // Llamar al método del servicio que espera FormData
    this.postService.createGeneralPostWithFormData(formData).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.postForm.reset();
        this.selectedImageFile = undefined;
        this.imagePreviewUrl = undefined;
        // Redirigir o mostrar mensaje de éxito
        this.router.navigate(['/']); // O a la página del feed, o del post creado
      },
      error: (err) => {
        console.error('Error al crear el post:', err);
        this.isSubmitting = false;
        this.error = err.error?.message || 'No se pudo crear el post. Intenta de nuevo.';
      }
    });
  }
}
