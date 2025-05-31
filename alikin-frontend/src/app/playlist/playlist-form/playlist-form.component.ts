import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; // FormArray no se usa actualmente aquí
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { PlaylistService } from "../playlist.services"; // Ruta corregida si estaba mal
import { Playlist, PlaylistRequest } from "../models/playlist.model";
import {environment} from "../../../enviroments/enviroment"; //

@Component({
  selector: 'app-playlist-form',
  templateUrl: './playlist-form.component.html',
  styleUrls: ['./playlist-form.component.scss']
})
export class PlaylistFormComponent implements OnInit {
  playlistForm: FormGroup;
  isEditMode = false;
  playlistIdToEdit: number | null = null;
  pageTitle = 'Crear Nueva Playlist';
  errorMessage: string | null = null;
  successMessage: string | null = null;

  selectedCoverImageFile: File | null = null;
  coverImagePreviewUrl: string | ArrayBuffer | null = null;
  mediaUrl = environment.mediaUrl; // Para previsualizar imagen existente

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private playlistService: PlaylistService
  ) {
    this.playlistForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      public: [true, Validators.required], // El control del formulario se llama 'public'
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          this.isEditMode = true;
          this.playlistIdToEdit = +id;
          this.pageTitle = 'Editar Playlist';
          return this.playlistService.getPlaylistById(this.playlistIdToEdit);
        }
        return of(null);
      })
    ).subscribe((playlist: Playlist | null) => {
      if (this.isEditMode && playlist) {
        this.playlistForm.patchValue({
          name: playlist.name,
          description: playlist.description,
          public: playlist.public, // <-- CAMBIADO: Usar playlist.public para rellenar el form control 'public'
        });
        if (playlist.coverImageUrl) {
          // Si coverImageUrl es una ruta relativa como '/uploads/playlist-covers/...'
          this.coverImagePreviewUrl = this.mediaUrl + playlist.coverImageUrl;
          // Si playlist.coverImageUrl ya fuera una URL absoluta, sería:
          // this.coverImagePreviewUrl = playlist.coverImageUrl;
        }
      }
    });
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList && fileList[0]) {
      this.selectedCoverImageFile = fileList[0];
      const reader = new FileReader();
      reader.onload = (e) => this.coverImagePreviewUrl = reader.result;
      reader.readAsDataURL(this.selectedCoverImageFile);
    } else {
      this.selectedCoverImageFile = null;
      // Decide si quieres limpiar la previsualización o restaurar la imagen original si estaba editando
      if (this.isEditMode && this.playlistIdToEdit) {
        // Podrías volver a cargar los datos de la playlist para restaurar la imagen original
        // o manejarlo de otra forma si el usuario deselecciona un archivo.
        // Por ahora, si deselecciona, se limpia. Si había una imagen de servidor,
        // y no sube una nueva, el backend no debería cambiarla.
        this.coverImagePreviewUrl = null; // Limpia previsualización si se deselecciona
        // Si quieres que se muestre la imagen actual del servidor si deselecciona un nuevo archivo:
        // this.playlistService.getPlaylistById(this.playlistIdToEdit).subscribe(p => {
        //   if (p && p.coverImageUrl) this.coverImagePreviewUrl = this.mediaUrl + p.coverImageUrl;
        // });

      } else {
        this.coverImagePreviewUrl = null;
      }
    }
  }

  onSubmit(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.playlistForm.invalid) {
      this.playlistForm.markAllAsTouched();
      this.errorMessage = 'Por favor, corrige los errores en el formulario.';
      return;
    }

    const formData = new FormData();
    const playlistDetails: Partial<PlaylistRequest> = {
      name: this.playlistForm.value.name,
      description: this.playlistForm.value.description,
      public: this.playlistForm.value.public, // <-- CAMBIADO: Enviar 'public' en el JSON
      // songIds: ...
    };
    formData.append('playlistData', new Blob([JSON.stringify(playlistDetails)], { type: 'application/json' }));

    if (this.selectedCoverImageFile) {
      formData.append('coverImageFile', this.selectedCoverImageFile, this.selectedCoverImageFile.name);
    }

    if (this.isEditMode && this.playlistIdToEdit) {
      this.playlistService.updatePlaylist(this.playlistIdToEdit, formData).subscribe({
        next: (updatedPlaylist) => {
          this.successMessage = `Playlist "${updatedPlaylist.name}" actualizada.`;
          setTimeout(() => this.router.navigate(['/playlist', updatedPlaylist.id]), 1500);
        },
        error: (err) => {
          this.errorMessage = 'Error al actualizar la playlist.';
          console.error(err);
        }
      });
    } else {
      this.playlistService.createPlaylist(formData).subscribe({
        next: (newPlaylist) => {
          this.successMessage = `Playlist "${newPlaylist.name}" creada.`;
          this.playlistForm.reset({ public: true });
          this.selectedCoverImageFile = null;
          this.coverImagePreviewUrl = null;
          setTimeout(() => this.router.navigate(['/playlist', newPlaylist.id]), 1500);
        },
        error: (err) => {
          this.errorMessage = 'Error al crear la playlist.';
          console.error(err);
        }
      });
    }
  }

  get name() { return this.playlistForm.get('name'); }
  get description() { return this.playlistForm.get('description'); }
  get publicStatus() { return this.playlistForm.get('public'); }


  cancel(): void {
    if (this.isEditMode && this.playlistIdToEdit) {
      this.router.navigate(['/playlist', this.playlistIdToEdit]);
    } else {
      this.router.navigate(['/playlist']);
    }
  }
}
