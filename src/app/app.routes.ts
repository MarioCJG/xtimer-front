import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { HorasExtraComponent } from './pages/horas-extra/horas-extra.component';
import { AprobacionesComponent } from './pages/aprobaciones/aprobaciones.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' }, //Redireccion a login
    { path: 'login', component: LoginComponent },
    { path: 'registro', component: RegistroComponent }, 
    { path: 'horas-extra', component: HorasExtraComponent, canActivate: [authGuard] },
    { path: 'aprobaciones', component: AprobacionesComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: '' }, //Redireccion si la ruta no existe 
];
