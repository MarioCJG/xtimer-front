import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css'],
    imports: [NgIf]
})
export class NavbarComponent implements OnInit {
    usuario: string = '';
    esAdmin: boolean = false;
    cargandoUsuario: boolean = true; 

    constructor(private authService: AuthService, private router: Router) { }

    ngOnInit() {
        this.actualizarUsuario();
        this.authService.obtenerUsuario().subscribe(
            usuarioData => {
                this.usuario = `${usuarioData.nombre} ${usuarioData.apellido}`;
                this.esAdmin = usuarioData.rol === 'Administrador';
            },
            error => {
                console.error('Error obteniendo el usuario:', error);
            }
        );
    }

    // Método para verificar si la ruta actual es '/login'
    esLogin(): boolean {
        return this.router.url === '/login';
    }

    logout() {
        this.authService.cerrarSesion();
        this.router.navigate(['/login']);
    }

    linkHorasExtra() {
        this.router.navigate(['/horas-extra']);
    }

    linkAprobaciones() {
        this.router.navigate(['/aprobaciones']);
    }

    linkAdmin() {
        this.router.navigate(['/admin']);
    }

    actualizarUsuario() {
        this.authService.obtenerUsuario().subscribe(
            usuarioData => {
                if (usuarioData) {
                    this.usuario = `${usuarioData.nombre} ${usuarioData.apellido}`;
                    this.esAdmin = usuarioData.rol === 'Administrador';
                } else {
                    this.usuario = 'Invitado';
                    this.esAdmin = false;
                }
                this.cargandoUsuario = false; // Datos cargados
            },
            error => {
                console.error('Error obteniendo el usuario:', error);
                this.cargandoUsuario = false; // Finalizar la carga incluso si hay error
            }
        );
    }

}
