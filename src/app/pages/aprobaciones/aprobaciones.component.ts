import { Component } from '@angular/core';
import { HorasExtraService } from '../../services/horas-extra.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-aprobaciones',
    standalone: true,
    templateUrl: './aprobaciones.component.html',
    styleUrls: ['./aprobaciones.component.css'],
    imports: [CommonModule]
})
export class AprobacionesComponent {
    horasPendientes: any[] = [];
    idAprobador: number = 1; // Aquí debes obtener dinámicamente el ID del usuario autenticado

    resumenHoras: any[] = []; // Inicializar la variable para almacenar el resumen de horas

    constructor(private horasExtraService: HorasExtraService) { }

    ngOnInit() {
        this.cargarHorasPendientes();
        this.cargarResumenHoras(); // Cargar el resumen de horas al iniciar el componente
    }

    cargarResumenHoras() {
        this.horasExtraService.obtenerResumenHoras().subscribe(
            res => {
                // Filtrar las horas con horas_extras > 0
                this.resumenHoras = res.filter(hora => parseFloat(hora.horas_extras) > 0);
                console.log('Horas extras mayores a 0:', this.resumenHoras);
            },
            err => {
                console.error('❌ Error al cargar resumen de horas:', err);
            }
        );
    }
    cargarHorasPendientes() {
        this.horasExtraService.obtenerHorasExtra().subscribe(
            res => {
                this.horasPendientes = res.filter(hora => hora.estado === 'pendiente');
            },
            err => { console.error('❌ Error al cargar horas pendientes:', err); }
        );
    }
    aprobarHoraExtra(id_resumen: number) {
        this.horasExtraService.actualizarAprobacion(id_resumen, 'aprobado').subscribe(
            res => {
                console.log('Hora extra aprobada con éxito:', res);
                this.cargarResumenHoras(); // Recargar los datos después de la actualización
            },
            err => {
                console.error('❌ Error al aprobar la hora extra:', err);
            }
        );
    }

    rechazarHoraExtra(id_resumen: number) {
        this.horasExtraService.actualizarAprobacion(id_resumen, 'rechazado').subscribe(
            res => {
                console.log('Hora extra rechazada con éxito:', res);
                this.cargarResumenHoras(); // Recargar los datos después de la actualización
            },
            err => {
                console.error('❌ Error al rechazar la hora extra:', err);
            }
        );
    }

    actualizarEstadoHoraExtra(id: number, nuevoEstado: string) {
        this.horasExtraService.actualizarEstado(id, nuevoEstado, this.idAprobador).subscribe(
            res => {
                console.log(`✅ Hora extra marcada como ${nuevoEstado}:`, res);
                this.cargarHorasPendientes(); // Recargar lista de horas pendientes
            },
            err => { console.error(`❌ Error al cambiar estado a ${nuevoEstado}:`, err); }
        );
    }




}