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

    constructor(private horasExtraService: HorasExtraService) { }

    ngOnInit() {
        this.cargarHorasPendientes();
    }

    cargarHorasPendientes() {
        this.horasExtraService.obtenerHorasExtra().subscribe(
            res => {
                this.horasPendientes = res.filter(hora => hora.estado === 'pendiente');
            },
            err => { console.error('❌ Error al cargar horas pendientes:', err); }
        );
    }

    aprobarHoraExtra(id: number) {
        const hora = this.horasPendientes.find(h => h.id === id);
        if (hora) {
            this.actualizarEstadoHoraExtra(hora, 'aprobado');
        } else {
            console.error('❌ No se encontró la hora extra para aprobar.');
        }
    }

    rechazarHoraExtra(id: number) {
        const hora = this.horasPendientes.find(h => h.id === id);
        if (hora) {
            this.actualizarEstadoHoraExtra(hora, 'rechazado');
        } else {
            console.error('❌ No se encontró la hora extra para rechazar.');
        }
    }


    actualizarEstadoHoraExtra(hora: any, nuevoEstado: string) {
        const datosActualizados = {
            id: hora.id,
            id_usuario: hora.id_usuario,
            id_proyecto: hora.id_proyecto,
            fecha: hora.fecha,
            hora_inicio: hora.hora_inicio,
            hora_fin: hora.hora_fin,
            total_horas: hora.total_horas,
            descripcion: hora.descripcion,
            estado: nuevoEstado // Solo cambia el estado
        };

        this.horasExtraService.actualizarEstado(datosActualizados).subscribe(
            res => {
                this.cargarHorasPendientes(); // Recargar lista
            },
            err => { console.error(`❌ Error al cambiar estado a ${nuevoEstado}:`, err); }
        );
    }

}
