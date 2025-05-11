import {Component, OnDestroy, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService

  ) {
    this.loginForm = this.fb.group({
      usernameOrEmail: ['', Validators.required],
      password: ['', Validators.required]
    });
  }


  ngOnInit(): void {
    // Aplicar el fondo directamente desde TypeScript
    document.body.style.backgroundImage = "url('/assets/bgi/bgauth.jpg')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.backgroundColor = "#121212"; // Color de respaldo
  }

  ngOnDestroy(): void {
    // Limpiar los estilos cuando el componente se destruye
    document.body.style.backgroundImage = "";
    document.body.style.backgroundSize = "";
    document.body.style.backgroundPosition = "";
    document.body.style.backgroundRepeat = "";
    document.body.style.backgroundAttachment = "";
    // No restauramos el backgroundColor para evitar flashes
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        localStorage.setItem('accessToken', res.accessToken);
        this.http.get('http://localhost:8080/api/users/me').subscribe({
          next: (user) => {
            localStorage.setItem('user', JSON.stringify(user));
            this.router.navigate(['/']);
          }
        });
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Credenciales inválidas';
      }
    });
  }
}
