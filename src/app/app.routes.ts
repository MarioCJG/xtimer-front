import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { HorasExtraComponent } from './pages/horas-extra/horas-extra.component';
import { AprobacionesComponent } from './pages/aprobaciones/aprobaciones.component';
import { AdminComponent } from './pages/admin/admin.component';
import { ResumenComponent } from './pages/resumen/resumen.component';
import { authGuard } from './guards/auth.guard';
import { CambioPasswordComponent } from './pages/cambio-password/cambio-password.component';


export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' }, //Redireccion a login
    {
        path: 'cambio-password', component: CambioPasswordComponent, canActivate: [authGuard],
        data: { roles: ['Usuario', 'Administrador'] }
    },
    { path: 'login', component: LoginComponent },
    { path: 'registro', component: RegistroComponent },
    {
        path: 'horas-extra', component: HorasExtraComponent, canActivate: [authGuard],
        data: { roles: ['Usuario', 'Administrador'] }
    },
    {
        path: 'aprobaciones', component: AprobacionesComponent, canActivate: [authGuard],
        data: { roles: ['Administrador'] }
    },
    {
        path: 'admin',
        loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent),
        canActivate: [authGuard],
        data: { roles: ['Administrador'] } // Solo los administradores pueden acceder
    },
    {
        path: 'resumen', component: ResumenComponent, canActivate: [authGuard],
        data: { roles: ['Administrador'] }
    },
    { path: '**', redirectTo: '', pathMatch: 'full' }, //Redireccion si la ruta no existe 
];
