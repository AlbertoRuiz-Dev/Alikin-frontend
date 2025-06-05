import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommunityResponse, CommunityRadio } from "../communities/community-response";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MusicPlayerService } from '../layout/music-player/music-player.service';
import { environment } from "../../enviroments/enviroment";
import { RadioStationSearchResult } from "./RadioStationSearchResult.model";
import { CommunityService } from "../communities/communities.service";
// import { AuthService } from '../../auth/auth.service'; // Ejemplo si tuvieras AuthService

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

  private readonly backendImageUrlBase = `${environment.mediaUrl || 'http://localhost:8080'}`;
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

  currentUserIdForFeed: number | null = null; // NUEVA PROPIEDAD

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
    // private authService: AuthService // Si tuvieras AuthService
  ) {}

  ngOnInit(): void {
    // Obtener currentUserId (ejemplo usando localStorage, idealmente AuthService)
    const userFromStorage = localStorage.getItem('currentUser');
    if (userFromStorage) {
      try {
        const parsedUser = JSON.parse(userFromStorage);
        this.currentUserIdForFeed = parsedUser && parsedUser.id ? +parsedUser.id : null;
        if (parsedUser && parsedUser.id && isNaN(+parsedUser.id)) {
          this.currentUserIdForFeed = null;
        }
      } catch (e) {
        this.currentUserIdForFeed = null;
      }
    }

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
      next: (data: CommunityResponse) => {
        const communityDataWithProcessedRadio: CommunityResponse = {
          ...data,
          radioPlaylist: null
        };

        if (data.radioStreamUrl && data.radioStationName) {
          communityDataWithProcessedRadio.radioPlaylist = {
            name: data.radioStationName,
            streamUrl: data.radioStreamUrl,
            logoUrl: data.radioStationLogoUrl || null
          };
        }
        this.community = communityDataWithProcessedRadio;

        if (data.member) {
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
      this.radioSaveError = null;
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
      this.clearCommunityImageSelection(true);
    }
  }

  clearCommunityImageSelection(rePopulateWithCurrent: boolean = true): void {
    this.selectedCommunityImageFile = null;
    if (rePopulateWithCurrent) {
      this.communityImagePreviewUrl = this.community?.imageUrl ? this.getFullImageUrl(this.community.imageUrl) : null;
    } else {
      this.communityImagePreviewUrl = null;
    }
    const fileInput = document.getElementById('communityImageFileEdit') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
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
        const existingRadioPlaylist = this.community?.radioPlaylist ?? null;
        this.community = {
          ...updatedCommunityFromServer,
          radioPlaylist: existingRadioPlaylist
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

    if (this.musicService.currentSong?.streamUrl === communityRadioTrack.streamUrl) {
      this.musicService.togglePlayPause();
    } else {
      this.musicService.playSong(communityRadioTrack);
    }
    if (this.radioSaveError !== undefined) {
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
    const favicon = this.selectedRadioStation.favicon;

    this.communityService.setCommunityRadioStation(
      this.communityId,
      stationName,
      streamUrl,
      favicon
    ).subscribe({
      next: (updatedCommunityFromServer: CommunityResponse) => {
        console.log('Respuesta del backend (updatedCommunityFromServer al guardar radio):', JSON.stringify(updatedCommunityFromServer, null, 2));
        const communityDataForState: CommunityResponse = {
          ...(this.community || {} as CommunityResponse),
          ...updatedCommunityFromServer,
          radioPlaylist: null
        };

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
        this.selectedRadioStation = null;
      },
      error: (err) => {
        this.radioSaveError = err.error?.message || "No se pudo guardar la radio.";
        this.isSavingRadio = false;
      }
    });
  }

  playCommunityRadio(): void {
    const radioInfo = this.community?.radioPlaylist;
    if (radioInfo && radioInfo.streamUrl) {
      this.musicService.playSong({
        title: radioInfo.name || 'Radio de la Comunidad',
        artist: this.community?.name || 'Comunidad',
        coverImageUrl: radioInfo.logoUrl || this.getFullImageUrl(this.community?.imageUrl) || 'assets/images/default-cover.jpg',
        streamUrl: radioInfo.streamUrl
      });
      this.radioSaveError = null;
    } else {
      console.warn("playCommunityRadio: No hay radio configurada o falta la URL del stream en this.community.radioPlaylist.");
      this.radioSaveError = "No hay radio configurada para reproducir o la información es incorrecta. Por favor, intenta configurar la radio nuevamente.";
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
    if (words[0].length > 0) {
      return words[0].substring(0, Math.min(2, words[0].length)).toUpperCase();
    }
    return '?';
  }

  public navigateToCommunities(): void {
    this.router.navigate(['/communities']);
  }

  openDeleteConfirmationModal(): void {
    if (this.community) {
      this.communityNameToDelete = this.community.name;
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
          alert(`Comunidad "${this.community?.name}" eliminada con éxito.`);
          this.showDeleteModal = false;
          this.router.navigate(['/communities']);
        },
        error: (err) => {
          alert(`Error: ${err.error?.message || err.message || 'No se pudo eliminar la comunidad.'}`);
          this.showDeleteModal = false;
        }
      });
    } else {
      alert('El nombre de la comunidad no coincide. Eliminación cancelada.');
    }
  }
}
