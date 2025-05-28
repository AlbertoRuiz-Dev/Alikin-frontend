import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommunityService } from '../communities/communities.service';
import {CommunityResponse} from "../communities/community-response"; // Ajusta la ruta si es necesario

@Component({
  selector: 'app-community-detail',
  templateUrl: './community-detail.component.html',
  styleUrls: ['./community-detail.component.scss'] // Aquí es donde ocurre el error de SCSS
})
export class CommunityDetailComponent implements OnInit {
  community: CommunityResponse | null = null;
  communityId: number | null = null;
  currentUserRole: 'LEADER' | 'MEMBER' | 'VISITOR' = 'VISITOR';
  isLoading = true;
  error: string | null = null;
  activeSection: string = 'feed';

  private readonly backendImageUrlBase = 'http://localhost:8080/uploads/'; // O la URL correcta
  showDeleteModal = false; // Nueva propiedad para el modal de eliminación
  communityNameToDelete = ''; // Para el input de confirmación

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private communityService: CommunityService
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
  }

  loadCommunityDetails(): void {
    if (!this.communityId) return;
    this.isLoading = true;
    this.error = null;
    this.communityService.getCommunityById(this.communityId).subscribe({ // Este método debe existir en CommunityService
      next: (data) => {
        this.community = data;
        if (data.member) {
          this.currentUserRole = data.userRole === 'LEADER' ? 'LEADER' : 'MEMBER';
        } else {
          this.currentUserRole = 'VISITOR';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Error al cargar detalles de la comunidad:", err);
        this.error = "No se pudo cargar la comunidad. " + (err.error?.message || err.message);
        this.isLoading = false;
      }
    });
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  public getFullImageUrl(relativePath: string | null): string | null { // Hazlo público si es necesario
    if (!relativePath) {
      return null;
    }
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }
    const base = this.backendImageUrlBase.endsWith('/') ? this.backendImageUrlBase : this.backendImageUrlBase + '/';
    const path = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    return `${base}${path}`;
  }

  public getCommunityInitials(name: string | undefined | null): string { // Hazlo público
    if (!name) return '?';
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return '?';
    if (words.length === 1 && words[0].length > 0) {
      return words[0].substring(0, 2).toUpperCase();
    }
    if (words.length > 1 && words[0].length > 0 && words[1].length > 0) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    if (words[0].length > 0) {
      return words[0].substring(0,2).toUpperCase();
    }
    return '?';
  }

  // Método público para navegar
  public navigateToCommunities(): void { // Hazlo público
    this.router.navigate(['/communities']);
  }

  openDeleteConfirmationModal(): void {
    if (this.community) { // Solo abre si hay una comunidad cargada
      this.communityNameToDelete = ''; // Resetea el campo de confirmación
      this.showDeleteModal = true;
    }
  }

  closeDeleteConfirmationModal(): void {
    this.showDeleteModal = false;
  }

  confirmCommunityDeletion(enteredName: string): void {
    if (!this.community || !this.community.name) return;

    if (enteredName === this.community.name) {
      // El nombre coincide, proceder a eliminar
      this.communityService.deleteCommunity(this.community.id).subscribe({ // Necesitarás este método en el servicio
        next: () => {
          // this.toastr.success(`Comunidad "${this.community?.name}" eliminada con éxito.`, 'Eliminada'); // Si usas toastr
          alert(`Comunidad "${this.community?.name}" eliminada con éxito.`);
          this.showDeleteModal = false;
          this.router.navigate(['/communities']); // Redirigir a la lista de comunidades
        },
        error: (err) => {
          console.error("Error al eliminar la comunidad:", err);
          // this.toastr.error(err.error?.message || err.message || 'No se pudo eliminar la comunidad.', 'Error');
          alert(`Error: ${err.error?.message || err.message || 'No se pudo eliminar la comunidad.'}`);
          this.showDeleteModal = false; // Cierra el modal incluso si hay error, o maneja el error dentro del modal
        }
      });
    } else {
      // this.toastr.error('El nombre de la comunidad no coincide. Eliminación cancelada.', 'Error de Confirmación');
      alert('El nombre de la comunidad no coincide. Eliminación cancelada.');
      // Podrías querer manejar esto dentro del modal para feedback inmediato
    }
  }

}
