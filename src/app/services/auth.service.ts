import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { UsuariosService } from './usuarios.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:3000/api/auth';

    constructor(private http: HttpClient, private usuariosService: UsuariosService) { }

    login(credentials: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
            catchError(error => {
                console.error('Error en la API de Login:', error);
                return throwError(() => new Error('Error en la autenticación'));
            })
        );
    }

    registro(datos: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/registro`, datos);
    }

    guardarToken(token: string): void {
        localStorage.setItem('token', token);
    }

    obtenerToken(): string | null {
        return localStorage.getItem('token');
    }

    obtenerUsuario(): Observable<any> {
        const token = this.obtenerToken();
        if (!token) return throwError(() => new Error('No hay token disponible'));

        try {
            const payload: any = JSON.parse(atob(token.split('.')[1])); // Decodificar JWT
            const userId = payload.id; // Obtener ID del usuario desde el token
            // console.log('ID del usuario:', userId);
            return this.usuariosService.getUsuarioById(userId).pipe(
                map(usuario => {
                    // console.log('Información del usuario:', usuario);
                    return {
                        nombre: usuario.nombre,
                        apellido: usuario.apellido,
                        rol: usuario.rol,
                        fecha_cambio_password: usuario.fecha_cambio_password,
                        id: userId
                    };
                }),
                catchError(error => {
                    console.error('Error obteniendo usuario:', error);
                    return throwError(() => new Error('No se pudo obtener el usuario'));
                })
            );
        } catch (error) {
            console.error('Error al decodificar token:', error);
            return throwError(() => new Error('Token inválido'));
        }
    }

    obtenerRol(): Observable<string> {
        return this.obtenerUsuario().pipe(
            map(usuario => usuario.rol)
        );
    }

    cerrarSesion(): void {
        localStorage.removeItem('token');
    }

    estaAutenticado(): boolean {
        return !!this.obtenerToken();
    }

    cambiarPassword(data: { id_usuario: number; nuevaPassword: string }) {
        return this.http.post('http://localhost:3000/api/auth/cambiar-password', data);
    }

}
