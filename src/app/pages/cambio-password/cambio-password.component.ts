import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Importar CommonModule para usar NgIf

@Component({
  selector: 'app-cambio-password',
  standalone: true,
  templateUrl: './cambio-password.component.html',
  styleUrls: ['./cambio-password.component.css'],
  imports: [FormsModule, CommonModule] // Agregar CommonModule aquí
})
export class CambioPasswordComponent {
  nuevaPassword: string = '';
  confirmarPassword: string = '';
  mensajeError: string = '';
  mensajeExito: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  cambiarPassword() {
    if (this.nuevaPassword !== this.confirmarPassword) {
      this.mensajeError = 'Las contraseñas no coinciden.';
      return;
    }
  
    // Llamar a obtenerUsuario para obtener los datos del usuario
    this.authService.obtenerUsuario().subscribe(
      usuario => {
        console.log('Datos del usuario:', usuario); // Imprimir los datos del usuario en la consola
  
        // Construir el payload con el ID del usuario y la nueva contraseña
        const payload = {
          id_usuario: usuario.id, // Usar el ID del usuario obtenido
          nuevaPassword: this.nuevaPassword
        };
  
        console.log('Payload enviado:', payload);
  
        // Llamar al servicio para cambiar la contraseña
        this.authService.cambiarPassword(payload).subscribe(
          res => {
            console.log('Contraseña cambiada con éxito:', res);
            this.mensajeExito = 'Contraseña cambiada con éxito. Redirigiendo a la página principal...';
            this.router.navigate(['/login']); // Redirigir después de 3 segundos
          },
          err => {
            console.error('Error al cambiar la contraseña:', err);
            this.mensajeError = 'Hubo un error al cambiar la contraseña. Inténtalo nuevamente.';
          }
        );
      },
      err => {
        console.error('Error obteniendo el usuario:', err);
        this.mensajeError = 'No se pudo obtener la información del usuario.';
      }
    );
  }
}