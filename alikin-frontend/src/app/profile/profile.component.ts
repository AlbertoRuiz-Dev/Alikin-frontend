import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {Subject, Observable, of, throwError} from 'rxjs';
import { takeUntil, finalize, switchMap, catchError, tap } from 'rxjs/operators';
import { AuthService } from '../core/auth.service';
import { UserService } from './user.service';

import { ToastrService } from 'ngx-toastr';
import {environment} from "../../enviroments/enviroment";
import {UserProfile, UserProfileUpdate} from "./UserProfile.model";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  currentUser: UserProfile | null = null;
  profileForm!: FormGroup;
  isLoading = true;
  isEditing = false;
  isSubmitting = false;
  submitError: string | null = null;

  selectedProfileImageFile: File | null = null;
  profileImagePreviewUrl: string | ArrayBuffer | null = null;
  private _imageMarkedForRemoval = false;

  private readonly backendImageUrlBase = environment.mediaUrl || '';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initProfileForm();
    this.loadUserData();
  }

  initProfileForm(): void {
    this.profileForm = this.fb.group({
      nickname: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      name: ['', [Validators.maxLength(100)]],
      lastName: ['', [Validators.maxLength(100)]],
      phoneNumber: ['', [Validators.pattern(/^\+?[0-9\s\-()]{7,15}$/)]],
      birthDate: [null],
      bio: ['', [Validators.maxLength(1000)]]
    });
    this.profileForm.disable();
  }

  loadUserData(): void {
    this.isLoading = true;
    this.submitError = null;
    this.userService.getCurrentUserProfile()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (user) => {
          if (user) {
            this.currentUser = user;
            this.updateFormValues(user);
            this.profileImagePreviewUrl = this.getFullImageUrl(user.profilePictureUrl);
            this._imageMarkedForRemoval = false;
            this.selectedProfileImageFile = null;
          } else {
            this.submitError = 'No se pudieron cargar los datos del perfil. Usuario no encontrado.';
            this.toastr.error(this.submitError, 'Error');
          }
        },
        error: (err) => {
          console.error('Error al cargar datos del perfil:', err);
          this.submitError = err.message || 'No se pudieron cargar los datos de tu perfil.';
          this.toastr.error(this.submitError ?? 'Ocurrió un error al cargar el perfil.', 'Error de Carga');        }
      });
  }

  updateFormValues(user: UserProfile): void {
    this.profileForm.patchValue({
      nickname: user.nickname,
      name: user.name || '',
      lastName: user.lastName || '',
      phoneNumber: user.phoneNumber || '',
      birthDate: user.birthDate ? this.formatDateForInput(user.birthDate) : null,
      bio: user.bio || ''
    });
  }

  formatDateForInput(date: string | Date | null): string | null {
    if (!date) return null;
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return null;
      const year = d.getFullYear();
      const month = ('0' + (d.getMonth() + 1)).slice(-2);
      const day = ('0' + d.getDate()).slice(-2);
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error("Error formateando fecha: ", date, e);
      return null;
    }
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    this.submitError = null;
    this._imageMarkedForRemoval = false;
    this.selectedProfileImageFile = null;

    if (this.isEditing) {
      this.profileForm.enable();
      if (this.currentUser) this.updateFormValues(this.currentUser);
      this.profileImagePreviewUrl = this.currentUser ? this.getFullImageUrl(this.currentUser.profilePictureUrl) : this.getDefaultProfileImage();
    } else {
      this.profileForm.disable();
      if (this.currentUser) this.updateFormValues(this.currentUser);
      this.profileImagePreviewUrl = this.currentUser ? this.getFullImageUrl(this.currentUser.profilePictureUrl) : this.getDefaultProfileImage();
    }
    this.cdr.detectChanges();
  }

  onProfileImageSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    this.submitError = null;

    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const maxSize = 2 * 1024 * 1024; // 2MB

      if (!allowedTypes.includes(file.type)) {
        this.toastr.error('Tipo de archivo no permitido (solo JPG, PNG, GIF).', 'Error de Archivo');
        this.clearFileInput();
        return;
      }
      if (file.size > maxSize) {
        this.toastr.error('La imagen es demasiado grande (máx. 2MB).', 'Error de Archivo');
        this.clearFileInput();
        return;
      }
      this.selectedProfileImageFile = file;
      this._imageMarkedForRemoval = false; // Si selecciona una nueva, no está marcada para borrado
      const reader = new FileReader();
      reader.onload = () => {
        this.profileImagePreviewUrl = reader.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  clearFileInput(): void {
    const fileInput = document.getElementById('profileImageFileEdit') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  }

  removeProfileImage(): void {
    this.selectedProfileImageFile = null;
    this.profileImagePreviewUrl = this.getDefaultProfileImage();
    this._imageMarkedForRemoval = true; // Marcar para borrado
    this.clearFileInput();
    this.cdr.detectChanges();
  }

  onSaveChanges(): void {
    if (!this.currentUser || !this.currentUser.id) {
      this.toastr.error('No hay datos de usuario para actualizar o falta el ID.', 'Error');
      return;
    }
    if (this.profileForm.invalid) {
      this.toastr.error('Por favor, revisa los campos del formulario. Hay errores.', 'Datos Inválidos');
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitError = null;

    let imageOperation$: Observable<UserProfile | { profilePictureUrl: string } | null> = of(null);

    if (this.selectedProfileImageFile) {
      imageOperation$ = this.userService.uploadProfilePicture(this.currentUser.id, this.selectedProfileImageFile).pipe(
        tap(response => {
          // Actualizar la URL de la imagen en currentUser si la subida es exitosa y devuelve la URL
          if (this.currentUser && response.profilePictureUrl) {
            this.currentUser.profilePictureUrl = response.profilePictureUrl;
          }
        }),
        catchError(err => {
          this.toastr.error(err.message || 'Error al subir la nueva imagen de perfil.', 'Error de Imagen');
          this.isSubmitting = false; // Detener si la imagen falla
          this.cdr.detectChanges();
          return throwError(() => err); // Propagar el error para detener el flujo
        })
      );
    } else if (this._imageMarkedForRemoval && this.currentUser.profilePictureUrl) {
      imageOperation$ = this.userService.removeProfilePicture(this.currentUser.id).pipe(
        tap(updatedUser => {
          if (this.currentUser) {
            this.currentUser.profilePictureUrl = null; // O la URL por defecto que devuelva el backend
          }
        }),
        catchError(err => {
          this.toastr.error(err.message || 'Error al eliminar la imagen de perfil.', 'Error de Imagen');
          // Considerar si continuar con la actualización de datos o detenerse
          // this.isSubmitting = false; this.cdr.detectChanges(); return throwError(() => err);
          return of(null); // Continuar con la actualización de datos aunque esto falle
        })
      );
    }

    imageOperation$.pipe(
      switchMap(() => { // Ejecutar después de la operación de imagen (si la hubo)
        const profileUpdateData: UserProfileUpdate = {
          nickname: this.profileForm.value.nickname,
          name: this.profileForm.value.name || null,
          lastName: this.profileForm.value.lastName || null,
          phoneNumber: this.profileForm.value.phoneNumber || null,
          birthDate: this.profileForm.value.birthDate ? this.formatDateForInput(this.profileForm.value.birthDate) : null,
          bio: this.profileForm.value.bio || null,
          // No enviamos removeProfilePicture aquí, ya se manejó con su propia llamada si es necesario
        };
        if (this.currentUser && this.currentUser.id){
          return this.userService.updateUserProfileData(this.currentUser.id, profileUpdateData);
        } else {
          return throwError(() => new Error('ID de usuario no disponible para actualizar datos.'));
        }

      }),
      takeUntil(this.destroy$),
      finalize(() => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (finalUpdatedUser) => {
        // finalUpdatedUser será el resultado de updateUserProfileData
        // Si la operación de imagen actualizó currentUser, usamos ese.
        this.currentUser = finalUpdatedUser ? finalUpdatedUser : this.currentUser; // Actualizar con la respuesta más reciente

        if (this.currentUser) {
          this.updateFormValues(this.currentUser);
          this.profileImagePreviewUrl = this.getFullImageUrl(this.currentUser.profilePictureUrl);
        }

        this.selectedProfileImageFile = null;
        this._imageMarkedForRemoval = false;
        this.toastr.success('Perfil actualizado correctamente.', '¡Éxito!');
        this.isEditing = false;
        this.profileForm.disable();
      },
      error: (err) => {
        console.error('Error en el proceso de guardar cambios:', err);
        const message = err.message || 'No se pudo actualizar el perfil.';
        this.submitError = message;
        this.toastr.error(message, 'Error de Actualización');
      }
    });
  }

  onDeleteAccount(): void {
    if (confirm('¿ESTÁS ABSOLUTAMENTE SEGURO de que quieres eliminar tu cuenta? Esta acción es irreversible y todos tus datos (incluyendo posts, comentarios, etc.) se perderán permanentemente.')) {
      if (confirm('CONFIRMACIÓN FINAL E IRREVOCABLE: ¿Realmente deseas eliminar tu cuenta de forma permanente? No habrá vuelta atrás.')) {
        if (!this.currentUser || !this.currentUser.id) {
          this.toastr.error("No se pudo identificar al usuario para eliminar la cuenta.", "Error");
          return;
        }
        this.isSubmitting = true;
        this.userService.deleteCurrentUserAccount(this.currentUser.id)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
              this.isSubmitting = false;
              this.cdr.detectChanges();
            })
          )
          .subscribe({
            next: () => {
              this.toastr.success('Tu cuenta ha sido eliminada permanentemente.', 'Cuenta Eliminada');
              this.authService.logout();
              // this.router.navigate(['/auth/login']); Idealmente el logout ya redirige
            },
            error: (err) => {
              console.error('Error al eliminar la cuenta:', err);
              this.toastr.error(err.message || 'No se pudo eliminar tu cuenta.', 'Error al Eliminar Cuenta');
            }
          });
      }
    }
  }

  getFullImageUrl(relativePath: string | null | undefined): string {
    const defaultImage = this.getDefaultProfileImage();
    if (!relativePath) {
      return defaultImage;
    }
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }
    // Ajusta esto según cómo tu backend y FileStorageService construyan las URLs
    return `${this.backendImageUrlBase}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
  }

  getDefaultProfileImage(): string {
    return 'assets/images/default-profile.jpg'; // Asegúrate que esta ruta es correcta
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
