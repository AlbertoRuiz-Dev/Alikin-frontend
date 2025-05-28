import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import {UserResponse} from "../models/user.model";
import {environment} from "../../enviroments/enviroment";
import {CommunityService} from "../communities/communities.service";
@Component({
  selector: 'app-community-members',
  templateUrl: './community-members.component.html',
  styleUrls: ['./community-members.component.scss']
})
export class CommunityMembersComponent implements OnInit, OnChanges {
  @Input() communityId!: number;
  @Input() currentUserRole: 'LEADER' | 'MEMBER' | 'VISITOR' = 'VISITOR';
  // Podrías pasar el ID del usuario actual para no mostrar "Echar" en sí mismo,
  // o para resaltar al usuario actual en la lista.
  // @Input() currentUserId: number | null = null;

  members: UserResponse[] = [];
  isLoading = false;
  error: string | null = null;

  private readonly backendImageUrlBase = `${environment.mediaUrl}/uploads/`;


  constructor(private communityService: CommunityService) { }

  ngOnInit(): void {
    if (this.communityId) {
      this.loadMembers();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['communityId'] && !changes['communityId'].firstChange && changes['communityId'].currentValue) {
      this.loadMembers();
    }
  }

  loadMembers(): void {
    if(!this.communityId) return;
    this.isLoading = true;
    this.error = null;
    this.communityService.getCommunityMembers(this.communityId).subscribe({
      next: (data) => {
        this.members = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Error al cargar miembros de la comunidad:", err);
        this.error = "No se pudieron cargar los miembros.";
        this.isLoading = false;
      }
    });
  }

  kickMember(memberId: number, memberName: string): void {
    if (!this.canKick(memberId)) return;

    if (confirm(`¿Estás seguro de que quieres echar a "${memberName}" de la comunidad?`)) {
      console.log(`TODO: Implementar lógica para echar al miembro ${memberId}`);
      // Aquí llamarías a un método en CommunityService para echar al miembro.
      // this.communityService.kickCommunityMember(this.communityId, memberId).subscribe({
      //   next: () => {
      //     //this.toastr.success(`"${memberName}" ha sido echado de la comunidad.`);
      //     alert(`"${memberName}" ha sido echado de la comunidad.`);
      //     this.loadMembers(); // Recargar la lista
      //   },
      //   error: (err) => {
      //     //this.toastr.error(`No se pudo echar a "${memberName}".`);
      //     alert(`No se pudo echar a "${memberName}". Error: ${err.error?.message || err.message}`);
      //   }
      // });
    }
  }

  canKick(memberId: number): boolean {
    return this.currentUserRole === 'LEADER'; // Simplificado por ahora
  }

  getFullImageUrl(relativePath: string | null | undefined): string | null {
    if (!relativePath) return null;
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) return relativePath;
    const base = this.backendImageUrlBase.endsWith('/') ? this.backendImageUrlBase : this.backendImageUrlBase + '/';
    const path = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    return `${base}${path}`;
  }

  getMemberInitials(name: string | undefined | null): string {
    if (!name) return '?';
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return '?';
    if (words.length === 1 && words[0].length > 0) {
      return words[0].substring(0, 2).toUpperCase();
    }
    if (words.length > 1 && words[0].length > 0 && words[1]?.length > 0) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    if (words[0].length > 0) {
      return words[0].substring(0,2).toUpperCase();
    }
    return '?';
  }
}
