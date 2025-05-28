import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommunityService } from "./communities.service";
import { Router } from '@angular/router';
import {CommunityResponse} from "./community-response";
import {ToastrService} from "ngx-toastr";

@Component({
  selector: 'app-communities',
  templateUrl: './communities.component.html',
  styleUrls: ['./communities.component.scss']
})
export class CommunitiesComponent implements OnInit {
  userCommunities: CommunityResponse[] = [];
  allCommunities: CommunityResponse[] = [];
  searchQuery: string = '';
  filteredCommunities: CommunityResponse[] = [];
  showCreateCommunityModal = false;

  private readonly backendImageUrlBase = 'http://localhost:8080/uploads/';

  @ViewChild('allCommunitiesSection') allCommunitiesSection!: ElementRef;

  constructor(
    private communityService: CommunityService,
    private router: Router,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.loadUserCommunities();
    this.loadAllCommunities();
  }

  getFullImageUrl(relativePath: string | null): string | null {
    if (!relativePath) {
      return null;
    }
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }
    const cleanRelativePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    return `${this.backendImageUrlBase}${cleanRelativePath}`;
  }

  loadUserCommunities(): void {
    this.communityService.getUserCommunities().subscribe({
      next: data => {
        this.userCommunities = data;
        this.applySearchAndExclusionFilter();
      },
      error: err => {
        console.error('Error cargando User Communities:', err);
        this.userCommunities = [];
        this.applySearchAndExclusionFilter();
      }
    });
  }

  loadAllCommunities(): void {
    this.communityService.getAllCommunities().subscribe({
      next: data => {
        this.allCommunities = data;
        this.applySearchAndExclusionFilter();
      },
      error: err => {
        console.error('Error cargando All Communities:', err);
        this.allCommunities = [];
        this.applySearchAndExclusionFilter();
      }
    });
  }

  onSearchChange(): void {
    this.applySearchAndExclusionFilter();
  }

  applySearchAndExclusionFilter(): void {
    const query = this.searchQuery.trim().toLowerCase();
    this.filteredCommunities = this.allCommunities.filter(community => {
      const nameMatch = community.name?.toLowerCase().includes(query);
      const descriptionMatch = community.description && community.description.toLowerCase().includes(query);
      return nameMatch || descriptionMatch;
    });
  }

  getFilteredAndNotUserCommunities(): CommunityResponse[] {
    return this.filteredCommunities.filter(community => !this.isUserCommunity(community.id));
  }

  openCreateCommunityModal(): void {
    this.showCreateCommunityModal = true;
  }

  handleCloseModal(): void {
    this.showCreateCommunityModal = false;
  }

  handleCommunityCreated(newCommunity: CommunityResponse): void {
    this.showCreateCommunityModal = false;
    this.loadUserCommunities();
    this.loadAllCommunities();
  }

  createCommunity(): void {
    this.openCreateCommunityModal();
  }

  isUserCommunity(communityId: number): boolean {
    return this.userCommunities.some(c => c.id === communityId);
  }

  getCommunityInitials(name: string): string {
    if (!name) return '?';
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return '?';
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + (words[1] ? words[1][0] : '')).toUpperCase();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.onSearchChange();
  }

  scrollToAllCommunities(): void {
    if (this.allCommunitiesSection && this.allCommunitiesSection.nativeElement) {
      this.allCommunitiesSection.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }
  }


  joinCommunity(communityId: number, event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    const communityToJoin = this.allCommunities.find(c => c.id === communityId);
    const communityName = communityToJoin ? communityToJoin.name : 'la comunidad';

    this.communityService.joinCommunity(communityId).subscribe({
      next: (response) => {
        const successMessage = response?.message || `¡Te has unido a "${communityName}" con éxito!`;
        this.toastr.success(successMessage, '¡Unido!'); // Notificación de éxito

        this.loadUserCommunities();
        this.loadAllCommunities();
      },
      error: (err) => {
        console.error('Error al unirse a la comunidad:', err);
        const backendErrorMessage = err.error?.message || err.error?.error;
        const displayMessage = backendErrorMessage || err.message || 'No se pudo unir a la comunidad.';
        this.toastr.error(displayMessage, 'Error al Unirse'); // Notificación de error
      }
    });
  }
  viewCommunity(communityId: number): void {
    this.router.navigate(['/community', communityId]);
  }
}
