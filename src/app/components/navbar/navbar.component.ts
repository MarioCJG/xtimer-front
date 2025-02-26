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

    constructor(private authService: AuthService, private router: Router) { }

    ngOnInit() {
        this.actualizarUsuario();
        this.authService.obtenerUsuario().subscribe(
            usuarioData => {
                this.usuario = `${usuarioData.nombre} ${usuarioData.apellido}`;
                this.esAdmin = usuarioData.rol === 'admin';
            },
            error => {
                console.error('Error obteniendo el usuario:', error);
            }
        );
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

    actualizarUsuario() {
        this.authService.obtenerUsuario().subscribe(
            usuarioData => {
                if (usuarioData) {
                    this.usuario = `${usuarioData.nombre} ${usuarioData.apellido}`;
                    this.esAdmin = usuarioData.rol === 'admin';
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
