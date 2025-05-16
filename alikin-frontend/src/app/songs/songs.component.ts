import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {environment} from "../../enviroments/enviroment";

@Component({
  selector: 'app-songs',
  templateUrl: './songs.component.html',
  styleUrls: ['./songs.component.scss']
})
export class SongsComponent {
  songForm: FormGroup;
  selectedSongFile?: File;
  selectedCoverFile?: File;
  genres: string[] = ['Rock', 'Pop', 'Jazz', 'Electrónica'];
  isSubmitting = false;
  error: string | null = null;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.songForm = this.fb.group({
      title: ['', Validators.required],
      artist: ['', Validators.required],
      album: [''],
      genre: ['', Validators.required],
      song: [null, Validators.required],
      cover: [null]
    });
  }

  onSongSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedSongFile = input.files[0];
      this.songForm.patchValue({ song: this.selectedSongFile }); // ✅ línea clave
    }
  }

  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.selectedCoverFile = input.files[0];
  }

  onSubmit(): void {
    console.log('🔍 Form status:', this.songForm.status);
    console.log('🔍 Form value:', this.songForm.value);
    if (this.songForm.invalid || !this.selectedSongFile) {
      this.error = 'Por favor completa todos los campos obligatorios.';
      return;
    }

    this.isSubmitting = true;

    const songData = {
      title: this.songForm.value.title,
      artist: this.songForm.value.artist,
      album: this.songForm.value.album || '',
      genres: [this.songForm.value.genre]  // asumiendo un solo género por ahora
    };

    const formData = new FormData();
    formData.append('songData', JSON.stringify(songData)); // 🔥 campo requerido por backend
    formData.append('audioFile', this.selectedSongFile);   // 🔥 debe llamarse así
    if (this.selectedCoverFile) {
      formData.append('coverImage', this.selectedCoverFile); // 🔥 debe coincidir con backend
    }

    this.http.post(`${environment.apiUrl}/songs`, formData).subscribe({
      next: () => {
        this.songForm.reset();
        this.selectedSongFile = undefined;
        this.selectedCoverFile = undefined;
        this.isSubmitting = false;
        this.error = null;
      },
      error: (err) => {
        console.error('Error al subir canción:', err);
        this.isSubmitting = false;
        this.error = 'No se pudo subir la canción.';
      }
    });
  }
}
