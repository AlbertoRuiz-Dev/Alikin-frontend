import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from "../../core/auth.service";
import {environment} from "../../../enviroments/enviroment";
import {UserService} from "../../profile/user.service";
import {Subscription} from "rxjs";
import {UserProfile} from "../../profile/UserProfile.model";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  username: string = '';
  menuVisible: boolean = false;
  userAvatar: string | null = null;
  private userSubscription: Subscription | undefined; // Para gestionar la suscripción

  constructor(private authService: AuthService, private router: Router, private userService: UserService) {}

  ngOnInit(): void {
    this.userSubscription = this.userService.getCurrentUserProfile().subscribe(
      (userProfile: UserProfile | null | undefined) => {
        if (userProfile) {
          this.username = userProfile.nickname || 'Usuario';

          if (userProfile.profilePictureUrl) {
            const relativePath = userProfile.profilePictureUrl;
            // Comprobar si ya es una URL absoluta
            if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
              this.userAvatar = relativePath;
            } else {
              // Construir la URL completa con environment.mediaUrl
              // Asegura que environment.mediaUrl esté definido y no termine con / si relativePath empieza con /
              const baseUrl = (environment.mediaUrl || '').replace(/\/$/, ''); // Elimina la barra final de baseUrl si existe
              const path = relativePath.replace(/^\//, ''); // Elimina la barra inicial de path si existe
              this.userAvatar = `${baseUrl}/${path}`;
            }
          } else {
            this.userAvatar = null;
          }
        } else {
          this.username = 'Usuario';
          this.userAvatar = null;
        }
      },
      (error) => {
        console.error('Error al obtener el perfil del usuario en navbar:', error);
        this.username = 'Usuario';
        this.userAvatar = null;
      }
    );
  }


  navigateToProfile(): void {
    this.router.navigate(['/me']); // O tu ruta de perfil
    this.closeMenu();
  }


  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  toggleUserMenu(): void {
    this.menuVisible = !this.menuVisible;
  }

  closeMenu(): void {
    this.menuVisible = false;
  }

  getInitials(): string {
    return this.username
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    this.closeMenu();
  }
}
