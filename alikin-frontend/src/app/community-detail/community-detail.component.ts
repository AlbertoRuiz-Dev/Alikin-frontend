import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
// Asegúrate de que la ruta a tu archivo de modelos y los nombres de las interfaces son correctos.
// Deberías tener una interfaz CommunityRadio definida como:
// export interface CommunityRadio { name: string; streamUrl: string; logoUrl: string | null; }
// Y tu CommunityResponse debería tener: radioPlaylist: CommunityRadio | null;
// y opcionalmente las propiedades planas del servidor si necesitas referenciarlas antes de la transformación:
// radioStationName?: string; radioStreamUrl?: string; radioStationLogoUrl?: string; member?: boolean;
import { CommunityResponse, CommunityRadio } from "../communities/community-response"; // AJUSTA ESTA RUTA E INTERFAZ SEGÚN SEA NECESARIO
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MusicPlayerService } from '../layout/music-player/music-player.service';
import { environment } from "../../enviroments/enviroment";
import { RadioStationSearchResult } from "./RadioStationSearchResult.model";
import { CommunityService } from "../communities/communities.service";

@Component({
  selector: 'app-community-detail',
  templateUrl: './community-detail.component.html',
  styleUrls: ['./community-detail.component.scss']
})
export class CommunityDetailComponent implements OnInit {
  community: CommunityResponse | null = null;
  communityId: number | null = null;
  currentUserRole: 'LEADER' | 'MEMBER' | 'VISITOR' = 'VISITOR';
  isLoading = true;
  error: string | null = null;
  activeSection: string = 'feed';

  private readonly backendImageUrlBase = `${environment.mediaUrl}/uploads`;
  showDeleteModal = false;
  communityNameToDelete = '';

  communitySettingsForm!: FormGroup;
  isSubmittingSettings = false;
  settingsSubmitError: string | null = null;
  settingsSubmitSuccess: string | null = null;
  selectedCommunityImageFile: File | null = null;
  communityImagePreviewUrl: string | ArrayBuffer | null = null;

  radioSearchTerm: string = '';
  radioSearchResults: RadioStationSearchResult[] = [];
  isLoadingRadioSearch: boolean = false;
  selectedRadioStation: { name: string, streamUrl: string, favicon: string | null } | null = null;
  isSavingRadio: boolean = false;
  radioSaveError: string | null = null;
  radioSaveSuccess: string | null = null;

