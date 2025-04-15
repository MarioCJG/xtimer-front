import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { HorasExtraService } from '../../services/horas-extra.service';
import { CommonModule } from '@angular/common';
import { DarkModeService } from '../../services/dark-mode.service';


@Component({
    selector: 'app-aprobaciones',
    standalone: true,
    templateUrl: './aprobaciones.component.html',
    styleUrls: ['./aprobaciones.component.css'],
    encapsulation: ViewEncapsulation.None,
    imports: [CommonModule]
})
export class AprobacionesComponent implements OnInit {
    horasPendientes: any[] = [];
    idAprobador: number = 1; // Aquí debes obtener dinámicamente el ID del usuario autenticado

    resumenHoras: any[] = []; // Inicializar la variable para almacenar el resumen de horas

    detallesHorasExtra: any[] = []; // Variable para almacenar los detalles de horas extra


    constructor(private horasExtraService: HorasExtraService, public darkModeService: DarkModeService) { }

    ngOnInit() {
        this.cargarHorasPendientes();

        this.darkModeService.aplicarModo();
        this.cargarResumenHoras(); // Cargar el resumen de horas al iniciar el componente
    }

    imprimirId(id_resumen: number) {
        console.log('ID Resumen seleccionado:', id_resumen);
        this.horasExtraService.obtenerHorasPorResumen(id_resumen).subscribe(
            res => {
                console.log('Detalles de horas extra:', res);
                // Guardar solo las columnas necesarias en detallesHorasExtra
                this.detallesHorasExtra = res.map((detalle: any) => ({
                    proyecto_completo: detalle.proyecto_completo,
                    hora_inicio: detalle.hora_inicio,
                    hora_fin: detalle.hora_fin
                }));
                console.log('Detalles de horas extra guardados:', this.detallesHorasExtra);
            },
            err => {
                console.error('❌ Error al obtener detalles de horas extra:', err);
            }
        );
    }

    cargarResumenHoras() {
        this.horasExtraService.obtenerResumenHoras().subscribe(
            res => {
                // Filtrar las horas con horas_extras > 0 y aprobacion = 'aprobado'
                this.resumenHoras = res.filter(hora => parseFloat(hora.horas_extras) > 0 && hora.aprobacion != 'aprobado');
                console.log('Horas extras mayores a 0 y con aprobación "aprobado":', this.resumenHoras);
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