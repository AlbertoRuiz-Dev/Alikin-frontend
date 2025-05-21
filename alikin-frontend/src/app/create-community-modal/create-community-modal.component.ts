import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { CommunityService } from "../communities/communities.service"; // Ajusta la ruta
// Ya no usaremos CommunityRequest directamente para el envío si es FormData, pero los campos son los mismos.
// import { CommunityRequest } from './community-request.model';

// Validador personalizado para tipo de archivo (opcional pero recomendado)
export function fileTypeValidator(allowedTypes: string[]): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const file = control.value as File;
    if (file && file.name) { // Solo valida si hay un archivo
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension && !allowedTypes.map(t => t.toLowerCase()).includes(extension)) {
        return { invalidFileType: { actual: extension, expected: allowedTypes.join(', ') } };
      }
    }
    return null;
  };
}

@Component({
  selector: 'app-create-community-modal',
  templateUrl: './create-community-modal.component.html',
  styleUrls: ['./create-community-modal.component.scss']
})
export class CreateCommunityModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() communityCreated = new EventEmitter<any>();

  createCommunityForm!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  selectedFile: File | null = null;
  imagePreviewUrl: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private communityService: CommunityService
  ) {}

  ngOnInit(): void {
    this.createCommunityForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
      description: ['', [Validators.required]],
      // El control 'imageFile' manejará el archivo, no una URL.
      // Añadimos un validador personalizado para el tipo de archivo.
      imageFile: [null, [fileTypeValidator(['png', 'jpg', 'jpeg', 'gif'])]]
    });
  }

  get name(): AbstractControl | null { return this.createCommunityForm.get('name'); }
  get description(): AbstractControl | null { return this.createCommunityForm.get('description'); }
  get imageFileControl(): AbstractControl | null { return this.createCommunityForm.get('imageFile'); }


  onFileChange(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;

    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      this.selectedFile = file;
      this.imageFileControl?.setValue(file); // Actualiza el valor del control del formulario para validación
      this.imageFileControl?.markAsTouched(); // Para que se muestren errores de validación si es necesario

      // Generar vista previa
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.removeImagePreview();
    }
  }

  removeImagePreview(): void {
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    this.imageFileControl?.setValue(null);
    // Si tienes un input de archivo, puede que necesites resetearlo también:
    // const fileInput = document.getElementById('imageFile') as HTMLInputElement;
    // if (fileInput) fileInput.value = "";
  }

  onSubmit(): void {
    if (this.createCommunityForm.invalid) {
      this.createCommunityForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const formData = new FormData();
    formData.append('name', this.name?.value);
    formData.append('description', this.description?.value);

    if (this.selectedFile) {
      // El backend esperará el archivo bajo un nombre específico, ej: 'imageFile'
      formData.append('imageFile', this.selectedFile, this.selectedFile.name);
    }
    // Si el backend espera que los campos de texto también vengan como un JSON bajo una clave específica
    // junto con el archivo (lo cual es menos común pero posible para @RequestPart),
    // tendrías que ajustar la construcción del FormData.
    // Por ejemplo:
    // const communityData = { name: this.name?.value, description: this.description?.value };
    // formData.append('communityData', new Blob([JSON.stringify(communityData)], { type: 'application/json' }));

    this.communityService.createCommunity(formData).subscribe({
      next: (newCommunity) => {
        this.isSubmitting = false;
        this.communityCreated.emit(newCommunity);
        this.closeModal();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || err.error?.error || err.message || 'Error al crear la comunidad.';
        console.error('Error creating community:', err);
      }
    });
  }

  closeModal(): void {
    this.close.emit();
  }
}
