import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class
AuthGuard implements CanActivate, CanActivateChild {

  constructor(private router: Router) {}

  private isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      this.router.navigate(['/auth/login']);
      return false;
    }
    return true;
  }

  canActivate(): boolean {
    return this.isAuthenticated();
  }

  canActivateChild(): boolean {
    return this.isAuthenticated();
  }
}
