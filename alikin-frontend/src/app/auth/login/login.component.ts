import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { HttpClient } from '@angular/common/http';
import {environment} from "../../../enviroments/enviroment";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      usernameOrEmail: ['', Validators.required],
      password: ['', Validators.required]
    });

    // Estilo dinámico de fondo
    document.body.style.backgroundImage = "url('/assets/bgi/bgauth.jpg')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.backgroundColor = "#121212";
  }

  ngOnDestroy(): void {
    // Limpiar estilos del body
    document.body.style.backgroundImage = '';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundPosition = '';
    document.body.style.backgroundRepeat = '';
    document.body.style.backgroundAttachment = '';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        localStorage.setItem('accessToken', res.accessToken);

        // Obtener datos del usuario autenticado
        this.http.get(`${environment.apiUrl}/users/me`).subscribe({
          next: (user) => {
            localStorage.setItem('user', JSON.stringify(user));
            this.router.navigate(['/']);
          },
          error: () => {
            this.errorMessage = 'Error al cargar perfil del usuario';
          }
        });
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Credenciales inválidas';
      }
    });
  }
}
