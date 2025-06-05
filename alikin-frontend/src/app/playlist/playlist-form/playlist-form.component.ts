import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { PlaylistService } from "../playlist.services";
import { Playlist, PlaylistRequest } from "../models/playlist.model"; //
import { environment } from "../../../enviroments/enviroment";

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
  mediaUrl = environment.serverURL;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private playlistService: PlaylistService
  ) {
    this.playlistForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      public: [true, Validators.required], // CORRECTO: El control del formulario se llama 'public'
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
    ).subscribe((playlist: Playlist | null) => { //
      if (this.isEditMode && playlist) {
        this.playlistForm.patchValue({
          name: playlist.name,
          description: playlist.description,
          public: playlist.public, // CORRECTO: Usa playlist.public para rellenar el form control 'public'
        });
        if (playlist.coverImageUrl) {
          this.coverImagePreviewUrl = this.mediaUrl + playlist.coverImageUrl;
        }
      }
    });
  }

  onFileSelected(event: Event): void {
    // ... (lógica de selección de archivo sin cambios relevantes para 'public') ...
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList && fileList[0]) {
      this.selectedCoverImageFile = fileList[0];
      const reader = new FileReader();
      reader.onload = (e) => this.coverImagePreviewUrl = reader.result;
      reader.readAsDataURL(this.selectedCoverImageFile);
    } else {
      this.selectedCoverImageFile = null;
      if (this.isEditMode && this.playlistIdToEdit) {
        // Si se deselecciona un archivo, podríamos querer restaurar la vista previa de la imagen del servidor
        const currentPlaylist = this.playlistForm.value; // Esto no es la playlist original, es el valor del form
        // Para obtener la imagen original, necesitaríamos tenerla guardada
        // o volver a pedirla. Por ahora, simplemente limpiamos.
        // Mejor obtenerla de nuevo si es necesario restaurar la imagen original del servidor
        // o mantener la URL original en una variable separada.
        // this.playlistService.getPlaylistById(this.playlistIdToEdit).subscribe(p => {
        //   if (p && p.coverImageUrl) this.coverImagePreviewUrl = this.mediaUrl + p.coverImageUrl;
        //   else this.coverImagePreviewUrl = null;
        // });
        this.coverImagePreviewUrl = null; // Simplificado: limpiar la preview si se deselecciona
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
    // El tipo PlaylistRequest aquí asume que tiene 'public', no 'isPublic'
    const playlistDetails: Partial<PlaylistRequest> = {
      name: this.playlistForm.value.name,
      description: this.playlistForm.value.description,
      public: this.playlistForm.value.public, // CORRECTO: Toma el valor del form control 'public' y lo asigna a la clave 'public' del JSON
    };
    formData.append('playlistData', new Blob([JSON.stringify(playlistDetails)], { type: 'application/json' }));

    if (this.selectedCoverImageFile) {
      formData.append('coverImageFile', this.selectedCoverImageFile, this.selectedCoverImageFile.name);
    }

    // Lógica de submit (create/update)
    if (this.isEditMode && this.playlistIdToEdit) {
      this.playlistService.updatePlaylist(this.playlistIdToEdit, formData).subscribe({
        next: (updatedPlaylist) => {
          this.successMessage = `Playlist "${updatedPlaylist.name}" actualizada.`;
          // Navega a la ruta base /playlist y luego al ID
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
          setTimeout(() => this.router.navigate(['/playlist', newPlaylist.id]), 1500); //
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
      this.router.navigate(['/playlist', this.playlistIdToEdit]); //
    } else {
      this.router.navigate(['/playlist']); //
    }
  }
}
