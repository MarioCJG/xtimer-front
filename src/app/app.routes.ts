import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { HorasExtraComponent } from './pages/horas-extra/horas-extra.component';
import { AprobacionesComponent } from './pages/aprobaciones/aprobaciones.component';
import { AdminComponent } from './pages/admin/admin.component';
import { authGuard } from './guards/auth.guard';
import { CambioPasswordComponent } from './pages/cambio-password/cambio-password.component';


export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' }, //Redireccion a login
    { path: 'cambio-password', component: CambioPasswordComponent },
    { path: 'login', component: LoginComponent },
    { path: 'registro', component: RegistroComponent }, 
    { path: 'horas-extra', component: HorasExtraComponent, canActivate: [authGuard] },
    { path: 'aprobaciones', component: AprobacionesComponent, canActivate: [authGuard] },
    { path: 'admin', component: AdminComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: '' }, //Redireccion si la ruta no existe 
];
