import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, Observable, of, catchError } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Verificar si el usuario está autenticado
    if (!authService.estaAutenticado()) {
        router.navigate(['/login']);
        return of(false); // Retorna un observable con `false`
    }

    // Obtener los roles permitidos para la ruta
    const rolesPermitidos = route.data?.['roles'] as string[];

    // Verificar el rol del usuario
    return authService.obtenerRol().pipe(
        map((rolUsuario) => {

            if (rolesPermitidos && !rolesPermitidos.includes(rolUsuario)) {
                console.log('Redirigiendo a /horas-extra');
                router.navigate(['/horas-extra']);
                return false;
            }
            return true;
        }),
        catchError((error) => {
            console.error('Error al obtener el rol del usuario:', error);
            router.navigate(['/login']);
            return of(false);
        })
    );
};