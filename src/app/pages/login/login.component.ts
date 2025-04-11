import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-login',
    standalone: true,
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
    imports: [FormsModule, NgIf]
})
export class LoginComponent {
    email = '';
    password = '';
    errorMensaje: string = '';
    usuario: string = '';
    esAdmin: boolean = false;

    constructor(private authService: AuthService, private router: Router) {}

    login() {
        this.errorMensaje = ''; // Limpiar mensajes previos
        this.authService.login({ email: this.email, password: this.password }).subscribe(
            res => {
                this.authService.guardarToken(res.token);
                // this.router.navigate(['/horas-extra']);
                this.actualizarUsuario();
            },
            err => {
                this.errorMensaje = 'Usuario o contraseña incorrectos';
                console.error('Error en el login:', err);
            }
        );
    }

    actualizarUsuario() {
        this.authService.obtenerUsuario().subscribe(
            usuarioData => {
                if (usuarioData) {
                    this.usuario = `${usuarioData.nombre} ${usuarioData.apellido}`;
                    this.esAdmin = usuarioData.rol === 'Administrador';

                    // console.log('Información del usuario:', usuarioData);
    
                    // Redirigir al cambio de contraseña si no tiene fecha de cambio de contraseña
                    if (!usuarioData.fecha_cambio_password) {
                        console.log('El usuario no ha cambiado su contraseña. Redirigiendo a cambio-password...');
                        this.router.navigate(['/cambio-password']);
                    } else {
                        console.log('Fecha de cambio de contraseña:', usuarioData.fecha_cambio_password);
                        this.router.navigate(['/horas-extra']);
                    }
                } else {
                    this.usuario = 'Invitado';
                    this.esAdmin = false;
                }
            },
            error => {
                console.error('Error obteniendo el usuario:', error);
            }
        );
    }
}