  public get isThisCommunityRadioCurrentlyPlaying(): boolean {
    if (!this.community?.radioPlaylist?.streamUrl || !this.musicService.currentSong) {
      return false;
    }
    return this.musicService.isPlaying &&
      this.musicService.currentSong.streamUrl === this.community.radioPlaylist.streamUrl;
  }


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private communityService: CommunityService,
    private fb: FormBuilder,
    private musicService: MusicPlayerService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.communityId = +idParam;
      this.loadCommunityDetails();
    } else {
      this.error = "ID de comunidad no encontrado en la URL.";
      this.isLoading = false;
    }
    this.initCommunitySettingsForm();
  }

  initCommunitySettingsForm(): void {
    this.communitySettingsForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  populateSettingsForm(): void {
    if (this.community && this.communitySettingsForm) {
      this.communitySettingsForm.patchValue({
        name: this.community.name,
        description: this.community.description
      });
      if (this.community.imageUrl) {
        this.communityImagePreviewUrl = this.getFullImageUrl(this.community.imageUrl);
      } else {
        this.communityImagePreviewUrl = null;
      }
      this.selectedCommunityImageFile = null;
      const imageInput = document.getElementById('communityImageFileEdit') as HTMLInputElement;
      if (imageInput) {
        imageInput.value = '';
      }
    }
  }

  loadCommunityDetails(): void {
    if (!this.communityId) return;
    this.isLoading = true;
    this.error = null;
    this.communityService.getCommunityById(this.communityId).subscribe({
      next: (data: CommunityResponse) => { // data es la respuesta directa del servidor
        // Crear un nuevo objeto para this.community, transformando la info de la radio
        const communityDataWithProcessedRadio: CommunityResponse = {
          ...data, // Copiar todas las propiedades de la respuesta del servidor
          radioPlaylist: null // Inicializar radioPlaylist
        };

        // Si el servidor envía los campos planos de la radio, los usamos para construir radioPlaylist
        // Asegúrate que data.radioStationName, data.radioStreamUrl, data.radioStationLogoUrl
        // son los nombres correctos de las propiedades en la respuesta del servidor.
        if (data.radioStreamUrl && data.radioStationName) {
          communityDataWithProcessedRadio.radioPlaylist = {
            name: data.radioStationName,
            streamUrl: data.radioStreamUrl,
            logoUrl: data.radioStationLogoUrl || null
          };
        }
        this.community = communityDataWithProcessedRadio;

        // Determinar el rol del usuario (usando 'member' como en tu JSON de ejemplo)
        if (data.member) { // 'member' en lugar de 'isMember' según tu JSON
          this.currentUserRole = data.userRole === 'LEADER' ? 'LEADER' : 'MEMBER';
        } else {
          this.currentUserRole = 'VISITOR';
        }

        this.isLoading = false;
        this.populateSettingsForm();
        if (this.activeSection === 'settings' && this.currentUserRole !== 'LEADER') {
          this.setActiveSection('feed');
        }
      },
      error: (err) => {
        this.error = "No se pudo cargar la comunidad. " + (err.error?.message || err.message);
        this.isLoading = false;
      }
    });
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
    if (section === 'settings' && this.community) {
      this.populateSettingsForm();
      this.settingsSubmitError = null;
      this.settingsSubmitSuccess = null;
    }
    if (section === 'radioSettings') {
      this.radioSaveError = null; // Limpiar errores/éxitos al cambiar a la pestaña de radio
      this.radioSaveSuccess = null;
    }
  }

  onCommunityImageSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    this.settingsSubmitError = null;
    this.settingsSubmitSuccess = null;

    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const maxSize = 2 * 1024 * 1024; // 2MB

      if (!allowedTypes.includes(file.type)) {
        this.settingsSubmitError = 'Tipo de archivo no permitido (solo JPG, PNG, GIF).';
        this.clearCommunityImageSelection(false);
        return;
      }
      if (file.size > maxSize) {
        this.settingsSubmitError = 'La imagen es demasiado grande (máx. 2MB).';
        this.clearCommunityImageSelection(false);
        return;
      }
      this.selectedCommunityImageFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.communityImagePreviewUrl = reader.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.clearCommunityImageSelection(true); // Limpiar si no se selecciona archivo
    }
  }

  clearCommunityImageSelection(rePopulateWithCurrent: boolean = true): void {
    this.selectedCommunityImageFile = null;
    if (rePopulateWithCurrent) {
      this.communityImagePreviewUrl = this.community?.imageUrl ? this.getFullImageUrl(this.community.imageUrl) : null;
    } else {
      this.communityImagePreviewUrl = null; // Limpiar vista previa si no se repopula
    }
    const fileInput = document.getElementById('communityImageFileEdit') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ""; // Resetear el input de archivo
    }
  }

  onCommunitySettingsSubmit(): void {
    if (!this.communityId || this.communitySettingsForm.invalid) {
      this.communitySettingsForm.markAllAsTouched();
      this.settingsSubmitError = "Por favor, revisa los campos del formulario.";
      this.settingsSubmitSuccess = null;
      return;
    }
    if (this.currentUserRole !== 'LEADER') {
      this.settingsSubmitError = "No tienes permisos para realizar esta acción.";
      return;
    }
    this.isSubmittingSettings = true;
    this.settingsSubmitError = null;
    this.settingsSubmitSuccess = null;

    const formData = new FormData();
    formData.append('name', this.communitySettingsForm.value.name);
    formData.append('description', this.communitySettingsForm.value.description || '');
    if (this.selectedCommunityImageFile) {
      formData.append('imageFile', this.selectedCommunityImageFile, this.selectedCommunityImageFile.name);
    }
    if (!this.selectedCommunityImageFile && !this.communityImagePreviewUrl && this.community?.imageUrl) {
      formData.append('removeCurrentImage', 'true');
    }

    this.communityService.updateCommunity(this.communityId, formData).subscribe({
      next: (updatedCommunityFromServer: CommunityResponse) => {
        // Preservar la radioPlaylist existente, ya que la API de updateCommunity
        // podría no devolver la información de la radio actualizada de la misma manera.
        const existingRadioPlaylist = this.community?.radioPlaylist ?? null;

        this.community = {
          ...updatedCommunityFromServer,
          radioPlaylist: existingRadioPlaylist // Ahora es CommunityRadio | null
        };

        this.populateSettingsForm();
        this.isSubmittingSettings = false;
        this.settingsSubmitSuccess = "¡Comunidad actualizada con éxito!";
        this.selectedCommunityImageFile = null;
        const imageInput = document.getElementById('communityImageFileEdit') as HTMLInputElement;
        if (imageInput) {
          imageInput.value = '';
        }
      },
      error: (err) => {
        this.settingsSubmitError = err.error?.message || "No se pudo actualizar la comunidad. Inténtalo de nuevo.";
        this.isSubmittingSettings = false;
      }
    });
  }

  toggleCommunityRadioPlayback(): void {
    if (!this.community?.radioPlaylist?.streamUrl) {
      if (this.radioSaveError !== undefined) {
        this.radioSaveError = "No hay URL de stream para la radio de esta comunidad.";
      }
      console.warn("toggleCommunityRadioPlayback: No stream URL available for community radio.");
      return;
    }

    const communityRadioTrack = {
      title: this.community.radioPlaylist.name || 'Radio de la Comunidad',
      artist: this.community.name || 'Comunidad',
      coverImageUrl: this.community.radioPlaylist.logoUrl || this.getFullImageUrl(this.community.imageUrl) || 'assets/images/default-cover.jpg',
      streamUrl: this.community.radioPlaylist.streamUrl
    };

    // Verifica si la radio de la comunidad es la que está actualmente cargada en el servicio de música
    if (this.musicService.currentSong?.streamUrl === communityRadioTrack.streamUrl) {
      // Si es la misma canción, simplemente alterna play/pause
      this.musicService.togglePlayPause();
    } else {
      // Si es una canción diferente o no hay nada cargado, inicia esta radio
      this.musicService.playSong(communityRadioTrack);
    }
    if (this.radioSaveError !== undefined) { // Limpiar error si la acción fue exitosa
      this.radioSaveError = null;
    }
  }

  searchRadioStations(): void {
    if (!this.radioSearchTerm.trim()) {
      this.radioSearchResults = [];
      return;
    }
    this.isLoadingRadioSearch = true;
    this.radioSearchResults = [];
    this.radioSaveError = null;
    this.radioSaveSuccess = null;

    this.communityService.searchRadioStationsAPI(this.radioSearchTerm)
      .subscribe({
        next: (stations) => {
          this.radioSearchResults = stations;
          this.isLoadingRadioSearch = false;
        },
        error: (err) => {
          this.radioSearchResults = [];
          this.isLoadingRadioSearch = false;
          this.radioSaveError = "Error al buscar estaciones. Intenta de nuevo.";
        }
      });
  }

  selectRadioStation(station: RadioStationSearchResult): void {
    this.selectedRadioStation = {
      name: station.name,
      streamUrl: station.streamUrl,
      favicon: station.favicon
    };
  }

  saveCommunityRadio(): void {
    if (!this.selectedRadioStation || !this.communityId || this.currentUserRole !== 'LEADER') {
      this.radioSaveError = "Selecciona una estación y asegúrate de ser líder.";
      return;
    }
    this.isSavingRadio = true;
    this.radioSaveError = null;
    this.radioSaveSuccess = null;

    const stationName = this.selectedRadioStation.name;
    const streamUrl = this.selectedRadioStation.streamUrl;
    const favicon = this.selectedRadioStation.favicon; // Esto será nuestro logoUrl

    this.communityService.setCommunityRadioStation(
      this.communityId,
      stationName,
      streamUrl,
      favicon
    ).subscribe({
      next: (updatedCommunityFromServer: CommunityResponse) => { // Respuesta del servidor
        console.log('Respuesta del backend (updatedCommunityFromServer al guardar radio):', JSON.stringify(updatedCommunityFromServer, null, 2));

        // Crear un nuevo objeto para this.community, combinando datos existentes y actualizados
        // y transformando la info de la radio.
        const communityDataForState: CommunityResponse = {
          ...(this.community || {} as CommunityResponse), // Mantener datos base de this.community si existe
          ...updatedCommunityFromServer, // Sobrescribir con todos los datos de la respuesta
          radioPlaylist: null // Inicializar radioPlaylist para (re)construirla
        };

        // Construimos el objeto radioPlaylist usando los campos planos de la respuesta del servidor
        if (updatedCommunityFromServer.radioStreamUrl && updatedCommunityFromServer.radioStationName) {
          communityDataForState.radioPlaylist = {
            name: updatedCommunityFromServer.radioStationName,
            streamUrl: updatedCommunityFromServer.radioStreamUrl,
            logoUrl: updatedCommunityFromServer.radioStationLogoUrl || null
          };
        }

        this.community = communityDataForState;

        this.isSavingRadio = false;
        this.radioSaveSuccess = `Radio '${stationName}' guardada para la comunidad.`;
        this.selectedRadioStation = null; // Limpiar la selección de radio
      },
      error: (err) => {
        this.radioSaveError = err.error?.message || "No se pudo guardar la radio.";
        this.isSavingRadio = false;
      }
    });
  }

  playCommunityRadio(): void {
    // this.community.radioPlaylist ya debería tener la estructura CommunityRadio | null
    const radioInfo = this.community?.radioPlaylist;

    if (radioInfo && radioInfo.streamUrl) {
      this.musicService.playSong({
        title: radioInfo.name || 'Radio de la Comunidad',
        artist: this.community?.name || 'Comunidad',
        // MusicPlayerService espera 'coverImageUrl', mapeamos 'logoUrl' a 'coverImageUrl'
        coverImageUrl: radioInfo.logoUrl || this.getFullImageUrl(this.community?.imageUrl) || 'assets/images/default-cover.jpg',
        streamUrl: radioInfo.streamUrl
      });
      this.radioSaveError = null; // Limpiar cualquier error previo si la reproducción inicia
    } else {
      console.warn("playCommunityRadio: No hay radio configurada o falta la URL del stream en this.community.radioPlaylist.");
      this.radioSaveError = "No hay radio configurada para reproducir o la información es incorrecta. Por favor, intenta configurar la radio nuevamente.";
      // Considera mostrar un mensaje más visible al usuario si esto ocurre.
    }
  }

  public getFullImageUrl(relativePath: string | null | undefined): string | null {
    if (!relativePath) {
      return null;
    }
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }
    const base = this.backendImageUrlBase.endsWith('/') ? this.backendImageUrlBase.slice(0, -1) : this.backendImageUrlBase;
    const path = relativePath.startsWith('/') ? relativePath : '/' + relativePath;
    return `${base}${path}`;
  }

  public getCommunityInitials(name: string | undefined | null): string {
    if (!name) return '?';
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return '?';
    if (words.length === 1 && words[0].length > 0) {
      return words[0].substring(0, Math.min(2, words[0].length)).toUpperCase();
    }
    if (words.length > 1 && words[0].length > 0 && words[1].length > 0) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    if (words[0].length > 0) { // Fallback para nombres de una palabra si los anteriores no aplican
      return words[0].substring(0, Math.min(2, words[0].length)).toUpperCase();
    }
    return '?';
  }

  public navigateToCommunities(): void {
    this.router.navigate(['/communities']);
  }

  openDeleteConfirmationModal(): void {
    if (this.community) {
      this.communityNameToDelete = this.community.name; // Corregido para que el nombre se pase al modal
      this.showDeleteModal = true;
    }
  }

  closeDeleteConfirmationModal(): void {
    this.showDeleteModal = false;
  }

  confirmCommunityDeletion(enteredName: string): void {
    if (!this.community || !this.community.name) return;

    if (enteredName === this.community.name) {
      this.communityService.deleteCommunity(this.community.id).subscribe({
        next: () => {
          // Considera usar un servicio de notificaciones en lugar de alert
          alert(`Comunidad "${this.community?.name}" eliminada con éxito.`);
          this.showDeleteModal = false;
          this.router.navigate(['/communities']);
        },
        error: (err) => {
          alert(`Error: ${err.error?.message || err.message || 'No se pudo eliminar la comunidad.'}`);
          this.showDeleteModal = false; // Asegurarse de cerrar el modal también en caso de error
        }
      });
    } else {
      alert('El nombre de la comunidad no coincide. Eliminación cancelada.');
      // No cerrar el modal aquí podría ser una opción para permitir reintentos, o cerrarlo, según UX deseada.
      // this.showDeleteModal = false;
    }
  }
}
